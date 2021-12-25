const Student = require("../database/models/student");
const Lesson = require("../database/models/lesson");
const Log = require("../database/models/log");
const { isValidObjectId } = require("../handlers/misc");
const { onLogFail } = require("../utils/log");

/** @type { import('express').RequestHandler } */
const logInteraction = async (req, res) => {
  const { action, date_client } = req.body;
  const { id } = req.params;

  const query = {};
  if (isValidObjectId(id)) query._id = id;
  else query.id = id;

  try {
    const user_id = req.user ? req.user._id : null;

    const lesson = await Lesson.findOne(query);
    const student = await Student.findOne({ _id: user_id });

    if (lesson && student) {
      const data = {
        student: student._id,
        lesson: lesson._id,
        action: action,
        date_client: date_client,
      };

      data.duration = req.body.duration || 0;

      try {
        await new Log(data).save();

        return res.send({ success: true });
      } catch (error) {
        onLogFail(data);
      }
    }
    return res.send({ success: false });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ success: false });
  }
};

module.exports = {
  logInteraction,
};
