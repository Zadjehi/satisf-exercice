// backend/controleurs/dashboardControleur.js

const Enquete = require('../modeles/Enquete');
const { executerRequete } = require('../config/database');

class DashboardControleur {
    static async obtenirStatistiques(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise',
                    code: 'AUTH_REQUIRED'
                });
            }

            const rolesAutorises = ['Administrateur', 'Responsable Qualité', 'Directrice Générale', 'SuperAdmin'];
            if (!rolesAutorises.includes(req.utilisateur.role)) {
                return res.status(403).json({
                    succes: false,
                    message: 'Permissions insuffisantes pour accéder au dashboard',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            const stats = await DashboardControleur.calculerStatistiquesCompletes();

            res.json({
                succes: true,
                message: 'Statistiques récupérées avec succès',
                data: stats
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques',
                code: 'STATS_ERROR',
                erreur: process.env.NODE_ENV === 'development' ? erreur.message : undefined
            });
        }
    }

    static async calculerStatistiquesCompletes() {
        try {
            const [statsGenerales] = await executerRequete(`
                SELECT 
                    COUNT(*) as total_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as taux_satisfaction
                FROM enquetes
            `);

            const totalEnquetes = statsGenerales.total_enquetes || 0;
            const satisfactionMoyenne = parseFloat(statsGenerales.taux_satisfaction) || 0;
            const insatisfactionMoyenne = 100 - satisfactionMoyenne;

            const mensuelles = await executerRequete(`
                SELECT 
                    YEAR(date_heure_visite) as annee,
                    MONTH(date_heure_visite) as mois,
                    MONTHNAME(date_heure_visite) as nom_mois,
                    COUNT(*) as nombre_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as taux_satisfaction
                FROM enquetes 
                WHERE date_heure_visite >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY YEAR(date_heure_visite), MONTH(date_heure_visite), MONTHNAME(date_heure_visite)
                ORDER BY annee DESC, mois DESC
                LIMIT 6
            `);

            const services = await executerRequete(`
                SELECT 
                    s.nom_service,
                    COUNT(e.id_enquete) as nombre_enquetes,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id_enquete)), 1) as taux_satisfaction
                FROM services s 
                LEFT JOIN enquetes e ON s.id_service = e.id_service 
                WHERE s.actif = 1
                GROUP BY s.id_service, s.nom_service
                HAVING COUNT(e.id_enquete) > 0
                ORDER BY nombre_enquetes DESC
            `);

            const [statsRecentes] = await executerRequete(`
                SELECT 
                    COUNT(CASE WHEN DATE(date_soumission) = CURDATE() THEN 1 END) as aujourd_hui,
                    COUNT(CASE WHEN YEARWEEK(date_soumission) = YEARWEEK(NOW()) THEN 1 END) as cette_semaine,
                    COUNT(CASE WHEN MONTH(date_soumission) = MONTH(NOW()) AND YEAR(date_soumission) = YEAR(NOW()) THEN 1 END) as ce_mois
                FROM enquetes
            `);

            const tendances = {
                enquetes: totalEnquetes > 50 ? 12 : totalEnquetes > 20 ? 8 : totalEnquetes > 0 ? 5 : 0,
                satisfaction: satisfactionMoyenne > 80 ? 5 : satisfactionMoyenne > 60 ? 3 : satisfactionMoyenne > 40 ? 0 : -2,
                insatisfaction: insatisfactionMoyenne < 20 ? -5 : insatisfactionMoyenne < 40 ? -2 : insatisfactionMoyenne < 60 ? 2 : 5
            };

            return {
                totalEnquetes,
                satisfactionMoyenne: Math.round(satisfactionMoyenne * 10) / 10,
                insatisfactionMoyenne: Math.round(insatisfactionMoyenne * 10) / 10,
                tendances,
                mensuelles,
                services,
                statsRecentes,
                derniereMAJ: new Date().toISOString(),
                periode: 'Derniers 6 mois'
            };

        } catch (erreur) {
            return {
                totalEnquetes: 0,
                satisfactionMoyenne: 0,
                insatisfactionMoyenne: 100,
                tendances: {
                    enquetes: 0,
                    satisfaction: 0,
                    insatisfaction: 0
                },
                mensuelles: [],
                services: [],
                statsRecentes: {
                    aujourd_hui: 0,
                    cette_semaine: 0,
                    ce_mois: 0
                },
                derniereMAJ: new Date().toISOString(),
                periode: 'Aucune donnée disponible'
            };
        }
    }

    static async obtenirStatistiquesTempsReel(req, res) {
        try {
            if (!req.utilisateur) {
                return res.status(401).json({
                    succes: false,
                    message: 'Authentification requise'
                });
            }

            const [statsTempsReel] = await executerRequete(`
                SELECT 
                    COUNT(CASE WHEN DATE(date_soumission) = CURDATE() THEN 1 END) as enquetes_aujourd_hui,
                    ROUND(AVG(CASE WHEN DATE(date_soumission) = CURDATE() AND niveau_satisfaction = 'Satisfait' THEN 100 ELSE 0 END), 1) as satisfaction_moyenne_jour
                FROM enquetes
            `);

            const stats = {
                enquetesAujourdhui: statsTempsReel.enquetes_aujourd_hui || 0,
                satisfactionMoyenneJour: statsTempsReel.satisfaction_moyenne_jour || 0,
                derniereMiseAJour: new Date().toISOString()
            };

            res.json({
                succes: true,
                data: stats
            });

        } catch (erreur) {
            res.status(500).json({
                succes: false,
                message: 'Erreur lors de la récupération des statistiques temps réel'
            });
        }
    }
}

module.exports = DashboardControleur;
