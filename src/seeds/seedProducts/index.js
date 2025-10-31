const seedPurinaOne = require("./seedPurinaOne");

module.exports = async function seedAllProducts(options = {}) {

    await seedPurinaOne(options);

    console.log("✅ Seeded all product entries");
};
