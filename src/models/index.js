const User = require('./User')
const Restaurant = require('./Restaurant');
const Dish = require('./Dish');

// relations between models
User.hasOne(Restaurant, { foreignKey: "ownerId" });
Restaurant.belongsTo(User, { foreignKey: "ownerId" });

Restaurant.hasMany(Dish, { foreignKey: "restaurantId" });
Dish.belongsTo(Restaurant, { foreignKey: "restaurantId" });