const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const AnimalBreed = sequelize.define(
    'AnimalBreed',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        animal_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'animal_types',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    {
        timestamps: false,
        tableName: 'animal_breeds',
    }
);

module.exports = AnimalBreed;
