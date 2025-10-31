
const { Router } = require("express");
const { Op } = require("sequelize");
const sequelize = require("../utils/sequelize"); // Assurez-vous que le chemin est correct
const Product = require("../models/Product"); // Assurez-vous que le chemin est correct
const ProductType = require("../models/ProductType"); // Assurez-vous que le chemin est correct
const AnimalType = require("../models/AnimalType"); // Assurez-vous que le chemin est correct
const FoodType = require("../models/FoodType"); // Assurez-vous que le chemin est correct
const ProductFood = require("../models/ProductFood"); // Assurez-vous que le chemin est correct

/**
 * Configure les routes pour la gestion des produits.
 *
 * @param {Express.Application} app L'application Express (non utilisé ici, mais maintenu pour la signature).
 * @param {Router} router Le routeur Express où les routes seront définies.
 */
module.exports = function (app, router) {

    /**
     * Route POST /products
     * Crée un nouveau Product et l'enregistrement ProductFood associé en utilisant une transaction.
     */
    router.post("/products", async (req, res) => {
        const t = await sequelize.transaction();

        try {
            const data = req.body;

            if (!data.code_ean) {
                return res.status(400).json({ error: "Le code EAN est requis" });
            }

            // Vérifie si le produit existe déjà
            // NOTE: Cette vérification n'est pas dans la transaction car elle est utilisée pour un contrôle
            // immédiat et pourrait causer des problèmes de deadlock si l'index unique existe.
            const existing = await Product.findOne({ where: { code_ean: data.code_ean } });
            if (existing) {
                return res.status(409).json({ error: "Produit déjà existant avec ce code EAN" });
            }

            // Vérification des références (productType, animalType, foodType)
            const productType = await ProductType.findOne({ where: { code: data.product_type_code }, transaction: t });
            const animalType = await AnimalType.findOne({ where: { code: data.animal_type_code }, transaction: t });
            const foodType = await FoodType.findOne({ where: { code: data.food_type_code }, transaction: t });

            if (!productType || !animalType || !foodType) {
                await t.rollback();
                return res.status(400).json({
                    error: "Codes invalides : product_type_code, animal_type_code ou food_type_code manquant ou incorrect",
                });
            }

            // Création du produit
            const product = await Product.create(
                {
                    code_ean: data.code_ean,
                    name: data.name,
                    brand: data.brand,
                    image_url: data.image_url,
                    is_verified: data.is_verified ?? false,
                    type_id: productType.id,
                },
                { transaction: t }
            );

            // Création de la fiche ProductFood associée
            const productFood = await ProductFood.create(
                {
                    product_id: product.id,
                    animal_type_id: animalType.id,
                    food_type_id: foodType.id,
                    ingredients: data.ingredients ?? null,
                    life_stage: data.life_stage ?? null,
                    is_for_sterilised: data.is_for_sterilised ?? false,
                    breed_size: data.breed_size ?? null,
                    moisture_percent: data.moisture_percent ?? foodType.default_moisture ?? null,
                    scores: data.scores ?? null,
                    analyzed_at: data.analyzed_at ?? null,
                    fediaf_conformity: data.fediaf_conformity ?? null,
                    has_chemical_additives: data.has_chemical_additives ?? false,
                    has_beneficial_additives: data.has_beneficial_additives ?? false,
                    sources: data.sources ?? null,
                    score_version: data.score_version ?? "1.0.0",
                },
                { transaction: t }
            );

            await t.commit();

            return res.status(201).json({
                message: "Produit créé avec succès",
                product,
                productFood,
            });
        } catch (error) {
            await t.rollback();
            console.error("❌ Erreur POST /products:", error);
            return res.status(500).json({ error: "Erreur interne lors de la création du produit" });
        }
    });

    /**
     * Route GET /products/ean/:code_ean
     * Récupère un produit par son code EAN avec ses relations.
     */
    router.get("/products/ean/:code_ean", async (req, res) => {
        try {
            const { code_ean } = req.params;

            if (!code_ean) {
                // Bien que l'EAN soit dans les params, cette vérification est bonne pratique
                return res.status(400).json({ error: "Le code EAN est requis" });
            }

            const product = await Product.findOne({
                where: { code_ean },
                include: [
                    {
                        model: ProductType,
                        as: "type",
                        attributes: ["id", "code", "name"],
                    },
                    {
                        model: ProductFood,
                        as: "product_foods",
                        // L'association est probablement HasOne/HasMany, si c'est HasMany,
                        // vous pourriez avoir plusieurs product_foods. Si c'est HasOne,
                        // 'product_foods' devrait être 'productFood'. J'utilise le nom de l'alias d'origine.
                        include: [
                            {
                                model: AnimalType,
                                as: "animal_type",
                                attributes: ["id", "code", "name"],
                            },
                            {
                                model: FoodType,
                                as: "food_type",
                                attributes: ["id", "code", "name", "default_moisture"],
                            },
                        ],
                    },
                ],
            });

            if (!product) {
                return res.status(404).json({ error: "Produit introuvable" });
            }

            return res.json(product);
        } catch (error) {
            console.error("❌ Erreur GET /products/ean/:code_ean:", error);
            return res.status(500).json({ error: "Erreur interne lors de la récupération du produit" });
        }
    });


   router.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["id", "name", "brand", "image_url"],
      include: [
        {
          model: ProductFood,
          as: "product_foods",
          attributes: ["scores"] // on récupère tout, mais on filtrera après
        }
      ]
    });

    // Transformation pour ne garder que pt et pct
    const lightProducts = products.map(prod => {
      const scoresRaw = prod.product_foods[0]?.scores || {};
      const filteredScores = {};

            for (const [key, value] of Object.entries(scoresRaw)) {
                filteredScores[key] = {
                pt: value.pt,
                pct: value.pct
                };
            }

            return {
                id: prod.id,
                name: prod.name,
                brand: prod.brand,
                image_url: prod.image_url,
                scores: filteredScores
            };
            });

            res.json(lightProducts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    });

};
