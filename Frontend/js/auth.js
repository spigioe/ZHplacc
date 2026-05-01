/*
================================================================================
ZHub - Autentikáció (Bejelentkezés és Regisztráció)
================================================================================
*/
import { API_BASE_URL } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- BIZTONSÁGI FÉK (REDIRECT LOOP ELLEN) ---
    // Ha a Dashboard dobott ide vissza minket (pl. lejárt JWT miatt), 
    // töröljük a régi tokent, hogy ne kerüljünk végtelen ciklusba!
    if (window.location.search.includes("logout") || window.location.search.includes("expired")) {
        localStorage.removeItem("ZHUB_TOKEN");
        window.history.replaceState({}, document.title, window.location.pathname); // Kitakarítjuk a linket
    }

    // 1. Ha érvényesnek tűnő tokenünk van, megyünk a Dashboardra
    if (localStorage.getItem("ZHUB_TOKEN")) {
        window.location.replace("dashboard.html");
        return;
    }

    // 2. Sötét/Világos mód gomb
    const themeBtn = document.getElementById("login-theme-toggle") || document.getElementById("register-theme-toggle");
    if (themeBtn) {
        const htmlElement = document.documentElement;
        themeBtn.addEventListener("click", () => {
            const newTheme = htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
            htmlElement.setAttribute("data-theme", newTheme);
            themeBtn.innerHTML = newTheme === "light" ? "🌙 Sötét mód" : "☀️ Világos mód";
            localStorage.setItem("zhub-theme", newTheme);
        });
    }

    // 3. Űrlapok (Forms) bekötése
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
});

// --- BEJELENTKEZÉS ---
async function handleLogin(e) {
    e.preventDefault(); // Ez állítja meg az oldal újratöltését!

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorMsg = document.getElementById("login-error-msg");
    const btn = document.getElementById("login-btn");

    btn.classList.add("is-loading");
    errorMsg.classList.add("is-hidden");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: emailInput.value, 
                password: passwordInput.value 
            })
        });

        const data = await res.json();
        btn.classList.remove("is-loading");

        if (res.ok && data.token) {
            localStorage.setItem("ZHUB_TOKEN", data.token);
            window.location.href = "dashboard.html";
        } else {
            errorMsg.textContent = data.message || "Hibás e-mail cím vagy jelszó!";
            errorMsg.classList.remove("is-hidden");
        }
    } catch (err) {
        btn.classList.remove("is-loading");
        errorMsg.textContent = "Hálózati hiba. Nem érhető el a szerver.";
        errorMsg.classList.remove("is-hidden");
    }
}

// --- REGISZTRÁCIÓ ---
async function handleRegister(e) {
    e.preventDefault(); // Ez állítja meg az oldal újratöltését!

    const nameInput = document.getElementById("reg-name");
    const emailInput = document.getElementById("reg-email");
    const pw1 = document.getElementById("reg-password");
    const pw2 = document.getElementById("reg-password-confirm");
    const errorMsg = document.getElementById("reg-error-msg");
    const btn = document.getElementById("register-btn");

    if (pw1.value !== pw2.value) {
        errorMsg.textContent = "A megadott jelszavak nem egyeznek!";
        errorMsg.classList.remove("is-hidden");
        return;
    }

    btn.classList.add("is-loading");
    errorMsg.classList.add("is-hidden");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nameInput.value,
                email: emailInput.value,
                password: pw1.value
            })
        });

        btn.classList.remove("is-loading");

        if (res.ok) {
            window.location.href = "index.html"; // Átirányítás a bejelentkezéshez
        } else {
            const errData = await res.json();
            errorMsg.textContent = errData.message || "Hiba a regisztráció során.";
            errorMsg.classList.remove("is-hidden");
        }
    } catch (err) {
        btn.classList.remove("is-loading");
        errorMsg.textContent = "Hálózati hiba. Nem érhető el a szerver.";
        errorMsg.classList.remove("is-hidden");
    }
}