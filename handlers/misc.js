const uuid4 = require("uuid").v4;
const config = require("../config");

module.exports = {
  getClientIp: req => {
    if (req) {
      if (req.headers) {
        if (req.headers["x-real-ip"]) return req.headers["x-real-ip"];
        if (req.headers["x-forwarded-for"]) return req.headers["x-forwarded-for"];
      }
      if (typeof req.ip === "string") return req.ip;
      if (Array.isArray(req.ips) && req.ips.length) return req.ips.join("|");
      if (req.connection) return req.connection.remoteAddress;
    }
    return null;
  },
  setUUIDCookie: (req, res) => {
    if (req.cookies["unique-id"]) return req.cookies["unique-id"];
    const uuid = uuid4();
    res.cookie("unique-id", uuid, { httpOnly: true, maxAge: config.token.refreshExpiresIn, sameSite: process.env.NODE_ENV === "production" });
    return uuid;
  },
  dashIt: (x = "") => {
    if (typeof x !== "string") return "";
    var arr = x
      .toLowerCase()
      .trim()
      .replace("&", "and")
      .replace(/,|@|-|\]|\[|\)|\(+/g, "")
      .split(" ");
    return arr.join("-");
  },
  isValidObjectId: str => new RegExp("^[0-9a-fA-F]{24}$").test(str)
};
