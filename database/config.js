require('dotenv').config();

module.exports = {
  development: {
    dialect: 'postgres',
    protocol: 'postgres',
    use_env_variable: 'DATABASE_URL',
  },
  production: {
    dialect: 'postgres',
    protocol: 'postgres',
    use_env_variable: 'DATABASE_URL',
  },
};
