#!/bin/bash
set -e

# Konfigurasi
VPS_HOST="ubuntu@43.157.243.243"
APP_DIR="/var/www/expense-tracker"
APP_NAME="expense-tracker"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to VPS..."

# 1. Pull latest code di VPS
echo "📦 Pulling latest code from GitHub..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && git pull origin main"

# 2. Install dependencies jika ada perubahan di package.json
echo "📥 Installing dependencies..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npm install"

# 3. Backup database sebelum migration
echo "💾 Backing up database..."
ssh $VPS_HOST "mkdir -p $BACKUP_DIR && (cp $APP_DIR/prisma/production.db $BACKUP_DIR/database.$TIMESTAMP 2>/dev/null || cp $APP_DIR/prisma/dev.db $BACKUP_DIR/database.$TIMESTAMP 2>/dev/null || echo 'No database to backup (first run?)')"

# 4. Run migrations
echo "🗄️  Running database migrations..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && npx prisma generate && npx prisma migrate deploy"

# 5. Build aplikasi (in screen session to avoid timeout)
echo "🔨 Building application in screen session..."
SCREEN_NAME="deploy_$TIMESTAMP"
ssh $VPS_HOST "screen -dmS $SCREEN_NAME bash -c 'source ~/.nvm/nvm.sh && cd $APP_DIR && npm run build && echo BUILD_SUCCESS > /tmp/build_status_$TIMESTAMP || echo BUILD_FAILED > /tmp/build_status_$TIMESTAMP'"

# Wait for build to complete
echo "⏳ Waiting for build to complete..."
BUILD_TIMEOUT=180
BUILD_START=$(date +%s)
while true; do
  BUILD_STATUS=$(ssh $VPS_HOST "cat /tmp/build_status_$TIMESTAMP 2>/dev/null || echo BUILDING")

  if [ "$BUILD_STATUS" = "BUILD_SUCCESS" ]; then
    echo "✅ Build completed successfully!"
    ssh $VPS_HOST "rm -f /tmp/build_status_$TIMESTAMP"
    break
  elif [ "$BUILD_STATUS" = "BUILD_FAILED" ]; then
    echo "❌ Build failed!"
    ssh $VPS_HOST "rm -f /tmp/build_status_$TIMESTAMP"
    exit 1
  fi

  BUILD_ELAPSED=$(($(date +%s) - BUILD_START))
  if [ $BUILD_ELAPSED -gt $BUILD_TIMEOUT ]; then
    echo "⚠️  Build timeout! Check screen session: screen -r $SCREEN_NAME"
    exit 1
  fi

  echo "   Building... (${BUILD_ELAPSED}s elapsed)"
  sleep 5
done

# 6. Restart PM2
echo "🔄 Restarting application..."
ssh $VPS_HOST "source ~/.nvm/nvm.sh && cd $APP_DIR && pm2 restart $APP_NAME || pm2 start ecosystem.config.js"

# 7. Save PM2 process list
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 save"

# 8. Health check
echo "🏥 Running health check..."
HEALTH_CHECK_PASSED=false
for i in {1..30}; do
  HTTP_CODE=$(ssh $VPS_HOST "curl -sf -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 http://localhost:3001/ 2>/dev/null || echo '000'")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application is healthy! (HTTP $HTTP_CODE)"
    HEALTH_CHECK_PASSED=true
    break
  fi
  echo "⏳ Waiting for application to start... ($i/30) [HTTP $HTTP_CODE]"
  sleep 2
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
  echo "❌ Health check failed! Application may not be responding."
  echo "📝 Recent logs:"
  ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 logs $APP_NAME --lines 20 --nostream"
  echo ""
  echo "⚠️  You can rollback database with:"
  echo "   ssh $VPS_HOST 'cp $BACKUP_DIR/database.$TIMESTAMP $APP_DIR/prisma/production.db'"
  echo "   or: ssh $VPS_HOST 'cp $BACKUP_DIR/database.$TIMESTAMP $APP_DIR/prisma/dev.db'"
  exit 1
fi

# 9. Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
ssh $VPS_HOST "cd $BACKUP_DIR && ls -t database.* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true"

echo ""
echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
ssh $VPS_HOST "source ~/.nvm/nvm.sh && pm2 status $APP_NAME"

echo ""
echo "🌐 Application is running at: https://expense.mdwisu.com"
echo "📝 To view logs: ssh $VPS_HOST 'source ~/.nvm/nvm.sh && pm2 logs $APP_NAME'"
echo "💾 Database backup: $BACKUP_DIR/database.$TIMESTAMP"
