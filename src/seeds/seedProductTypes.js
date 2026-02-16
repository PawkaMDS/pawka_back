const ProductType = require("../models/ProductType");

module.exports = async function seedProductTypes() {
    const rows = [
        // 🦴 Alimentation
        { code: "food", name: "Alimentation", icon_name: "food" },
        { code: "treats", name: "Friandises", icon_name: "treats" },
        { code: "supplements", name: "Compléments alimentaires", icon_name: "supplements" },

        // 🧸 Accessoires & jeux
        { code: "toys", name: "Jouets", icon_name: "toys" },
        { code: "bed", name: "Couchages", icon_name: "bed" },
        { code: "leash", name: "Laisses et harnais", icon_name: "leash" },
        { code: "clothing", name: "Vêtements et accessoires", icon_name: "clothing" },

        // 💊 Santé & hygiène
        { code: "vitamins", name: "Vitamines et minéraux", icon_name: "vitamins" },
        { code: "medication", name: "Médicaments et soins", icon_name: "medication" },
        { code: "hygiene", name: "Hygiène et toilettage", icon_name: "hygiene" },

        // 🏠 Entretien
        { code: "cleaning", name: "Produits de nettoyage", icon_name: "cleaning" },
        { code: "litter", name: "Litières et accessoires", icon_name: "litter" },
        { code: "bowls", name: "Gamelles et distributeurs", icon_name: "bowls" },
    ];

    for (const r of rows) {
        await ProductType.upsert(r);
    }

    console.log(`✅ Seeded product types`);
};
