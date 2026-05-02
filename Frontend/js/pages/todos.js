// js/pages/todos.js
import { apiFetch, escapeHTML } from '../api.js';
import { showToast } from '../ui.js';
import { state } from '../state.js';
import { calculateCurrentWeek } from '../ui.js';

import { openAddZhModal, openViewZhModal, deleteZh } from '../zarthelyik.js';
import { openAddExamModal, openViewExamModal, deleteExam } from '../exams.js';

export async function renderTodos(container) {
    // 1. Dinamikus CSS a teendők lebegő effektjeihez
    if (!document.getElementById("todo-custom-styles")) {
        const style = document.createElement("style");
        style.id = "todo-custom-styles";
        style.innerHTML = `
            .todo-card { transition: all 0.2s ease-in-out; border-radius: 12px !important; border: 1px solid var(--bulma-border) !important; }
            .todo-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; border-color: var(--bulma-link) !important; }
            .todo-card.is-completed { opacity: 0.6; background-color: var(--bulma-background-light) !important; border: 1px dashed var(--bulma-border) !important; }
            .todo-card.is-completed:hover { opacity: 0.9; transform: none; box-shadow: none !important; border-color: var(--bulma-border) !important; }
            .todo-input-wrapper { border-radius: 16px; border: 2px solid var(--bulma-border); transition: border-color 0.3s ease; }
            .todo-input-wrapper:focus-within { border-color: var(--bulma-link); }
            .todo-checkbox-custom { transform: scale(1.4); cursor: pointer; accent-color: var(--bulma-link); }
            .dash-right { padding-left: 1.5rem; border-left: 1px solid var(--bulma-border); }
        `;
        document.head.appendChild(style);
    }
    const now = new Date();


    // 2. Jobb oldali sáv adatai (Félév haladása)
    const futureZhs = (state.allZhs || []).filter(zh => new Date(zh.dateOf) >= now).map(zh => ({ ...zh, isExam: false }));
    const futureExams = (state.allExams || []).filter(ex => new Date(ex.dateOf) >= now).map(ex => ({ ...ex, isExam: true }));
    const kozelgoEsemenyek = [...futureZhs, ...futureExams].sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf)).slice(0, 4); 

    const maxWeek = state.appSettings?.semesterLength || 14;
    const currentWeek = calculateCurrentWeek() > 0 ? calculateCurrentWeek() : 1;
    const felevSzazalek = Math.round((currentWeek / maxWeek) * 100);

    // --- ÚJ STATISZTIKA (Csak az aktuális félév) ---
    const activeSemester = state.currentSemesterStr;
    const currentSubjects = (state.allSubjects || []).filter(s => (s.semesterTag || s.SemesterTag) === activeSemester);
    const currentSubIds = currentSubjects.map(s => s.id || s.Id);
    
    const vizsgasTargyakSzama = currentSubjects.filter(s => s.hasExam || s.HasExam).length;
    // Megszámoljuk azokat a kiírt ZH-kat, amik az aktuális félév tárgyaihoz tartoznak
    const aktualisZhkSzama = (state.allZhs || []).filter(zh => currentSubIds.includes(zh.subjectId || zh.SubjectId)).length;

    // 3. HTML Generálás
    container.innerHTML = `
        <div class="dashboard-view">
            <!-- BAL OLDAL: TEENDŐK -->
            <div class="dash-center" style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
                
                <div class="mb-5 mt-2" style="flex-shrink: 0;">
                    <h2 class="title is-3 mb-2 has-text-weight-bold">
                        <i class="fa-solid fa-clipboard-list has-text-link mr-2"></i> Teendők
                    </h2>
                    <p class="has-text-grey is-size-6">Ne tartsd fejben, írd le! Mi figyelünk a határidőkre.</p>
                </div>
                
                <div class="box is-shadowless mb-5 p-2 todo-input-wrapper" style="background: var(--bulma-background);">
                    <form id="add-todo-form" class="is-flex is-align-items-center" style="gap: 8px;">
                        <div class="control is-expanded has-icons-left">
                            <input class="input is-shadowless" type="text" id="new-todo-title" placeholder="Milyen feladat vár rád ma?" required style="border: none; background: transparent; box-shadow: none; font-size: 1.1rem; height: 45px;">
                            <span class="icon is-left has-text-grey-light"><i class="fa-solid fa-circle-plus"></i></span>
                        </div>
                        <div class="control">
                            <input class="input is-small is-shadowless has-text-grey" type="date" id="new-todo-date" title="Határidő (opcionális)" style="border: 1px solid var(--bulma-border); border-radius: 8px; background: var(--bulma-background-light);">
                        </div>
                        <button type="submit" class="button is-link is-rounded px-5" style="height: 40px;">
                            <span class="has-text-weight-bold">Hozzáadás</span>
                        </button>
                    </form>
                </div>

                <div style="overflow-y: auto; flex-grow: 1; padding-bottom: 30px; padding-right: 5px; padding-top: 10px;" id="todo-list-container">
                    <div class="loader is-loading is-large mt-5 mx-auto"></div>
                </div>

            </div>

            <div class="dash-right">
                <div class="buttons mb-4 is-flex-direction-column">
                    <button class="button is-warning is-light is-fullwidth mb-2" id="dash-btn-add-zh">
                        <i class="fa-solid fa-pen mr-2"></i> Új ZH rögzítése
                    </button>
                    <button class="button is-danger is-light is-fullwidth m-0" id="dash-btn-add-exam">
                        <i class="fa-solid fa-graduation-cap mr-2"></i> Új Vizsga
                    </button>
                </div>
                
                <div class="box p-4 mb-4 has-background-info-light" style="border: none; box-shadow: none;">
                    <div class="is-flex is-justify-content-space-between mb-1">
                        <span class="is-size-7 has-text-weight-bold has-text-info-dark is-uppercase">Félév haladása</span>
                        <span class="is-size-7 has-text-weight-bold has-text-info-dark">${currentWeek}. Hét (${felevSzazalek}%)</span>
                    </div>
                    <progress class="progress is-info is-small mb-0" value="${felevSzazalek}" max="100">${felevSzazalek}%</progress>
                </div>

                <div class="box p-4 mb-4" style="border: 1px solid var(--bulma-border); box-shadow: none;">
                    <h3 class="title is-6 has-text-grey mb-3">Aktuális Félév</h3>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Vizsgás tárgyak:</span>
                        <span class="tag is-danger is-light has-text-weight-bold">${vizsgasTargyakSzama} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between">
                        <span class="has-text-weight-semibold">Kiírt ZH-k:</span>
                        <span class="tag is-warning is-light has-text-weight-bold">${aktualisZhkSzama} db</span>
                    </div>
                </div>

                <div class="box p-4" style="border: 1px dashed var(--bulma-border); box-shadow: none; background: transparent;">
                    <div class="has-text-centered py-3">
                        <span class="icon is-large has-text-grey-light mb-2"><i class="fa-solid fa-list-check fa-2x"></i></span>
                        <h3 class="title is-6 has-text-grey mb-1">Napi Teendők</h3>
                        <p class="is-size-7 has-text-grey">Hamarosan érkezik...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 4. Jobb oldali sáv gombjainak eseménykezelői (Modálok megnyitása a UI.js nélkül!)
    document.getElementById('dash-btn-add-zh')?.addEventListener('click', (e) => { e.preventDefault(); openAddZhModal(); });
    document.getElementById('dash-btn-add-exam')?.addEventListener('click', (e) => { e.preventDefault(); openAddExamModal(); });

    document.querySelectorAll('.dash-btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(e.currentTarget.dataset.id);
            if (e.currentTarget.dataset.type === 'zh') openViewZhModal(id);
            else openViewExamModal(id);
        });
    });

    document.querySelectorAll('.dash-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(e.currentTarget.dataset.id);
            if (e.currentTarget.dataset.type === 'zh') deleteZh(id);
            else deleteExam(id);
        });
    });

    // 5. Teendők betöltése szerverről
    await loadAndRenderTodos();

    // 6. Új feladat mentése
    document.getElementById("add-todo-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const titleInput = document.getElementById("new-todo-title");
        const dateInput = document.getElementById("new-todo-date");
        const payload = { 
            title: titleInput.value, 
            dueDate: dateInput.value ? new Date(dateInput.value).toISOString() : null 
        };

        const res = await apiFetch("/todos", { method: "POST", body: JSON.stringify(payload) });
        if (res.ok) { 
            titleInput.value = ""; 
            dateInput.value = ""; 
            await loadAndRenderTodos(); 
        } else {
            showToast("Hiba a mentés során!", "is-danger");
        }
    });
}

// ==========================================
// TEENDŐK BETÖLTÉSE (Lista renderelése)
// ==========================================
async function loadAndRenderTodos() {
    const container = document.getElementById("todo-list-container");
    if (!container) return;
    try {
        const res = await apiFetch("/todos");
        const todos = await res.json();

        // Frissítjük a jobb oldali számlálót
        const pendingCount = todos.filter(t => !t.isCompleted).length;
        const countSpan = document.getElementById("active-todo-count");
        if(countSpan) countSpan.textContent = pendingCount;

        if (todos.length === 0) {
            container.innerHTML = `
                <div class="has-text-centered p-6 mt-4">
                    <span class="icon is-large has-text-grey-light mb-4" style="font-size: 4rem;"><i class="fa-solid fa-mug-hot"></i></span>
                    <h3 class="title is-5 has-text-grey">Nincsenek feladataid!</h3>
                    <p class="has-text-grey-light">Dőlj hátra, igyál egy kávét, vagy adj hozzá egy új teendőt.</p>
                </div>`;
            return;
        }

        const pendingTodos = todos.filter(t => !t.isCompleted);
        const completedTodos = todos.filter(t => t.isCompleted);

        let html = '';
        if (pendingTodos.length > 0) {
            html += '<div class="list mb-5">';
            pendingTodos.forEach(todo => { html += generateTodoCard(todo); });
            html += '</div>';
        }

        if (completedTodos.length > 0) {
            html += `
                <div class="is-flex is-align-items-center mb-4 mt-2">
                    <hr style="flex-grow: 1; background-color: var(--bulma-border); height: 1px;">
                    <span class="mx-3 has-text-grey is-size-7 is-uppercase has-text-weight-bold" style="letter-spacing: 1px;">Kész feladatok (${completedTodos.length})</span>
                    <hr style="flex-grow: 1; background-color: var(--bulma-border); height: 1px;">
                </div>
                <div class="list">
            `;
            completedTodos.forEach(todo => { html += generateTodoCard(todo); });
            html += '</div>';
        }

        container.innerHTML = html;

        // Pipálás esemény
        document.querySelectorAll('.todo-checkbox').forEach(cb => cb.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-id');
            const card = document.getElementById(`todo-card-${id}`);
            if (card) card.style.opacity = "0.5";
            await apiFetch(`/todos/${id}/toggle`, { method: "PUT" });
            loadAndRenderTodos();
        }));

        // Törlés esemény
        document.querySelectorAll('.todo-delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            if (confirm("Biztosan törlöd ezt a feladatot?")) {
                await apiFetch(`/todos/${e.currentTarget.getAttribute('data-id')}`, { method: "DELETE" });
                loadAndRenderTodos();
            }
        }));
    } catch (err) { 
        container.innerHTML = `<div class="notification is-danger is-light">Hiba a betöltéskor.</div>`; 
    }
}

// ==========================================
// KÁRTYA GENERÁLÁS HTML
// ==========================================
function generateTodoCard(todo) {
    const isDone = todo.isCompleted;
    const dateStr = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) : '';
    
    let isLate = false;
    if (!isDone && todo.dueDate) {
        const today = new Date(); today.setHours(0,0,0,0);
        const due = new Date(todo.dueDate); due.setHours(0,0,0,0);
        if (due < today) isLate = true;
    }

    const textStyle = isDone ? 'text-decoration: line-through;' : 'font-weight: 600;';
    const textColorClass = isDone ? 'has-text-grey' : 'var(--bulma-text-strong)';
    
    let dateBadge = '';
    if (dateStr) {
        if (isDone) dateBadge = `<span class="tag is-white is-small ml-3 has-text-grey-light"><i class="fa-regular fa-clock mr-1"></i> ${dateStr}</span>`;
        else if (isLate) dateBadge = `<span class="tag is-danger is-light is-small ml-3"><i class="fa-solid fa-circle-exclamation mr-1"></i> ${dateStr} (Lejárt!)</span>`;
        else dateBadge = `<span class="tag is-link is-light is-small ml-3"><i class="fa-regular fa-calendar mr-1"></i> ${dateStr}</span>`;
    }

    const borderLeftStyle = isDone ? '' : 'border-left: 4px solid var(--bulma-link) !important;';

    return `
        <div id="todo-card-${todo.id}" class="box is-shadowless p-4 mb-3 is-flex is-align-items-center is-justify-content-space-between todo-card ${isDone ? 'is-completed' : ''}" style="background: var(--bulma-background); ${borderLeftStyle}">
            <div class="is-flex is-align-items-center is-expanded" style="overflow: hidden;">
                <label class="checkbox mr-4" style="display: flex; align-items: center;">
                    <input type="checkbox" class="todo-checkbox todo-checkbox-custom" data-id="${todo.id}" ${isDone ? 'checked' : ''}>
                </label>
                <div style="overflow: hidden;">
                    <span class="is-size-6" style="${textStyle} display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${textColorClass}; line-height: 1.2;">
                        ${escapeHTML(todo.title)}
                    </span>
                    ${dateBadge ? `<div class="mt-1">${dateBadge}</div>` : ''}
                </div>
            </div>
            <button class="button is-small is-ghost has-text-danger ml-3 todo-delete-btn" data-id="${todo.id}" title="Törlés">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `;
}