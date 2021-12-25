const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../../config");

const ResearcherSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String
    },
    name: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

ResearcherSchema.methods.hashPassword = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(config.saltRounds, (err, salt) => {
      if (err) reject(err);
      if (salt) {
        bcrypt.hash(password, salt, (e, hashed) => {
          if (e) reject(e);
          resolve(hashed);
        });
      }
    });
  });
};

ResearcherSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

ResearcherSchema.methods.genToken = function () {
  const { expiresIn, secret } = config.token;
  const token = "Bearer " + jwt.sign({ _id: this._id, email: this.email }, secret, { expiresIn });
  return { token, expiry: expiresIn };
};

ResearcherSchema.methods.toWeb = function () {
  let json = Object.assign({}, this._doc);
  delete json._id;
  delete json.password;
  delete json.unique_id;
  return json;
};

module.exports = model("researcher", ResearcherSchema);
