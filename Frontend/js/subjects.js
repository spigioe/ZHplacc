// js/subjects.js
import { state } from "./state.js";
import { escapeHTML, apiFetch } from "./api.js";
import { getCurrentSemesterString, getSemesterFromDate } from "./sync.js";
import { updateDashboardStats, showToast, updateCharCount } from "./ui.js";

export async function fetchSubjects() {
    try {   
        const res = await apiFetch(`/subjects`);
        if(res.ok) {
            const rawSubs = await res.json();
            const activeSemester = state.currentSemesterStr || getCurrentSemesterString();
            
            // Félévek automatikus megállapítása
            state.allSubjects = rawSubs.map(subject => {
                let sTag = subject.semesterTag || subject.SemesterTag;
                if (!sTag && state.allTimetableEvents) {
                    const subName = (subject.name || subject.Name || "").trim();
                    const relatedClass = state.allTimetableEvents.find(e => (e.rawSubjectName || "").trim() === subName);
                    if (relatedClass && relatedClass.startObj) sTag = getSemesterFromDate(relatedClass.startObj);
                }
                return { ...subject, semesterTag: sTag || activeSemester };
            });

            if (!state.currentSemesterStr) state.currentSemesterStr = activeSemester;
            updateDashboardStats();
        }
    } catch (e) { console.error("Hiba a tárgyak letöltésekor:", e); }
}

export function openAddSubjectModal() {
    closeViewSubjectModal();
    document.getElementById("add-subject-modal").classList.add("is-active"); 
    document.getElementById("add-sub-title").textContent = "Új Tárgy Felvétele";
    document.getElementById("add-sub-name").value = "";
    document.getElementById("add-sub-credits").value = 0;
    document.getElementById("add-sub-zhcount").value = 0;
    document.getElementById("add-sub-completion").value = "true"; 
    document.getElementById("add-sub-notes").value = "";
    updateCharCount('add-sub-notes', 'add-sub-counter');
    
    const submitBtn = document.getElementById("add-sub-submit");
    if(submitBtn) {
        submitBtn.onclick = (e) => { e.preventDefault(); submitSubject(); };
    }
    document.getElementById("add-sub-submit-text").textContent = "Felvétel"; 
}

export function openEditSubjectModal(id) {
    closeViewSubjectModal();
    const s = state.allSubjects.find(x => (x.id || x.Id) === id);
    if (!s) return;
    
    document.getElementById("add-subject-modal").classList.add("is-active"); 
    document.getElementById("add-sub-title").textContent = "Tárgy Szerkesztése";
    document.getElementById("add-sub-name").value = s.name || s.Name || "";
    document.getElementById("add-sub-credits").value = s.credits || s.Credits || 0;
    document.getElementById("add-sub-zhcount").value = s.ZhCount || s.zhCount || 0;
    document.getElementById("add-sub-completion").value = (s.hasExam || s.HasExam) ? "true" : "false";
    document.getElementById("add-sub-notes").value = s.notes || s.Notes || "";
    updateCharCount('add-sub-notes', 'add-sub-counter');
    
    const submitBtn = document.getElementById("add-sub-submit");
    if(submitBtn) {
        submitBtn.onclick = (e) => { e.preventDefault(); saveEditedSubject(id); };
    }
    document.getElementById("add-sub-submit-text").textContent = "Mentés"; 
}

export function openViewSubjectModal(id) {
    closeAddSubjectModal(); 
    const s = state.allSubjects.find(x => (x.id || x.Id) === id);
    if (!s) return;
    
    document.getElementById("view-sub-name").textContent = s.name || s.Name || "Ismeretlen";
    document.getElementById("view-sub-credits").textContent = s.credits || s.Credits || 0;
    document.getElementById("view-sub-zhcount").textContent = s.zhCount || s.ZhCount || 0;
    document.getElementById("view-sub-completion").textContent = (s.hasExam || s.HasExam) ? "Vizsgás" : "Évközi jegyes";
    
    const notes = s.notes || s.Notes || "";
    document.getElementById("view-sub-notes").textContent = notes.length > 0 ? notes : "Nincs megjegyzés.";
    document.getElementById("view-subject-modal").classList.add("is-active");
    
    document.getElementById("view-sub-edit-btn").onclick = (e) => {
        e.preventDefault();
        openEditSubjectModal(id);
    };
}

export function closeViewSubjectModal() { 
    const modal = document.getElementById("view-subject-modal");
    if(modal) modal.classList.remove("is-active");
}
export function closeAddSubjectModal() {
    const modal = document.getElementById("add-subject-modal");
    if(modal) modal.classList.remove("is-active"); 
}

export async function submitSubject() {
    const data = { 
        name: document.getElementById("add-sub-name").value, 
        ZhCount: parseInt(document.getElementById("add-sub-zhcount").value) || 0, 
        hasExam: document.getElementById("add-sub-completion").value === "true", 
        credits: parseInt(document.getElementById("add-sub-credits").value) || 0,
        notes: document.getElementById("add-sub-notes").value,
        SemesterTag: state.currentSemesterStr || getCurrentSemesterString()
    };
    if(!data.name) { showToast("A tantárgy neve kötelező!", "is-warning"); return; }
    try {
        const res = await apiFetch(`/subjects`, { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) {
            closeAddSubjectModal(); 
            await fetchSubjects(); 
            showToast("Tantárgy sikeresen rögzítve!", "is-success");
            if (window.refreshSPA) window.refreshSPA(); 
        } else { showToast("Hiba történt a mentés során!", "is-danger"); }
    } catch (e) { showToast("Hálózati hiba történt!", "is-danger"); }
}

export async function saveEditedSubject(id) {
    // 1. JAVÍTÁS: Megkeressük az eredeti tárgyat, hogy ne írjuk felül a félévét!
    const existingSubject = state.allSubjects.find(x => (x.id || x.Id) === id);
    const originalSemester = existingSubject 
        ? (existingSubject.semesterTag || existingSubject.SemesterTag) 
        : (state.currentSemesterStr || getCurrentSemesterString());

    const data = { 
        name: document.getElementById("add-sub-name").value, 
        ZhCount: parseInt(document.getElementById("add-sub-zhcount").value) || 0, 
        hasExam: document.getElementById("add-sub-completion").value === "true", 
        credits: parseInt(document.getElementById("add-sub-credits").value) || 0,
        notes: document.getElementById("add-sub-notes").value,
        SemesterTag: originalSemester // <-- Itt adjuk vissza neki a SAJÁT félévét!
    };
    
    if(!data.name) { showToast("A tantárgy neve kötelező!", "is-warning"); return; }
    
    try {
        const res = await apiFetch(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (res.ok) {
            closeAddSubjectModal(); 
            await fetchSubjects(); 
            showToast("Tantárgy sikeresen módosítva!", "is-success");
            if (window.refreshSPA) window.refreshSPA(); 
        }
    } catch (e) { showToast("Hálózati hiba történt!", "is-danger"); }
}

export async function deleteSubject(id) {
    if (confirm("Biztosan törlöd? A tantárgyhoz tartozó ZH-k is elvesznek!")) {
        try {
            await apiFetch(`/subjects/${id}`, { method: "DELETE" }); 
            await fetchSubjects(); 
            showToast("Tantárgy törölve!", "is-success");
            if (window.refreshSPA) window.refreshSPA(); 
        } catch (e) { showToast("Hiba a törlés során!", "is-danger"); }
    }
}