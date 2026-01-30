const Product = require("../../models/Product");
const ProductType = require("../../models/ProductType");
const AnimalType = require("../../models/AnimalType");
const FoodType = require("../../models/FoodType");
const ProductFood = require("../../models/ProductFood");

module.exports = async function seedPurinaOne(options = {}) {
    const tx = options.transaction;
    const productType = await ProductType.findOne({ where: { code: "food" }, transaction: tx });
    const animalType = await AnimalType.findOne({ where: { code: "cat" }, transaction: tx });
    const foodType = await FoodType.findOne({ where: { code: "kibble" }, transaction: tx });
    const EAN = "7613035845084";

    const [productInstance] = await Product.upsert(
        {
            code_ean: EAN,
            name: "Purina ONE - Croquettes Chat Stérilisé Truite & Blé",
            brand: "Purina One",
            image_url: "https://images.openpetfoodfacts.org/images/products/761/303/584/5084/front_fr.16.400.jpg",
            is_verified: true,
            certification: "Ce produit contient plusieurs ingrédients peu qualitatifs (sous-produits animaux, colorants, céréales en excès). Il peut convenir ponctuellement, mais n’est pas recommandé pour un usage quotidien, surtout chez les animaux sensibles ou stérilisés.",
            type_id: productType.id,
        },
        { transaction: tx, returning: true }
    );
    const product = productInstance?.id
        ? productInstance
        : await Product.findOne({ where: { code_ean: EAN }, transaction: tx });
    const productId = product.id;

    await ProductFood.upsert({
        product_id: productId,
        animal_type_id: animalType.id,
        food_type_id: foodType.id,
        moisture_percent: foodType.default_moisture ?? null,
        sources: "Open Pet Food Facts (code-barres 7613035845084)",
        ingredients: "Truite (15 %) (dont tête, arête, chair), Protéines de volaille déshydratées, Blé (14 %), Farine de soja, Farine de protéines de maïs, Maïs, Gluten de blé, Graisses animales, Pulpe de betterave déshydratée, Racine de chicorée séchée (2 %), Fibres végétales déshydratées, Substances minérales, Hydrolysat (avec ajout de 0,025 % de poudre de Lactobacillus Delbrueckii et Fermentum traitée thermiquement), Levures déshydratées",
        analytical_composition:
        {
            "protein_percent": 37.0,
            "fat_percent": 13.0,
            "fiber_percent": 4.0,
            "ash_percent": 7.5,
            "moisture_percent": 10
        },
        life_stage: "adult",
        is_for_sterilised: true,
        breed_size: null,
        scores:
        {
            "protein_content": {
                "pt": 16,
                "pct": 80,
                "rationale": "37 % de protéines brutes ; bon niveau pour un aliment milieu-haut de gamme, avec une source animale principale (truite)."
            },
            "fat_content": {
                "pt": 8,
                "pct": 80,
                "rationale": "13 % de matières grasses, adapté pour chat stérilisé mais légèrement au-dessus de la moyenne idéale (10–12 %)."
            },
            "carbohydrate_content": {
                "pt": 4,
                "pct": 40,
                "rationale": "Présence notable de blé, maïs et soja ; donc teneur en glucides élevée, peu souhaitable pour un carnivore strict."
            },
            "fiber_content": {
                "pt": 3,
                "pct": 60,
                "rationale": "Fibres végétales autour de 4–5 %, niveau correct pour la digestion d’un chat stérilisé."
            },
            "ingredient_quality": {
                "pt": 10,
                "pct": 67,
                "rationale": "Truite nommée en premier ingrédient (positif), mais plusieurs composants végétaux de remplissage réduisent la qualité globale."
            },
            "protein_source_quality": {
                "pt": 11,
                "pct": 73,
                "rationale": "Truite bien identifiée, mais protéines de volaille et végétales peu détaillées."
            },
            "byproducts_presence": {
                "pt": 6,
                "pct": 60,
                "rationale": "Présence de graisses animales et d’hydrolysats sans précision ; possible utilisation de sous-produits."
            },
            "chemical_additives": {
                "pt": 7,
                "pct": 70,
                "rationale": "Sans colorants ni conservateurs artificiels ajoutés, mais présence d’additifs nutritionnels et antioxydants standards."
            },
            "beneficial_additives": {
                "pt": 4,
                "pct": 80,
                "rationale": "Racine de chicorée (prébiotique) et Lactobacillus ajoutés, bons pour la flore intestinale."
            }
        },
        analyzed_at: new Date("2025-10-30T00:00:00Z"),
        fediaf_conformity: null,
        has_chemical_additives: false,
        has_beneficial_additives: true,
        score_version: "0.0.1",
    }, { transaction: tx });

    console.log("✅ Seeded ProductFood (Purina One cat kibble)");
};
