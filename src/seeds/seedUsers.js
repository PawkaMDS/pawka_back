const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = async function seedUsers(options = {}) {
    const tx = options.transaction;
    const passwordHash = await bcrypt.hash("123456", 10);

    const users = [
        {
            name: "Admin",
            email: "admin@gmail.com",
            password: passwordHash,
            role: "ADMIN",
            is_premium: false,
        },
        {
            name: "Alice",
            email: "user@gmail.com",
            password: passwordHash,
            role: "USER",
            is_premium: false,
        },
        {
            name: "Bob",
            email: "user1@gmail.com",
            password: passwordHash,
            role: "USER",
            is_premium: true,
            premium_start: new Date("2025-09-01T00:00:00Z"),
        },
    ];

    for (const user of users) {
        await User.upsert(user, { transaction: tx });
    }

    console.log("✅ Users seeded");
};
