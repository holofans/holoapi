const { Router } = require('express');
const { asyncMiddleware } = require('../middleware/error');

const router = new Router();

router.get('/', asyncMiddleware(async (req, res) => {
  res.redirect('/api-docs');
}));

router.get('/api-docs', asyncMiddleware(async (req, res) => {
  res.sendFile('api-docs/api-doc.html', { root: __dirname });
}));

module.exports = router;
