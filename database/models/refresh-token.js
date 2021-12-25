const { Schema, model } = require("mongoose");

const RTSchema = Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  token: String,
  expire_at: {
    type: Date,
  },
  researcher: {
    type: Schema.Types.ObjectId,
    ref: "researcher",
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "student",
  },
});

const RTModel = model("refresh_token", RTSchema);

module.exports = RTModel;
