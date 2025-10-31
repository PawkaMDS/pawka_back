const User = require("../models/User");
const Product = require("../models/Product");
const SearchHistoryItem = require("../models/SearchHistoryItem");

module.exports = async function seedSearchHistory(options = {}) {
    const tx = options.transaction;

    const user = await User.findOne({ where: { email: "user@gmail.com" }, transaction: tx });
    const p1 = await Product.findOne({ where: { code_ean: "7613035845084" }, transaction: tx });
    const p2 = await Product.findOne({ where: { code_ean: "3182550727822" }, transaction: tx });

    // helper pour (user, product) : supprime si existe, puis recrée (nouveau createdAt)
    const touchPair = async (userId, productId) => {
        const existing = await SearchHistoryItem.findOne({
            where: { user_id: userId, product_id: productId },
            transaction: tx,
        });
        if (existing) {
            await existing.destroy({ transaction: tx });
        }
        await SearchHistoryItem.create({ user_id: userId, product_id: productId }, { transaction: tx });
    };

    await touchPair(user.id, p1.id);
    await touchPair(user.id, p2.id);

    console.log("✅ SearchHistory refreshed for user@gmail.com (2 items, new createdAt)");
};
