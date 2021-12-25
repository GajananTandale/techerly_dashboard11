const {
  Schema,
  model,
  SchemaTypes: { ObjectId }
} = require("mongoose");

const CourseSchema = new Schema(
  {
    name: String,
    user: {
      type: ObjectId,
      ref: "user"
    },
    lessons: [
      {
        type: ObjectId,
        ref: "lesson"
      }
    ]
  },
  { timestamps: true }
);

module.exports = model("course", CourseSchema);
