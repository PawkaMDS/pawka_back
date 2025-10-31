const seedPurinaOne = require("./seedPurinaOne");
const seedRoyalCanin = require("./seedRoyalCanin");

module.exports = async function seedAllProducts(options = {}) {

    await seedPurinaOne(options);
    await seedRoyalCanin(options);

    console.log("✅ Seeded all product entries");
};
