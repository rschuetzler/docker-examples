#!/bin/bash
# Setup nginx healthd logs directory with proper permissions
# This script runs after deployment to ensure Elastic Beanstalk can collect health metrics

set -e

# Create healthd logs directory if it doesn't exist
mkdir -p /var/log/nginx/healthd

# Set proper permissions for nginx container to write logs
chmod -R 755 /var/log/nginx/healthd

# Allow nginx user to write to this directory
chown -R root:root /var/log/nginx/healthd

echo "Nginx healthd logs directory setup complete"
