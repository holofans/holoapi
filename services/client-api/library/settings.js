module.exports = (APP_SETTINGS) => {
  return APP_SETTINGS ? JSON.parse(APP_SETTINGS) : {};
};
