# Apache Server Setup Guide for fund.defintek.io

This guide will help you deploy your Next.js on-chain fund platform to an Apache server with multi-host configuration.

## Prerequisites

- Ubuntu/Debian server with Apache2 installed
- Node.js 18+ and npm installed
- Domain `fund.defintek.io` pointing to your server
- SSL certificate (Let's Encrypt recommended)

## Quick Setup

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Apache2 and required modules
sudo apt install apache2 -y
sudo a2enmod ssl rewrite headers proxy proxy_http

# Install PM2 for process management (optional but recommended)
sudo npm install -g pm2
```

### 2. Deploy the Application

```bash
# Navigate to your project directory
cd /home/reyerchu/fund/on-chain-fund

# Run the deployment script
./deployment/deploy.sh
```

### 3. Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Get SSL certificate
sudo certbot --apache -d fund.defintek.io -d www.fund.defintek.io
```

## Manual Setup (Alternative)

If you prefer manual setup or need to customize the configuration:

### 1. Build the Application

```bash
cd /home/reyerchu/fund/on-chain-fund
npm ci
npm run build
```

### 2. Create Deployment Directory

```bash
sudo mkdir -p /var/www/fund.defintek.io
sudo chown -R $USER:$USER /var/www/fund.defintek.io
```

### 3. Copy Application Files

```bash
cp -r .next /var/www/fund.defintek.io/
cp -r public /var/www/fund.defintek.io/
cp -r node_modules /var/www/fund.defintek.io/
cp package*.json /var/www/fund.defintek.io/
cp next.config.js /var/www/fund.defintek.io/
cp tsconfig.json /var/www/fund.defintek.io/
```

### 4. Configure Apache

```bash
# Copy Apache configuration
sudo cp apache-config/fund.defintek.io.conf /etc/apache2/sites-available/

# Enable the site
sudo a2ensite fund.defintek.io.conf
sudo systemctl reload apache2
```

### 5. Create Systemd Service

```bash
sudo tee /etc/systemd/system/fund-defintek.service > /dev/null <<EOF
[Unit]
Description=Next.js App for fund.defintek.io
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/fund.defintek.io
Environment=NODE_ENV=production
Environment=PORT=3304
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable fund-defintek
sudo systemctl start fund-defintek
```

## Multi-Host Configuration

To host multiple domains on the same server, you can use the example configuration in `apache-config/multi-host-example.conf`. This shows how to:

- Host multiple domains with different applications
- Use different ports for different services
- Serve static files directly from Apache
- Configure SSL for multiple domains

### Adding Additional Domains

1. Copy the virtual host configuration for your new domain
2. Update the ServerName, DocumentRoot, and proxy settings
3. Get SSL certificates for the new domain
4. Enable the new site: `sudo a2ensite new-domain.conf`
5. Reload Apache: `sudo systemctl reload apache2`

## Environment Configuration

Create environment files for different environments:

```bash
# Production environment
echo "NODE_ENV=production" > /var/www/fund.defintek.io/.env.production
echo "PORT=3304" >> /var/www/fund.defintek.io/.env.production

# Add any other environment variables your app needs
```

## Monitoring and Logs

### Application Logs
```bash
# View application logs
sudo journalctl -u fund-defintek -f

# View Apache logs
sudo tail -f /var/log/apache2/fund.defintek.io_error.log
sudo tail -f /var/log/apache2/fund.defintek.io_access.log
```

### Health Checks
```bash
# Check if application is running
curl http://localhost:3304

# Check if Apache is proxying correctly
curl https://fund.defintek.io
```

## Security Considerations

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js dependencies
   cd /var/www/fund.defintek.io
   npm audit fix
   ```

3. **SSL Certificate Renewal**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run
   
   # Set up automatic renewal
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Troubleshooting

### Common Issues

1. **Application not starting**
   - Check logs: `sudo journalctl -u fund-defintek -f`
   - Verify Node.js version: `node --version`
   - Check port availability: `sudo netstat -tlnp | grep 3304`

2. **Apache not proxying**
   - Check Apache config: `sudo apache2ctl configtest`
   - Verify modules are enabled: `sudo a2enmod proxy proxy_http`
   - Check Apache logs: `sudo tail -f /var/log/apache2/error.log`

3. **SSL issues**
   - Verify certificate files exist and have correct permissions
   - Check SSL configuration: `openssl s_client -connect fund.defintek.io:443`
   - Test with online SSL checker

### Performance Optimization

1. **Enable Apache compression**
   ```bash
   sudo a2enmod deflate
   ```

2. **Configure caching headers**
   - Add to Apache config for static assets
   - Use CDN for better performance

3. **Monitor resource usage**
   ```bash
   # Monitor system resources
   htop
   
   # Monitor Apache connections
   sudo netstat -an | grep :80 | wc -l
   ```

## Backup and Recovery

### Backup Script
```bash
#!/bin/bash
# Create backup of application and configuration
tar -czf /backup/fund-defintek-$(date +%Y%m%d).tar.gz \
  /var/www/fund.defintek.io \
  /etc/apache2/sites-available/fund.defintek.io.conf \
  /etc/systemd/system/fund-defintek.service
```

### Recovery
```bash
# Restore from backup
tar -xzf /backup/fund-defintek-YYYYMMDD.tar.gz -C /
sudo systemctl daemon-reload
sudo systemctl restart fund-defintek
sudo systemctl restart apache2
```

## Support

For issues or questions:
1. Check the logs first
2. Verify all services are running
3. Test connectivity and SSL
4. Review Apache and systemd configurations

