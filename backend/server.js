// Serveur Principal
require('dotenv').config();
const app = require('./app');
const { initialiserDB } = require('./config/database');
const Utilisateur = require('./modeles/Utilisateur');

// Configuration du serveur
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Fonction d'initialisation du serveur
 */
async function initialiserServeur() {
    try {
        console.log('Démarrage du serveur Enquête de Satisfaction...');
        console.log(`Environnement: ${NODE_ENV}`);
        console.log(`Host: ${HOST}`);
        console.log(`Port: ${PORT}`);
        
        // Étape 1: Initialiser la base de données
        console.log('\nInitialisation de la base de données...');
        await initialiserDB();
        console.log('Base de données initialisée avec succès');

        // Étape 2: Nettoyer les sessions expirées au démarrage
        console.log('\nNettoyage des sessions expirées...');
        try {
            const sessionsNettoyees = await Utilisateur.nettoyerSessionsExpirees();
            console.log(`${sessionsNettoyees} sessions expirées supprimées`);
        } catch (erreurNettoyage) {
            console.warn('Impossible de nettoyer les sessions:', erreurNettoyage.message);
        }

        // Étape 3: Démarrer le serveur HTTP
        console.log('\nDémarrage du serveur HTTP...');
        const serveur = app.listen(PORT, HOST, () => {
            console.log(`\nServeur démarré avec succès !`);
            console.log(`URL: http://${HOST}:${PORT}`);
            console.log(`API: http://${HOST}:${PORT}/api`);
            console.log(`Interface: http://${HOST}:${PORT}`);
            console.log(`Santé: http://${HOST}:${PORT}/api/health`);
            
            if (NODE_ENV === 'development') {
                console.log('\nComptes par défaut:');
                console.log('Admin: zadjehi / Gbodolou28@');
            }
            
            console.log('\nLogs de démarrage terminés\n');
        });

        // Étape 4: Configuration des timeouts
        serveur.timeout = 30000; // 30 secondes
        serveur.keepAliveTimeout = 65000; // 65 secondes
        serveur.headersTimeout = 66000; // 66 secondes

        // Étape 5: Gestion propre de l'arrêt
        const arreterServeur = (signal) => {
            console.log(`\nSignal ${signal} reçu, arrêt du serveur...`);
            
            serveur.close(async (err) => {
                if (err) {
                    console.error('Erreur lors de l\'arrêt du serveur:', err);
                    process.exit(1);
                }
                
                try {
                    // Fermer les connexions de base de données
                    const { fermerDB } = require('./config/database');
                    await fermerDB();
                    console.log('Connexions base de données fermées');
                } catch (erreurDB) {
                    console.error('Erreur fermeture DB:', erreurDB.message);
                }
                
                console.log('Serveur arrêté proprement');
                process.exit(0);
            });

            // Forcer l'arrêt après 10 secondes
            setTimeout(() => {
                console.error('Arrêt forcé après timeout');
                process.exit(1);
            }, 10000);
        };

        // Gestion des signaux système
        process.on('SIGTERM', () => arreterServeur('SIGTERM'));
        process.on('SIGINT', () => arreterServeur('SIGINT'));

        // Étape 6: Programmer le nettoyage automatique des sessions
        if (NODE_ENV === 'production') {
            console.log('Programmation du nettoyage automatique des sessions...');
            setInterval(async () => {
                try {
                    const sessionsNettoyees = await Utilisateur.nettoyerSessionsExpirees();
                    if (sessionsNettoyees > 0) {
                        console.log(`Nettoyage automatique: ${sessionsNettoyees} sessions supprimées`);
                    }
                } catch (erreur) {
                    console.error('Erreur nettoyage automatique:', erreur.message);
                }
            }, 60 * 60 * 1000); // Toutes les heures
        }

        return serveur;

    } catch (erreur) {
        console.error('Erreur lors de l\'initialisation du serveur:', erreur);
        console.error('Détails:', erreur.stack);
        process.exit(1);
    }
}

// Gestion des erreurs globales

// Erreurs non capturées
process.on('uncaughtException', (erreur) => {
    console.error('Erreur non capturée:', erreur);
    console.error('Stack:', erreur.stack);
    console.error('Arrêt du processus...');
    process.exit(1);
});

// Promesses rejetées non gérées
process.on('unhandledRejection', (raison, promesse) => {
    console.error('Promesse rejetée non gérée:', raison);
    console.error('Promesse:', promesse);
    console.error('Arrêt du processus...');
    process.exit(1);
});

// Gestion mémoire (optionnel, pour monitoring)
if (NODE_ENV === 'development') {
    setInterval(() => {
        const memoire = process.memoryUsage();
        const memFormatee = {
            rss: Math.round(memoire.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoire.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoire.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(memoire.external / 1024 / 1024) + ' MB'
        };
        
        // Afficher seulement si l'utilisation mémoire est élevée
        if (memoire.heapUsed > 100 * 1024 * 1024) { // Plus de 100MB
            console.log('Utilisation mémoire:', memFormatee);
        }
    }, 5 * 60 * 1000); // Toutes les 5 minutes
}

/**
 * Affiche la bannière de démarrage
 */
function afficherBanniere() {
    console.log('\n' + '='.repeat(60));
    console.log('APPLICATION ENQUÊTE DE SATISFACTION');
    console.log('Système de collecte et analyse de satisfaction');
    console.log('Backend Node.js + Express + MySQL');
    console.log('='.repeat(60) + '\n');
}

/**
 * Vérifie que toutes les variables d'environnement requises sont présentes
 */
function verifierEnvironnement() {
    const variablesRequises = [
        'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'
    ];
    
    const variablesManquantes = variablesRequises.filter(
        variable => !process.env[variable]
    );
    
    if (variablesManquantes.length > 0) {
        console.error('Variables d\'environnement manquantes:');
        variablesManquantes.forEach(variable => {
            console.error(`   - ${variable}`);
        });
        console.error('\nVérifiez votre fichier .env');
        process.exit(1);
    }
    
    console.log('Variables d\'environnement vérifiées');
}

/**
 * Point d'entrée principal
 */
async function main() {
    afficherBanniere();
    verifierEnvironnement();
    await initialiserServeur();
}

// Démarrer l'application si ce fichier est exécuté directement
if (require.main === module) {
    main().catch((erreur) => {
        console.error('Erreur fatale au démarrage:', erreur);
        process.exit(1);
    });
}

// Export pour les tests
module.exports = { initialiserServeur, main };