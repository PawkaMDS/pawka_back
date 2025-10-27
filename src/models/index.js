const User = require('./User')
const AnimalType = require('./AnimalType')
const AnimalBreed = require('./AnimalBreed')
const Animal = require('./Animal')
const ProductType = require('./ProductType')
const Product = require('./Product')
const FoodType = require('./FoodType')
const SearchHistoryItem = require('./SearchHistoryItem')
const ProductFood = require('./ProductFood')

// Associations
// AnimalType → AnimalBreed (1:N)
AnimalType.hasMany(AnimalBreed, { foreignKey: 'animal_type_id' });
AnimalBreed.belongsTo(AnimalType, { foreignKey: 'animal_type_id' });

// Animal → User (N:1)
Animal.belongsTo(User, { foreignKey: "user_id", as: "owner", onDelete: "CASCADE", onUpdate: "CASCADE" });
User.hasMany(Animal, { foreignKey: "user_id", as: "animals", onDelete: "CASCADE", onUpdate: "CASCADE" });

// Animal → AnimalType (N:1)
Animal.belongsTo(AnimalType, { foreignKey: "animal_type_id", as: "type",  onDelete: "RESTRICT", onUpdate: "CASCADE" });
AnimalType.hasMany(Animal, { foreignKey: "animal_type_id", as: "animals_by_type" });

// Animal → AnimalBreed (N:1, souvent nullable)
Animal.belongsTo(AnimalBreed,{ foreignKey: "breed_id", as: "breed", onDelete: "SET NULL", onUpdate: "CASCADE" });
AnimalBreed.hasMany(Animal,  { foreignKey: "breed_id", as: "animals_by_breed" });

// ProductType -> Product (1:N)
Product.belongsTo(ProductType, { foreignKey: 'type_id', as: 'type', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
ProductType.hasMany(Product, { foreignKey: 'type_id', as: 'products' });

// SearchHistoryItem pivot (User <-> Product)
SearchHistoryItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SearchHistoryItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Navigation Many-to-Many via pivot
User.belongsToMany(Product, { through: SearchHistoryItem, foreignKey: 'user_id', otherKey: 'product_id', as: 'searched_products' });
Product.belongsToMany(User, { through: SearchHistoryItem, foreignKey: 'product_id', otherKey: 'user_id', as: 'searching_users' });

// ProductFood relations
ProductFood.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ProductFood, { foreignKey: 'product_id', as: 'product_foods' });

ProductFood.belongsTo(AnimalType, { foreignKey: 'animal_type_id', as: 'animal_type' });
AnimalType.hasMany(ProductFood, { foreignKey: 'animal_type_id', as: 'product_foods' });

ProductFood.belongsTo(FoodType, { foreignKey: 'food_type_id', as: 'food_type' });
FoodType.hasMany(ProductFood, { foreignKey: 'food_type_id', as: 'product_foods' });

module.exports = {
	User,
	AnimalType,
	AnimalBreed,
    Animal,
    ProductType,
    Product,
    FoodType,
    SearchHistoryItem,
    ProductFood,
}
