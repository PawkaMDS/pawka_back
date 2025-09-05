const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");

const User = sequelize.define(
  "User",
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM(["USER", "ADMIN", "OWNER"]),
      allowNull: false,
      defaultValue: "USER",
    },
  },
  {
    indexes: [
      { 'unique': true, fields: ['email'] },
    ],
    defaultScope: {
      attributes: { exclude: ["password"] }, // Par défaut, on exclut le mot de passe
    },
    scopes: {
      withPassword: { attributes: {} }, // Utilise ce scope si tu as besoin du mot de passe
    },
  }
);

module.exports = User;
