const {Firestore} = require('@google-cloud/firestore');

module.exports = (GOOGLE_SERVICE_JSON) => {
  return new Firestore({
    projectId: GOOGLE_SERVICE_JSON.project_id,
    credentials: {
      client_email: GOOGLE_SERVICE_JSON.client_email,
      private_key: GOOGLE_SERVICE_JSON.private_key,
    },
  });
};
