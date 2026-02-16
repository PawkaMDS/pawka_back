const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");

const AnimalProductScore = sequelize.define(
    "AnimalProductScore",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        animal_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "animals", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "products", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            onDelete: "RESTRICT",
        },

        scores: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
            comment: "JSON object containing detailed score metrics (per animal/per product)",
        },

        score_version: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Version of the scoring algorithm used",
        },

        total_score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: "Overall score for this product, for this animal",
        },
    },
    {
        tableName: "animal_product_scores",
        underscored: true,
        indexes: [
            { fields: ["animal_id"] },
            { fields: ["product_id"] },
            {
                unique: true,
                fields: ["animal_id", "product_id"],
                name: "animal_product_scores_animal_id_product_id_uq",
            },
        ],
    }
);

module.exports = AnimalProductScore;
