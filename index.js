require("dotenv").config();
require("express-async-errors");

const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");

const sequelize = require("./src/utils/sequelize");
require("./src/models");

const app = express();
const server = http.createServer(app);
const router = express.Router();

app.use(bodyParser.json());
app.use("/api", router);

// Routes/controllers
require("./src/controllers")(app, router);

// Error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
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

// Minimal setup to run the app
(async () => {
  try {
    await sequelize.authenticate();

    // Sync the DB
    await sequelize.sync({ alter: true });

    // Seed the DB (if needed)
    // const seedAll = require("./src/seeds");
    // await seedAll(sequelize);

    const port = Number(process.env.APP_PORT) || 8000;
    server.listen(port, () => {
      console.log(`Api listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Unable to start app:", err);
    process.exit(1);
  }
})();
