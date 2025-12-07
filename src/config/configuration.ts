export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || 'accounting_db',
    // Connection pooling options
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10),
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
    // Enable query logging in development
    debug: process.env.NODE_ENV === 'development',
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
