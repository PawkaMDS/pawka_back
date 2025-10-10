const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const AnimalType = sequelize.define(
    'AnimalType',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'animal_types',
    }
);

module.exports = AnimalType;
