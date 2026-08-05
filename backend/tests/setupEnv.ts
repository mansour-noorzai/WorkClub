process.env.NODE_ENV = 'test';
process.env.MONGO_URI =
  process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/workclub-test-placeholder';
process.env.JWT_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '30';
process.env.COOKIE_SECURE = 'false';
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
process.env.QUEUE_MODE = 'inline';
process.env.LOG_LEVEL = 'silent';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.APP_URL = 'http://localhost:5173';
