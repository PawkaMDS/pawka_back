const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const FoodType = sequelize.define(
    'FoodType',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'food_types',
    }
);

module.exports = FoodType;
