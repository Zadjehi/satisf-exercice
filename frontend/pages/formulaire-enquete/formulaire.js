// ========================================
// SCRIPT FORMULAIRE D'ENQUÊTE - VERSION CSP COMPATIBLE
// Fichier: frontend/pages/formulaire-enquete/formulaire.js
// ========================================
class FormulaireEnquete {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.isSubmitting = false;
        this.isSubmitted = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadServices();
        this.setupValidation();
        this.updateProgress();
        this.setDefaultDate();
    }

    setupEventListeners() {
        const form = document.getElementById('enqueteForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        document.querySelectorAll('button[data-action]').forEach(button => {
            const action = button.getAttribute('data-action');
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                switch (action) {
                    case 'next':
                        this.nextStep();
                        break;
                    case 'prev':
                        this.prevStep();
                        break;
                    case 'reset':
                        this.resetForm();
                        break;
                    default:
                        console.warn('Action non reconnue:', action);
                }
            });
        });

        document.querySelectorAll('a[href]').forEach(link => {
            link.addEventListener('click', (e) => {
                console.log('Navigation vers:', link.href);
            });
        });

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });

        this.setupCharacterCounters();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.target.matches('textarea')) {
                e.preventDefault();
                if (this.currentStep < this.totalSteps) {
                    this.nextStep();
                }
            }
        });
    }

    setupCharacterCounters() {
        const commentaires = document.getElementById('commentaires');
        const recommandations = document.getElementById('recommandations');
        
        if (commentaires) {
            commentaires.addEventListener('input', () => {
                this.updateCharCounter('commentaires', commentaires.value.length, 1000);
            });
        }
        
        if (recommandations) {
            recommandations.addEventListener('input', () => {
                this.updateCharCounter('recommandations', recommandations.value.length, 1000);
            });
        }
    }

    updateCharCounter(fieldName, current, max) {
        const counter = document.getElementById(`${fieldName}-count`);
        if (counter) {
            counter.textContent = current;
            counter.style.color = current > max * 0.9 ? 'var(--warning-color)' : 'var(--gray-500)';
        }
    }

    setDefaultDate() {
        const dateInput = document.getElementById('dateVisite');
        const heureInput = document.getElementById('heureVisite');
        
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            dateInput.max = today;
        }
        
        if (heureInput) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            heureInput.value = `${hours}:${minutes}`;
        }
    }

    async loadServices() {
        const serviceSelect = document.getElementById('serviceConcerne');
        
        if (!serviceSelect) {
            console.error('Element serviceConcerne non trouvé !');
            return;
        }
        
        try {
            serviceSelect.innerHTML = '<option value="">Chargement des services...</option>';
            serviceSelect.classList.add('loading');
            
            let services;
            if (typeof apiCall === 'function') {
                services = await apiCall('/services');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                services = [
                    { nom: 'Accueil' },
                    { nom: 'Laboratoire' },
                    { nom: 'Radiologie' },
                    { nom: 'Consultation' },
                    { nom: 'Urgences' }
                ];
            }
            
            const servicesData = services && services.succes ? services.data : services;
            
            if (!Array.isArray(servicesData)) {
                throw new Error('Les données des services ne sont pas un tableau: ' + typeof servicesData);
            }
            
            serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';
            serviceSelect.classList.remove('loading');
            
            servicesData.forEach((service, index) => {
                if (!service || !service.nom) {
                    console.warn(`Service ${index} n'a pas de propriété 'nom':`, service);
                    return;
                }
                
                const option = document.createElement('option');
                option.value = service.nom;
                option.textContent = service.nom;
                serviceSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erreur lors du chargement des services:', error);
            
            serviceSelect.innerHTML = '<option value="">Erreur de chargement</option>';
            serviceSelect.classList.remove('loading');
            
            if (typeof showNotification === 'function') {
                showNotification('Erreur lors du chargement des services', 'error');
            } else {
                console.warn('Erreur lors du chargement des services');
            }
        }
    }

    setupValidation() {
        this.validationRules = {
            dateVisite: {
                required: true,
                custom: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate > today) {
                        return 'La date ne peut pas être dans le futur';
                    }
                    
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    
                    if (selectedDate < oneYearAgo) {
                        return 'La date ne peut pas être antérieure à un an';
                    }
                    
                    return null;
                }
            },
            heureVisite: {
                required: true
            },
            raisonPresence: {
                required: true
            },
            serviceConcerne: {
                required: true
            },
            nom: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
                patternMessage: 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes'
            },
            prenom: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
                patternMessage: 'Le prénom ne doit contenir que des lettres, espaces, tirets et apostrophes'
            },
            telephone: {
                required: true,
                pattern: /^(\+225\s?)?[0-9]{8,10}$/,
                patternMessage: 'Format de téléphone invalide (ex: +225 01234567 ou 01234567)'
            },
            email: {
                required: true,
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                patternMessage: 'Format d\'email invalide (ex: nom@domaine.com)'
            },
            satisfaction: {
                required: true
            },
            commentaires: {
                required: true,
                minLength: 10,
                maxLength: 1000
            },
            recommandations: {
                required: true,
                minLength: 10,
                maxLength: 1000
            }
        };
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.type === 'radio' ? 
            document.querySelector(`input[name="${fieldName}"]:checked`)?.value || '' : 
            field.value.trim();
        
        const rules = this.validationRules[fieldName];
        if (!rules) return true;

        this.clearError(field);

        if (rules.required && !value) {
            this.showError(field, 'Ce champ est obligatoire');
            return false;
        }

        if (!value && !rules.required) {
            return true;
        }

        if (rules.minLength && value.length < rules.minLength) {
            this.showError(field, `Minimum ${rules.minLength} caractères requis`);
            return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            this.showError(field, `Maximum ${rules.maxLength} caractères autorisés`);
            return false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
            this.showError(field, rules.patternMessage || 'Format invalide');
            return false;
        }

        if (rules.custom) {
            const customError = rules.custom(value);
            if (customError) {
                this.showError(field, customError);
                return false;
            }
        }

        return true;
    }

    showError(field, message) {
        const fieldName = field.name || field.getAttribute('name');
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        
        if (field.type === 'radio') {
            const radioContainer = field.closest('.satisfaction-options');
            if (radioContainer) {
                radioContainer.classList.add('error');
            }
        } else {
            field.classList.add('error');
        }
    }

    clearError(field) {
        const fieldName = field.name || field.getAttribute('name');
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        if (field.type === 'radio') {
            const radioContainer = field.closest('.satisfaction-options');
            if (radioContainer) {
                radioContainer.classList.remove('error');
            }
        } else {
            field.classList.remove('error');
        }
    }

    validateStep(stepNumber) {
        const step = document.querySelector(`[data-step="${stepNumber}"]`);
        if (!step) return false;
        
        const fields = step.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        const radioGroups = step.querySelectorAll('input[type="radio"][required]');
        const radioGroupNames = [...new Set(Array.from(radioGroups).map(r => r.name))];
        
        radioGroupNames.forEach(groupName => {
            const checkedRadio = step.querySelector(`input[name="${groupName}"]:checked`);
            if (!checkedRadio) {
                const firstRadio = step.querySelector(`input[name="${groupName}"]`);
                if (firstRadio) {
                    this.showError(firstRadio, 'Veuillez faire un choix');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            this.scrollToFirstError();
            return;
        }

        this.saveStepData();

        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    showStep(stepNumber) {
        const currentStepElement = document.querySelector('.form-step.active');
        const nextStepElement = document.querySelector(`[data-step="${stepNumber}"]`);

        if (!nextStepElement || !currentStepElement) {
            console.error('Éléments d\'étapes non trouvés');
            return;
        }

        currentStepElement.classList.add(stepNumber > this.currentStep ? 'slide-out-left' : 'slide-out-right');
        
        setTimeout(() => {
            currentStepElement.classList.remove('active', 'slide-out-left', 'slide-out-right');
            nextStepElement.classList.add('active');
            this.currentStep = stepNumber;
            this.updateProgress();
            
            window.scroll({ top: 0, behavior: 'smooth' });
            
            const firstInput = nextStepElement.querySelector('input, select, textarea');
            if (firstInput && !firstInput.disabled) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }, 150);
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const currentStepSpan = document.getElementById('currentStep');
        const totalStepsSpan = document.getElementById('totalSteps');

        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        if (currentStepSpan) {
            currentStepSpan.textContent = this.currentStep;
        }
        
        if (totalStepsSpan) {
            totalStepsSpan.textContent = this.totalSteps;
        }
    }

    saveStepData() {
        const currentStepElement = document.querySelector('.form-step.active');
        if (!currentStepElement) return;
        
        const fields = currentStepElement.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (field.type === 'radio') {
                if (field.checked) {
                    this.formData[field.name] = field.value;
                }
            } else if (field.type === 'checkbox') {
                if (field.checked) {
                    if (!this.formData[field.name]) {
                        this.formData[field.name] = [];
                    }
                    this.formData[field.name].push(field.value);
                }
            } else {
                this.formData[field.name] = field.value;
            }
        });
    }

    scrollToFirstError() {
        const firstError = document.querySelector('.form-step.active .error');
        if (firstError) {
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            if (firstError.tagName === 'INPUT' || firstError.tagName === 'SELECT' || firstError.tagName === 'TEXTAREA') {
                setTimeout(() => firstError.focus(), 500);
            }
        }
    }

    async submitForm() {
        if (this.isSubmitting) return;

        if (!this.validateStep(this.currentStep)) {
            this.scrollToFirstError();
            return;
        }

        this.saveStepData();
        this.isSubmitting = true;
        
        try {
            this.showLoadingOverlay(true);
            
            const submissionData = {
                ...this.formData,
                dateSubmission: new Date().toISOString(),
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            };
            
            const requiredFields = {
                'dateVisite': submissionData.dateVisite,
                'heureVisite': submissionData.heureVisite, 
                'raisonPresence': submissionData.raisonPresence,
                'serviceConcerne': submissionData.serviceConcerne,
                'nom': submissionData.nom,
                'prenom': submissionData.prenom,
                'telephone': submissionData.telephone,
                'email': submissionData.email,
                'satisfaction': submissionData.satisfaction,
                'commentaires': submissionData.commentaires,
                'recommandations': submissionData.recommandations
            };
            
            const missingFields = Object.entries(requiredFields)
                .filter(([field, value]) => !value || value === '')
                .map(([field]) => field);
            
            if (missingFields.length > 0) {
                console.error('Champs manquants:', missingFields);
                throw new Error(`Champs requis manquants: ${missingFields.join(', ')}`);
            }

            let response;
            if (typeof apiCall === 'function') {
                response = await apiCall('/enquetes', {
                    method: 'POST',
                    body: JSON.stringify(submissionData)
                });
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
                response = { success: true, id: Date.now() };
            }

            this.showConfirmation();
            this.trackSubmission('success');
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            
            this.showLoadingOverlay(false);
            
            if (typeof showNotification === 'function') {
                showNotification('Erreur lors de l\'envoi de l\'enquête. Veuillez réessayer.', 'error');
            } else {
                alert('Erreur lors de l\'envoi de l\'enquête. Veuillez réessayer.');
            }
            
            this.trackSubmission('error', error.message);
            
        } finally {
            this.isSubmitting = false;
        }
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    showConfirmation() {
        const form = document.getElementById('enqueteForm');
        const confirmation = document.getElementById('confirmationMessage');
        const formHeader = document.querySelector('.form-header');
        
        if (form && confirmation) {
            this.showLoadingOverlay(false);
            this.isSubmitted = true;
            
            form.style.display = 'none';
            form.classList.add('hidden');
            
            if (formHeader) {
                formHeader.style.display = 'none';
                formHeader.classList.add('hidden');
            }
            
            confirmation.style.display = 'block';
            confirmation.classList.remove('hidden');
            
            window.scroll({ top: 0, behavior: 'smooth' });
        } else {
            console.error('Éléments de confirmation non trouvés');
        }
    }

    resetForm() {
        this.formData = {};
        this.currentStep = 1;
        this.isSubmitting = false;
        this.isSubmitted = false;

        const form = document.getElementById('enqueteForm');
        if (form) {
            form.reset();
        }

        this.setDefaultDate();

        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        document.querySelectorAll('[id$="-count"]').forEach(counter => {
            counter.textContent = '0';
            counter.style.color = 'var(--gray-500)';
        });

        document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
        const firstStep = document.querySelector('[data-step="1"]');
        if (firstStep) {
            firstStep.classList.add('active');
        }

        this.updateProgress();

        const confirmation = document.getElementById('confirmationMessage');
        const formHeader = document.querySelector('.form-header');
        
        if (confirmation) {
            confirmation.style.display = 'none';
            confirmation.classList.add('hidden');
        }
        
        if (form) {
            form.style.display = 'block';
            form.classList.remove('hidden');
        }
        
        if (formHeader) {
            formHeader.style.display = 'block';
            formHeader.classList.remove('hidden');
        }

        window.scroll({ top: 0, behavior: 'smooth' });
    }

    trackSubmission(status, errorMessage = null) {
        const trackingData = {
            event: 'form_submission',
            status: status,
            form_type: 'enquete_satisfaction',
            step_completed: this.currentStep,
            total_steps: this.totalSteps,
            timestamp: new Date().toISOString()
        };

        if (errorMessage) {
            trackingData.error = errorMessage;
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', trackingData.event, trackingData);
        }

        console.log('Form tracking:', trackingData);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.formulaireEnquete = new FormulaireEnquete();
});

window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    
    if (typeof showNotification === 'function') {
        showNotification('Une erreur inattendue s\'est produite', 'error');
    }
});

window.addEventListener('beforeunload', (event) => {
    if (window.formulaireEnquete && 
        window.formulaireEnquete.currentStep > 1 && 
        !window.formulaireEnquete.isSubmitting &&
        !window.formulaireEnquete.isSubmitted) {
        event.preventDefault();
        event.returnValue = 'Êtes-vous sûr de vouloir quitter ? Vos données ne seront pas sauvegardées.';
    }
});