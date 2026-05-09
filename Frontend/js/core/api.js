// js/core/api.js

// 1. AUTOMATIKUS KÖRNYEZETFELISMERÉS (Nem kell többet kommentelgetni!)
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API_BASE_URL = "https://backend-sunlit-meadowland-2237.fly.dev/api";

// 2. KÖZPONTI FETCH WRAPPER
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("ZHUB_TOKEN");
    
    // Alapértelmezett headerek beállítása
    const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }), // Csak akkor rakja be, ha van token
        ...options.headers
    };
    
    // Ha van JSON body, de nincs Content-Type, automatikusan hozzáadjuk
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        
        // Ha lejárt vagy hibás a token (401 Unauthorized), azonnal kiléptetjük
        if (res.status === 401) {
            forceLogout();
        }
        
        return res;
    } catch (error) {
        console.error(`Hálózati hiba a(z) ${endpoint} hívásakor:`, error);
        throw error;
    }
}

// 3. AUTH FUNKCIÓK
export async function fetchUserProfile() {
    try {
        const res = await apiFetch("/auth/me");
        return res.ok ? await res.json() : null;
    } catch (e) {
        return null;
    }
}

export function logout() {
    if (confirm("Biztosan ki szeretnél jelentkezni?")) {
        forceLogout();
    }
}

// Belső, kérdés nélküli kijelentkeztetés (401-es hiba vagy megerősített logout esetén)
function forceLogout() {
    localStorage.removeItem("ZHUB_TOKEN");
    window.location.replace("index.html");
}

// 4. BIZTONSÁGI / UTILITY FUNKCIÓK
export function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>'"]/g, tag => 
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}