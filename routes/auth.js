const router = require("express").Router();
const { afterAuth, logout, refresh, update, forgotPassword, incrementTour, upgradeFeatureLevel } = require("../controllers/auth");
const {
  signupMiddleware,
  signinMiddleware,
  verifyMiddleware,
  offlineMiddleware,
  signupOfflineMiddleware,
  signinOfflineMiddleware,
  logoutOfflineMiddleware,
  rSigninMiddleware,
  rVerifyMiddleware,
  studentSigninMiddleware,
  studentSignupMiddleware,
  studentVerifyMiddleware,
} = require("../middleware/auth");

const { researcherSignin, researcherRefresh, researcherLogout } = require("../controllers/researcher");

const { afterStudentAuth, studentForgotPassword, studentLogout, studentRefresh } = require("../controllers/student-auth");

router.post("/signup", signupMiddleware, afterAuth);
router.post("/signin", signinMiddleware, afterAuth);
router.post("/password/forgot", forgotPassword);
router.post("/logout", verifyMiddleware, logout);
router.post("/refresh", refresh);

router.post("/researcher/signin", rSigninMiddleware, researcherSignin);
router.post("/researcher/refresh", researcherRefresh);
router.post("/researcher/logout", rVerifyMiddleware, researcherLogout);

router.post("/student/signup", studentSignupMiddleware, afterStudentAuth);
router.post("/student/signin", studentSigninMiddleware, afterStudentAuth);
router.post("/student/password/forgot", studentForgotPassword);
router.post("/student/logout", studentVerifyMiddleware, studentLogout);
router.post("/student/refresh", studentRefresh);

router.post("/offline-signup", offlineMiddleware, signupOfflineMiddleware, afterAuth);
router.post("/offline-signin", offlineMiddleware, signinOfflineMiddleware, afterAuth);
router.post("/offline-logout", offlineMiddleware, logoutOfflineMiddleware, afterAuth);

router.put("/", verifyMiddleware, update);
router.put("/increment-tour", verifyMiddleware, incrementTour);
router.put("/upgrade", verifyMiddleware, upgradeFeatureLevel);

module.exports = router;
