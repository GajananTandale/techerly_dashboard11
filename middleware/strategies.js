const config = require("../config");
const User = require("../database/models/user");
const Researcher = require("../database/models/researcher");
const Student = require("../database/models/student");
const LocalStrategy = require("passport-local").Strategy;
const { Strategy: JWTStrategy, ExtractJwt } = require("passport-jwt");
const jwt = require("jsonwebtoken");

const signupStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (req, email, password, next) {
    try {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const { fullname, organization, mobile_number, feature_level, contact_for_research, mode } = req.body;
        const user = new User({
          email,
          fullname,
          organization,
          mobile_number,
          feature_level,
          mode,
          contact_for_research: contact_for_research === "yes",
        });
        user.password = await user.hashPassword(password);
        if (await user.save()) {
          return next(null, { _id: user._id, email });
        }
      }
      return next(null, false, { message: "Account already exists, please use a different email." });
    } catch (error) {
      console.log(error);
      return next(error, false);
    }
  }
);

const signinStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (req, email, password, next) {
    try {
      const user = await User.findOne({ email });

      if (user && user.verifyPassword(password)) {
        return next(null, { _id: user._id, email });
      }
      return next(null, false);
    } catch (error) {
      console.log(error);
      return next(error, false);
    }
  }
);

const verifyStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.token.secret,
    jsonWebTokenOptions: {
      expiresIn: config.token.expiresIn,
    },
  },
  async (payload, done) => {
    try {
      const user = await User.findOne({ _id: payload._id });
      if (user) {
        let { _id, email } = user;
        return done(null, { _id, email });
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
);

const researcherSigninStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async function (email, password, next) {
    try {
      const user = await Researcher.findOne({ email });

      if (user && user.verifyPassword(password)) {
        return next(null, { _id: user._id, email });
      }
      return next(null, false);
    } catch (error) {
      console.log(error);
      return next(error, false);
    }
  }
);

const researcherVerifyStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.token.secret,
    jsonWebTokenOptions: {
      expiresIn: config.token.expiresIn,
    },
  },
  async (payload, done) => {
    try {
      const user = await Researcher.findOne({ _id: payload._id });
      if (user) {
        let { _id, email } = user;
        return done(null, { _id, email });
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
);

const studentSignupStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (req, email, password, next) {
    try {
      const existingStudent = await Student.findOne({ email });

      if (!existingStudent) {
        const { name, phone } = req.body;

        const student = new Student({
          email,
          name,
          phone,
        });

        student.password = await student.hashPassword(password);

        if (await student.save()) {
          return next(null, { _id: student._id, email });
        }
      }
      return next(null, false, { message: "Account already exists, please use a different email." });
    } catch (error) {
      console.log(error);
      return next(error, false);
    }
  }
);

const studentSigninStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (_, email, password, next) {
    try {
      const student = await Student.findOne({ email });

      if (student && student.verifyPassword(password)) {
        return next(null, { _id: student._id, email });
      }

      return next(null, false);
    } catch (error) {
      console.log(error);
      return next(error, false);
    }
  }
);

const studentVerifyStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.token.secret,
    jsonWebTokenOptions: {
      expiresIn: config.token.expiresIn,
    },
  },
  async (payload, done) => {
    try {
      const student = await Student.findOne({ _id: payload._id });

      if (student) {
        const { _id, email } = student;

        return done(null, { _id, email });
      }

      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
);

module.exports = (passport) => {
  passport.use("signup", signupStrategy);
  passport.use("signin", signinStrategy);
  passport.use("verify", verifyStrategy);

  passport.use("r-signin", researcherSigninStrategy);
  passport.use("r-verify", researcherVerifyStrategy);

  passport.use("student-signup", studentSignupStrategy);
  passport.use("student-signin", studentSigninStrategy);
  passport.use("student-verify", studentVerifyStrategy);
};
