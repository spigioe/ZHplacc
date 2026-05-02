// js/pages/todos.js
import { apiFetch, escapeHTML } from '../core/api.js';
import { showToast } from '../core/ui.js';
import { state } from '../core/state.js';

export async function renderTodos(container) {
    // HTML Generálás (Kétoszlopos belső felépítés)
    container.innerHTML = `
        <div class="dashboard-view">
            <!-- BAL OLDAL: TEENDŐK (Szélesebb konténer a két oszlopnak) -->
            <div class="dash-center" style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
                
                <div class="mb-4 mt-2" style="flex-shrink: 0;">
                    <h2 class="title is-3 mb-2 has-text-weight-bold">
                        <i class="fa-solid fa-clipboard-list has-text-link mr-2"></i> Teendők
                    </h2>
                    <p class="has-text-grey is-size-6">Ne tartsd fejben, írd le! Mi figyelünk a határidőkre.</p>
                </div>
                
                <div class="box is-shadowless mb-5 p-2 todo-input-wrapper" style="background: var(--bulma-background); flex-shrink: 0;">
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

                <!-- ÚJ KÉT OSZLOPOS ELRENDEZÉS -->
                <div class="columns is-desktop is-variable is-4 m-0" style="flex-grow: 1; overflow-y: hidden; min-height: 0;">
                    
                    <!-- 1. Oszlop: Napi teendők -->
                    <div class="column is-half" style="display: flex; flex-direction: column; height: 100%; padding-top: 0;">
                        <h3 class="title is-5 mb-3 has-text-danger-dark is-flex is-align-items-center" style="flex-shrink: 0;">
                            <span class="icon mr-2"><i class="fa-solid fa-calendar-day"></i></span> Mai Teendők
                        </h3>
                        <div id="todo-list-today" class="todo-scroll-area" style="overflow-y: auto; flex-grow: 1; padding-right: 5px; padding-bottom: 20px;">
                            <div class="loader is-loading is-large mt-5 mx-auto"></div>
                        </div>
                    </div>
                    
                    <!-- 2. Oszlop: Későbbi teendők -->
                    <div class="column is-half" style="display: flex; flex-direction: column; height: 100%; padding-top: 0;">
                        <h3 class="title is-5 mb-3 has-text-grey-dark is-flex is-align-items-center" style="flex-shrink: 0;">
                            <span class="icon mr-2"><i class="fa-regular fa-calendar-days"></i></span> Későbbiek
                        </h3>
                        <div id="todo-list-later" class="todo-scroll-area" style="overflow-y: auto; flex-grow: 1; padding-right: 5px; padding-bottom: 20px;">
                            <!-- Ide jönnek a későbbi és kész feladatok -->
                        </div>
                    </div>

                </div>

            </div>

            <!-- JOBB OLDAL: Csak hasznos gombok és félév haladása (Nincs teendő doboz) -->
            <div class="dash-right is-hidden-touch">
                
                
                
            </div>
        </div>
    `;

    // Adatok betöltése
    await loadAndRenderTodos();

    // Új feladat mentése
    document.getElementById("add-todo-form").onsubmit = async (e) => {
        e.preventDefault();
        const titleInput = document.getElementById("new-todo-title");
        const dateInput = document.getElementById("new-todo-date");
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.classList.add('is-loading');

        const payload = { 
            title: titleInput.value, 
            dueDate: dateInput.value ? dateInput.value : null 
        };

        try {
            const res = await apiFetch("/todos", { method: "POST", body: JSON.stringify(payload) });
            if (res.ok) { 
                titleInput.value = ""; 
                dateInput.value = ""; 
                await loadAndRenderTodos(); 
                renderSidebarTodosWidget(); // Biztonságosan frissíti a kis widgetet, ha máshol létezik!
            } else {
                showToast("Hiba a mentés során!", "is-danger");
            }
        } catch(err) {
             showToast("Hálózati hiba!", "is-danger");
        } finally {
            submitBtn.classList.remove('is-loading');
        }
    };
}

// ==========================================
// DÁTUM FORMÁZÓ SEGÉDFÜGGVÉNY
// ==========================================
function formatDateHeader(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(y, m - 1, d); 

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateObj.getTime() === tomorrow.getTime()) return "Holnap";
    
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    return dateObj.toLocaleDateString('hu-HU', options);
}

// ==========================================
// TEENDŐK BETÖLTÉSE (Két oszlopba)
// ==========================================
async function loadAndRenderTodos() {
    const containerToday = document.getElementById("todo-list-today");
    const containerLater = document.getElementById("todo-list-later");
    if (!containerToday || !containerLater) return;

    try {
        const res = await apiFetch("/todos");
        const todos = await res.json();

        const pendingTodos = todos.filter(t => !t.isCompleted);
        const completedTodos = todos.filter(t => t.isCompleted);

        const todayTasks = [];
        const noDateTasks = [];
        const upcomingTasksByDate = {}; 

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Szétválogatás
        pendingTodos.forEach(todo => {
            if (!todo.dueDate) {
                noDateTasks.push(todo);
            } else {
                const due = new Date(todo.dueDate);
                due.setHours(0, 0, 0, 0);

                if (due < tomorrow) { 
                    todayTasks.push(todo);
                } else { 
                    const y = due.getFullYear();
                    const m = String(due.getMonth() + 1).padStart(2, '0');
                    const d = String(due.getDate()).padStart(2, '0');
                    const localDateStr = `${y}-${m}-${d}`;
                    
                    if (!upcomingTasksByDate[localDateStr]) upcomingTasksByDate[localDateStr] = [];
                    upcomingTasksByDate[localDateStr].push(todo);
                }
            }
        });

        // ------------------------------------------
        // 1. OSZLOP RENDERELÉSE (MAI FELADATOK)
        // ------------------------------------------
        let htmlToday = '';
        if (todayTasks.length > 0) {
            htmlToday += `<div class="list">`;
            todayTasks.forEach(todo => { htmlToday += generateTodoCard(todo); });
            htmlToday += `</div>`;
        } else {
            htmlToday = `
                <div class="has-text-centered p-5 mt-4" style="border: 2px dashed var(--bulma-border); border-radius: 12px; background-color: var(--bulma-background-light);">
                    <span class="icon is-large has-text-success mb-3"><i class="fa-solid fa-champagne-glasses fa-2x"></i></span>
                    <h4 class="title is-6 has-text-grey">Mára mindennel megvagy!</h4>
                    <p class="is-size-7 has-text-grey-light">Dőlj hátra, vagy csinálj meg valamit előre.</p>
                </div>
            `;
        }
        containerToday.innerHTML = htmlToday;

        // ------------------------------------------
        // 2. OSZLOP RENDERELÉSE (KÉSŐBBI / KÉSZ)
        // ------------------------------------------
        let htmlLater = '';
        const sortedUpcomingDates = Object.keys(upcomingTasksByDate).sort();

        if (sortedUpcomingDates.length > 0) {
            sortedUpcomingDates.forEach(dateStr => {
                const headerText = formatDateHeader(dateStr);
                htmlLater += `
                    <div class="mb-4">
                        <h4 class="title is-6 mb-2 has-text-grey-dark" style="text-transform: capitalize; font-size: 0.85rem; padding-bottom: 4px; border-bottom: 1px solid var(--bulma-border);">
                            ${headerText}
                        </h4>
                        <div class="list">
                `;
                upcomingTasksByDate[dateStr].forEach(todo => { htmlLater += generateTodoCard(todo); });
                htmlLater += `</div></div>`;
            });
        }

        if (noDateTasks.length > 0) {
            htmlLater += `
                <div class="mb-4">
                    <h4 class="title is-6 mb-2 has-text-grey" style="font-size: 0.85rem; padding-bottom: 4px; border-bottom: 1px solid var(--bulma-border);">
                        Később / Nincs dátum
                    </h4>
                    <div class="list">
            `;
            noDateTasks.forEach(todo => { htmlLater += generateTodoCard(todo); });
            htmlLater += `</div></div>`;
        }

        if (completedTodos.length > 0) {
            htmlLater += `
                <div class="is-flex is-align-items-center mb-3 mt-5">
                    <hr style="flex-grow: 1; background-color: var(--bulma-border); height: 1px;">
                    <span class="mx-3 has-text-grey is-size-7 is-uppercase has-text-weight-bold" style="letter-spacing: 1px;">Kész (${completedTodos.length})</span>
                    <hr style="flex-grow: 1; background-color: var(--bulma-border); height: 1px;">
                </div>
                <div class="list">
            `;
            completedTodos.forEach(todo => { htmlLater += generateTodoCard(todo); });
            htmlLater += '</div>';
        }

        if (!htmlLater) {
            htmlLater = `<p class="has-text-centered has-text-grey-light is-size-7 mt-5">Nincsenek későbbi feladataid.</p>`;
        }
        containerLater.innerHTML = htmlLater;

        // Eseménykezelők bekötése mindkét oszlop gombjaira
        document.querySelectorAll('.todo-checkbox').forEach(cb => cb.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-id');
            const card = document.getElementById(`todo-card-${id}`);
            if (card) card.style.opacity = "0.5";
            await apiFetch(`/todos/${id}/toggle`, { method: "PUT" });
            loadAndRenderTodos();
            renderSidebarTodosWidget(); // Frissíti a widgetet bárhol máshol
        }));

        document.querySelectorAll('.todo-delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            if (confirm("Biztosan törlöd ezt a feladatot?")) {
                await apiFetch(`/todos/${e.currentTarget.getAttribute('data-id')}`, { method: "DELETE" });
                loadAndRenderTodos();
                renderSidebarTodosWidget(); 
            }
        }));
    } catch (err) { 
        containerToday.innerHTML = `<div class="notification is-danger is-light">Hiba a betöltéskor.</div>`; 
        containerLater.innerHTML = '';
    }
}

// ==========================================
// KÁRTYA GENERÁLÁS HTML (Középső listák)
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

// ==========================================
// OLDALSÁV (SIDEBAR) WIDGET LOGIKA 
// (Exportálva, a dashboard.js is innen hívja!)
// ==========================================
export async function renderSidebarTodosWidget() {
    const container = document.getElementById("sidebar-todo-widget");
    // Biztonsági ellenőrzés: ha nincs ilyen doboz a HTML-ben, egyszerűen kilépünk.
    if (!container) return;

    try {
        const res = await apiFetch("/todos");
        if (!res.ok) return;
        const todos = await res.json();
        
        const pendingTodos = todos.filter(t => !t.isCompleted);

        if (pendingTodos.length === 0) {
            container.innerHTML = `
                <div class="has-text-centered py-3">
                    <span class="icon is-large has-text-success mb-2"><i class="fa-solid fa-check-double fa-2x"></i></span>
                    <h3 class="title is-6 has-text-grey mb-1">Napi Teendők</h3>
                    <p class="is-size-7 has-text-grey">Minden kész, szép munka!</p>
                </div>
            `;
            return;
        }

        const topTodos = pendingTodos.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }).slice(0, 4);
        
        let html = `
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <h3 class="title is-6 has-text-grey m-0">Napi Teendők</h3>
                <span class="tag is-info is-light is-rounded has-text-weight-bold">${pendingTodos.length}</span>
            </div>
            <div class="is-flex-direction-column" style="gap: 8px; display: flex;">
        `;

        topTodos.forEach(todo => {
            const isLate = todo.dueDate && new Date(todo.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
            const dateStr = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) : '';
            
            let dateBadge = '';
            if (dateStr) {
                if (isLate) dateBadge = `<div class="mt-1"><span class="tag is-danger is-light is-small" style="font-size: 0.65rem; padding: 0 6px;"><i class="fa-solid fa-circle-exclamation mr-1"></i> ${dateStr}</span></div>`;
                else dateBadge = `<div class="mt-1"><span class="tag is-link is-light is-small" style="font-size: 0.65rem; padding: 0 6px;"><i class="fa-regular fa-calendar mr-1"></i> ${dateStr}</span></div>`;
            }

            html += `
                <div class="box is-shadowless p-3 mb-0 is-flex is-align-items-center todo-card" style="background: var(--bulma-background); border-left: 4px solid ${isLate ? 'var(--bulma-danger)' : 'var(--bulma-link)'} !important; min-height: 50px;">
                    <label class="checkbox mr-3 is-flex is-align-items-center">
                        <input type="checkbox" class="sidebar-todo-cb todo-checkbox-custom" data-id="${todo.id}">
                    </label>
                    <div style="overflow: hidden; flex-grow: 1;">
                        <span class="is-size-7 has-text-weight-bold" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--bulma-text-strong);">
                            ${escapeHTML(todo.title)}
                        </span>
                        ${dateBadge}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        
        if (pendingTodos.length > 4) {
            html += `<div class="has-text-centered mt-3"><a href="#todos" class="button is-small is-ghost has-text-link has-text-weight-bold">Továbbiak megtekintése...</a></div>`;
        }

        container.innerHTML = html;

        document.querySelectorAll('.sidebar-todo-cb').forEach(cb => cb.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-id');
            const card = e.target.closest('.todo-card');
            if(card) card.style.opacity = "0.5";
            
            await apiFetch(`/todos/${id}/toggle`, { method: "PUT" });
            
            renderSidebarTodosWidget();
            
            if (document.getElementById("todo-list-today")) {
                loadAndRenderTodos();
            }
        }));

    } catch (e) {
        container.innerHTML = `<p class="has-text-danger is-size-7">Hiba a betöltéskor.</p>`;
    }
}