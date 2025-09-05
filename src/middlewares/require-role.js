const User = require("../models/User");

module.exports = function requireRoles(roles) {
  return function (req, res, next) {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).send("Forbbiden");
    }
  };
};
