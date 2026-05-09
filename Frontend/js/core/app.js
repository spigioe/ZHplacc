// js/app.js

// ==========================================
// 1. IMPORTOK
// ==========================================
import { state } from './state.js';
import { apiFetch, logout, fetchUserProfile, escapeHTML } from './api.js';
import { injectModals } from '../components/modals.js';

// Oldalak (Nézetek)
import { renderDashboard } from '../pages/dashboard.js';
import { renderTimetable } from '../pages/timetable.js';
import { renderSubjects } from '../pages/subjects.js';
import { renderAssessments } from '../pages/assessments.js';
import { renderTodos } from '../pages/todos.js';
import { renderSettings } from '../pages/settings.js';
import { renderHelp } from '../pages/help.js';

// Szolgáltatások (Services)
import { checkAndRunTour } from '../services/tourService.js';
import { startNeptunSync, initThemeToggle, toggleTheme, initAutoWeekCalculation, closeSyncProgressModal, closeMissingLinkModal, goToSettingsFromMissingLink } from '../services/syncService.js';
import { openClearDbModal, closeClearDbModal, executeClearDb } from '../services/settingService.js';
import { fetchOrarend, openAddClassModal, closeAddClassModal, submitCustomClass, closeViewClassModal, deleteCustomClass, routeToZhAddFromClass, saveClassDetails } from '../services/classService.js';
import { fetchSubjects as fetchDbSubjects, closeAddSubjectModal, closeViewSubjectModal } from '../services/subjectService.js';
import { fetchZhs, closeAddZhModal, submitZh, closeViewZhModal } from '../services/zarthelyiService.js';
import { fetchExams, closeAddExamModal, submitExam, closeViewExamModal } from '../services/examService.js';

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

window.refreshSPA = async () => {
    let hash = window.location.hash.substring(1) || 'dashboard';
    if (routes[hash]) await routes[hash](routerView);
};

async function navigate() {
    let hash = window.location.hash.substring(1) || 'dashboard';

    // Aktív menüpont stílusozása
    document.querySelectorAll('.sidebar .nav-item').forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${hash}`);
    });

    // Címsor frissítése
    const meta = routeMeta[hash] || { title: 'platZH', icon: 'fa-layer-group' };
    const pageTitleEl = document.getElementById('page-title');
    const pageIconEl = document.getElementById('topbar-page-icon');
    
    if (pageTitleEl) pageTitleEl.textContent = meta.title;
    if (pageIconEl) pageIconEl.innerHTML = `<i class="fa-solid ${meta.icon}"></i>`;

    // Dátum widget frissítése
    const dateWidget = document.getElementById('topbar-date-widget');
    if (dateWidget) {
        dateWidget.textContent = new Date().toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'short' });
    }

    // Oldal renderelése Loading animációval
    if (routes[hash]) {
        routerView.innerHTML = `<div class="is-flex is-justify-content-center is-align-items-center" style="height: 100%;"><div class="loader is-loading is-large"></div></div>`;
        await routes[hash](routerView);
    }
}

// ==========================================
// 3. ESEMÉNYKEZELŐK
// ==========================================

function setupGlobalEventListeners() {
    // --- Navigáció és Gombok ---
    document.getElementById("logout-btn")?.addEventListener("click", logout);
    document.getElementById("mobile-logout-btn")?.addEventListener("click", logout);
    document.getElementById("nav-sync-btn")?.addEventListener("click", startNeptunSync);
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

    // Smart Navigáció a Beállításokhoz és Súgóhoz
    const handleSmartNav = (e, targetHash) => {
        e.preventDefault();
        window.location.hash = (window.location.hash === targetHash) ? '#dashboard' : targetHash;
        document.getElementById('mobile-menu')?.classList.remove('is-active');
        document.getElementById('mobile-menu-overlay')?.classList.remove('is-active');
    };
    document.getElementById("nav-settings-btn")?.addEventListener("click", (e) => handleSmartNav(e, '#settings'));
    document.getElementById("nav-help-btn")?.addEventListener("click", (e) => handleSmartNav(e, '#help'));
    document.getElementById("mobile-settings-btn")?.addEventListener("click", (e) => handleSmartNav(e, '#settings'));

    // --- Modál Gombok: Rendszer ---
    document.getElementById("sync-modal-close-btn")?.addEventListener("click", closeSyncProgressModal);
    document.getElementById("clear-db-close-btn")?.addEventListener("click", closeClearDbModal);
    document.getElementById("clear-db-cancel-btn")?.addEventListener("click", closeClearDbModal);
    document.getElementById("clear-db-confirm-btn")?.addEventListener("click", executeClearDb);
    document.getElementById("missing-link-cancel-btn")?.addEventListener("click", closeMissingLinkModal);
    document.getElementById("missing-link-settings-btn")?.addEventListener("click", goToSettingsFromMissingLink);
    
    // --- Modál Gombok: Események (Órák) ---
    document.getElementById("add-class-close-btn")?.addEventListener("click", closeAddClassModal);
    document.getElementById("add-class-cancel-btn-bottom")?.addEventListener("click", closeAddClassModal);
    document.getElementById("add-class-submit-btn")?.addEventListener("click", (e) => { e.preventDefault(); submitCustomClass(); });
    
    document.getElementById("view-class-close-btn")?.addEventListener("click", closeViewClassModal);
    document.getElementById("view-class-cancel-btn")?.addEventListener("click", closeViewClassModal);
    document.getElementById("view-class-save-btn")?.addEventListener("click", (e) => { e.preventDefault(); saveClassDetails(); });
    document.getElementById("view-class-to-zh-btn")?.addEventListener("click", (e) => { e.preventDefault(); routeToZhAddFromClass(); });
    document.getElementById("detail-class-delete-btn")?.addEventListener("click", (e) => { e.preventDefault(); deleteCustomClass(state.currentlySelectedClass?.id); });

    // --- Modál Gombok: Tantárgyak, ZH-k, Vizsgák ---
    document.getElementById("add-sub-cancel-btn")?.addEventListener("click", closeAddSubjectModal);
    document.getElementById("add-sub-cancel-btn-bottom")?.addEventListener("click", closeAddSubjectModal);
    document.getElementById("view-sub-close-btn")?.addEventListener("click", closeViewSubjectModal);

    document.getElementById("add-zh-cancel-btn")?.addEventListener("click", closeAddZhModal);
    document.getElementById("zh-modal-submit-btn")?.addEventListener("click", (e) => { e.preventDefault(); submitZh(); });
    document.getElementById("view-zh-cancel-btn")?.addEventListener("click", closeViewZhModal);

    document.getElementById("add-exam-close")?.addEventListener("click", closeAddExamModal);
    document.getElementById("add-exam-cancel-btn")?.addEventListener("click", closeAddExamModal);
    document.getElementById("exam-modal-submit-btn")?.addEventListener("click", (e) => { e.preventDefault(); submitExam(); });
    document.getElementById("view-exam-cancel-btn")?.addEventListener("click", closeViewExamModal);

    // --- Egyéni Óra Típus Kapcsoló ---
    const classToggleTabs = document.querySelectorAll('#add-class-type-toggle li');
    if (classToggleTabs.length > 0) {
        classToggleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                classToggleTabs.forEach(t => t.classList.remove('is-active'));
                tab.classList.add('is-active');
                document.getElementById('add-class-subject-container').classList.toggle('is-hidden', tab.dataset.type !== 'subject');
                document.getElementById('add-class-custom-container').classList.toggle('is-hidden', tab.dataset.type === 'subject');
            });
        });
    }

    // --- Modálok Bezárása Háttérre Kattintással ---
    document.addEventListener('click', (e) => {
        if (e.target.matches('.modal-background, .modal-close, .modal-card-head .delete, .close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('is-active');
                if (modal.id === 'view-class-modal') state.currentlySelectedClass = null; // Biztonsági takarítás
            }
        }
    });
}

// ==========================================
// 4. INICIALIZÁLÁS (SEGÉDFÜGGVÉNYEK)
// ==========================================

async function loadSettings() {
    try {
        const setRes = await apiFetch(`/settings`);
        if (setRes.ok) {
            const s = await setRes.json();
            // Boolean biztonsági ellenőrzés (kisbetű/nagybetű fallback)
            const isFirst = s.isFirstLogin !== undefined ? s.isFirstLogin : (s.IsFirstLogin !== undefined ? s.IsFirstLogin : true);
            
            state.appSettings = {
                semesterLength: s.semesterLength || s.SemesterLength || 14,
                icsUrl: s.icsUrl || s.IcsUrl || "",
                weekOffset: s.weekOffset || s.WeekOffset || 0,
                isFrylabsUnlocked: s.isFrylabsUnlocked || s.IsFrylabsUnlocked || false,
                isFirstLogin: isFirst 
            };
        }
    } catch(e) {
        console.error("Hiba a beállítások betöltésekor", e);
    }
}

async function renderUserProfileUI() {
    const userProfile = await fetchUserProfile();
    if (!userProfile) return;

    // Asztali profil kártya
    const profileCard = document.querySelector('.user-profile-card');
    if (profileCard) {
        const initials = userProfile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ZH';
        const avatarHtml = (userProfile.profilePictureUrl && userProfile.profilePictureUrl.length > 50)
            ? `<img src="${userProfile.profilePictureUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : initials;
        
        profileCard.innerHTML = `
            <div style="width: 40px; height: 40px; background-color: var(--bulma-link); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0; overflow: hidden; border: 2px solid white;">
                ${avatarHtml}
            </div>
            <div style="line-height: 1.2; overflow: hidden;">
                <p class="has-text-weight-bold is-size-6 mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(userProfile.fullName)}</p>
                <p class="has-text-grey is-size-7 mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(userProfile.email)}">${escapeHTML(userProfile.email)}</p>
            </div>
            <div class="ml-auto">
                <button class="button is-small is-ghost has-text-danger p-0" id="logout-btn-card" title="Kijelentkezés">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
        document.getElementById("logout-btn-card")?.addEventListener("click", logout);
    }
    
    // Mobil Sidebar profil info
    const mobileNameDisp = document.getElementById('user-display-name');
    const mobileEmailDisp = document.getElementById('user-display-email');
    if(mobileNameDisp) mobileNameDisp.textContent = userProfile.fullName;
    if(mobileEmailDisp) mobileEmailDisp.textContent = userProfile.email;
}

// ==========================================
// 5. ALKALMAZÁS INDÍTÁSA
// ==========================================

async function initApp() {
    if (!localStorage.getItem("ZHUB_TOKEN")) {
        window.location.replace("index.html");
        return;
    }

    try {
        // 1. UI Előkészítése
        injectModals();
        initThemeToggle();
        setupGlobalEventListeners();

        // 2. Beállítások és Felhasználó letöltése
        await loadSettings();
        await renderUserProfileUI();
        
        // 3. Alapadatok letöltése
        await fetchOrarend();      
        await fetchDbSubjects();   
        await Promise.all([ fetchZhs(), fetchExams() ]); 
        
        // 4. Kalkulációk és Routing
        initAutoWeekCalculation(); 
        window.addEventListener('hashchange', navigate);
        navigate();

        // 5. Opcionális Tour indítása
        setTimeout(checkAndRunTour, 500);

    } catch (e) {
        console.error("Kritikus hiba az induláskor:", e);
    }
}

document.addEventListener('DOMContentLoaded', initApp);