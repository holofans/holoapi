const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

module.exports = youtube;
