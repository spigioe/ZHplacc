import { state } from "./state.js";
import { logout, escapeHTML, apiFetch } from "./api.js";
import { fetchOrarend, openViewClassModal, closeViewClassModal, routeToZhAddFromClass, openAddClassModal, closeAddClassModal, submitCustomClass } from "./class.js";
import { fetchSettings, openSettingsModal, closeSettingsModal, refreshSettingsInPage, saveSettings, resetSettings } from "./settings.js";
import { fetchSubjects, openAddSubjectModal, openEditSubjectModal, openViewSubjectModal, closeViewSubjectModal, closeAddSubjectModal, submitSubject, saveEditedSubject, deleteSubject } from "./subjects.js";
import { showToast, addFrylabsToggle, toggleFrylabsVisibility, updateDashboardStats, calculateCurrentWeek, updateCurrentWeekBox, changeDisplayedWeek, renderWeeklyCalendar, updateCharCount } from "./ui.js";
import { fetchZhs, openViewZhModal, closeViewZhModal, openAddZhModal, closeAddZhModal, openEditZhModal, calculateZhWeek, submitZh, saveEditedZh, deleteZh} from "./zarthelyik.js";


export function openImportModal() {
    document.getElementById("import-modal").classList.add("is-active"); 
}

export function closeImportModal() { 
    document.getElementById("import-modal").classList.remove("is-active"); 
}

export function closeSyncProgressModal() { 
    document.getElementById("sync-progress-modal").classList.remove("is-active"); 
}

export async function startNeptunSync() {
    let linkToUse = state.appSettings.icsUrl;
    if (document.getElementById("settings-modal").classList.contains("is-active")) {
        linkToUse = document.getElementById("setting-neptun-ics").value;
        if (linkToUse && linkToUse.trim() !== "") { state.appSettings.icsUrl = linkToUse; await saveSettings(); }
    }
    if (!linkToUse || linkToUse.trim() === "") { openMissingLinkModal(); return; }

    const modal = document.getElementById("sync-progress-modal");
    const title = document.getElementById("sync-modal-title");
    const spinner = document.getElementById("sync-loading-spinner");
    const msg = document.getElementById("sync-modal-message");
    const closeBtn = document.getElementById("sync-modal-close-btn");

    modal.classList.add("is-active");
    title.textContent = "Szinkronizálás...";
    title.className = "title is-4 has-text-link";
    spinner.classList.remove("is-hidden");
    msg.textContent = "A Neptun adatok letöltése és feldolgozása folyamatban van. Kérlek, várj...";
    msg.className = "has-text-grey mb-5 is-size-6";
    closeBtn.classList.add("is-hidden");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 
    try {
        const response = await apiFetch(`/settings/fetch-ics`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(await response.text() || "Nem sikerült kapcsolódni a Neptunhoz.");
        
        const icsData = await response.text();
        const parsedEvents = parseIcsToObjects(icsData);
        await processAndUploadIcs(parsedEvents);
        
        title.textContent = "Kész!";
        title.className = "title is-4 has-text-success";
        spinner.classList.add("is-hidden");
        msg.textContent = "Az órarended és a tantárgyaid frissítése folyamatban...";
        msg.className = "has-text-success mb-5 is-size-6 has-text-weight-bold";
        
        state.isTimetableLoaded = false; 
        await fetchOrarend(); await fetchSubjects(); await fetchZhs(); updateDashboardStats(); 

        msg.textContent = "Minden adat sikeresen frissítve!";
        closeBtn.classList.remove("is-hidden");
    } catch (e) {
        clearTimeout(timeoutId);
        spinner.classList.add("is-hidden");
        title.className = "title is-4 has-text-danger";
        msg.className = "has-text-danger mb-5 is-size-6";
        closeBtn.classList.remove("is-hidden");
        if (e.name === 'AbortError') {
            title.textContent = "Időtúllépés!";
            msg.innerHTML = `<strong>Naptár szinkronizálása sikertelen!</strong><br><br><span class="is-size-7 has-text-grey-dark">A Neptun szerver nem válaszolt.</span>`;
        } else {
            title.textContent = "Hiba történt!";
            msg.innerHTML = `Nem sikerült letölteni a naptárat.<br><br><strong>Részletek:</strong><br><span class="is-size-7">${escapeHTML(e.message)}</span>`;
        }
    }
}

export async function handleIcsUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const parsedEvents = parseIcsToObjects(e.target.result);
        await processAndUploadIcs(parsedEvents);
        closeImportModal(); fetchOrarend(); showToast("Órarend sikeresen importálva!", "is-success");
    };
    reader.readAsText(file);
}

export async function syncNeptunCalendar() {
    try {
        const response = await apiFetch(`/settings/fetch-ics`);
        if (!response.ok) { showToast("Nem sikerült letölteni az órarendet.", "is-danger"); return; }
        const icsData = await response.text();
        const parsedEvents = parseIcsToObjects(icsData);
        await processAndUploadIcs(parsedEvents);
        fetchOrarend(); showToast("Órarend sikeresen szinkronizálva!", "is-success");
    } catch (e) { showToast("Hálózati hiba a naptár szinkronizálása közben.", "is-danger"); }
}

export function parseIcsToObjects(icsData) {
    const lines = icsData.split(/\r\n|\n|\r/);
    let allEvents = []; let currentEvent = null;
    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) { currentEvent = {}; } 
        else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.subject && currentEvent.startTime && !currentEvent.isExam) { allEvents.push(currentEvent); }
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('SUMMARY:')) {
                let rawName = line.substring(8).trim();
                if (rawName.includes('- Vizsga')) currentEvent.isExam = true;
                else {
                    currentEvent.subject = rawName.split(' (')[0].trim().replace(" *", "").replace("*", "");
                    currentEvent.classType = "Egyéb";
                    if (rawName.includes('_EA)') || rawName.includes('_EA ')) currentEvent.classType = "Előadás";
                    else if (rawName.includes('_GY') || rawName.includes('Gy')) currentEvent.classType = "Gyakorlat";
                    else if (rawName.includes('_LA')) currentEvent.classType = "Labor";
                    try { currentEvent.teachers = rawName.split(') - ')[1] ? rawName.split(') - ')[1].split(' - Tanóra')[0].trim() : "Ismeretlen"; } 
                    catch(e) { currentEvent.teachers = "Ismeretlen"; }
                }
            }
            if (line.startsWith('LOCATION:')) currentEvent.room = line.substring(9).trim();
            if (line.startsWith('DTSTART')) {
                const d = line.split(':')[1].replace('Z', '').trim();
                if (d.length >= 15) {
                    currentEvent.startTime = new Date(Date.UTC(parseInt(d.slice(0,4)), parseInt(d.slice(4,6))-1, parseInt(d.slice(6,8)), parseInt(d.slice(9,11)), parseInt(d.slice(11,13)))).toISOString();
                }
            }
            if (line.startsWith('DTEND')) {
                const d = line.split(':')[1].replace('Z', '').trim();
                if (d.length >= 15) {
                    currentEvent.endTime = new Date(Date.UTC(parseInt(d.slice(0,4)), parseInt(d.slice(4,6))-1, parseInt(d.slice(6,8)), parseInt(d.slice(9,11)), parseInt(d.slice(11,13)))).toISOString();
                }
            }
        }
    });
    return allEvents;
}

export async function processAndUploadIcs(importedEvents) {
    if (importedEvents.length === 0) return;
    const egyediTargyak = new Set(); const dbEvents = [];
    importedEvents.forEach(e => {
        let name = e.subject || "Ismeretlen";
        egyediTargyak.add(name.trim());
        dbEvents.push({ SubjectName: name.trim(), ClassType: e.classType, StartTime: e.startTime, EndTime: e.endTime, Teacher: e.teachers || "Ismeretlen", Room: e.room || "Ismeretlen terem", IsCustom: false });
    });
    try {
        await apiFetch(`/orarend/sync`, { method: 'POST', body: JSON.stringify(dbEvents) });
        const existingNames = state.allSubjects.map(s => s.name || s.Name);
        for (let t of egyediTargyak) {
            if (!existingNames.includes(t)) {
                await apiFetch(`/subjects`, { method: 'POST', body: JSON.stringify({ name: t, credits: 0, hasExam: false }) });
            }
        }
    } catch (e) { console.error(e); }
}

export function getWeekBoundaries(weekNum) {
    const start = getAutoSemesterStart(); start.setHours(0, 0, 0, 0);
    const weekStart = new Date(start); weekStart.setDate(start.getDate() + (weekNum - 1) * 7);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999); 
    return { start: weekStart, end: weekEnd };
}

export function getCurrentSemesterString() {
    const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear();
    return (month >= 2 && month <= 7) ? `${year} Tavasz` : (month >= 8 ? `${year} Ősz` : `${year - 1} Ősz`);
}

// js/sync.js

export function changeSubjectSemester(step) {
    if (!state.currentSemesterStr) state.currentSemesterStr = getCurrentSemesterString();
    let parts = state.currentSemesterStr.split(" "); let year = parseInt(parts[0]); let type = parts[1];
    if (step > 0) { if (type === "Tavasz") { type = "Ősz"; } else { type = "Tavasz"; year++; } } 
    else if (step < 0) { if (type === "Ősz") { type = "Tavasz"; } else { type = "Ősz"; year--; } }
    state.currentSemesterStr = `${year} ${type}`;
    updateSubjectSemesterUI();
}

export function toggleSubjectSemesterFilter() {
    state.showAllSubjects = document.getElementById("show-all-subjects-cb").checked;
    updateSubjectSemesterUI();
}

export function getSemesterFromDate(dateObj) {
    if (!dateObj) return getCurrentSemesterString();
    const month = dateObj.getMonth() + 1; const year = dateObj.getFullYear();
    return (month >= 2 && month <= 7) ? `${year} Tavasz` : (month >= 8 ? `${year} Ősz` : `${year - 1} Ősz`);
}

export function initThemeToggle() {
    const htmlElement = document.documentElement; 
    const toggleBtn = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("zhub-theme") || "light";
    
    htmlElement.setAttribute("data-theme", savedTheme);
    if (toggleBtn) {
        toggleBtn.innerHTML = savedTheme === "light" ? "🌙 Sötét mód" : "☀️ Világos mód";
    }
}

export function toggleTheme() {
    const htmlElement = document.documentElement;
    const toggleBtn = document.getElementById("theme-toggle");
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    htmlElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("zhub-theme", newTheme);
    
    if (toggleBtn) {
        toggleBtn.innerHTML = newTheme === "light" ? "🌙 Sötét mód" : "☀️ Világos mód";
    }
    
    showToast(`${newTheme === "light" ? "Világos" : "Sötét"} mód aktiválva`);
}

export function getAutoSemesterStart() {
    let activeSem = state.currentSemesterStr || getCurrentSemesterString();
    let fallbackDate = new Date(); let parts = activeSem.split(" ");
    let year = parseInt(parts[0]) || fallbackDate.getFullYear();
    let isSpring = parts[1] === "Tavasz";
    let baseDate = new Date(year, isSpring ? 1 : 8, isSpring ? 10 : 1); 

    if (state.allTimetableEvents.length > 0) {
        const semEvents = state.allTimetableEvents.filter(e => e.startObj && getSemesterFromDate(e.startObj) === activeSem);
        if (semEvents.length > 0) {
            const minTime = Math.min(...semEvents.map(e => e.startObj.getTime()));
            baseDate = new Date(minTime);
        }
    }
    let day = baseDate.getDay();
    let diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); 
    let monday = new Date(baseDate);
    monday.setDate(diff); monday.setHours(0, 0, 0, 0);
    const offsetWeeks = state.appSettings.weekOffset || 0;
    monday.setDate(monday.getDate() + (offsetWeeks * 7));
    return monday;
}

export function openMissingLinkModal() {
    document.getElementById("missing-link-modal").classList.add("is-active"); 
}

export function closeMissingLinkModal() {
    document.getElementById("missing-link-modal").classList.remove("is-active");
}
export function goToSettingsFromMissingLink() {
    closeMissingLinkModal(); openSettingsModal();
    setTimeout(() => {
        const inputField = document.getElementById("setting-neptun-ics");
        if (inputField) {
            inputField.focus(); inputField.classList.add("is-info", "has-background-info-light");
            showToast("👋 Szia! Ide kell bemásolnod az ICS linkedet!", "is-info");
            setTimeout(() => inputField.classList.remove("is-info", "has-background-info-light"), 3000);
        }
    }, 150);
}

export function onDateChangeHelper() {
    const week = document.getElementById("add-zh-week");
    const date = document.getElementById("add-zh-dateof");
    week.value = calculateZhWeek(date.value);
}

export function initAutoWeekCalculation() {
    const addDateInput = document.getElementById('add-zh-dateof');
    const addWeekInput = document.getElementById('add-zh-week');
    const updateWeekField = (dateValue, targetInput) => {
        if (!dateValue || !window.appSettings) return;
        const pickedDate = new Date(dateValue);
        const startDate = getAutoSemesterStart(); 
        const utcPicked = Date.UTC(pickedDate.getFullYear(), pickedDate.getMonth(), pickedDate.getDate());
        const utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        let calculatedWeek = Math.floor(Math.floor((utcPicked - utcStart) / (1000 * 60 * 60 * 24)) / 7) + 1;
        if (calculatedWeek < 1) calculatedWeek = 1;
        const maxWeeks = window.appSettings.semesterLength || 14;
        if (calculatedWeek > maxWeeks) calculatedWeek = maxWeeks;
        targetInput.value = calculatedWeek;
    };
    if (addDateInput) addDateInput.addEventListener('change', (e) => updateWeekField(e.target.value, addWeekInput));
}

