// ========================================
// FONCTIONS UTILITAIRES
// Fichier: frontend/scripts/utils.js
// ========================================

function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[${type.toUpperCase()}] ${message}`);

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${getIconForType(type)}"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 500px;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
        background: ${getBackgroundForType(type)};
        color: ${getTextColorForType(type)};
        border-left: 4px solid ${getBorderColorForType(type)};
    `;

    const icon = notification.querySelector('.notification-icon');
    icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
    `;

    const messageEl = notification.querySelector('.notification-message');
    messageEl.style.cssText = `
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

function getIconForType(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getBackgroundForType(type) {
    const backgrounds = {
        'success': '#f0f9ff',
        'error': '#fef2f2',
        'warning': '#fffbeb',
        'info': '#f0f9ff'
    };
    return backgrounds[type] || backgrounds.info;
}

function getTextColorForType(type) {
    const colors = {
        'success': '#065f46',
        'error': '#991b1b',
        'warning': '#92400e',
        'info': '#1e40af'
    };
    return colors[type] || colors.info;
}

function getBorderColorForType(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || colors.info;
}

function showLoadingState(element, message = 'Chargement...') {
    if (!element) return;
    element.dataset.originalText = element.textContent;
    element.dataset.originalDisabled = element.disabled;
    element.disabled = true;
    element.textContent = message;
    element.classList.add('loading');
}

function hideLoadingState(element) {
    if (!element) return;
    element.textContent = element.dataset.originalText || element.textContent;
    element.disabled = element.dataset.originalDisabled === 'true';
    element.classList.remove('loading');
    delete element.dataset.originalText;
    delete element.dataset.originalDisabled;
}

function formaterDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', defaultOptions);
}

function formaterHeure(time) {
    const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;
    return timeObj.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function validerEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function validerTelephone(telephone) {
    const regex = /^(\+225\s?)?[0-9]{8,10}$/;
    return regex.test(telephone.trim());
}

function echapperHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copierPressePapiers(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Texte copié dans le presse-papiers', 'success');
        return true;
    } catch (err) {
        console.error('Erreur de copie:', err);
        showNotification('Impossible de copier le texte', 'error');
        return false;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            ...options
        });
    }
}

window.showNotification = showNotification;
window.showLoadingState = showLoadingState;
window.hideLoadingState = hideLoadingState;
window.formaterDate = formaterDate;
window.formaterHeure = formaterHeure;
window.validerEmail = validerEmail;
window.validerTelephone = validerTelephone;
window.echapperHTML = echapperHTML;
window.copierPressePapiers = copierPressePapiers;
window.debounce = debounce;
window.scrollTo = scrollTo;
