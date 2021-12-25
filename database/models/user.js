const { Schema, model, SchemaTypes } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../../config");

const UserSchema = new Schema({
  fullname: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: String,
  organization: String,
  mobile_number: {
    type: String,
  },
  mode: {
    type: String,
    enum: ["offline", "online"],
  },
  feature_level: {
    type: String,
    enum: ["basic", "advanced"],
    required: true,
  },
  contact_for_research: {
    type: Boolean,
    required: true,
    default: false,
  },
  tour: {
    dashboard: {
      type: Number,
      default: 0,
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  last_email_request: {
    type: Date,
  },
});

UserSchema.methods.hashPassword = function (password) {
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

UserSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.genToken = function () {
  const { expiresIn, secret } = config.token;
  const token = "Bearer " + jwt.sign({ _id: this._id, email: this.email }, secret, { expiresIn });
  return { token, expiry: expiresIn };
};

UserSchema.methods.toWeb = function () {
  let json = Object.assign({}, this._doc);
  delete json._id;
  delete json.password;
  delete json.unique_id;
  return json;
};

module.exports = model("user", UserSchema);
