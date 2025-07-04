const API_CONFIG = {
    baseUrl: 'http://localhost:5000/api',
    timeout: 30000,
    debug: true
};

function getAuthToken() {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    
    if (API_CONFIG.debug && token) {
        console.log('Token trouvé:', token.substring(0, 20) + '...');
    }
    
    return token;
}

function getUserData() {
    const userDataStr = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    
    if (userDataStr) {
        try {
            return JSON.parse(userDataStr);
        } catch (error) {
            console.error('Erreur parsing userData:', error);
            return null;
        }
    }
    
    return null;
}

async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        if (API_CONFIG.debug) {
            console.log('Token ajouté automatiquement aux en-têtes');
        }
    }
    
    const fetchOptions = {
        method: options.method || 'GET',
        headers: headers,
        body: options.body,
        signal: AbortSignal.timeout(API_CONFIG.timeout)
    };

    if (API_CONFIG.debug) {
        console.log('En-têtes envoyés:', headers);
        console.log('Appel API:', url, fetchOptions);
    }

    try {
        const response = await fetch(url, fetchOptions);
        
        if (API_CONFIG.debug) {
            console.log('Réponse API:', response.status, response.statusText);
        }

        if (response.status === 401) {
            console.log('Erreur 401 - Token invalide ou expiré');
            
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            if (window.location.pathname !== '/frontend/pages/connexion-admin/index.html') {
                window.location.href = '/frontend/pages/connexion-admin/index.html';
            }
            
            throw new Error('Accès non autorisé - Authentification requise');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API:', response.status, errorText);
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (API_CONFIG.debug) {
            console.log('Données reçues:', data);
        }
        
        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Timeout API:', url);
            throw new Error('Timeout de la requête');
        }
        
        console.error('Erreur API:', error);
        throw error;
    }
}

async function checkAuthStatus() {
    const token = getAuthToken();
    const userData = getUserData();
    
    if (!token || !userData) {
        console.log('Aucune authentification trouvée');
        return { authenticated: false, user: null };
    }
    
    try {
        const response = await apiCall('/auth/statut');
        
        if (response.succes || response.success) {
            console.log('Authentification valide');
            return { 
                authenticated: true, 
                user: response.data.utilisateur || response.data.user 
            };
        } else {
            console.log('Authentification invalide');
            return { authenticated: false, user: null };
        }
    } catch (error) {
        console.error('Erreur vérification auth:', error);
        return { authenticated: false, user: null };
    }
}

async function logout() {
    try {
        await apiCall('/auth/deconnexion', { method: 'POST' });
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    } finally {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        window.location.href = '/frontend/pages/connexion-admin/index.html';
    }
}

async function obtenirDashboard() {
    try {
        console.log('Récupération des statistiques depuis l\'API...');
        
        const response = await apiCall('/dashboard/stats');
        
        if (response.succes || response.success) {
            console.log('Statistiques récupérées:', response.data);
            return response.data;
        } else {
            throw new Error(response.message || 'Erreur récupération statistiques');
        }
    } catch (error) {
        console.error('Erreur récupération dashboard:', error);
        
        console.log('[WARNING] Utilisation des données de test (API non disponible)');
        return {
            totalEnquetes: 0,
            satisfactionMoyenne: 0,
            insatisfactionMoyenne: 0,
            tendances: {
                enquetes: 0,
                satisfaction: 0,
                insatisfaction: 0
            },
            mensuelles: [],
            categories: []
        };
    }
}

async function obtenirEnquetesRecentes(limite = 10) {
    try {
        const response = await apiCall(`/enquetes/recentes?limite=${limite}`);
        
        if (response.succes || response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Erreur récupération enquêtes');
        }
    } catch (error) {
        console.error('Erreur récupération enquêtes récentes:', error);
        return [];
    }
}

async function obtenirStatistiquesPeriode(dateDebut, dateFin) {
    try {
        const response = await apiCall(`/statistiques/periode?debut=${dateDebut}&fin=${dateFin}`);
        
        if (response.succes || response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Erreur récupération statistiques');
        }
    } catch (error) {
        console.error('Erreur récupération statistiques période:', error);
        return null;
    }
}

async function protegerPage() {
    const authStatus = await checkAuthStatus();
    
    if (!authStatus.authenticated) {
        console.log('Page protégée - Redirection vers connexion');
        window.location.href = '/frontend/pages/connexion-admin/index.html';
        return false;
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    const pagesProtegees = [
        '/frontend/pages/tableau-de-bord/',
        '/frontend/pages/statistiques/',
        '/frontend/pages/export-donnees/',
        '/frontend/pages/consultation-responses/'
    ];
    
    const pageActuelle = window.location.pathname;
    const estPageProtegee = pagesProtegees.some(page => pageActuelle.includes(page));
    
    if (estPageProtegee) {
        console.log('Vérification authentification pour page protégée...');
        await protegerPage();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiCall,
        checkAuthStatus,
        logout,
        obtenirDashboard,
        obtenirEnquetesRecentes,
        obtenirStatistiquesPeriode,
        protegerPage,
        getAuthToken,
        getUserData
    };
}

window.API = {
    apiCall,
    checkAuthStatus,
    logout,
    obtenirDashboard,
    obtenirEnquetesRecentes,
    obtenirStatistiquesPeriode,
    protegerPage,
    getAuthToken,
    getUserData
};

console.log('API JavaScript initialisée avec gestion automatique des tokens');