#!/bin/bash
set -e

# Konfigurasi
VPS_HOST="ubuntu@43.157.243.243"
APP_DIR="/var/www/expense-tracker"
APP_NAME="expense-tracker"
DOMAIN="expense.mdwisu.com"

echo "🚀 Starting first-time deployment to VPS..."
echo "⚠️  Make sure you have:"
echo "   - Added DNS A record: expense -> 43.157.243.243"
echo "   - SSH key configured for VPS access"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# 1. Create directory
echo "📁 Creating application directory..."
ssh $VPS_HOST "sudo mkdir -p $APP_DIR && sudo chown -R ubuntu:ubuntu $APP_DIR"

# 2. Clone repository
echo "📦 Cloning repository..."
ssh $VPS_HOST "cd $APP_DIR && git clone https://github.com/mdwisu/expense-tracker.git ."

# 3. Install dependencies
echo "📥 Installing dependencies..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npm install"

# 4. Setup environment
echo "🔧 Setting up environment..."
ssh $VPS_HOST "cd $APP_DIR && cat > .env << 'EOF'
DATABASE_URL=\"file:./dev.db\"
NODE_ENV=production
EOF"

# 5. Setup database
echo "🗄️  Setting up database..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npx prisma generate && npx prisma migrate deploy && npm run seed"

# 6. Build application
echo "🔨 Building application..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npm run build"

# 7. Start with PM2
echo "🚀 Starting application with PM2..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && pm2 start ecosystem.config.js && pm2 save"

# 8. Setup PM2 startup
echo "⚙️  Configuring PM2 startup..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 startup systemd -u ubuntu --hp /home/ubuntu" > /tmp/pm2-startup.txt
STARTUP_CMD=$(grep "sudo" /tmp/pm2-startup.txt || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    echo "Running PM2 startup command..."
    ssh $VPS_HOST "$STARTUP_CMD"
fi

# 9. Setup Nginx
echo "🌐 Configuring Nginx..."
ssh $VPS_HOST "sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF"

# 10. Enable Nginx site
echo "✅ Enabling Nginx site..."
ssh $VPS_HOST "sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"

# 11. Setup SSL
echo "🔒 Setting up SSL certificate..."
echo "Note: Make sure DNS has propagated before continuing"
read -p "Setup SSL now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    ssh $VPS_HOST "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup failed. You can run it manually later.'"
fi

echo ""
echo "✅ First-time deployment completed!"
echo "📊 Application status:"
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 status $APP_NAME"

echo ""
echo "🌐 Your application should be accessible at:"
echo "   HTTP:  http://$DOMAIN"
echo "   HTTPS: https://$DOMAIN"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    ssh $VPS_HOST 'source ~/.nvm/nvm.sh && pm2 logs $APP_NAME'"
echo "   Restart app:  ssh $VPS_HOST 'source ~/.nvm/nvm.sh && pm2 restart $APP_NAME'"
echo "   Deploy update: ./deploy.sh"
