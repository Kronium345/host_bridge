/**
 * Page Protection
 * Redirects users who don't have access to certain role-specific pages
 */

(async function () {
    // Get the current page name
    const currentPage = window.location.pathname.split('/').pop();

    // Define protected pages and their required roles
    const protectedPages = {
        'how_landlords.html': ['landlord', 'admin'],
        'how_operators.html': ['operator', 'admin']
    };

    // Check if current page is protected
    if (!protectedPages[currentPage]) {
        return; // Not a protected page
    }

    const requiredRoles = protectedPages[currentPage];
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://host-bridge.onrender.com';

    try {
        // Check user authentication and role
        const response = await fetch(`${baseURL}/api/user/status`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.authenticated) {
            // Not logged in - redirect to login
            alert('Please login to access this page');
            window.location.href = './login.html';
            return;
        }

        const userRole = data.user.role;

        // Check if user has required role
        if (!requiredRoles.includes(userRole)) {
            // User doesn't have access
            alert(`This page is only available for ${requiredRoles.join(' or ')} users.`);
            window.location.href = './index.html';
            return;
        }

        // User has access, allow page to load
        console.log('✅ Access granted to', currentPage);
    } catch (error) {
        console.error('Error checking page access:', error);
        // On error, redirect to home for safety
        alert('Unable to verify access. Please try again.');
        window.location.href = './index.html';
    }
})();

