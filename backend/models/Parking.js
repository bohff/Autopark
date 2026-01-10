const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    nom: {
        type: String,
        required: true,
        maxlength: 50
    }
});

module.exports = mongoose.model('Parking', parkingSchema);
