// Modèle Enquête avec notifications
const { executerRequete, executerRequetePaginee, executerRequeteSimple, executerTransaction } = require('../config/database');
const Notification = require('./Notification');

class Enquete {

    /**
     * Crée une nouvelle enquête de satisfaction avec notification
     * @param {Object} donneesEnquete - Données de l'enquête
     * @returns {Promise<Object>} Résultat de l'insertion
     */
    static async creerEnquete(donneesEnquete) {
        const requete = `
            INSERT INTO enquetes (
                date_heure_visite,
                nom_visiteur,
                prenom_visiteur,
                telephone,
                email,
                raison_presence,
                niveau_satisfaction,
                id_service,
                commentaires,
                recommandations,
                adresse_ip,
                user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const parametres = [
            donneesEnquete.dateHeureVisite,
            donneesEnquete.nomVisiteur,
            donneesEnquete.prenomVisiteur || null,
            donneesEnquete.telephone,
            donneesEnquete.email || null,
            donneesEnquete.raisonPresence,
            donneesEnquete.niveauSatisfaction,
            donneesEnquete.idService,
            donneesEnquete.commentaires || null,
            donneesEnquete.recommandations || null,
            donneesEnquete.adresseIP || null,
            donneesEnquete.userAgent || null
        ];

        try {
            console.log('Insertion enquête...');
            const resultat = await executerRequete(requete, parametres);
            console.log('Enquête insérée, ID:', resultat.insertId);
            
            // Créer une notification après insertion de l'enquête
            try {
                // Récupérer les infos du service pour la notification
                const [service] = await executerRequete(
                    'SELECT nom_service FROM services WHERE id_service = ?', 
                    [donneesEnquete.idService]
                );

                // Préparer les données pour la notification
                const donneesNotification = {
                    id_enquete: resultat.insertId,
                    nom_visiteur: donneesEnquete.nomVisiteur,
                    prenom_visiteur: donneesEnquete.prenomVisiteur,
                    niveau_satisfaction: donneesEnquete.niveauSatisfaction,
                    raison_presence: donneesEnquete.raisonPresence,
                    nom_service: service ? service.nom_service : 'Service inconnu',
                    date_heure_visite: donneesEnquete.dateHeureVisite,
                    commentaires: donneesEnquete.commentaires
                };

                // Créer la notification
                await Notification.creerNotificationNouvelleEnquete(donneesNotification);
                console.log('Notification créée pour la nouvelle enquête');

            } catch (erreurNotification) {
                // Ne pas faire échouer l'enquête si la notification échoue
                console.error('Erreur création notification (enquête créée quand même):', erreurNotification.message);
            }
            
            return {
                succes: true,
                idEnquete: resultat.insertId,
                message: 'Enquête créée avec succès'
            };
        } catch (erreur) {
            console.error('Erreur insertion enquête:', erreur);
            throw new Error(`Erreur lors de la création de l'enquête: ${erreur.message}`);
        }
    }

    /**
     * Récupère toutes les enquêtes avec pagination
     * @param {number} page - Numéro de page (défaut: 1)
     * @param {number} limite - Nombre d'enquêtes par page (défaut: 20)
     * @returns {Promise<Object>} Liste des enquêtes avec pagination
     */
    static async obtenirToutesEnquetes(page = 1, limite = 20) {
        try {
            console.log(`Récupération enquêtes - Page: ${page}, Limite: ${limite}`);
            
            // Compter le total
            const requeteTotal = `SELECT COUNT(*) as total FROM enquetes`;
            const [total] = await executerRequete(requeteTotal);
            
            console.log(`Total enquêtes dans la base: ${total.total}`);
            
            // Validation et calcul des paramètres de pagination
            const pageNumber = Math.max(1, parseInt(page) || 1);
            const limiteNumber = Math.max(1, Math.min(100, parseInt(limite) || 20));
            const offset = (pageNumber - 1) * limiteNumber;
            
            console.log(`Pagination: page=${pageNumber}, limite=${limiteNumber}, offset=${offset}`);

            // Requête avec LIMIT/OFFSET intégrés
            const requeteComplete = `
                SELECT 
                    e.id_enquete,
                    e.date_heure_visite,
                    e.nom_visiteur,
                    e.prenom_visiteur,
                    e.telephone,
                    e.email,
                    e.raison_presence,
                    e.niveau_satisfaction,
                    e.id_service,
                    e.commentaires,
                    e.recommandations,
                    e.date_soumission,
                    s.nom_service,
                    s.description_service
                FROM enquetes e
                LEFT JOIN services s ON e.id_service = s.id_service
                ORDER BY e.date_soumission DESC
                LIMIT ${limiteNumber} OFFSET ${offset}
            `;

            console.log('Exécution de la requête paginée...');
            
            // Exécution avec la fonction simple (pas de paramètres préparés)
            const enquetes = await executerRequeteSimple(requeteComplete);
            
            console.log(`${enquetes.length} enquêtes récupérées pour la page ${pageNumber}`);

            return {
                enquetes: enquetes,
                pagination: {
                    page: pageNumber,
                    limite: limiteNumber,
                    total: total.total,
                    totalPages: Math.ceil(total.total / limiteNumber)
                }
            };
        } catch (erreur) {
            console.error('Erreur récupération enquêtes:', erreur);
            throw new Error(`Erreur lors de la récupération des enquêtes: ${erreur.message}`);
        }
    }

    /**
     * Récupère une enquête par son ID
     * @param {number} idEnquete - ID de l'enquête
     * @returns {Promise<Object>} Détails de l'enquête
     */
    static async obtenirEnqueteParId(idEnquete) {
        const requete = `
            SELECT 
                e.*,
                s.nom_service,
                s.description_service
            FROM enquetes e
            LEFT JOIN services s ON e.id_service = s.id_service
            WHERE e.id_enquete = ?
        `;

        try {
            const resultats = await executerRequete(requete, [idEnquete]);
            return resultats[0] || null;
        } catch (erreur) {
            throw new Error(`Erreur lors de la récupération de l'enquête: ${erreur.message}`);
        }
    }

    /**
     * Filtre les enquêtes selon différents critères
     * @param {Object} filtres - Critères de filtrage
     * @returns {Promise<Array>} Liste des enquêtes filtrées
     */
    static async filtrerEnquetes(filtres) {
        let requete = `
            SELECT 
                e.*,
                s.nom_service
            FROM enquetes e
            LEFT JOIN services s ON e.id_service = s.id_service
            WHERE 1=1
        `;
        let parametres = [];

        // Filtre par date de début
        if (filtres.dateDebut) {
            requete += ` AND e.date_heure_visite >= ?`;
            parametres.push(filtres.dateDebut);
        }

        // Filtre par date de fin
        if (filtres.dateFin) {
            requete += ` AND e.date_heure_visite <= ?`;
            parametres.push(filtres.dateFin);
        }

        // Filtre par niveau de satisfaction
        if (filtres.niveauSatisfaction) {
            requete += ` AND e.niveau_satisfaction = ?`;
            parametres.push(filtres.niveauSatisfaction);
        }

        // Filtre par service
        if (filtres.idService) {
            requete += ` AND e.id_service = ?`;
            parametres.push(filtres.idService);
        }

        // Filtre par raison de présence
        if (filtres.raisonPresence) {
            requete += ` AND e.raison_presence = ?`;
            parametres.push(filtres.raisonPresence);
        }

        requete += ` ORDER BY e.date_soumission DESC`;

        try {
            return await executerRequete(requete, parametres);
        } catch (erreur) {
            throw new Error(`Erreur lors du filtrage des enquêtes: ${erreur.message}`);
        }
    }

    /**
     * Obtient les statistiques globales des enquêtes
     * @returns {Promise<Object>} Statistiques complètes
     */
    static async obtenirStatistiques() {
        try {
            console.log('Calcul des statistiques globales...');

            // Statistiques de satisfaction
            const statsSatisfaction = await executerRequete(`
                SELECT 
                    niveau_satisfaction,
                    COUNT(*) as nombre_reponses,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM enquetes)), 2) as pourcentage
                FROM enquetes 
                GROUP BY niveau_satisfaction
            `);

            // Statistiques par service
            const statsServices = await executerRequete(`
                SELECT 
                    s.nom_service,
                    COUNT(e.id_enquete) as nombre_enquetes,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN e.niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN e.niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id_enquete)), 2) as taux_satisfaction
                FROM services s 
                LEFT JOIN enquetes e ON s.id_service = e.id_service 
                WHERE s.actif = 1
                GROUP BY s.id_service, s.nom_service
                HAVING COUNT(e.id_enquete) > 0
                ORDER BY nombre_enquetes DESC
            `);

            // Statistiques par raison de présence
            const statsRaisons = await executerRequete(`
                SELECT 
                    raison_presence,
                    COUNT(*) as nombre_visites,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as taux_satisfaction
                FROM enquetes 
                GROUP BY raison_presence 
                ORDER BY nombre_visites DESC
            `);

            // Statistiques mensuelles (6 derniers mois)
            const statsMensuelles = await executerRequete(`
                SELECT 
                    YEAR(date_heure_visite) as annee,
                    MONTH(date_heure_visite) as mois,
                    MONTHNAME(date_heure_visite) as nom_mois,
                    COUNT(*) as nombre_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as taux_satisfaction
                FROM enquetes 
                WHERE date_heure_visite >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY YEAR(date_heure_visite), MONTH(date_heure_visite), MONTHNAME(date_heure_visite)
                ORDER BY annee DESC, mois DESC
                LIMIT 6
            `);

            // Statistiques récentes
            const [statsRecentes] = await executerRequete(`
                SELECT 
                    COUNT(*) as total_enquetes,
                    SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) as satisfaits,
                    SUM(CASE WHEN niveau_satisfaction = 'Mécontent' THEN 1 ELSE 0 END) as mecontents,
                    COUNT(CASE WHEN DATE(date_soumission) = CURDATE() THEN 1 END) as aujourd_hui,
                    COUNT(CASE WHEN YEARWEEK(date_soumission) = YEARWEEK(NOW()) THEN 1 END) as cette_semaine,
                    COUNT(CASE WHEN MONTH(date_soumission) = MONTH(NOW()) AND YEAR(date_soumission) = YEAR(NOW()) THEN 1 END) as ce_mois
                FROM enquetes
            `);

            console.log('Statistiques calculées:', {
                satisfaction: statsSatisfaction.length,
                services: statsServices.length,
                raisons: statsRaisons.length,
                mensuelles: statsMensuelles.length,
                total: statsRecentes.total_enquetes
            });

            return {
                satisfaction: statsSatisfaction,
                services: statsServices,
                raisons: statsRaisons,
                mensuelles: statsMensuelles,
                recentes: statsRecentes
            };
        } catch (erreur) {
            console.error('Erreur calcul statistiques:', erreur);
            throw new Error(`Erreur lors du calcul des statistiques: ${erreur.message}`);
        }
    }

    /**
     * Compte le nombre total d'enquêtes
     * @returns {Promise<number>} Nombre total d'enquêtes
     */
    static async compterTotal() {
        try {
            const [resultat] = await executerRequete('SELECT COUNT(*) as total FROM enquetes');
            return resultat.total || 0;
        } catch (erreur) {
            console.error('Erreur comptage total:', erreur);
            return 0;
        }
    }

    /**
     * Calcule la satisfaction moyenne
     * @returns {Promise<number>} Taux de satisfaction moyen
     */
    static async calculerSatisfactionMoyenne() {
        try {
            const [resultat] = await executerRequete(`
                SELECT 
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as taux_satisfaction
                FROM enquetes
            `);
            return parseFloat(resultat.taux_satisfaction) || 0;
        } catch (erreur) {
            console.error('Erreur calcul satisfaction:', erreur);
            return 0;
        }
    }

    /**
     * Obtient les statistiques mensuelles
     * @returns {Promise<Array>} Données mensuelles
     */
    static async obtenirStatistiquesMensuelles() {
        try {
            return await executerRequete(`
                SELECT 
                    YEAR(date_heure_visite) as annee,
                    MONTH(date_heure_visite) as mois,
                    COUNT(*) as total,
                    ROUND((SUM(CASE WHEN niveau_satisfaction = 'Satisfait' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1) as satisfaction
                FROM enquetes 
                WHERE date_heure_visite >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY YEAR(date_heure_visite), MONTH(date_heure_visite)
                ORDER BY annee DESC, mois DESC
                LIMIT 6
            `);
        } catch (erreur) {
            console.error('Erreur stats mensuelles:', erreur);
            return [];
        }
    }

    /**
     * Exporte les enquêtes pour Excel/CSV
     * @param {Object} filtres - Filtres optionnels
     * @returns {Promise<Array>} Données formatées pour export
     */
    static async exporterEnquetes(filtres = {}) {
        const requete = `
            SELECT 
                e.id_enquete as 'ID',
                e.date_heure_visite as 'Date/Heure Visite',
                e.nom_visiteur as 'Nom',
                e.prenom_visiteur as 'Prénom',
                e.telephone as 'Téléphone',
                e.email as 'Email',
                e.raison_presence as 'Raison Présence',
                e.niveau_satisfaction as 'Satisfaction',
                s.nom_service as 'Service',
                e.commentaires as 'Commentaires',
                e.recommandations as 'Recommandations',
                e.date_soumission as 'Date Soumission'
            FROM enquetes e
            LEFT JOIN services s ON e.id_service = s.id_service
            ORDER BY e.date_soumission DESC
        `;

        try {
            return await executerRequete(requete);
        } catch (erreur) {
            throw new Error(`Erreur lors de l'export des enquêtes: ${erreur.message}`);
        }
    }

    /**
     * Supprime une enquête (fonction admin)
     * @param {number} idEnquete - ID de l'enquête à supprimer
     * @returns {Promise<Object>} Résultat de la suppression
     */
    static async supprimerEnquete(idEnquete) {
        const requete = `DELETE FROM enquetes WHERE id_enquete = ?`;

        try {
            const resultat = await executerRequete(requete, [idEnquete]);
            
            if (resultat.affectedRows === 0) {
                return {
                    succes: false,
                    message: 'Enquête non trouvée'
                };
            }

            return {
                succes: true,
                message: 'Enquête supprimée avec succès'
            };
        } catch (erreur) {
            throw new Error(`Erreur lors de la suppression de l'enquête: ${erreur.message}`);
        }
    }

    /**
     * Valide les données d'une enquête avant insertion
     * @param {Object} donneesEnquete - Données à valider
     * @returns {Object} Résultat de la validation
     */
    static validerDonneesEnquete(donneesEnquete) {
        const erreurs = [];

        // Validation des champs obligatoires
        if (!donneesEnquete.dateHeureVisite) {
            erreurs.push('Date et heure de visite obligatoires');
        }

        if (!donneesEnquete.nomVisiteur || donneesEnquete.nomVisiteur.trim().length < 2) {
            erreurs.push('Nom visiteur obligatoire (minimum 2 caractères)');
        }

        if (!donneesEnquete.telephone || !/^(\+225\s?)?[0-9]{8,10}$/.test(donneesEnquete.telephone)) {
            erreurs.push('Numéro de téléphone valide obligatoire (format ivoirien)');
        }

        if (donneesEnquete.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donneesEnquete.email)) {
            erreurs.push('Format email invalide');
        }

        const raisonsValides = ['Information', 'Prise de sang (Bilan)', 'Retrait de résultat'];
        if (!raisonsValides.includes(donneesEnquete.raisonPresence)) {
            erreurs.push('Raison de présence invalide');
        }

        const satisfactionValide = ['Satisfait', 'Mécontent'];
        if (!satisfactionValide.includes(donneesEnquete.niveauSatisfaction)) {
            erreurs.push('Niveau de satisfaction invalide');
        }

        if (!donneesEnquete.idService || donneesEnquete.idService < 1) {
            erreurs.push('Service obligatoire');
        }

        // Validation des commentaires et recommandations (optionnels)
        if (donneesEnquete.commentaires && donneesEnquete.commentaires.length > 1000) {
            erreurs.push('Commentaires trop longs (maximum 1000 caractères)');
        }

        if (donneesEnquete.recommandations && donneesEnquete.recommandations.length > 1000) {
            erreurs.push('Recommandations trop longues (maximum 1000 caractères)');
        }

        return {
            valide: erreurs.length === 0,
            erreurs: erreurs
        };
    }
}

module.exports = Enquete;