// js/app.js

// ==========================================
// 1. IMPORTOK
// ==========================================

// Globális Állapot
import { state } from './state.js';

// Oldalak (Routing)
import { renderDashboard } from './pages/dashboard.js';
import { renderTimetable } from './pages/timetable.js';
import { renderSubjects } from './pages/subjects.js';
import { renderAssessments } from './pages/assessments.js';
import { renderTodos } from './pages/todos.js';

// API és Rendszer
import { logout, fetchUserProfile, escapeHTML} from './api.js';
import { 
    startNeptunSync, 
    initThemeToggle, 
    toggleTheme, 
    initAutoWeekCalculation, 
    closeSyncProgressModal,
    closeMissingLinkModal,
    goToSettingsFromMissingLink
} from './sync.js';
import { 
    fetchSettings, 
    openSettingsModal, 
    closeSettingsModal, 
    saveSettings, 
    resetSettings, 
    openClearDbModal,
    closeClearDbModal,
    executeClearDb
} from './settings.js';

// Modulok és Modál kezelők
import { 
    fetchOrarend, 
    openAddClassModal,
    closeAddClassModal, 
    submitCustomClass, 
    closeViewClassModal, 
    deleteCustomClass, 
    routeToZhAddFromClass,
    saveClassDetails
} from './class.js';
import { 
    fetchSubjects as fetchDbSubjects, 
    closeAddSubjectModal, 
    closeViewSubjectModal 
} from './subjects.js';
import { 
    fetchZhs, 
    closeAddZhModal, 
    submitZh, 
    closeViewZhModal 
} from './zarthelyik.js';
import { 
    fetchExams, 
    closeAddExamModal, 
    submitExam, 
    closeViewExamModal 
} from './exams.js';

// ==========================================
// 2. ROUTING (SPA NAVIGÁCIÓ)
// ==========================================

const routes = {
    '': renderDashboard,
    'dashboard': renderDashboard,
    'timetable': renderTimetable,
    'subjects': renderSubjects,
    'assessments': renderAssessments,
    'todos': renderTodos
};

const routerView = document.getElementById('router-view');

// Globális frissítő függvény (hogy más modulok is el tudják sütni mentés után)
window.refreshSPA = async () => {
    let hash = window.location.hash.substring(1);
    if (!hash) hash = 'dashboard';
    if (routes[hash]) {
        await routes[hash](routerView);
    }
};

async function navigate() {
    let hash = window.location.hash.substring(1);
    if (!hash) hash = 'dashboard';

    // Oldalsó menü aktív stílusának frissítése
    document.querySelectorAll('.sidebar .nav-item').forEach(link => {
        if (link.getAttribute('href') === `#${hash}`) link.classList.add('is-active');
        else link.classList.remove('is-active');
    });

    if (routes[hash]) {
        // Töltő animáció, amíg az oldal renderelődik
        routerView.innerHTML = `<div class="is-flex is-justify-content-center is-align-items-center" style="height: 100%;"><div class="loader is-loading is-large"></div></div>`;
        await routes[hash](routerView);
    }
}


// ==========================================
// 3. GLOBÁLIS ESEMÉNYKEZELŐK
// ==========================================

function setupGlobalEventListeners() {
    // --- ALAP NAVIGÁCIÓ ÉS BEÁLLÍTÁSOK ---
    document.getElementById("logout-btn")?.addEventListener("click", logout);
    document.getElementById("nav-settings-btn")?.addEventListener("click", openSettingsModal);
    document.getElementById("nav-sync-btn")?.addEventListener("click", startNeptunSync);
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

    document.getElementById("settings-close")?.addEventListener("click", closeSettingsModal);
    document.getElementById("settings-cancel-btn")?.addEventListener("click", closeSettingsModal);
    document.getElementById("save-settings-btn")?.addEventListener("click", saveSettings);
    document.getElementById("reset-settings-btn")?.addEventListener("click", resetSettings);
    document.getElementById("clear-all-btn")?.addEventListener("click", openClearDbModal);
    document.getElementById("sync-now-btn")?.addEventListener("click", startNeptunSync);
    document.getElementById("sync-modal-close-btn")?.addEventListener("click", closeSyncProgressModal);
    document.getElementById("clear-db-close-btn")?.addEventListener("click", closeClearDbModal);
    document.getElementById("clear-db-cancel-btn")?.addEventListener("click", closeClearDbModal);
    document.getElementById("clear-db-confirm-btn")?.addEventListener("click", executeClearDb);
    document.getElementById("missing-link-cancel-btn")?.addEventListener("click", closeMissingLinkModal);
    document.getElementById("missing-link-settings-btn")?.addEventListener("click", goToSettingsFromMissingLink);
    // --- EGYÉNI ÓRA FELVÉTELE MODÁL ---
    document.getElementById("add-class-close-btn")?.addEventListener("click", closeAddClassModal);
    document.getElementById("add-class-cancel-btn-bottom")?.addEventListener("click", closeAddClassModal);
    document.getElementById("add-class-submit-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        submitCustomClass();
    });

    // ÚJ: Esemény típusa fülek kapcsolgatása (Tárgy vs Egyéni)
    const classToggleTabs = document.querySelectorAll('#add-class-type-toggle li');
    const dropdownContainer = document.getElementById('add-class-subject-container');
    const customContainer = document.getElementById('add-class-custom-container');

    classToggleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            classToggleTabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            if (tab.dataset.type === 'subject') {
                dropdownContainer.classList.remove('is-hidden');
                customContainer.classList.add('is-hidden');
            } else {
                dropdownContainer.classList.add('is-hidden');
                customContainer.classList.remove('is-hidden');
            }
        });
    });

    // --- ÓRA RÉSZLETEK MODÁL ---
    document.getElementById("view-class-close-btn")?.addEventListener("click", closeViewClassModal);
    document.getElementById("view-class-cancel-btn")?.addEventListener("click", closeViewClassModal);
    document.getElementById("view-class-save-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        saveClassDetails();
    });
    
    // Átdobás ZH rögzítésbe
    document.getElementById("view-class-to-zh-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        routeToZhAddFromClass();
    });
    
    // Saját óra törlése gomb
    document.getElementById("detail-class-delete-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.currentlySelectedClass) {
            deleteCustomClass(state.currentlySelectedClass.id);
        }
    });

    // --- TANTÁRGY MODÁLOK ---
    document.getElementById("add-sub-cancel-btn")?.addEventListener("click", closeAddSubjectModal);
    document.getElementById("add-sub-cancel-btn-bottom")?.addEventListener("click", closeAddSubjectModal);
    
    document.getElementById("view-sub-close-btn")?.addEventListener("click", closeViewSubjectModal);

    // --- ZH MODÁLOK ---
    document.getElementById("add-zh-cancel-btn")?.addEventListener("click", closeAddZhModal);
    document.getElementById("zh-modal-submit-btn")?.addEventListener("click", (e) => { e.preventDefault(); submitZh(); });
    
    document.getElementById("view-zh-cancel-btn")?.addEventListener("click", closeViewZhModal);

    // --- VIZSGA MODÁLOK ---
    document.getElementById("add-exam-close")?.addEventListener("click", closeAddExamModal);
    document.getElementById("add-exam-cancel-btn")?.addEventListener("click", closeAddExamModal);
    document.getElementById("exam-modal-submit-btn")?.addEventListener("click", (e) => { e.preventDefault(); submitExam(); });
    
    document.getElementById("view-exam-cancel-btn")?.addEventListener("click", closeViewExamModal);
}


// ==========================================
// 4. ALKALMAZÁS INICIALIZÁLÁSA
// ==========================================

async function initApp() {
    if (!localStorage.getItem("ZHUB_TOKEN")) {
        window.location.replace("index.html");
        return;
    }

    try {
        initThemeToggle();
        setupGlobalEventListeners();
        
        await fetchSettings();

        // --- FELHASZNÁLÓI PROFIL BETÖLTÉSE ---
        const userProfile = await fetchUserProfile();
        if (userProfile) {
            const profileCard = document.querySelector('.user-profile-card');
            if (profileCard) {
                // Generálunk egy monogramot (Pl: "Kiss Péter" -> "KP")
                const initials = userProfile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ZH';
                
                // ÚJ: Profilkép HTML generálása (Kép vagy Monogram)
                let avatarHtml = '';
                if (userProfile.profilePictureUrl && userProfile.profilePictureUrl.length > 50) {
                    avatarHtml = `<img src="${userProfile.profilePictureUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    avatarHtml = initials; // Csak a betűk
                }
                
                profileCard.innerHTML = `
                    <div style="width: 40px; height: 40px; background-color: var(--bulma-link); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0; overflow: hidden; border: 2px solid white;">
                        ${avatarHtml}
                    </div>
                    <div style="line-height: 1.2; overflow: hidden;">
                        <p class="has-text-weight-bold is-size-6 mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHTML(userProfile.fullName)}
                        </p>
                        <p class="has-text-grey is-size-7 mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(userProfile.email)}">
                            ${escapeHTML(userProfile.email)}
                        </p>
                    </div>
                    <div class="ml-auto">
                        <button class="button is-small is-ghost has-text-danger p-0" id="logout-btn" title="Kijelentkezés">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                `;
                document.getElementById("logout-btn")?.addEventListener("click", logout);
            }
        }
        // -------------------------------------
        
        // SZIGORÚ BETÖLTÉSI SORREND
        await fetchOrarend();      
        await fetchDbSubjects();   
        await Promise.all([ fetchZhs(), fetchExams() ]); 
        
        initAutoWeekCalculation(); 

        window.addEventListener('hashchange', navigate);
        navigate();
        
    } catch (e) {
        console.error("Kritikus hiba az induláskor:", e);
    }
}
// ==========================================
// GLOBÁLIS MODÁL BEZÁRÁS (Kattintás a háttérre)
// ==========================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-background')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('is-active');
        }
    }
});

document.addEventListener('DOMContentLoaded', initApp);