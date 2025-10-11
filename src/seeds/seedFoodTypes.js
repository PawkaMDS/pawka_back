const FoodType = require('../models/FoodType');

module.exports = async function seedFoodTypes() {
    const rows = [
        { code: "kibble", name: "Croquettes", default_moisture: 10 },
        { code: "wet", name: "Pâtée", default_moisture: 78 },
        { code: "treat", name: "Friandises", default_moisture: 30 },
        { code: "raw", name: "Ration crue (BARF)", default_moisture: 70 },
        { code: "air_dried", name: "Viande sechée", default_moisture: 5 },
    ];

    for (const r of rows) {
        await FoodType.upsert(r);
    }
    console.log("✅ FoodTypes seeded");
};
