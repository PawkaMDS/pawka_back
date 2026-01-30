const User = require("../models/User");
const AnimalType = require("../models/AnimalType");
const AnimalBreed = require("../models/AnimalBreed");
const Animal = require("../models/Animal");

module.exports = async function seedAnimals(options = {}) {
    const tx = options.transaction;

    // 1) Find premiumUser (premium user)
    const premiumUser = await User.findOne({
        where: { email: "user1@gmail.com" },
        transaction: tx,
    });

    if (!premiumUser) {
        throw new Error("❌ User premiumUser (user1@gmail.com) not found. Please seed users first.");
    }

    // 2) Fetch animal types
    const [dogType, catType] = await Promise.all([
        AnimalType.findOne({ where: { code: "dog" }, transaction: tx }),
        AnimalType.findOne({ where: { code: "cat" }, transaction: tx }),
    ]);

    if (!dogType || !catType) {
        throw new Error("❌ Missing AnimalTypes. Please seed AnimalTypes first.");
    }

    // 3) Fetch breeds
    const [poodleBreed, maineCoonBreed] = await Promise.all([
        AnimalBreed.findOne({
            where: { code: "poodle", animal_type_id: dogType.id },
            transaction: tx,
        }),
        AnimalBreed.findOne({
            where: { code: "maine_coon", animal_type_id: catType.id },
            transaction: tx,
        }),
    ]);

    if (!poodleBreed) {
        throw new Error("❌ Missing breed 'poodle'. Please seed AnimalBreeds first.");
    }
    if (!maineCoonBreed) {
        throw new Error("❌ Missing breed 'maine_coon'. Please seed AnimalBreeds first.");
    }

    // 4) Create / upsert animals for premiumUser
    // NOTE: Since Animal has no unique constraint shown, upsert needs a stable unique key.
    // If you don't have one, we can emulate "upsert" by findOne+create.
    // Here we do findOrCreate style to avoid duplicates by (user_id + name).
    const animals = [
        {
            name: "Milo", // Caniche
            user_id: premiumUser.id,
            animal_type_id: dogType.id,
            breed_id: poodleBreed.id,
            birth_date: "2025-10-10",
            weight: 2000, // grams (2kg)
            is_sterilized: true,
        },
        {
            name: "Luna", // Maine Coon
            user_id: premiumUser.id,
            animal_type_id: catType.id,
            breed_id: maineCoonBreed.id,
            birth_date: "2021-08-20",
            weight: 5500, // grams (5.5kg)
            is_sterilized: true,
        },
    ];

    for (const a of animals) {
        const existing = await Animal.findOne({
            where: { user_id: a.user_id, name: a.name },
            transaction: tx,
        });

        if (existing) {
            await existing.update(a, { transaction: tx });
        } else {
            await Animal.create(a, { transaction: tx });
        }
    }

    console.log("✅ Animals seeded for premiumUser (Poodle + Maine Coon)");
};
