const { Schema, model } = require("mongoose");

const SessionSchema = Schema({
  ip: String,
  unique_id: String,
  agent: String
});

const SessionModel = model("session", SessionSchema);

module.exports = SessionModel;
