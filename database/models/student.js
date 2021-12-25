const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../../config");

const StudentSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    last_email_request: {
      type: Date,
    },
  },
  { timestamps: true }
);

StudentSchema.methods.hashPassword = function (password) {
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

StudentSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

StudentSchema.methods.genToken = function () {
  const { expiresIn, secret } = config.token;
  const token = "Bearer " + jwt.sign({ _id: this._id, email: this.email }, secret, { expiresIn });
  return { token, expiry: expiresIn };
};

StudentSchema.methods.toWeb = function () {
  let json = Object.assign({}, this._doc);
  delete json._id;
  delete json.password;
  delete json.unique_id;
  return json;
};

module.exports = model("student", StudentSchema);
