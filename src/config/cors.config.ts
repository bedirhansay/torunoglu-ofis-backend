export const corsConfig = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
  exposedHeaders: ['Authorization', 'x-correlation-id'],
  credentials: true,
  maxAge: 864000,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
