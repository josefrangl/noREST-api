const mongoose = require('../../db/mongodb/mongodb.js');

const Steve = mongoose.model('Steve', {
	New: {
        type: Boolean,
        allowNull: false,
        
        },
});

module.exports = Steve;