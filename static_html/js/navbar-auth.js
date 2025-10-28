
(function () {
    'use strict';

    async function updateNavbarWithUserInfo() {
        try {
            const response = await fetch(window.ENV.getURL('/api/user/status'), {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                if (userData.authenticated && userData.user) {
                    const userName = userData.user.firstName || userData.user.first_name || userData.user.email;

                    // Update desktop navbar
                    const navbarRight = document.querySelector('.navbar-right');
                    if (navbarRight && !navbarRight.dataset.updated) {
                        const userSpan = document.createElement('span');
                        userSpan.textContent = userName;
                        userSpan.style.cssText = 'margin-right:10px;color:#004c46;font-weight:600;';
                        const logoutLink = document.createElement('a');
                        logoutLink.href = '#';
                        logoutLink.textContent = 'Logout';
                        logoutLink.className = 'nav-button login-btn';

                        logoutLink.addEventListener('click', async function (e) {
                            e.preventDefault();
                            console.log('Logout clicked, sending request...');
                            try {
                                const response = await fetch(window.ENV.getURL('/api/logout'), {
                                    method: 'POST',
                                    credentials: 'include'
                                });
                                if (response.ok) {
                                    window.location.href = window.ENV.getRelativeURL('index.html');
                                }
                            } catch (err) {
                                console.error('Logout error:', err);
                                window.location.href = window.ENV.getRelativeURL('index.html');
                            }
                        });

                        navbarRight.innerHTML = '';
                        navbarRight.appendChild(userSpan);
                        navbarRight.appendChild(logoutLink);
                        navbarRight.dataset.updated = 'true';
                        console.log('Desktop navbar updated with logout link');
                    }

                    // Update mobile navbar
                    const mobileAuth = document.querySelector('.mobile-auth');
                    if (mobileAuth && !mobileAuth.dataset.updated) {
                        const mobileUserDiv = document.createElement('div');
                        mobileUserDiv.className = 'mobile-auth-email';
                        mobileUserDiv.textContent = userName;
                        mobileUserDiv.style.cssText = 'padding: 10px 0; color: #004c46; font-weight: 600; text-align: center;';

                        const mobileLogoutLink = document.createElement('a');
                        mobileLogoutLink.href = '#';
                        mobileLogoutLink.textContent = 'Logout';
                        mobileLogoutLink.className = 'nav-button register-btn';

                        // Add click event to ensure navigation works
                        mobileLogoutLink.addEventListener('click', async function (e) {
                            e.preventDefault();
                            console.log('Mobile logout clicked, sending request...');
                            try {
                                const response = await fetch(window.ENV.getURL('/api/logout'), {
                                    method: 'POST',
                                    credentials: 'include'
                                });
                                if (response.ok) {
                                    window.location.href = window.ENV.getRelativeURL('index.html');
                                }
                            } catch (err) {
                                console.error('Logout error:', err);
                                window.location.href = window.ENV.getRelativeURL('index.html');
                            }
                        });

                        mobileAuth.innerHTML = '';
                        mobileAuth.appendChild(mobileUserDiv);
                        mobileAuth.appendChild(mobileLogoutLink);
                        mobileAuth.dataset.updated = 'true';
                        console.log('Mobile navbar updated with logout link');
                    }
                }
            }
        } catch (e) {
            console.error('Error updating navbar:', e);
        }
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavbarWithUserInfo);
    } else {
        // DOM already loaded
        updateNavbarWithUserInfo();
    }
})();

