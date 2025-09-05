const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");
const Restaurant = require("./Restaurant");

const Dish = sequelize.define("Dish", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Restaurant,
      key: "id",
    },
    allowNull: false
  },
});

module.exports = Dish;
