
exports.up = (knex) => knex.schema
  .createTable('Channel', (tbl) => {
    tbl.string('vtuberKey', 30).primary();
    tbl.integer('bbSpaceId').unique().nullable();
    tbl.integer('bbRoomId').unique().nullable();
    tbl.string('ytChannelId', 24).unique().nullable();
    tbl.string('ytUploadsId', 24).nullable();
    tbl.text('name').notNullable();
    tbl.text('description').nullable();
    tbl.string('thumbnail', 150).nullable();
    tbl.datetime('publishedAt').nullable();
    tbl.text('linkTwitter').nullable();
    tbl.text('linkTwitch').nullable();
    tbl.text('linkFacebook').nullable();
    tbl.text('linkInstagram').nullable();
    tbl.datetime('createdOn').notNullable();
    tbl.datetime('updatedOn').nullable();
    tbl.datetime('crawledOn').nullable();
  })
  .createTable('ChannelStats', (tbl) => {
    tbl.string('statsKey', 50).primary();
    tbl.string('vtuberKey', 30);
    tbl.integer('bbFollowers').notNullable();
    tbl.integer('ytViews').nullable();
    tbl.integer('ytSubscribers').notNullable();
    tbl.datetime('createdOn').notNullable();
    tbl.datetime('updatedOn').nullable();
  })
  .createTable('Video', (tbl) => {
    tbl.string('videoKey', 14).primary();
    tbl.string('vtuberKey', 30);
    tbl.integer('bbVideoId').nullable();
    tbl.string('ytVideoId', 11).nullable();
    tbl.text('title').nullable();
    tbl.text('description').nullable();
    tbl.string('thumbnail', 150).nullable();
    tbl.datetime('publishedAt').nullable();
    tbl.string('status', 20).notNullable().defaultTo('new');
    tbl.datetime('liveSchedule').nullable();
    tbl.datetime('liveStart').nullable();
    tbl.datetime('liveEnd').nullable();
    tbl.integer('liveViewers').nullable();
    tbl.boolean('isUploaded').nullable();
    tbl.integer('lateSecs').nullable();
    tbl.integer('duration').nullable();
    tbl.boolean('isCaptioned').nullable();
    tbl.boolean('isLicensed').nullable();
    tbl.boolean('isEmbeddable').nullable();
    tbl.datetime('createdOn').notNullable();
    tbl.datetime('updatedOn').nullable();
    tbl.datetime('crawledOn').nullable();
  })
  .createTable('VideoComment', (tbl) => {
    tbl.string('commentKey', 50).primary();
    tbl.string('videoKey', 14).notNullable();
    tbl.string('ytCommentId', 29).nullable();
    tbl.integer('stamp').notNullable();
    tbl.string('message').notNullable();
    tbl.datetime('createdOn').notNullable();
    tbl.datetime('updatedOn').nullable();
  });

exports.down = (knex) => knex.schema
  .dropTable('Channel')
  .dropTable('ChannelStats')
  .dropTable('Video')
  .dropTable('VideoComment');
