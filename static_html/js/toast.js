// Toast notification system
const Toast = {
    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    },

    show(message, type = 'info') {
        this.init();
        const container = document.querySelector('.toast-container');

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 5px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.16);
            transform: translateY(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: all;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 200px;
            text-align: center;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                toast.style.background = '#28a745';
                break;
            case 'error':
                toast.style.background = '#dc3545';
                break;
            case 'warning':
                toast.style.background = '#ffc107';
                toast.style.color = '#333';
                break;
            default:
                toast.style.background = '#17a2b8';
        }

        // Add message
        toast.textContent = message;

        // Add to container
        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateY(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateY(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        });
    }
};