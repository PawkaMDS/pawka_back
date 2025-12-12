const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { Op } = require("sequelize");
const sequelize = require("../utils/sequelize"); // Assurez-vous que le chemin est correct
const Product = require("../models/Product"); // Assurez-vous que le chemin est correct
const ProductType = require("../models/ProductType"); // Assurez-vous que le chemin est correct
const AnimalType = require("../models/AnimalType"); // Assurez-vous que le chemin est correct
const FoodType = require("../models/FoodType"); // Assurez-vous que le chemin est correct
const ProductFood = require("../models/ProductFood"); // Assurez-vous que le chemin est correct
const SearchHistoryItem = require("../models/SearchHistoryItem");
const requireRoles = require("../middlewares/require-role");
const requireAuthentication = require("../middlewares/require-auth");
const User = require("../models/User");

const { analyzeProductBarcode } = require("../services/productAnalysisService");

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
                    analytical_composition: data.analytical_composition ?? {
                        protein_percent: data.protein_percent ?? null,
                        fat_percent: data.fat_percent ?? null,
                        fiber_percent: data.fiber_percent ?? null,
                        ash_percent: data.ash_percent ?? null,
                    },
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

    /**
 * Route GET /products/:id
 * Récupère un produit par son id avec ses relations et creer dans History
 * une nouvelle entrée.
 */
    router.get("/products/:id", async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: "L'ID du produit est requis" });
            }

            // Vérification du token JWT
            const token = req.headers.authorization?.split(" ")?.[1];
            if (!token) {
                return res.status(401).json({ message: "Token manquant" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ where: { id: decoded.id } });
            if (!user) {
                return res.status(401).json({ message: "Utilisateur non trouvé" });
            }

            // Récupération du produit
            const product = await Product.findOne({
                where: { id },
                include: [
                    { model: ProductType, as: "type", attributes: ["id", "code", "name"] },
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

            if (!product) {
                return res.status(404).json({ error: "Produit introuvable" });
            }

            // Historique : supprimer l'ancienne entrée si elle existe
            await SearchHistoryItem.destroy({
                where: { user_id: user.id, product_id: product.id },
            });

            // Créer la nouvelle entrée
            await SearchHistoryItem.create({
                user_id: user.id,
                product_id: product.id,
                created_at: new Date(),
            });

            return res.json(product);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ type: "TOKEN_EXPIRED" });
            }
            console.error("❌ Erreur GET /products/:id:", error);
            return res.status(500).json({ error: "Erreur interne lors de la récupération du produit" });
        }
    });


    /**
      * Route GET /products
      * Récupère tout les produits sans détails des critères.
      */
    router.get("/products", async (req, res) => {
        try {
            const { animal_type, food_type } = req.query;

            const productFoodInclude = {
                model: ProductFood,
                as: "product_foods",
                attributes: ["scores", "analytical_composition", "moisture_percent"],
                include: []
            };

            if (animal_type) {
                productFoodInclude.include.push({
                    model: AnimalType,
                    as: "animal_type",
                    where: { code: animal_type },
                    attributes: ["id", "code", "name"],
                    required: true
                });
            } else {
                productFoodInclude.include.push({
                    model: AnimalType,
                    as: "animal_type",
                    attributes: ["id", "code", "name"],
                    required: false
                });
            }

            if (food_type) {
                productFoodInclude.include.push({
                    model: FoodType,
                    as: "food_type",
                    where: { code: food_type },
                    attributes: ["id", "code", "name"],
                    required: true
                });
            } else {
                productFoodInclude.include.push({
                    model: FoodType,
                    as: "food_type",
                    attributes: ["id", "code", "name"],
                    required: false
                });
            }

            const products = await Product.findAll({
                attributes: ["id", "name", "brand", "image_url"],
                include: [
                    productFoodInclude,
                    {
                        model: ProductType,
                        as: "type",
                        attributes: ["id", "code", "name"],
                        required: false
                    }
                ]
            });

            // Filtrer les produits qui n'ont pas de ProductFood correspondant si filtre appliqué
            const filteredProducts = products.filter(p => p.product_foods.length > 0);

            // Transformer scores pour ne garder que pt et pct
            const lightProducts = filteredProducts.map(prod => {
                const pf = prod.product_foods[0]; // on prend le premier ProductFood
                const scoresRaw = pf?.scores || {};
                const filteredScores = {};
                for (const [key, value] of Object.entries(scoresRaw)) {
                    filteredScores[key] = { pt: value.pt, pct: value.pct };
                }

                return {
                    id: prod.id,
                    name: prod.name,
                    brand: prod.brand,
                    image_url: prod.image_url,
                    type: prod.type || null,
                    animal_type: pf.animal_type || null,
                    food_type: pf.food_type || null,
                    scores: filteredScores,
                    moisture_percent: pf?.moisture_percent ?? null,
                    analytical_composition: pf?.analytical_composition ?? null,
                
                };
            });

            res.json(lightProducts);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    });


    router.delete(
        "/products/:id",
        requireAuthentication,
        requireRoles(["ADMIN"]),
        async (req, res) => {
            const transaction = await sequelize.transaction();
            try {
                const { id } = req.params;

                if (!id) {
                    await transaction.rollback();
                    return res.status(400).json({ error: "L'ID du produit est requis" });
                }

                // 🔍 Vérifie que le produit existe
                const product = await Product.findOne({
                    where: { id },
                    include: [{ model: ProductFood, as: "product_foods" }],
                    transaction,
                });

                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({ error: "Produit introuvable" });
                }

                // 🧹 Supprimer les entrées dans l’historique de recherche
                await SearchHistoryItem.destroy({
                    where: { product_id: id },
                    transaction,
                });

                // 🧹 Supprimer les ProductFood associés
                if (product.product_foods?.length) {
                    for (const pf of product.product_foods) {
                        await pf.destroy({ transaction });
                    }
                }

                // 🧹 Supprimer le produit lui-même
                await product.destroy({ transaction });

                await transaction.commit();
                return res.json({
                    message: "Produit et toutes les données associées (historique, aliments) supprimés avec succès",
                });
            } catch (error) {
                await transaction.rollback();
                console.error("❌ Erreur DELETE /products/:id:", error);
                return res.status(500).json({ error: "Erreur interne lors de la suppression du produit" });
            }
        }
    );

    /**
     * Route POST /multipleProducts
     * Crée plusieurs Products et leurs ProductFood associés dans une seule transaction.
     * Expects body: { products: [ { code_ean, name, brand, product_type_code, animal_type_code, food_type_code, ... }, ... ] }
     */
    router.post("/multipleProducts", async (req, res) => {
        const t = await sequelize.transaction();

        try {
            const items = Array.isArray(req.body) ? req.body : req.body.products;

            if (!Array.isArray(items) || items.length === 0) {
                await t.rollback();
                return res.status(400).json({ error: "Un tableau 'products' est requis" });
            }

            const created = [];
            const skipped = [];

            for (let i = 0; i < items.length; i++) {
                const data = items[i];

                if (!data || !data.code_ean) {
                    skipped.push({ index: i, reason: "missing_code_ean" });
                    continue;
                }

                // Vérifie si le produit existe déjà
                const existing = await Product.findOne({ where: { code_ean: data.code_ean }, transaction: t });
                if (existing) {
                    skipped.push({ index: i, code_ean: data.code_ean, reason: "already_exists" });
                    continue;
                }   

                // Récupération des références
                const productType = await ProductType.findOne({ where: { code: data.product_type_code }, transaction: t });
                const animalType = await AnimalType.findOne({ where: { code: data.animal_type_code }, transaction: t });
                const foodType = await FoodType.findOne({ where: { code: data.food_type_code }, transaction: t });

                if (!productType || !animalType || !foodType) {
                    skipped.push({ index: i, code_ean: data.code_ean, reason: "invalid_type_codes" });
                    continue;
                }

                // Création Product
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

                // Création ProductFood
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
                        analytical_composition: data.analytical_composition ?? {
                            protein_percent: data.protein_percent ?? null,
                            fat_percent: data.fat_percent ?? null,
                            fiber_percent: data.fiber_percent ?? null,
                            ash_percent: data.ash_percent ?? null,
                    
                        },
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

                created.push({ product, productFood });
            }

            await t.commit();

            return res.status(201).json({ message: "Bulk insert terminé", createdCount: created.length, created, skipped });
        } catch (error) {
            await t.rollback();
            console.error("❌ Erreur POST /multipleProducts:", error);
            return res.status(500).json({ error: "Erreur interne lors du bulk insert" });
        }
    });
    // POC : analyser un code-barres et renvoyer le JSON de l'IA
    router.post(
        "/products/scan/:barcode",
        async (req, res) => {
            const { barcode } = req.params;

            if (!barcode) {
                return res.status(400).json({ error: "Barcode is required" });
            }

            try {
                console.log(`➡️  [Route] /products/scan/${barcode}`);

                const result = await analyzeProductBarcode(barcode);

                // pour le POC, on renvoie tel quel
                return res.json(result);
            } catch (error) {
                console.error("❌ [Route] Error during analysis:", error.message);
                return res.status(500).json({ error: "Internal error during product analysis" });
            }
        }
    );

};
