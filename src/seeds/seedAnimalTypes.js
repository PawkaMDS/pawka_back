const AnimalType = require("../models/AnimalType");

module.exports = async function seedAnimalTypes() {
    const rows = [
        { code: "dog", name: "Chien" },
        { code: "cat", name: "Chat" },
    ];

    for (const r of rows) {
        await AnimalType.upsert(r);
    }

    console.log("✅ AnimalTypes seeded");
};
