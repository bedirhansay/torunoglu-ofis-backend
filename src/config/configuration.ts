export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  mongodb: {
    // MongoDB Atlas connection - required
    uri: (() => {
      const uri = process.env.MONGO_URI;
      if (!uri) {
        throw new Error('MONGO_URI environment variable is required. Please set your MongoDB Atlas connection string.');
      }
      return uri;
    })(),
    dbName: (() => {
      const dbName = process.env.MONGO_DB;
      if (!dbName) {
        throw new Error('MONGO_DB environment variable is required. Please set your MongoDB database name.');
      }
      return dbName;
    })(),
    // Connection pooling options (optimized for MongoDB Atlas)
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10),
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
    // Enable query logging in development
    debug: process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      const nodeEnv = process.env.NODE_ENV || 'development';

      if (!secret) {
        if (nodeEnv === 'production') {
          throw new Error('JWT_SECRET environment variable must be set in production');
        }
        return 'development-secret-change-in-production';
      }

      if (nodeEnv === 'production' && secret === 'default-secret-change-in-production') {
        throw new Error('JWT_SECRET cannot use default value in production. Please set a strong secret.');
      }

      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '1h' : '7d'),
    // refreshExpiresIn: Not implemented yet - refresh token mechanism needs to be added
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
