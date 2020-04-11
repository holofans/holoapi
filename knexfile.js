// Update with your config settings.
const path = require('path')

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    pool: {
      min: 1,
      max: 2
    },
    migrations: {
      directory: path.join(__dirname, '/knex/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '/knex/seeds'),
    }
  },
  // staging: {...}, (what staging?)
  production:  {
    client: 'pg',
    connection: "postgresql://holotools@localhost:5432/holotools",
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: path.join(__dirname, '/knex/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '/knex/seeds')
    }
  }
};
