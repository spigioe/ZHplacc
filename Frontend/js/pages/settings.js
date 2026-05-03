// js/pages/settings.js
import { state } from '../core/state.js';
import { apiFetch, fetchUserProfile } from '../core/api.js';
import { showToast } from '../core/ui.js';
import { startNeptunSync } from '../services/syncService.js';
import { openClearDbModal } from '../services/settingService.js';

export async function renderSettings(container) {
    container.innerHTML = `
        <div style="display: block; width: 100%; height: 100%; overflow-y: auto; padding-bottom: 50px;">
            <div style="max-width: 650px; margin: 0 auto; padding: 2rem 1.5rem;">
                
                <!-- FEJLÉC -->
                <div class="has-text-centered mb-6">
                    <span class="icon is-large has-text-link mb-2"><i class="fa-solid fa-gear fa-2x"></i></span>
                    <h1 class="title is-3 mb-2 has-text-weight-bold">Beállítások</h1>
                    <p class="subtitle is-6 has-text-grey">Alkalmazás testreszabása és fiókkezelés.</p>
                </div>

                <!-- FÜLEK (TABS) -->
                <div class="tabs is-toggle is-toggle-rounded is-centered mb-5">
                    <ul id="settings-page-tabs">
                        <li class="is-active" data-target="settings-tab-system">
                            <a>
                                <span class="icon is-small"><i class="fa-solid fa-sliders"></i></span>
                                <span class="has-text-weight-bold">Rendszer</span>
                            </a>
                        </li>
                        <li data-target="settings-tab-account">
                            <a>
                                <span class="icon is-small"><i class="fa-solid fa-user"></i></span>
                                <span class="has-text-weight-bold">Fiókom</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- =============================== -->
                <!-- RENDSZER FÜL TARTALMA -->
                <!-- =============================== -->
                <div id="settings-tab-system" class="settings-tab-content">
                    
                    <!-- Oktatási Időszak -->
                    <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border); box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div class="is-flex is-align-items-center mb-4 pb-2" style="border-bottom: 1px solid var(--bulma-border);">
                            <span class="icon has-text-link mr-2"><i class="fa-solid fa-calendar-days"></i></span>
                            <h3 class="title is-5 m-0 has-text-grey-dark">Oktatási Időszak</h3>
                        </div>
                        
                        <div class="columns is-mobile is-multiline">
                            <div class="column is-12-mobile is-6-tablet">
                                <div class="field">
                                    <label class="label is-small has-text-grey">Hét eltolás</label>
                                    <div class="control">
                                        <input class="input has-text-weight-bold" type="number" id="page-setting-week-offset" value="0">
                                    </div>
                                    <p class="help">Ha a félév nem az 1. héten kezdődik.</p>
                                </div>
                            </div>
                            <div class="column is-12-mobile is-6-tablet">
                                <div class="field">
                                    <label class="label is-small has-text-grey">Félév hossza (Hét)</label>
                                    <div class="control">
                                        <input class="input has-text-weight-bold" type="number" id="page-setting-semester-length" value="14" min="1">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Neptun Szinkronizáció -->
                    <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border); box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div class="is-flex is-align-items-center mb-4 pb-2" style="border-bottom: 1px solid var(--bulma-border);">
                            <span class="icon has-text-info mr-2"><i class="fa-solid fa-cloud-arrow-down"></i></span>
                            <h3 class="title is-5 m-0 has-text-grey-dark">Neptun Szinkronizáció</h3>
                        </div>

                        <div class="field mb-4">
                            <label class="label is-small has-text-grey">Naptár (ICS) Link</label>
                            <div class="control has-icons-left">
                                <input class="input" type="url" id="page-setting-neptun-ics" placeholder="https://neptun.hu/...">
                                <span class="icon is-small is-left"><i class="fa-solid fa-link"></i></span>
                            </div>
                            <p class="help">Ide illeszd be a Neptunból kimásolt órarendi linket.</p>
                        </div>
                        <button class="button is-info is-light is-fullwidth has-text-weight-bold" id="page-sync-now-btn">
                            <i class="fa-solid fa-rotate mr-2"></i> Szinkronizálás most
                        </button>
                    </div>

                    <!-- Rendszer Mentés Gomb -->
                    <button id="page-save-system-btn" class="button is-link is-medium is-fullwidth has-text-weight-bold mb-6" style="border-radius: 8px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
                        <span class="icon mr-2"><i class="fa-solid fa-check"></i></span>
                        <span>Beállítások mentése</span>
                    </button>

                    <!-- Veszélyzóna -->
                    <div class="box p-5 mt-6" style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.4);">
                        <div class="is-flex is-align-items-center mb-4">
                            <span class="icon has-text-danger mr-2"><i class="fa-solid fa-triangle-exclamation"></i></span>
                            <h3 class="title is-5 m-0 has-text-danger-dark">Veszélyzóna</h3>
                        </div>
                        
                        <div class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-wrap mb-4 pb-4" style="border-bottom: 1px solid rgba(239, 68, 68, 0.1); gap: 10px;">
                            <div>
                                <p class="has-text-danger-dark has-text-weight-bold">Alapértelmezett beállítások</p>
                                <p class="is-size-7 has-text-danger-dark">Visszaállítja a félév hosszát és törli a linket.</p>
                            </div>
                            <button class="button is-warning is-light" id="page-reset-settings-btn">Visszaállítás</button>
                        </div>
                        
                        <div class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-wrap" style="gap: 10px;">
                            <div>
                                <p class="has-text-danger-dark has-text-weight-bold">Összes adat törlése</p>
                                <p class="is-size-7 has-text-danger-dark">Véglegesen töröl mindent a helyi adatbázisból.</p>
                            </div>
                            <button class="button is-danger has-text-weight-bold" id="page-clear-all-btn">Adatok törlése</button>
                        </div>
                    </div>
                </div>

                <!-- =============================== -->
                <!-- FIÓKOM FÜL TARTALMA -->
                <!-- =============================== -->
                <div id="settings-tab-account" class="settings-tab-content is-hidden">
                    
                    <!-- Személyes Adatok -->
                    <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border); box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div class="is-flex is-align-items-center mb-4 pb-2" style="border-bottom: 1px solid var(--bulma-border);">
                            <span class="icon has-text-link mr-2"><i class="fa-solid fa-address-card"></i></span>
                            <h3 class="title is-5 m-0 has-text-grey-dark">Személyes Adatok</h3>
                        </div>
                        
                        <article class="media is-align-items-center mb-5 pb-5" style="border-bottom: 1px solid var(--bulma-border);">
                            <figure class="media-left mr-4">
                                <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid var(--bulma-border); background-color: var(--bulma-background-light);">
                                    <img id="page-setting-pic-preview" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                                    <div id="page-setting-pic-placeholder" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: var(--bulma-link); color: white; font-weight: bold; font-size: 2rem;">ZH</div>
                                </div>
                            </figure>
                            <div class="media-content">
                                <div class="file is-info is-light is-small">
                                    <label class="file-label">
                                        <input class="file-input" type="file" id="page-setting-pic-upload" accept="image/png, image/jpeg">
                                        <span class="file-cta">
                                            <span class="file-icon"><i class="fa-solid fa-upload"></i></span>
                                            <span class="file-label has-text-weight-bold">Új kép feltöltése</span>
                                        </span>
                                    </label>
                                </div>
                                <input type="hidden" id="page-setting-pic-base64">
                            </div>
                        </article>

                        <div class="field mb-4">
                            <label class="label is-small has-text-grey">Teljes Név</label>
                            <div class="control has-icons-left">
                                <input class="input has-text-weight-bold" type="text" id="page-setting-account-name" placeholder="Pl.: Kiss Péter">
                                <span class="icon is-small is-left"><i class="fa-solid fa-user"></i></span>
                            </div>
                        </div>
                        <div class="field mb-5">
                            <label class="label is-small has-text-grey">Email cím (Azonosító)</label>
                            <div class="control has-icons-left">
                                <input class="input has-text-grey" type="email" id="page-setting-account-email" disabled>
                                <span class="icon is-small is-left"><i class="fa-solid fa-envelope"></i></span>
                            </div>
                        </div>
                        
                        <button class="button is-link is-light is-fullwidth has-text-weight-bold" id="page-save-profile-btn" style="border-radius: 8px;">
                            Személyes adatok frissítése
                        </button>
                    </div>

                    <!-- Jelszó módosítása -->
                    <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border); box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div class="is-flex is-align-items-center mb-4 pb-2" style="border-bottom: 1px solid var(--bulma-border);">
                            <span class="icon has-text-warning-dark mr-2"><i class="fa-solid fa-lock"></i></span>
                            <h3 class="title is-5 m-0 has-text-grey-dark">Jelszó Módosítása</h3>
                        </div>

                        <div class="field mb-4">
                            <label class="label is-small has-text-grey">Jelenlegi jelszó</label>
                            <div class="control has-icons-left">
                                <input class="input" type="password" id="page-setting-old-password" placeholder="******">
                                <span class="icon is-small is-left"><i class="fa-solid fa-key"></i></span>
                            </div>
                        </div>
                        <div class="field mb-4">
                            <label class="label is-small has-text-grey">Új jelszó</label>
                            <div class="control has-icons-left">
                                <input class="input" type="password" id="page-setting-new-password" placeholder="Legalább 6 karakter">
                                <span class="icon is-small is-left"><i class="fa-solid fa-asterisk"></i></span>
                            </div>
                        </div>
                        
                        <!-- ÚJ MEZŐ: Jelszó megerősítése -->
                        <div class="field mb-5">
                            <label class="label is-small has-text-grey">Új jelszó megerősítése</label>
                            <div class="control has-icons-left">
                                <input class="input" type="password" id="page-setting-new-password-confirm" placeholder="Új jelszó még egyszer">
                                <span class="icon is-small is-left"><i class="fa-solid fa-check-double"></i></span>
                            </div>
                        </div>
                        
                        <button class="button is-warning is-fullwidth has-text-weight-bold" id="page-save-password-btn" style="border-radius: 8px;">
                            Jelszó megváltoztatása
                        </button>
                    </div>

                </div>

            </div>
        </div>
    `;

    // ==========================================
    // 2. FÜLEK LOGIKÁJÁNAK BEKÖTÉSE
    // ==========================================
    const tabs = document.querySelectorAll('#settings-page-tabs li');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.add('is-hidden'));
            
            tab.classList.add('is-active');
            document.getElementById(tab.dataset.target).classList.remove('is-hidden');
        });
    });

    // ==========================================
    // 3. ADATOK BETÖLTÉSE
    // ==========================================
    await refreshSettingsInPage();
    await loadUserProfileData();

    // ==========================================
    // 4. GOMBOK ESEMÉNYKEZELŐINEK BEKÖTÉSE
    // ==========================================
    document.getElementById("page-save-system-btn").addEventListener("click", saveSystemSettings);
    document.getElementById("page-reset-settings-btn").addEventListener("click", resetSettings);
    document.getElementById("page-clear-all-btn").addEventListener("click", openClearDbModal);
    document.getElementById("page-sync-now-btn").addEventListener("click", startNeptunSync);
    
    document.getElementById("page-setting-pic-upload").addEventListener("change", handleProfilePicUpload);
    document.getElementById("page-save-profile-btn").addEventListener("click", saveUserProfile);
    document.getElementById("page-save-password-btn").addEventListener("click", changePassword);
}

// ==========================================
// RENDSZER BEÁLLÍTÁSOK LOGIKA
// ==========================================
async function refreshSettingsInPage() {
    try {
        const res = await apiFetch(`/settings`);
        if (res.ok) {
            const settings = await res.json();
            state.appSettings = {
                semesterLength: settings.semesterLength || 14,
                icsUrl: settings.icsUrl || "",
                weekOffset: settings.weekOffset || 0,
            };
            document.getElementById("page-setting-semester-length").value = state.appSettings.semesterLength;
            document.getElementById("page-setting-neptun-ics").value = state.appSettings.icsUrl;
            document.getElementById("page-setting-week-offset").value = state.appSettings.weekOffset;
        }
    } catch (e) { console.error("Beállítások betöltési hiba:", e); }
}

async function saveSystemSettings() {
    const btn = document.getElementById("page-save-system-btn");
    btn.classList.add("is-loading");
    
    try {
        // Védelem a NaN értékek ellen (amelyek 400-as hibát dobnának)
        let semLen = parseInt(document.getElementById("page-setting-semester-length").value, 10);
        let wOff = parseInt(document.getElementById("page-setting-week-offset").value, 10);
        
        const payload = {
            semesterLength: isNaN(semLen) ? 14 : semLen,
            icsUrl: document.getElementById("page-setting-neptun-ics").value || "",
            weekOffset: isNaN(wOff) ? 0 : wOff,
            isFrylabsUnlocked: state.appSettings?.isFrylabsUnlocked || false
        };
        
        const res = await apiFetch(`/settings`, { method: 'POST', body: JSON.stringify(payload) });
        
        if (res.ok) {
            showToast("Rendszer beállítások mentve!", "is-success");
            await refreshSettingsInPage();
        } else {
            // Hibaszöveg kiolvasása a 400-as kód esetén
            const errText = await res.text();
            showToast(`Hiba a mentéskor: ${errText}`, "is-danger");
        }
    } catch (e) { 
        showToast("Hálózati hiba a mentés során.", "is-danger"); 
    }
    btn.classList.remove("is-loading");
}

async function resetSettings() {
    if (!confirm("Biztosan visszaállítod az alapértelmezett értékeket?")) return;
    try {
        const payload = { semesterLength: 14, icsUrl: "", weekOffset: 0, isFrylabsUnlocked: false };
        const res = await apiFetch(`/settings`, { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) {
            showToast("Beállítások alaphelyzetben!", "is-success");
            await refreshSettingsInPage();
        }
    } catch (e) { showToast("Hiba a visszaállításkor.", "is-danger"); }
}

// ==========================================
// FIÓKOM BEÁLLÍTÁSOK LOGIKA
// ==========================================
async function loadUserProfileData() {
    const profile = await fetchUserProfile();
    if (!profile) return;

    document.getElementById("page-setting-account-name").value = profile.fullName || "";
    document.getElementById("page-setting-account-email").value = profile.email || "";
    
    if (profile.profilePictureUrl && profile.profilePictureUrl.length > 50) {
        document.getElementById("page-setting-pic-preview").src = profile.profilePictureUrl;
        document.getElementById("page-setting-pic-preview").style.display = "block";
        document.getElementById("page-setting-pic-placeholder").style.display = "none";
        document.getElementById("page-setting-pic-base64").value = profile.profilePictureUrl;
    } else {
        document.getElementById("page-setting-pic-preview").style.display = "none";
        document.getElementById("page-setting-pic-placeholder").style.display = "flex";
        const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ZH';
        document.getElementById("page-setting-pic-placeholder").textContent = initials;
    }
}

function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2097152) { 
        showToast("A kép maximum 2 MB lehet.", "is-warning"); 
        event.target.value = ""; 
        return; 
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("page-setting-pic-preview").src = e.target.result;
        document.getElementById("page-setting-pic-preview").style.display = "block";
        document.getElementById("page-setting-pic-placeholder").style.display = "none";
        document.getElementById("page-setting-pic-base64").value = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveUserProfile() {
    const btn = document.getElementById("page-save-profile-btn");
    const newName = document.getElementById("page-setting-account-name").value;
    const newEmail = document.getElementById("page-setting-account-email").value;
    const newPicBase64 = document.getElementById("page-setting-pic-base64").value;

    if (!newName) { showToast("A név megadása kötelező!", "is-warning"); return; }

    btn.classList.add("is-loading");
    try {
        const res = await apiFetch("/auth/profile", {
            method: "PUT", body: JSON.stringify({ name: newName, email: newEmail, profilePictureUrl: newPicBase64 })
        });
        if (res.ok) {
            showToast("Személyes adatok frissítve!", "is-success");
            setTimeout(() => window.location.reload(), 1000); 
        } else {
            const errText = await res.text();
            showToast(`Hiba a profil mentésekor: ${errText}`, "is-danger");
        }
    } catch (e) { showToast("Hálózati hiba.", "is-danger"); }
    btn.classList.remove("is-loading");
}

async function changePassword() {
    const btn = document.getElementById("page-save-password-btn");
    const oldPw = document.getElementById("page-setting-old-password").value;
    const newPw = document.getElementById("page-setting-new-password").value;
    const newPwConfirm = document.getElementById("page-setting-new-password-confirm").value;

    // Dupla jelszó és kötelező mezők ellenőrzése
    if (!oldPw || !newPw || !newPwConfirm) { 
        showToast("Minden jelszó mezőt tölts ki!", "is-warning"); 
        return; 
    }
    if (newPw !== newPwConfirm) { 
        showToast("A két új jelszó nem egyezik meg!", "is-warning"); 
        return; 
    }
    if (newPw.length < 6) { 
        showToast("Az új jelszónak min. 6 karakternek kell lennie!", "is-warning"); 
        return; 
    }

    btn.classList.add("is-loading");
    try {
        const res = await apiFetch("/auth/change-password", {
            method: "PUT", body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
        });
        
        if (res.ok) {
            showToast("Jelszó sikeresen módosítva!", "is-success");
            document.getElementById("page-setting-old-password").value = "";
            document.getElementById("page-setting-new-password").value = "";
            document.getElementById("page-setting-new-password-confirm").value = "";
        } else {
            // Itt kiírjuk a 400-as hiba pontos okát (amit a szerver küld vissza)
            const errText = await res.text();
            showToast(errText || "Hibás régi jelszó vagy érvénytelen kérés!", "is-danger");
        }
    } catch (e) { 
        showToast("Hálózati hiba a jelszó cseréjekor.", "is-danger"); 
    }
    btn.classList.remove("is-loading");
}