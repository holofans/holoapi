
exports.up = (knex) => knex.schema
  .createTable('Channel', (tbl) => {
    tbl.bigincrements('id').primary();
    tbl.string('yt_channel_ref', 24).unique().nullable();
    tbl.string('yt_uploads_ref', 24).unique().nullable();
    tbl.integer('bb_space_ref').unique().nullable();
    tbl.integer('bb_room_ref').unique().nullable();
    tbl.text('name').notNullable();
    tbl.text('description').nullable();
    tbl.string('thumbnail', 150).nullable();
    tbl.datetime('published_at').nullable();
    tbl.string('status', 20).notNullable().defaultTo('new');
    tbl.text('link_twitter').nullable();
    tbl.text('link_twitch').nullable();
    tbl.text('link_facebook').nullable();
    tbl.text('link_instagram').nullable();
    tbl.datetime('created_on').notNullable();
    tbl.datetime('updated_on').nullable();
    tbl.datetime('crawled_on').nullable();
  })
  .createTable('ChannelStats', (tbl) => {
    tbl.bigincrements('id').primary();
    tbl.bigInteger('channel_id').notNullable();
    tbl.integer('bb_followers').notNullable();
    tbl.integer('yt_views').nullable();
    tbl.integer('yt_subscribers').notNullable();
    tbl.datetime('created_on').notNullable();
    tbl.index(['channel_id', 'created_on'], 'stats_key');
  })
  .createTable('Video', (tbl) => {
    tbl.bigincrements('id').primary();
    tbl.bigInteger('channel_id').notNullable();
    tbl.integer('bb_video_ref').unique().nullable();
    tbl.string('yt_video_ref', 11).unique().nullable();
    tbl.text('title').nullable();
    tbl.text('description').nullable();
    tbl.string('thumbnail', 150).nullable();
    tbl.datetime('published_at').nullable();
    tbl.string('status', 20).notNullable().defaultTo('new');
    tbl.datetime('live_schedule').nullable();
    tbl.datetime('live_start').nullable();
    tbl.datetime('live_end').nullable();
    tbl.integer('live_viewers').nullable();
    tbl.boolean('is_uploaded').nullable();
    tbl.integer('late_secs').nullable();
    tbl.integer('duration').nullable();
    tbl.boolean('is_captioned').nullable();
    tbl.boolean('is_licensed').nullable();
    tbl.boolean('is_embeddable').nullable();
    tbl.datetime('created_on').notNullable();
    tbl.datetime('updated_on').nullable();
    tbl.datetime('crawled_on').nullable();
  })
  .createTable('VideoComment', (tbl) => {
    tbl.bigincrements('id').primary();
    tbl.bigInteger('video_id').notNullable();
    tbl.string('yt_comment_ref', 29).unique().nullable();
    tbl.integer('stamp').notNullable();
    tbl.string('message').notNullable();
    tbl.datetime('created_on').notNullable();
    tbl.datetime('updated_on').nullable();
  });

exports.down = (knex) => knex.schema
  .dropTable('Channel')
  .dropTable('ChannelStats')
  .dropTable('Video')
  .dropTable('VideoComment');
