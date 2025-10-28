/**
 * Auth Context - Manages authentication state across the app
 * Similar to React's useAuth hook but for vanilla JS
 */

(function () {
    'use strict';

    // Auth state
    let authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: true
    };

    const AUTH_STORAGE_KEY = 'hostbridge_auth';
    const listeners = [];

    // Initialize from localStorage
    function initializeAuth() {
        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                authState = {
                    ...authState,
                    ...parsed,
                    loading: false
                };
                console.log('✅ Auth rehydrated from localStorage:', authState.user?.email);
            }
        } catch (e) {
            console.error('Failed to parse stored auth:', e);
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }

    // Save to localStorage
    function persistAuth() {
        try {
            const toStore = {
                isAuthenticated: authState.isAuthenticated,
                user: authState.user,
                token: authState.token
            };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.error('Failed to persist auth:', e);
        }
    }

    // Notify all listeners of state change
    function notifyListeners() {
        listeners.forEach(callback => {
            try {
                callback(authState);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }

    // Check server auth status
    async function checkAuthStatus() {
        try {
            const response = await fetch(window.ENV.getURL('/api/user/status'), {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();

                if (data.authenticated && data.user) {
                    // Update state
                    authState = {
                        isAuthenticated: true,
                        user: data.user,
                        token: data.token || authState.token,
                        loading: false
                    };
                    persistAuth();
                    notifyListeners();
                    console.log('✅ Auth status: logged in as', data.user.email);
                    return true;
                } else {
                    // Not authenticated
                    await logout(false); // Don't call API, just clear local state
                    return false;
                }
            } else {
                await logout(false);
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            authState.loading = false;
            notifyListeners();
            return false;
        }
    }

    // Login - called after successful login/register
    async function login(userData, token) {
        authState = {
            isAuthenticated: true,
            user: userData,
            token: token,
            loading: false
        };
        persistAuth();
        notifyListeners();
        console.log('✅ Logged in:', userData.email);
    }

    // Logout
    async function logout(callApi = true) {
        if (callApi) {
            try {
                await fetch(window.ENV.getURL('/api/logout'), {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) {
                console.error('Logout API error:', e);
            }
        }

        authState = {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false
        };
        localStorage.removeItem(AUTH_STORAGE_KEY);
        notifyListeners();
        console.log('✅ Logged out');
    }

    // Subscribe to auth changes
    function subscribe(callback) {
        listeners.push(callback);
        // Immediately call with current state
        callback(authState);

        // Return unsubscribe function
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    // Get current auth state
    function getAuthState() {
        return { ...authState };
    }

    // Initialize on load
    initializeAuth();

    // Check server status after rehydration
    if (authState.isAuthenticated) {
        // Verify token is still valid
        checkAuthStatus();
    } else {
        authState.loading = false;
    }

    // Export global AuthContext
    window.AuthContext = {
        login,
        logout,
        checkAuthStatus,
        subscribe,
        getAuthState,
        get isAuthenticated() { return authState.isAuthenticated; },
        get user() { return authState.user; },
        get loading() { return authState.loading; }
    };

    console.log('🔐 AuthContext initialized');
})();

