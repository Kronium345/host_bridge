const EMAILJS_CONFIG = (function () {
    if (window.EMAILJS_CONFIG && window.EMAILJS_CONFIG.serviceId) {
        return window.EMAILJS_CONFIG;
    }
    const formEl = document.getElementById('newsletter-form');
    if (formEl) {
        return {
            serviceId: formEl.getAttribute('data-emailjs-service') || '',
            templateId: formEl.getAttribute('data-emailjs-template') || '',
            publicKey: formEl.getAttribute('data-emailjs-public') || ''
        };
    }
    return { serviceId: '', templateId: '', publicKey: '' };
})();

// Form state management
let formData = {
    name: '',
    email: '',
    role: 'Property Owner'
};

let isLoading = false;

// DOM elements
let formRef;
let nameInput;
let emailInput;
let roleSelect;
let submitButton;
let otherRoleInput;

document.addEventListener('DOMContentLoaded', function () {
    initializeForm();
    try {
        if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey) {
            emailjs.init(EMAILJS_CONFIG.publicKey);
        }
    } catch (e) {
        console.warn('EmailJS init failed:', e);
    }
});

function initializeForm() {
    formRef = document.querySelector('#newsletter-form') || document.querySelector('form');
    nameInput = document.querySelector('input[name="name"]') || document.querySelector('#name');
    emailInput = document.querySelector('input[name="email"]') || document.querySelector('#email');
    roleSelect = document.querySelector('select[name="role"]') || document.querySelector('#role');
    submitButton = document.querySelector('button[type="submit"]') || document.querySelector('.submit-btn');
    otherRoleInput = document.querySelector('#other_role');

    if (!formRef || !nameInput || !emailInput || !roleSelect || !submitButton) {
        console.warn('Some form elements not found. Please check your HTML structure.');
        return;
    }

    if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
        console.warn('EmailJS config missing. Ensure serviceId, templateId, and publicKey are set.');
    }

    formRef.addEventListener('submit', handleSubmit);
    nameInput.addEventListener('input', handleChange);
    emailInput.addEventListener('input', handleChange);
    roleSelect.addEventListener('change', handleRoleChange);
    if (otherRoleInput) {
        otherRoleInput.addEventListener('input', handleChange);
    }
    handleRoleChange({ target: roleSelect });
    console.log('EmailJS form initialized successfully');
}

function handleChange(e) {
    const { name, value } = e.target;

    formData = {
        ...formData,
        [name]: value
    };
}

function handleRoleChange(e) {
    handleChange(e);
    const otherGroup = document.getElementById('other-role-group');
    if (!otherGroup) return;

    const isOther = e.target.value === 'Other';
    otherGroup.style.display = isOther ? 'block' : 'none';
    if (otherRoleInput) {
        otherRoleInput.required = isOther;
    }
    if (!isOther && otherRoleInput) {
        otherRoleInput.value = '';
        delete formData.other_role;
    }
}

function handleSubmit(e) {
    e.preventDefault();

    if (isLoading) return;

    if (!formData.name.trim() || !formData.email.trim()) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    if (!isValidEmail(formData.email)) {
        showAlert('Please enter a valid email address.', 'error');
        return;
    }

    setLoading(true);

    const selectedRole = formData.role === 'Other' && otherRoleInput && otherRoleInput.value.trim()
        ? `Other: ${otherRoleInput.value.trim()}`
        : formData.role;

    const templateParams = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: selectedRole,
        time: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
        setLoading(false);
        notify('Email service is not configured. Please try again later.', 'error');
        return;
    }

    // Debug logging
    console.log('EmailJS Config:', {
        serviceId: EMAILJS_CONFIG.serviceId,
        templateId: EMAILJS_CONFIG.templateId,
        publicKey: EMAILJS_CONFIG.publicKey ? 'Set' : 'Missing'
    });
    console.log('Template Params:', templateParams);

    emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
    )
        .then(
            (response) => {
                console.log('SUCCESS!', response.status, response.text);
                setLoading(false);
                notify('Thank you! You\'ve been added to our early access list.', 'success');
                resetForm();
            },
            (error) => {
                console.error('FAILED...', error);
                setLoading(false);
                notify('Something went wrong. Please try again.', 'error');
            }
        );
}

function setLoading(loading) {
    isLoading = loading;

    if (submitButton) {
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Sending...' : (submitButton.getAttribute('data-idle-label') || 'Register Interest');

        if (loading) {
            submitButton.style.opacity = '0.7';
            submitButton.style.cursor = 'not-allowed';
        } else {
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }
    }
}

function resetForm() {
    formData = {
        name: '',
        email: '',
        role: 'Property Owner'
    };

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (roleSelect) roleSelect.value = 'Property Owner';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function notify(message, type = 'info') {
    if (window.toast) {
        const variant = type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info');
        try { toast(message, variant); return; } catch (_) { }
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;

    switch (type) {
        case 'success':
            alertDiv.style.backgroundColor = '#2E8B57';
            break;
        case 'error':
            alertDiv.style.backgroundColor = '#dc3545';
            break;
        default:
            alertDiv.style.backgroundColor = '#17a2b8';
    }

    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }
    }, 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

window.HostBridgeEmailJS = {
    initializeForm,
    handleSubmit,
    resetForm,
    notify
};
