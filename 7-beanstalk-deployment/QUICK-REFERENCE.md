# Quick Reference

## Local Development Commands

### Using Make (Recommended)

```bash
make dev-up          # Start dev environment
make dev-up-d        # Start in background
make dev-down        # Stop dev environment
make dev-logs        # Follow logs
make dev-rebuild     # Rebuild and start
make dev-clean       # Stop and remove volumes
```

### Using Docker Compose Directly

```bash
# Start
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Rebuild
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Fresh start (removes database)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

## Elastic Beanstalk Commands

### Initial Setup

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init -p docker guestbook-app --region us-east-1

# Create environment with RDS
eb create guestbook-prod --database

# Create environment without RDS (configure separately)
eb create guestbook-prod
```

### Deployment

```bash
# Deploy application
eb deploy

# Deploy with custom environment
eb deploy guestbook-prod

# Open in browser
eb open

# View status
eb status

# View recent events
eb events

# Follow events in real-time
eb events -f
```

### Environment Management

```bash
# List environments
eb list

# Set environment variables
eb setenv KEY1=value1 KEY2=value2

# Print environment variables
eb printenv

# Scale instances
eb scale 2

# SSH into instance
eb ssh

# View logs
eb logs

# Stream logs
eb logs --stream
```

### Configuration

```bash
# Open configuration in editor
eb config

# Save current configuration
eb config save

# View health
eb health

# Terminate environment
eb terminate guestbook-prod
```

## Accessing the Application

### Local Development
- **Application**: http://localhost:3000
- **Database**: localhost:5432
  - User: postgres
  - Password: postgres
  - Database: guestbook

### Production (Elastic Beanstalk)
- **Application**: Use `eb open` or check AWS Console for URL
- **Database**: RDS endpoint (automatic via environment variables)

## Common Troubleshooting

### Local Issues

```bash
# Check running containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# View specific service logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs db
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs app

# Exec into container
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec app sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec db psql -U postgres -d guestbook

# Rebuild without cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
```

### Elastic Beanstalk Issues

```bash
# Check detailed logs
eb logs

# Check recent events
eb events

# Check health status
eb health

# View environment info
eb status

# Print environment variables
eb printenv

# SSH to debug
eb ssh
```

## Environment Variables

### Production (Set in Elastic Beanstalk)

```bash
eb setenv \
  RDS_HOSTNAME=your-db.region.rds.amazonaws.com \
  RDS_PORT=5432 \
  RDS_DB_NAME=guestbook \
  RDS_USERNAME=postgres \
  RDS_PASSWORD=your-secure-password
```

### Development (Defined in docker-compose.dev.yml)

Already configured - no action needed!

## File Overview

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production configuration for Elastic Beanstalk |
| `docker-compose.dev.yml` | Development overrides |
| `Makefile` | Convenient command shortcuts |
| `.ebignore` | Files excluded from EB deployment |
| `.gitignore` | Files excluded from git |
| `.env.example` | Environment variable template |
| `.platform/hooks/postdeploy/` | Platform hooks for Elastic Beanstalk |
| `nginx/nginx.conf` | Production nginx with health logging |
| `app/Dockerfile` | Node.js application container |
| `app/server.js` | Express application |

## Quick Architecture Reference

### Local Development
```
Browser → localhost:3000 → Node.js App → PostgreSQL Container
```

### Production (Elastic Beanstalk)
```
Internet → Load Balancer → Nginx Container → Node.js Container → RDS PostgreSQL
                              ↓
                        Health Logs → CloudWatch
```

## Next Steps After Setup

1. **Test locally**: `make dev-up`
2. **Make changes**: Edit code, see changes automatically
3. **Deploy to AWS**: `eb deploy`
4. **Monitor**: `eb logs` or AWS Console
5. **Scale**: `eb scale N`
6. **Clean up**: `eb terminate environment-name`

## Support

- Full documentation: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Tutorial: See [README.md](./README.md)
- AWS Docs: https://docs.aws.amazon.com/elasticbeanstalk/
