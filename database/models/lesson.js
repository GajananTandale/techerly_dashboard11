const {
  Schema,
  model,
  SchemaTypes: { ObjectId }
} = require("mongoose");

const LessonSchema = new Schema(
  {
    id: {
      type: String
    },
    name: {
      type: String,
      maxlength: 128
    },
    desc: {
      type: String,
      maxlength: 500
    },
    user: {
      type: ObjectId,
      ref: "user"
    },
    course: {
      type: ObjectId,
      ref: "course"
    },
    youtube_link: {
      type: String
    },
    watched: [
      {
        type: String
      }
    ],
    current_bookmark: {
      type: ObjectId,
      ref: "bookmark"
    },
    bookmarks: [
      {
        type: ObjectId,
        ref: "bookmark"
      }
    ],
    seconds: { type: Number },
    minutes: { type: Number },
    questions: [
      {
        id: Number,
        question: String,
        solution: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = model("lesson", LessonSchema);
