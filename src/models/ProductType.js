const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const ProductType = sequelize.define(
    'ProductType',
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
        tableName: 'product_types',
        indexes: [
            { unique: true, fields: ['code'], name: 'unique_product_type_code' },
        ],
    }
);

module.exports = ProductType;
