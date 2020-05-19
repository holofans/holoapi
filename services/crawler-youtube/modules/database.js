const knex = require('knex');

const { env } = process;

const connection = knex({
  client: 'pg',
  version: '12.3',
  pool: {
    min: env.DBPOOL_MIN || 1,
    max: env.DBPOOL_MAX || 2,
  },
  connection: {
    host: env.POSTGRES_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DBNAME,
  },
});

module.exports = connection;
