const router = require("express").Router();
const csrfProtect = require("csurf")({ cookie: true });
const { renderResetPassword, resetPassword } = require("../controllers/auth");
const { renderStudentResetPassword, studentResetPassword } = require("../controllers/student-auth");

router.get("/password/reset/:token", csrfProtect, renderResetPassword);
router.post("/password/reset/:token", csrfProtect, resetPassword);

router.get("/student/password/reset/:token", csrfProtect, renderStudentResetPassword);
router.post("/student/password/reset/:token", csrfProtect, studentResetPassword);

router.use("/api/researcher", require("./researcher"));

module.exports = router;
