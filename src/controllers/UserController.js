const { Router } = require("express");
const requireRoles = require("../middlewares/require-role");
const requireAuth = require("../middlewares/require-auth");
const User = require("../models/User");
const Animal = require("../models/Animal");
const AnimalType = require("../models/AnimalType");
const AnimalBreed = require("../models/AnimalBreed");

class UserNotFoundException extends Error {
  constructor(message) {
    super(message);
    this.code = "USER_NOT_FOUND";
    this.message = "This user does not exists";
    this.status = 404;
  }
}

class UserBadRequestException extends Error {
  constructor(message) {
    super(message);
    this.code = "USER_NOT_FOUND";
    this.message = "This user does not exists";
    this.status = 400;
  }
}

/**
 * @param {Express.Application} app
 * @param {Router} router
 */
module.exports = function (app, router) {
  router.get(
    "/users",
    [requireAuth, requireRoles(["ADMIN"])],
    async (req, res) => {
      res.send(await User.findAll());
    }
  );
  router.get("/users/@me", [requireAuth], async (req, res) => {
    res.send(req.user);
  });

  // Get all animals of the authenticated user
  router.get("/users/@me/animals", [requireAuth], async (req, res) => {
    try {
      const animals = await Animal.findAll({
        where: { user_id: req.user.id },
        include: [
          { model: AnimalType, as: "type", attributes: ["id", "code", "name"] },
          { model: AnimalBreed, as: "breed", attributes: ["id", "code", "name"] },
        ],
        order: [["createdAt", "DESC"]],
      });
      res.send(animals);
    } catch (error) {
      console.error("Error fetching user animals:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la récupération des animaux",
      });
    }
  });
};
