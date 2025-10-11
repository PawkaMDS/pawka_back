const seedFoodTypes = require("./seedFoodTypes");

async function seedAll() {
    await seedFoodTypes();
}

module.exports = seedAll;