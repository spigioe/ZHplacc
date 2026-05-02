/*
================================================================================
ZHub - Autentikáció (SPA: Login, Regisztráció, Jelszó Visszaállítás)
================================================================================
*/
import { API_BASE_URL } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. BIZTONSÁGI FÉK ÉS TOKEN ELLENŐRZÉS ---
    if (window.location.search.includes("logout") || window.location.search.includes("expired")) {
        localStorage.removeItem("ZHUB_TOKEN");
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (localStorage.getItem("ZHUB_TOKEN")) {
        window.location.replace("dashboard.html");
        return;
    }

    // --- 2. SÖTÉT/VILÁGOS MÓD GOMB ---
    const themeBtn = document.getElementById("login-theme-toggle");
    if (themeBtn) {
        const htmlElement = document.documentElement;
        themeBtn.addEventListener("click", () => {
            const newTheme = htmlElement.getAttribute("data-theme") === "light" ? "dark" : "light";
            htmlElement.setAttribute("data-theme", newTheme);
            themeBtn.innerHTML = newTheme === "light" ? "🌙 Sötét mód" : "☀️ Világos mód";
            localStorage.setItem("zhub-theme", newTheme);
        });
    }

    // --- 3. URL PARAMÉTEREK ELLENŐRZÉSE (JELSZÓ VISSZAÁLLÍTÁS) ---
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken) {
        // Ha van token, egyből a Reset kártyát mutatjuk
        document.getElementById('reset-token').value = resetToken;
        switchCard('card-reset');
    }

    // --- 4. NAVIGÁCIÓ A KÁRTYÁK KÖZÖTT (Linkek bekötése) ---
    document.getElementById('link-to-register')?.addEventListener('click', (e) => {
        e.preventDefault(); switchCard('card-register');
    });
    
    document.getElementById('link-to-login-from-reg')?.addEventListener('click', (e) => {
        e.preventDefault(); switchCard('card-login');
    });

    document.getElementById('link-to-forgot')?.addEventListener('click', (e) => {
        e.preventDefault(); switchCard('card-forgot');
    });

    document.getElementById('link-to-login-from-forgot')?.addEventListener('click', (e) => {
        e.preventDefault(); switchCard('card-login');
    });

    // --- 5. ŰRLAPOK (FORMS) BEKÖTÉSE ---
    document.getElementById("login-form")?.addEventListener("submit", handleLogin);
    document.getElementById("register-form")?.addEventListener("submit", handleRegister);
    document.getElementById("forgot-form")?.addEventListener("submit", handleForgotPassword);
    document.getElementById("reset-form")?.addEventListener("submit", handleResetPassword);
});

// ==========================================
// SEGÉDFÜGGVÉNY: Kártyák váltása
// ==========================================
function switchCard(targetCardId) {
    const cards = document.querySelectorAll('.auth-card');
    cards.forEach(card => card.classList.remove('is-active'));
    document.getElementById(targetCardId).classList.add('is-active');
}

// ==========================================
// 1. BEJELENTKEZÉS
// ==========================================
async function handleLogin(e) {
    e.preventDefault();

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorMsg = document.getElementById("login-error-msg");
    const successMsg = document.getElementById("login-success-msg");
    const btn = document.getElementById("login-btn");

    btn.classList.add("is-loading");
    errorMsg.classList.add("is-hidden");
    successMsg.classList.add("is-hidden");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
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

// ==========================================
// 2. REGISZTRÁCIÓ
// ==========================================
async function handleRegister(e) {
    e.preventDefault();

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
            body: JSON.stringify({ name: nameInput.value, email: emailInput.value, password: pw1.value })
        });

        btn.classList.remove("is-loading");

        if (res.ok) {
            // Siker esetén visszadobjuk a Login kártyára, és kiírjuk hogy sikerült!
            switchCard('card-login');
            document.getElementById("login-email").value = emailInput.value;
            
            const successMsg = document.getElementById("login-success-msg");
            successMsg.textContent = "Sikeres regisztráció! Most már bejelentkezhetsz.";
            successMsg.classList.remove("is-hidden");
            successMsg.classList.add("is-success");
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

// ==========================================
// 3. ELFELEJTETT JELSZÓ (Token kérése)
// ==========================================
async function handleForgotPassword(e) {
    e.preventDefault();

    const emailInput = document.getElementById("forgot-email");
    const msgBox = document.getElementById("forgot-msg");
    const btn = document.getElementById("forgot-btn");

    btn.classList.add("is-loading");
    msgBox.classList.add("is-hidden");
    msgBox.classList.remove("is-danger", "is-success");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput.value })
        });

        const data = await res.json();
        btn.classList.remove("is-loading");

        // Akkor is "sikert" mutatunk, ha nem létezik az email (Biztonsági okokból)
        msgBox.textContent = data.message || "Elküldtük a linket az e-mail címedre!";
        msgBox.classList.add("is-success");
        msgBox.classList.remove("is-hidden");
        emailInput.value = ""; // Kiürítjük a mezőt

    } catch (err) {
        btn.classList.remove("is-loading");
        msgBox.textContent = "Hálózati hiba a kérés során.";
        msgBox.classList.add("is-danger");
        msgBox.classList.remove("is-hidden");
    }
}

// ==========================================
// 4. ÚJ JELSZÓ BEÁLLÍTÁSA (Token ellenőrzése)
// ==========================================
async function handleResetPassword(e) {
    e.preventDefault();

    const tokenInput = document.getElementById("reset-token");
    const pw1 = document.getElementById("reset-password");
    const pw2 = document.getElementById("reset-password-confirm");
    const errorMsg = document.getElementById("reset-error-msg");
    const btn = document.getElementById("reset-btn");

    if (pw1.value !== pw2.value) {
        errorMsg.textContent = "A megadott jelszavak nem egyeznek!";
        errorMsg.classList.remove("is-hidden");
        return;
    }

    btn.classList.add("is-loading");
    errorMsg.classList.add("is-hidden");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenInput.value, newPassword: pw1.value })
        });

        const data = await res.json();
        btn.classList.remove("is-loading");

        if (res.ok) {
            // Siker esetén kitakarítjuk az URL-ből a tokent, és átugrunk a Loginra
            window.history.replaceState({}, document.title, window.location.pathname);
            
            switchCard('card-login');
            const successMsg = document.getElementById("login-success-msg");
            successMsg.textContent = "Sikeres jelszóváltoztatás! Kérlek jelentkezz be az új jelszavaddal.";
            successMsg.classList.remove("is-hidden");
            successMsg.classList.add("is-success");
        } else {
            errorMsg.textContent = data.message || "Hiba történt a jelszó frissítésekor. Lehet, hogy lejárt a link.";
            errorMsg.classList.remove("is-hidden");
        }
    } catch (err) {
        btn.classList.remove("is-loading");
        errorMsg.textContent = "Hálózati hiba. Nem érhető el a szerver.";
        errorMsg.classList.remove("is-hidden");
    }
}