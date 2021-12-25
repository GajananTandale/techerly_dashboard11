const crs = require("crypto-random-string");
const config = require("../config");
const Student = require("../database/models/student");
const Token = require("../database/models/token");
const Lesson = require("../database/models/lesson");
const RefreshToken = require("../database/models/refresh-token");
const Log = require("../database/models/log");
const { setUUIDCookie, isValidObjectId } = require("../handlers/misc");
const { sendMail } = require("../utils/mail");
const { onLogFail } = require("../utils/log");

const cookieName = "debe_student_token";

const afterStudentAuth = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const student_id = req.user._id;
      const save_cookie = req.body.remember;
      const { lesson_id } = req.body;

      const student = await Student.findOne({ _id: student_id });

      if (student) {
        let refresh_token = crs({ length: 128, type: "base64" });
        let refToken = await RefreshToken.findOneAndUpdate({ student: student_id }, { token: refresh_token }, { new: true });

        if (refToken) {
          refreshExpiresIn = refToken.expire_at;
        } else {
          let newRefreshToken = await new RefreshToken({
            student: student_id,
            token: refresh_token,
            expire_at: save_cookie ? new Date(new Date().getTime() + config.token.refreshExpiresIn) : new Date(new Date().getTime() + 86400000),
          }).save();

          refreshExpiresIn = newRefreshToken.expire_at;
        }

        const { token, expiry } = student.genToken();

        const cookie_opts = { httpOnly: true };
        if (process.env.NODE_ENV === "production") cookie_opts.sameSite = true;
        if (save_cookie) cookie_opts.maxAge = config.token.refreshExpiresIn;

        const query = {};
        if (isValidObjectId(lesson_id)) query._id = lesson_id;
        else query.id = lesson_id;

        const lesson = await Lesson.findOne(query);

        try {
          await new Log({
            action: "login",
            student: student_id,
            lesson: lesson ? lesson._id : null,
          }).save();
        } catch (error) {
          onLogFail({
            action: "login",
            student: student_id,
            lesson: lesson ? lesson._id : null,
          });
          console.log(error);
        }

        res.cookie(cookieName, refresh_token, cookie_opts);

        return res.json({
          success: true,
          user: student.toWeb(),
          jwt_token: token,
          jwt_token_expiry: expiry,
        });
      }
    }
    return res.status(400).send({
      success: false,
      message: "Something went wrong.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

const studentRefresh = async (req, res) => {
  try {
    const refresh_token = req.cookies[cookieName];

    if (!refresh_token) {
      setUUIDCookie(req, res);
    }

    const foundRT = await RefreshToken.findOne({ token: refresh_token });
    if (foundRT) {
      if (foundRT.expire_at > new Date(new Date().getTime())) {
        let student = await Student.findOne({
          _id: foundRT.student,
        });

        if (student) {
          const { token, expiry } = student.genToken();

          return res.send({
            success: true,
            jwt_token: token,
            jwt_token_expiry: expiry,
            user: student.toWeb(),
          });
        }
      } else {
        const deleteRT = await foundRT.remove();
        if (deleteRT) {
          console.log("Deleting Refresh token...", deleteRT.user);
        }
      }
    }

    return res.send({
      success: false,
      message: "Couldn't refresh tokens",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      success: false,
      message: "Internal server error",
      redirect: true,
      redirectTo: "/",
    });
  }
};

const studentLogout = async (req, res) => {
  try {
    let refresh_token = req.cookies[cookieName];
    const { lesson_id } = req.body;
    let deleted = await RefreshToken.findOneAndDelete({ token: refresh_token });

    if (deleted) {
      setUUIDCookie(req, res);
      if (req.isAuthenticated()) req.logout();

      res.cookie(cookieName, "", {
        httpOnly: true,
        expires: new Date(0),
      });

      res.cookie("unique-id", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      const query = {};
      if (isValidObjectId(lesson_id)) query._id = lesson_id;
      else query.id = lesson_id;

      const lesson = await Lesson.findOne(query);

      try {
        await new Log({
          action: "logout",
          student: deleted.student,
          lesson: lesson ? lesson._id : null,
        }).save();
      } catch (error) {
        onLogFail({
          action: "logout",
          student: deleted.student,
          lesson: lesson ? lesson._id : null,
        });
        console.log(error);
      }

      return res.status(200).send({
        success: true,
      });
    }
    return res.status(400).send({
      success: false,
      message: "Couldn't logout.",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

const studentForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let now = Date.now();
    let student = await Student.findOne({ email, $or: [{ last_email_request: { $eq: null } }, { last_email_request: { $lte: now } }] });

    if (student) {
      let token = crs({ length: 168, type: "url-safe" });
      while (await Token.findOne({ token })) {
        token = crs({ length: 168, type: "url-safe" });
      }

      let dbToken = await new Token({
        token,
        student: student._id,
      }).save();

      student.last_email_request = new Date(now + process.env.NODE_ENV === "production" ? 300000 : 5000); // 5 minute

      await student.save();

      if (dbToken) {
        let resetPwdLink = req.protocol + "://" + req.headers.host + "/student/password/reset/" + dbToken.token;
        sendMail({
          to: student.email,
          subject: "Reset password | Tcherly",
          html: `<p>Use this link to reset your password:</p><p>${resetPwdLink}</p>`,
        });
      }
    }
    return res.send({ message: "If the provided email is correct, you will receive the reset instructions there shortly." });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

const renderStudentResetPassword = async (req, res) => {
  const { token } = req.params;
  const { message, type } = req.query;

  if (token) {
    return res.render("student-reset-password", { csrfToken: req.csrfToken(), type, message, token });
  }

  return res.redirect(
    url.format({
      pathname: "/info",
      query: { type: "failed", message: "Token not specified" },
    })
  );
};

const studentResetPassword = async (req, res) => {
  try {
    let { token } = req.params;
    if (token) {
      let { password, confirm_password } = req.body || {};
      if (!password || !confirm_password) {
        return res.render("info", { failed: true, message: "Please provide both password and confirm password." });
      }
      if (password !== confirm_password) {
        return res.render("info", { failed: true, message: "Provided passwords do not match." });
      }
      if (password.length < 8 || password.length > 32) {
        return res.render("info", { failed: true, message: "Password length must be between 8-32 characters." });
      }
      const foundToken = await Token.findOne({ token });
      if (!foundToken) {
        return res.render("info", { failed: true, message: "Provided token is not valid." });
      }
      if (foundToken.used) {
        return res.render("info", { failed: true, message: "Provided token has already been used." });
      }
      foundToken.used = true;
      await foundToken.save();

      const student = await Student.findOne({ _id: foundToken.student });
      if (student) {
        student.password = await student.hashPassword(password);
        const savedUser = await student.save();

        if (savedUser) {
          return res.redirect("/");
        }

        return res.render("info", { failed: true, message: "Your password couldn't be changed." });
      }
    }
    return res.render("info", { failed: true, message: "Not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = { afterStudentAuth, studentRefresh, studentLogout, studentForgotPassword, renderStudentResetPassword, studentResetPassword };
