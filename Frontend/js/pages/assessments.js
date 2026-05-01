import { state } from '../state.js';
import { escapeHTML } from '../api.js';

// AZ UGYANOLYAN IMPORTOK MINT A TIMETABLE-BEN
import { openViewZhModal, openAddZhModal } from '../zarthelyik.js';
import { openViewExamModal, openAddExamModal } from '../exams.js';

export async function renderAssessments(container) {
    const now = new Date();
    
    // ZH-k és Vizsgák összefésülése és felcímkézése
    const futureZhs = (state.allZhs || []).map(zh => ({ ...zh, isExam: false }));
    const futureExams = (state.allExams || []).map(ex => ({ ...ex, isExam: true }));
    
    const allEvents = [...futureZhs, ...futureExams]
        .filter(evt => new Date(evt.dateOf) >= now) // Csak a jövőbeliek
        .sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf));

    const rowsHtml = allEvents.map(evt => {
        const d = new Date(evt.dateOf);
        const dateStr = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        
        const diffDays = Math.round(Math.abs(d - now) / (1000 * 60 * 60 * 24));
        let countdown = `Még ${diffDays} nap`;
        if (diffDays === 0) countdown = 'Ma!';
        if (diffDays === 1) countdown = 'Holnap!';

        const typeTag = evt.isExam ? '<span class="tag is-danger is-light">🎓 Vizsga</span>' : '<span class="tag is-warning is-light">📝 ZH</span>';

        return `
            <tr>
                <td class="has-text-weight-bold">
                    ${dateStr}<br>
                    <span class="is-size-7 has-text-grey font-weight-normal">${timeStr}</span>
                </td>
                <td>${typeTag}</td>
                <td class="has-text-weight-bold" style="color: #3b82f6;">${escapeHTML(evt.subjectName || evt.SubjectName || "Ismeretlen")}</td>
                <td class="has-text-grey">${escapeHTML(evt.room || "-")}</td>
                <td><span class="tag ${diffDays <= 3 ? 'is-danger' : 'is-light'}">${countdown}</span></td>
                <td class="has-text-right">
                    <button class="button is-small is-ghost btn-view-assessment" data-id="${evt.id || evt.Id}" data-type="${evt.isExam ? 'exam' : 'zh'}">Részletek</button>
                </td>
            </tr>
        `;
    }).join('');

    // --- KÉTOSZLOPOS ELRENDEZÉS BEVEZETÉSE ---
    container.innerHTML = `
        <div class="dashboard-view" style="height: 100%; overflow: hidden; display: flex;">
            
            <!-- BAL/KÖZÉPSŐ OSZLOP (Fő tartalom) -->
            <div class="dash-center" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; flex: 1;">
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-4" style="flex-shrink: 0;">
                    <div>
                        <h2 class="title is-4 mb-1">Közelgő Számonkérések</h2>
                        <p class="has-text-grey is-size-7">Az összes jövőbeli ZH és Vizsga időrendben</p>
                    </div>
                </div>
                
                <div style="overflow-y: auto; flex-grow: 1; padding-bottom: 20px;">
                    <div class="box p-0" style="overflow: hidden; border: 1px solid var(--bulma-border); box-shadow: none; background-color: var(--bulma-scheme-main);">
                        <table class="table is-fullwidth is-hoverable mb-0" style="background-color: transparent;">
                            <thead style="background-color: var(--bulma-background-light);">
                                <tr>
                                    <th style="color: var(--bulma-text-strong);">Időpont</th>
                                    <th style="color: var(--bulma-text-strong);">Típus</th>
                                    <th style="color: var(--bulma-text-strong);">Tantárgy</th>
                                    <th style="color: var(--bulma-text-strong);">Helyszín</th>
                                    <th style="color: var(--bulma-text-strong);">Visszaszámlálás</th>
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

            <!-- JOBB OSZLOP (Gombok és Statisztika) -->
            <div class="dash-right" style="height: 100%; overflow-y: auto; padding-bottom: 20px;">
                <div class="buttons mb-4">
                    <button class="button is-warning is-light is-fullwidth" id="ass-add-zh">
                        <i class="fa-solid fa-plus mr-2"></i> Új ZH Rögzítése
                    </button>
                    <button class="button is-danger is-light is-fullwidth" id="ass-add-exam">
                        <i class="fa-solid fa-plus mr-2"></i> Új Vizsga Rögzítése
                    </button>
                </div>

                <div class="box p-4 mb-4" style="border: 1px solid var(--bulma-border); box-shadow: none;">
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
                
            </div>
        </div>
    `;

    // --- ESEMÉNYKEZELŐK TISZTA IMPORTOKKAL ---
    document.getElementById('ass-add-zh')?.addEventListener('click', () => {
        openAddZhModal(); // Közvetlen hívás!
    });
    
    document.getElementById('ass-add-exam')?.addEventListener('click', () => {
        openAddExamModal(); // Közvetlen hívás!
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