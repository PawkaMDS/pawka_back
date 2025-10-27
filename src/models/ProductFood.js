const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const ProductFood = sequelize.define(
    'ProductFood',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'products', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        animal_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'animal_types', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        food_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'food_types', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        ingredients: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        life_stages: {
            type: DataTypes.ENUM(['puppy', 'adult', 'senior', 'kitten']),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        tableName: 'product_foods',
    }
);

module.exports = ProductFood;
