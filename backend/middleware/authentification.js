const jwt = require('jsonwebtoken');
const { verifierToken } = require('../config/auth');
const Utilisateur = require('../modeles/Utilisateur');
require('dotenv').config();

/**
 * Middleware de vérification d'authentification
 */
const verifierAuthentification = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const sessionId = req.headers['x-session-id'];
        
        let utilisateur = null;
        let methodeAuth = null;

        console.log('Vérification authentification:', { 
            hasToken: !!authHeader, 
            hasSession: !!sessionId 
        });

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const tokenDecode = verifierToken(token);
                console.log('Token décodé:', tokenDecode);

                // Cas SuperAdmin - utiliser le bon champ
                if (
                    tokenDecode.nomUtilisateur === process.env.SUPERADMIN_USERNAME &&
                    tokenDecode.role === process.env.SUPERADMIN_ROLE
                ) {
                    utilisateur = {
                        id_utilisateur: 'superadmin',
                        nom_utilisateur: process.env.SUPERADMIN_USERNAME,
                        nom: 'Super',
                        prenom: 'Admin',
                        role: process.env.SUPERADMIN_ROLE,
                        email: process.env.SUPERADMIN_USERNAME
                    };
                    methodeAuth = 'JWT';
                    console.log('SuperAdmin authentifié via JWT');
                } else {
                    // Utilisateur normal - utiliser le bon champ "id"
                    utilisateur = {
                        id_utilisateur: tokenDecode.id,
                        nom_utilisateur: tokenDecode.nomUtilisateur,
                        nom: tokenDecode.nom,
                        prenom: tokenDecode.prenom,
                        role: tokenDecode.role
                    };
                    methodeAuth = 'JWT';
                    console.log('Utilisateur normal authentifié via JWT');
                }
            } catch (erreurToken) {
                console.log('Token JWT invalide:', erreurToken.message);
                // Continue pour essayer la session
            }
        }

        if (!utilisateur && sessionId) {
            try {
                const session = await Utilisateur.verifierSession(sessionId);
                if (session) {
                    utilisateur = session.utilisateur;
                    methodeAuth = 'Session';
                    console.log('Utilisateur authentifié via session');
                }
            } catch (erreurSession) {
                console.log('Session invalide:', erreurSession.message);
            }
        }

        if (!utilisateur) {
            console.log('Aucune authentification valide trouvée');
            return res.status(401).json({
                succes: false,
                message: 'Accès non autorisé - Authentification requise',
                code: 'AUTH_REQUIRED'
            });
        }

        // Ne pas vérifier en DB si SuperAdmin
        if (utilisateur.id_utilisateur !== 'superadmin') {
            try {
                const utilisateurActuel = await Utilisateur.obtenirUtilisateurParId(utilisateur.id_utilisateur);
                if (!utilisateurActuel) {
                    console.log('Utilisateur non trouvé en base');
                    return res.status(401).json({
                        succes: false,
                        message: 'Utilisateur non trouvé',
                        code: 'USER_NOT_FOUND'
                    });
                }
                if (!utilisateurActuel.actif) {
                    console.log('Utilisateur désactivé');
                    return res.status(401).json({
                        succes: false,
                        message: 'Compte utilisateur désactivé',
                        code: 'USER_DISABLED'
                    });
                }
            } catch (erreurDB) {
                console.log('Erreur vérification utilisateur en DB:', erreurDB.message);
                // Pour SuperAdmin ou en cas d'erreur DB, continuer
            }
        }

        req.utilisateur = utilisateur;
        req.methodeAuth = methodeAuth;
        console.log('Authentification réussie pour:', utilisateur.nom_utilisateur, 'via', methodeAuth);
        next();

    } catch (erreur) {
        console.error('Erreur middleware authentification:', erreur);
        res.status(500).json({
            succes: false,
            message: 'Erreur lors de la vérification d\'authentification',
            code: 'AUTH_ERROR'
        });
    }
};

const verifierRole = (rolesAutorises) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                succes: false,
                message: 'Authentification requise',
                code: 'AUTH_REQUIRED'
            });
        }

        const roles = Array.isArray(rolesAutorises) ? rolesAutorises : [rolesAutorises];

        // SuperAdmin a toujours tous les droits
        if (req.utilisateur.role === 'SuperAdmin') {
            return next();
        }

        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({
                succes: false,
                message: 'Permissions insuffisantes pour cette action',
                code: 'INSUFFICIENT_PERMISSIONS',
                roleRequis: roles,
                roleUtilisateur: req.utilisateur.role
            });
        }

        next();
    };
};

const verifierPermission = (permissionRequise) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                succes: false,
                message: 'Authentification requise',
                code: 'AUTH_REQUIRED'
            });
        }

        if (req.utilisateur.role === 'SuperAdmin') {
            return next();
        }

        if (!Utilisateur.verifierPermission(req.utilisateur.role, permissionRequise)) {
            return res.status(403).json({
                succes: false,
                message: `Permission '${permissionRequise}' requise`,
                code: 'PERMISSION_DENIED',
                permissionRequise: permissionRequise,
                roleUtilisateur: req.utilisateur.role
            });
        }

        next();
    };
};

const authentificationOptionnelle = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const sessionId = req.headers['x-session-id'];
        
        let utilisateur = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const tokenDecode = verifierToken(token);

                // SuperAdmin
                if (
                    tokenDecode.nomUtilisateur === process.env.SUPERADMIN_USERNAME &&
                    tokenDecode.role === process.env.SUPERADMIN_ROLE
                ) {
                    utilisateur = {
                        id_utilisateur: 'superadmin',
                        nom_utilisateur: process.env.SUPERADMIN_USERNAME,
                        nom: 'Super',
                        prenom: 'Admin',
                        role: process.env.SUPERADMIN_ROLE
                    };
                } else {
                    utilisateur = {
                        id_utilisateur: tokenDecode.id,
                        nom_utilisateur: tokenDecode.nomUtilisateur,
                        nom: tokenDecode.nom,
                        prenom: tokenDecode.prenom,
                        role: tokenDecode.role
                    };
                }
            } catch (erreur) {
                // Token invalide : on ignore
            }
        }

        if (!utilisateur && sessionId) {
            try {
                const session = await Utilisateur.verifierSession(sessionId);
                if (session) {
                    utilisateur = session.utilisateur;
                }
            } catch (erreur) {
                // Session invalide : on ignore
            }
        }

        if (utilisateur) {
            req.utilisateur = utilisateur;
        }

        next();
    } catch (erreur) {
        next();
    }
};

const adminSeulement = verifierRole(['Administrateur']);
const adminOuDirectrice = verifierRole(['Administrateur', 'Directrice Générale']);
const tousRoles = verifierRole(['Administrateur', 'Responsable Qualité', 'Directrice Générale']);

module.exports = {
    verifierAuthentification,
    verifierRole,
    verifierPermission,
    authentificationOptionnelle,
    adminSeulement,
    adminOuDirectrice,
    tousRoles
};