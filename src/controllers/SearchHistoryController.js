const { Router } = require("express");
const SearchHistoryItem = require("../models/SearchHistoryItem");
const Product = require("../models/Product");
const ProductType = require("../models/ProductType");
const ProductFood = require("../models/ProductFood");
const AnimalType = require("../models/AnimalType");
const FoodType = require("../models/FoodType");
const requireAuthentication = require("../middlewares/require-auth");

/**
 * Configure routes for search history management.
 *
 * @param {Express.Application} app The Express application (not used here, but kept for consistency).
 * @param {Router} router The Express router where routes will be defined.
 */
module.exports = function (app, router) {
    /**
     * Route GET /search-history
     * Retrieves the product search history of the currently logged-in user.
     */
    router.get(
        "/search-history",
        requireAuthentication,
        async (req, res) => {
            try {
                const userId = req.user.id;

                const searchHistory = await SearchHistoryItem.findAll({
                    where: { user_id: userId },
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: [
                                "id",
                                "name",
                                "code_ean",
                                "image_url",
                                "brand",
                            ],
                            include: [
                                {
                                    model: ProductType,
                                    as: "type",
                                    attributes: ["id", "code", "name"],
                                },
                                {
                                    model: ProductFood,
                                    as: "product_foods",
                                    include: [
                                        {
                                            model: AnimalType,
                                            as: "animal_type",
                                            attributes: ["id", "code", "name"],
                                        },
                                        {
                                            model: FoodType,
                                            as: "food_type",
                                            attributes: [
                                                "id",
                                                "code",
                                                "name",
                                                "default_moisture",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    order: [["createdAt", "DESC"]],
                });

                return res.json({
                    message: "Search history retrieved successfully",
                    data: searchHistory,
                });
            } catch (error) {
                console.error("❌ Error GET /search-history:", error);
                return res.status(500).json({
                    error:
                        "Internal error while retrieving search history",
                });
            }
        }
    );
};
