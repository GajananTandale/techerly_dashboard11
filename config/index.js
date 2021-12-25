require("dotenv").config();

module.exports = {
  app: {
    host: process.env.HOSTNAME || "localhost",
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development"
  },
  db: {
    uri: process.env.DB_URI || "mongodb://localhost:27017/test-debe",
    options: {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    }
  },
  session: {
    maxAge: parseInt(process.env.SESSION_EXPIRATION || 604800000),
    secret: process.env.SESSION_SECRET || "setup_dotenv_file_for_security"
  },
  token: {
    expiresIn: parseInt(process.env.JWT_EXPIRY || 3600000),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRY || 2592000000),
    secret: process.env.JWT_SECRET || "setup_dotenv_file_for_security"
  },
  saltRounds: 13
};
