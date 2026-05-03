// js/pages/timetable.js
import { state } from '../core/state.js';
import { escapeHTML, apiFetch} from '../core/api.js';
import { calculateCurrentWeek, showToast} from '../core/ui.js';
import { openAddClassModal, openViewClassModal, deleteCustomClass } from '../services/classService.js';
import { getAutoSemesterStart } from '../services/syncService.js';
import { openViewZhModal, openAddZhModal} from '../services/zarthelyiService.js';
import { openViewExamModal, openAddExamModal} from '../services/examService.js';

let displayWeek = null;

export async function renderTimetable(container) {
    if (displayWeek === null) displayWeek = calculateCurrentWeek() || 1;
    state.currentTimetableWeek = displayWeek;

    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
    const startHour = 0; 
    const endHour = 24;  
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
        <div class="tt-grid-line" style="top: ${(i * hourHeight) + 40}px;"></div>
    `).join('');

    container.innerHTML = `
        <div class="dashboard-view timetable-page-layout" style="height: 100%; overflow: hidden; display: flex; user-select: none;">
            
            <!-- MOBIL CÍM (Csak mobilon látszik, legfelül) -->
            <div class="tt-mobile-header is-hidden-tablet px-4 pt-4">
                <h2 class="title is-4 mb-1">Heti Órarend</h2>
                <p class="has-text-grey is-size-7">${weekStartObj.toLocaleDateString('hu-HU', dateOpts)} - ${fridayObj.toLocaleDateString('hu-HU', dateOpts)}</p>
            </div>

            <!-- BAL / KÖZÉPSŐ OSZLOP: ÓRAREND -->
            <div class="dash-center" style="display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; flex: 1;">
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-4 tt-header-row" style="flex-shrink: 0;">
                    <!-- ASZTALI CÍM (Mobilon elrejtve) -->
                    <div class="is-hidden-mobile">
                        <h2 class="title is-4 mb-1">Heti Órarend</h2>
                        <p class="has-text-grey is-size-7">${weekStartObj.toLocaleDateString('hu-HU', dateOpts)} - ${fridayObj.toLocaleDateString('hu-HU', dateOpts)}</p>
                    </div>
                    
                    <!-- HÉT LÉPTETŐ -->
                    <div class="field has-addons tt-week-nav">
                        <p class="control"><button class="button is-small" id="tt-prev-week"><i class="fa-solid fa-chevron-left"></i></button></p>
                        <p class="control is-expanded"><span class="button is-small is-static has-text-weight-bold is-fullwidth">${displayWeek}. hét</span></p>
                        <p class="control"><button class="button is-small" id="tt-next-week"><i class="fa-solid fa-chevron-right"></i></button></p>
                    </div>
                </div>
                
                <div class="tt-scrollable-area timetable-wrapper">
                    <div class="tt-grid-container" id="tt-grid">
                        
                        <div id="tt-hover-line" class="tt-hover-line">
                            <div id="tt-hover-time" class="tt-hover-time-label">08:00</div>
                        </div>

                        <!-- ÚJ SMART MENÜ -->
                        <div id="tt-smart-menu" class="tt-smart-menu">
                            <button id="tt-btn-view" class="tt-menu-item" style="display: none;"><i class="fa-solid fa-eye" style="width: 16px; text-align: center;"></i> Megtekintés</button>
                            <button id="tt-btn-del" class="tt-menu-item has-text-danger" style="display: none;"><i class="fa-solid fa-trash-can" style="width: 16px; text-align: center;"></i> Törlés</button>
                            <button id="tt-btn-add" class="tt-menu-item"><i class="fa-solid fa-plus" style="width: 16px; text-align: center;"></i> Új esemény</button>

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

                        <!-- IDŐVONAL OSZLOP -->
                        <div class="tt-time-column">
                            <div class="tt-col-header-empty"></div>
                            ${Array.from({length: endHour - startHour}, (_, i) => `
                                <div class="tt-time-slot" style="height: ${hourHeight}px;">
                                    ${String(startHour + i).padStart(2, '0')}:00
                                </div>
                            `).join('')}
                        </div>

                        <!-- NAPOK OSZLOPAI -->
                        ${days.map((day, dIdx) => {
                            const dayNum = dIdx + 1;
                            const currentDayObj = new Date(weekStartObj.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
                            const dayDateStr = currentDayObj.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' });

                            return `
                            <div id="day-col-${dayNum}" class="tt-day-column" data-day="${dayNum}">
                                <div class="has-text-centered py-2 tt-day-header">
                                    <div class="has-text-weight-bold is-size-7 tt-day-title">${day}</div>
                                    <div class="has-text-grey is-size-7 tt-day-subtitle">${dayDateStr}</div>
                                </div>
                                
                                ${gridLinesHtml}
                                
                                <!-- ESEMÉNYEK EBBEN A NAPBAN -->
                                ${allEvents.filter(e => (e.dayOfWeekIndex || e.DayOfWeek) === dayNum).map(e => {
                                    const top = getTopOffset(e.startObj);
                                    const height = getTopOffset(e.endObj) - top;
                                    
                                    let colorClass = "";
                                    let inlineStyle = "";
                                    let textColor = "white"; 
                                    
                                    if (e.type === 'zh') colorClass = "is-warning";
                                    else if (e.type === 'exam') colorClass = "is-danger";
                                    else {
                                        if (e.color && e.color !== "#000000" && e.color !== "") {
                                            const hex = e.color.replace('#', '');
                                            const r = parseInt(hex.substr(0, 2), 16) || 0;
                                            const g = parseInt(hex.substr(2, 2), 16) || 0;
                                            const b = parseInt(hex.substr(4, 2), 16) || 0;
                                            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                                            
                                            textColor = (yiq >= 128) ? '#1a1a1a' : '#ffffff';
                                            inlineStyle = `background-color: ${e.color} !important; color: ${textColor} !important; border: 1px solid rgba(0,0,0,0.3) !important;`;
                                        } else {
                                            colorClass = "is-info";
                                        }
                                    }

                                    let badgesHtml = '';
                                    if (e.importance === 1) badgesHtml += `<i class="fa-solid fa-triangle-exclamation tt-badge-icon tt-badge-warning" title="Fontos"></i>`;
                                    if (e.importance === 2) badgesHtml += `<i class="fa-solid fa-skull-crossbones tt-badge-icon tt-badge-critical" title="Kritikus"></i>`;
                                    if (e.notes && e.notes.trim() !== "") badgesHtml += `<i class="fa-regular fa-comment-dots" title="Van megjegyzés"></i>`;
                                    
                                    const tooltipText = `${e.subject}\nTerem: ${e.room || '-'}\n${e.notes ? 'Megjegyzés: ' + e.notes : ''}`;
                                    const borderStyle = e.isCustom ? `border-left: 4px solid ${textColor === '#ffffff' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)'} !important;` : "border: 1px solid rgba(0,0,0,0.1) !important;";

                                    return `
                                        <div class="notification ${colorClass} mb-0 tt-event-card" 
                                             data-id="${e.id || e.Id}" data-type="${e.type}" data-iscustom="${e.isCustom || false}"
                                             title="${escapeHTML(tooltipText)}"
                                             style="top: ${top + 40}px; height: ${height - 2}px; ${borderStyle} ${inlineStyle}">
                                            
                                            <div class="tt-event-content">
                                                <p class="has-text-weight-bold is-marginless tt-event-title">
                                                    ${escapeHTML(e.subject)}
                                                </p>
                                                <p class="is-marginless tt-event-room">
                                                    ${escapeHTML(e.room || '-')}
                                                </p>
                                            </div>
                                            
                                            ${badgesHtml ? `
                                            <div class="tt-event-badges">
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

            <!-- JOBB OSZLOP: STATISZTIKA -->
            <div class="dash-right" style="height: 100%; overflow-y: auto; padding-bottom: 20px;">
                <div class="buttons mb-4">
                    <button class="button is-link is-light is-fullwidth" id="dash-tt-add-btn">
                        <i class="fa-solid fa-plus mr-2"></i> Új esemény
                    </button>
                </div>

                <div class="box p-4 mb-4 tt-stat-box">
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

                <div class="box p-4 tt-dashed-box">
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
        // --- 1. JAVÍTÁS: MOBILON 7:30-RA UGRÁS ---
        setTimeout(() => {
            const isMobile = window.innerWidth <= 768;

            // Kifejezetten 7.5 (7:30) beállítása mobilon, ahogy kérted
            let targetHour = isMobile ? 7.5 : 8.0; 

            // Csak akkor megyünk feljebb 7:30-nál, ha extrém korai óra van (pl. 6:00)
            if (allEvents.length > 0) {
                const minHour = Math.min(...allEvents.map(e => e.startObj.getHours() + (e.startObj.getMinutes() / 60)));
                if (minHour < targetHour) {
                    targetHour = Math.max(startHour, minHour - 0.5); 
                }
            }

            const scrollPosition = ((targetHour - startHour) * hourHeight) - 20; 

            // Natív, azonnali ugrás
            wrapper.scrollTo({ top: scrollPosition > 0 ? scrollPosition : 0, behavior: 'instant' });
        }, 300);
    }

    // --- INTERAKTÍV LOGIKA ---
    const grid = document.getElementById('tt-grid');
    const line = document.getElementById('tt-hover-line');
    const timeLabel = document.getElementById('tt-hover-time');
    
    const smartMenu = document.getElementById('tt-smart-menu');
    const submenu = document.getElementById('tt-submenu');
    const btnAdd = document.getElementById('tt-btn-add');
    const btnView = document.getElementById('tt-btn-view');
    const btnDel = document.getElementById('tt-btn-del');

    let isFrozen = false;
    let currentSnappedMinutes = 0;
    let currentDay = 1;

    const closeMenu = () => {
        isFrozen = false;
        smartMenu.classList.remove('is-active');
        submenu.classList.remove('is-open', 'is-expanded');
        line.style.display = 'none';
    };

    // --- 2. JAVÍTÁS: GÖRGETÉSRE ELTŰNIK A MENÜ ---
    if (wrapper) {
        // Asztali görgetés
        wrapper.addEventListener('scroll', () => {
            if (isFrozen) closeMenu();
        }, { passive: true });
        
        // Mobilos képernyő-húzás (nagyon reszponzív)
        wrapper.addEventListener('touchmove', () => {
            if (isFrozen) closeMenu();
        }, { passive: true });
    }

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
            closeMenu();
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

            // --- SMART MENÜ POZICIONÁLÁSA JAVÍTVA ---
            const dayCol = document.getElementById(`day-col-${currentDay}`);
            
            let menuTop = currentSnappedMinutes + 40;
            smartMenu.style.top = menuTop + 'px'; 

            let menuLeft = dayCol.offsetLeft + (dayCol.offsetWidth / 2) - 85;
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                const minLeft = wrapper.scrollLeft + 10;
                const maxLeft = wrapper.scrollLeft + wrapper.clientWidth - 180;
                smartMenu.style.left = Math.max(minLeft, Math.min(menuLeft, maxLeft)) + 'px';
            } else {
                smartMenu.style.left = menuLeft + 'px';
            }

            const visibleY = menuTop - wrapper.scrollTop;

            if (wrapper.clientHeight - visibleY < 250) {
                // smartMenu.style.transform = 'translateY(-100%)'; <- TÖRÖLVE!
                submenu.classList.add('is-up');
                submenu.classList.remove('is-down');
            } else {
                // smartMenu.style.transform = 'translateY(0)'; <- TÖRÖLVE!
                submenu.classList.add('is-down');
                submenu.classList.remove('is-up');
            }

            // Asztali balra húzás
            if (!isMobile) {
                if (currentDay > 4) submenu.classList.add('is-left-side');
                else submenu.classList.remove('is-left-side');
            }
        }
    });

    btnAdd.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        const h = Math.floor(currentSnappedMinutes / 60) + startHour;
        const currentDayObj = new Date(weekStartObj.getTime() + (currentDay - 1) * 24 * 60 * 60 * 1000);
        const timeStr = `${String(h).padStart(2, '0')}:${String(currentSnappedMinutes % 60).padStart(2, '0')}`;
        
        window.tempEventData = {
            day: currentDay, timeStr: timeStr,
            dateTimeStr: `${currentDayObj.toLocaleDateString('sv-SE')}T${timeStr}`,
            endH: Math.floor((currentSnappedMinutes + 90) / 60) + startHour,
            endM: (currentSnappedMinutes + 90) % 60
        };

        const visibleY = (currentSnappedMinutes + 40) - wrapper.scrollTop;
        submenu.classList.remove('is-up', 'is-down');
        
        if (wrapper.clientHeight - visibleY < 250) {
            submenu.classList.add('is-up');   
        } else {
            submenu.classList.add('is-down'); 
        }
        
        submenu.classList.add('is-open');
        // MOBILON ne legyen késleltetett nyitás (az is-expanded hozza be az animációt asztalon)
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            setTimeout(() => submenu.classList.add('is-expanded'), 200);
        } else {
            submenu.classList.add('is-expanded'); // Mobilon azonnal megkapja
        }
    });

    document.getElementById('tt-btn-type-zh').addEventListener('click', (e) => {
        e.stopPropagation(); closeMenu(); 
        openAddZhModal();
        setTimeout(() => { 
            if(window.tempEventData) document.getElementById('add-zh-dateof').value = window.tempEventData.dateTimeStr; 
        }, 50);
    });

    document.getElementById('tt-btn-type-exam').addEventListener('click', (e) => {
        e.stopPropagation(); closeMenu(); 
        openAddExamModal();
        setTimeout(() => { 
            if(window.tempEventData) document.getElementById('add-exam-dateof').value = window.tempEventData.dateTimeStr; 
        }, 50);
    });
    
    document.getElementById('tt-btn-type-class').addEventListener('click', (e) => {
        e.stopPropagation(); closeMenu(); 
        openAddClassModal();
        setTimeout(() => {
            if (!window.tempEventData) return;
            document.getElementById('add-class-day').value = window.tempEventData.day;
            document.getElementById('add-class-start').value = window.tempEventData.timeStr;
            document.getElementById('add-class-end').value = `${String(window.tempEventData.endH).padStart(2, '0')}:${String(window.tempEventData.endM).padStart(2, '0')}`;
        }, 50);
    });

    btnView.addEventListener('click', (e) => {
        e.stopPropagation(); closeMenu();
        const id = btnView.dataset.id; const type = btnView.dataset.type;
        if (type === 'zh') openViewZhModal(parseInt(id));
        else if (type === 'exam') openViewExamModal(parseInt(id));
        else openViewClassModal(id);
    });

    btnDel.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        closeMenu();
        const id = parseInt(btnDel.dataset.id); 
        const type = btnDel.dataset.type;
        
        if (type === 'zh' && confirm("Biztosan törlöd ezt a Zárthelyit?")) {
            const res = await apiFetch(`/zarthelyik/${id}`, { method: 'DELETE' });
            if (res.ok) { 
                showToast("ZH törölve!", "is-success"); 
                state.allZhs = (state.allZhs || []).filter(z => z.id !== id && z.Id !== id); 
                if (window.refreshSPA) window.refreshSPA();
                renderTimetable(container); 
            }
        } else if (type === 'exam' && confirm("Biztosan törlöd ezt a Vizsgát?")) {
            const res = await apiFetch(`/exams/${id}`, { method: 'DELETE' });
            if (res.ok) { 
                showToast("Vizsga törölve!", "is-success"); 
                state.allExams = (state.allExams || []).filter(ex => ex.id !== id && ex.Id !== id);
                if (window.refreshSPA) window.refreshSPA();
                renderTimetable(container); 
            }
        } else { 
            deleteCustomClass(id); 
            setTimeout(() => renderTimetable(container), 200);
        }
    });

    document.getElementById('dash-tt-add-btn')?.addEventListener('click', () => openAddClassModal());
    document.getElementById('tt-prev-week')?.addEventListener('click', () => { displayWeek--; renderTimetable(container); });
    document.getElementById('tt-next-week')?.addEventListener('click', () => { displayWeek++; renderTimetable(container); });
}