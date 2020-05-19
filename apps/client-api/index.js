const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');
const { log } = require('../../library');

const { env } = process;

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ strict: false }));

const routesSystem = require('./routes/system');
const routesError = require('./routes/error');
// const routesV1 = require('./routes/v1');
app.use(routesSystem);
// app.use('/v1', routesV1);
app.use(routesError);

app.listen(process.env.SERVER_PORT, () => {
  log.info('HOLOAPI | %s | %s | :%d', env.NODE_ENV, moment().format('YYYY-MM-DD HH:mm:ss ZZ'), env.SERVER_PORT);
});
