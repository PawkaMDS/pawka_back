const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");

const Animal = sequelize.define(
    "Animal",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        // FK → users.id
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        animal_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "animal_types", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },

        breed_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "animal_breeds", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },

        birth_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        weight: {
            type: DataTypes.INTEGER, // en grammes
            allowNull: true,
        },

        is_sterilized: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: "animals",
        indexes: [
            { fields: ["user_id"] },
            { fields: ["animal_type_id"] },
            { fields: ["breed_id"] },
        ],
    }
);

module.exports = Animal;
