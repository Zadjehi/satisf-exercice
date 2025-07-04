// backend/config/database.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const configDB = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'enquete_satisfaction',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',

    connectionLimit: 10,
    queueLimit: 0,
    idleTimeout: 60000,
    enableKeepAlive: true,
    ssl: false,
    multipleStatements: false
};

let pool;

/**
 * Initialise le pool de connexions
 */
const initialiserDB = async () => {
    try {
        pool = mysql.createPool(configDB);
        const connexion = await pool.getConnection();
        console.log('✅ Connexion à MySQL réussie !');
        console.log(`📊 Base de données: ${configDB.database}`);
        connexion.release();
        return pool;
    } catch (erreur) {
        console.error('❌ Erreur connexion MySQL:', erreur.message);
        throw erreur;
    }
};

/**
 * Retourne une connexion du pool
 */
const obtenirConnexion = async () => {
    if (!pool) throw new Error('Pool de connexions non initialisé');
    return await pool.getConnection();
};

/**
 * Exécute une requête SQL avec paramètres
 */
const executerRequete = async (requete, parametres = []) => {
    const connexion = await obtenirConnexion();
    try {
        const placeholders = (requete.match(/\?/g) || []).length;
        if (placeholders !== parametres.length) {
            console.error('❌ Nombre de paramètres incorrect !');
            throw new Error(`Attendu ${placeholders}, reçu ${parametres.length}`);
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Requête:', requete.replace(/\s+/g, ' ').trim());
            if (parametres.length) console.log('📦 Paramètres:', parametres);
        }

        const [resultats] = await connexion.execute(requete, parametres);
        return resultats;
    } catch (erreur) {
        console.error('❌ Erreur requête:', erreur.message);
        throw new Error(`Erreur MySQL (${erreur.code}): ${erreur.message}`);
    } finally {
        connexion.release();
    }
};

/**
 * Exécute une requête paginée
 */
const executerRequetePaginee = async (requete, parametres = [], page = 1, limite = 10) => {
    try {
        const pageNumber = Math.max(1, parseInt(page) || 1);
        const limiteNumber = Math.max(1, Math.min(100, parseInt(limite) || 10));
        const offset = (pageNumber - 1) * limiteNumber;

        if (isNaN(pageNumber) || isNaN(limiteNumber)) {
            throw new Error(`Pagination invalide: page=${page}, limite=${limite}`);
        }

        const requetePaginee = `${requete} LIMIT ${limiteNumber} OFFSET ${offset}`;
        console.log(`📄 Pagination: page=${pageNumber}, limite=${limiteNumber}, offset=${offset}`);
        return await executerRequete(requetePaginee, parametres);
    } catch (erreur) {
        console.error('❌ Erreur pagination:', erreur.message);
        throw erreur;
    }
};

/**
 * Exécute une requête simple (sans paramètres)
 */
const executerRequeteSimple = async (requete) => {
    const connexion = await obtenirConnexion();
    try {
        console.log('🔍 Requête simple:', requete.replace(/\s+/g, ' ').trim());
        const [resultats] = await connexion.query(requete);
        return resultats;
    } catch (erreur) {
        console.error('❌ Erreur requête simple:', erreur.message);
        throw new Error(`Erreur MySQL: ${erreur.message}`);
    } finally {
        connexion.release();
    }
};

/**
 * Exécute une transaction MySQL
 */
const executerTransaction = async (callback) => {
    const connexion = await obtenirConnexion();
    try {
        await connexion.beginTransaction();
        const resultat = await callback(connexion);
        await connexion.commit();
        return resultat;
    } catch (erreur) {
        await connexion.rollback();
        throw erreur;
    } finally {
        connexion.release();
    }
};

/**
 * Ferme le pool de connexions
 */
const fermerDB = async () => {
    if (pool) {
        console.log('🔒 Fermeture du pool...');
        await pool.end();
        console.log('✅ Pool fermé');
    }
};

/**
 * Donne les statistiques du pool
 */
const obtenirStatistiquesPool = () => {
    if (!pool) return { status: 'non_initialise' };
    return {
        status: 'actif',
        connectionsActives: pool._allConnections?.length || 0,
        connectionsLibres: pool._freeConnections?.length || 0,
        connectionsEnAttente: pool._connectionQueue?.length || 0,
        limite: configDB.connectionLimit
    };
};

/**
 * Teste la connexion et les opérations de base
 */
const testerConnexion = async () => {
    try {
        console.log('🧪 Test de connexion MySQL...');
        const connexion = await obtenirConnexion();

        const [test1] = await connexion.execute('SELECT 1 as test');
        const [test2] = await connexion.execute('SELECT ? as valeur', ['test_param']);
        const test3 = await executerRequeteSimple('SELECT "test_pagination" as valeur LIMIT 5 OFFSET 0');

        connexion.release();
        console.log('🎉 Tous les tests réussis !');

        return {
            status: 'success',
            message: 'Connexion opérationnelle',
            database: configDB.database,
            host: configDB.host,
            port: configDB.port
        };
    } catch (erreur) {
        console.error('❌ Erreur test connexion:', erreur.message);
        throw erreur;
    }
};

// Arrêt propre du serveur
process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT reçu. Fermeture...');
    await fermerDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM reçu. Fermeture...');
    await fermerDB();
    process.exit(0);
});

module.exports = {
    initialiserDB,
    obtenirConnexion,
    executerRequete,
    executerRequetePaginee,
    executerRequeteSimple,
    executerTransaction,
    fermerDB,
    obtenirStatistiquesPool,
    testerConnexion,
    configDB,
    pool: () => pool
};
