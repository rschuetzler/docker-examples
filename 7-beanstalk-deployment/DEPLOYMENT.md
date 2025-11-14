# Deploying to AWS Elastic Beanstalk with Docker Compose

This directory contains a production-ready setup for deploying the Node.js guestbook application to AWS Elastic Beanstalk using Docker Compose with an RDS PostgreSQL database.

## Architecture

### Production (Elastic Beanstalk)
- **Node.js App**: Express application running on port 3000
- **Nginx**: Reverse proxy with health monitoring for AWS
- **RDS PostgreSQL**: Managed database service (configured separately in AWS)

### Local Development
- **Node.js App**: Express application with hot reload (nodemon)
- **PostgreSQL**: Local database container
- **No Nginx**: App exposed directly on port 3000

## File Structure

```
7-beanstalk-deployment/
├── docker-compose.yml           # Production config for Elastic Beanstalk
├── docker-compose.dev.yml       # Local development overrides
├── .platform/
│   └── hooks/
│       └── postdeploy/
│           └── setup_nginx_logs.sh  # Sets up healthd logs directory
├── app/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── nginx/
│   └── nginx.conf              # Production nginx with healthd logging
├── .ebignore                   # Files to exclude from EB deployment
└── .env.example                # Environment variable template
```

## Local Development

### Prerequisites
- Docker and Docker Compose installed
- No AWS account needed for local development

### Running Locally

Use the development compose file to run with a local database:

```bash
# Start all services (postgres + app, no nginx)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run in detached mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and remove volumes (fresh database)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

The application will be available at http://localhost:3000

### What's Different in Development?

The `docker-compose.dev.yml` file overrides the production config:

1. **Local PostgreSQL**: Runs postgres:16-alpine container instead of using RDS
2. **No Nginx**: App is exposed directly on port 3000
3. **Hot Reload**: Uses `npm run dev` with nodemon for automatic restarts
4. **Volume Mounts**: Source code is mounted for instant changes
5. **Local Environment**: Database credentials are hardcoded for convenience

## Deploying to AWS Elastic Beanstalk

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **EB CLI** installed: `pip install awsebcli`
3. **Docker** installed locally for testing

### Step 1: Initialize Elastic Beanstalk Application

From this directory:

```bash
# Initialize EB application
eb init -p docker guestbook-app --region us-east-1

# Select or create SSH keypair when prompted
```

### Step 2: Create RDS Database

You can create an RDS instance through the EB environment or separately:

#### Option A: Through EB Environment (simpler, but couples DB to environment)

```bash
# This will be configured during eb create
eb create guestbook-prod --database
```

When prompted, provide:
- Database engine: postgres
- Engine version: 16.x
- Instance class: db.t3.micro (or your preferred size)
- Master username: postgres
- Master password: [secure password]

#### Option B: Separate RDS Instance (recommended for production)

1. Create RDS instance through AWS Console or CLI
2. Configure security groups to allow access from EB environment
3. Set environment variables in EB (see Step 4)

### Step 3: Create Elastic Beanstalk Environment

If you didn't use `--database` flag above:

```bash
eb create guestbook-prod
```

This will:
- Create an Elastic Beanstalk environment
- Deploy your Docker Compose application
- Set up load balancer and auto-scaling
- Configure health monitoring

### Step 4: Configure Environment Variables

Set the RDS connection details (if using separate RDS instance):

```bash
eb setenv \
  RDS_HOSTNAME=your-db-instance.region.rds.amazonaws.com \
  RDS_PORT=5432 \
  RDS_DB_NAME=guestbook \
  RDS_USERNAME=postgres \
  RDS_PASSWORD=your-secure-password
```

**Note**: If you created RDS through the EB environment, these variables are automatically set.

### Step 5: Deploy

```bash
# Deploy the application
eb deploy

# Open the application in your browser
eb open

# Check status
eb status

# View logs
eb logs

# SSH into an instance
eb ssh
```

### Step 6: Configure Health Reporting (Optional)

The nginx configuration includes enhanced health monitoring. To enable it:

1. Go to AWS Console → Elastic Beanstalk → Your Environment
2. Configuration → Monitoring
3. Enable Enhanced Health Reporting
4. Elastic Beanstalk will now collect detailed metrics from nginx logs

## Understanding the Production Setup

### docker-compose.yml (Production)

```yaml
services:
  app:
    build: ./app
    command: npm start  # Production mode
    environment:
      # RDS variables from Elastic Beanstalk
      DB_HOST: ${RDS_HOSTNAME}
      DB_PORT: ${RDS_PORT}
      DB_NAME: ${RDS_DB_NAME}
      DB_USER: ${RDS_USERNAME}
      DB_PASSWORD: ${RDS_PASSWORD}
    # No volume mounts - uses built image

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /var/log/nginx/healthd:/var/log/nginx/healthd
    depends_on:
      - app
```

### Nginx Health Logging

The nginx configuration includes a special log format for Elastic Beanstalk:

```nginx
log_format healthd '$msec"$uri"'
                   '$status"$request_time"$upstream_response_time"'
                   '$http_x_forwarded_for';

access_log /var/log/nginx/healthd/application.log.$year-$month-$day-$hour healthd;
```

This enables AWS to:
- Track response times
- Monitor error rates
- Detect application health issues
- Provide detailed dashboards

### Platform Hooks

The `.platform/hooks/postdeploy/setup_nginx_logs.sh` script runs after each deployment to ensure the healthd logs directory has proper permissions.

## Environment Variables

### Production (Elastic Beanstalk)

These are automatically provided when you configure RDS with your EB environment:

- `RDS_HOSTNAME`: Database endpoint
- `RDS_PORT`: Database port (usually 5432)
- `RDS_DB_NAME`: Database name
- `RDS_USERNAME`: Database user
- `RDS_PASSWORD`: Database password

### Development (Local)

Defined in `docker-compose.dev.yml`:

- `DB_HOST`: db (Docker service name)
- `DB_PORT`: 5432
- `DB_NAME`: guestbook
- `DB_USER`: postgres
- `DB_PASSWORD`: postgres

## Troubleshooting

### Local Development Issues

**Port already in use**:
```bash
# Check what's using port 3000 or 5432
lsof -i :3000
lsof -i :5432

# Stop the conflicting service or change the port in docker-compose.dev.yml
```

**Database connection errors**:
```bash
# Ensure database is healthy
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Check logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs db
```

**Changes not reflecting**:
```bash
# Rebuild the image
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Elastic Beanstalk Issues

**Deployment fails**:
```bash
# Check detailed logs
eb logs

# View recent events
eb events

# Check health
eb health
```

**Application not connecting to RDS**:
```bash
# Verify environment variables are set
eb printenv

# Ensure security groups allow connection from EB to RDS
# Check in AWS Console: EC2 → Security Groups
```

**Health check failing**:
- Verify `/health` endpoint is responding
- Check nginx logs: `eb logs`
- Ensure application starts successfully

## Updating the Application

### Local Changes

```bash
# Make your changes to code
# Restart to see changes (with hot reload, usually automatic)
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart app
```

### Production Deployment

```bash
# Make your changes
# Commit to git (EB deploys from working directory)
git add .
git commit -m "Your changes"

# Deploy to Elastic Beanstalk
eb deploy

# Monitor deployment
eb events -f
```

## Scaling

Elastic Beanstalk can automatically scale your application:

```bash
# Configure auto-scaling
eb scale 2  # Run 2 instances

# Or configure through console with custom triggers
```

## Costs

Be aware of AWS costs:
- **EB Environment**: t2.micro (free tier eligible)
- **RDS Instance**: db.t3.micro (~$15/month, not free tier)
- **Load Balancer**: ~$16/month
- **Data Transfer**: Variable

Remember to terminate resources when done testing:

```bash
eb terminate guestbook-prod
```

## Security Best Practices

1. **Use Secrets Manager**: For production, store RDS credentials in AWS Secrets Manager
2. **Enable SSL**: Configure HTTPS through EB load balancer
3. **Rotate Passwords**: Regularly update RDS credentials
4. **Security Groups**: Restrict RDS access to EB security group only
5. **IAM Roles**: Use minimal required permissions

## What's Next?

- Set up CI/CD pipeline with GitHub Actions or AWS CodePipeline
- Add Redis for session storage and caching
- Configure CloudWatch alerts for errors
- Set up database backups and point-in-time recovery
- Add CloudFront CDN for static assets
- Implement blue-green deployments

## Additional Resources

- [AWS Elastic Beanstalk Docker Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/docker-compose-quickstart.html)
- [EB CLI Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
