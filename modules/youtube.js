const { google } = require('googleapis');

module.exports = {
  youtube: google.youtube({

    version: 'v3',
    auth: process.env.GOOGLE_API_KEY

  })
};
