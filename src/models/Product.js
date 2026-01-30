const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const Product = sequelize.define(
    'Product',
    {
        code_ean: {
            type: DataTypes.STRING(14),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        certification: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'product_types',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    {
        tableName: 'products',
        indexes: [
            {
                unique: true,
                fields: ['code_ean'],
                name: 'products_code_ean_uq',
            },
        ],
        validate: {
            certificationRequiredIfVerified() {
                if (this.is_verified && !this.certification) {
                    throw new Error('La certification est requise pour un produit vérifié.');
                }
            },
        },
    }
);

module.exports = Product;