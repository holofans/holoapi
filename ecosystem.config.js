module.exports = {
  apps: [
    {
      name: 'client-api',
      script: './services/client-api/src/index.js',
      watch: ['services'],
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'crawler-youtube',
      script: './services/crawler-youtube/src/index.js',
      watch: ['services'],
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
