const passport = require("passport");
const User = require("../database/models/user");

passport.serializeUser((user, next) => {
  next(null, user._id);
});

passport.deserializeUser((_id, next) => {
  User.findOne({ _id }, (err, user) => {
    if (err) next(err, false);
    if (!user) return next(null, false);
    return next(null, user.toWeb());
  });
});

require("./strategies")(passport);

module.exports = passport;
