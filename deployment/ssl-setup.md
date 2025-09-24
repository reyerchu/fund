# SSL Certificate Setup for fund.defintek.io

## Option 1: Let's Encrypt (Recommended - Free)

### Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-apache

# CentOS/RHEL
sudo yum install certbot python3-certbot-apache
```

### Obtain SSL Certificate
```bash
# Get certificate and automatically configure Apache
sudo certbot --apache -d fund.defintek.io -d www.fund.defintek.io

# Or get certificate only (manual configuration)
sudo certbot certonly --apache -d fund.defintek.io -d www.fund.defintek.io
```

### Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Option 2: Commercial SSL Certificate

### If you have a commercial SSL certificate:

1. **Certificate Files Required:**
   - `fund.defintek.io.crt` - Main certificate
   - `fund.defintek.io.key` - Private key
   - `fund.defintek.io.chain.crt` - Certificate chain (if provided)

2. **Install Certificate Files:**
   ```bash
   # Copy certificate files to appropriate locations
   sudo cp fund.defintek.io.crt /etc/ssl/certs/
   sudo cp fund.defintek.io.key /etc/ssl/private/
   sudo cp fund.defintek.io.chain.crt /etc/ssl/certs/
   
   # Set proper permissions
   sudo chmod 644 /etc/ssl/certs/fund.defintek.io.crt
   sudo chmod 600 /etc/ssl/private/fund.defintek.io.key
   sudo chmod 644 /etc/ssl/certs/fund.defintek.io.chain.crt
   ```

## SSL Configuration Verification

### Test SSL Configuration
```bash
# Test Apache configuration
sudo apache2ctl configtest

# Check SSL certificate
openssl s_client -connect fund.defintek.io:443 -servername fund.defintek.io

# Online SSL checker
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=fund.defintek.io
```

### Security Headers
The Apache configuration includes these security headers:
- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

## Troubleshooting

### Common Issues:
1. **Certificate not found**: Check file paths in Apache config
2. **Permission denied**: Ensure proper file permissions
3. **Mixed content**: Ensure all resources use HTTPS
4. **Certificate chain issues**: Verify chain file is correct

### Logs to Check:
```bash
# Apache error logs
sudo tail -f /var/log/apache2/fund.defintek.io_error.log

# SSL specific logs
sudo tail -f /var/log/apache2/ssl_error.log
```

