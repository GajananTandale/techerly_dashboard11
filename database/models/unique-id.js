const { Schema, model } = require("mongoose");

const UniqueIdSchema = new Schema(
  {
    uuid: { type: String },
    name: { type: String }
  },
  { timestamps: true }
);

module.exports = model("UniqueId", UniqueIdSchema);
