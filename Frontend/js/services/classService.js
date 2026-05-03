// js/class.js
import { state } from "../core/state.js";
import { logout, escapeHTML, apiFetch } from "../core/api.js";
import { fetchSubjects, openAddSubjectModal, openEditSubjectModal, openViewSubjectModal, closeViewSubjectModal, closeAddSubjectModal, submitSubject, saveEditedSubject, deleteSubject } from "./subjectService.js";
import { openImportModal, closeImportModal, closeSyncProgressModal, startNeptunSync, handleIcsUpload, parseIcsToObjects, processAndUploadIcs, getWeekBoundaries, getCurrentSemesterString, getSemesterFromDate, initThemeToggle, toggleTheme, getAutoSemesterStart, openMissingLinkModal, closeMissingLinkModal, goToSettingsFromMissingLink, initAutoWeekCalculation } from "./syncService.js";
import { showToast, updateDashboardStats, calculateCurrentWeek, updateCurrentWeekBox, changeDisplayedWeek, renderWeeklyCalendar, updateCharCount } from "../core/ui.js";
import { fetchZhs, openViewZhModal, closeViewZhModal, openAddZhModal, closeAddZhModal, openEditZhModal, calculateZhWeek, submitZh, deleteZh} from "./zarthelyiService.js";

// --- ÓRA (ESEMÉNY) MEGTEKINTÉSE ---
export function openViewClassModal(id) {
    // Stringgé alakítjuk mindkét oldalt a biztos egyezés érdekében!
    const cls = state.allTimetableEvents.find(c => String(c.id || c.Id) === String(id));
    
    if (!cls) {
        console.warn("Nem található az óra ID alapján:", id);
        return;
    }

    // Eltároljuk a state-ben, hogy mentésnél/törlésnél tudjuk mit piszkálunk
    state.currentlySelectedClass = cls;

    // 1. Cím és alap adatok betöltése
    document.getElementById('detail-class-title').textContent = cls.subject || cls.Subject || "Ismeretlen óra";
    document.getElementById('detail-class-room').textContent = cls.room || cls.Room || "Nincs megadva terem";
    document.getElementById('detail-class-type').textContent = cls.type || cls.Type || "Tanóra";
    document.getElementById('detail-class-notes').value = cls.notes || cls.Notes || "";

    // 2. Dátum és Időpont formázása
    const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const dayIndex = cls.dayOfWeekIndex || cls.DayOfWeek || 1;
    const dayName = days[dayIndex];
    
    let startStr = "??:??";
    let endStr = "??:??";
    
    // Ha már Date objektummá van alakítva
    if (cls.startObj instanceof Date && !isNaN(cls.startObj)) {
        startStr = `${String(cls.startObj.getHours()).padStart(2, '0')}:${String(cls.startObj.getMinutes()).padStart(2, '0')}`;
    } else if (cls.start) { // Vagy ha nyers string
        const d = new Date(cls.start);
        if(!isNaN(d)) startStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    
    if (cls.endObj instanceof Date && !isNaN(cls.endObj)) {
        endStr = `${String(cls.endObj.getHours()).padStart(2, '0')}:${String(cls.endObj.getMinutes()).padStart(2, '0')}`;
    } else if (cls.end) {
        const d = new Date(cls.end);
        if(!isNaN(d)) endStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    document.getElementById('detail-class-time').textContent = `${dayName} ${startStr} - ${endStr}`;

    // 3. Törlés gomb elrejtése/mutatása
    // A Neptunból importált órákat nem lehet egyesével törölni, csak a sajátokat!
    const delBtn = document.getElementById('detail-class-delete-btn');
    if (cls.isCustom || cls.IsCustom) {
        delBtn.style.display = 'block';
    } else {
        delBtn.style.display = 'none';
    }

    // 4. Modál megjelenítése
    document.getElementById('view-class-modal').classList.add('is-active');
}

export function closeViewClassModal() {
    document.getElementById('view-class-modal').classList.remove('is-active');
    state.currentlySelectedClass = null; // Takarítunk magunk után
}

export async function saveClassDetails() {
    if (!state.currentlySelectedClass) return;
    
    const id = state.currentlySelectedClass.id;
    
    let scope = "single";
    const scopeRadios = document.getElementsByName("classScope");
    for (let radio of scopeRadios) {
        if (radio.checked) scope = radio.value;
    }

    if (state.currentlySelectedClass.isCustom) {
        scope = "single";
    }

    const payload = {
        Notes: document.getElementById("detail-class-notes-input").value,
        Color: document.getElementById("detail-class-color-input").value,
        Importance: parseInt(document.getElementById("detail-class-importance-input").value)
    };

    try {
        const res = await apiFetch(`/orarend/${id}?scope=${scope}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.ok) {
            showToast("Testreszabás mentve!", "is-success");
            closeViewClassModal();
            await fetchOrarend();
            if (window.refreshSPA) window.refreshSPA();
        } else {
            showToast("Hiba a mentés során.", "is-danger");
        }
    } catch (e) { showToast("Hálózati hiba a mentéskor.", "is-danger"); }
}

export function routeToZhAddFromClass() {
    if (!state.currentlySelectedClass) return;

    const subName = state.currentlySelectedClass.rawSubjectName;
    const room = state.currentlySelectedClass.room;
    const type = state.currentlySelectedClass.rawClassType;
    const startDate = state.currentlySelectedClass.startObj; 

    const datePart = startDate.toLocaleDateString('sv-SE'); 
    const timePart = startDate.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    const formattedDateTime = `${datePart}T${timePart}`;

    closeViewClassModal();
    openAddZhModal(); 

    setTimeout(() => {
        const dateInput = document.getElementById("add-zh-dateof");
        if (dateInput) {
            dateInput.value = formattedDateTime;
            if(typeof onDateChangeHelper === "function") onDateChangeHelper(); 
        }
        const subjectSelect = document.getElementById("add-zh-subject");
        const foundSubject = state.allSubjects.find(s => (s.name || s.Name).trim() === subName.trim());
        
        if (foundSubject && subjectSelect) {
            subjectSelect.value = foundSubject.id || foundSubject.Id;
        }

        const roomInput = document.getElementById("add-zh-room");
        if (roomInput) roomInput.value = room || "";

        const typeSelect = document.getElementById("add-zh-type");
        if (typeSelect) {
            if (type.includes("Labor")) typeSelect.value = "Labor";
            else if (type.includes("Előadás")) typeSelect.value = "Előadás";
            else typeSelect.value = "Komplex";
        }
    }, 100);
}

// JAVÍTVA: Legördülő feltöltése, alapértékek beállítása
export function openAddClassModal() {
    const subInput = document.getElementById("add-class-subject");
    const roomInput = document.getElementById("add-class-room");
    const startInput = document.getElementById("add-class-start");
    const endInput = document.getElementById("add-class-end");
    const colorInput = document.getElementById("add-class-color");
    const importanceInput = document.getElementById("add-class-importance");
    const notesInput = document.getElementById("add-class-notes");
    
    if (subInput) subInput.value = "";
    if (roomInput) roomInput.value = "";
    if (startInput) startInput.value = "";
    if (endInput) endInput.value = "";
    if (colorInput) colorInput.value = "#3b82f6";
    if (importanceInput) importanceInput.value = "0";
    if (notesInput) notesInput.value = "";

    // Tárgyak betöltése a legördülő menübe
    const dropdown = document.getElementById('add-class-subject-dropdown');
    if (dropdown) {
        const activeSemester = state.currentSemesterStr || getCurrentSemesterString();
        
        // SZIGORÚ SZŰRÉS: Csak az aktív félév tárgyai jöhetnek be
        const currentSubjects = (state.allSubjects || []).filter(s => s.semesterTag === activeSemester);
        
        const options = currentSubjects.map(s => 
            `<option value="${s.id || s.Id}">${escapeHTML(s.name || s.Name)}</option>`
        ).join('');
        
        dropdown.innerHTML = currentSubjects.length > 0 
            ? '<option value="">-- Válassz tantárgyat --</option>' + options
            : '<option value="">Nincs tárgy az aktuális félévben</option>';
    }

    document.getElementById("add-class-modal").classList.add("is-active");
}

export function closeAddClassModal() {
    document.getElementById("add-class-modal").classList.remove("is-active");
}

// JAVÍTVA: Mentés logikája az új fülek és mezők (Szín, Fontosság) alapján
export async function submitCustomClass() {
    // Annak a kiderítése, hogy melyik fül (Tárgy vs Egyéni) van kiválasztva
    const isCustomTab = document.querySelector('#add-class-type-toggle li[data-type="custom"]').classList.contains('is-active');
    
    const subject = isCustomTab 
        ? document.getElementById("add-class-subject").value 
        : document.getElementById("add-class-subject-dropdown").value;

    const day = parseInt(document.getElementById("add-class-day").value);
    const start = document.getElementById("add-class-start").value;
    const end = document.getElementById("add-class-end").value;
    const freqInput = document.getElementById("add-class-frequency");
    const freq = freqInput ? parseInt(freqInput.value) : 1; 

    if (!subject || !start || !end) {
        showToast("Minden mezőt tölts ki (Tárgy/Név, Kezdés, Vége)!", "is-warning");
        return;
    }

    const data = {
        SubjectName: subject,
        DayOfWeek: day,
        StartTime: start.length === 5 ? start + ":00" : start, 
        EndTime: end.length === 5 ? end + ":00" : end,
        Room: document.getElementById("add-class-room").value,
        IsCustom: true,
        Notes: document.getElementById("add-class-notes")?.value || "",
        ScheduledWeek: state.currentTimetableWeek, 
        Frequency: freq,
        Color: document.getElementById("add-class-color")?.value || "#3b82f6",
        Importance: parseInt(document.getElementById("add-class-importance")?.value || "0")
    };

    try {
        const res = await apiFetch(`/orarend/custom`, { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) {
            showToast("Esemény rögzítve!", "is-success");
            closeAddClassModal();
            await fetchOrarend();
            if (window.refreshSPA) window.refreshSPA();
        } else {
            showToast("Hiba a mentés során.", "is-danger");
        }
    } catch (e) { 
        console.error(e); 
        showToast("Hálózati hiba mentéskor.", "is-danger");
    }
}

export async function fetchOrarend() {
    try {
        const res = await apiFetch(`/orarend`);
        if (res.ok) {
            const dbEvents = await res.json();
            if (dbEvents.length === 0) {
                state.allTimetableEvents = [];
            } else {
                state.allTimetableEvents = dbEvents.map(e => {
                    const rawStart = new Date(e.startTime || e.StartTime);
                    const rawEnd = new Date(e.endTime || e.EndTime);
                    
                    const isCustomEvent = e.isCustom || e.IsCustom || false;
                    
                    let startObj, endObj;

                    if (isCustomEvent) {
                        startObj = rawStart;
                        endObj = rawEnd;
                    } else {
                        startObj = new Date(rawStart.getTime() + (120 * 60 * 1000));
                        endObj = new Date(rawEnd.getTime() + (120 * 60 * 1000));
                    }

                    const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };
                    const fullTimeStr = `${startObj.toLocaleTimeString('hu-HU', timeOpts)} - ${endObj.toLocaleTimeString('hu-HU', timeOpts)}`;
                    const classType = e.classType || e.ClassType || "Egyéb";
                    const subName = e.subjectName || e.SubjectName || "Ismeretlen";

                    let dayIdx = startObj.getDay();
                    if (dayIdx === 0) dayIdx = 7;

                    return {
                        id: e.id || e.Id,
                        startObj: startObj,
                        endObj: endObj,
                        dayOfWeekIndex: dayIdx,
                        subject: `${subName} (${classType})`, 
                        rawSubjectName: subName,
                        rawClassType: classType,
                        timeStr: fullTimeStr, 
                        room: e.room || e.Room,
                        isCustom: isCustomEvent,
                        notes: e.notes || e.Notes || "",
                        color: e.color || e.Color || "",
                        importance: e.importance !== undefined ? e.importance : (e.Importance || 0),
                        frequency: e.frequency !== undefined ? e.frequency : (e.Frequency || 0),
                        scheduledWeek: e.scheduledWeek || e.ScheduledWeek || null
                    };
                });
            }
            state.isTimetableLoaded = true;
        }
    } catch (e) { console.error(e); }
}

export async function deleteCustomClass(id) {
    if (confirm("Biztosan törölni szeretnéd ezt az egyéni órát?")) {
        try {
            const res = await apiFetch(`/orarend/custom/${id}`, { method: 'DELETE' });
            
            if (res.ok) {
                showToast("Óra sikeresen törölve!", "is-success");
                closeViewClassModal();
                await fetchOrarend();
                if (window.refreshSPA) window.refreshSPA(); 
            } else {
                showToast("Szerver hiba történt a törlés során.", "is-danger");
            }
        } catch (e) {
            showToast("Hálózati hiba törléskor.", "is-danger");
            console.error(e);
        }
    }
}