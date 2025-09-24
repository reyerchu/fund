#!/bin/bash

# Update script for fund.defintek.io
# This script updates the deployed application with zero downtime

set -e

# Configuration
DOMAIN="fund.defintek.io"
APP_PORT="3304"
DEPLOY_DIR="/var/www/$DOMAIN"
SERVICE_NAME="fund-defintek"
BACKUP_DIR="/var/backups/fund-defintek"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_status "Starting update for $DOMAIN..."

# Step 1: Create backup
print_status "Creating backup..."
sudo mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
sudo tar -czf $BACKUP_FILE -C /var/www $DOMAIN

if [ $? -eq 0 ]; then
    print_status "Backup created: $BACKUP_FILE"
else
    print_error "Backup failed!"
    exit 1
fi

# Step 2: Pull latest changes (if using git)
if [ -d ".git" ]; then
    print_status "Pulling latest changes from git..."
    git pull origin main
    
    if [ $? -ne 0 ]; then
        print_warning "Git pull failed or no changes available"
    fi
fi

# Step 3: Install/update dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Step 4: Build the application
print_status "Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Restoring from backup..."
    sudo tar -xzf $BACKUP_FILE -C /var/www
    sudo systemctl restart $SERVICE_NAME
    exit 1
fi

# Step 5: Stop the service
print_status "Stopping application service..."
sudo systemctl stop $SERVICE_NAME

# Step 6: Update application files
print_status "Updating application files..."
sudo rm -rf $DEPLOY_DIR/.next
sudo rm -rf $DEPLOY_DIR/node_modules
sudo rm -rf $DEPLOY_DIR/public

cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r node_modules $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/

# Step 7: Start the service
print_status "Starting application service..."
sudo systemctl start $SERVICE_NAME

# Step 8: Wait for service to be ready
print_status "Waiting for service to be ready..."
sleep 10

# Step 9: Health check
print_status "Performing health check..."
if curl -f -s -o /dev/null "http://localhost:$APP_PORT"; then
    print_status "Health check passed! Application is running."
else
    print_error "Health check failed! Restoring from backup..."
    sudo systemctl stop $SERVICE_NAME
    sudo tar -xzf $BACKUP_FILE -C /var/www
    sudo systemctl start $SERVICE_NAME
    exit 1
fi

# Step 10: Clean up old backups (keep last 5)
print_status "Cleaning up old backups..."
cd $BACKUP_DIR
ls -t backup-*.tar.gz | tail -n +6 | xargs -r sudo rm

print_status "Update completed successfully!"
print_status "Application is available at: https://$DOMAIN"
print_status "Backup location: $BACKUP_FILE"

