// js/settings.js
import { state } from "./state.js";
import { apiFetch } from "./api.js";
import { showToast, addFrylabsToggle, updateDashboardStats } from "./ui.js";

export function openSettingsModal() {
    document.getElementById("settings-modal").classList.add("is-active");
    state.activeModal = "settings";
}
export function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('is-active');
    state.activeModal = "";
}

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
    if (state.appSettings.isFrylabsUnlocked) addFrylabsToggle();
}

export async function saveSettings() {
    const btn = document.getElementById("save-settings-btn");
    if (btn) btn.classList.add("is-loading");
    try {
        // A '?' megvédi a kódot attól, hogy kifagyjon, ha a HTML elem hiányzik!
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
            const secretInput = document.getElementById('setting-secret-code');
            if (secretInput) secretInput.value = ""; // Védett ürítés
            
            showToast("Beállítások sikeresen mentve!", "is-success");
            await fetchSettings();
            closeSettingsModal();
            // Oldal újrarajzolása
            if(window.refreshSPA) window.refreshSPA();
        } else { 
            showToast("Nem sikerült menteni a beállításokat.", "is-danger"); 
        }
    } catch (e) {
        if (btn) btn.classList.remove("is-loading");
        showToast("Hálózati hiba a mentés során.", "is-danger");
    }
}

export async function resetSettings() {
    if (!confirm("Biztosan visszaállítod az alapértelmezett értékeket?")) return;
    try {
        // Létrehozunk egy alapértelmezett "tiszta" beállítás objektumot
        const defaultSettings = {
            semesterLength: 14,
            icsUrl: "",
            weekOffset: 0,
            isFrylabsUnlocked: false
        };
        
        // Elküldjük a normál POST végpontra (mintha te mentetted volna el kézzel)
        const res = await apiFetch(`/settings`, { 
            method: 'POST', 
            body: JSON.stringify(defaultSettings) 
        });
        
        if (res.ok) {
            showToast("Beállítások alaphelyzetbe állítva!", "is-success");
            await fetchSettings();
            if(window.refreshSPA) window.refreshSPA(); // Frissíti a kijelzőket
        }
    } catch (e) { 
        showToast("Hálózati hiba a visszaállításkor.", "is-danger"); 
    }
}

export function openClearDbModal() {
    document.getElementById("clear-db-modal").classList.add("is-active");
    closeSettingsModal(); // Bezárjuk mögötte a fő beállítások ablakot
}

export function closeClearDbModal() {
    document.getElementById("clear-db-modal").classList.remove("is-active");
    // Alaphelyzetbe állítjuk a pipákat
    document.querySelectorAll('#clear-db-modal input[type="checkbox"]').forEach(cb => cb.checked = false);
}

export async function executeClearDb() {
    const clearTimetable = document.getElementById("clear-cb-timetable").checked;
    const clearSubjects = document.getElementById("clear-cb-subjects").checked;
    const clearZhs = document.getElementById("clear-cb-zhs").checked;
    const clearExams = document.getElementById("clear-cb-exams").checked;

    if (!clearTimetable && !clearSubjects && !clearZhs && !clearExams) {
        showToast("Nem jelöltél ki semmit törlésre!", "is-warning");
        return;
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
        
        // JAVÍTÁS: Kőkemény teljes oldalfrissítés, hogy a memória (state.js) is kiürüljön!
        setTimeout(() => {
            window.location.reload();
        }, 500); 

    } catch (e) {
        showToast("Hiba történt a törlés során.", "is-danger");
        console.error(e);
    } finally {
        document.getElementById("clear-db-confirm-btn").classList.remove("is-loading");
    }
}