// Middleware de validation des données
const { validerMotDePasse } = require('../config/auth');

/**
 * Valide les données d'une enquête
 */
const validerDonneesEnquete = (req, res, next) => {
    const erreurs = [];
    
    console.log('Validation middleware - Données reçues:', req.body);
    
    // Adapter aux noms de champs du frontend
    const { 
        dateVisite,        // Frontend envoie dateVisite 
        heureVisite,       // Frontend envoie heureVisite
        nom,               // Frontend envoie nom
        telephone, 
        email, 
        raisonPresence, 
        satisfaction,      // Frontend envoie satisfaction 
        serviceConcerne    // Frontend envoie serviceConcerne 
    } = req.body;

    // Validation date de visite
    if (!dateVisite) {
        erreurs.push('Date de visite obligatoire');
    } else {
        const dateVisiteObj = new Date(dateVisite);
        if (isNaN(dateVisiteObj.getTime())) {
            erreurs.push('Format de date invalide');
        } else {
            // Vérifier que la date n'est pas trop dans le futur (max 1 jour)
            const maintenant = new Date();
            const unJourDansLeFutur = new Date(maintenant.getTime() + 24 * 60 * 60 * 1000);
            if (dateVisiteObj > unJourDansLeFutur) {
                erreurs.push('La date de visite ne peut pas être dans le futur');
            }
        }
    }

    // Validation heure de visite
    if (!heureVisite) {
        erreurs.push('Heure de visite obligatoire');
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(heureVisite)) {
        erreurs.push('Format d\'heure invalide (HH:MM)');
    }

    // Validation nom visiteur
    if (!nom || typeof nom !== 'string') {
        erreurs.push('Nom du visiteur obligatoire');
    } else if (nom.trim().length < 2) {
        erreurs.push('Le nom doit contenir au moins 2 caractères');
    } else if (nom.trim().length > 100) {
        erreurs.push('Le nom ne peut pas dépasser 100 caractères');
    } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(nom.trim())) {
        erreurs.push('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes');
    }

    // Validation prénom 
    if (req.body.prenom) {
        const prenom = req.body.prenom.trim();
        if (prenom.length > 100) {
            erreurs.push('Le prénom ne peut pas dépasser 100 caractères');
        } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(prenom)) {
            erreurs.push('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes');
        }
    }

    // Validation téléphone
    if (!telephone || typeof telephone !== 'string') {
        erreurs.push('Numéro de téléphone obligatoire');
    } else {
        const telNettoye = telephone.replace(/[\s\-\.]/g, '');
        if (!/^(\+33|0)[1-9]([0-9]{8})$/.test(telNettoye)) {
            erreurs.push('Format de téléphone invalide (ex: 01.23.45.67.89 ou +33123456789)');
        }
    }

    // Validation email 
    if (email && email.trim()) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            erreurs.push('Format d\'email invalide');
        }
    }

    // Validation raison de présence
    const raisonsValides = ['Information', 'Prise de sang (Bilan)', 'Retrait de résultat'];
    if (!raisonPresence) {
        erreurs.push('Raison de présence obligatoire');
    } else if (!raisonsValides.includes(raisonPresence)) {
        erreurs.push('Raison de présence invalide');
    }

    // Validation niveau de satisfaction
    const niveauxValides = ['Satisfait', 'Mécontent'];
    if (!satisfaction) {
        erreurs.push('Niveau de satisfaction obligatoire');
    } else if (!niveauxValides.includes(satisfaction)) {
        erreurs.push('Niveau de satisfaction invalide');
    }

    // Validation service
    if (!serviceConcerne) {
        erreurs.push('Service obligatoire');
    } else if (typeof serviceConcerne !== 'string' || serviceConcerne.trim().length === 0) {
        erreurs.push('Service invalide');
    }

    // Validation commentaires 
    if (req.body.commentaires && req.body.commentaires.length > 1000) {
        erreurs.push('Les commentaires ne peuvent pas dépasser 1000 caractères');
    }

    // Validation recommandations
    if (req.body.recommandations && req.body.recommandations.length > 1000) {
        erreurs.push('Les recommandations ne peuvent pas dépasser 1000 caractères');
    }

    if (erreurs.length > 0) {
        console.log('Erreurs de validation:', erreurs);
        return res.status(400).json({
            succes: false,
            message: 'Données invalides',
            erreurs: erreurs
        });
    }

    console.log('Validation réussie');
    next();
};

/**
 * Valide les données de connexion
 */
const validerConnexion = (req, res, next) => {
    const erreurs = [];
    const { nomUtilisateur, motDePasse } = req.body;

    // Validation nom d'utilisateur
    if (!nomUtilisateur || typeof nomUtilisateur !== 'string') {
        erreurs.push('Nom d\'utilisateur obligatoire');
    } else if (nomUtilisateur.trim().length < 3) {
        erreurs.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    } else if (nomUtilisateur.trim().length > 50) {
        erreurs.push('Le nom d\'utilisateur ne peut pas dépasser 50 caractères');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(nomUtilisateur.trim())) {
        erreurs.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }

    // Validation mot de passe
    if (!motDePasse || typeof motDePasse !== 'string') {
        erreurs.push('Mot de passe obligatoire');
    } else if (motDePasse.length < 6) {
        erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (erreurs.length > 0) {
        return res.status(400).json({
            succes: false,
            message: 'Données de connexion invalides',
            erreurs: erreurs
        });
    }

    next();
};

/**
 * Valide les données de création d'utilisateur
 */
const validerCreationUtilisateur = (req, res, next) => {
    const erreurs = [];
    const { nomUtilisateur, motDePasse, nom, prenom, email, role } = req.body;

    // Validation nom d'utilisateur
    if (!nomUtilisateur || typeof nomUtilisateur !== 'string') {
        erreurs.push('Nom d\'utilisateur obligatoire');
    } else if (nomUtilisateur.trim().length < 3) {
        erreurs.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    } else if (nomUtilisateur.trim().length > 50) {
        erreurs.push('Le nom d\'utilisateur ne peut pas dépasser 50 caractères');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(nomUtilisateur.trim())) {
        erreurs.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }

    // Validation mot de passe
    if (!motDePasse || typeof motDePasse !== 'string') {
        erreurs.push('Mot de passe obligatoire');
    } else {
        const validationMdp = validerMotDePasse(motDePasse);
        if (!validationMdp.valide) {
            erreurs.push(validationMdp.message);
        }
    }

    // Validation nom
    if (!nom || typeof nom !== 'string') {
        erreurs.push('Nom obligatoire');
    } else if (nom.trim().length < 2) {
        erreurs.push('Le nom doit contenir au moins 2 caractères');
    } else if (nom.trim().length > 100) {
        erreurs.push('Le nom ne peut pas dépasser 100 caractères');
    } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(nom.trim())) {
        erreurs.push('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes');
    }

    // Validation prénom 
    if (prenom && typeof prenom === 'string') {
        if (prenom.trim().length > 100) {
            erreurs.push('Le prénom ne peut pas dépasser 100 caractères');
        } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(prenom.trim())) {
            erreurs.push('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes');
        }
    }

    // Validation email 
    if (email && email.trim()) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            erreurs.push('Format d\'email invalide');
        }
    }

    // Validation rôle
    const rolesValides = ['Administrateur', 'Responsable Qualité', 'Directrice Générale'];
    if (!role) {
        erreurs.push('Rôle obligatoire');
    } else if (!rolesValides.includes(role)) {
        erreurs.push('Rôle invalide');
    }

    if (erreurs.length > 0) {
        return res.status(400).json({
            succes: false,
            message: 'Données de création utilisateur invalides',
            erreurs: erreurs
        });
    }

    next();
};

/**
 * Valide les données de changement de mot de passe
 */
const validerChangementMotDePasse = (req, res, next) => {
    const erreurs = [];
    const { ancienMotDePasse, nouveauMotDePasse, confirmerMotDePasse } = req.body;

    // Validation ancien mot de passe
    if (!ancienMotDePasse || typeof ancienMotDePasse !== 'string') {
        erreurs.push('Ancien mot de passe obligatoire');
    }

    // Validation nouveau mot de passe
    if (!nouveauMotDePasse || typeof nouveauMotDePasse !== 'string') {
        erreurs.push('Nouveau mot de passe obligatoire');
    } else {
        const validationMdp = validerMotDePasse(nouveauMotDePasse);
        if (!validationMdp.valide) {
            erreurs.push(validationMdp.message);
        }
    }

    // Validation confirmation mot de passe
    if (!confirmerMotDePasse || typeof confirmerMotDePasse !== 'string') {
        erreurs.push('Confirmation du mot de passe obligatoire');
    } else if (nouveauMotDePasse !== confirmerMotDePasse) {
        erreurs.push('Les mots de passe ne correspondent pas');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (ancienMotDePasse === nouveauMotDePasse) {
        erreurs.push('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    if (erreurs.length > 0) {
        return res.status(400).json({
            succes: false,
            message: 'Données de changement de mot de passe invalides',
            erreurs: erreurs
        });
    }

    next();
};

/**
 * Valide les données de période pour les statistiques
 */
const validerPeriodeStats = (req, res, next) => {
    const erreurs = [];
    const { dateDebut, dateFin } = req.body;

    // Validation date de début
    if (!dateDebut) {
        erreurs.push('Date de début obligatoire');
    } else {
        const debut = new Date(dateDebut);
        if (isNaN(debut.getTime())) {
            erreurs.push('Format de date de début invalide');
        }
    }

    // Validation date de fin
    if (!dateFin) {
        erreurs.push('Date de fin obligatoire');
    } else {
        const fin = new Date(dateFin);
        if (isNaN(fin.getTime())) {
            erreurs.push('Format de date de fin invalide');
        }
    }

    // Validation cohérence des dates
    if (dateDebut && dateFin) {
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        
        if (debut > fin) {
            erreurs.push('La date de début ne peut pas être postérieure à la date de fin');
        }

        // Vérifier que la période n'est pas trop longue (max 2 ans)
        const diffMs = fin.getTime() - debut.getTime();
        const diffJours = diffMs / (1000 * 60 * 60 * 24);
        if (diffJours > 730) { // 2 ans
            erreurs.push('La période ne peut pas dépasser 2 ans');
        }

        // Vérifier que les dates ne sont pas trop dans le futur
        const maintenant = new Date();
        if (debut > maintenant || fin > maintenant) {
            erreurs.push('Les dates ne peuvent pas être dans le futur');
        }
    }

    if (erreurs.length > 0) {
        return res.status(400).json({
            succes: false,
            message: 'Période invalide',
            erreurs: erreurs
        });
    }

    next();
};

/**
 * Valide les paramètres de pagination
 */
const validerPagination = (req, res, next) => {
    const page = parseInt(req.query.page);
    const limite = parseInt(req.query.limite);

    // Validation page
    if (req.query.page && (!page || page < 1)) {
        return res.status(400).json({
            succes: false,
            message: 'Numéro de page invalide (minimum 1)'
        });
    }

    // Validation limite
    if (req.query.limite && (!limite || limite < 1 || limite > 100)) {
        return res.status(400).json({
            succes: false,
            message: 'Limite invalide (entre 1 et 100)'
        });
    }

    next();
};

/**
 * Middleware de sanitisation des données
 * Nettoie les chaînes de caractères
 */
const sanitiserDonnees = (req, res, next) => {
    const sanitiser = (obj) => {
        for (let cle in obj) {
            if (typeof obj[cle] === 'string') {
                // Enlever les espaces en début/fin
                obj[cle] = obj[cle].trim();
                
                // Remplacer les caractères dangereux
                obj[cle] = obj[cle]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
                    .replace(/javascript:/gi, '') // Javascript dans les URLs
                    .replace(/on\w+\s*=/gi, ''); // Événements JavaScript
            } else if (typeof obj[cle] === 'object' && obj[cle] !== null) {
                sanitiser(obj[cle]);
            }
        }
    };

    if (req.body) {
        sanitiser(req.body);
    }
    if (req.query) {
        sanitiser(req.query);
    }

    next();
};

module.exports = {
    validerDonneesEnquete,
    validerConnexion,
    validerCreationUtilisateur,
    validerChangementMotDePasse,
    validerPeriodeStats,
    validerPagination,
    sanitiserDonnees
};