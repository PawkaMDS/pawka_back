const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const AnimalType = sequelize.define(
    'AnimalType',
    {
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

module.exports = AnimalType;
