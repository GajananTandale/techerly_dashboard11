const passport = require("passport");

const signupMiddleware = passport.authenticate("signup", { session: false });
const signinMiddleware = passport.authenticate("signin", { session: false });
const verifyMiddleware = passport.authenticate("verify", { session: false });

const rSigninMiddleware = passport.authenticate("r-signin", { session: false });
const rVerifyMiddleware = passport.authenticate("r-verify", { session: false });

const studentSignupMiddleware = passport.authenticate("student-signup", { session: false });
const studentSigninMiddleware = passport.authenticate("student-signin", { session: false });
const studentVerifyMiddleware = passport.authenticate("student-verify", { session: false });

const verifyResourceIsForUser = (extractorFn) => async (req, res, next) => {
  try {
    if (typeof extractorFn !== "function") return res.sendStatus(500);

    const extractedId = await extractorFn(req);

    if (extractedId === true) return next();

    return res.sendStatus(401);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

const offlineMiddleware = (req, res, next) => {
  // Verify offline client
  // TODO: Validate offline token
  const offlineToken = req.headers["X-DEBE-TOKEN"];

  next();
};

const signupOfflineMiddleware = (req, res, next) => {
  res.sendStatus(404);
};

const signinOfflineMiddleware = (req, res, next) => {
  res.sendStatus(404);
};

const logoutOfflineMiddleware = (req, res, next) => {
  res.sendStatus(404);
};

module.exports = {
  signupMiddleware,
  signinMiddleware,
  verifyMiddleware,
  rSigninMiddleware,
  rVerifyMiddleware,
  offlineMiddleware,
  signupOfflineMiddleware,
  signinOfflineMiddleware,
  logoutOfflineMiddleware,
  verifyResourceIsForUser,
  studentSignupMiddleware,
  studentSigninMiddleware,
  studentVerifyMiddleware,
};
