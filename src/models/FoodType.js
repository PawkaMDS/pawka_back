const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const FoodType = sequelize.define(
    'FoodType',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        default_moisture: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'food_types',
    }
);

module.exports = FoodType;
