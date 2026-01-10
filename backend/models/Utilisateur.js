const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const utilisateurSchema = new mongoose.Schema({
    pseudo: {
        type: String,
        maxlength: 50
    },
    nom: {
        type: String,
        required: true,
        maxlength: 50
    },
    prenom: {
        type: String,
        required: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    mot_de_passe: {
        type: String,
        required: true
    },
    date_creation: {
        type: Date,
        default: Date.now
    },
    id_profil: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profil'
    },
    id_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeUtilisateur'
    }
});

// Hash du mot de passe avant sauvegarde
utilisateurSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('mot_de_passe')) return next();
        this.mot_de_passe = await bcrypt.hash(this.mot_de_passe, 10);
        next();
    } catch (error) {
        console.error('Erreur hashage:', error);
        next(error);
    }
});

// Méthode pour comparer les mots de passe
utilisateurSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.mot_de_passe);
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
