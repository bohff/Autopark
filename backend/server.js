const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Utilisateur = require('./models/Utilisateur');
const Profil = require('./models/Profil');
const TypeUtilisateur = require('./models/TypeUtilisateur');
const Trajet = require('./models/Trajet');

const app = express();

app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connecté à MongoDB'))
    .catch(err => console.error('Erreur connexion MongoDB:', err));

function authMiddleware(req, res, next) {
    const token = req.header('Authorization');
    
    if (!token) {
        return res.status(401).json({ message: 'Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide.' });
    }
}

app.get('/api', (req, res) => {
    res.json({ message: 'API Autopark opérationnelle' });
});

// Inscription
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe } = req.body;

        const existingUser = await Utilisateur.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Créer le profil par défaut
        const profil = new Profil({
            darkmode: false,
            tarification: 'tous',
            type_parking: 'tous'
        });
        await profil.save();

        // Récupérer ou créer le type utilisateur standard
        let typeUser = await TypeUtilisateur.findOne({ libelle: 'standard' });
        if (!typeUser) {
            typeUser = new TypeUtilisateur({ libelle: 'standard' });
            await typeUser.save();
        }

        // Créer l'utilisateur
        const utilisateur = new Utilisateur({
            nom,
            prenom,
            email,
            mot_de_passe,
            id_profil: profil._id,
            id_type: typeUser._id
        });
        await utilisateur.save();

        const token = jwt.sign({ id: utilisateur._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Inscription réussie',
            token,
            user: { id: utilisateur._id, nom: utilisateur.nom, prenom: utilisateur.prenom, email: utilisateur.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        const utilisateur = await Utilisateur.findOne({ email }).populate('id_profil');
        if (!utilisateur) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const isMatch = await utilisateur.comparePassword(mot_de_passe);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign({ id: utilisateur._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Connexion réussie',
            token,
            user: { id: utilisateur._id, nom: utilisateur.nom, prenom: utilisateur.prenom, email: utilisateur.email, profil: utilisateur.id_profil }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer les préférences
app.get('/api/profil', authMiddleware, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.user.id).populate('id_profil');
        if (!utilisateur || !utilisateur.id_profil) {
            return res.status(404).json({ message: 'Profil non trouvé.' });
        }
        res.json(utilisateur.id_profil);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Modifier les préférences
app.put('/api/profil', authMiddleware, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.user.id);
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const { darkmode, tarification, type_parking } = req.body;

        const profil = await Profil.findByIdAndUpdate(
            utilisateur.id_profil,
            { darkmode, tarification, type_parking },
            { new: true }
        );

        res.json({ message: 'Profil mis à jour', profil });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Récupérer les infos du compte
app.get('/api/profil/compte', authMiddleware, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.user.id).select('-mot_de_passe');
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json({ nom: utilisateur.nom, prenom: utilisateur.prenom, email: utilisateur.email });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Modifier le nom/prénom
app.put('/api/profil/compte', authMiddleware, async (req, res) => {
    try {
        const { nom, prenom } = req.body;
        
        const utilisateur = await Utilisateur.findByIdAndUpdate(
            req.user.id,
            { nom, prenom },
            { new: true }
        ).select('-mot_de_passe');
        
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        
        res.json({ message: 'Compte mis à jour', nom: utilisateur.nom, prenom: utilisateur.prenom });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Changer le mot de passe
app.put('/api/profil/password', authMiddleware, async (req, res) => {
    try {
        const { ancienPassword, nouveauPassword } = req.body;
        
        const utilisateur = await Utilisateur.findById(req.user.id);
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        
        const isMatch = await utilisateur.comparePassword(ancienPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
        }
        
        // Définir le nouveau mot de passe (le hook pre-save le hashera automatiquement)
        utilisateur.mot_de_passe = nouveauPassword;
        await utilisateur.save();
        
        res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Récupérer l'historique
app.get('/api/trajet/historique', authMiddleware, async (req, res) => {
    try {
        const trajets = await Trajet.find({ id_utilisateur: req.user.id });
        res.json(trajets);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Enregistrer un trajet
app.post('/api/trajet', authMiddleware, async (req, res) => {
    try {
        const { duree, distance, origine, destination_nom, destination_lat, destination_lng } = req.body;

        const trajet = new Trajet({
            duree,
            distance,
            origine,
            destination_nom,
            destination_lat,
            destination_lng,
            id_utilisateur: req.user.id
        });

        await trajet.save();
        res.status(201).json({ message: 'Trajet enregistré', trajet });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
