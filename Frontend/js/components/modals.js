// js/components/modals.js

export function injectModals() {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = `
<!-- ========================================== -->
<!-- 2. ÚJ ZÁRTHELYI (ZH) MODAL -->
<!-- ========================================== -->
<div class="modal" id="add-zh-modal">
    <div class="modal-background" id="add-zh-bg"></div>
    <div class="modal-card">
        <input type="hidden" id="add-zh-id" value="">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold" id="add-zh-modal-title">
                <i class="fa-solid fa-file-pen has-text-grey-light mr-2"></i> Új Zárthelyi
            </p>
            <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="field">
                    <label class="label is-small">Tantárgy</label>
                    <div class="control"><div class="select is-fullwidth"><select id="add-zh-subject" class="has-text-weight-semibold"></select></div></div>
                </div>
                <div class="field mb-0">
                    <label class="label is-small">Oktatási Hét</label>
                    <div class="control"><input type="number" id="add-zh-week" class="input has-text-centered has-text-weight-bold" min="1" value="1"></div>
                </div>
            </div>
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="field">
                    <label class="label is-small" id="zh-modal-title">Dátum és Időpont</label>
                    <div class="control has-icons-left">
                        <input class="input" type="datetime-local" id="add-zh-dateof">
                        <span class="icon is-small is-left has-text-grey"><i class="fa-regular fa-calendar"></i></span>
                    </div>
                </div>
                <div class="field mb-0">
                    <label class="label is-small">Terem</label>
                    <div class="control has-icons-left">
                        <input class="input" type="text" id="add-zh-room" placeholder="Pl.: BA.F08">
                        <span class="icon is-small is-left has-text-grey"><i class="fa-solid fa-location-dot"></i></span>
                    </div>
                </div>
            </div>
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="columns is-mobile mb-0">
                    <div class="column is-7 field mb-0">
                        <label class="label is-small">Típus</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select id="add-zh-type"><option>Komplex</option><option>Előadás</option><option>Labor</option></select>
                            </div>
                        </div>
                    </div>
                    <div class="column is-5 field mb-0">
                        <label class="label is-small">Max pont</label>
                        <div class="control"><input class="input has-text-centered has-text-weight-bold" type="number" id="add-zh-maxpoints" value="100"></div>
                    </div>
                </div>
            </div>
            <div class="field mt-auto">
                <label class="label is-small">Megjegyzés</label>
                <div class="control"><textarea class="textarea" id="add-zh-notes" maxlength="250" rows="3" style="resize: none;"></textarea></div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between is-align-items-center">
            <button id="add-zh-cancel-btn" class="button is-ghost has-text-grey">Mégse</button>
            <button id="zh-modal-submit-btn" class="button is-link is-rounded px-6 has-text-weight-bold">
                <span class="icon mr-1"><i class="fa-solid fa-check"></i></span><span id="zh-modal-submit-text">Felvétel</span>
            </button>
        </footer>
    </div>
</div>

<!-- ========================================== -->
<!-- 3. ÚJ VIZSGA MODAL -->
<!-- ========================================== -->
<div class="modal" id="add-exam-modal">
    <div class="modal-background" id="add-exam-bg"></div>
    <div class="modal-card">
        <input type="hidden" id="add-exam-id" value="">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold" id="add-exam-title">
                <i class="fa-solid fa-graduation-cap has-text-grey-light mr-2"></i> Új Vizsga
            </p>
            <button class="delete" aria-label="close" id="add-exam-close"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="field">
                    <label class="label is-small">Tantárgy</label>
                    <div class="control"><div class="select is-fullwidth"><select id="add-exam-subject" class="has-text-weight-semibold"></select></div></div>
                </div>
                <div class="field mb-0">
                    <label class="label is-small">Vizsga Típusa</label>
                    <div class="control"><div class="select is-fullwidth"><select id="add-exam-type"><option>Írásbeli</option><option>Szóbeli</option><option>Komplex</option></select></div></div>
                </div>
            </div>
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="field">
                    <label class="label is-small">Dátum és Időpont</label>
                    <div class="control has-icons-left">
                        <input class="input" type="datetime-local" id="add-exam-dateof">
                        <span class="icon is-small is-left has-text-grey"><i class="fa-regular fa-calendar"></i></span>
                    </div>
                </div>
                <div class="field mb-0">
                    <label class="label is-small">Terem</label>
                    <div class="control has-icons-left">
                        <input class="input" type="text" id="add-exam-room" placeholder="Pl.: BA.F08">
                        <span class="icon is-small is-left has-text-grey"><i class="fa-solid fa-location-dot"></i></span>
                    </div>
                </div>
            </div>
            <div class="field mt-auto">
                <label class="label is-small">Megjegyzés</label>
                <div class="control"><textarea class="textarea" id="add-exam-notes" rows="3" style="resize: none;"></textarea></div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between is-align-items-center">
            <button id="add-exam-cancel-btn" class="button is-ghost has-text-grey">Mégse</button>
            <button id="exam-modal-submit-btn" class="button is-danger is-rounded px-6 has-text-weight-bold">
                <span class="icon mr-1"><i class="fa-solid fa-check"></i></span><span>Mentés</span>
            </button>
        </footer>
    </div>
</div>

<!-- ========================================== -->
<!-- 4. ÚJ TANTÁRGY MODAL -->
<!-- ========================================== -->
<div class="modal" id="add-subject-modal">
    <div class="modal-background" id="add-subject-bg"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold" id="add-sub-title">
                <i class="fa-solid fa-book-bookmark has-text-grey-light mr-2"></i> Új Tárgy
            </p>
            <button class="delete" aria-label="close" id="add-sub-cancel-btn"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="field">
                    <label class="label is-small">Tantárgy Neve</label>
                    <div class="control"><input class="input has-text-weight-semibold" type="text" id="add-sub-name" placeholder="Pl.: Hálózatok 1."></div>
                </div>
                <div class="field mb-0">
                    <label class="label is-small">Teljesítés módja</label>
                    <div class="control"><div class="select is-fullwidth"><select id="add-sub-completion"><option value="true">Vizsgás</option><option value="false">Évközi jegyes</option></select></div></div>
                </div>
            </div>
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <div class="columns is-mobile mb-0">
                    <div class="column is-6 field mb-0">
                        <label class="label is-small">Kredit</label>
                        <div class="control"><input class="input has-text-centered has-text-weight-bold" type="number" id="add-sub-credits" value="0"></div>
                    </div>
                    <div class="column is-6 field mb-0">
                        <label class="label is-small">ZH-k száma</label>
                        <div class="control"><input class="input has-text-centered has-text-weight-bold" type="number" id="add-sub-zhcount" value="0"></div>
                    </div>
                </div>
            </div>
            <div class="field mt-auto">
                <label class="label is-small">Leírás / Megjegyzés</label>
                <div class="control"><textarea class="textarea" id="add-sub-notes" rows="4" maxlength="250" style="resize: none;"></textarea></div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between is-align-items-center">
            <button class="button is-ghost has-text-grey" id="add-sub-cancel-btn-bottom">Mégse</button>
            <button class="button is-link is-rounded px-6 has-text-weight-bold" id="add-sub-submit">
                <span class="icon mr-1"><i class="fa-solid fa-check"></i></span><span id="add-sub-submit-text">Felvétel</span>
            </button>
        </footer>
    </div>
</div>

<!-- ========================================== -->
<!-- 5. EGYÉB KISEBB MODÁLOK (View-k és Utility-k) -->
<!-- ========================================== -->
<div class="modal" id="view-zh-modal">
    <div class="modal-background" id="view-zh-bg"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold" id="view-zh-title">ZH Részletei</p>
            <button class="delete" aria-label="close" id="view-zh-cancel-btn"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <h1 id="view-zh-subject" class="title is-4 mb-4">ZH neve</h1>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-regular fa-calendar"></i></span><span id="view-zh-dateof">Dátum</span></div>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-solid fa-location-dot"></i></span><span id="view-zh-room">Terem</span></div>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-solid fa-layer-group"></i></span><span id="view-zh-type">Típus</span></div>
                <hr class="my-3">
                <div class="columns is-mobile is-vcentered m-0">
                    <div class="column is-half p-0"><p class="heading">Max Pont</p><p class="title is-3" id="view-zh-maxpoints">100</p></div>
                    <div class="column is-half p-0"><p class="heading">Oktatási Hét</p><p class="title is-3" id="view-zh-week">1</p></div>
                </div>
            </div>
            <div class="field mt-auto">
                <label class="label is-small">Megjegyzés</label>
                <div class="box is-shadowless p-4" style="background-color: var(--bulma-background); border: 1px solid var(--bulma-border); min-height: 80px;">
                    <div id="view-zh-notes" style="white-space: pre-wrap;"></div>
                </div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between">
            <button id="view-zh-delete-btn" class="button is-danger is-light px-5">Törlés</button>
            <button id="view-zh-edit-btn" class="button is-link px-5">Szerkesztés</button>
        </footer>
    </div>
</div>

<div class="modal" id="view-exam-modal">
    <div class="modal-background" id="view-exam-bg"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold">Vizsga Részletei</p>
            <button class="delete" aria-label="close" id="view-exam-cancel-btn"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <h1 id="view-exam-subject" class="title is-4 mb-4">Tantárgy</h1>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-regular fa-calendar"></i></span><span id="view-exam-dateof">Dátum</span></div>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-solid fa-location-dot"></i></span><span id="view-exam-room">Terem</span></div>
                <div class="is-flex is-align-items-center"><span class="icon mr-3"><i class="fa-solid fa-layer-group"></i></span><span id="view-exam-type">Típus</span></div>
            </div>
            <div class="field mt-auto">
                <label class="label is-small">Megjegyzés</label>
                <div class="box is-shadowless p-4" style="background-color: var(--bulma-background); border: 1px solid var(--bulma-border); min-height: 80px;">
                    <div id="view-exam-notes" style="white-space: pre-wrap;"></div>
                </div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between">
            <button id="view-exam-delete-btn" class="button is-danger is-light px-5">Törlés</button>
            <button id="view-exam-edit-btn" class="button is-link px-5">Szerkesztés</button>
        </footer>
    </div>
</div>

<div class="modal" id="clear-db-modal">
    <div class="modal-background" id="clear-db-bg"></div>
    <div class="modal-card">
        <header class="modal-card-head has-background-danger">
            <p class="modal-card-title has-text-white has-text-weight-bold">Adatok Végleges Törlése</p>
            <button class="delete" aria-label="close" id="clear-db-close-btn"></button>
        </header>
        <section class="modal-card-body">
            <p class="mb-4">Válaszd ki, hogy mit szeretnél <strong>véglegesen</strong> törölni:</p>
            <div class="box">
                <label class="checkbox is-block mb-3"><input type="checkbox" id="clear-cb-timetable"> Órarend</label>
                <label class="checkbox is-block mb-3"><input type="checkbox" id="clear-cb-subjects"> Tantárgyak</label>
                <label class="checkbox is-block mb-3"><input type="checkbox" id="clear-cb-zhs"> Zárthelyik (ZH-k)</label>
                <label class="checkbox is-block"><input type="checkbox" id="clear-cb-exams"> Vizsgák</label>
            </div>
        </section>
        <footer class="modal-card-foot" style="justify-content: flex-end;">
            <button class="button is-danger" id="clear-db-confirm-btn">Kijelöltek törlése</button>
            <button class="button" id="clear-db-cancel-btn">Mégse</button>
        </footer>
    </div>
</div>
<!-- ========================================== -->
<!-- ÚJ ESEMÉNY / ÓRA MODAL -->
<!-- ========================================== -->
<div class="modal" id="add-class-modal">
    <div class="modal-background"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold"><i class="fa-solid fa-calendar-plus mr-2 has-text-grey-light"></i> Új Esemény</p>
            <button class="delete" aria-label="close" id="add-class-close-btn"></button>
        </header>
        <section class="modal-card-body">
            <div class="tabs is-toggle is-fullwidth is-small mb-4">
                <ul id="add-class-type-toggle">
                    <li class="is-active" data-type="subject"><a><span>Tantárgyi óra</span></a></li>
                    <li data-type="custom"><a><span>Egyéni esemény</span></a></li>
                </ul>
            </div>
            
            <div id="add-class-subject-container" class="field">
                <label class="label is-small">Tantárgy</label>
                <div class="control">
                    <div class="select is-fullwidth">
                        <select id="add-class-subject-dropdown" class="has-text-weight-semibold"></select>
                    </div>
                </div>
            </div>
            
            <div id="add-class-custom-container" class="field is-hidden">
                <label class="label is-small">Esemény neve</label>
                <div class="control">
                    <input class="input has-text-weight-semibold" type="text" id="add-class-custom-name" placeholder="Pl.: Csoporttalálkozó">
                </div>
            </div>

            <div class="columns is-mobile mb-0">
                <div class="column is-6 field mb-3">
                    <label class="label is-small">Nap</label>
                    <div class="control">
                        <div class="select is-fullwidth">
                            <select id="add-class-day">
                                <option value="1">Hétfő</option>
                                <option value="2">Kedd</option>
                                <option value="3">Szerda</option>
                                <option value="4">Csütörtök</option>
                                <option value="5">Péntek</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="column is-6 field mb-3">
                    <label class="label is-small">Terem</label>
                    <div class="control has-icons-left">
                        <input class="input" type="text" id="add-class-room" placeholder="Pl.: BA.F08">
                        <span class="icon is-small is-left has-text-grey"><i class="fa-solid fa-location-dot"></i></span>
                    </div>
                </div>
            </div>

            <div class="columns is-mobile mb-0">
                <div class="column is-6 field mb-3">
                    <label class="label is-small">Kezdés</label>
                    <div class="control"><input class="input" type="time" id="add-class-start"></div>
                </div>
                <div class="column is-6 field mb-3">
                    <label class="label is-small">Vége</label>
                    <div class="control"><input class="input" type="time" id="add-class-end"></div>
                </div>
            </div>
            
            <div class="columns is-mobile">
                <div class="column is-8 field">
                    <label class="label is-small">Típus</label>
                    <div class="control">
                        <div class="select is-fullwidth">
                            <select id="add-class-type">
                                <option value="Előadás">Előadás</option>
                                <option value="Gyakorlat">Gyakorlat</option>
                                <option value="Labor">Labor</option>
                                <option value="Egyéb">Egyéb</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="column is-4 field">
                    <label class="label is-small">Szín</label>
                    <div class="control">
                        <input class="input p-1" type="color" id="add-class-color" value="#3b82f6" style="height: 36px; cursor: pointer;">
                    </div>
                </div>
            </div>
            <div class="field">
                <label class="label is-small">Megjegyzés</label>
                <div class="control"><textarea class="textarea" id="add-class-notes" rows="2" style="resize: none;"></textarea></div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between">
            <button class="button is-ghost has-text-grey" id="add-class-cancel-btn-bottom">Mégse</button>
            <button class="button is-link is-rounded px-6 has-text-weight-bold" id="add-class-submit-btn">
                <span class="icon mr-1"><i class="fa-solid fa-check"></i></span><span>Mentés</span>
            </button>
        </footer>
    </div>
</div>

<!-- ========================================== -->
<!-- ÓRA RÉSZLETEI MODAL (View Class) -->
<!-- ========================================== -->
<div class="modal" id="view-class-modal">
    <div class="modal-background"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold">Óra részletei</p>
            <button class="delete" aria-label="close" id="view-class-close-btn"></button>
        </header>
        <section class="modal-card-body">
            <div class="box is-shadowless mb-4" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                <h1 id="detail-class-title" class="title is-4 mb-4">Esemény neve</h1>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-regular fa-clock"></i></span><span id="detail-class-time" class="has-text-weight-medium">Időpont</span></div>
                <div class="is-flex is-align-items-center mb-3"><span class="icon mr-3"><i class="fa-solid fa-location-dot"></i></span><span id="detail-class-room">Terem</span></div>
                <div class="is-flex is-align-items-center"><span class="icon mr-3"><i class="fa-solid fa-layer-group"></i></span><span id="detail-class-type">Típus</span></div>
            </div>
            
            <div class="field mt-4">
                <label class="label is-small">Megjegyzés</label>
                <div class="control"><textarea class="textarea" id="detail-class-notes" rows="3" placeholder="Ide írhatsz jegyzetet az órához..."></textarea></div>
            </div>
        </section>
        <footer class="modal-card-foot is-flex is-justify-content-space-between">
            <button class="button is-danger is-light px-4" id="detail-class-delete-btn">Törlés</button>
            <div>
                <button class="button is-warning is-light mr-2" id="view-class-to-zh-btn" title="ZH kiírása ebből az órából">
                    <span class="icon"><i class="fa-solid fa-file-pen"></i></span>
                </button>
                <button class="button is-link px-5" id="view-class-save-btn">Mentés</button>
            </div>
        </footer>
    </div>
</div>
    
<!-- ========================================== -->
<!-- SZINKRONIZÁLÁSI FOLYAMAT MODAL -->
<!-- ========================================== -->
<div class="modal" id="sync-progress-modal">
    <div class="modal-background"></div>
    <div class="modal-content" style="max-width: 400px; width: 90%;">
        <div class="box has-text-centered py-6 px-5" style="border-radius: 12px; border: 1px solid var(--bulma-border);">
            <h3 class="title is-4 has-text-link mb-5" id="sync-modal-title">Szinkronizálás...</h3>
            <div id="sync-loading-spinner" class="loader is-loading is-large mx-auto mb-5" style="height: 3em; width: 3em;"></div>
            <p id="sync-modal-message" class="has-text-grey is-size-6 mb-5">A Neptun adatok letöltése folyamatban van. Kérlek, várj...</p>
            <button class="button is-link is-hidden px-6 has-text-weight-bold" id="sync-modal-close-btn" style="border-radius: 8px;">Rendben</button>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- HIÁNYZÓ ICS LINK MODAL -->
<!-- ========================================== -->
<div class="modal" id="missing-link-modal">
    <div class="modal-background"></div>
    <div class="modal-content" style="max-width: 450px; width: 90%;">
        <div class="box p-5" style="border-radius: 12px; border: 1px solid var(--bulma-border);">
            <div class="is-flex is-align-items-center mb-4">
                <span class="icon is-large has-text-warning-dark mr-3"><i class="fa-solid fa-link-slash fa-2x"></i></span>
                <h3 class="title is-4 m-0 has-text-warning-dark">Hiányzó Link</h3>
            </div>
            <p class="mb-3 has-text-weight-medium">Nem adtál még meg Neptun naptár (ICS) linket, így nincs mit szinkronizálni!</p>
            <p class="is-size-7 has-text-grey mb-5">Kérlek, navigálj a beállításokhoz, és illeszd be a Neptunból kimásolt URL-t.</p>
            
            <div class="is-flex is-justify-content-flex-end is-align-items-center" style="gap: 10px;">
                <button class="button is-ghost has-text-grey" id="missing-link-cancel-btn">Mégse</button>
                <button class="button is-warning has-text-weight-bold" id="missing-link-settings-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-gear mr-2"></i> Beállítások
                </button>
            </div>
        </div>
    </div>
</div>

`;
}