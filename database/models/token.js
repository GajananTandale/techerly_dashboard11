const { model, Schema, SchemaTypes } = require("mongoose");
const { ObjectId } = SchemaTypes;

const TokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true
    },
    user: {
      type: ObjectId,
      ref: "user"
    },
    student: {
      type: ObjectId,
      ref: "student"
    },
    expires_at: {
      type: Date,
      default: () => Date.now() + 86400000 // 1 day
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = model("token", TokenSchema);
