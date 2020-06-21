const { QueryTypes, Op } = require('sequelize');
const { Router } = require('express');
const { fixchar } = require('fixchar');
const { RESPONSE_FIELDS } = require('../../../../consts');
const { db, GenericError } = require('../../../../modules');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');

const router = new Router();

router.get('/search', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, channel_id, q } = req.query;

  if (!q || q.length < 1) {
    throw new GenericError('Expected ?q param');
  }

  // Sanitizing query to remove full width alphanumeric and half-width kana.
  const sanitizedQuery = fixchar(q).trim();

  const { rows, count } = await db.Video.findAndCountAll({
    attributes: RESPONSE_FIELDS.VIDEO,
    include: [
      {
        association: 'comments',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT_SIMPLE,
        where: { message: { [Op.iLike]: `%${sanitizedQuery}%` } },
      },
      ...(channel_id ? [{
        association: 'channel',
        attributes: RESPONSE_FIELDS.VIDEO_COMMENT_SIMPLE,
        where: { id: channel_id },
      }] : []),
    ],
    limit,
    offset,
    // Fixes dupes counting
    distinct: true,
    // Fixes weird subquery that kills performance
    subQuery: false,
  });

  const results = {
    count: rows.length,
    total: count,
    query: sanitizedQuery,
    comments: rows,
  };

  res.json(results);
}));

module.exports = router;
