const mongoose = require('mongoose');

const profilSchema = new mongoose.Schema({
    darkmode: {
        type: Boolean,
        default: false
    },
    tarification: {
        type: String,
        maxlength: 50,
        default: 'tous'
    },
    type_parking: {
        type: String,
        maxlength: 50,
        default: 'tous'
    }
});

module.exports = mongoose.model('Profil', profilSchema);
