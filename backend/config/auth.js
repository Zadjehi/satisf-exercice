// backend/config/auth.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration du token JWT
const configJWT = {
    secret: process.env.JWT_SECRET || 'enquete_satisfaction_secret_2024',
    expiresIn: process.env.JWT_EXPIRES || '24h',
    issuer: 'enquete-satisfaction-app',
    audience: 'enquete-satisfaction-users'
};

// Configuration des sessions
const configSession = {
    dureeSession: 24 * 60 * 60 * 1000,  // 24 heures en millisecondes
    nettoyageAuto: 60 * 60 * 1000       // 1 heure
};

// Niveau de sécurité pour le hashage
const SALT_ROUNDS = 12;

/**
 * Hash un mot de passe avec bcrypt
 */
const hasherMotDePasse = async (motDePasse) => {
    try {
        return await bcrypt.hash(motDePasse, SALT_ROUNDS);
    } catch {
        throw new Error('Erreur lors du hashage du mot de passe');
    }
};

/**
 * Vérifie si un mot de passe correspond à son hash
 */
const verifierMotDePasse = async (motDePasse, hash) => {
    try {
        return await bcrypt.compare(motDePasse, hash);
    } catch {
        throw new Error('Erreur lors de la vérification du mot de passe');
    }
};

/**
 * Génère un token JWT
 */
const genererToken = (utilisateur) => {
    const payload = {
        id: utilisateur.id_utilisateur,
        nomUtilisateur: utilisateur.nom_utilisateur,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom
    };

    const token = jwt.sign(payload, configJWT.secret, {
        expiresIn: configJWT.expiresIn
    });

    console.log('🔑 Token généré pour:', utilisateur.nom_utilisateur);
    return token;
};

/**
 * Vérifie et décode un token JWT
 */
const verifierToken = (token) => {
    try {
        const decoded = jwt.verify(token, configJWT.secret);
        console.log('🔍 Token décodé avec succès:', decoded);
        return decoded;
    } catch (erreur) {
        console.log('❌ Erreur vérification token:', erreur.message);
        if (erreur.name === 'TokenExpiredError') {
            throw new Error('Token expiré');
        } else if (erreur.name === 'JsonWebTokenError') {
            throw new Error('Token invalide');
        } else {
            throw new Error('Erreur de vérification du token');
        }
    }
};

/**
 * Génère un ID de session unique
 */
const genererIdSession = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
};

/**
 * Calcule la date d'expiration d'une session
 */
const calculerExpirationSession = () => {
    return new Date(Date.now() + configSession.dureeSession);
};

/**
 * Vérifie si une session est expirée
 */
const sessionExpiree = (dateExpiration) => {
    return new Date() > new Date(dateExpiration);
};

/**
 * Valide la force d’un mot de passe
 */
const validerMotDePasse = (motDePasse) => {
    const regles = {
        longueurMin: motDePasse.length >= 8,
        contientMajuscule: /[A-Z]/.test(motDePasse),
        contientMinuscule: /[a-z]/.test(motDePasse),
        contientChiffre: /\d/.test(motDePasse),
        contientSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(motDePasse)
    };

    const score = Object.values(regles).filter(Boolean).length;

    return {
        valide: score >= 4,
        score,
        regles,
        message: score >= 4
            ? 'Mot de passe fort'
            : 'Mot de passe trop faible (minimum 4 critères sur 5)'
    };
};

// Rôles du système
const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    ADMINISTRATEUR: 'Administrateur',
    RESPONSABLE_QUALITE: 'Responsable Qualité',
    DIRECTRICE_GENERALE: 'Directrice Générale'
};

// Permissions par rôle
const PERMISSIONS = {
    'SuperAdmin': [
        'voir_enquetes',
        'exporter_donnees',
        'voir_statistiques',
        'gerer_utilisateurs',
        'gerer_services',
        'voir_logs'
    ],
    [ROLES.ADMINISTRATEUR]: [
        'voir_enquetes',
        'exporter_donnees',
        'voir_statistiques',
        'gerer_utilisateurs',
        'gerer_services',
        'voir_logs'
    ],
    [ROLES.RESPONSABLE_QUALITE]: [
        'voir_enquetes',
        'exporter_donnees',
        'voir_statistiques'
    ],
    [ROLES.DIRECTRICE_GENERALE]: [
        'voir_enquetes',
        'exporter_donnees',
        'voir_statistiques',
        'voir_logs'
    ]
};

/**
 * Vérifie si un rôle donné possède une permission
 */
const aPermission = (role, permission) => {
    if (role === 'SuperAdmin') return true;
    return PERMISSIONS[role]?.includes(permission) || false;
};

module.exports = {
    configJWT,
    configSession,
    hasherMotDePasse,
    verifierMotDePasse,
    genererToken,
    verifierToken,
    genererIdSession,
    calculerExpirationSession,
    sessionExpiree,
    validerMotDePasse,
    ROLES,
    PERMISSIONS,
    aPermission
};
