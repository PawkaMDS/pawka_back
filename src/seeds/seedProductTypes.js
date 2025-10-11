const ProductType = require("../models/ProductType");

module.exports = async function seedProductTypes() {
    const rows = [
        // 🦴 Alimentation
        { code: "food", name: "Alimentation" },
        { code: "treats", name: "Friandises" },
        { code: "supplements", name: "Compléments alimentaires" },

        // 🧸 Accessoires & jeux
        { code: "toys", name: "Jouets" },
        { code: "bed", name: "Couchages" },
        { code: "leash", name: "Laisses et harnais" },
        { code: "clothing", name: "Vêtements et accessoires" },

        // 💊 Santé & hygiène
        { code: "vitamins", name: "Vitamines et minéraux" },
        { code: "medication", name: "Médicaments et soins" },
        { code: "hygiene", name: "Hygiène et toilettage" },

        // 🏠 Entretien
        { code: "cleaning", name: "Produits de nettoyage" },
        { code: "litter", name: "Litières et accessoires" },
        { code: "bowls", name: "Gamelles et distributeurs" },
    ];

    for (const r of rows) {
        await ProductType.upsert(r);
    }

    console.log(`✅ Seeded product types`);
};
