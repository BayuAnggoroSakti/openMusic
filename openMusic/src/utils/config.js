const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  s3: {
    bucketName: process.env.AWS_BUCKET_NAME,
  },
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER,
  },
  redis: {
    host: process.env.REDIS_SERVER,
  },
  jwt: {
    key: process.env.ACCESS_TOKEN_KEY,
    age: process.env.ACCESS_TOKEN_AGE,
    refresh: process.env.REFRESH_TOKEN_KEY,
  },
};

module.exports = config;
