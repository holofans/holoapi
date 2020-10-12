const { Router } = require('express');
const { asyncMiddleware } = require('../middleware/error');
const { SWAGGER_JSON } = require('../../../consts');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  res.redirect('/api-docs');
}));

router.get('/api-docs', asyncMiddleware(async (req, res) => {
  res.sendFile('api-docs/api-doc.html', { root: __dirname });
}));

router.get('/swagger.json', asyncMiddleware(async (req, res) => {
  res.json(SWAGGER_JSON);
}));

module.exports = router;
