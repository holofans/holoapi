
module.exports = () => {
  const processEnv = process.env;
  const envs = {
    SERVER_PORT: processEnv.SERVER_PORT,
    GOOGLE_API_KEY: processEnv.GOOGLE_API_KEY,
    MEMCACHED_CLUSTERIP: processEnv.MEMCACHED_CLUSTERIP,
    GOOGLE_SERVICE_JSON: processEnv.GOOGLE_SERVICE_JSON,
  };

  if (!envs.SERVER_PORT) throw new Error('SERVER_PORT is required');

  if (!envs.GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY is required');

  if (!envs.MEMCACHED_CLUSTERIP) throw new Error('MEMCACHED_CLUSTERIP is required');

  if (!envs.GOOGLE_SERVICE_JSON) throw new Error('GOOGLE_SERVICE_JSON is required');
  envs.GOOGLE_SERVICE_JSON = JSON.parse(envs.GOOGLE_SERVICE_JSON);

  return envs;
};
