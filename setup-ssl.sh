#!/bin/bash
# Script cài đặt SSL cho blog phân tán

# Cài đặt certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Lấy chứng chỉ SSL
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com --email your-email@example.com --agree-tos

# Đường dẫn đến chứng chỉ
mkdir -p /etc/nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/

# Restart Nginx
systemctl restart nginx

# Cài đặt cron job để tự động gia hạn chứng chỉ
echo "0 3 * * * certbot renew --quiet" | tee -a /etc/crontab > /dev/null
