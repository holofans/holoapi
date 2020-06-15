require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');

const { log } = require('../../modules');
const { notFoundHandler, errorHandler } = require('./middleware/error');
// const routesV1 = require('./routes/v1');
const routesSystem = require('./routes/system');

const app = express();
const PORT = process.env.SERVER_PORT || 2434;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(routesSystem);
// app.use('/v1', routesV1);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  log.info('HOLOAPI | %s | %s | :%d', process.env.NODE_ENV, moment().format('YYYY-MM-DD HH:mm:ss ZZ'), PORT);
});
