module.exports = {
  apps: [{
    name: 'expense-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/expense-tracker',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/ubuntu/.pm2/logs/expense-tracker-error.log',
    out_file: '/home/ubuntu/.pm2/logs/expense-tracker-out.log',
    time: true
  }]
}
