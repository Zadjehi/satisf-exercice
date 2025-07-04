// Routes Statistiques avec Export Excel
const express = require('express');
const routerStats = express.Router();
const StatistiquesControleur = require('../controleurs/statistiquesControleur');
const { verifierAuthentification } = require('../middleware/authentification');
const { validerPeriodeStats } = require('../middleware/validation');

// Middleware pour toutes les routes de statistiques
routerStats.use(verifierAuthentification);

// Routes statistiques générales

/**
 * Obtenir toutes les statistiques pour le dashboard
 * GET /api/statistiques/dashboard
 */
routerStats.get('/dashboard', StatistiquesControleur.obtenirStatistiquesDashboard);

/**
 * Obtenir un résumé rapide pour le header du dashboard
 * GET /api/statistiques/resume
 */
routerStats.get('/resume', StatistiquesControleur.obtenirResume);

/**
 * Obtenir les statistiques de satisfaction
 * GET /api/statistiques/satisfaction
 */
routerStats.get('/satisfaction', StatistiquesControleur.obtenirStatistiquesSatisfaction);

/**
 * Obtenir les statistiques par service
 * GET /api/statistiques/services
 */
routerStats.get('/services', StatistiquesControleur.obtenirStatistiquesServices);

/**
 * Obtenir les statistiques par raison de présence
 * GET /api/statistiques/raisons
 */
routerStats.get('/raisons', StatistiquesControleur.obtenirStatistiquesRaisons);

/**
 * Obtenir les statistiques mensuelles
 * GET /api/statistiques/mensuelles?mois=6
 */
routerStats.get('/mensuelles', StatistiquesControleur.obtenirStatistiquesMensuelles);

/**
 * Obtenir les statistiques pour une période personnalisée
 * POST /api/statistiques/periode
 * Body: { dateDebut, dateFin }
 */
routerStats.post('/periode', validerPeriodeStats, StatistiquesControleur.obtenirStatistiquesPeriode);

// Routes export de données

/**
 * Export direct Excel/CSV avec téléchargement
 * GET /api/statistiques/export?format=excel&type=enquetes
 * Query params:
 * - format: excel|csv (défaut: excel)
 * - type: enquetes|statistiques|complet (défaut: enquetes)
 * - nom: nom personnalisé du fichier (optionnel)
 */
routerStats.get('/export', StatistiquesControleur.exporterFichier);

/**
 * Export en JSON pour prévisualisation
 * GET /api/statistiques/export-preview?type=enquetes
 * Retourne les données formatées en JSON pour prévisualisation
 */
routerStats.get('/export-preview', StatistiquesControleur.previsualiserExport);

/**
 * Export par période avec filtres
 * POST /api/statistiques/export-periode
 * Body: { dateDebut, dateFin, format, includeStats }
 */
routerStats.post('/export-periode', validerPeriodeStats, StatistiquesControleur.exporterPeriode);

// Routes logs et audit

/**
 * Obtenir les logs d'activité (admin et directrice seulement)
 * GET /api/statistiques/logs?page=1&limite=50
 */
routerStats.get('/logs', StatistiquesControleur.obtenirLogs);

module.exports = routerStats;
