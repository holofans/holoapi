const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
// const {env, log, settings} = require('./library');

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
  console.log('HOLOAPI | %s | %d', process.env.NODE_ENV, process.env.SERVER_PORT);
  // log.info('HOLOTOOLS WEB | :%d | %s', process.env.SERVER_PORT, process.env.NODE_ENV);
});
