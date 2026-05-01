// js/class.js
import { state } from "./state.js";
import { logout, escapeHTML, apiFetch } from "./api.js";
import { fetchSettings, openSettingsModal, closeSettingsModal, refreshSettingsInPage, saveSettings, resetSettings } from "./settings.js";
import { fetchSubjects, openAddSubjectModal, openEditSubjectModal, openViewSubjectModal, closeViewSubjectModal, closeAddSubjectModal, submitSubject, saveEditedSubject, deleteSubject } from "./subjects.js";
import { openImportModal, closeImportModal, closeSyncProgressModal, startNeptunSync, handleIcsUpload, parseIcsToObjects, processAndUploadIcs, getWeekBoundaries, getCurrentSemesterString, changeSubjectSemester, toggleSubjectSemesterFilter, getSemesterFromDate, initThemeToggle, toggleTheme, getAutoSemesterStart, openMissingLinkModal, closeMissingLinkModal, goToSettingsFromMissingLink, onDateChangeHelper, initAutoWeekCalculation } from "./sync.js";
import { showToast, addFrylabsToggle, toggleFrylabsVisibility, updateDashboardStats, calculateCurrentWeek, updateCurrentWeekBox, changeDisplayedWeek, renderWeeklyCalendar, updateCharCount } from "./ui.js";
import { fetchZhs, openViewZhModal, closeViewZhModal, openAddZhModal, closeAddZhModal, openEditZhModal, calculateZhWeek, submitZh, saveEditedZh, deleteZh} from "./zarthelyik.js";

export function openViewClassModal(id) {
    const cls = state.allTimetableEvents.find(e => String(e.id) === String(id));
    if (!cls) return;
    
    state.currentlySelectedClass = cls;
    document.getElementById("detail-class-subject").textContent = cls.rawSubjectName;
    document.getElementById("detail-class-type").textContent = cls.rawClassType;
    document.getElementById("detail-class-time").textContent = `${cls.startObj.getFullYear()}. ${cls.startObj.getMonth()+1}. ${cls.startObj.getDate()}.   ${cls.timeStr}`;
    document.getElementById("detail-class-room").textContent = cls.room || "-";
    
    document.getElementById("detail-class-notes-input").value = cls.notes || "";
    document.getElementById("detail-class-color-input").value = (cls.color && cls.color !== "") ? cls.color : "#3b82f6";
    document.getElementById("detail-class-importance-input").value = cls.importance || "0";
    
    const scopeField = document.getElementById("detail-scope-field");
    if (scopeField) {
        if (cls.isCustom) {
            scopeField.style.display = "none"; 
        } else {
            scopeField.style.display = "block"; 
            document.querySelector('input[name="classScope"][value="single"]').checked = true;
        }
    }

    const actionsDiv = document.getElementById("custom-class-actions");
    if (actionsDiv) {
        if (cls.isCustom) actionsDiv.classList.remove("is-hidden");
        else actionsDiv.classList.add("is-hidden");
    }

    const zhBtn = document.getElementById("view-class-to-zh-btn");
    if (zhBtn) zhBtn.style.display = cls.isCustom ? "none" : "inline-flex";
    
    document.getElementById("view-class-modal").classList.add("is-active");
}

export function closeViewClassModal() {
    document.getElementById("view-class-modal").classList.remove("is-active");
    state.currentlySelectedClass = null;
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