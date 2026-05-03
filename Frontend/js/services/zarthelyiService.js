import { state } from "../core/state.js";
import { escapeHTML, apiFetch } from "../core/api.js";
import { showToast, updateDashboardStats, updateCharCount, calculateCurrentWeek, renderTimeline} from "../core/ui.js";
import { getAutoSemesterStart, getCurrentSemesterString } from "./syncService.js";

export async function fetchZhs() {
    try {
        const res = await apiFetch(`/zarthelyik`);
        if (res.ok) {
            const rawZhs = await res.json();
            state.allZhs = rawZhs.length > 0 ? rawZhs.sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf)) : [];
            renderTimeline();
            updateDashboardStats();
            if (window.refreshSPA) window.refreshSPA();
        }
    } catch (e) { console.error(e); }
}

export function openViewZhModal(id) {
    closeAddZhModal();
    const z = state.allZhs.find(x => x.id === id);
    if (!z) return;
    document.getElementById("view-zh-week").textContent = z.scheduledWeek;
    
    const d = new Date(z.dateOf);
    document.getElementById("view-zh-dateof").textContent = d.toLocaleString('hu-HU', {month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
    
    document.getElementById("view-zh-subject").textContent = z.subjectName || z.SubjectName; 
    document.getElementById("view-zh-room").textContent = z.room || "-";
    document.getElementById("view-zh-type").textContent = z.zhType;
    document.getElementById("view-zh-notes").textContent = z.notes || "-";
    document.getElementById("view-zh-maxpoints").textContent = z.maxPoints;
    document.getElementById("view-zh-modal").classList.add("is-active");
    
    document.getElementById("view-zh-edit-btn").onclick = (e) => { e.preventDefault(); openEditZhModal(z.id); };
    document.getElementById("view-zh-delete-btn").onclick = (e) => {
        e.preventDefault();
        closeViewZhModal();
        deleteZh(z.id);
    };
}

export function closeViewZhModal() {
    document.getElementById("view-zh-modal").classList.remove("is-active");
}

export function openAddZhModal() { 
    closeViewZhModal();
    
    const subjectSelect = document.getElementById("add-zh-subject");
    if (subjectSelect) {
        const activeSemester = state.currentSemesterStr || getCurrentSemesterString();
        const currentSubjects = (state.allSubjects || []).filter(s => s.semesterTag === activeSemester);
        
        const options = currentSubjects.map(s => 
            `<option value="${s.id || s.Id}">${escapeHTML(s.name || s.Name)}</option>`
        ).join('');
        
        subjectSelect.innerHTML = currentSubjects.length > 0 
            ? '<option value="">-- Válassz tantárgyat --</option>' + options
            : '<option value="">Nincs tárgy az aktuális félévben</option>';
    }

    document.getElementById("add-zh-modal-title").textContent = "Új ZH rögzítése";
    document.getElementById("add-zh-week").value = calculateCurrentWeek();
    document.getElementById("add-zh-dateof").value = ""; 
    document.getElementById("add-zh-room").value = "";
    document.getElementById("add-zh-type").value = "Komplex"; 
    document.getElementById("add-zh-notes").value = "";
    document.getElementById("add-zh-maxpoints").value = 100;
    
    // TÖRLŐDIK AZ ID (Tehát ÚJ ZH lesz létrehozva)
    document.getElementById("add-zh-id").value = "";
    
    document.getElementById("add-zh-modal").classList.add("is-active"); 
    document.getElementById("zh-modal-submit-text").textContent = "Felvétel";
    updateCharCount('add-zh-notes', 'add-zh-counter');
}

export function closeAddZhModal() {
    document.getElementById("add-zh-modal").classList.remove("is-active"); 
}

export function openEditZhModal(id) {
    closeViewZhModal();
    const z = state.allZhs.find(x => x.id === id);
    openAddZhModal(); // Ez megcsinálja a legördülő frissítést és a takarítást
    
    // BEÁLLÍTJUK AZ ID-T (Tehát frissítve lesz)
    document.getElementById("add-zh-id").value = id;
    
    document.getElementById("add-zh-modal-title").textContent = "Zárthelyi szerkesztése";
    document.getElementById("add-zh-week").value = z.scheduledWeek;
    document.getElementById("add-zh-dateof").value = z.dateOf ? z.dateOf.substring(0,16) : "";
    document.getElementById("add-zh-subject").value = z.subjectId || z.SubjectId;
    document.getElementById("add-zh-room").value = z.room;
    document.getElementById("add-zh-type").value = z.zhType;
    document.getElementById("add-zh-notes").value = z.notes;
    document.getElementById("add-zh-maxpoints").value = z.maxPoints;
    
    // FIGYELEM: KIVETTÜK az .onclick felülírást, hogy ne duplikáljon!
    document.getElementById("zh-modal-submit-text").textContent = "Mentés";
}

export function calculateZhWeek(dateString) {
    if (!dateString) return 1;
    const pickedDate = new Date(dateString);
    const startDate = getAutoSemesterStart(); 
    const utcPicked = Date.UTC(pickedDate.getFullYear(), pickedDate.getMonth(), pickedDate.getDate());
    const utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let maxWeek = state.appSettings.semesterLength || 14;
    const diffDays = Math.floor((utcPicked - utcStart) / (1000 * 60 * 60 * 24));
    let calculatedWeek = Math.floor(diffDays / 7) + 1; 
    if (calculatedWeek < 1) return 1;
    if (calculatedWeek > maxWeek) return maxWeek;
    return calculatedWeek;
}

export async function submitZh() {
    // 1. Megnézzük, hogy szerkesztünk-e valamit
    const editId = document.getElementById("add-zh-id").value;
    
    const subVal = document.getElementById("add-zh-subject").value;
    const dateVal = document.getElementById("add-zh-dateof").value;
    
    const data = { 
        scheduledWeek: parseInt(document.getElementById("add-zh-week").value) || 1, 
        dateOf: dateVal,
        subjectId: parseInt(subVal), 
        room: document.getElementById("add-zh-room").value,
        zhType: document.getElementById("add-zh-type").value, 
        notes: document.getElementById("add-zh-notes").value, 
        maxPoints: parseInt(document.getElementById("add-zh-maxpoints").value) || 100
    };
    
    if(!dateVal || !subVal) { showToast("A dátum és a tantárgy megadása kötelező!", "is-warning"); return; }
    
    try {
        if (editId) {
            // VAN ID -> SZERKESZTÉS (PUT)
            const res = await apiFetch(`/zarthelyik/${editId}`, { method: 'PUT', body: JSON.stringify(data) });
            if(res.ok) { 
                closeAddZhModal(); 
                await fetchZhs(); 
                showToast("ZH sikeresen módosítva!", "is-success"); 
                if (window.refreshSPA) window.refreshSPA();
            }
        } else {
            // NINCS ID -> ÚJ LÉTREHOZÁSA (POST)
            const res = await apiFetch(`/zarthelyik`, { method: 'POST', body: JSON.stringify(data) });
            if (res.ok) { 
                closeAddZhModal(); 
                await fetchZhs(); 
                showToast("ZH sikeresen rögzítve!", "is-success"); 
                if(window.refreshSPA) window.refreshSPA();
            }
        }
    } catch (e) { showToast("Hálózati hiba a mentésnél!", "is-danger"); }
}

export async function deleteZh(id) {
    if (confirm("Biztosan törölni szeretnéd ezt a ZH-t?")) {
        await apiFetch(`/zarthelyik/${id}`, { method: "DELETE" }); 
        await fetchZhs();
        if (window.refreshSPA) window.refreshSPA();
    }
}