// src/services/productCreateService.js
const { Product, ProductFood, ProductType, AnimalType, FoodType } = require("../models");
const sequelize = require("../utils/sequelize");

/**
 * Calcule le score total (0-100) à partir du JSON scores
 */
function calculateTotalScore(scores) {
    if (!scores) return null;

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

async function createProductFromPayload(data, { allowExisting = true } = {}) {
    const t = await sequelize.transaction();

    try {
        if (!data?.code_ean) {
            const err = new Error("Le code EAN est requis");
            err.statusCode = 400;
            throw err;
        }

        // Re-check hors transaction pour limiter deadlocks
        const existing = await Product.findOne({
            where: { code_ean: data.code_ean },
            include: [{ model: ProductFood, as: "product_foods" }],
        });

        if (existing) {
            if (!allowExisting) {
                const err = new Error("Produit déjà existant avec ce code EAN");
                err.statusCode = 409;
                throw err;
            }
            await t.rollback();
            return { status: "already_exists", product: existing };
        }

        const productType = await ProductType.findOne({ where: { code: data.product_type_code }, transaction: t });
        const animalType = await AnimalType.findOne({ where: { code: data.animal_type_code }, transaction: t });
        const foodType = await FoodType.findOne({ where: { code: data.food_type_code }, transaction: t });

        if (!productType || !animalType || !foodType) {
            const err = new Error("Codes invalides : product_type_code, animal_type_code ou food_type_code manquant ou incorrect");
            err.statusCode = 400;
            throw err;
        }

        const product = await Product.create(
            {
                code_ean: data.code_ean,
                name: data.name,
                brand: data.brand,
                image_url: data.image_url,
                is_verified: data.is_verified ?? false,
                certification: data.certification ?? null,
                type_id: productType.id,
            },
            { transaction: t }
        );

        const productFood = await ProductFood.create(
            {
                product_id: product.id,
                animal_type_id: animalType.id,
                food_type_id: foodType.id,
                ingredients: data.ingredients ?? null,
                life_stage: data.life_stage ?? null,
                is_for_sterilised: data.is_for_sterilised ?? null,
                breed_size: data.breed_size ?? null,

                // moisture_percent : si null dans l'IA, fallback au default du foodType
                moisture_percent: data.moisture_percent ?? foodType.default_moisture ?? null,

                analytical_composition: data.analytical_composition ?? null,
                scores: data.scores ?? null,

                analyzed_at: data.analyzed_at ?? new Date(),
                fediaf_conformity: data.fediaf_conformity ?? null,
                has_chemical_additives: data.has_chemical_additives ?? null,
                has_beneficial_additives: data.has_beneficial_additives ?? null,
                sources: data.sources ?? null,
                score_version: data.score_version ?? "0.0.2",
                total_score: data.total_score ?? calculateTotalScore(data.scores),
            },
            { transaction: t }
        );

        await t.commit();

        // Recharge avec include pour renvoyer un objet complet
        const full = await Product.findOne({
            where: { id: product.id },
            include: [{ model: ProductFood, as: "product_foods" }],
        });

        return { status: "created", product: full, productFood };
    } catch (error) {
        await t.rollback();

        // Si course condition + unique constraint -> on renvoie already_exists
        if (error?.name === "SequelizeUniqueConstraintError") {
            const existing = await Product.findOne({
                where: { code_ean: data.code_ean },
                include: [{ model: ProductFood, as: "product_foods" }],
            });
            return { status: "already_exists", product: existing };
        }

        throw error;
    }
}

module.exports = { createProductFromPayload, calculateTotalScore };