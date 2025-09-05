const { Router } = require("express");

const authenticator = require("../services/authenticator");
const User = require("../models/User");

/**
 * @param {Express.Application} app
 * @param {Router} router
 */
module.exports = function (app, router) {
  router.post("/login", async (req, res) => {
    try {
      res.send(
        await authenticator.authenticate(req.body.email, req.body.password)
      );
    } catch (e) {
      res.status(400).send(e);
    }
  });

  router.post("/register", async (req, res) => {
    try {
      const user = await authenticator.create(req.body);
      res.send(await authenticator.authenticate(user.email, req.body.password));
    } catch (e) {
      console.log(e);
      res.status(400).send("Bad Request");
    }
  });
};
