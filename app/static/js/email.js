// EmailJS logic
const EMAILJS_CONFIG = {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY
};

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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeForm();
});

function initializeForm() {
    formRef = document.querySelector('#newsletter-form') || document.querySelector('form');
    nameInput = document.querySelector('input[name="name"]') || document.querySelector('#name');
    emailInput = document.querySelector('input[name="email"]') || document.querySelector('#email');
    roleSelect = document.querySelector('select[name="role"]') || document.querySelector('#role');
    submitButton = document.querySelector('button[type="submit"]') || document.querySelector('.submit-btn');

    if (!formRef || !nameInput || !emailInput || !roleSelect || !submitButton) {
        console.warn('Some form elements not found. Please check your HTML structure.');
        return;
    }

    formRef.addEventListener('submit', handleSubmit);
    nameInput.addEventListener('input', handleChange);
    emailInput.addEventListener('input', handleChange);
    roleSelect.addEventListener('change', handleChange);

    console.log('EmailJS form initialized successfully');
}

function handleChange(e) {
    const { name, value } = e.target;

    formData = {
        ...formData,
        [name]: value
    };
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

    const templateParams = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        time: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

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
                showAlert('Thank you! You\'ve been added to our early access list.', 'success');
                resetForm();
            },
            (error) => {
                console.error('FAILED...', error);
                setLoading(false);
                showAlert('Something went wrong. Please try again.', 'error');
            }
        );
}

function setLoading(loading) {
    isLoading = loading;

    if (submitButton) {
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Sending...' : 'Register Interest';

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

function showAlert(message, type = 'info') {
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
    showAlert
};
