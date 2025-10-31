const Product = require("../../models/Product");
const ProductType = require("../../models/ProductType");
const AnimalType = require("../../models/AnimalType");
const FoodType = require("../../models/FoodType");
const ProductFood = require("../../models/ProductFood");

module.exports = async function seedRoyalCanin(options = {}) {
    const tx = options.transaction;
    const productType = await ProductType.findOne({ where: { code: "food" }, transaction: tx });
    const animalType = await AnimalType.findOne({ where: { code: "dog" }, transaction: tx });
    const foodType = await FoodType.findOne({ where: { code: "kibble" }, transaction: tx });
    const EAN = "3182550727822";

    const [productInstance] = await Product.upsert(
        {
            code_ean: EAN,
            name: "Royal Canin - Croquettes Mini Adult Pour Chien",
            brand: "Royal Canin",
            image_url: "https://images.openpetfoodfacts.org/images/products/318/255/072/7822/front_fr.4.400.jpg",
            is_verified: false,
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
        sources: "Open Pet Food Facts (code-barres 3182550727822)",
        ingredients: "Déshydratated poultry protein, maize, maize flour, animal fats, maize gluten, vegetable protein isolate*, wheat, hydrolysed animal proteins, rice, beet pulp, minerals, fish oil, soya oil, yeasts and parts thereof, fructo-oligo-saccharides", 
        analytical_composition:
        {
            "protein_percent": 27.0,
            "fat_percent": 16.0,
            "ash_percent": 5.3,
            "fiber_percent": 1.3
        },
        life_stage: "adult",
        is_for_sterilised: null,
        breed_size: "small",
        scores:
        {
            "protein_content": {
                "pt": 17,
                "pct": 85,
                "rationale": "Teneur en protéines brute de 27 % annoncée, correcte pour un chien adulte de petite race."
            },
            "fat_content": {
                "pt": 10,
                "pct": 100,
                "rationale": "Taux de matières grasses de 16 % déclaré, ce qui est élevé mais adapté aux besoins énergétiques des petites races adultes."
            },
            "carbohydrate_content": {
                "pt": 3,
                "pct": 30,
                "rationale": "Glucides non explicitement détaillés, mais la liste d’ingrédients commence par maïs, farine de maïs, etc. Indique une proportion de glucides assez importante."
            },
            "fiber_content": {
                "pt": 4,
                "pct": 80,
                "rationale": "Fibres brutes annoncées ~1.3 % dans certaines sources. Pour un aliment sec pour petit chien, c’est un niveau faible mais cohérent."
            },
            "ingredient_quality": {
                "pt": 8,
                "pct": 53.3,
                "rationale": "Ingrédients décrits : protéines de volaille déshydratées bien identifiées (positif), mais nombreux céréales (maïs, maïs farine, blé) et isolats de protéines végétales."
            },
            "protein_source_quality": {
                "pt": 9,
                "pct": 60,
                "rationale": "La source principale est bien nommée « dehydrated poultry protein », mais on trouve aussi « vegetable protein isolate » et protéines hydrolysées non complètement détaillées."
            },
            "byproducts_presence": {
                "pt": 5,
                "pct": 50,
                "rationale": "Présence possible de sous-produits : «animal fats», «hydrolysed animal proteins», «vegetable protein isolate» – ce sont des ingrédients moins transparents."
            },
            "chemical_additives": {
                "pt": 6,
                "pct": 60,
                "rationale": "Contient additifs nutritionnels (vitamines, L-carnitine) et antioxydants. Classification mixte car certains additifs sont utiles mais tout n’est pas clairement listé."
            },
            "beneficial_additives": {
                "pt": 3,
                "pct": 60,
                "rationale": "Contient FOS (fructo-oligo-saccharides) et huiles de poisson (EPA/DHA) pour peau/poil – bons additifs, mais pas ultra haut de gamme."
            }
        },
        analyzed_at: new Date("2025-10-30T00:00:00Z"),
        fediaf_conformity: null,
        has_chemical_additives: true,
        has_beneficial_additives: true,
        score_version: "0.0.1",
    }, { transaction: tx });

    console.log("✅ Seeded ProductFood (Royal Canin Croquettes Mini Adult Pour Chien)");
};
