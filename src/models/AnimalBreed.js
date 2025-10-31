const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const AnimalBreed = sequelize.define(
    'AnimalBreed',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true,
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
        indexes: [
            { unique: true, fields: ["code"] },
            { unique: true, fields: ["animal_type_id", "name"] },
        ],
    }
);

module.exports = AnimalBreed;
