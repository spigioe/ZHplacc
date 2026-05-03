// js/services/settingService.js
import { apiFetch } from "../core/api.js";
import { showToast } from "../core/ui.js";

export function openClearDbModal() { 
    document.getElementById("clear-db-modal").classList.add("is-active");
}
export function closeClearDbModal() { 
    document.getElementById("clear-db-modal").classList.remove("is-active");
    document.querySelectorAll('#clear-db-modal input[type="checkbox"]').forEach(cb => cb.checked = false);
}

export async function executeClearDb() { 
    const clearTimetable = document.getElementById("clear-cb-timetable").checked;
    const clearSubjects = document.getElementById("clear-cb-subjects").checked;
    const clearZhs = document.getElementById("clear-cb-zhs").checked;
    const clearExams = document.getElementById("clear-cb-exams").checked;

    if (!clearTimetable && !clearSubjects && !clearZhs && !clearExams) {
        showToast("Nem jelöltél ki semmit törlésre!", "is-warning"); return;
    }
    if (!confirm("Biztosan véglegesen törlöd a kijelölt adatokat? Ez nem vonható vissza!")) return;

    document.getElementById("clear-db-confirm-btn").classList.add("is-loading");
    try {
        if (clearTimetable) await apiFetch('/orarend/clear', { method: 'DELETE' });
        if (clearSubjects) await apiFetch('/subjects/clear', { method: 'DELETE' });
        if (clearZhs) await apiFetch('/zarthelyik/clear', { method: 'DELETE' });
        if (clearExams) await apiFetch('/exams/clear', { method: 'DELETE' });

        showToast("A kijelölt adatok sikeresen törölve!", "is-success");
        closeClearDbModal();
        setTimeout(() => { window.location.reload(); }, 500); 
    } catch (e) {
        showToast("Hiba történt a törlés során.", "is-danger");
    } finally {
        document.getElementById("clear-db-confirm-btn").classList.remove("is-loading");
    }
}