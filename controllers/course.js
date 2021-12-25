const crs = require("crypto-random-string");
const Course = require("../database/models/course");
const Lesson = require("../database/models/lesson");
const { youtube } = require("../utils/youtube");
const { dashIt } = require("../handlers/misc");

const isValidObjectId = (str) => {
  return new RegExp("^[0-9a-fA-F]{24}$").test(str);
};

const checkLessonBelongsToUser = async (req) => {
  try {
    const user = req.user ? req.user._id : null;
    const id = req.params.id;
    const query = { user };

    if (isValidObjectId(id)) query._id = id;
    else query.id = id;

    if (user) {
      const lesson = await Lesson.findOne(query);

      if (lesson) {
        return true;
      }

      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

const getAllByUser = async (req, res) => {
  try {
    const user_id = req.user ? req.user._id : null;
    const courses = await Course.find({ user: user_id })
      .sort({ createdAt: -1 })
      .exec();
    if (courses) {
      return res.send({
        success: true,
        courses,
      });
    }
    return res.send({
      success: true,
      courses: [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const getOneCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user ? req.user._id : null;
    const course = await Course.findOne({ _id: id, user: user_id })
      .populate(["lessons"])
      .exec();
    if (course) {
      return res.send({
        success: true,
        course,
      });
    }
    return res.send({
      success: false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const createCourse = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const { name } = req.body;
      const user = req.user._id;
      const isTaken = await Course.findOne({ name, user });

      if (!isTaken) {
        const newCourse = await new Course({
          name,
          user,
        }).save();

        if (newCourse) {
          return res.send({
            success: true,
            course: newCourse,
          });
        }
      }

      return res.send({
        success: false,
        message: "Couldn't create course",
      });
    }

    return res.status(401).send({
      success: false,
      message: "",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const genName = (name = "") =>
  name +
  "-" +
  crs({
    length: 6,
    characters:
      "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  });

const addNewLesson = async (req, res) => {
  try {
    const { name, desc, youtube_link } = req.body;
    if (!name || !youtube_link)
      return res.send({
        success: false,
        message: "Provide required fields",
      });
    const { durationSeconds } = await youtube.getVideo(youtube_link);
    const { id } = req.params;
    const user_id = req.user ? req.user._id : null;
    const unique_name = dashIt(name);
    let lesson_id = genName(unique_name);
    while (await Lesson.findOne({ id: lesson_id }))
      lesson_id = genName(unique_name);
    const newLesson = new Lesson({
      id: lesson_id,
      name,
      youtube_link,
      desc,
      seconds: durationSeconds,
      minutes: Math.ceil(durationSeconds / 60),
    });
    if (newLesson) {
      const course = await Course.findOneAndUpdate(
        { _id: id, user: user_id },
        { $addToSet: { lessons: newLesson._id } },
        { new: true }
      );
      if (course) {
        newLesson.course = course._id;
        newLesson.user = user_id;
        const savedLesson = await newLesson.save();
        if (savedLesson) {
          return res.send({
            success: true,
            message: "Saved successfully",
            course,
            lesson: savedLesson,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const addQuestionToLesson = async (req, res) => {
  const body = req.body;
  const _id = req.params.id;

  try {
    const lesson = await Lesson.findOne({ _id });

    if (lesson) {
      const questionCount = Array.from(lesson.questions).length;

      await lesson.updateOne({
        $push: {
          questions: {
            id: questionCount,
            question: body.question,
            solution: body.solution,
          },
        },
      });

      return res.send({ message: "Added question to lesson" });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const editQuestionFromLesson = async (req, res) => {
  const body = req.body;
  const _id = req.params.id;

  try {
    const lesson = await Lesson.findOne({
      _id,
      "questions.id": body.question_index,
    });

    if (lesson) {
      await lesson.update({
        $set: {
          "questions.$.question": body.question,
          "questions.$.solution": body.solution,
        },
      });

      return res.send({ message: "Updated question from lesson" });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const deleteQuestionFromLesson = async (req, res) => {
  const body = req.body;
  const _id = req.params.id;

  try {
    const lesson = await Lesson.findOne({
      _id,
      "questions.id": body.question_index,
    });

    if (lesson) {
      await lesson.update({
        $pull: {
          questions: {
            id: body.question_index,
          },
        },
      });

      return res.send({ message: "Added question to lesson" });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const addActionTaken = async (req, res) => {
  const body = req.body;
  const _id = req.params.id;

  try {
    const lesson = await Lesson.findOne({ _id });

    if (lesson) {
      const questionCount = Array.from(lesson.questions).length;

      await lesson.updateOne({
        $push: {
          actions: {
            id: questionCount,
            text: body.text,
          },
        },
      });

      return res.send({ message: "Added question to lesson" });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const addFutureAction = async (req, res) => {
  const body = req.body;
  const _id = req.params.id;

  try {
    const lesson = await Lesson.findOne({ _id });

    if (lesson) {
      const questionCount = Array.from(lesson.questions).length;

      await lesson.updateOne({
        $push: {
          questions: {
            id: questionCount,
            text: body.text,
          },
        },
      });

      return res.send({ message: "Added question to lesson" });
    }

    return res.status(404).send({ success: false, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const getLesson = async (req, res) => {
  try {
    const id = req.params.id;
    const query = {};

    if (isValidObjectId(id)) query._id = id;
    else query.id = id;

    const lesson = await Lesson.findOne(query)
      .populate("bookmarks current_bookmark")
      .exec();

    if (lesson) {
      return res.send({
        success: true,
        lesson,
      });
    }

    return res.status(404).send({
      success: false,
      message: "Not found",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const editCourse = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const id = req.params.id;
      const { name } = req.body;

      const query = { user: req.user._id };
      if (isValidObjectId(id)) query._id = id;
      else query.id = id;

      const course = await Course.findOne(query);

      if (course) {
        if (name) course.name = name;

        const saved = await course.save();

        if (saved) {
          return res.send({
            success: true,
          });
        }
      }
    }

    return res.send({
      success: false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const id = req.params.id;

      const query = { user: req.user._id };
      if (isValidObjectId(id)) query._id = id;
      else query.id = id;

      const course = await Course.findOneAndDelete(query);

      if (course) {
        return res.send({
          success: true,
        });
      }
    }

    return res.send({
      success: false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  getAllByUser,
  getOneCourse,
  createCourse,
  addNewLesson,
  getLesson,
  addQuestionToLesson,
  editQuestionFromLesson,
  deleteQuestionFromLesson,
  addActionTaken,
  addFutureAction,
  editCourse,
  deleteCourse,
  checkLessonBelongsToUser,
};
