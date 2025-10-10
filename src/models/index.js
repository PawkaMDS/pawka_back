const User = require('./User')
const AnimalType = require('./AnimalType')
const AnimalBreed = require('./AnimalBreed')
const Animal = require('./Animal')
const ProductType = require('./ProductType')

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

module.exports = {
	User,
	AnimalType,
	AnimalBreed,
    Animal,
    ProductType,
}
