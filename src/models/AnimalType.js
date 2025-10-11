const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const AnimalType = sequelize.define(
    'AnimalType',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
    },
    {
        timestamps: false,
        tableName: 'animal_types',
    }
);

module.exports = AnimalType;
