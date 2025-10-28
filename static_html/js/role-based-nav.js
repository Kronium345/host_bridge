/**
 * Role-Based Navigation
 * Dynamically shows/hides "How It Works" dropdown items based on user role
 */

(async function () {
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://host-bridge.onrender.com';

    try {
        // Fetch user status
        const response = await fetch(`${baseURL}/api/user/status`, {
            credentials: 'include'
        });
        const data = await response.json();

        // Get the dropdown menus (both desktop and mobile)
        const dropdowns = document.querySelectorAll('.dropdown');

        dropdowns.forEach(dropdown => {
            const dropdownLink = dropdown.querySelector('a');
            if (dropdownLink && dropdownLink.textContent.trim() === 'How It Works') {
                const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                if (!dropdownMenu) return;

                const landlordLink = dropdownMenu.querySelector('a[href="./how_landlords.html"]');
                const operatorLink = dropdownMenu.querySelector('a[href="./how_operators.html"]');

                if (!data.authenticated) {
                    // Not logged in - hide both items
                    if (landlordLink) landlordLink.parentElement.style.display = 'none';
                    if (operatorLink) operatorLink.parentElement.style.display = 'none';
                } else {
                    const userRole = data.user.role;

                    if (userRole === 'landlord') {
                        // Landlord - show only landlord page
                        if (landlordLink) landlordLink.parentElement.style.display = 'block';
                        if (operatorLink) operatorLink.parentElement.style.display = 'none';
                    } else if (userRole === 'operator') {
                        // Operator - show only operator page
                        if (landlordLink) landlordLink.parentElement.style.display = 'none';
                        if (operatorLink) operatorLink.parentElement.style.display = 'block';
                    } else if (userRole === 'admin') {
                        // Admin - show both
                        if (landlordLink) landlordLink.parentElement.style.display = 'block';
                        if (operatorLink) operatorLink.parentElement.style.display = 'block';
                    } else {
                        // Regular user - hide both
                        if (landlordLink) landlordLink.parentElement.style.display = 'none';
                        if (operatorLink) operatorLink.parentElement.style.display = 'none';
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading role-based navigation:', error);
        // On error, hide both items for safety
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const dropdownLink = dropdown.querySelector('a');
            if (dropdownLink && dropdownLink.textContent.trim() === 'How It Works') {
                const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    const landlordLink = dropdownMenu.querySelector('a[href="./how_landlords.html"]');
                    const operatorLink = dropdownMenu.querySelector('a[href="./how_operators.html"]');
                    if (landlordLink) landlordLink.parentElement.style.display = 'none';
                    if (operatorLink) operatorLink.parentElement.style.display = 'none';
                }
            }
        });
    }
})();

