const crs = require("crypto-random-string");

const genRandom = (len = 64) => {
  // TODO: Random string generation
  return crs({ length: len });
};

const genToken = randomString => {
  // TODO: Token generation with random string
};

module.exports = {
  genToken,
  genRandom
};
