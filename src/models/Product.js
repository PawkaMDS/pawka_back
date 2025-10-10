const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const Product = sequelize.define(
    'Product',
    {
        code_ean: {
            type: DataTypes.STRING(14),
            allowNull: true,
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
    }
);

module.exports = Product;
