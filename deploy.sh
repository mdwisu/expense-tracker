#!/bin/bash
set -e

# Konfigurasi
VPS_HOST="ubuntu@43.157.243.243"
APP_DIR="/var/www/expense-tracker"
APP_NAME="expense-tracker"

echo "🚀 Starting deployment to VPS..."

# 1. Pull latest code di VPS
echo "📦 Pulling latest code from GitHub..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && git pull origin main"

# 2. Install dependencies jika ada perubahan di package.json
echo "📥 Installing dependencies..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npm install"

# 3. Run migrations jika ada
echo "🗄️  Running database migrations..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npx prisma generate && npx prisma migrate deploy"

# 4. Build aplikasi
echo "🔨 Building application..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npm run build"

# 5. Restart PM2
echo "🔄 Restarting application..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && pm2 restart $APP_NAME || pm2 start ecosystem.config.js"

# 6. Save PM2 process list
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 save"

echo "✅ Deployment completed successfully!"
echo "📊 Checking application status..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 status $APP_NAME"

echo ""
echo "🌐 Application is running at: https://expense.mdwisu.com"
echo "📝 To view logs: ssh $VPS_HOST 'source ~/.nvm/nvm.sh && pm2 logs $APP_NAME'"
