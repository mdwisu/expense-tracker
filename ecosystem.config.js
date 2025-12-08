module.exports = {
  apps: [{
    name: 'expense-tracker',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/expense-tracker',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    exec_mode: 'cluster',
    instances: 2,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    error_file: '/home/ubuntu/.pm2/logs/expense-tracker-error.log',
    out_file: '/home/ubuntu/.pm2/logs/expense-tracker-out.log',
    merge_logs: true,
    time: true,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
