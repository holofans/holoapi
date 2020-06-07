module.exports = {
  apps: [
    {
      name: 'client-api',
      script: './apps/client-api/index.js',
      exec_mode: 'cluster',
      instances: 1, // add more in prod
      watch: ['./apps/client-api'], // dev only
    },
    {
      name: 'crawler-youtube',
      script: './apps/crawler-youtube/index.js',
      exec_mode: 'cluster',
      instances: 1, // only 1 in prod, important
      watch: ['./apps/crawler-youtube'], // dev only
    },
  ],
};
