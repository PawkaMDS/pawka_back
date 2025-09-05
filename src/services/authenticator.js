const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Hash = require("../utils/hash");

class Authenticator {
  async authenticate(email, password) {
    const user = await User.scope("withPassword").findOne({ email });
    if (!user) {
      throw { email: ["Unknown email"] };
    }
    const isPasswordValid = await bcrypt.compare(password, user?.password);
    if (!isPasswordValid) {
      throw { password: ["Invalid password"] };
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    });

    return {
      accessToken,
    };
  }
  async create(body) {
    const user = await User.create({
      email: body?.email,
      name: body?.name,
      password: await Hash.hash(body?.password),
    });

    return user;
  }
}

module.exports = new Authenticator();
