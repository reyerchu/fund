# Deployment Guide for fund.defintek.io

This document provides comprehensive instructions for deploying the On-Chain Fund Platform to an Apache server with multi-host configuration.

## 🚀 Quick Start

### Prerequisites
- Ubuntu/Debian server with Apache2
- Node.js 18+ and npm
- Domain `fund.defintek.io` pointing to your server
- SSL certificate (Let's Encrypt recommended)

### One-Command Deployment
```bash
cd /home/reyerchu/fund/on-chain-fund
./deployment/deploy.sh
```

## 📁 Project Structure

```
on-chain-fund/
├── apache-config/           # Apache virtual host configurations
│   ├── fund.defintek.io.conf
│   └── multi-host-example.conf
├── deployment/              # Deployment scripts and guides
│   ├── deploy.sh           # Main deployment script
│   ├── update.sh           # Update script with zero downtime
│   ├── setup-guide.md      # Detailed setup instructions
│   └── ssl-setup.md        # SSL certificate setup guide
├── app/                    # Next.js App Router application
├── components/             # React components
├── lib/                    # Utility libraries and services
└── types/                  # TypeScript type definitions
```

## 🔧 Configuration Files

### Apache Virtual Host (`apache-config/fund.defintek.io.conf`)
- HTTPS redirect from HTTP
- SSL/TLS configuration
- Proxy configuration for Next.js app
- Security headers
- Logging configuration

### Multi-Host Example (`apache-config/multi-host-example.conf`)
- Example configuration for hosting multiple domains
- Different applications on different ports
- Static file serving
- Multiple SSL certificates

## 🛠️ Deployment Process

### 1. Initial Deployment
```bash
# Run the deployment script
./deployment/deploy.sh
```

The script will:
- Build the Next.js application
- Create deployment directory
- Copy application files
- Configure Apache virtual host
- Create systemd service
- Start all services
- Perform health checks

### 2. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Get SSL certificate
sudo certbot --apache -d fund.defintek.io -d www.fund.defintek.io
```

### 3. Application Updates
```bash
# Update with zero downtime
./deployment/update.sh
```

The update script will:
- Create backup of current deployment
- Pull latest changes (if using git)
- Build new version
- Deploy with zero downtime
- Perform health checks
- Clean up old backups

## 🌐 Multi-Host Configuration

To host multiple domains on the same server:

1. **Copy the example configuration:**
   ```bash
   sudo cp apache-config/multi-host-example.conf /etc/apache2/sites-available/
   ```

2. **Modify for your domains:**
   - Update ServerName and ServerAlias
   - Change DocumentRoot paths
   - Update proxy ports for different applications
   - Configure SSL certificates for each domain

3. **Enable the configuration:**
   ```bash
   sudo a2ensite multi-host-example.conf
   sudo systemctl reload apache2
   ```

## 🔒 Security Features

### SSL/TLS Configuration
- Automatic HTTP to HTTPS redirect
- Strong SSL configuration
- Security headers:
  - HSTS (HTTP Strict Transport Security)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy

### Firewall Configuration
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📊 Monitoring and Logs

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
# Check application status
curl http://localhost:3304

# Check HTTPS
curl https://fund.defintek.io

# Check SSL certificate
openssl s_client -connect fund.defintek.io:443 -servername fund.defintek.io
```

## 🔄 Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update application dependencies
cd /var/www/fund.defintek.io
npm audit fix
```

### SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Automatic renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Backup Strategy
```bash
# Manual backup
sudo tar -czf /backup/fund-defintek-$(date +%Y%m%d).tar.gz \
  /var/www/fund.defintek.io \
  /etc/apache2/sites-available/fund.defintek.io.conf \
  /etc/systemd/system/fund-defintek.service
```

## 🚨 Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   sudo systemctl status fund-defintek
   sudo journalctl -u fund-defintek -f
   ```

2. **Apache configuration errors**
   ```bash
   sudo apache2ctl configtest
   sudo systemctl status apache2
   ```

3. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

4. **Port conflicts**
   ```bash
   sudo netstat -tlnp | grep 3304
   sudo lsof -i :3304
   ```

### Performance Optimization

1. **Enable Apache modules:**
   ```bash
   sudo a2enmod deflate
   sudo a2enmod expires
   ```

2. **Configure caching:**
   - Add caching headers for static assets
   - Use CDN for better performance
   - Enable gzip compression

3. **Monitor resources:**
   ```bash
   htop
   sudo netstat -an | grep :80 | wc -l
   ```

## 📞 Support

For deployment issues:

1. Check the logs first
2. Verify all services are running
3. Test connectivity and SSL
4. Review Apache and systemd configurations
5. Check firewall settings

## 📋 Checklist

Before going live:

- [ ] Domain DNS pointing to server
- [ ] SSL certificate installed and working
- [ ] Application building successfully
- [ ] Apache configuration tested
- [ ] Systemd service running
- [ ] Health checks passing
- [ ] Firewall configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] SSL auto-renewal configured

## 🔗 Useful Commands

```bash
# Service management
sudo systemctl start fund-defintek
sudo systemctl stop fund-defintek
sudo systemctl restart fund-defintek
sudo systemctl status fund-defintek

# Apache management
sudo systemctl start apache2
sudo systemctl stop apache2
sudo systemctl restart apache2
sudo systemctl reload apache2

# Configuration testing
sudo apache2ctl configtest
sudo systemctl daemon-reload

# Log viewing
sudo journalctl -u fund-defintek -f
sudo tail -f /var/log/apache2/fund.defintek.io_error.log
```

---

**Your application will be available at: https://fund.defintek.io**

For detailed setup instructions, see `deployment/setup-guide.md`
For SSL setup, see `deployment/ssl-setup.md`

