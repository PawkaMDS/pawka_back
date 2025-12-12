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
const { createProductFromPayload } = require("../services/productCreateService");
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
        try {
            const { product, productFood, alreadyExists } = await createProductFromPayload(req.body, { allowExisting: false });

            return res.status(201).json({
                message: "Produit créé avec succès",
                alreadyExists,
                product,
                productFood,
            });
        } catch (error) {
            console.error("❌ Erreur POST /products:", error);
            return res.status(error.statusCode || 500).json({ error: error.message || "Erreur interne lors de la création du produit" });
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


    /**
     * Route DELETE /products/:id
     * Supprime un produit par son ID ainsi que toutes les données associées (ProductFood, historique).
     * Protégé par une authentification et nécessite le rôle ADMIN.
     */
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

    /**
     * Route POST /products/scan/:barcode
     * Analyse un produit via son code-barres en utilisant le service d'analyse.
     * Expects param: barcode
     * Returns: analysis result JSON
     */
    router.post("/products/scan/:barcode", async (req, res) => {
        const { barcode } = req.params;
        if (!barcode) return res.status(400).json({ error: "Barcode is required" });

        const rid = Math.random().toString(16).slice(2, 8);
        console.log(`➡️ [Route][${rid}] /products/scan/${barcode}`);

        try {
            // 1) Anti double-scan : check DB d'abord
            const existing = await Product.findOne({
                where: { code_ean: barcode },
                include: [{ model: ProductFood, as: "product_foods" }],
            });

            if (existing) {
                console.log(`✅ [Route][${rid}] Cache hit (already exists) for ${barcode}`);
                return res.status(200).json({
                    status: "already_exists",
                    product: existing,
                });
            }

            // 2) Analyse (SerpAPI + fetch + LLM)
            console.log(`🧠 [Route][${rid}] Not in DB, running analysis...`);
            const analysis = await analyzeProductBarcode(barcode, rid);

            // 3) Si l’analyse n’est pas OK : on renvoie directement
            if (!analysis || analysis.status !== "ok") {
                console.log(`ℹ️ [Route][${rid}] Analysis finished with status=${analysis?.status}`);
                return res.status(200).json(analysis || { status: "not_found" });
            }

            // 4) Re-check DB avant insert (évite course condition)
            const existingAfter = await Product.findOne({
                where: { code_ean: barcode },
                include: [{ model: ProductFood, as: "product_foods" }],
            });

            if (existingAfter) {
                console.log(`✅ [Route][${rid}] Became existing during analysis (race condition).`);
                return res.status(200).json({
                    status: "already_exists",
                    product: existingAfter,
                });
            }

            // 5) Insert DB
            console.log(`💾 [Route][${rid}] Analysis OK, creating product...`);
            const created = await createProductFromPayload(analysis, { allowExisting: true });

            // created.status = created | already_exists
            return res.status(201).json({
                status: created.status,
                product: created.product || null,
                analysis, // utile pour debug; tu peux enlever en prod
            });
        } catch (error) {
            console.error(`❌ [Route][${rid}] Error during scan+create:`, error);
            return res.status(error.statusCode || 500).json({
                error: error.message || "Internal error during product scan",
            });
        }
    });
};
