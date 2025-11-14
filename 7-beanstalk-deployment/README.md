# Deploying Docker Applications to AWS Elastic Beanstalk

This tutorial demonstrates how to deploy a multi-container Docker application to AWS Elastic Beanstalk while maintaining a smooth local development experience.

## What You'll Learn

- How to create separate Docker Compose configurations for production and development
- Deploying Docker Compose applications to AWS Elastic Beanstalk
- Integrating with AWS RDS for managed PostgreSQL
- Configuring Nginx with Elastic Beanstalk health monitoring
- Managing environment-specific configurations without duplicating code

## The Challenge

When deploying Docker applications to production, you often need:
- Production: Managed database (RDS), reverse proxy with health monitoring, production-optimized settings
- Development: Local database, direct app access, hot reload, mounted volumes

Docker compose gives us options for handling that, and which option works best depends on your circumstances. A few options are:
- Separate docker compose files for development and production environments (specify the file with the `-f` flag)
- Overriding settings by loading a second docker-compose file (specifying multiple files with multiple `-f` flags)

Both options work basically the same - different settings for different environments, and you choose which settings to run depending where you are. In this tutorial we'll use the second - overriding settings with a second docker-compose file.


## Using multiple config files

We can specify multiple configuration files for overriding with the `-f` flag as follows. Note that order does matter - the first file is read first, and then duplicate settings in the second file are used to override the first.

```bash
# Using docker compose with multiple compose files
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Visit http://localhost:3000 to see your app!

## What's happening

You can see from the command (and in your files) that we have two docker-compose files.
One is `docker-compose.yml`, and the other is `docker-compose.dev.yml`. If you look in the docker-compose.yml, you'll see that there are only two services specified - app (our NodeJS app) and nginx (our reverse proxy).
This setup is exactly what we need to run our containers on Elastic Beanstalk (when there's a production database ready for it). But it's not enough to run our application locally - we need a database service to connect to on our computers.
In addition, the `RDS_...` environment variables are for use on AWS, but won't be useful on our local machine.

To solve this, we can create a second configuration file to use in our development environment. This second file (`docker-compose.dev.yml`) is added to the configuration in the first file, and any duplicated settings are overwritten. For example, to run the app in production, we have

```
  command: npm start
```

and to run the app in development, we have

```
  command: npm run dev
```

Also, in production we don't expose ports on the app, since the reverse proxy manages access, but in dev, we want those ports open. Compare the two files to see what other settings are overwritten by the `docker-compose.dev.yml` file.

## Deployment
We won't go in depth on actual deployment here, but with this project, you could zip up these files and upload them to an Elastic Beanstalk Docker environment and have a working application.

## Key Features

### 1. Environment-Specific Configuration

**Production** (Elastic Beanstalk):
- Uses RDS PostgreSQL (managed service)
- Nginx reverse proxy with health monitoring
- Production command (`npm start`)
- No volume mounts (immutable containers)

**Development** (Local):
- Local PostgreSQL container
- No reverse proxy (direct access on port 3000)
- Hot reload with nodemon (`npm run dev`)
- Source code mounted for instant changes


### Important Files

**`docker-compose.yml`**: Production configuration used by Elastic Beanstalk. Assumes RDS database and includes nginx with health monitoring.

**`docker-compose.dev.yml`**: Development overrides that add a local database, remove nginx, enable hot reload, and expose the app directly.

**`.platform/hooks/postdeploy/setup_nginx_logs.sh`**: Platform hook that runs after each deployment to ensure nginx can write healthd logs.

**`.ebignore`**: Prevents unnecessary files (like `docker-compose.dev.yml`) from being uploaded to Elastic Beanstalk.

**`nginx/nginx.conf`**: Configured for Elastic Beanstalk with:
- Health monitoring log format
- Timestamped log files
- Reverse proxy to Node.js app
- Health check endpoint

