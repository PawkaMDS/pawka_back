const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const FoodType = sequelize.define(
    'FoodType',
    {
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
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
        indexes: [
            { unique: true, fields: ['code'] },
        ],
    }
);

module.exports = FoodType;
