// js/pages/dashboard.js
import { state } from '../state.js';
import { escapeHTML } from '../api.js';
import { calculateCurrentWeek } from '../ui.js';
import { renderSidebarTodosWidget, renderTodos } from './todos.js';
import { openAddZhModal, openViewZhModal, deleteZh } from '../zarthelyik.js';
import { openAddExamModal, openViewExamModal, deleteExam } from '../exams.js';
import { renderSidebarTodosWidget } from './todos.js';

export async function renderDashboard(container) {
    const now = new Date();
    
    // MAI NAP KISZÁMÍTÁSA
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    
    // CSAK a valóban mai napra eső órák szűrése
    const maiOrak = (state.allTimetableEvents || [])
        .filter(ora => {
            if (!ora.startObj) return false;
            return ora.startObj >= todayStart && ora.startObj < tomorrowStart;
        })
        .sort((a, b) => a.startObj - b.startObj);

    // Jövőbeli ZH-k és Vizsgák
    const futureZhs = (state.allZhs || []).filter(zh => new Date(zh.dateOf) >= now).map(zh => ({ ...zh, isExam: false }));
    const futureExams = (state.allExams || []).filter(ex => new Date(ex.dateOf) >= now).map(ex => ({ ...ex, isExam: true }));
    const kozelgoEsemenyek = [...futureZhs, ...futureExams].sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf)).slice(0, 4); 

    const maxWeek = state.appSettings?.semesterLength || 14;
    const currentWeek = calculateCurrentWeek() > 0 ? calculateCurrentWeek() : 1;
    const felevSzazalek = Math.round((currentWeek / maxWeek) * 100);

    // --- ÚJ STATISZTIKA (Csak az aktuális félév) ---
    const activeSemester = state.currentSemesterStr;
    const currentSubjects = (state.allSubjects || []).filter(s => (s.semesterTag || s.SemesterTag) === activeSemester);
    const currentSubIds = currentSubjects.map(s => s.id || s.Id);
    
    const vizsgasTargyakSzama = currentSubjects.filter(s => s.hasExam || s.HasExam).length;
    // Megszámoljuk azokat a kiírt ZH-kat, amik az aktuális félév tárgyaihoz tartoznak
    const aktualisZhkSzama = (state.allZhs || []).filter(zh => currentSubIds.includes(zh.subjectId || zh.SubjectId)).length;

    container.innerHTML = `
        <div class="dashboard-view">
            <div class="dash-center">
                <div class="columns is-multiline">
                    <div class="column is-6">
                        <h3 class="title is-6 has-text-grey is-uppercase mb-4">Mai fókuszkodás</h3>
                        ${maiOrak.length === 0 ? '<div class="notification is-light has-text-centered has-text-grey">Ma nincs egyetemi órád. 🎉</div>' : ''}
                        ${maiOrak.map(ora => `
                            <div class="box p-3 mb-3" style="border-left: 4px solid #3b82f6;">
                                <p class="is-size-7 has-text-weight-bold has-text-link mb-1"><i class="fa-regular fa-clock mr-1"></i> ${ora.timeStr}</p>
                                <p class="is-size-5 has-text-weight-bold" style="line-height: 1.2;">${escapeHTML(ora.rawSubjectName)}</p>
                                <p class="is-size-7 has-text-grey mt-1"><i class="fa-solid fa-location-dot mr-1"></i> Terem: ${escapeHTML(ora.room || '-')}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div class="column is-6">
                        <h3 class="title is-6 has-text-grey is-uppercase mb-4">Közelgő Számonkérések</h3>
                        ${kozelgoEsemenyek.length === 0 ? '<div class="notification is-light has-text-centered has-text-grey">Nincs közelgő számonkérés az adatbázisban.</div>' : ''}
                        ${kozelgoEsemenyek.map(evt => {
                            const dateObj = new Date(evt.dateOf);
                            const dateStr = dateObj.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
                            const timeStr = dateObj.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
                            const roomStr = escapeHTML(evt.room) || 'Nincs terem megadva';
                            const typeColor = evt.isExam ? 'danger' : 'warning';
                            
                            return `
                            <div class="box p-0 mb-3" style="border-left: 4px solid var(--bulma-${typeColor}); overflow: hidden;">
                                <div class="p-3">
                                    <div class="is-flex is-justify-content-space-between is-align-items-start mb-2">
                                        <div>
                                            <p class="is-size-7 has-text-weight-bold has-text-${typeColor}-dark mb-1">
                                                <i class="fa-regular fa-calendar mr-1"></i> ${dateStr} &nbsp; 
                                                <i class="fa-regular fa-clock mr-1"></i> ${timeStr}
                                            </p>
                                            <p class="has-text-weight-bold mb-0" style="line-height: 1.2;">${escapeHTML(evt.subjectName || evt.SubjectName)}</p>
                                            <p class="is-size-7 has-text-grey mt-1"><i class="fa-solid fa-location-dot mr-1"></i> ${roomStr}</p>
                                        </div>
                                        <span class="tag is-${typeColor} is-light is-small mt-1">
                                            <i class="fa-solid ${evt.isExam ? 'fa-graduation-cap' : 'fa-pen'} mr-1"></i> ${evt.isExam ? 'Vizsga' : 'ZH'}
                                        </span>
                                    </div>
                                </div>
                                <div class="has-background-light px-3 py-2 is-flex is-justify-content-flex-end" style="border-top: 1px solid var(--bulma-border); gap: 10px;">
                                    <button class="button is-small is-ghost has-text-info p-0 dash-btn-view" data-id="${evt.id || evt.Id}" data-type="${evt.isExam ? 'exam' : 'zh'}" style="text-decoration: none;">
                                        <span class="icon is-small"><i class="fa-solid fa-eye"></i></span>
                                        <span>Részletek</span>
                                    </button>
                                    <button class="button is-small is-ghost has-text-danger p-0 dash-btn-delete" data-id="${evt.id || evt.Id}" data-type="${evt.isExam ? 'exam' : 'zh'}" style="text-decoration: none;">
                                        <span class="icon is-small"><i class="fa-solid fa-trash-can"></i></span>
                                        <span>Törlés</span>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="dash-right">
                <div class="buttons mb-4 is-flex-direction-column">
                    <button class="button is-warning is-light is-fullwidth mb-2" id="dash-btn-add-zh">
                        <i class="fa-solid fa-pen mr-2"></i> Új ZH rögzítése
                    </button>
                    <button class="button is-danger is-light is-fullwidth m-0" id="dash-btn-add-exam">
                        <i class="fa-solid fa-graduation-cap mr-2"></i> Új Vizsga
                    </button>
                </div>
                
                <div class="box p-4 mb-4 has-background-info-light" style="border: none; box-shadow: none;">
                    <div class="is-flex is-justify-content-space-between mb-1">
                        <span class="is-size-7 has-text-weight-bold has-text-info-dark is-uppercase">Félév haladása</span>
                        <span class="is-size-7 has-text-weight-bold has-text-info-dark">${currentWeek}. Hét (${felevSzazalek}%)</span>
                    </div>
                    <progress class="progress is-info is-small mb-0" value="${felevSzazalek}" max="100">${felevSzazalek}%</progress>
                </div>

                <div class="box p-4 mb-4" style="border: 1px solid var(--bulma-border); box-shadow: none;">
                    <h3 class="title is-6 has-text-grey mb-3">Aktuális Félév</h3>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Vizsgás tárgyak:</span>
                        <span class="tag is-danger is-light has-text-weight-bold">${vizsgasTargyakSzama} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between">
                        <span class="has-text-weight-semibold">Kiírt ZH-k:</span>
                        <span class="tag is-warning is-light has-text-weight-bold">${aktualisZhkSzama} db</span>
                    </div>
                </div>

                <div class="box p-4" style="border: 1px dashed var(--bulma-border); box-shadow: none; background: transparent;">
                    <div id="sidebar-todo-widget">
                        <!-- Kezdeti töltő állapot, amíg a widget életre nem kel -->
                        <div class="has-text-centered py-3">
                            <span class="icon is-large has-text-grey-light mb-2"><i class="fa-solid fa-list-check fa-2x"></i></span>
                            <h3 class="title is-6 has-text-grey mb-1">Napi Teendők</h3>
                            <div class="loader is-loading mx-auto mt-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderSidebarTodosWidget();

    // ESEMÉNYKEZELŐK BEKÖTÉSE
    document.getElementById('dash-btn-add-zh')?.addEventListener('click', (e) => { e.preventDefault(); openAddZhModal(); });
    document.getElementById('dash-btn-add-exam')?.addEventListener('click', (e) => { e.preventDefault(); openAddExamModal(); });

    document.querySelectorAll('.dash-btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(e.currentTarget.dataset.id);
            if (e.currentTarget.dataset.type === 'zh') openViewZhModal(id);
            else openViewExamModal(id);
        });
    });

    document.querySelectorAll('.dash-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(e.currentTarget.dataset.id);
            if (e.currentTarget.dataset.type === 'zh') deleteZh(id);
            else deleteExam(id);
        });
    });
}