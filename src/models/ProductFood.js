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
        life_stage: {
            type: DataTypes.ENUM(['puppy', 'adult', 'senior', 'kitten']),
            allowNull: true,
        },
        is_for_sterilised: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        breed_size: {
            type: DataTypes.ENUM(['toy', 'small', 'medium', 'large', 'giant']),
            allowNull: true,
        },
        moisture_percent: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
        scores: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
            comment: "JSON object containing various score metrics for the product food",
        },
        analyzed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        fediaf_conformity: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        has_chemical_additives: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        has_beneficial_additives: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        sources: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Source(s) of product information for analysis",
        },
        score_version: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Version of the scoring algorithm used for analysis",
        },
    },
    {
        timestamps: false,
        tableName: 'product_foods',
    }
);

module.exports = ProductFood;
