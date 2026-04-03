module.exports = {
  apps: [
    {
      name: 'sms-api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      out_file: './logs/api.out.log',
      error_file: './logs/api.error.log',
      merge_logs: true,
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'sms-worker',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      out_file: './logs/worker.out.log',
      error_file: './logs/worker.error.log',
      merge_logs: true,
      env: { NODE_ENV: 'production', QUEUE_WORKER_ENABLED: 'true' },
    },
  ],
};
