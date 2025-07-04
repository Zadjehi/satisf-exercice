// backend/controleurs/authControleur.js

const Utilisateur = require('../modeles/Utilisateur');
const { genererToken, validerMotDePasse } = require('../config/auth');

class AuthControleur {
    static async connexion(req, res) {
        try {
            const { nomUtilisateur, motDePasse } = req.body;

            if (!nomUtilisateur || !motDePasse) {
                return res.status(400).json({
                    succes: false,
                    message: 'Nom d\'utilisateur et mot de passe requis'
                });
            }

            // Connexion SuperAdmin
            const superNom = process.env.SUPERADMIN_USERNAME;
            const superMdp = process.env.SUPERADMIN_PASSWORD;
            const superRole = process.env.SUPERADMIN_ROLE || 'SuperAdmin';

            if (nomUtilisateur === superNom && motDePasse === superMdp) {
                const utilisateur = {
                    id_utilisateur: 'superadmin',
                    nom_utilisateur: superNom,
                    nom: 'Super',
                    prenom: 'Admin',
                    email: superNom,
                    role: superRole
                };

                const token = genererToken(utilisateur);

                return res.json({
                    succes: true,
                    message: 'Connexion super administrateur réussie',
                    data: { utilisateur, token, session: null }
                });
            }

            // Connexion utilisateur standard
            const resultatAuth = await Utilisateur.authentifier(nomUtilisateur, motDePasse);

            if (!resultatAuth.succes) {
                return res.status(401).json({
                    succes: false,
                    message: resultatAuth.message
                });
            }

            const utilisateur = resultatAuth.utilisateur;
            const idSession = await Utilisateur.creerSession(utilisateur.id_utilisateur, {
                adresseIP: req.ip,
                userAgent: req.get('User-Agent')
            });

            const token = genererToken(utilisateur);

            await Utilisateur.enregistrerLog(
                utilisateur.id_utilisateur,
                'connexion',
                'Connexion réussie',
                req.ip,
                req.get('User-Agent')
            );

            res.json({
                succes: true,
                message: 'Connexion réussie',
                data: {
                    utilisateur: {
                        id: utilisateur.id_utilisateur,
                        nomUtilisateur: utilisateur.nom_utilisateur,
                        nom: utilisateur.nom,
                        prenom: utilisateur.prenom,
                        email: utilisateur.email,
                        role: utilisateur.role
                    },
                    token,
                    session: idSession
                }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la connexion',
                erreur: erreur.message
            });
        }
    }

    static async deconnexion(req, res) {
        try {
            const idSession = req.headers['x-session-id'];

            if (idSession) {
                await Utilisateur.supprimerSession(idSession);

                if (req.utilisateur && req.utilisateur.id_utilisateur !== 'superadmin') {
                    await Utilisateur.enregistrerLog(
                        req.utilisateur.id_utilisateur,
                        'deconnexion',
                        'Déconnexion manuelle',
                        req.ip,
                        req.get('User-Agent')
                    );
                }
            }

            res.json({
                succes: true,
                message: 'Déconnexion réussie'
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la déconnexion',
                erreur: erreur.message
            });
        }
    }

    static async verifierStatut(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Non connecté' });
            }

            if (req.utilisateur.id_utilisateur === 'superadmin') {
                return res.json({
                    succes: true,
                    message: 'SuperAdmin connecté',
                    data: { utilisateur: req.utilisateur }
                });
            }

            const utilisateur = await Utilisateur.obtenirUtilisateurParId(req.utilisateur.id_utilisateur);

            if (!utilisateur || !utilisateur.actif) {
                return res.status(401).json({
                    succes: false,
                    message: 'Utilisateur inactif ou supprimé'
                });
            }

            res.json({
                succes: true,
                message: 'Utilisateur connecté',
                data: {
                    utilisateur: {
                        id: utilisateur.id_utilisateur,
                        nomUtilisateur: utilisateur.nom_utilisateur,
                        nom: utilisateur.nom,
                        prenom: utilisateur.prenom,
                        email: utilisateur.email,
                        role: utilisateur.role,
                        derniereConnexion: utilisateur.derniere_connexion
                    }
                }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la vérification du statut',
                erreur: erreur.message
            });
        }
    }

    static async changerMotDePasse(req, res) {
        try {
            const { ancienMotDePasse, nouveauMotDePasse, confirmerMotDePasse } = req.body;

            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (req.utilisateur.id_utilisateur === 'superadmin') {
                return res.status(403).json({
                    succes: false,
                    message: 'Le mot de passe SuperAdmin ne peut pas être modifié via cette interface'
                });
            }

            if (!ancienMotDePasse || !nouveauMotDePasse || !confirmerMotDePasse) {
                return res.status(400).json({
                    succes: false,
                    message: 'Tous les champs sont requis'
                });
            }

            if (nouveauMotDePasse !== confirmerMotDePasse) {
                return res.status(400).json({
                    succes: false,
                    message: 'Les mots de passe ne correspondent pas'
                });
            }

            const validationMdp = validerMotDePasse(nouveauMotDePasse);
            if (!validationMdp.valide) {
                return res.status(400).json({
                    succes: false,
                    message: validationMdp.message,
                    regles: validationMdp.regles
                });
            }

            const resultat = await Utilisateur.changerMotDePasse(
                req.utilisateur.id_utilisateur,
                ancienMotDePasse,
                nouveauMotDePasse
            );

            if (!resultat.succes) {
                return res.status(400).json({
                    succes: false,
                    message: resultat.message
                });
            }

            await Utilisateur.enregistrerLog(
                req.utilisateur.id_utilisateur,
                'changement_mot_de_passe',
                'Mot de passe modifié avec succès',
                req.ip,
                req.get('User-Agent')
            );

            res.json({
                succes: true,
                message: 'Mot de passe changé avec succès'
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors du changement de mot de passe',
                erreur: erreur.message
            });
        }
    }

    static async creerUtilisateur(req, res) {
        try {
            if (!req.utilisateur || !['Administrateur', 'SuperAdmin'].includes(req.utilisateur.role)) {
                return res.status(403).json({
                    succes: false,
                    message: 'Seuls les administrateurs peuvent créer des utilisateurs'
                });
            }

            const { nomUtilisateur, motDePasse, nom, prenom, email, role } = req.body;

            if (!nomUtilisateur || !motDePasse || !nom || !role) {
                return res.status(400).json({
                    succes: false,
                    message: 'Nom d\'utilisateur, mot de passe, nom et rôle requis'
                });
            }

            const validationMdp = validerMotDePasse(motDePasse);
            if (!validationMdp.valide) {
                return res.status(400).json({
                    succes: false,
                    message: validationMdp.message,
                    regles: validationMdp.regles
                });
            }

            const rolesValides = ['Administrateur', 'Responsable Qualité', 'Directrice Générale'];
            if (!rolesValides.includes(role)) {
                return res.status(400).json({ succes: false, message: 'Rôle invalide' });
            }

            const resultat = await Utilisateur.creerUtilisateur({
                nomUtilisateur, motDePasse, nom, prenom, email, role
            });

            if (req.utilisateur.id_utilisateur !== 'superadmin') {
                await Utilisateur.enregistrerLog(
                    req.utilisateur.id_utilisateur,
                    'creation_utilisateur',
                    `Utilisateur ${nomUtilisateur} créé avec le rôle ${role}`,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            res.status(201).json({
                succes: true,
                message: 'Utilisateur créé avec succès',
                data: { idUtilisateur: resultat.idUtilisateur }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la création de l\'utilisateur',
                erreur: erreur.message
            });
        }
    }

    static async obtenirUtilisateurs(req, res) {
        try {
            if (!req.utilisateur || !['Administrateur', 'SuperAdmin'].includes(req.utilisateur.role)) {
                return res.status(403).json({
                    succes: false,
                    message: 'Seuls les administrateurs peuvent voir la liste des utilisateurs'
                });
            }

            const utilisateurs = await Utilisateur.obtenirTousUtilisateurs();

            res.json({
                succes: true,
                message: 'Utilisateurs récupérés avec succès',
                data: utilisateurs
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des utilisateurs',
                erreur: erreur.message
            });
        }
    }

    static async mettreAJourUtilisateur(req, res) {
        try {
            const idUtilisateur = parseInt(req.params.id);

            if (!req.utilisateur || !['Administrateur', 'SuperAdmin'].includes(req.utilisateur.role)) {
                return res.status(403).json({
                    succes: false,
                    message: 'Seuls les administrateurs peuvent modifier les utilisateurs'
                });
            }

            const donneesUtilisateur = req.body;

            if (donneesUtilisateur.role) {
                const rolesValides = ['Administrateur', 'Responsable Qualité', 'Directrice Générale'];
                if (!rolesValides.includes(donneesUtilisateur.role)) {
                    return res.status(400).json({
                        succes: false,
                        message: 'Rôle invalide'
                    });
                }
            }

            const resultat = await Utilisateur.mettreAJourUtilisateur(idUtilisateur, donneesUtilisateur);

            if (!resultat.succes) {
                return res.status(404).json(resultat);
            }

            if (req.utilisateur.id_utilisateur !== 'superadmin') {
                await Utilisateur.enregistrerLog(
                    req.utilisateur.id_utilisateur,
                    'modification_utilisateur',
                    `Utilisateur ID ${idUtilisateur} modifié`,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            res.json({
                succes: true,
                message: 'Utilisateur mis à jour avec succès'
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la mise à jour de l\'utilisateur',
                erreur: erreur.message
            });
        }
    }

    static async nettoyerSessions(req, res) {
        try {
            if (!req.utilisateur || !['Administrateur', 'SuperAdmin'].includes(req.utilisateur.role)) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const nombre = await Utilisateur.nettoyerSessionsExpirees();

            res.json({
                succes: true,
                message: `${nombre} sessions expirées supprimées`
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors du nettoyage des sessions',
                erreur: erreur.message
            });
        }
    }
}

module.exports = AuthControleur;
