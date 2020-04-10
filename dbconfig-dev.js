const path = require('path')
module.exports = {
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
  }