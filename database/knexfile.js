// Update with your config settings.
const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
  },
  production: {
    client: 'pg',
    connection: 'postgresql://holotools@localhost:5432/holotools',
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
  },
};
