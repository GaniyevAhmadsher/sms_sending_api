module.exports = {
  apps: [
    {
      name: 'sms-api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production' },
      out_file: 'logs/api.out.log',
      error_file: 'logs/api.err.log',
    },
    {
      name: 'sms-worker',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: { NODE_ENV: 'production', QUEUE_WORKER_ENABLED: 'true' },
      out_file: 'logs/worker.out.log',
      error_file: 'logs/worker.err.log',
    },
  ],
};
