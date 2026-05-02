// js/settings.js
import { state } from "../core/state.js";
import { apiFetch, fetchUserProfile } from "../core/api.js";
import { showToast, updateDashboardStats } from "../core/ui.js";

// ============================================================================
// MODÁL ÉS FÜLEK KEZELÉSE
// ============================================================================
export async function openSettingsModal() {
    document.getElementById("settings-modal").classList.add("is-active");
    state.activeModal = "settings";
    
    // Mindig a Rendszer füllel nyisson
    switchTab("settings-tab-system");

    // Lekérjük a profilt a Fiókom fülhöz
    await loadUserProfileData();
}

export function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('is-active');
    state.activeModal = "";
}

// ÚJ: Fülek közötti váltás logikája
export function switchTab(targetId) {
    // 1. Az összes tartalom elrejtése
    document.getElementById("settings-tab-system").classList.add("is-hidden");
    document.getElementById("settings-tab-account").classList.add("is-hidden");
    
    // 2. A kiválasztott tartalom megjelenítése
    document.getElementById(targetId).classList.remove("is-hidden");
    
    // 3. Fülek stílusának frissítése (is-active kapcsolgatása)
    document.querySelectorAll("#settings-tabs li").forEach(li => {
        if (li.dataset.target === targetId) {
            li.classList.add("is-active");
        } else {
            li.classList.remove("is-active");
        }
    });

    // 4. Mentés gomb szövegének és láthatóságának okos állítása
    const saveBtn = document.getElementById("save-settings-btn");
    if (targetId === "settings-tab-system") {
        saveBtn.style.display = "flex"; // Visszarakjuk a gombot
    } else {
        saveBtn.style.display = "none"; // Fiókom fülön elrejtjük, mert ott külön gombok vannak
    }
}

// Beállítjuk a fülek kattintásfigyelőjét (Ezt az app.js-ből is meg lehetne hívni, de itt jobb helyen van)
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#settings-tabs li").forEach(li => {
        li.addEventListener("click", () => switchTab(li.dataset.target));
    });

    // ÚJ: Képfeltöltés (Base64 konverzió) esemény
    const fileInput = document.getElementById("setting-profile-pic-upload");
    if (fileInput) {
        fileInput.addEventListener("change", handleProfilePicUpload);
    }
    
    // ÚJ: Fiók mentés gombok
    document.getElementById("save-profile-btn")?.addEventListener("click", saveUserProfile);
    document.getElementById("save-password-btn")?.addEventListener("click", changePassword);
});


// ============================================================================
// 1. RENDSZER FÜL - Régi logikák (Változatlan formában)
// ============================================================================

export async function fetchSettings() {
    try {
        const res = await apiFetch(`/settings`);
        if (res.ok) {
            const settings = await res.json();
            state.appSettings = {
                semesterLength: settings.semesterLength || 14,
                autoWeek: settings.autoWeek || false,
                icsUrl: settings.icsUrl || "",
                weekOffset: settings.weekOffset || 0,
                isFrylabsUnlocked: settings.isFrylabsUnlocked || false
            };
            refreshSettingsInPage();
            updateDashboardStats();
        }
    } catch (e) { console.error(e); }
}

export function refreshSettingsInPage() {
    const semLength = document.getElementById("setting-semester-length");
    const icsInput = document.getElementById("setting-neptun-ics");
    const offsetInput = document.getElementById("setting-week-offset");
    
    if (semLength) semLength.value = state.appSettings.semesterLength || 14;
    if (icsInput) icsInput.value = state.appSettings.icsUrl || "";
    if (offsetInput) offsetInput.value = state.appSettings.weekOffset || 0;
}

export async function saveSettings() {
    const btn = document.getElementById("save-settings-btn");
    if (btn) btn.classList.add("is-loading");
    try {
        const settingsPayload = {
            semesterLength: parseInt(document.getElementById("setting-semester-length")?.value) || 14,
            icsUrl: document.getElementById("setting-neptun-ics")?.value || "",
            weekOffset: parseInt(document.getElementById("setting-week-offset")?.value) || 0,
            isFrylabsUnlocked: state.appSettings.isFrylabsUnlocked || false
        };
        
        const res = await apiFetch(`/settings`, {
            method: 'POST',
            body: JSON.stringify(settingsPayload)
        });
        
        if (btn) btn.classList.remove("is-loading");
        
        if (res.ok) {
            showToast("Beállítások sikeresen mentve!", "is-success");
            await fetchSettings();
            closeSettingsModal();
            if(window.refreshSPA) window.refreshSPA();
        } else { 
            showToast("Nem sikerült menteni a beállításokat.", "is-danger"); 
        }
    } catch (e) {
        if (btn) btn.classList.remove("is-loading");
        showToast("Hálózati hiba a mentés során.", "is-danger");
    }
}

export async function resetSettings() { /* ... Változatlan ... */ 
    if (!confirm("Biztosan visszaállítod az alapértelmezett értékeket?")) return;
    try {
        const defaultSettings = { semesterLength: 14, icsUrl: "", weekOffset: 0, isFrylabsUnlocked: false };
        const res = await apiFetch(`/settings`, { method: 'POST', body: JSON.stringify(defaultSettings) });
        if (res.ok) {
            showToast("Beállítások alaphelyzetbe állítva!", "is-success");
            await fetchSettings();
            if(window.refreshSPA) window.refreshSPA();
        }
    } catch (e) { showToast("Hálózati hiba a visszaállításkor.", "is-danger"); }
}

export function openClearDbModal() { /* ... Változatlan ... */ 
    document.getElementById("clear-db-modal").classList.add("is-active");
    closeSettingsModal(); 
}
export function closeClearDbModal() { /* ... Változatlan ... */ 
    document.getElementById("clear-db-modal").classList.remove("is-active");
    document.querySelectorAll('#clear-db-modal input[type="checkbox"]').forEach(cb => cb.checked = false);
}
export async function executeClearDb() { /* ... Változatlan, lásd eredeti kód ... */ 
    const clearTimetable = document.getElementById("clear-cb-timetable").checked;
    const clearSubjects = document.getElementById("clear-cb-subjects").checked;
    const clearZhs = document.getElementById("clear-cb-zhs").checked;
    const clearExams = document.getElementById("clear-cb-exams").checked;

    if (!clearTimetable && !clearSubjects && !clearZhs && !clearExams) {
        showToast("Nem jelöltél ki semmit törlésre!", "is-warning"); return;
    }
    if (!confirm("Biztosan véglegesen törlöd a kijelölt adatokat? Ez nem vonható vissza!")) return;

    document.getElementById("clear-db-confirm-btn").classList.add("is-loading");
    try {
        if (clearTimetable) await apiFetch('/orarend/clear', { method: 'DELETE' });
        if (clearSubjects) await apiFetch('/subjects/clear', { method: 'DELETE' });
        if (clearZhs) await apiFetch('/zarthelyik/clear', { method: 'DELETE' });
        if (clearExams) await apiFetch('/exams/clear', { method: 'DELETE' });

        showToast("A kijelölt adatok sikeresen törölve!", "is-success");
        closeClearDbModal();
        setTimeout(() => { window.location.reload(); }, 500); 
    } catch (e) {
        showToast("Hiba történt a törlés során.", "is-danger");
    } finally {
        document.getElementById("clear-db-confirm-btn").classList.remove("is-loading");
    }
}


// ============================================================================
// 2. FIÓKOM FÜL - Új Logikák (Profilkép, Név, Jelszó)
// ============================================================================

// 1. Adatok betöltése a beviteli mezőkbe
async function loadUserProfileData() {
    const profile = await fetchUserProfile();
    if (!profile) return;

    document.getElementById("setting-account-name").value = profile.fullName || "";
    document.getElementById("setting-account-email").value = profile.email || "";
    
    // Ha van kép, megjelenítjük, ha nincs, a placeholder marad
    if (profile.profilePictureUrl && profile.profilePictureUrl.length > 50) {
        document.getElementById("setting-profile-pic-preview").src = profile.profilePictureUrl;
        document.getElementById("setting-profile-pic-preview").style.display = "block";
        document.getElementById("setting-profile-pic-placeholder").style.display = "none";
        document.getElementById("setting-profile-pic-base64").value = profile.profilePictureUrl;
    } else {
        document.getElementById("setting-profile-pic-preview").style.display = "none";
        document.getElementById("setting-profile-pic-placeholder").style.display = "flex";
        
        // Csinálunk egy placeholdert a modálba is
        const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ZH';
        document.getElementById("setting-profile-pic-placeholder").textContent = initials;
    }
}

// 2. Képfeltöltés és Base64 Konverzió
function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Ellenőrizzük a méretet (Pl. max 2 MB = 2 * 1024 * 1024 byte)
    if (file.size > 2097152) {
        showToast("A kép túl nagy! Maximum 2 MB lehet.", "is-warning");
        event.target.value = ""; // Töröljük a rossz fájlt
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64String = e.target.result;
        
        // Megjelenítjük a képet az előnézetben
        document.getElementById("setting-profile-pic-preview").src = base64String;
        document.getElementById("setting-profile-pic-preview").style.display = "block";
        document.getElementById("setting-profile-pic-placeholder").style.display = "none";
        
        // Eltesszük a Base64 kódot egy rejtett mezőbe a mentéshez
        document.getElementById("setting-profile-pic-base64").value = base64String;
    };
    reader.readAsDataURL(file);
}

// 3. Név / Email / Kép mentése
async function saveUserProfile() {
    const btn = document.getElementById("save-profile-btn");
    const newName = document.getElementById("setting-account-name").value;
    const newEmail = document.getElementById("setting-account-email").value;
    const newPicBase64 = document.getElementById("setting-profile-pic-base64").value;

    if (!newName || !newEmail) {
        showToast("A név és email megadása kötelező!", "is-warning");
        return;
    }

    btn.classList.add("is-loading");
    try {
        const res = await apiFetch("/auth/profile", {
            method: "PUT",
            body: JSON.stringify({
                name: newName,
                email: newEmail,
                profilePictureUrl: newPicBase64
            })
        });

        if (res.ok) {
            showToast("Személyes adatok sikeresen frissítve!", "is-success");
            // Teljes oldalfrissítés, hogy a bal oldali sáv is újraolvassa az adatokat
            setTimeout(() => window.location.reload(), 800);
        } else {
            const error = await res.text();
            showToast(error || "Hiba az adatok frissítésekor.", "is-danger");
        }
    } catch (e) {
        showToast("Hálózati hiba a profil mentésekor.", "is-danger");
    } finally {
        btn.classList.remove("is-loading");
    }
}

// 4. Jelszó módosítása
async function changePassword() {
    const btn = document.getElementById("save-password-btn");
    const oldPw = document.getElementById("setting-old-password").value;
    const newPw = document.getElementById("setting-new-password").value;
    const newPwConfirm = document.getElementById("setting-new-password-confirm").value;

    if (!oldPw || !newPw || !newPwConfirm) {
        showToast("Minden jelszó mező kitöltése kötelező!", "is-warning");
        return;
    }

    if (newPw !== newPwConfirm) {
        showToast("Az új jelszavak nem egyeznek!", "is-warning");
        return;
    }

    if (newPw.length < 6) {
        showToast("Az új jelszónak legalább 6 karakternek kell lennie!", "is-warning");
        return;
    }

    btn.classList.add("is-loading");
    try {
        const res = await apiFetch("/auth/change-password", {
            method: "PUT",
            body: JSON.stringify({
                oldPassword: oldPw,
                newPassword: newPw
            })
        });

        if (res.ok) {
            showToast("A jelszavad sikeresen megváltozott!", "is-success");
            document.getElementById("setting-old-password").value = "";
            document.getElementById("setting-new-password").value = "";
            document.getElementById("setting-new-password-confirm").value = "";
        } else {
            const errorText = await res.text();
            showToast(errorText || "Hibás régi jelszó!", "is-danger");
        }
    } catch (e) {
        showToast("Hálózati hiba a jelszó módosításakor.", "is-danger");
    } finally {
        btn.classList.remove("is-loading");
    }
}