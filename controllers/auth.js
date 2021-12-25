const crs = require("crypto-random-string");
const config = require("../config");
const User = require("../database/models/user");
const Token = require("../database/models/token");
const RefreshToken = require("../database/models/refresh-token");
const { getClientIp, setUUIDCookie } = require("../handlers/misc");
const { sendMail } = require("../utils/mail");

const afterAuth = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const user_id = req.user._id;
      const save_cookie = req.body.remember;
      const user = await User.findOne({ _id: user_id });
      const ip = getClientIp(req);
      const uuid = setUUIDCookie(req, res);
      if (user) {
        let refresh_token = crs({ length: 128, type: "base64" });
        let refreshExpiresIn;
        let refToken = await RefreshToken.findOneAndUpdate({ user: user_id }, { token: refresh_token }, { new: true });
        if (refToken) {
          refreshExpiresIn = refToken.expire_at;
        } else {
          let newRefreshToken = await new RefreshToken({
            user: user_id,
            token: refresh_token,
            expire_at: save_cookie ? new Date(new Date().getTime() + config.token.refreshExpiresIn) : new Date(new Date().getTime() + 86400000),
          }).save();
          refreshExpiresIn = newRefreshToken.expire_at;
        }
        let { token, expiry } = user.genToken();
        let cookie_opts = { httpOnly: true };
        if (process.env.NODE_ENV === "production") cookie_opts.sameSite = true;
        if (save_cookie) cookie_opts.maxAge = config.token.refreshExpiresIn;

        res.cookie("debe_token", refresh_token, cookie_opts);
        return res.json({
          success: true,
          user: user.toWeb(),
          jwt_token: token,
          jwt_token_expiry: expiry,
          // refresh_token: refresh_token,
          // refresh_token_expiry: refreshExpiresIn
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
const refresh = async (req, res) => {
  try {
    let refresh_token = req.cookies["debe_token"];
    if (!refresh_token) {
      setUUIDCookie(req, res);
    }
    let foundRT = await RefreshToken.findOne({ token: refresh_token });
    if (foundRT) {
      if (foundRT.expire_at > new Date(new Date().getTime())) {
        let user = await User.findOne({
          _id: foundRT.user,
        });
        if (user) {
          const { token, expiry } = user.genToken();
          return res.send({
            success: true,
            jwt_token: token,
            jwt_token_expiry: expiry,
            user: user.toWeb(),
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
const logout = async (req, res) => {
  try {
    let refresh_token = req.cookies["debe_token"];
    let deleted = await RefreshToken.findOneAndDelete({ token: refresh_token });
    if (deleted) {
      setUUIDCookie(req, res);
      if (req.isAuthenticated()) req.logout();
      res.cookie("debe_token", "", {
        httpOnly: true,
        expires: new Date(0),
      });
      res.cookie("unique-id", "", {
        httpOnly: true,
        expires: new Date(0),
      });
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
const update = async (req, res) => {
  return res.sendStatus(404);
};

const incrementTour = async (req, res) => {
  try {
    const _id = req.user && req.user._id;

    if (_id) {
      await User.findOneAndUpdate({ _id }, { $inc: { "tour.dashboard": 1 } });
      return res.status(200);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

const upgradeFeatureLevel = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const _id = req.user._id;

      await User.findOneAndUpdate({ _id }, { feature_level: "advanced" });

      return res.status(200);
    }
    return res.status(401);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let now = Date.now();
    let user = await User.findOne({ email, $or: [{ last_email_request: { $eq: null } }, { last_email_request: { $lte: now } }] });
    if (user) {
      let token = crs({ length: 168, type: "url-safe" });
      while (await Token.findOne({ token })) {
        token = crs({ length: 168, type: "url-safe" });
      }
      let dbToken = await new Token({
        token,
        user: user._id,
      }).save();

      user.last_email_request = new Date(now + process.env.NODE_ENV === "production" ? 300000 : 5000); // 5 minute

      await user.save();

      if (dbToken) {
        let resetPwdLink = req.protocol + "://" + req.headers.host + "/password/reset/" + dbToken.token;
        sendMail({
          to: user.email,
          subject: "Reset password | Tcherly",
          html: `<p>Use this link to reset your password:</p><p>${resetPwdLink}</p>`,
        });
      }
    }
    return res.send({ message: "If the provided email is correct, you will receive the reset instructions there shortly" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error.",
    });
  }
};
const renderResetPassword = async (req, res) => {
  const { token } = req.params;
  const { message, type } = req.query;
  if (token) {
    return res.render("reset-password", { csrfToken: req.csrfToken(), type, message, token });
  }
  return res.redirect(
    url.format({
      pathname: "/info",
      query: { type: "failed", message: "Token not specified" },
    })
  );
};
const resetPassword = async (req, res) => {
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

      const user = await User.findOne({ _id: foundToken.user });
      if (user) {
        user.password = await user.hashPassword(password);
        const savedUser = await user.save();

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
module.exports = { afterAuth, logout, refresh, update, upgradeFeatureLevel, forgotPassword, renderResetPassword, resetPassword, incrementTour };
