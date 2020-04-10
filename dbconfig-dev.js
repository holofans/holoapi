module.exports = {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    pool: {
      min: 1,
      max: 2
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
    seeds: {
      directory: __dirname + '/knex/seeds'
    }
  }