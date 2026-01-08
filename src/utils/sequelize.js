const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,       // Nom de la base
  process.env.DB_USER,       // Utilisateur
  process.env.DB_PASS,       // Mot de passe
  {
    host: process.env.DB_HOST,          // Host PostgreSQL
    port: process.env.DB_PORT || 5432,  // Port par défaut 5432 si non défini
    dialect: process.env.DB_DIALECT || "postgres",  // Flexibilité
    logging: false,                     // true pour voir les requêtes SQL
    define: {
      underscored: true,                // snake_case pour les colonnes
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
