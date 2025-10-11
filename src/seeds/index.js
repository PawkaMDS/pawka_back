const seedFoodTypes = require("./seedFoodTypes");
const seedAnimalTypes = require("./seedAnimalTypes");
const seedAnimalBreeds = require("./seedAnimalBreeds");
const seedProductTypes = require("./seedProductTypes");

module.exports = async function seedAll(db) {
    await db.transaction(async (t) => {
        await seedFoodTypes({ transaction: t });
        await seedAnimalTypes({ transaction: t });
        await seedAnimalBreeds({ transaction: t });
        await seedProductTypes({ transaction: t });
    });
    console.log("🌱 All seeds executed successfully");
};
