// backend/controleurs/enqueteControleur.js

const Enquete = require('../modeles/Enquete');
const Utilisateur = require('../modeles/Utilisateur');
const { executerRequete } = require('../config/database');

class EnqueteControleur {
    static async creerEnquete(req, res) {
        try {
            const donneesEnquete = {
                dateHeureVisite: req.body.dateVisite && req.body.heureVisite 
                    ? `${req.body.dateVisite} ${req.body.heureVisite}:00`
                    : new Date().toISOString().slice(0, 19).replace('T', ' '),
                nomVisiteur: req.body.nom,
                prenomVisiteur: req.body.prenom || null,
                telephone: req.body.telephone,
                email: req.body.email || null,
                raisonPresence: req.body.raisonPresence,
                niveauSatisfaction: req.body.satisfaction,
                idService: await EnqueteControleur.obtenirIdServiceParNom(req.body.serviceConcerne),
                commentaires: req.body.commentaires || null,
                recommandations: req.body.recommandations || null,
                adresseIP: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            };

            if (!donneesEnquete.idService) {
                return res.status(400).json({
                    succes: false,
                    message: 'Service non trouvé',
                    erreurs: ['Le service spécifié n\'existe pas']
                });
            }

            const validation = Enquete.validerDonneesEnquete(donneesEnquete);
            if (!validation.valide) {
                return res.status(400).json({
                    succes: false,
                    message: 'Données invalides',
                    erreurs: validation.erreurs
                });
            }

            const resultat = await Enquete.creerEnquete(donneesEnquete);

            res.status(201).json({
                succes: true,
                message: 'Enquête soumise avec succès',
                data: {
                    idEnquete: resultat.idEnquete
                }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la création de l\'enquête',
                erreur: erreur.message
            });
        }
    }

    static async obtenirIdServiceParNom(nomService) {
        try {
            const resultats = await executerRequete(
                'SELECT id_service FROM services WHERE nom_service = ? AND actif = 1',
                [nomService]
            );
            return resultats?.[0]?.id_service || null;
        } catch (erreur) {
            return null;
        }
    }

    static async obtenirToutesEnquetes(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limite = parseInt(req.query.limite) || 20;

            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (!EnqueteControleur.verifierPermissionUtilisateur(req.utilisateur.role, 'voir_enquetes')) {
                return res.status(403).json({ succes: false, message: 'Permission insuffisante' });
            }

            const resultats = await Enquete.obtenirToutesEnquetes(page, limite);

            if (req.utilisateur.id_utilisateur !== 'superadmin') {
                await Utilisateur.enregistrerLog(
                    req.utilisateur.id_utilisateur,
                    'consultation_enquetes',
                    `Consultation page ${page}`,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            res.json({
                succes: true,
                message: 'Enquêtes récupérées avec succès',
                data: resultats.enquetes,
                pagination: resultats.pagination
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des enquêtes',
                erreur: erreur.message
            });
        }
    }

    static verifierPermissionUtilisateur(role, permission) {
        if (role === 'SuperAdmin') return true;

        const PERMISSIONS = {
            'Administrateur': [
                'voir_enquetes', 'exporter_donnees', 'voir_statistiques',
                'gerer_utilisateurs', 'gerer_services', 'voir_logs'
            ],
            'Responsable Qualité': [
                'voir_enquetes', 'exporter_donnees', 'voir_statistiques'
            ],
            'Directrice Générale': [
                'voir_enquetes', 'exporter_donnees', 'voir_statistiques', 'voir_logs'
            ]
        };

        return PERMISSIONS[role]?.includes(permission);
    }

    static async obtenirEnqueteParId(req, res) {
        try {
            const idEnquete = parseInt(req.params.id);

            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (!EnqueteControleur.verifierPermissionUtilisateur(req.utilisateur.role, 'voir_enquetes')) {
                return res.status(403).json({ succes: false, message: 'Permission insuffisante' });
            }

            const enquete = await Enquete.obtenirEnqueteParId(idEnquete);

            if (!enquete) {
                return res.status(404).json({ succes: false, message: 'Enquête non trouvée' });
            }

            res.json({
                succes: true,
                message: 'Enquête récupérée avec succès',
                data: enquete
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération de l\'enquête',
                erreur: erreur.message
            });
        }
    }

    static async filtrerEnquetes(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (!EnqueteControleur.verifierPermissionUtilisateur(req.utilisateur.role, 'voir_enquetes')) {
                return res.status(403).json({ succes: false, message: 'Permission insuffisante' });
            }

            const filtres = {
                dateDebut: req.body.dateDebut,
                dateFin: req.body.dateFin,
                niveauSatisfaction: req.body.niveauSatisfaction,
                idService: req.body.idService,
                raisonPresence: req.body.raisonPresence
            };

            Object.keys(filtres).forEach(key => {
                if (!filtres[key]) delete filtres[key];
            });

            const enquetes = await Enquete.filtrerEnquetes(filtres);

            if (req.utilisateur.id_utilisateur !== 'superadmin') {
                await Utilisateur.enregistrerLog(
                    req.utilisateur.id_utilisateur,
                    'filtrage_enquetes',
                    `Filtres appliqués: ${JSON.stringify(filtres)}`,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            res.json({
                succes: true,
                message: 'Enquêtes filtrées avec succès',
                data: {
                    enquetes,
                    nombreResultats: enquetes.length,
                    filtresAppliques: filtres
                }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors du filtrage des enquêtes',
                erreur: erreur.message
            });
        }
    }

    static async supprimerEnquete(req, res) {
        try {
            const idEnquete = parseInt(req.params.id);

            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (req.utilisateur.role !== 'Administrateur' && req.utilisateur.role !== 'SuperAdmin') {
                return res.status(403).json({ succes: false, message: 'Seuls les administrateurs peuvent supprimer des enquêtes' });
            }

            const resultat = await Enquete.supprimerEnquete(idEnquete);

            if (!resultat.succes) {
                return res.status(404).json(resultat);
            }

            if (req.utilisateur.id_utilisateur !== 'superadmin') {
                await Utilisateur.enregistrerLog(
                    req.utilisateur.id_utilisateur,
                    'suppression_enquete',
                    `Enquête ID ${idEnquete} supprimée`,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            res.json({
                succes: true,
                message: 'Enquête supprimée avec succès'
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la suppression de l\'enquête',
                erreur: erreur.message
            });
        }
    }

    static async obtenirServices(req, res) {
        try {
            const services = await executerRequete(
                'SELECT id_service, nom_service as nom, description_service as description FROM services WHERE actif = 1 ORDER BY nom_service'
            );

            res.json({
                succes: true,
                message: 'Services récupérés avec succès',
                data: services
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des services',
                erreur: erreur.message
            });
        }
    }

    static async validerDonnees(req, res) {
        try {
            const validation = Enquete.validerDonneesEnquete(req.body);

            res.json({
                succes: validation.valide,
                message: validation.valide ? 'Données valides' : 'Données invalides',
                erreurs: validation.erreurs || []
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la validation',
                erreur: erreur.message
            });
        }
    }

    static async obtenirTotalEnquetes(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({ succes: false, message: 'Authentification requise' });
            }

            if (!EnqueteControleur.verifierPermissionUtilisateur(req.utilisateur.role, 'voir_enquetes')) {
                return res.status(403).json({ succes: false, message: 'Permission insuffisante' });
            }

            const [total] = await executerRequete('SELECT COUNT(*) as total FROM enquetes');

            res.json({
                succes: true,
                message: 'Total des enquêtes récupéré',
                data: { totalEnquetes: total.total }
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors du calcul du total',
                erreur: erreur.message
            });
        }
    }
}

module.exports = EnqueteControleur;
