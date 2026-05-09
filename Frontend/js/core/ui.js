// js/core/ui.js

import { state } from "./state.js";
import { getAutoSemesterStart, getWeekBoundaries } from "../services/syncService.js";
import { escapeHTML } from "./api.js";

// ==========================================
// KÖZÖS SEGÉDFÜGGVÉNYEK
// ==========================================

// Kiszámolja, hány nap van hátra egy adott dátumig (Visszaadja a napok számát és a formázott szöveget is)
function getDaysUntil(targetDateStr) {
    const now = new Date();
    const targetDate = new Date(targetDateStr);
    const diffTime = Math.abs(targetDate - now);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    let text = `${diffDays} nap`;
    if (diffDays < 1) text = "Ma!";
    else if (diffDays < 2) text = "Holnap!";
    else if (diffDays > 7) text = `${targetDate.getMonth() + 1}.${targetDate.getDate().toString().padStart(2, '0')}.`;
    
    return { days: diffDays, text: text, dateObj: targetDate };
}

// ==========================================
// TOAST ÉS ÉRTESÍTÉSEK
// ==========================================

export function showToast(message, type = 'is-success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Egyedi azonosító a toastnak
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="notification ${type} is-light toast-notification">
            <button class="delete"></button>
            <span><strong>${escapeHTML(message)}</strong></span>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const closeBtn = toastEl.querySelector('.delete');

    const removeToast = () => {
        if (!toastEl.parentElement) return;
        toastEl.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        setTimeout(() => toastEl.remove(), 300);
    };

    closeBtn.onclick = removeToast;
    setTimeout(removeToast, 3000);
}

// ==========================================
// DASHBOARD STATISZTIKÁK (Felső dobozok)
// ==========================================

export function updateDashboardStats() {
    updateNextZhBox();
    updateNextExamBox();
    updateCurrentWeekBox();
}

export function calculateCurrentWeek() {
    const startDate = getAutoSemesterStart();
    const now = new Date();
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    const maxWeek = state.appSettings.semesterLength || 14;
    const diffDays = Math.floor((utcNow - utcStart) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7) + 1; 
    
    if (currentWeek < 1) return 1;
    if (currentWeek > maxWeek) return -1; // -1 jelzi, hogy vizsgaidőszak vagy szünet van
    return currentWeek;
}

export function updateCurrentWeekBox() {
    const display = document.getElementById('current-week-display');
    const progress = document.getElementById('week-progress');
    const text = document.getElementById('week-text');

    if (!display || !progress) return;

    const maxWeek = state.appSettings.semesterLength || 14;
    const currentWeek = calculateCurrentWeek();
    
    if (currentWeek === -1) {
        display.textContent = "Vizsgaidőszak";
        progress.value = 100;
        if (text) text.textContent = "A félév tanítási része véget ért.";
        return;
    }

    const weeksLeft = Math.max(0, maxWeek - currentWeek);
    const percent = Math.round((currentWeek / maxWeek) * 100);
    
    display.textContent = `${currentWeek}. Hét`;
    progress.value = percent;
    if (text) text.textContent = `Hátralévő hetek: ${weeksLeft}`;
}

export function updateNextZhBox() {
    const container = document.getElementById("next-zh-container");
    if (!container) return;

    const futureZhs = (state.allZhs || [])
        .filter(zh => new Date(zh.dateOf) >= new Date())
        .sort((a,b) => new Date(a.dateOf) - new Date(b.dateOf));
        
    const nextZh = futureZhs.length > 0 ? futureZhs[0] : null;
    
    if (nextZh) {
        const timeInfo = getDaysUntil(nextZh.dateOf);
        const textColor = timeInfo.days <= 3 ? 'has-text-danger' : 'has-text-warning-dark';
        
        container.innerHTML = `
            <div class="box p-4" style="border-left: 4px solid var(--bulma-warning); height: 100%;">
                <p class="heading has-text-grey mb-1">Következő ZH</p>
                <p class="title is-4 ${textColor} mb-1">${timeInfo.text}</p>
                <p class="is-size-7 has-text-weight-bold">${escapeHTML(nextZh.subjectName || nextZh.SubjectName || "Ismeretlen")}</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="box p-4" style="border-left: 4px solid var(--bulma-success); height: 100%;">
                <p class="heading has-text-grey mb-1">Következő ZH</p>
                <p class="title is-4 has-text-success mb-1">Nincs kiírva</p>
                <p class="is-size-7 has-text-weight-bold">-</p>
            </div>
        `;
    }
}

export function updateNextExamBox() {
    const timeEl = document.getElementById("dash-next-exam-time");
    const nameEl = document.getElementById("dash-next-exam-name");
    
    if (!timeEl || !nameEl) return;

    const futureExams = (state.allExams || [])
        .filter(ex => new Date(ex.dateOf) >= new Date())
        .sort((a,b) => new Date(a.dateOf) - new Date(b.dateOf));
        
    const nextExam = futureExams.length > 0 ? futureExams[0] : null;

    if (nextExam) {
        const timeInfo = getDaysUntil(nextExam.dateOf);
        timeEl.textContent = timeInfo.text;
        timeEl.className = `title is-4 mb-1 ${timeInfo.days <= 7 ? 'has-text-danger' : 'has-text-grey-dark'}`;
        nameEl.textContent = escapeHTML(nextExam.subjectName || nextExam.SubjectName || "Ismeretlen vizsga");
    } else {
        timeEl.textContent = "Nincs kiírva";
        timeEl.className = "title is-4 has-text-success mb-1";
        nameEl.textContent = "-";
    }
}

// ==========================================
// NAPTÁR ÉS IDŐVONAL (Középső és Jobb oszlop)
// ==========================================

export function changeDisplayedWeek(step) {
    state.currentDisplayedWeek += step;
    renderWeeklyCalendar();
}

export function renderWeeklyCalendar() {
    const container = document.getElementById("weekly-calendar");
    if (!container) return;
    
    const bounds = getWeekBoundaries(state.currentDisplayedWeek);
    const titleEl = document.getElementById("calendar-week-title");
    const typeEl = document.getElementById("calendar-week-type");
    
    if (titleEl) {
        titleEl.textContent = bounds 
            ? `${state.currentDisplayedWeek}. Hét (${bounds.start.getMonth()+1}.${bounds.start.getDate().toString().padStart(2,'0')} - ${bounds.end.getMonth()+1}.${bounds.end.getDate().toString().padStart(2,'0')})` 
            : `${state.currentDisplayedWeek}. Hét`;
    }
    
    if (typeEl) {
        typeEl.textContent = (state.currentDisplayedWeek % 2 === 0) ? "(Páros hét)" : "(Páratlan hét)";
    }
    
    container.innerHTML = ""; 
    
    const eventsToDisplay = (state.allTimetableEvents || []).filter(e => {
        if (!bounds || !e.startObj) return false;
        return e.startObj >= bounds.start && e.startObj <= bounds.end;
    });
    
    const dayOrder = [ 
        {name:"Hétfő",index:1}, {name:"Kedd",index:2}, {name:"Szerda",index:3}, 
        {name:"Csütörtök",index:4}, {name:"Péntek",index:5}, {name:"Szombat",index:6}, {name:"Vasárnap",index:0} 
    ];
    
    let hasClasses = false;

    dayOrder.forEach(dayObj => {
        const dailyEvents = eventsToDisplay.filter(e => e.dayOfWeekIndex === dayObj.index); 
        if (dailyEvents.length === 0) return; 
        
        hasClasses = true;
        dailyEvents.sort((a, b) => a.startObj - b.startObj);
        
        const classDate = dailyEvents[0].startObj;
        const dateStr = `${classDate.getMonth()+1}.${classDate.getDate().toString().padStart(2,'0')}.`;
        
        let html = `<div class="mb-4">
            <h3 class="subtitle is-6 has-text-grey mb-2" style="border-bottom: 1px solid var(--bulma-border);">${dayObj.name} (${dateStr})</h3>`;
        
        dailyEvents.forEach(evt => {
            html += `
                <div class="class-card" data-id="${evt.id}">
                    <p class="is-size-7 has-text-grey mb-1">${evt.timeStr}</p>
                    <p class="has-text-weight-bold is-size-6">${escapeHTML(evt.subject)}</p>
                    <p class="is-size-7 mt-1">📍 ${escapeHTML(evt.room || 'Ismeretlen terem')}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
    
    if (!hasClasses) {
        container.innerHTML = bounds 
            ? `<p class="is-size-7 has-text-grey-light is-italic has-text-centered mt-4">Nincs ezen a héten órád. Éljen a pihenés! 🎉</p>`
            : `<p class="is-size-7 has-text-warning-dark is-italic has-text-centered mt-4">⚠️ A naptár használatához be kell állítanod a félév kezdetét a Beállításokban!</p>`;
    }
}

export function renderTimeline() {
    const timeline = document.getElementById("timeline-container");
    if (!timeline) return;
    
    timeline.innerHTML = "";
    const now = new Date();
    
    // Vizsgák és ZH-k összegyűjtése és címkézése
    const allEvents = [
        ...(state.allZhs || []).filter(zh => new Date(zh.dateOf) >= now).map(zh => ({ ...zh, isExam: false })),
        ...(state.allExams || []).filter(ex => new Date(ex.dateOf) >= now).map(ex => ({ ...ex, isExam: true }))
    ].sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf));
    
    if(allEvents.length === 0) {
        timeline.innerHTML = `<p class="has-text-grey is-size-7 is-italic">Nincsenek közelgő események.</p>`;
        return;
    }

    let timelineHtml = "";
    allEvents.forEach(evt => {
        const evtDate = new Date(evt.dateOf);
        const dateStr = evtDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const isExam = evt.isExam;
        const colorClass = isExam ? "is-danger" : "is-warning";
        const textClass = isExam ? "has-text-danger" : "has-text-warning-dark";
        const icon = isExam ? "🎓 Vizsga" : "📝 ZH";
        
        timelineHtml += `
            <div class="timeline-item mb-4 pb-0 ${colorClass}" data-id="${evt.id}" data-type="${isExam ? 'exam' : 'zh'}" style="cursor: pointer;">
                <p class="is-size-7 ${textClass} has-text-weight-bold mb-1">${dateStr} • ${icon}</p>
                <p class="has-text-weight-bold">${escapeHTML(evt.subjectName || evt.SubjectName || "Ismeretlen")}</p>
                <p class="is-size-7 has-text-grey">Terem: ${escapeHTML(evt.room || "-")}</p>
            </div>
        `;
    });
    
    timeline.innerHTML = timelineHtml;
}

// ==========================================
// EGYÉB UTILITY
// ==========================================

export function updateCharCount(inputId, counterId) {
    const inputElem = document.getElementById(inputId);
    const counterElem = document.getElementById(counterId);
    
    if (!inputElem || !counterElem) return;

    const val = inputElem.value.length;
    counterElem.textContent = `${val}/250`;
    counterElem.style.color = (250 - val < 10) ? "var(--bulma-danger)" : "var(--bulma-success)";
}