module.exports = {
  apps: [
    {
      name: 'client-api',
      script: './services/client-api/src/index.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
