const User = require('./User')
const AnimalType = require('./AnimalType')
const AnimalBreed = require('./AnimalBreed')

// Associations
AnimalType.hasMany(AnimalBreed, { foreignKey: 'animal_type_id' });
AnimalBreed.belongsTo(AnimalType, { foreignKey: 'animal_type_id' });


module.exports = {
	User,
	AnimalType,
	AnimalBreed,
}
