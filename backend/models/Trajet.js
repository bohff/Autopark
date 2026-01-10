const mongoose = require('mongoose');

const trajetSchema = new mongoose.Schema({
    duree: {
        type: String,
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    date_trajet: {
        type: Date,
        default: Date.now
    },
    origine: {
        type: String,
        default: ''
    },
    destination_nom: {
        type: String,
        default: ''
    },
    destination_lat: {
        type: Number
    },
    destination_lng: {
        type: Number
    },
    id_parking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parking'
    },
    id_utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    }
});

module.exports = mongoose.model('Trajet', trajetSchema);
