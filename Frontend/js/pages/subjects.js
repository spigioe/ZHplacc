// js/pages/subjects.js
import { state } from '../core/state.js';
import { escapeHTML } from '../core/api.js';
import { calculateCurrentWeek } from '../core/ui.js';
import { openAddSubjectModal, openEditSubjectModal, openViewSubjectModal, deleteSubject } from '../services/subjectService.js';
import { renderSidebarTodosWidget } from './todos.js';

let localDisplayedSemester = null;

export async function renderSubjects(container) {
    // 1. Félévek kigyűjtése az adatbázisból (rendezve)
    const allSemesters = [...new Set((state.allSubjects || []).map(s => s.semesterTag || s.SemesterTag).filter(Boolean))].sort().reverse();
    
    if (allSemesters.length === 0 && state.currentSemesterStr) {
        allSemesters.push(state.currentSemesterStr);
    }
    
    if (!localDisplayedSemester) {
        localDisplayedSemester = state.currentSemesterStr || allSemesters[0];
    }

    const currentIndex = allSemesters.indexOf(localDisplayedSemester);
    const hasPrev = currentIndex < allSemesters.length - 1;
    const hasNext = currentIndex > 0;

    // 2. Szűrés és statisztika számítása a megjelenített félévhez
    const displayedSubjects = (state.allSubjects || []).filter(s => (s.semesterTag || s.SemesterTag) === localDisplayedSemester);
    
    const totalSubjectsCount = displayedSubjects.length;
    const examSubjectsCount = displayedSubjects.filter(s => s.hasExam || s.HasExam).length;
    const nonExamSubjectsCount = totalSubjectsCount - examSubjectsCount;

    const subjectsHtml = totalSubjectsCount === 0 ? 
        `<div class="column is-12"><div class="notification is-light has-text-centered has-text-grey">Nincsenek tantárgyak ebben a félévben.</div></div>` :
        displayedSubjects.map(sub => {
            const subId = sub.id || sub.Id;
            const subName = sub.name || sub.Name || "Ismeretlen";
            const credits = sub.credits || sub.Credits || 0;
            const isExam = sub.hasExam || sub.HasExam;
            const zhCount = sub.zhCount || sub.ZhCount || 0;
            
            const typeTag = isExam ? '<span class="tag is-danger is-light">Vizsgás</span>' : '<span class="tag is-success is-light">Évközi</span>';
            let zhDots = "";
            for (let i = 0; i < zhCount; i++) {
                zhDots += `<span class="subj-zh-dot"></span>`;
            }

            return `
            <div class="column is-6">
                <div class="box subj-card">
                    <div class="is-flex is-justify-content-space-between is-align-items-flex-start mb-2">
                        <h3 class="title is-5 mb-0 subj-card-title">${escapeHTML(subName)}</h3>
                        <div class="ml-2">${typeTag}</div>
                    </div>
                    <div class="mb-auto">
                        <p class="is-size-7 has-text-grey mb-1"><strong>${credits} Kredit</strong></p>
                        ${zhCount > 0 ? `<p class="is-size-7 has-text-grey is-flex is-align-items-center">ZH-k: <span class="ml-2">${zhDots}</span></p>` : ''}
                    </div>
                    
                    <!-- FRISSÍTETT LÁBLÉC: Csak Részletek és Törlés -->
                    <div class="is-flex is-justify-content-flex-end mt-4 pt-3 subj-card-footer">
                        <button class="button is-small is-ghost has-text-info p-0 sub-btn-view mr-4" data-id="${subId}">
                            <span class="icon is-small"><i class="fa-solid fa-eye"></i></span><span>Részletek</span>
                        </button>
                        <button class="button is-small is-ghost has-text-danger p-0 sub-btn-delete" data-id="${subId}">
                            <span class="icon is-small"><i class="fa-solid fa-trash-can"></i></span><span>Törlés</span>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

    // Félév haladása számítás
    const maxWeek = state.appSettings?.semesterLength || 14;
    const currentWeek = calculateCurrentWeek() > 0 ? calculateCurrentWeek() : 1;
    const felevSzazalek = Math.round((currentWeek / maxWeek) * 100);

    // 3. Teljes HTML struktúra (Konzisztens jobb oldali panellel)
    container.innerHTML = `
        <div class="dashboard-view subj-layout-wrapper">
            
            <!-- MOBIL CÍM (Csak mobilon látszik, legfelül) -->
            <div class="subj-mobile-header is-hidden-tablet px-4 pt-4">
                <h2 class="title is-4 mb-0">Tantárgyak</h2>
            </div>

            <!-- KÖZÉPSŐ OSZLOP (Fő tartalom) -->
            <div class="dash-center subj-main-column">
                
                <!-- ASZTALI CÍM (Mobilon elrejtve) -->
                <h2 class="title is-4 mb-4 is-hidden-mobile">Tantárgyak</h2>

                <div class="box mb-4 is-flex is-justify-content-space-between is-align-items-center subj-control-bar">
                    <button class="button is-small" id="sem-prev-btn" ${!hasPrev ? 'disabled' : ''}>
                        <span class="icon"><i class="fa-solid fa-chevron-left"></i></span><span class="btn-text">Régebbi</span>
                    </button>
                    <h3 class="title is-5 mb-0 has-text-info subj-semester-title">${localDisplayedSemester || 'Ismeretlen félév'}</h3>
                    <button class="button is-small" id="sem-next-btn" ${!hasNext ? 'disabled' : ''}>
                        <span class="btn-text">Újabb</span><span class="icon"><i class="fa-solid fa-chevron-right"></i></span>
                    </button>
                </div>

                <div class="columns is-multiline subj-cards-container">
                    ${subjectsHtml}
                </div>
            </div>

            <!-- JOBB OSZLOP (Gombok, Statisztika) -->
            <div class="dash-right subj-sidebar-column">
                <div class="buttons mb-4">
                    <button class="button is-link is-light is-fullwidth" id="dash-btn-add-sub">
                        <i class="fa-solid fa-plus mr-2"></i> Új Tárgy felvétele
                    </button>
                </div>
                
                <div class="box p-4 mb-4 subj-stat-box-flat">
                    <div class="is-flex is-justify-content-space-between mb-1">
                        <span class="is-size-7 has-text-weight-bold has-text-info is-uppercase">Félév haladása</span>
                        <span class="is-size-7 has-text-weight-bold has-text-info">${currentWeek}. Hét (${felevSzazalek}%)</span>
                    </div>
                    <progress class="progress is-info is-small mb-0" value="${felevSzazalek}" max="100">${felevSzazalek}%</progress>
                </div>

                <div class="box p-4 mb-4 subj-stat-box-solid">
                    <h3 class="title is-6 has-text-grey mb-3">Félév Statisztika</h3>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Tárgyak száma:</span>
                        <span class="tag is-info is-light has-text-weight-bold">${totalSubjectsCount} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between mb-2">
                        <span class="has-text-weight-semibold">Vizsgás tárgyak:</span>
                        <span class="tag is-danger is-light has-text-weight-bold">${examSubjectsCount} db</span>
                    </div>
                    <div class="is-flex is-justify-content-space-between">
                        <span class="has-text-weight-semibold">Évközi jegyes:</span>
                        <span class="tag is-success is-light has-text-weight-bold">${nonExamSubjectsCount} db</span>
                    </div>
                </div>

                <div class="box p-4 subj-stat-box-dashed">
                    <div id="sidebar-todo-widget">
                        <div class="has-text-centered py-3">
                            <div class="loader is-loading mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Teendők Widget Inicializálása
    renderSidebarTodosWidget();

    // 4. GOMBOK ESEMÉNYKEZELŐINEK BEKÖTÉSE (Minden más előtt, hogy biztosan működjön!)
    document.getElementById('dash-btn-add-sub')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        openAddSubjectModal(); 
    });

    document.getElementById('sem-prev-btn')?.addEventListener('click', () => {
        localDisplayedSemester = allSemesters[currentIndex + 1];
        renderSubjects(container);
    });

    document.getElementById('sem-next-btn')?.addEventListener('click', () => {
        localDisplayedSemester = allSemesters[currentIndex - 1];
        renderSubjects(container);
    });

    // Részletek, Szerkesztés, Törlés gombok
    document.querySelectorAll('.sub-btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            openViewSubjectModal(parseInt(e.currentTarget.dataset.id));
        });
    });

    document.querySelectorAll('.sub-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            deleteSubject(parseInt(e.currentTarget.dataset.id));
        });
    });

    // 5. Teendők Widget Inicializálása (Védett blokkban, hogy ne akassza meg az oldalt)
    try {
        renderSidebarTodosWidget();
    } catch (err) {
        console.error("Nem sikerült betölteni a Teendők widgetet a Tantárgyak oldalon:", err);
    }
}