// controllers/AnimalController.js (ou équivalent)
const { Router } = require("express");
const { Op } = require("sequelize");

const Animal = require("../models/Animal");
const AnimalType = require("../models/AnimalType");
const AnimalBreed = require("../models/AnimalBreed");

const Product = require("../models/Product");
const ProductFood = require("../models/ProductFood");
const FoodType = require("../models/FoodType");

const AnimalProductScore = require("../models/AnimalProductScore");

const requireAuthentication = require("../middlewares/require-auth");

const { adaptScoresToAnimalProfile } = require("../services/animalProductScoreService");

/**
 * Calcule la note totale 0-100 à partir du JSON scores (même logique que ton front)
 */
function computeTotalScore(scores) {
    if (!scores) return null;
    if (scores.adapted === false) return null;

    const keys = [
        "protein_content",
        "fat_content",
        "carbohydrate_content",
        "fiber_content",
        "ingredient_quality",
        "protein_source_quality",
        "byproducts_presence",
        "chemical_additives",
        "beneficial_additives",
    ];

    let total = 0;
    for (const k of keys) {
        const pt = scores?.[k]?.pt;
        if (typeof pt !== "number") return null;
        total += pt;
    }

    const rounded = Math.round(total);
    return Math.max(0, Math.min(100, rounded));
}

function ageInMonths(birthDate) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(0, months);
}

module.exports = function (app, router) {
    /**
     * Route GET /animals/:animalId/products/:productId/score
     * Renvoie la note personnalisée (animal+produit).
     * - cache DB via AnimalProductScore
     * - recalcul possible avec ?refresh=1
     */
    router.get(
        "/animals/:animalId/products/:productId/score",
        requireAuthentication,
        async (req, res) => {
            const { animalId, productId } = req.params;
            const refresh = req.query.refresh === "1";

            if (!animalId || !productId) {
                return res.status(400).json({ error: "animalId et productId sont requis" });
            }

            const rid = Math.random().toString(16).slice(2, 8);
            console.log(`➡️ [Route][${rid}] GET /animals/${animalId}/products/${productId}/score`);

            try {
                // 1) Charger l'animal (avec type + breed)
                const animal = await Animal.findOne({
                    where: { id: animalId },
                    include: [
                        { model: AnimalType, as: "type", attributes: ["id", "code", "name"] },
                        { model: AnimalBreed, as: "breed", attributes: ["id", "code", "name"], required: false },
                    ],
                });

                if (!animal) return res.status(404).json({ error: "Animal introuvable" });

                // Sécurité USER : l’animal doit appartenir au user connecté
                // (ADMIN peut tout voir)
                if (req.user?.role === "USER" && animal.user_id !== req.user.id) {
                    return res.status(403).json({ error: "Accès refusé à cet animal" });
                }

                // 2) Charger le produit avec ProductFood + AnimalType/FoodType (comme ton ProductController)
                const product = await Product.findOne({
                    where: { id: productId },
                    include: [
                        {
                            model: ProductFood,
                            as: "product_foods",
                            include: [
                                { model: AnimalType, as: "animal_type", attributes: ["id", "code", "name"] },
                                { model: FoodType, as: "food_type", attributes: ["id", "code", "name", "default_moisture"] },
                            ],
                        },
                    ],
                });

                if (!product) return res.status(404).json({ error: "Produit introuvable" });

                const pf = product.product_foods?.[0] || null;
                if (!pf) {
                    return res.status(422).json({ error: "Le produit n'a pas d'analyse ProductFood" });
                }

                // 3) Cache hit (si pas refresh)
                if (!refresh) {
                    const existing = await AnimalProductScore.findOne({
                        where: { animal_id: animal.id, product_id: product.id },
                    });

                    if (existing) {
                        return res.json({ status: "ok", cached: true, score: existing });
                    }
                }

                // 4) Type mismatch => scores = { adapted:false }
                const animalTypeCode = animal?.type?.code || null;
                const productAnimalTypeCode = pf?.animal_type?.code || null;

                if (animalTypeCode && productAnimalTypeCode && animalTypeCode !== productAnimalTypeCode) {
                    const [row] = await AnimalProductScore.upsert(
                        {
                            animal_id: animal.id,
                            product_id: product.id,
                            scores: { adapted: false },
                            score_version: `animal_adapt_${pf.score_version || "0.0.0"}`,
                            total_score: null,
                        },
                        { returning: true }
                    );

                    return res.json({ status: "ok", cached: false, score: row, mismatch: true });
                }

                // 5) Adaptation LLM (sans web)
                const animalProfile = {
                    id: animal.id,
                    name: animal.name,
                    animal_type_code: animalTypeCode, // cat|dog
                    birth_date: animal.birth_date,
                    age_months: ageInMonths(animal.birth_date),
                    weight_g: animal.weight,
                    is_sterilized: animal.is_sterilized,
                    breed_code: animal?.breed?.code || null,
                };

                const productContext = {
                    id: product.id,
                    code_ean: product.code_ean,
                    name: product.name,
                    brand: product.brand,
                    product_animal_type_code: productAnimalTypeCode,
                    product_food: {
                        life_stage: pf.life_stage,
                        is_for_sterilised: pf.is_for_sterilised,
                        breed_size: pf.breed_size,
                        ingredients: pf.ingredients,
                        analytical_composition: pf.analytical_composition,
                        base_scores: pf.scores, // le score “général produit” sert de base
                        sources: pf.sources,
                        score_version: pf.score_version,
                    },
                };

                const adaptedScores = await adaptScoresToAnimalProfile({
                    rid,
                    animal: animalProfile,
                    product: productContext,
                });

                const totalScore = computeTotalScore(adaptedScores);

                const scoreVersion = `animal_adapt_${pf.score_version || "0.0.0"}`;

                const [row] = await AnimalProductScore.upsert(
                    {
                        animal_id: animal.id,
                        product_id: product.id,
                        scores: adaptedScores,
                        score_version: scoreVersion,
                        total_score: totalScore,
                    },
                    { returning: true }
                );

                return res.json({ status: "ok", cached: false, score: row });
            } catch (error) {
                console.error(`❌ [Route][${rid}] Error GET /animals/:animalId/products/:productId/score:`, error);
                return res.status(error.statusCode || 500).json({
                    error: error.message || "Erreur interne lors du calcul de la note personnalisée",
                });
            }
        }
    );
};
