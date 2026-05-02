// js/ui.js

import { state } from "./state.js";
import { getAutoSemesterStart, getWeekBoundaries } from "../services/syncService.js";
import { escapeHTML } from "./api.js";

export function showToast(message, type = 'is-success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `notification ${type} is-light toast-notification`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'delete';
    closeBtn.onclick = () => {
        toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    };
    const text = document.createElement('span');
    text.innerHTML = `<strong>${message}</strong>`;
    toast.appendChild(closeBtn);
    toast.appendChild(text);
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

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
    let maxWeek = state.appSettings.semesterLength || 14;
    const diffDays = Math.floor((utcNow - utcStart) / (1000 * 60 * 60 * 24));
    let currentWeek = Math.floor(diffDays / 7) + 1; 
    if (currentWeek < 1) return 1;
    if (currentWeek > maxWeek) return -1; 
    return currentWeek;
}

export function updateCurrentWeekBox() {
    const display = document.getElementById('current-week-display');
    const progress = document.getElementById('week-progress');
    const text = document.getElementById('week-text');

    // BIZTONSÁGI FÉK
    if (!display || !progress) return;

    let maxWeek = state.appSettings.semesterLength || 14;
    let currentWeek = calculateCurrentWeek();
    const weeksLeft = Math.max(0, maxWeek - currentWeek);
    const percent = Math.round((currentWeek / maxWeek) * 100);
    
    display.textContent = `${currentWeek}. Hét`;
    progress.value = percent;
    if (text) text.textContent = `Hátralévő hetek: ${weeksLeft}`;
}

export function updateNextZhBox() {
    const now = new Date();
    const futureZhs = state.allZhs.filter(zh => new Date(zh.dateOf) >= now).sort((a,b) => new Date(a.dateOf) - new Date(b.dateOf));
    const nextZh = futureZhs.length > 0 ? futureZhs[0] : null;
    
    const container = document.getElementById("next-zh-container");
    // BIZTONSÁGI FÉK
    if (!container) return;

    if (nextZh) {
        const diffTime = Math.abs(new Date(nextZh.dateOf) - now);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const dayText = diffDays < 1 ? "Ma!" : (diffDays >= 1 && diffDays < 2 ? "Holnap!" : `${diffDays} nap`);
        
        container.innerHTML = `
            <div class="box p-4" style="border-left: 4px solid var(--bulma-warning); height: 100%;">
                <p class="heading has-text-grey mb-1">Következő ZH</p>
                <p class="title is-4 ${diffDays <= 3 ? 'has-text-danger' : 'has-text-warning-dark'} mb-1">${dayText}</p>
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
        titleEl.textContent = bounds ? `${state.currentDisplayedWeek}. Hét (${bounds.start.getMonth()+1}.${bounds.start.getDate().toString().padStart(2,'0')} - ${bounds.end.getMonth()+1}.${bounds.end.getDate().toString().padStart(2,'0')})` : `${state.currentDisplayedWeek}. Hét`;
    }
    const isEvenWeek = (state.currentDisplayedWeek % 2 === 0);
    if (typeEl) typeEl.textContent = isEvenWeek ? "(Páros hét)" : "(Páratlan hét)";
    container.innerHTML = ""; 
    
    const eventsToDisplay = state.allTimetableEvents.filter(e => {
        if (!bounds || !e.startObj) return false;
        return e.startObj >= bounds.start && e.startObj <= bounds.end;
    });
    
    const dayOrder = [ {name:"Hétfő",index:1}, {name:"Kedd",index:2}, {name:"Szerda",index:3}, {name:"Csütörtök",index:4}, {name:"Péntek",index:5}, {name:"Szombat",index:6}, {name:"Vasárnap",index:0} ];
    let hasClasses = false;

    dayOrder.forEach(dayObj => {
        const dailyEvents = eventsToDisplay.filter(e => e.dayOfWeekIndex === dayObj.index); 
        if (dailyEvents.length === 0) return; 
        hasClasses = true;
        dailyEvents.sort((a, b) => a.startObj - b.startObj);
        const classDate = dailyEvents[0].startObj;
        const dateStr = `${classDate.getMonth()+1}.${classDate.getDate().toString().padStart(2,'0')}.`;
        const dayDiv = document.createElement("div");
        dayDiv.className = "mb-4";
        dayDiv.innerHTML = `<h3 class="subtitle is-6 has-text-grey mb-2" style="border-bottom: 1px solid var(--bulma-border);">${dayObj.name} (${dateStr})</h3>`;
        
        dailyEvents.forEach(evt => {
            dayDiv.innerHTML += `
                <div class="class-card" data-id="${evt.id}">
                    <p class="is-size-7 has-text-grey mb-1">${evt.timeStr}</p>
                    <p class="has-text-weight-bold is-size-6">${escapeHTML(evt.subject)}</p>
                    <p class="is-size-7 mt-1">📍 ${escapeHTML(evt.room || 'Ismeretlen terem')}</p>
                </div>
            `;
        });
        container.appendChild(dayDiv);
    });
    
    if (!hasClasses) {
        container.innerHTML = bounds 
            ? `<p class="is-size-7 has-text-grey-light is-italic has-text-centered mt-4">Nincs ezen a héten órád. Éljen a pihenés! 🎉</p>`
            : `<p class="is-size-7 has-text-warning-dark is-italic has-text-centered mt-4">⚠️ A naptár használatához be kell állítanod a félév kezdetét a Beállításokban!</p>`;
    }
}

export function updateCharCount(inputId, counterId) {
    const inputElem = document.getElementById(inputId);
    const counterElem = document.getElementById(counterId);
    
    // BIZTONSÁGI FÉK
    if (!inputElem || !counterElem) return;

    const val = inputElem.value.length;
    counterElem.textContent = `${val}/250`;
    counterElem.style.color = (250 - val < 10) ? "var(--bulma-danger)" : "var(--bulma-success)";
}

export function updateNextExamBox() {
    const now = new Date();
    const futureExams = (state.allExams || []).filter(ex => new Date(ex.dateOf) >= now);
    const nextExam = futureExams.length > 0 ? futureExams[0] : null;
    
    const timeEl = document.getElementById("dash-next-exam-time");
    const nameEl = document.getElementById("dash-next-exam-name");
    
    // BIZTONSÁGI FÉK
    if (!timeEl || !nameEl) return;

    if (nextExam) {
        const d = new Date(nextExam.dateOf);
        const diffTime = Math.abs(d - now);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        timeEl.textContent = diffDays < 1 ? "Ma!" : (diffDays < 2 ? "Holnap!" : `${d.getMonth()+1}.${d.getDate().toString().padStart(2,'0')}.`);
        timeEl.className = `title is-4 mb-1 ${diffDays <= 7 ? 'has-text-danger' : 'has-text-grey-dark'}`;
        nameEl.textContent = escapeHTML(nextExam.subjectName || nextExam.SubjectName || "Ismeretlen vizsga");
    } else {
        timeEl.textContent = "Nincs kiírva";
        timeEl.className = "title is-4 has-text-success mb-1";
        nameEl.textContent = "-";
    }
}

// EZ AZ ÚJ KÖZÖS IDŐVONAL-RAJZOLÓ FÜGGVÉNY
export function renderTimeline() {
    const timeline = document.getElementById("timeline-container");
    // BIZTONSÁGI FÉK
    if (!timeline) return;
    
    timeline.innerHTML = "";
    const now = new Date();
    
    // 1. Jövőbeli ZH-k felcímkézése
    const futureZhs = (state.allZhs || [])
        .filter(zh => new Date(zh.dateOf) >= now)
        .map(zh => ({ ...zh, isExam: false }));
        
    // 2. Jövőbeli Vizsgák felcímkézése
    const futureExams = (state.allExams || [])
        .filter(ex => new Date(ex.dateOf) >= now)
        .map(ex => ({ ...ex, isExam: true }));

    // 3. Összefésülés és időrendbe állítás
    const allEvents = [...futureZhs, ...futureExams].sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf));
    
    if(allEvents.length === 0) {
        timeline.innerHTML = `<p class="has-text-grey is-size-7 is-italic">Nincsenek közelgő események.</p>`;
        return;
    }

    allEvents.forEach(evt => {
        const evtDate = new Date(evt.dateOf);
        const dateStr = evtDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const isExam = evt.isExam;
        const colorClass = isExam ? "is-danger" : "is-warning";
        const textClass = isExam ? "has-text-danger" : "has-text-warning-dark";
        const icon = isExam ? "🎓 Vizsga" : "📝 ZH";
        
        const timelineHtml = `
            <div class="timeline-item mb-4 pb-0 ${colorClass}" data-id="${evt.id}" data-type="${isExam ? 'exam' : 'zh'}" style="cursor: pointer;">
                <p class="is-size-7 ${textClass} has-text-weight-bold mb-1">${dateStr} • ${icon}</p>
                <p class="has-text-weight-bold">${escapeHTML(evt.subjectName || evt.SubjectName || "Ismeretlen")}</p>
                <p class="is-size-7 has-text-grey">Terem: ${escapeHTML(evt.room || "-")}</p>
            </div>
        `;
        timeline.insertAdjacentHTML("beforeend", timelineHtml);
    });
}

