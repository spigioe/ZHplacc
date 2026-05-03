// js/app.js

// ==========================================
// 1. IMPORTOK
// ==========================================

import { state } from './state.js';

// ---> 1. MODÁLOK KOMPONENSÉNEK IMPORTÁLÁSA <---
import { injectModals } from '../components/modals.js';

import { renderDashboard } from '../pages/dashboard.js';
import { renderTimetable } from '../pages/timetable.js';
import { renderSubjects } from '../pages/subjects.js';
import { renderAssessments } from '../pages/assessments.js';
import { renderTodos } from '../pages/todos.js';
import { renderSettings } from '../pages/settings.js';
import { renderHelp } from '../pages/help.js'; // <- ÚJ: Súgó importálása
import { checkAndRunTour } from '../services/tourService.js';

import { 
    logout, 
    fetchUserProfile, 
    escapeHTML
} from './api.js';

import { 
    startNeptunSync, 
    initThemeToggle, 
    toggleTheme,
    initAutoWeekCalculation, 
    closeSyncProgressModal,
    closeMissingLinkModal,
    goToSettingsFromMissingLink
} from '../services/syncService.js';

import { 
    openClearDbModal,
    closeClearDbModal,
    executeClearDb
} from '../services/settingService.js';

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
} from '../services/classService.js';
import { 
    fetchSubjects as fetchDbSubjects, 
    closeAddSubjectModal, 
    closeViewSubjectModal 
} from '../services/subjectService.js';
import { 
    fetchZhs, 
    closeAddZhModal, 
    submitZh, 
    closeViewZhModal 
} from '../services/zarthelyiService.js';
import { 
    fetchExams, 
    closeAddExamModal, 
    submitExam, 
    closeViewExamModal 
} from '../services/examService.js';

// ==========================================
// 2. ROUTING (SPA NAVIGÁCIÓ)
// ==========================================

const routes = {
    '': renderDashboard,
    'dashboard': renderDashboard,
    'timetable': renderTimetable,
    'subjects': renderSubjects,
    'assessments': renderAssessments,
    'todos': renderTodos,
    'settings': renderSettings,
    'help': renderHelp
};

const routeMeta = {
    '': { title: 'Vezérlőpult', icon: 'fa-house' },
    'dashboard': { title: 'Vezérlőpult', icon: 'fa-house' },
    'timetable': { title: 'Órarend', icon: 'fa-calendar-week' },
    'subjects': { title: 'Tantárgyak', icon: 'fa-book-bookmark' },
    'assessments': { title: 'Számonkérések', icon: 'fa-file-pen' },
    'todos': { title: 'Teendők', icon: 'fa-list-check' },
    'settings': { title: 'Beállítások', icon: 'fa-gear' },
    'help': { title: 'Súgó és Tudástár', icon: 'fa-circle-question' }
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

    const meta = routeMeta[hash] || { title: 'platZH', icon: 'fa-layer-group' };
    const pageTitleEl = document.getElementById('page-title');
    const pageIconEl = document.getElementById('topbar-page-icon');
    
    if (pageTitleEl) pageTitleEl.textContent = meta.title;
    if (pageIconEl) pageIconEl.innerHTML = `<i class="fa-solid ${meta.icon}"></i>`;

    const dateWidget = document.getElementById('topbar-date-widget');
    if (dateWidget) {
        const today = new Date();
        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        // Pl.: május 3., p.
        dateWidget.textContent = today.toLocaleDateString('hu-HU', options);
    }

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
    document.getElementById("mobile-logout-btn")?.addEventListener("click", logout);

    // BEÁLLÍTÁSOK ALOLDALRA NAVIGÁLÁS
    document.getElementById("nav-settings-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = '#settings';
    });
    document.getElementById("mobile-settings-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = '#settings';
    });

    document.getElementById("nav-help-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = '#help';
    });
    
    document.getElementById("nav-sync-btn")?.addEventListener("click", startNeptunSync);
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

    // Különféle modálok (Sync, Törlés, stb.) eseményei
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

    // Esemény típusa fülek kapcsolgatása (Tárgy vs Egyéni)
    const classToggleTabs = document.querySelectorAll('#add-class-type-toggle li');
    const dropdownContainer = document.getElementById('add-class-subject-container');
    const customContainer = document.getElementById('add-class-custom-container');

    if (classToggleTabs.length > 0) {
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
    }

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
        // ---> 2. MODÁLOK INJEKTÁLÁSA A DOM-BA <---
        // Ezt MINDEN ELŐTT meg kell hívni, hogy a HTML elemek már létezzenek a memóriában!
        injectModals();
        
        initThemeToggle();
        
        // Csak ez után köthetjük rá az eseménykezelőket!
        setupGlobalEventListeners();
        
        // Nem használjuk a fetchSettings-t a modál betöltéséhez az inicializáláskor, 
        // hiszen az csak a Settings menüpont megnyitásakor történik meg a jövőben.
        // A state.appSettings frissítése miatt viszont továbbra is kellhet:
        try {
            const setRes = await apiFetch(`/settings`);
            if(setRes.ok) {
                const s = await setRes.json();
                state.appSettings = {
                    semesterLength: s.semesterLength || 14,
                    icsUrl: s.icsUrl || "",
                    weekOffset: s.weekOffset || 0,
                };
            }
        } catch(e) {}

        // --- FELHASZNÁLÓI PROFIL BETÖLTÉSE ---
        const userProfile = await fetchUserProfile();
        if (userProfile) {
            const profileCard = document.querySelector('.user-profile-card');
            if (profileCard) {
                // Generálunk egy monogramot (Pl: "Kiss Péter" -> "KP")
                const initials = userProfile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ZH';
                
                // Profilkép HTML generálása (Kép vagy Monogram)
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
            
            // Profil infók betöltése a mobilos Sidebarba is! (Mivel mobilon el van rejtve a .user-profile-card)
            const mobileNameDisp = document.getElementById('user-display-name');
            const mobileEmailDisp = document.getElementById('user-display-email');
            if(mobileNameDisp) mobileNameDisp.textContent = userProfile.fullName;
            if(mobileEmailDisp) mobileEmailDisp.textContent = userProfile.email;
        }
        // -------------------------------------
        
        // SZIGORÚ BETÖLTÉSI SORREND
        await fetchOrarend();      
        await fetchDbSubjects();   
        await Promise.all([ fetchZhs(), fetchExams() ]); 
        
        initAutoWeekCalculation(); 

        window.addEventListener('hashchange', navigate);
        navigate();

        setTimeout(() => {
            checkAndRunTour();
        }, 800);
        
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