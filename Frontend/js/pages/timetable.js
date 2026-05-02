// js/pages/timetable.js
import { state } from '../state.js';
import { escapeHTML, apiFetch} from '../api.js';
import { calculateCurrentWeek, showToast} from '../ui.js';
import { openAddClassModal, openViewClassModal, deleteCustomClass } from '../class.js';
import { getAutoSemesterStart } from '../sync.js';
import { openViewZhModal, openAddZhModal} from '../zarthelyik.js';
import { openViewExamModal, openAddExamModal} from '../exams.js';

let displayWeek = null;

export async function renderTimetable(container) {
    if (displayWeek === null) displayWeek = calculateCurrentWeek() || 1;
    state.currentTimetableWeek = displayWeek;

    // Keresd meg és írd át ezeket a sorokat:
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
    const startHour = 0;  // 8 helyett 5 (Reggel 5:00)
    const endHour = 24;   // 20 helyett 23 (Este 11:00)
    const hourHeight = 60;

    const semesterStart = getAutoSemesterStart ? getAutoSemesterStart() : new Date();
    const weekStartObj = new Date(semesterStart.getFullYear(), semesterStart.getMonth(), semesterStart.getDate() + (displayWeek - 1) * 7);
    const weekEndObj = new Date(weekStartObj.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dateOpts = { month: '2-digit', day: '2-digit' };
    const fridayObj = new Date(weekStartObj.getTime() + 4 * 24 * 60 * 60 * 1000);

    // --- ESEMÉNYEK SZŰRÉSE ---
    const classes = (state.allTimetableEvents || []).filter(e => {
        if (e.isCustom) {
            if (e.frequency === 0) return e.scheduledWeek === displayWeek;
            if (e.frequency === 1) return true;
            if (e.frequency === 2) return Math.abs(displayWeek - (e.scheduledWeek || 1)) % 2 === 0;
        }
        return e.startObj >= weekStartObj && e.startObj < weekEndObj;
    }).map(e => ({ ...e, type: 'class' }));

    const zhs = (state.allZhs || []).filter(z => {
        const d = new Date(z.dateOf); return d >= weekStartObj && d < weekEndObj;
    }).map(z => ({ ...z, type: 'zh', dayOfWeekIndex: new Date(z.dateOf).getDay() === 0 ? 7 : new Date(z.dateOf).getDay(), startObj: new Date(z.dateOf), endObj: new Date(new Date(z.dateOf).getTime() + 90 * 60000), subject: z.subjectName || z.SubjectName, room: z.room || "-" }));

    const exams = (state.allExams || []).filter(ex => {
        const d = new Date(ex.dateOf); return d >= weekStartObj && d < weekEndObj;
    }).map(ex => ({ ...ex, type: 'exam', dayOfWeekIndex: new Date(ex.dateOf).getDay() === 0 ? 7 : new Date(ex.dateOf).getDay(), startObj: new Date(ex.dateOf), endObj: new Date(new Date(ex.dateOf).getTime() + 120 * 60000), subject: ex.subjectName || ex.SubjectName, room: ex.room || "-" }));

    const allEvents = [...classes, ...zhs, ...exams];
    const getTopOffset = (date) => (date.getHours() - startHour) * hourHeight + date.getMinutes();

    const gridLinesHtml = Array.from({length: endHour - startHour}, (_, i) => `
        <div style="position: absolute; top: ${(i * hourHeight) + 40}px; left: 0; right: 0; height: 1px; background-color: var(--bulma-border); opacity: 0.3; z-index: 5; pointer-events: none;"></div>
    `).join('');

    // --- HTML RENDERELÉS (DASHBOARD-VIEW ÉS HOVER ANIMÁCIÓK) ---
    container.innerHTML = `
        <style>
            .tt-event-card {
                transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease !important;
            }
            .tt-event-card:hover {
                filter: brightness(0.85); /* Enyhén sötétíti a kártyát, bármilyen színű is az */
                transform: scale(1.02);   /* Picit megnöveli a méretét */
                z-index: 25 !important;   /* Biztosítja, hogy a többi kártya és vonal fölé emelkedjen */
                box-shadow: 0 6px 12px rgba(0,0,0,0.2) !important; /* Megnövelt árnyék a 3D hatásért */
            }
        </style>

        <div class="dashboard-view" style="height: 100%; overflow: hidden; display: flex; user-select: none;">
            
            <div class="dash-center" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; flex: 1;">
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-4" style="flex-shrink: 0;">
                    <div>
                        <h2 class="title is-4 mb-1">Heti Órarend</h2>
                        <p class="has-text-grey is-size-7">${weekStartObj.toLocaleDateString('hu-HU', dateOpts)} - ${fridayObj.toLocaleDateString('hu-HU', dateOpts)}</p>
                    </div>
                    <div class="field has-addons">
                        <p class="control"><button class="button is-small" id="tt-prev-week"><i class="fa-solid fa-chevron-left"></i></button></p>
                        <p class="control"><span class="button is-small is-static has-text-weight-bold" style="min-width: 80px;">${displayWeek}. hét</span></p>
                        <p class="control"><button class="button is-small" id="tt-next-week"><i class="fa-solid fa-chevron-right"></i></button></p>
                    </div>
                </div>

                <div class="timetable-wrapper" style="position: relative; background: var(--bulma-background); border: 1px solid var(--bulma-border); border-radius: 8px; overflow: auto; flex-grow: 1; min-height: 0;">
                    <div style="display: grid; grid-template-columns: 60px repeat(5, 1fr); min-width: 700px; position: relative;" id="tt-grid">
                        <div id="tt-hover-line" style="position: absolute; height: 2px; background: #ef4444; pointer-events: none; display: none; z-index: 15; box-shadow: 0 0 8px rgba(239,68,68,0.6);">
                            <div id="tt-hover-time" style="position: absolute; left: 50%; top: -24px; background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: bold; transform: translateX(-50%); white-space: nowrap;">08:00</div>
                        </div>

                        <!-- ÚJ SMART MENÜ -->
                        <div id="tt-smart-menu" class="tt-smart-menu">
                            <button id="tt-btn-view" class="tt-menu-item" style="display: none;"><i class="fa-solid fa-eye" style="width: 16px; text-align: center;"></i> Megtekintés</button>
                            <button id="tt-btn-del" class="tt-menu-item has-text-danger" style="display: none;"><i class="fa-solid fa-trash-can" style="width: 16px; text-align: center;"></i> Törlés</button>
                            <button id="tt-btn-add" class="tt-menu-item"><i class="fa-solid fa-plus" style="width: 16px; text-align: center;"></i> Új esemény</button>

                            <!-- Animált Almenü a 3 opcióval -->
                            <div id="tt-submenu" class="tt-submenu-wrapper">
                                <div class="tt-submenu-track">
                                    <div class="tt-sub-items-container">
                                        <button class="tt-sub-item has-text-warning" id="tt-btn-type-zh">ZH</button>
                                        <button class="tt-sub-item has-text-danger" id="tt-btn-type-exam">Vizsga</button>
                                        <button class="tt-sub-item has-text-info" id="tt-btn-type-class">Esemény</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="background: var(--bulma-background-light); border-right: 1px solid var(--bulma-border);">
                            <div style="height: 40px; border-bottom: 1px solid var(--bulma-border); position: sticky; top: 0; z-index: 20; background-color: var(--bulma-scheme-main, #ffffff);"></div>
                            ${Array.from({length: endHour - startHour}, (_, i) => `
                                <div style="height: ${hourHeight}px; border-bottom: 1px dashed var(--bulma-border); font-size: 0.75rem; color: gray; text-align: center; padding-top: 5px;">
                                    ${String(startHour + i).padStart(2, '0')}:00
                                </div>
                            `).join('')}
                        </div>

                        ${days.map((day, dIdx) => {
                            const dayNum = dIdx + 1;
                            const currentDayObj = new Date(weekStartObj.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
                            const dayDateStr = currentDayObj.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' });

                            return `
                            <div id="day-col-${dayNum}" class="tt-day-column" data-day="${dayNum}" style="position: relative; border-right: 1px solid var(--bulma-border);">
                                <div class="has-text-centered py-2" style="height: 40px; border-bottom: 2px solid var(--bulma-border); background-color: var(--bulma-scheme-main, #ffffff); position: sticky; top: 0; z-index: 20;">
                                    <div class="has-text-weight-bold is-size-7" style="line-height: 1.2;">${day}</div>
                                    <div class="has-text-grey is-size-7" style="font-size: 0.65rem !important;">${dayDateStr}</div>
                                </div>
                                
                                ${gridLinesHtml}
                                ${allEvents.filter(e => (e.dayOfWeekIndex || e.DayOfWeek) === dayNum).map(e => {
                                    const top = getTopOffset(e.startObj);
                                    const height = getTopOffset(e.endObj) - top;
                                    
                                    let colorClass = "";
                                    let inlineStyle = "";
                                    let textColor = "white"; // Alapértelmezett
                                    
                                    if (e.type === 'zh') colorClass = "is-warning";
                                    else if (e.type === 'exam') colorClass = "is-danger";
                                    else {
                                        if (e.color && e.color !== "#000000" && e.color !== "") {
                                            // OKOS SZÖVEGSZÍN KALKULÁTOR
                                            const hex = e.color.replace('#', '');
                                            const r = parseInt(hex.substr(0, 2), 16) || 0;
                                            const g = parseInt(hex.substr(2, 2), 16) || 0;
                                            const b = parseInt(hex.substr(4, 2), 16) || 0;
                                            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                                            
                                            // Ha a háttér világos (yiq >= 128), a szöveg legyen sötétszürke/fekete
                                            textColor = (yiq >= 128) ? '#1a1a1a' : '#ffffff';
                                            
                                            inlineStyle = `background-color: ${e.color} !important; color: ${textColor} !important; border: 1px solid rgba(0,0,0,0.3) !important;`;
                                        } else {
                                            colorClass = "is-info";
                                        }
                                    }

                                    // BADGE-EK ÖSSZEGYŰJTÉSE EGY KÖZÖS TARTÁLYBA
                                    let badgesHtml = '';
                                    if (e.importance === 1) badgesHtml += `<i class="fa-solid fa-triangle-exclamation" style="color: #fcd34d; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); background-color: white; border-radius: 15px; padding: 5px; text-align: center;" title="Fontos"></i>`;
                                    if (e.importance === 2) badgesHtml += `<i class="fa-solid fa-skull-crossbones" style="color: #fca5a5; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); background-color: white; border-radius: 15px; padding: 5px; text-align: center;" title="Kritikus"></i>`;
                                    if (e.notes && e.notes.trim() !== "") badgesHtml += `<i class="fa-regular fa-comment-dots" title="Van megjegyzés"></i>`;
                                    
                                    const tooltipText = `${e.subject}\nTerem: ${e.room || '-'}\n${e.notes ? 'Megjegyzés: ' + e.notes : ''}`;
                                    const borderStyle = e.isCustom ? `border-left: 4px solid ${textColor === '#ffffff' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)'};` : "border: 1px solid rgba(0,0,0,0.1);";

                                    return `
                                        <div class="notification ${colorClass} mb-0 tt-event-card" 
                                             data-id="${e.id}" data-type="${e.type}" data-iscustom="${e.isCustom || false}"
                                             title="${escapeHTML(tooltipText)}"
                                             style="position: absolute; top: ${top + 40}px; left: 4px; right: 4px; height: ${height - 2}px; overflow: hidden; z-index: 10; cursor: pointer; ${borderStyle} border-radius: 4px; line-height: 1.15; box-shadow: 0 2px 4px rgba(0,0,0,0.15); ${inlineStyle} padding: 4px 6px;">
                                            
                                            <!-- TÖRDELHETŐ SZÖVEG 13 PIXELEN -->
                                            <div style="font-size: 14px; word-break: break-word; color: inherit; height: 100%; overflow: hidden;">
                                                <p class="has-text-weight-bold is-marginless" style="color: inherit; white-space: normal;">
                                                    ${escapeHTML(e.subject)}
                                                </p>
                                                <p class="is-marginless" style="color: inherit; opacity: 0.85; font-size: 12px; margin-top: 4px;">
                                                    ${escapeHTML(e.room || '-')}
                                                </p>
                                            </div>
                                            
                                            <!-- BADGE-EK JOBB ALSÓ SAROKBAN -->
                                            ${badgesHtml ? `
                                            <div class="event-badges" style="position: absolute; bottom: 4px; right: 5px; display: flex; gap: 5px; color: inherit; font-size: 13px;">
                                                ${badgesHtml}
                                            </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="dash-right" style="height: 100%; overflow-y: auto; padding-bottom: 20px;">
                <div class="buttons mb-4">
                    <button class="button is-link is-light is-fullwidth" id="dash-tt-add-btn">
                        <i class="fa-solid fa-plus mr-2"></i> Új esemény
                    </button>
                </div>

                <div class="box p-4 mb-4" style="border: 1px solid var(--bulma-border); box-shadow: none;">
                    <h3 class="title is-6 has-text-grey mb-3">Heti Statisztika</h3>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Tanórák:</span>
                        <span class="tag is-info is-light has-text-weight-bold">${classes.length} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Zárthelyik (ZH):</span>
                        <span class="tag is-warning is-light has-text-weight-bold">${zhs.length} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between">
                        <span class="has-text-weight-semibold">Vizsgák:</span>
                        <span class="tag is-danger is-light has-text-weight-bold">${exams.length} db</span>
                    </div>
                </div>

                <div class="box p-4" style="border: 1px dashed var(--bulma-border); box-shadow: none; background: transparent;">
                    <div class="has-text-centered py-3">
                        <span class="icon is-large has-text-grey-light mb-2"><i class="fa-solid fa-list-check fa-2x"></i></span>
                        <h3 class="title is-6 has-text-grey mb-1">Napi Teendők</h3>
                        <p class="is-size-7 has-text-grey">Hamarosan érkezik...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const wrapper = container.querySelector('.timetable-wrapper');
    if (wrapper) {
        // Kiszámolja a 7:00 pontos pixel-pozícióját és legörget oda
        wrapper.scrollTop = (7 - startHour) * hourHeight; 
    }

    // --- INTERAKTÍV LOGIKA ---
    const grid = document.getElementById('tt-grid');
    const line = document.getElementById('tt-hover-line');
    const timeLabel = document.getElementById('tt-hover-time');
    
    // Új elemek
    const smartMenu = document.getElementById('tt-smart-menu');
    const submenu = document.getElementById('tt-submenu');
    const btnAdd = document.getElementById('tt-btn-add');
    const btnView = document.getElementById('tt-btn-view');
    const btnDel = document.getElementById('tt-btn-del');

    let isFrozen = false;
    let currentSnappedMinutes = 0;
    let currentDay = 1;

    // A bezáró logika (Fade-out)
    const closeMenu = () => {
        isFrozen = false;
        smartMenu.classList.remove('is-active');
        submenu.classList.remove('is-open', 'is-expanded');
        line.style.display = 'none';
    };

    grid.addEventListener('mousemove', (e) => {
        if (isFrozen) return;
        const rect = grid.getBoundingClientRect();
        const y = e.clientY - rect.top - 40;
        const x = e.clientX - rect.left;
        if (y < 0 || y > (endHour - startHour) * hourHeight || x < 60) { line.style.display = 'none'; return; }

        currentDay = Math.floor((x - 60) / ((rect.width - 60) / 5)) + 1;
        if (currentDay < 1 || currentDay > 5) return;
        currentSnappedMinutes = Math.round(y / 5) * 5;

        const dayCol = document.getElementById(`day-col-${currentDay}`);
        if (dayCol) {
            line.style.left = dayCol.offsetLeft + 'px';
            line.style.width = dayCol.offsetWidth + 'px';
            line.style.top = (currentSnappedMinutes + 40) + 'px';
            line.style.display = 'block';
            timeLabel.textContent = `${String(Math.floor(currentSnappedMinutes / 60) + startHour).padStart(2, '0')}:${String(currentSnappedMinutes % 60).padStart(2, '0')}`;
        }
    });

    grid.addEventListener('click', (e) => {
        if (e.target.closest('#tt-smart-menu')) return;

        if (isFrozen) {
            closeMenu(); // Fade out
        } else if (line.style.display === 'block') {
            isFrozen = true;
            smartMenu.classList.add('is-active');
            submenu.classList.remove('is-open', 'is-expanded'); 
            
            const card = e.target.closest('.tt-event-card');
            if (card) {
                const id = card.dataset.id;
                const type = card.dataset.type;
                btnView.dataset.id = id; btnView.dataset.type = type;
                btnView.style.display = 'flex';

                if (card.dataset.iscustom === 'true' || type === 'zh' || type === 'exam') {
                    btnDel.dataset.id = id; btnDel.dataset.type = type;
                    btnDel.style.display = 'flex';
                } else {
                    btnDel.style.display = 'none';
                }
            } else {
                btnView.style.display = 'none';
                btnDel.style.display = 'none';
            }

            const dayCol = document.getElementById(`day-col-${currentDay}`);
            smartMenu.style.left = (dayCol.offsetLeft + dayCol.offsetWidth / 2 - 85) + 'px'; 
            smartMenu.style.top = (currentSnappedMinutes + 40) + 'px'; 

            if (currentDay > 4) { //Péntek (5) esetén balra nyílik
                submenu.classList.add('is-left-side');
            } else {
                submenu.classList.remove('is-left-side');
            }

            // JAVÍTÁS: Görgetéshez (viewport) viszonyított okos pozicionálás
            const wrapper = document.querySelector('.timetable-wrapper');
            const visibleY = (currentSnappedMinutes + 40) - wrapper.scrollTop;

            if (wrapper.clientHeight - visibleY < 180) {
                smartMenu.style.transform = 'translateY(-110%) scale(1)'; // Lent vagyunk -> Felfelé nyílik
            } else if (visibleY < 100) {
                smartMenu.style.transform = 'translateY(5px) scale(1)'; // Fent vagyunk -> Lefelé nyílik
            } else {
                smartMenu.style.transform = 'translateY(-50%) scale(1)'; // Középre
            }
            
            // INNEN TÖRÖLVE LETT A RÉGI KÓD!
        }
    });

    // 1. Gomb: "Új esemény" -> Animáció indítása
    btnAdd.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        // Elmentjük a Dátumot a memóriába
        const h = Math.floor(currentSnappedMinutes / 60) + startHour;
        const currentDayObj = new Date(weekStartObj.getTime() + (currentDay - 1) * 24 * 60 * 60 * 1000);
        const timeStr = `${String(h).padStart(2, '0')}:${String(currentSnappedMinutes % 60).padStart(2, '0')}`;
        
        window.tempEventData = {
            day: currentDay, timeStr: timeStr,
            dateTimeStr: `${currentDayObj.toLocaleDateString('sv-SE')}T${timeStr}`,
            endH: Math.floor((currentSnappedMinutes + 90) / 60) + startHour,
            endM: (currentSnappedMinutes + 90) % 60
        };

        const wrapper = document.querySelector('.timetable-wrapper');
        const visibleY = (currentSnappedMinutes + 40) - wrapper.scrollTop;
        
        submenu.classList.remove('is-up', 'is-down');
        
        // CSAK AZ ÚJ, GÖRGETÉS ALAPÚ LOGIKA MARADT:
        if (wrapper.clientHeight - visibleY < 45) {
            submenu.classList.add('is-up');   // A doboz alján kattintottunk -> Felfelé nyíljon
        } else if (visibleY < 100) {
            submenu.classList.add('is-down'); // A doboz tetején kattintottunk -> Lefelé nyíljon
        }
        
        // INNEN TÖRÖLVE LETT A RÉGI KÓD!
        
        // Kicsúszik jobbra/balra
        submenu.classList.add('is-open');
        // Kinyílik fel és le 200ms múlva
        setTimeout(() => submenu.classList.add('is-expanded'), 200);
    });

    // --- ALMENÜ GOMBOK BEKÖTÉSE ---
    document.getElementById('tt-btn-type-zh').addEventListener('click', (e) => {
        e.stopPropagation(); 
        closeMenu(); 
        
        // Közvetlenül meghívjuk az importált függvényt! 
        // (Ez rátesszi az is-active-ot ÉS feltölti a dropdown-t)
        openAddZhModal();

        // Dátum betöltése
        setTimeout(() => { 
            if(window.tempEventData) document.getElementById('add-zh-dateof').value = window.tempEventData.dateTimeStr; 
        }, 50);
    });

    document.getElementById('tt-btn-type-exam').addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu(); 
        
        openAddExamModal();

        setTimeout(() => { 
            if(window.tempEventData) document.getElementById('add-exam-dateof').value = window.tempEventData.dateTimeStr; 
        }, 50);
    });
    
    document.getElementById('tt-btn-type-class').addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu(); 
        
        openAddClassModal();

        setTimeout(() => {
            if (!window.tempEventData) return;
            document.getElementById('add-class-day').value = window.tempEventData.day;
            document.getElementById('add-class-start').value = window.tempEventData.timeStr;
            document.getElementById('add-class-end').value = `${String(window.tempEventData.endH).padStart(2, '0')}:${String(window.tempEventData.endM).padStart(2, '0')}`;
        }, 50);
    });

    // Megtekintés / Törlés gombok maradtak
    btnView.addEventListener('click', (e) => {
        e.stopPropagation(); closeMenu();
        const id = btnView.dataset.id; const type = btnView.dataset.type;
        if (type === 'zh') openViewZhModal(parseInt(id));
        else if (type === 'exam') openViewExamModal(parseInt(id));
        else openViewClassModal(id);
    });

    btnDel.addEventListener('click', async (e) => {
        e.stopPropagation(); closeMenu();
        const id = btnDel.dataset.id; const type = btnDel.dataset.type;
        if (type === 'zh' && confirm("Biztosan törlöd ezt a Zárthelyit?")) {
            const res = await apiFetch(`/zarthelyik/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast("ZH törölve!", "is-success"); if (window.refreshSPA) window.refreshSPA(); }
        } else if (type === 'exam' && confirm("Biztosan törlöd ezt a Vizsgát?")) {
            const res = await apiFetch(`/exams/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast("Vizsga törölve!", "is-success"); if (window.refreshSPA) window.refreshSPA(); }
        } else { deleteCustomClass(id); }
        renderTimetable(container);
    });

    document.getElementById('dash-tt-add-btn')?.addEventListener('click', () => openAddClassModal());
    document.getElementById('tt-prev-week')?.addEventListener('click', () => { displayWeek--; renderTimetable(container); });
    document.getElementById('tt-next-week')?.addEventListener('click', () => { displayWeek++; renderTimetable(container); });
}

const classToggleTabs = document.querySelectorAll('#add-class-type-toggle li');
const dropdownContainer = document.getElementById('add-class-subject-container');
const customContainer = document.getElementById('add-class-custom-container');

classToggleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Leveszi az is-active osztályt az összesről
        classToggleTabs.forEach(t => t.classList.remove('is-active'));
        // Rátrakja arra, amire kattintottál
        tab.classList.add('is-active');

        // Megjeleníti / Elrejti a megfelelő beviteli mezőt
        if (tab.dataset.type === 'subject') {
            dropdownContainer.classList.remove('is-hidden');
            customContainer.classList.add('is-hidden');
        } else {
            dropdownContainer.classList.add('is-hidden');
            customContainer.classList.remove('is-hidden');
        }
    });
});

// 2. Be kell tölteni a tárgyakat a dropdownba (Ha eddig ez a függvényed megvolt a ZH-nál, akkor csak fel kell használnod)
function populateAddClassSubjectDropdown() {
    const dropdown = document.getElementById('add-class-subject-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    // state.subjects tartalmazza a tárgyakat
    if (window.state && window.state.subjects) {
        window.state.subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name; // Vagy sub.Name
            opt.textContent = sub.name;
            dropdown.appendChild(opt);
        });
    }
}

// Ezt hívd meg akkor, amikor kinyitod a modált:
// populateAddClassSubjectDropdown();

// 3. (A mentés gomb módosítása) - MENTÉSKOR MELYIK ÉRTÉKET OLVASSA KI?
// Amikor elmented az új eseményt a "add-class-submit-btn"-re kattintva, csekkold, hogy melyik fül aktív:
/* 
    let finalSubjectName = "";
    const isCustom = document.querySelector('#add-class-type-toggle li[data-type="custom"]').classList.contains('is-active');
    
    if (isCustom) {
        finalSubjectName = document.getElementById('add-class-subject').value;
    } else {
        finalSubjectName = document.getElementById('add-class-subject-dropdown').value;
    }
    
    // Ugye most már a Színt és a Fontosságot is le tudod menteni:
    const classColor = document.getElementById('add-class-color').value;
    const classImportance = parseInt(document.getElementById('add-class-importance').value);
*/

// Mégse gomb bekötése az aljára is:
document.getElementById('add-class-cancel-btn-bottom')?.addEventListener('click', () => {
    document.getElementById('add-class-modal').classList.remove('is-active');
});