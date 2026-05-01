import { state } from '../state.js';
import { escapeHTML } from '../api.js';

export async function renderAssessments(container) {
    const now = new Date();
    
    // ZH-k és Vizsgák összefésülése és felcímkézése (ahogy a renderTimeline-ban csináltad)
    const futureZhs = (state.allZhs || []).map(zh => ({ ...zh, isExam: false }));
    const futureExams = (state.allExams || []).map(ex => ({ ...ex, isExam: true }));
    
    const allEvents = [...futureZhs, ...futureExams]
        .filter(evt => new Date(evt.dateOf) >= now) // Csak a jövőbeliek
        .sort((a, b) => new Date(a.dateOf) - new Date(b.dateOf));

    const rowsHtml = allEvents.map(evt => {
        const d = new Date(evt.dateOf);
        const dateStr = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        
        const diffDays = Math.round(Math.abs(d - now) / (1000 * 60 * 60 * 24));
        let countdown = `Még ${diffDays} nap`;
        if (diffDays === 0) countdown = 'Ma!';
        if (diffDays === 1) countdown = 'Holnap!';

        const typeTag = evt.isExam ? '<span class="tag is-danger is-light">🎓 Vizsga</span>' : '<span class="tag is-warning is-light">📝 ZH</span>';

        return `
            <tr>
                <td class="has-text-weight-bold">
                    ${dateStr}<br>
                    <span class="is-size-7 has-text-grey font-weight-normal">${timeStr}</span>
                </td>
                <td>${typeTag}</td>
                <td class="has-text-weight-bold" style="color: #3b82f6;">${escapeHTML(evt.subjectName || evt.SubjectName || "Ismeretlen")}</td>
                <td class="has-text-grey">${escapeHTML(evt.room || "-")}</td>
                <td><span class="tag ${diffDays <= 3 ? 'is-danger' : 'is-light'}">${countdown}</span></td>
                <td class="has-text-right">
                    <button class="button is-small is-ghost btn-view-assessment" data-id="${evt.id || evt.Id}" data-type="${evt.isExam ? 'exam' : 'zh'}">Részletek</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="dashboard-view" style="flex-direction: column; overflow-y: auto;">
            <div class="p-5" style="border-bottom: 1px solid var(--bulma-border); background-color: var(--bulma-scheme-main); display: flex; justify-content: space-between; align-items: center;">
                <h2 class="title is-4 mb-0">Számonkérések</h2>
                <div class="buttons mb-0">
                    <button class="button is-warning is-light is-small" id="ass-add-zh">➕ Új ZH</button>
                    <button class="button is-danger is-light is-small" id="ass-add-exam">➕ Új Vizsga</button>
                </div>
            </div>
            
            <div class="p-5">
                <div class="box p-0" style="overflow: hidden; border: 1px solid var(--bulma-border); box-shadow: none; background-color: var(--bulma-scheme-main);">
                    <table class="table is-fullwidth is-hoverable mb-0" style="background-color: transparent;">
                        <thead style="background-color: var(--bulma-background-light);">
                            <tr>
                                <th style="color: var(--bulma-text-strong);">Időpont</th>
                                <th style="color: var(--bulma-text-strong);">Típus</th>
                                <th style="color: var(--bulma-text-strong);">Tantárgy</th>
                                <th style="color: var(--bulma-text-strong);">Helyszín</th>
                                <th style="color: var(--bulma-text-strong);">Visszaszámlálás</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allEvents.length > 0 ? rowsHtml : '<tr><td colspan="6" class="has-text-centered p-5 has-text-grey">Nincs kiírt számonkérés.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('ass-add-zh')?.addEventListener('click', () => {
        if(typeof window.openAddZhModal === 'function') window.openAddZhModal();
    });
    document.getElementById('ass-add-exam')?.addEventListener('click', () => {
        if(typeof window.openAddExamModal === 'function') window.openAddExamModal();
    });

    document.querySelectorAll('.btn-view-assessment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const type = e.currentTarget.getAttribute('data-type');
            if(type === 'exam' && typeof window.openViewExamModal === 'function') window.openViewExamModal(id);
            if(type === 'zh' && typeof window.openViewZhModal === 'function') window.openViewZhModal(id);
        });
    });
}