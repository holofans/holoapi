// Update with your config settings.

module.exports = {

  development: require("./dbconfig-dev.js"),
  // staging: {...}, (what staging?)
  production:  {
    client: 'pg',
    connection: "postgresql://holotools@localhost:5432/holotools",
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
    seeds: {
      directory: __dirname + '/knex/seeds'
    }
  }

};
