import { state } from "../core/state.js";
import { apiFetch, escapeHTML } from "../core/api.js";
import { renderTimeline, updateDashboardStats, showToast } from "../core/ui.js";

// --- VIZSGÁK LETÖLTÉSE ---
export async function fetchExams() {
    try {
        const res = await apiFetch(`/exams`);
        if (res.ok) {
            const rawExams = await res.json();
            state.allExams = rawExams.length > 0 ? rawExams.sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf)) : [];
        }
    } catch (e) { console.error("Hiba a vizsgák letöltésekor:", e); }
}

// --- VIZSGA MEGTEKINTÉSE MODÁL ---
export function openViewExamModal(id) {
    const ex = state.allExams.find(x => (x.id || x.Id) === id);
    if (!ex) return;
    
    const d = new Date(ex.dateOf);
    document.getElementById("view-exam-dateof").textContent = d.toLocaleString('hu-HU', {month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
    
    document.getElementById("view-exam-subject").textContent = ex.subjectName || ex.SubjectName || "Ismeretlen tárgy"; 
    document.getElementById("view-exam-room").textContent = ex.room || "-";
    document.getElementById("view-exam-type").textContent = ex.examType || ex.ExamType || "Vizsga";
    document.getElementById("view-exam-notes").textContent = ex.notes || ex.Notes || "-";
    
    document.getElementById("view-exam-modal").classList.add("is-active");
    
    // Gombok bekötése dinamikusan
    document.getElementById("view-exam-edit-btn").onclick = () => openEditExamModal(ex.id || ex.Id);
    document.getElementById("view-exam-delete-btn").onclick = () => {
        closeViewExamModal();
        deleteExam(ex.id || ex.Id);
    };
}

export function closeViewExamModal() {
    document.getElementById("view-exam-modal").classList.remove("is-active");
}

// --- VIZSGA HOZZÁADÁSA MODÁL ---
export function openAddExamModal() {
    const examSelect = document.getElementById("add-exam-subject");
    if (examSelect) {
        const activeSemester = state.currentSemesterStr || getCurrentSemesterString();
        
        // SZIGORÚ SZŰRÉS: Csak az aktív félév tárgyai jöhetnek be
        const currentSubjects = (state.allSubjects || []).filter(s => s.semesterTag === activeSemester);
        const options = currentSubjects.map(s => 
            `<option value="${s.id || s.Id}">${escapeHTML(s.name || s.Name)}</option>`
        ).join('');
        
        examSelect.innerHTML = currentSubjects.length > 0 
            ? '<option value="">-- Válassz tantárgyat --</option>' + options
            : '<option value="">Nincs tárgy az aktuális félévben</option>';
    }

    document.getElementById("add-exam-dateof").value = "";
    document.getElementById("add-exam-type").value = "Írásbeli";
    document.getElementById("add-exam-room").value = "";
    document.getElementById("add-exam-notes").value = "";
    document.getElementById("add-exam-title").textContent = "🎓 Új Vizsga Rögzítése";

    document.getElementById("add-exam-modal").classList.add("is-active");
}

export function closeAddExamModal() {
    document.getElementById("add-exam-modal").classList.remove("is-active");
}

// --- SZERKESZTÉS MEGNYITÁSA ---
export function openEditExamModal(id) {
    const ex = state.allExams.find(x => (x.id || x.Id) === id);
    if (!ex) return;

    // 1. Előbb megnyitjuk az "alap" modált (ez kitakarítja a régi onclickeket és bezárja a View modált)
    openAddExamModal();
    
    // 2. Felülírjuk a címet és az adatokat (ID javítva itt is)
    const titleEl = document.getElementById("add-exam-title");
    if (titleEl) titleEl.textContent = "🎓 Vizsga Szerkesztése";

    document.getElementById("add-exam-subject").value = ex.subjectId || ex.SubjectId;
    document.getElementById("add-exam-dateof").value = ex.dateOf ? ex.dateOf.substring(0, 16) : "";
    document.getElementById("add-exam-type").value = ex.examType || ex.ExamType || "Írásbeli";
    document.getElementById("add-exam-room").value = ex.room || "";
    document.getElementById("add-exam-notes").value = ex.notes || "";
    
    // 3. Mentés gomb átállítása
    const submitBtn = document.getElementById("exam-modal-submit-btn");
    if(submitBtn) {
        submitBtn.textContent = "Mentés";
        submitBtn.onclick = (e) => {
            e.preventDefault();
            saveEditedExam(id);
        };
    }
}

// --- API HÍVÁSOK (Submit / Save / Delete) ---
export async function submitExam() {
    const subVal = document.getElementById("add-exam-subject").value;
    const dateVal = document.getElementById("add-exam-dateof").value;

    const data = {
        subjectId: parseInt(subVal),
        dateOf: dateVal,
        examType: document.getElementById("add-exam-type").value,
        room: document.getElementById("add-exam-room").value,
        notes: document.getElementById("add-exam-notes").value,
        semesterTag: state.currentSemesterStr
    };

    if (!dateVal || !subVal) { 
        showToast("A tantárgy és a dátum megadása kötelező!", "is-warning"); 
        return; 
    }

    try {
        const res = await apiFetch(`/exams`, { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) {
            closeAddExamModal();
            await fetchExams(); 
            showToast("Vizsga rögzítve!", "is-success");
            if (window.refreshSPA) window.refreshSPA();
        }
    } catch (e) { showToast("Hálózati hiba a mentésnél!", "is-danger"); }
}

export async function saveEditedExam(id) {
    const data = {
        subjectId: parseInt(document.getElementById("add-exam-subject").value),
        dateOf: document.getElementById("add-exam-dateof").value,
        examType: document.getElementById("add-exam-type").value,
        room: document.getElementById("add-exam-room").value,
        notes: document.getElementById("add-exam-notes").value,
        semesterTag: state.currentSemesterStr
    };

    try {
        const res = await apiFetch(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (res.ok) {
            closeAddExamModal();
            await fetchExams(); 
            showToast("Vizsga módosítva!", "is-success");
            // ÚJ: SPA Képernyő frissítése
            if (window.refreshSPA) window.refreshSPA();
            window.dispatchEvent(new Event('hashchange'));
        }
    } catch (e) { showToast("Sikertelen mentés!", "is-danger"); }
}

export async function deleteExam(id) {
    if (confirm("Biztosan törölni szeretnéd ezt a vizsgát?")) {
        await apiFetch(`/exams/${id}`, { method: "DELETE" }); 
        await fetchExams();
        if (window.refreshSPA) window.refreshSPA();
    }
}