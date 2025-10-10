const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const ProductType = sequelize.define(
    'ProductType',
    {
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: 'product_types',
    }
);

module.exports = ProductType;
