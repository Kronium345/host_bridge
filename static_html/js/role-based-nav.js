/**
 * Role-Based Navigation
 * Dynamically shows/hides "How It Works" dropdown items based on user role
 */

; (function () {
    const ensureReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    ensureReady(async () => {
        const baseURL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000'
            : 'https://host-bridge.onrender.com';

        // Helper: show/hide items by role without relying on the dropdown label text
        const applyVisibility = (role, authenticated) => {
            const landlordAnchors = document.querySelectorAll('a[href="./how_landlords.html"]');
            const operatorAnchors = document.querySelectorAll('a[href="./how_operators.html"]');

            const setDisplay = (anchor, visible) => {
                if (!anchor) return;
                const li = anchor.closest('li') || anchor;
                li.style.display = visible ? 'block' : 'none';
            };

            if (!authenticated) {
                landlordAnchors.forEach(a => setDisplay(a, false));
                operatorAnchors.forEach(a => setDisplay(a, false));
                return;
            }

            if (role === 'landlord') {
                landlordAnchors.forEach(a => setDisplay(a, true));
                operatorAnchors.forEach(a => setDisplay(a, false));
            } else if (role === 'operator') {
                landlordAnchors.forEach(a => setDisplay(a, false));
                operatorAnchors.forEach(a => setDisplay(a, true));
            } else if (role === 'admin') {
                landlordAnchors.forEach(a => setDisplay(a, true));
                operatorAnchors.forEach(a => setDisplay(a, true));
            } else {
                landlordAnchors.forEach(a => setDisplay(a, false));
                operatorAnchors.forEach(a => setDisplay(a, false));
            }
        };

        // Retry fetching status a few times to avoid races with session set
        const fetchStatusWithRetry = async (attempts = 3) => {
            for (let i = 0; i < attempts; i++) {
                try {
                    const res = await fetch(`${baseURL}/api/user/status`, { credentials: 'include' });
                    if (!res.ok) throw new Error('status not ok');
                    const data = await res.json();
                    return data;
                } catch (e) {
                    await new Promise(r => setTimeout(r, 300));
                }
            }
            return { authenticated: false };
        };

        try {
            const data = await fetchStatusWithRetry(4);
            const role = data?.user?.role || null;
            applyVisibility(role, !!data.authenticated);
        } catch (err) {
            console.error('Error loading role-based navigation:', err);
            applyVisibility(null, false);
        }
    });
})();

