const session = require("express-session");
const connectMongo = require("connect-mongo")(session);
const config = require("../config");
const { db } = require("../database");

module.exports = session({
  name: "sessionId",
  secret: config.session.secret,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: config.session.maxAge
  },
  resave: false,
  saveUninitialized: false,
  store: new connectMongo({ mongooseConnection: db.getConnection() })
});
