module.exports = {
  apps: [
    {
      name: 'client-api',
      script: './services/client-api/src/index.js',
      exec_mode: 'cluster',
      instances: 1, // add more in prod
      watch: ['services'], // dev only
    },
    {
      name: 'crawler-youtube',
      script: './services/crawler-youtube/index.js',
      exec_mode: 'cluster',
      instances: 1,
      watch: ['services'], // dev only
    },
  ],
};
