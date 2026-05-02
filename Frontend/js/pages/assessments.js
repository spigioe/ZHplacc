// js/pages/assessments.js
import { state } from '../core/state.js';
import { escapeHTML } from '../core/api.js';
import { openViewZhModal, openAddZhModal } from '../services/zarthelyiService.js';
import { openViewExamModal, openAddExamModal } from '../services/examService.js';
import { renderSidebarTodosWidget } from './todos.js';

export async function renderAssessments(container) {
    // 1. Dátum "ma éjfél" kiszámítása (hogy a mai ZH is megjelenjen)
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // ZH-k és Vizsgák összefésülése és felcímkézése
    const futureZhs = (state.allZhs || []).map(zh => ({ ...zh, isExam: false }));
    const futureExams = (state.allExams || []).map(ex => ({ ...ex, isExam: true }));
    
    // Szűrés CSAK A MAI ÉS JÖVŐBELI eseményekre
    const allEvents = [...futureZhs, ...futureExams]
        .filter(evt => {
            const eventDate = new Date(evt.dateOf || evt.DateOf);
            return eventDate >= todayMidnight; 
        })
        .sort((a, b) => new Date(a.dateOf || a.DateOf) - new Date(b.dateOf || b.DateOf));

    // Sorok (HTML) legenerálása
    const rowsHtml = allEvents.map(evt => {
        // Dátum és idő pontos konvertálása
        const d = new Date(evt.dateOf || evt.DateOf);
        const dateStr = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        
        // Okos visszaszámlálás (csak a napokat nézzük, órákat nem, hogy ne kavarjon be a kerekítés)
        const eventMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.round((eventMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
        
        let countdown = `Még ${diffDays} nap`;
        let tagClass = "is-light"; // Alapértelmezett szürke

        if (diffDays === 0) {
            countdown = 'Ma!';
            tagClass = "is-danger";
        } else if (diffDays === 1) {
            countdown = 'Holnap!';
            tagClass = "is-warning";
        } else if (diffDays <= 3) {
            tagClass = "is-warning is-light";
        }

        const typeTag = evt.isExam ? '<span class="tag is-danger is-light">🎓 Vizsga</span>' : '<span class="tag is-warning is-light">📝 ZH</span>';

        return `
            <tr>
                <td class="has-text-weight-bold">
                    ${dateStr}<br>
                    <span class="is-size-7 has-text-grey font-weight-normal">${timeStr}</span>
                </td>
                <td>${typeTag}</td>
                <td class="has-text-weight-bold has-text-link">${escapeHTML(evt.subjectName || evt.SubjectName || "Ismeretlen")}</td>
                <td class="has-text-grey">${escapeHTML(evt.room || evt.Room || "-")}</td>
                <td><span class="tag ${tagClass} has-text-weight-bold">${countdown}</span></td>
                <td class="has-text-right">
                    <button class="button is-small is-ghost btn-view-assessment" data-id="${evt.id || evt.Id}" data-type="${evt.isExam ? 'exam' : 'zh'}">Részletek</button>
                </td>
            </tr>
        `;
    }).join('');

    // --- KÉTOSZLOPOS ELRENDEZÉS (CSS-BE KISZERVEZVE) ---
    container.innerHTML = `
        <div class="dashboard-view ass-layout-wrapper">
            
            <!-- MOBIL CÍM (Csak mobilon látszik, legfelül) -->
            <div class="ass-mobile-header is-hidden-tablet px-4 pt-4">
                <h2 class="title is-4 mb-1">Közelgő Számonkérések</h2>
                <p class="has-text-grey is-size-7">Az összes jövőbeli ZH és Vizsga</p>
            </div>

            <!-- BAL/KÖZÉPSŐ OSZLOP (Fő tartalom - Táblázat) -->
            <div class="dash-center ass-main-column">
                
                <!-- ASZTALI CÍM (Mobilon elrejtve) -->
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 ass-header-area is-hidden-mobile">
                    <div>
                        <h2 class="title is-4 mb-1">Közelgő Számonkérések</h2>
                        <p class="has-text-grey is-size-7">Az összes jövőbeli ZH és Vizsga időrendben</p>
                    </div>
                </div>
                
                <div class="ass-table-container">
                    <div class="box p-0 ass-table-box">
                        <table class="table is-fullwidth is-hoverable mb-0 ass-table">
                            <thead class="ass-table-head">
                                <tr>
                                    <th class="ass-table-header-text">Időpont</th>
                                    <th class="ass-table-header-text">Típus</th>
                                    <th class="ass-table-header-text">Tantárgy</th>
                                    <th class="ass-table-header-text">Helyszín</th>
                                    <th class="ass-table-header-text">Visszaszámlálás</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allEvents.length > 0 ? rowsHtml : '<tr><td colspan="6" class="has-text-centered p-5 has-text-grey">Nincs kiírt számonkérés a jövőben. 🎉</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- JOBB OSZLOP (Gombok, Statisztika és Napi Teendők) -->
            <div class="dash-right ass-sidebar-column">
                <div class="buttons mb-4 ass-action-buttons">
                    <button class="button is-warning is-light is-fullwidth" id="ass-add-zh">
                        <i class="fa-solid fa-plus mr-2"></i> Új ZH Rögzítése
                    </button>
                    <button class="button is-danger is-light is-fullwidth" id="ass-add-exam">
                        <i class="fa-solid fa-plus mr-2"></i> Új Vizsga Rögzítése
                    </button>
                </div>

                <div class="box p-4 mb-4 ass-stat-box-solid">
                    <h3 class="title is-6 has-text-grey mb-3">Összesítő</h3>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Hátralévő ZH-k:</span>
                        <span class="tag is-warning is-light has-text-weight-bold">${futureZhs.filter(evt => new Date(evt.dateOf) >= now).length} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Hátralévő Vizsgák:</span>
                        <span class="tag is-danger is-light has-text-weight-bold">${futureExams.filter(evt => new Date(evt.dateOf) >= now).length} db</span>
                    </div>
                </div>
                
                <!-- IGAZI TEENDŐK WIDGET (Mobilon elrejtjük a helyspórolás miatt) -->
                <div class="box p-4 ass-stat-box-dashed">
                    <div id="sidebar-todo-widget">
                        <div class="has-text-centered py-3">
                            <div class="loader is-loading mx-auto"></div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    `;

    // Widget inicializálása
    renderSidebarTodosWidget();

    // --- ESEMÉNYKEZELŐK TISZTA IMPORTOKKAL ---
    document.getElementById('ass-add-zh')?.addEventListener('click', () => {
        openAddZhModal(); 
    });
    
    document.getElementById('ass-add-exam')?.addEventListener('click', () => {
        openAddExamModal(); 
    });

    document.querySelectorAll('.btn-view-assessment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const type = e.currentTarget.getAttribute('data-type');
            
            if(type === 'exam') openViewExamModal(id);
            if(type === 'zh') openViewZhModal(id);
        });
    });
}