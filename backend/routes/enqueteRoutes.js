// Routes Enquêtes
const express = require('express');
const router = express.Router();
const EnqueteControleur = require('../controleurs/enqueteControleur');
const { verifierAuthentification } = require('../middleware/authentification');
const { 
    validerDonneesEnquete,
    validerPagination,
    sanitiserDonnees
} = require('../middleware/validation');

// Middleware de validation ID simple
const validerIdNumerique = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
        return res.status(400).json({
            succes: false,
            message: 'ID invalide - doit être un nombre entier positif'
        });
    }
    next();
};

// Routes publiques (sans authentification)

/**
 * Créer une nouvelle enquête de satisfaction avec validation
 * POST /api/enquetes
 */
router.post('/', sanitiserDonnees, validerDonneesEnquete, EnqueteControleur.creerEnquete);

/**
 * Obtenir la liste des services disponibles pour le formulaire
 * GET /api/enquetes/services
 */
router.get('/services', EnqueteControleur.obtenirServices);

/**
 * Valider les données d'une enquête avant soumission
 * POST /api/enquetes/valider
 */
router.post('/valider', sanitiserDonnees, validerDonneesEnquete, EnqueteControleur.validerDonnees);

// Routes protégées (avec authentification)

/**
 * Obtenir toutes les enquêtes avec pagination et validation
 * GET /api/enquetes?page=1&limite=10&recherche=nom&statut=Satisfait&raison=Information
 */
router.get('/', 
    verifierAuthentification, 
    validerPagination, 
    EnqueteControleur.obtenirToutesEnquetes
);

/**
 * Obtenir le nombre total d'enquêtes (pour dashboard)
 * GET /api/enquetes/total
 */
router.get('/total', verifierAuthentification, EnqueteControleur.obtenirTotalEnquetes);

/**
 * Obtenir une enquête spécifique par ID avec validation
 * GET /api/enquetes/:id
 */
router.get('/:id', 
    verifierAuthentification, 
    validerIdNumerique, 
    EnqueteControleur.obtenirEnqueteParId
);

/**
 * Filtrer les enquêtes selon des critères (méthode alternative)
 * POST /api/enquetes/filtrer
 */
router.post('/filtrer', verifierAuthentification, EnqueteControleur.filtrerEnquetes);

/**
 * Supprimer une enquête avec validation (admin seulement)
 * DELETE /api/enquetes/:id
 */
router.delete('/:id', 
    verifierAuthentification, 
    validerIdNumerique, 
    EnqueteControleur.supprimerEnquete
);

module.exports = router;