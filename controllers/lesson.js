const crs = require("crypto-random-string");
const Lesson = require("../database/models/lesson");
const Bookmark = require("../database/models/bookmark");
const { dashIt } = require("../handlers/misc");
const { youtube } = require("../utils/youtube");

const genName = (name = "") => name + "-" + crs({ length: 6, characters: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" });

const saveLessonAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, feedback_selected, topic } = req.body;

    const lesson = await Lesson.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          analysis: { duration, feedback_selected, topic },
        },
      },
      { new: true }
    );

    if (lesson) {
      return res.send({
        analysis: lesson.analysis,
        message: "Updated lesson",
      });
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonAddBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, feedback_type, time_from, time_to, activated, threshold, questions, actions } = req.body;

    const lesson = await Lesson.findOne({ _id: id });

    if (lesson) {
      const newBookmark = await new Bookmark({
        topic,
        feedback_type: feedback_type || "null",
        time_from,
        time_to,
        threshold,
        linechart_feedback: activated,
        questions,
        actions,
      }).save();

      if (lesson.bookmarks) {
        lesson.bookmarks.push(newBookmark._id);
      } else {
        lesson.bookmarks = [newBookmark._id];
      }

      lesson.current_bookmark = newBookmark._id;

      await lesson.save();

      const bookmarks = await Bookmark.find({ _id: { $in: lesson.bookmarks } });

      return res.send({
        success: true,
        current_bookmark: newBookmark,
        bookmarks: bookmarks,
      });
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonSwitchBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const { switch_to } = req.body;

    const lesson = await Lesson.findOne({ _id: id });
    if (lesson) {
      const switchToBookmark = await Bookmark.findOne({ _id: switch_to });

      if (switchToBookmark) {
        lesson.current_bookmark = switchToBookmark._id;

        await lesson.save();

        return res.send({
          success: true,
          current_bookmark: switchToBookmark,
        });
      }
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonEdit = async (req, res) => {
  try {
    const { name, desc, youtube_link } = req.body;
    const id = req.params.id;

    if (!name || !youtube_link)
      return res.send({
        success: false,
        message: "Provide required fields",
      });

    const lesson = await Lesson.findOne({ _id: id });

    if (lesson) {
      if (lesson.name !== name) {
        const unique_name = dashIt(name);
        let lesson_id = genName(unique_name);
        while (await Lesson.findOne({ id: lesson_id })) lesson_id = genName(unique_name);

        lesson.name = name;
        lesson.id = lesson_id;
      }
      if (lesson.desc !== desc) lesson.desc = desc;
      if (lesson.youtube_link !== youtube_link) {
        const { durationSeconds } = await youtube.getVideo(youtube_link);

        lesson.youtube_link = youtube_link;
        lesson.seconds = durationSeconds;
        lesson.minutes = Math.ceil(durationSeconds / 60);
      }

      const saved = await lesson.save();

      if (saved) {
        return res.send({
          success: true,
          message: "Saved successfully",
          lesson,
        });
      }
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonDelete = async (req, res) => {
  try {
    const id = req.params.id;

    const lessonDelete = await Lesson.findOneAndRemove({ _id: id });

    if (lessonDelete) {
      return res.send({
        success: true,
        message: "Delete lesson",
      });
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonSaveBookmark = async (req, res) => {
  try {
    const { bookmark_id } = req.params;
    const { topic, activated, feedback_type, time_from, time_to, threshold } = req.body;

    const bookmark = await Bookmark.findOne({ _id: bookmark_id });

    if (bookmark) {
      if (topic && bookmark.topic !== topic) {
        bookmark.topic = topic;
      }
      if (activated) {
        // TODO: Compare array
        bookmark.linechart_feedback = activated;
      }
      if (feedback_type) {
        // TODO: Compare array
        bookmark.feedback_type = feedback_type;
      }
      if (time_from !== null && bookmark.time_from != time_from) {
        bookmark.time_from = time_from;
      }
      if (time_to !== null && bookmark.time_to != time_to) {
        bookmark.time_to = time_to;
      }
      if (threshold !== null && bookmark.threshold != threshold) {
        bookmark.threshold = threshold;
      }

      const saved = await bookmark.save();

      if (saved) {
        return res.send({
          success: true,
          bookmark,
        });
      }
      return res.status(304).send({ message: "Not Modified" });
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonDeleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const { delete: delete_id, switch_to } = req.body;

    if (req.isAuthenticated()) {
      const lesson = await Lesson.findOne({ _id: id });

      if (lesson) {
        const bookmarkDeleted = await Bookmark.findOneAndDelete({ _id: delete_id });
        const switchToBookmark = await Bookmark.findOne({ _id: switch_to });

        if (bookmarkDeleted) {
          if (switchToBookmark) {
            lesson.current_bookmark = switchToBookmark._id;

            await lesson.save();

            return res.send({
              success: true,
              current_bookmark: switchToBookmark,
            });
          }

          return res.send({
            success: false,
          });
        }
      }
    }
    return res.status(400).send({
      success: false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonBookmarkAddQuestion = async (req, res) => {
  try {
    const bookmark_id = req.params.bookmark_id;
    const bookmark = await Bookmark.findOne({ _id: bookmark_id });
    if (req.body.question) {
      const { name, action } = req.body.question;

      if (bookmark) {
        bookmark.questions.push({
          name: name,
          action: action,
          date: Date.now(),
        });

        await bookmark.save();

        return res.send({ success: true, bookmark });
      }
    }
    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const lessonBookmarkEditQuestion = async (req, res) => {
  try {
    const bookmark_id = req.params.bookmark_id;
    const { questions } = req.body;

    if (Array.isArray(questions)) {
      const bookmark = await Bookmark.findOne({ _id: bookmark_id });

      if (bookmark) {
        bookmark.questions = questions;

        await bookmark.save();
        return res.send({ success: true, bookmark });
      }
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};
const lessonBookmarkDeleteQuestion = async (req, res) => {
  try {
    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};
const lessonBookmarkAddAction = async (req, res) => {
  try {
    const bookmark_id = req.params.bookmark_id;
    const bookmark = await Bookmark.findOne({ _id: bookmark_id });
    if (req.body.action) {
      const { question, action, future_action } = req.body.action;

      if (bookmark) {
        bookmark.actions.push({
          question: parseInt(question),
          action: action,
          future_action: future_action,
          date: Date.now(),
        });

        await bookmark.save();

        return res.send({ success: true, bookmark });
      }
    }
    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};
const lessonBookmarkEditAction = async (req, res) => {
  try {
    const bookmark_id = req.params.bookmark_id;
    const { actions } = req.body;

    if (Array.isArray(actions)) {
      const bookmark = await Bookmark.findOne({ _id: bookmark_id });

      if (bookmark) {
        bookmark.actions = actions;

        await bookmark.save();
        return res.send({ success: true, bookmark });
      }
    }

    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};
const lessonBookmarkDeleteAction = async (req, res) => {
  try {
    return res.status(404).send({ message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  saveLessonAnalysis,
  lessonAddBookmark,
  lessonSwitchBookmark,
  lessonSaveBookmark,
  lessonBookmarkAddQuestion,
  lessonBookmarkEditQuestion,
  lessonBookmarkDeleteQuestion,
  lessonBookmarkAddAction,
  lessonBookmarkEditAction,
  lessonBookmarkDeleteAction,
  lessonEdit,
  lessonDelete,
  lessonDeleteBookmark,
};
