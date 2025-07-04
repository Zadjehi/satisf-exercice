// Contrôleur pour la gestion des statistiques avec export Excel
const Enquete = require('../modeles/Enquete');
const Utilisateur = require('../modeles/Utilisateur');
const { executerRequete } = require('../config/database');
const { envoyerFichierExport, creerExportAvecMetadonnees, exporterEnquetesRapide } = require('../utilitaires/exportExcel');

class StatistiquesControleur {

    /**
     * Obtient toutes les statistiques pour le dashboard
     * GET /api/statistiques/dashboard
     */
    static async obtenirStatistiquesDashboard(req, res) {
        try {
            // Vérifier les permissions
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            // Récupérer toutes les statistiques depuis le modèle
            const statistiquesBrutes = await Enquete.obtenirStatistiques();
            
            // Transformer les données pour correspondre à ce que le frontend attend
            const statistiques = {
                totalEnquetes: statistiquesBrutes.recentes?.total_enquetes || 0,
                satisfactionMoyenne: 0,
                insatisfactionMoyenne: 0,
                mensuelles: statistiquesBrutes.mensuelles || [],
                services: statistiquesBrutes.services || [],
                tendances: {
                    satisfaits: statistiquesBrutes.recentes?.satisfaits || 0,
                    mecontents: statistiquesBrutes.recentes?.mecontents || 0,
                    aujourdhui: statistiquesBrutes.recentes?.aujourd_hui || 0,
                    cetteSemaine: statistiquesBrutes.recentes?.cette_semaine || 0,
                    ceMois: statistiquesBrutes.recentes?.ce_mois || 0
                },
                derniereMAJ: new Date().toISOString(),
                periode: "Derniers 6 mois"
            };

            // Calculer les pourcentages de satisfaction
            if (statistiques.totalEnquetes > 0) {
                statistiques.satisfactionMoyenne = Math.round(
                    (statistiques.tendances.satisfaits / statistiques.totalEnquetes) * 100
                );
                statistiques.insatisfactionMoyenne = Math.round(
                    (statistiques.tendances.mecontents / statistiques.totalEnquetes) * 100
                );
            } else {
                statistiques.satisfactionMoyenne = 0;
                statistiques.insatisfactionMoyenne = 100;
            }

            // Enregistrer l'action
            await Utilisateur.enregistrerLog(
                req.utilisateur.id_utilisateur,
                'consultation_statistiques',
                'Dashboard statistiques consulté',
                req.ip,
                req.get('User-Agent')
            );

            res.json({
                succes: true,
                message: 'Statistiques récupérées avec succès',
                data: statistiques
            });

        } catch (erreur) {
            console.error('Erreur statistiques dashboard:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques',
                erreur: erreur.message
            });
        }
    }

    /**
     * Export direct avec téléchargement de fichier
     * GET /api/statistiques/export?format=excel&type=enquetes
     */
    static async exporterFichier(req, res) {
        try {
            console.log('Début de l\'export avec téléchargement');
            
            // Vérifier les permissions
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'exporter_donnees')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante pour exporter'
                });
            }

            const format = req.query.format || 'excel';
            const type = req.query.type || 'enquetes';
            const nomFichier = req.query.nom || null;

            console.log(`Export demandé - Format: ${format}, Type: ${type}`);

            let donnees = {};

            // Récupérer les données selon le type demandé
            switch (type) {
                case 'enquetes':
                    donnees.enquetes = await StatistiquesControleur.obtenirDonneesEnquetes();
                    break;
                
                case 'statistiques':
                    donnees = await StatistiquesControleur.obtenirDonneesStatistiques();
                    break;
                
                case 'complet':
                    donnees.enquetes = await StatistiquesControleur.obtenirDonneesEnquetes();
                    const stats = await StatistiquesControleur.obtenirDonneesStatistiques();
                    donnees = { ...donnees, ...stats };
                    break;
                
                default:
                    return res.status(400).json({
                        succes: false,
                        message: 'Type d\'export invalide'
                    });
            }

            console.log(`Données récupérées - Enquêtes: ${donnees.enquetes?.length || 0}`);

            // Enregistrer l'action
            await Utilisateur.enregistrerLog(
                req.utilisateur.id_utilisateur,
                'export_donnees',
                `Export ${type} en format ${format}`,
                req.ip,
                req.get('User-Agent')
            );

            // Utiliser la fonction d'export avec téléchargement direct
            envoyerFichierExport(req, res, donnees, format);

        } catch (erreur) {
            console.error('Erreur export fichier:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de l\'export du fichier',
                erreur: erreur.message
            });
        }
    }

    /**
     * Prévisualisation des données d'export
     * GET /api/statistiques/export-preview?type=enquetes
     */
    static async previsualiserExport(req, res) {
        try {
            const type = req.query.type || 'enquetes';
            
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            let donnees = {};
            let preview = {};

            switch (type) {
                case 'enquetes':
                    donnees.enquetes = await StatistiquesControleur.obtenirDonneesEnquetes();
                    preview = {
                        nombreEnquetes: donnees.enquetes.length,
                        premieresEnquetes: donnees.enquetes.slice(0, 5),
                        colonnes: donnees.enquetes.length > 0 ? Object.keys(donnees.enquetes[0]) : []
                    };
                    break;
                
                case 'statistiques':
                    donnees = await StatistiquesControleur.obtenirDonneesStatistiques();
                    preview = {
                        satisfaction: donnees.satisfaction || [],
                        services: donnees.services || [],
                        raisons: donnees.raisons || [],
                        mensuelles: donnees.mensuelles || []
                    };
                    break;
            }

            res.json({
                succes: true,
                message: 'Prévisualisation des données d\'export',
                data: preview
            });

        } catch (erreur) {
            console.error('Erreur prévisualisation export:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la prévisualisation',
                erreur: erreur.message
            });
        }
    }

    /**
     * Export par période
     * POST /api/statistiques/export-periode
     */
    static async exporterPeriode(req, res) {
        try {
            const { dateDebut, dateFin, format = 'excel', includeStats = true } = req.body;

            // Vérifier les permissions
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'exporter_donnees')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante pour exporter'
                });
            }

            if (!dateDebut || !dateFin) {
                return res.status(400).json({
                    succes: false,
                    message: 'Date de début et date de fin requises'
                });
            }

            // Récupérer les enquêtes pour la période
            const enquetes = await executerRequete(`
                SELECT 
                    e.*,
                    s.nom_service
                FROM enquetes e
                LEFT JOIN services s ON e.id_service = s.id_service
                WHERE e.date_heure_visite BETWEEN ? AND ?
                ORDER BY e.date_heure_visite DESC
            `, [dateDebut, dateFin]);

            let donnees = { enquetes };

            // Ajouter les statistiques si demandé
            if (includeStats) {
                const statsServices = await executerRequete(`
                    SELECT 
                        s.nom_service,
                        COUNT(e.id_enquete) as nombre_enquetes,
                        SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                        SUM(CASE WHEN e.niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                        ROUND((SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id_enquete)), 2) as taux_satisfaction
                    FROM services s
                    LEFT JOIN enquetes e ON s.id_service = e.id_service
                    WHERE e.date_heure_visite BETWEEN ? AND ?
                    GROUP BY s.id_service, s.nom_service
                    HAVING nombre_enquetes > 0
                    ORDER BY nombre_enquetes DESC
                `, [dateDebut, dateFin]);

                donnees.services = statsServices;
            }

            // Enregistrer l'action
            await Utilisateur.enregistrerLog(
                req.utilisateur.id_utilisateur,
                'export_donnees',
                `Export période ${dateDebut} à ${dateFin} en format ${format}`,
                req.ip,
                req.get('User-Agent')
            );

            // Utiliser la fonction d'export
            envoyerFichierExport(req, res, donnees, format);

        } catch (erreur) {
            console.error('Erreur export période:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de l\'export par période',
                erreur: erreur.message
            });
        }
    }

    /**
     * Récupère toutes les données des enquêtes pour l'export
     */
    static async obtenirDonneesEnquetes() {
        return await executerRequete(`
            SELECT 
                e.id_enquete,
                e.date_heure_visite,
                e.nom_visiteur,
                e.prenom_visiteur,
                e.telephone,
                e.email,
                e.raison_presence,
                e.niveau_satisfaction,
                s.nom_service,
                e.commentaires,
                e.recommandations,
                e.date_soumission,
                e.adresse_ip
            FROM enquetes e
            LEFT JOIN services s ON e.id_service = s.id_service
            ORDER BY e.date_heure_visite DESC
        `);
    }

    /**
     * Récupère toutes les données statistiques pour l'export
     */
    static async obtenirDonneesStatistiques() {
        const [satisfaction, services, raisons, mensuelles] = await Promise.all([
            executerRequete('SELECT * FROM vue_statistiques_satisfaction'),
            executerRequete('SELECT * FROM vue_statistiques_services'),
            executerRequete('SELECT * FROM vue_statistiques_raisons'),
            executerRequete('SELECT * FROM vue_statistiques_mensuelles ORDER BY annee DESC, mois DESC LIMIT 12')
        ]);

        return {
            satisfaction,
            services,
            raisons,
            mensuelles
        };
    }

    static async obtenirStatistiquesSatisfaction(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const statsSatisfaction = await executerRequete(`
                SELECT * FROM vue_statistiques_satisfaction
            `);

            res.json({
                succes: true,
                message: 'Statistiques de satisfaction récupérées',
                data: statsSatisfaction
            });

        } catch (erreur) {
            console.error('Erreur stats satisfaction:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques de satisfaction',
                erreur: erreur.message
            });
        }
    }

    static async obtenirStatistiquesServices(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const statsServices = await executerRequete(`
                SELECT * FROM vue_statistiques_services
            `);

            res.json({
                succes: true,
                message: 'Statistiques par service récupérées',
                data: statsServices
            });

        } catch (erreur) {
            console.error('Erreur stats services:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques par service',
                erreur: erreur.message
            });
        }
    }

    static async obtenirStatistiquesRaisons(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const statsRaisons = await executerRequete(`
                SELECT * FROM vue_statistiques_raisons
            `);

            res.json({
                succes: true,
                message: 'Statistiques par raison de présence récupérées',
                data: statsRaisons
            });

        } catch (erreur) {
            console.error('Erreur stats raisons:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques par raison',
                erreur: erreur.message
            });
        }
    }

    static async obtenirStatistiquesMensuelles(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const nombreMois = parseInt(req.query.mois) || 6;

            const statsMensuelles = await executerRequete(`
                SELECT * FROM vue_statistiques_mensuelles
                ORDER BY annee DESC, mois DESC
                LIMIT ?
            `, [nombreMois]);

            res.json({
                succes: true,
                message: 'Statistiques mensuelles récupérées',
                data: statsMensuelles
            });

        } catch (erreur) {
            console.error('Erreur stats mensuelles:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques mensuelles',
                erreur: erreur.message
            });
        }
    }

    static async obtenirStatistiquesPeriode(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const { dateDebut, dateFin } = req.body;

            if (!dateDebut || !dateFin) {
                return res.status(400).json({
                    succes: false,
                    message: 'Date de début et date de fin requises'
                });
            }

            const statsGlobales = await executerRequete(`
                SELECT 
                    COUNT(*) as total_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as taux_satisfaction
                FROM enquetes
                WHERE date_heure_visite BETWEEN ? AND ?
            `, [dateDebut, dateFin]);

            const statsServices = await executerRequete(`
                SELECT 
                    s.nom_service,
                    COUNT(e.id_enquete) as nombre_enquetes,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id_enquete)), 2) as taux_satisfaction
                FROM services s
                LEFT JOIN enquetes e ON s.id_service = e.id_service
                WHERE e.date_heure_visite BETWEEN ? AND ?
                GROUP BY s.id_service, s.nom_service
                ORDER BY nombre_enquetes DESC
            `, [dateDebut, dateFin]);

            res.json({
                succes: true,
                message: 'Statistiques pour la période récupérées',
                data: {
                    periode: { dateDebut, dateFin },
                    globales: statsGlobales[0],
                    services: statsServices
                }
            });

        } catch (erreur) {
            console.error('Erreur stats période:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques pour la période',
                erreur: erreur.message
            });
        }
    }

    static async obtenirLogs(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_logs')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante pour voir les logs'
                });
            }

            const page = parseInt(req.query.page) || 1;
            const limite = parseInt(req.query.limite) || 50;
            const offset = (page - 1) * limite;

            const [total] = await executerRequete(`
                SELECT COUNT(*) as total FROM logs_activite
            `);

            const logs = await executerRequete(`
                SELECT 
                    l.*,
                    u.nom_utilisateur,
                    u.nom,
                    u.prenom,
                    u.role
                FROM logs_activite l
                LEFT JOIN utilisateurs u ON l.id_utilisateur = u.id_utilisateur
                ORDER BY l.date_action DESC
                LIMIT ? OFFSET ?
            `, [limite, offset]);

            res.json({
                succes: true,
                message: 'Logs d\'activité récupérés',
                data: {
                    logs: logs,
                    pagination: {
                        page: page,
                        limite: limite,
                        total: total.total,
                        totalPages: Math.ceil(total.total / limite)
                    }
                }
            });

        } catch (erreur) {
            console.error('Erreur logs activité:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des logs',
                erreur: erreur.message
            });
        }
    }

    static async obtenirResume(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            if (!Utilisateur.verifierPermission(req.utilisateur.role, 'voir_statistiques')) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permission insuffisante'
                });
            }

            const resume = await executerRequete(`
                SELECT 
                    COUNT(*) as total_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as total_satisfaits,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as taux_satisfaction,
                    COUNT(CASE WHEN DATE(date_soumission) = CURDATE() THEN 1 END) as enquetes_aujourd_hui,
                    COUNT(CASE WHEN WEEK(date_soumission) = WEEK(CURDATE()) THEN 1 END) as enquetes_cette_semaine,
                    COUNT(CASE WHEN MONTH(date_soumission) = MONTH(CURDATE()) THEN 1 END) as enquetes_ce_mois
                FROM enquetes
            `);

            res.json({
                succes: true,
                message: 'Résumé des statistiques récupéré',
                data: resume[0]
            });

        } catch (erreur) {
            console.error('Erreur résumé stats:', erreur);
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération du résumé',
                erreur: erreur.message
            });
        }
    }
}

module.exports = StatistiquesControleur;