const Youtube = require("simple-youtube-api");
const youtube = new Youtube(process.env.GOOGLE_API_KEY);

module.exports = { youtube };
