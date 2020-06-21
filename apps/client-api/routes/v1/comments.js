const sequelize = require('sequelize');
const { Router } = require('express');
const { fixchar } = require('fixchar');
const { db } = require('../../../../modules');
const { CACHE_TTL } = require('../../../../consts');
const { asyncMiddleware } = require('../../middleware/error');
const { limitChecker } = require('../../middleware/filters');
const cacheService = require('../../services/CacheService');

const { QueryTypes, Op } = sequelize;
const router = new Router();

router.get('/search', limitChecker, asyncMiddleware(async (req, res) => {
  const { limit = 25, offset = 0, channel_id = null, q } = req.query;

  if (!q || q.length < 1) throw new Error('expected ?q param');

  // sanitizing query to remove full width alphanumeric and half-width kana.
  const sanitizedQuery = fixchar(q).trim();
  const sanitizedWildcardQuery = `%${sanitizedQuery}%`;

  const cacheKey = `com?q=${sanitizedQuery},cid=${channel_id},l=${limit},o=${offset}`;
  const cache = await cacheService.getFromCache(cacheKey);
  if (cache.cached) {
    return res.json(cache);
  }

  const rows = db.client.query(`
  SELECT
    "Video".*,
    "CommentBag".*,
    "channel"."id" AS "channel.id",
    "channel"."yt_channel_id" AS "channel.yt_channel_id",
    "channel"."bb_space_id" AS "channel.bb_space_id",
    "channel"."name" AS "channel.name",
    "channel"."description" AS "channel.description",
    "channel"."photo" AS "channel.photo",
    "channel"."published_at" AS "channel.published_at",
    "channel"."twitter_link" AS "channel.twitter_link"
  from
    video AS "Video"
    JOIN (
      SELECT
          "Video".id,
          array_agg(array["Comment"."comment_key", "Comment"."message"]) AS "comments"

      FROM
          (
              SELECT
                  "Video"."id",
                  "Video"."yt_video_key",
                  "Video"."bb_video_id",
                  "Video"."title",
                  "Video"."thumbnail",
                  "Video"."published_at",
                  "Video"."status",
                  "Video"."live_schedule",
                  "Video"."live_start",
                  "Video"."live_end",
                  "Video"."is_uploaded",
                  "Video"."duration_secs",
                  "Video"."is_captioned",
                  "Video"."channel_id"
              FROM
                  "public"."video" AS "Video"
              ORDER BY
                  "Video"."published_at" DESC
          ) AS "Video"
          INNER JOIN "public"."video_comment" AS "Comment" ON "Video"."id" = "Comment"."video_id"
          AND "Comment"."message" ILIKE $queryStr
          ${channel_id ? ' AND "Video"."channel_id" = $channel_id ' : ''}
      GROUP BY
          "Video".id
      ORDER BY
          max("Video"."published_at") DESC
      LIMIT
          $queryLimit OFFSET $queryOffset
  ) AS "CommentBag" ON "CommentBag".id = "Video".id
  LEFT OUTER JOIN "public"."channel" AS "channel" ON "Video"."channel_id" = "channel"."id";`, {

    // If plain is true, then sequelize will only return the first
    // record of the result set. In case of false it will return all records.
    plain: false,
    // Set this to true if you don't have a model definition for your query.
    raw: true,
    // If true, transforms objects with . separated property names into nested objects using dottie.js.
    nest: true,
    // The type of query you are executing.
    type: QueryTypes.SELECT,
    bind: {
      queryStr: sanitizedWildcardQuery,
      channel_id,
      queryLimit: limit,
      queryOffset: offset,
    },
  });

  // const count = db.Video.count(dbQuery);
  const count = db.VideoComment.count({
    distinct: true,
    col: 'video_id',
    where: { message: { [Op.iLike]: sanitizedWildcardQuery } },
    ...channel_id && {
      include: [
        {
          association: 'video',
          where: { channel_id },
        },
      ],
    },
  });

  const results = {
    data: await rows,
    count: await count,
    cached: false,
    query: sanitizedQuery,
  };

  cacheService.saveToCache(cacheKey, results, CACHE_TTL.COMMENTS);

  return res.json(results);
}));

module.exports = router;
