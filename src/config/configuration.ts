export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || 'accounting_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '365d',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 dakika
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // 100 istek
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
