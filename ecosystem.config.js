module.exports = {
  apps: [{
    name: 'expense-tracker',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/var/www/expense-tracker',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000,
    error_file: '/home/ubuntu/.pm2/logs/expense-tracker-error.log',
    out_file: '/home/ubuntu/.pm2/logs/expense-tracker-out.log',
    time: true,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
