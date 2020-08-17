module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/client-api/index.js',
      exec_mode: 'cluster',
      instances: 1, // add more in prod
      watch: ['./apps/client-api'], // dev only
    },
    {
      name: 'crawler',
      script: './apps/crawler-youtube/index.js',
      exec_mode: 'cluster',
      instances: 1, // only 1 in prod, important
      watch: ['./apps/crawler-youtube'], // dev only
    },
    {
      name: 'health-check',
      script: './scripts/check_alive_or_restart.sh',
      exec_mode: 'fork',
      interpreter: '/bin/bash',
      cron_restart: '*/2 * * * *', // every two minutes
      watch: false,
      autorestart: false,
    },
  ],
};
