const { DataTypes } = require('sequelize');
const sequelize = require('../utils/sequelize');

const SearchHistoryItem = sequelize.define(
    'SearchHistoryItem',
    {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'search_history_items',
        indexes: [
            { unique: true, fields: ['user_id', 'product_id'] },
        ],
    }
);

module.exports = SearchHistoryItem;
