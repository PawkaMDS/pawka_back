require("dotenv").config();
require("express-async-errors");

const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors"); // <--- AJOUTÉ

const sequelize = require("./src/utils/sequelize");
require("./src/models");

const app = express();

// --- MIDDLEWARES GLOBAUX ---
// 1. Autoriser les requêtes venant de l'extérieur (ton APK mobile)
app.use(cors()); 

// 2. Analyser les corps de requêtes JSON
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);
const router = express.Router();

// --- ROUTES ---
// On branche le routeur sur le préfixe /api
app.use("/api", router);

// Chargement de tes contrôleurs (authentification, etc.)
require("./src/controllers")(app, router);

// --- GESTION DES ERREURS ---
app.use((error, req, res, next) => {
  console.log("Erreur détectée :", error);
  if (error?.status) {
    res.status(error.status).send({
      code: error.code,
      message: error.message,
    });
  } else {
    res.status(500).send({
      code: "SERVER_ERROR",
      message: "Internal Server Error",
    });
  }
});

// --- DÉMARRAGE DU SERVEUR ---
(async () => {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log("Database connected.");

    // Le port doit correspondre à ce que Coolify attend (souvent 3000)
    const port = Number(process.env.APP_PORT) || 3000;
    
    // On écoute sur 0.0.0.0 pour être accessible de l'extérieur du container
    server.listen(port, "0.0.0.0", () => {
      console.log(`Api listening at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("Unable to start app:", err);
    process.exit(1);
  }
})();