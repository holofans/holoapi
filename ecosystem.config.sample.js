module.exports = {
  apps: [
    {
      name: 'client-api',
      script: './services/client-api/src/index.js',
      watch: ['services'],
    },
    {
      name: 'crawler-youtube',
      script: './services/crawler-youtube/index.js',
      watch: ['services'],
      instances: 4,
      exec_mode: 'cluster',
    },
  ],
};
