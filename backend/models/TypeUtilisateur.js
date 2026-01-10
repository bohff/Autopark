const mongoose = require('mongoose');

const typeUtilisateurSchema = new mongoose.Schema({
    libelle: {
        type: String,
        required: true,
        maxlength: 50
    }
});

module.exports = mongoose.model('TypeUtilisateur', typeUtilisateurSchema);
