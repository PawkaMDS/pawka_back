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
        icon_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
            comment: "Icon identifier used by the frontend to map to a local asset",
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
