module.exports = {
  apps: [
    {
      name: 'sms-api',
      script: 'dist/main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        QUEUE_WORKER_ENABLED: 'false',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'sms-worker',
      script: 'dist/worker.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        QUEUE_WORKER_ENABLED: 'true',
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
