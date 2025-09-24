#!/bin/bash

# Deployment script for fund.defintek.io
# This script builds and deploys the Next.js application

set -e  # Exit on any error

# Configuration
APP_NAME="on-chain-fund-platform"
DOMAIN="fund.defintek.io"
APP_PORT="3304"
DEPLOY_DIR="/var/www/$DOMAIN"
SERVICE_NAME="fund-defintek"
NGINX_CONFIG="/etc/apache2/sites-available/$DOMAIN.conf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_status "Starting deployment for $DOMAIN..."

# Step 1: Build the application
print_status "Building Next.js application..."
npm ci --production=false
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Build completed successfully!"

# Step 2: Create deployment directory
print_status "Creating deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR

# Step 3: Copy application files
print_status "Copying application files..."
cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r node_modules $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/

# Step 4: Create systemd service file
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Next.js App for $DOMAIN
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 5: Copy Apache configuration
print_status "Configuring Apache..."
sudo cp apache-config/$DOMAIN.conf $NGINX_CONFIG

# Step 6: Enable site and restart services
print_status "Enabling Apache site..."
sudo a2ensite $DOMAIN.conf
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod proxy
sudo a2enmod proxy_http

# Step 7: Reload systemd and start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME
sudo systemctl restart apache2

# Step 8: Check service status
print_status "Checking service status..."
sleep 5

if sudo systemctl is-active --quiet $SERVICE_NAME; then
    print_status "Application service is running!"
else
    print_error "Application service failed to start!"
    sudo systemctl status $SERVICE_NAME
    exit 1
fi

if sudo systemctl is-active --quiet apache2; then
    print_status "Apache is running!"
else
    print_error "Apache failed to start!"
    sudo systemctl status apache2
    exit 1
fi

# Step 9: Test the deployment
print_status "Testing deployment..."
if curl -f -s -o /dev/null "http://localhost:$APP_PORT"; then
    print_status "Application is responding on port $APP_PORT!"
else
    print_warning "Application is not responding on port $APP_PORT"
fi

if curl -f -s -o /dev/null "https://$DOMAIN"; then
    print_status "HTTPS is working for $DOMAIN!"
else
    print_warning "HTTPS is not working for $DOMAIN - check SSL configuration"
fi

print_status "Deployment completed!"
print_status "Your application should be available at: https://$DOMAIN"
print_status "Application logs: sudo journalctl -u $SERVICE_NAME -f"
print_status "Apache logs: sudo tail -f /var/log/apache2/$DOMAIN_error.log"

