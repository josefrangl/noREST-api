const mongoose = require('../../db/mongodb/mongodb.js');

const Pokemon = mongoose.model('pokemon', {
  title: {
    type: String,
    allowNull: false,
    default: 'no title',
  },
  newspaper: {
    type: String,
    allowNull: false,
        
  },
  musica: {
    type: Number,
    allowNull: true,
        
  },
});

module.exports = Pokemon;