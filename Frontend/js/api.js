// js/api.js
export const API_BASE_URL = "https://backend-sunlit-meadowland-2237.fly.dev/api";

export async function apiFetch(endpoint, options = {}) {
    const AUTH_TOKEN = localStorage.getItem("ZHUB_TOKEN");
    
    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...options.headers
    };
    
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    if (res.status === 401) {
        localStorage.removeItem("ZHUB_TOKEN");
        window.location.replace("index.html");
    }
    
    return res;
}

export function logout() {
    if (confirm("Biztosan ki szeretnél jelentkezni?")) {
        localStorage.removeItem("ZHUB_TOKEN");
        window.location.replace("index.html");
    }
}

export function escapeHTML(str) {
    if (!str) return "";
    return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}