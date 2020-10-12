const { Router } = require('express');
const { SWAGGER_JSON_V1 } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  res.sendFile('./api-doc.html', { root: __dirname });
}));

router.get('/swagger.json', asyncMiddleware(async (req, res) => {
  res.json(SWAGGER_JSON_V1);
}));

module.exports = router;
