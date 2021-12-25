const config = require("./config");
const fs = require("fs");
const path = require("path");
const http = require("http");
const cors = require("cors");
const express = require("express");
const debug = require("debug")("debe");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const serveFavicon = require("serve-favicon");

const { db } = require("./database");

const logFileStream = fs.createWriteStream(path.join(__dirname, "debe_online.log"), { flags: "a" });

const logFormatter = (tokens, req, res) => {
  const url = tokens.url(req, res) || "";
  if (url.startsWith("/static/")) return null;

  const method = tokens.method(req, res);
  const date = tokens.date(req, res);
  const ip = tokens["remote-addr"](req, res);
  const status = tokens.status(req, res);

  return [Date.parse(date), ip, method, url, status, tokens["response-time"](req, res) + "ms"].join(",");
};

const corsOpts = {
  credentials: true,
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

const passport = require("./middleware/passport");

(async () => {
  const app = express();
  const port = normalizePort(process.env.PORT || "3000");

  app.set("port", port);

  app.use(serveFavicon(path.join(__dirname, "public/favicon.ico")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== "production") app.use(cors(corsOpts));

  try {
    await db.connect();
    const connection = db.getConnection();
    if (connection) {
      app.use(require("./middleware/session"));
      if (config.app.env !== "production") app.use(morgan("dev"));
      app.use(morgan(logFormatter, { stream: logFileStream }));
    }
  } catch (error) {
    console.log(error);
  }

  app.use(passport.initialize());

  app.set("trust proxy", true);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "hbs");

  app.use(express.static(path.join(__dirname, "public")));

  app.use("/", require("./routes/index"));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/courses", require("./routes/course"));
  app.use("/api/lessons", require("./routes/lesson"));
  app.use("/api/misc", require("./routes/misc"));
  app.use("/api/sync", require("./routes/sync"));
  app.use("/api/*", (_, __, next) => next(require("http-errors")(404)));

  if (config.app.env === "production") {
    // TODO: Check if static files exist
    // While building files, they disappear
    // detect that and show temporary page with building message and info

    app.use(express.static(path.join(__dirname, "client/build")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "client/build/index.html"));
    });
  }

  app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
  });

  const server = http.createServer(app);
  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);

  function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
  }

  function onError(error) {
    if (error.syscall !== "listen") throw error;
    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
      default:
        throw error;
    }
  }

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
    console.log("Express server running on http://localhost:" + port);
  }
})();
