module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/client-api/index.js',
      exec_mode: 'cluster',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'crawler',
      script: './apps/crawler-youtube/index.js',
      exec_mode: 'cluster',
      instances: 1,
    },
  ],
};
