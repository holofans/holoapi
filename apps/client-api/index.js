require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');
const swaggerStats = require('swagger-stats');

const { db, log } = require('../../modules');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const rootRoutes = require('./routes/root');
const v1Routes = require('./routes/v1');
const { SWAGGER_STATS_CONF } = require('../../consts');

const app = express();
const PORT = process.env.SERVER_PORT || 2434;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(swaggerStats.getMiddleware(SWAGGER_STATS_CONF));

app.use(rootRoutes);
app.use('/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  await db.client.authenticate();
  log.info('HOLOAPI | %s | %s | :%d', process.env.NODE_ENV, moment().format('YYYY-MM-DD HH:mm:ss ZZ'), PORT);
});
