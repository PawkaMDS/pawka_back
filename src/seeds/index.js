const seedFoodTypes = require("./seedFoodTypes");
const seedAnimalTypes = require("./seedAnimalTypes");

async function seedAll() {
    await seedFoodTypes();
    await seedAnimalTypes();
}

module.exports = seedAll;