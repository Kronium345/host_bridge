
(function () {
    'use strict';

    // Detect environment (support localhost, 127.0.0.1, ::1)
    const hostname = window.location.hostname;
    const isLocal = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';

    // Set base URL based on environment
    // In dev we hit the same origin (Node serves API + static). In prod, API is on Render.
    const BASE_URL = isLocal ? window.location.origin : 'https://host-bridge.onrender.com';
    const FRONTEND_URL = isLocal ? window.location.origin : 'https://host-bridge.com';

    // Export to window for global access
    window.ENV = {
        isLocal: isLocal,
        baseURL: BASE_URL,
        frontendURL: FRONTEND_URL,

        // Helper function to get correct URL
        getURL: function (path) {
            // If path starts with /, it's an API route - use BASE_URL
            if (path.startsWith('/')) {
                return BASE_URL + path;
            }
            // Otherwise it's a frontend page - use FRONTEND_URL
            return FRONTEND_URL + '/' + path;
        },

        // Helper to get relative URL (for same domain)
        getRelativeURL: function (path) {
            if (isLocal) {
                return './' + path;
            }
            return 'https://host-bridge.com/' + path;
        }
    };

    console.log('Environment:', isLocal ? 'LOCAL' : 'PRODUCTION');
    console.log('Base URL:', BASE_URL);
    console.log('Frontend URL:', FRONTEND_URL);
})();

