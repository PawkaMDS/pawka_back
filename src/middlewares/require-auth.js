const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = function requireAuthentication(req, res, next) {
  const parts = req.headers.authorization?.split(" ");
  jwt.verify(parts?.[1], process.env.JWT_SECRET, async (err, data) => {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).send({
        type: "TOKEN_EXPIRED",
      });
    } else if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    req.user = await User.findOne({
      where: {
        id: data.id,
      },
    });

    if (!req.user) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    next();
  });
};
