const { TABLES } = require('../../consts');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable(TABLES.CHANNEL, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      yt_channel_link: {
        type: DataTypes.STRING,
        unique: true,
      },
      yt_videos_link: {
        type: DataTypes.STRING,
        unique: true,
      },
      bb_space_link: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      bb_room_link: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
      thumbnail: {
        type: DataTypes.STRING,
      },
      published_at: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new',
      },
      twitter_link: {
        type: DataTypes.STRING,
      },
      facebook_link: {
        type: DataTypes.STRING,
      },
      twitch_link: {
        type: DataTypes.STRING,
      },
      instagram_link: {
        type: DataTypes.STRING,
      },
      crawled_at: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    });

    await queryInterface.createTable(TABLES.CHANNEL_STATS, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      channel_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLES.CHANNEL,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      yt_views: DataTypes.INTEGER,
      yt_subscribers: DataTypes.INTEGER,
      bb_followers: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    });

    await queryInterface.createTable(TABLES.VIDEO, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      channel_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLES.CHANNEL,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      yt_video_id: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      bb_video_id: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      thumbnail: DataTypes.STRING,
      published_at: DataTypes.DATE,
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new',
      },
      live_schedule: DataTypes.DATE,
      live_start: DataTypes.DATE,
      live_end: DataTypes.DATE,
      live_viewers: DataTypes.INTEGER,
      is_uploaded: DataTypes.BOOLEAN,
      late_secs: DataTypes.INTEGER,
      duration: DataTypes.INTEGER,
      is_captioned: DataTypes.BOOLEAN,
      is_licensed: DataTypes.BOOLEAN,
      is_embeddable: DataTypes.BOOLEAN,
      crawled_at: DataTypes.DATE,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    });

    await queryInterface.createTable(TABLES.VIDEO_COMMENT, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      video_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLES.VIDEO,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      timecode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    });

    await queryInterface.addIndex(TABLES.CHANNEL, ['name']);
    await queryInterface.addIndex(TABLES.VIDEO, ['title']);
    await queryInterface.addIndex(TABLES.VIDEO_COMMENT, ['message']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(TABLES.VIDEO_COMMENT);
    await queryInterface.dropTable(TABLES.VIDEO);
    await queryInterface.dropTable(TABLES.CHANNEL_STATS);
    await queryInterface.dropTable(TABLES.CHANNEL);
  },
};
