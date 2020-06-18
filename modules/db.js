const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('./logger');


const db = new Sequelize(process.env.DATABASE_URL, {

  schema: process.env.DATABASE_SCHEMA,

  pool: {

    min: Number(process.env.DBPOOL_MIN) || 1,
    max: Number(process.env.DBPOOL_MAX) || 2,
    idle: 15000,
    acquire: 60000,
    evict: 5000,

  },

  define: {

    freezeTableName: true,
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',

  },

  logging: (message) => logger.verbose(message),


});


if (!+process.env.DATABASE_LOGGING) {
  db.options.logging = false;
}


const modelsPath = path.resolve('database', 'models');

fs.readdirSync(modelsPath)

  .filter(file => !file.startsWith('.') && file.endsWith('.js'))
  .forEach(file => {

    const model = require(path.join(modelsPath, file));
    model.init(db, Sequelize);

  });


Object.values(db.models)

  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db.models));


module.exports = { db, ...db.models };
