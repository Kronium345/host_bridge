/**
 * Navbar Authentication UI Handler
 * Subscribes to AuthContext and updates navbar based on auth state
 */

(function () {
    'use strict';

    function updateNavbarUI(authState) {
        if (!authState.isAuthenticated || !authState.user) {
            // Show login/register buttons
            showUnauthenticatedNav();
            return;
        }

        const userName = authState.user.firstName || authState.user.first_name || authState.user.email?.split('@')[0] || 'User';

        // Update desktop navbar
        updateDesktopNav(userName);

        // Update mobile navbar
        updateMobileNav(userName);
    }

    function showUnauthenticatedNav() {
        const navbarRight = document.querySelector('.navbar-right');
        const mobileAuth = document.querySelector('.mobile-auth');

        if (navbarRight && navbarRight.dataset.updated) {
            navbarRight.innerHTML = `
                <a href="./login.html" class="nav-button login-btn">Login</a>
                <a href="./register.html" class="nav-button register-btn">Register</a>
            `;
            delete navbarRight.dataset.updated;
        }

        if (mobileAuth && mobileAuth.dataset.updated) {
            mobileAuth.innerHTML = `
                <a href="./login.html" class="nav-button login-btn">Login</a>
                <a href="./register.html" class="nav-button register-btn">Register</a>
            `;
            delete mobileAuth.dataset.updated;
        }
    }

    function updateDesktopNav(userName) {
        const navbarRight = document.querySelector('.navbar-right');
        if (!navbarRight || navbarRight.dataset.updated) return;

        const userSpan = document.createElement('span');
        userSpan.textContent = userName;
        userSpan.style.cssText = 'margin-right:10px;color:#004c46;font-weight:600;';

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.className = 'nav-button login-btn';

        logoutLink.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log('Logout clicked');
            await window.AuthContext.logout(true);
            window.location.href = window.ENV.getRelativeURL('index.html');
        });

        navbarRight.innerHTML = '';
        navbarRight.appendChild(userSpan);
        navbarRight.appendChild(logoutLink);
        navbarRight.dataset.updated = 'true';
        console.log('✅ Desktop navbar updated:', userName);
    }

    function updateMobileNav(userName) {
        const mobileAuth = document.querySelector('.mobile-auth');
        if (!mobileAuth || mobileAuth.dataset.updated) return;

        const mobileUserDiv = document.createElement('div');
        mobileUserDiv.className = 'mobile-auth-email';
        mobileUserDiv.textContent = userName;
        mobileUserDiv.style.cssText = 'padding: 10px 0; color: #004c46; font-weight: 600; text-align: center;';

        const mobileLogoutLink = document.createElement('a');
        mobileLogoutLink.href = '#';
        mobileLogoutLink.textContent = 'Logout';
        mobileLogoutLink.className = 'nav-button register-btn';

        mobileLogoutLink.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log('Mobile logout clicked');
            await window.AuthContext.logout(true);
            window.location.href = window.ENV.getRelativeURL('index.html');
        });

        mobileAuth.innerHTML = '';
        mobileAuth.appendChild(mobileUserDiv);
        mobileAuth.appendChild(mobileLogoutLink);
        mobileAuth.dataset.updated = 'true';
        console.log('✅ Mobile navbar updated:', userName);
    }

    // Subscribe to auth changes
    function initialize() {
        if (!window.AuthContext) {
            console.error('❌ AuthContext not loaded! Make sure auth-context.js is included first.');
            return;
        }

        // Subscribe to auth state changes
        window.AuthContext.subscribe((authState) => {
            if (!authState.loading) {
                updateNavbarUI(authState);
            }
        });

        console.log('✅ Navbar auth listener initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
