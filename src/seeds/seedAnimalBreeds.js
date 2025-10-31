const AnimalType = require("../models/AnimalType");
const AnimalBreed = require("../models/AnimalBreed");

module.exports = async function seedAnimalBreeds() {
    const types = await AnimalType.findAll({
        where: { code: ["dog", "cat"] },
    });

    const typeByCode = Object.fromEntries(types.map(t => [t.code, t.id]));

    if (!typeByCode.dog || !typeByCode.cat) {
        throw new Error("❌ Missing AnimalType 'dog' or 'cat'. Please seed AnimalTypes first.");
    }

    const breeds = [
        // 🐶 DOGS
        { name: "Labrador Retriever", code: "labrador_retriever", type: "dog" },
        { name: "Berger Allemand", code: "german_shepherd", type: "dog" },
        { name: "Golden Retriever", code: "golden_retriever", type: "dog" },
        { name: "Beagle", code: "beagle", type: "dog" },
        { name: "Bouledogue Français", code: "french_bulldog", type: "dog" },
        { name: "Chihuahua", code: "chihuahua", type: "dog" },
        { name: "Rottweiler", code: "rottweiler", type: "dog" },
        { name: "Border Collie", code: "border_collie", type: "dog" },
        { name: "Cocker Spaniel", code: "cocker_spaniel", type: "dog" },
        { name: "Shiba Inu", code: "shiba_inu", type: "dog" },
        { name: "Husky Sibérien", code: "siberian_husky", type: "dog" },
        { name: "Dalmatien", code: "dalmatian", type: "dog" },
        { name: "Caniche", code: "poodle", type: "dog" },
        { name: "Staffordshire Bull Terrier", code: "staffordshire_bull_terrier", type: "dog" },
        { name: "Jack Russell Terrier", code: "jack_russell_terrier", type: "dog" },

        // 🐱 CATS
        { name: "Européen (gouttière)", code: "domestic_shorthair", type: "cat" },
        { name: "Maine Coon", code: "maine_coon", type: "cat" },
        { name: "Siamois", code: "siamese", type: "cat" },
        { name: "British Shorthair", code: "british_shorthair", type: "cat" },
        { name: "Bengal", code: "bengal", type: "cat" },
        { name: "Persan", code: "persian", type: "cat" },
        { name: "Sphynx", code: "sphynx", type: "cat" },
        { name: "Ragdoll", code: "ragdoll", type: "cat" },
        { name: "Chartreux", code: "chartreux", type: "cat" },
        { name: "Norvégien", code: "norwegian_forest_cat", type: "cat" },
        { name: "Abyssin", code: "abyssinian", type: "cat" },
        { name: "Exotic Shorthair", code: "exotic_shorthair", type: "cat" },
        { name: "Burmese", code: "burmese", type: "cat" },
        { name: "Scottish Fold", code: "scottish_fold", type: "cat" },
        { name: "Oriental", code: "oriental_shorthair", type: "cat" },
    ];

    const rows = breeds.map(b => ({
        name: b.name,
        code: b.code,
        animal_type_id: typeByCode[b.type],
    }));

    for (const breed of rows) {
        await AnimalBreed.upsert(breed);
    }

    console.log(`✅ Seeded animal breeds (dogs & cats)`);
};
