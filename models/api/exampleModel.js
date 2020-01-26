const mongoose = require('../../db/mongodb/mongodb.js');

const Pokemon = mongoose.model('pokemon', {
	title: {
        type: string,
        allowNull: false,
        default: 'no title',
        },
	newspaper: {
        type: string,
        allowNull: false,
        
        },
	musica: {
        type: int,
        allowNull: true,
        
        },
});

module.exports = Pokemon;