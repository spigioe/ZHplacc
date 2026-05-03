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
    <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 450px; margin: 0;">
        <div class="box p-5" style="border-radius: 12px; border: 1px solid var(--bulma-border); box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;">
            
            <!-- Bezárás X gomb a jobb felső sarokban -->
            <button class="delete is-medium close-modal" aria-label="close" id="view-class-close-btn" style="position: absolute; top: 15px; right: 15px; z-index: 2;"></button>

            <!-- Fejléc Ikonnal -->
            <div class="is-flex is-align-items-center mb-5 pb-3" style="border-bottom: 1px solid var(--bulma-border);">
                <span class="icon is-large has-text-primary-dark mr-3"><i class="fa-regular fa-clock fa-2x"></i></span>
                <div>
                    <p class="is-size-7 has-text-grey has-text-weight-bold is-uppercase mb-1">Óra részletei</p>
                    <h3 class="title is-4 m-0 has-text-dark" id="detail-class-title" style="line-height: 1.2;">Esemény neve</h3>
                </div>
            </div>

            <!-- Adatok -->
            <div class="mb-4">
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-regular fa-calendar-check mr-2"></i> Időpont:</span>
                    <span class="has-text-weight-bold" id="detail-class-time">Időpont</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-location-dot mr-2"></i> Terem:</span>
                    <span class="has-text-weight-bold" id="detail-class-room">Terem</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-layer-group mr-2"></i> Típus:</span>
                    <span class="tag is-primary is-light has-text-weight-bold" id="detail-class-type" style="border-radius: 6px;">Típus</span>
                </div>
            </div>

            <!-- Megjegyzések (Szerkeszthető Textarea) -->
            <div class="field mb-5">
                <label class="label is-small has-text-grey"><i class="fa-regular fa-comment-dots mr-1"></i> Megjegyzés ehhez az órához</label>
                <div class="control">
                    <textarea class="textarea is-small" id="detail-class-notes" rows="3" placeholder="Ide írhatsz jegyzetet, ami csak ehhez az órához tartozik..." style="border-radius: 8px; border-color: var(--bulma-border);"></textarea>
                </div>
            </div>

            <!-- Gombok -->
            <div class="is-flex is-justify-content-space-between is-align-items-center">
                <button class="button is-danger is-light has-text-weight-bold" id="detail-class-delete-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-trash-can mr-2"></i> Törlés
                </button>
                <div class="is-flex" style="gap: 8px;">
                    <button class="button is-warning is-light has-text-weight-bold px-3" id="view-class-to-zh-btn" title="ZH kiírása ebből az órából" style="border-radius: 8px;">
                        <span class="icon"><i class="fa-solid fa-file-pen"></i></span>
                    </button>
                    <button class="button is-link has-text-weight-bold px-5" id="view-class-save-btn" style="border-radius: 8px;">
                        Mentés
                    </button>
                </div>
            </div>
            
        </div>
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


<!-- ========================================== -->
<!-- ÚJ, STÍLUSOS TANTÁRGY RÉSZLETEK MODAL -->
<!-- ========================================== -->
<div class="modal" id="view-subject-modal">
    <div class="modal-background"></div>
    <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 450px; margin: 0;">
        <div class="box p-5" style="border-radius: 12px; border: 1px solid var(--bulma-border); box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;">
            
            <!-- Bezárás X gomb a jobb felső sarokban -->
            <button class="delete is-medium close-modal" aria-label="close" style="position: absolute; top: 15px; right: 15px; z-index: 2;"></button>

            <!-- Fejléc Ikonnal -->
            <div class="is-flex is-align-items-center mb-5 pb-3" style="border-bottom: 1px solid var(--bulma-border);">
                <span class="icon is-large has-text-info mr-3"><i class="fa-solid fa-book-open fa-2x"></i></span>
                <h3 class="title is-4 m-0 has-text-info-dark" id="view-sub-name" style="line-height: 1.2;">Tárgynév</h3>
            </div>

            <!-- Adatok -->
            <div class="mb-5">
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-coins mr-2"></i> Kreditérték:</span>
                    <span class="tag is-info is-light is-medium has-text-weight-bold" id="view-sub-credits" style="border-radius: 6px;">0</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-pen-ruler mr-2"></i> Számonkérések:</span>
                    <span class="tag is-warning is-light is-medium has-text-weight-bold" id="view-sub-zhcount" style="border-radius: 6px;">0 ZH</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-check-double mr-2"></i> Teljesítés:</span>
                    <span class="tag is-primary is-light is-medium has-text-weight-bold" id="view-sub-completion" style="border-radius: 6px;">Évközi</span>
                </div>
            </div>
            
            <!-- Megjegyzések -->
            <h4 class="title is-6 mb-2 has-text-grey-dark"><i class="fa-regular fa-comment-dots mr-2"></i> Megjegyzések</h4>
            <div class="box p-4 has-background-light is-shadowless mb-5" style="border: 1px solid var(--bulma-border); border-radius: 8px;">
                <p id="view-sub-notes" class="is-size-7 has-text-grey-dark" style="white-space: pre-wrap; margin: 0;"></p>
            </div>
            
            <!-- Gombok -->
            <div class="is-flex is-justify-content-flex-end is-align-items-center" style="gap: 10px;">
                <button class="button is-ghost has-text-grey close-modal">Bezárás</button>
                <button class="button is-link has-text-weight-bold" id="view-sub-edit-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-pen mr-2"></i> Szerkesztés
                </button>
            </div>
            
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- ZH RÉSZLETEK MODAL -->
<!-- ========================================== -->
<div class="modal" id="view-zh-modal">
    <div class="modal-background" id="view-zh-bg"></div>
    <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 450px; margin: 0;">
        <div class="box p-5" style="border-radius: 12px; border: 1px solid var(--bulma-border); box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;">
            
            <!-- Fejléc / Cím -->
            <button class="delete is-medium close-modal" aria-label="close" id="view-zh-cancel-btn" style="position: absolute; top: 15px; right: 15px; z-index: 2;"></button>
            
            <div class="is-flex is-align-items-center mb-5 pb-3" style="border-bottom: 1px solid var(--bulma-border);">
                <span class="icon is-large has-text-warning-dark mr-3"><i class="fa-solid fa-file-signature fa-2x"></i></span>
                <div>
                    <p class="is-size-7 has-text-grey has-text-weight-bold is-uppercase mb-1" id="view-zh-title">ZH Részletei</p>
                    <h3 class="title is-4 m-0 has-text-dark" id="view-zh-subject" style="line-height: 1.2;">ZH neve</h3>
                </div>
            </div>

            <!-- Adatok -->
            <div class="mb-5">
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-regular fa-calendar mr-2"></i> Dátum:</span>
                    <span class="has-text-weight-bold" id="view-zh-dateof">Dátum</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-location-dot mr-2"></i> Terem:</span>
                    <span class="has-text-weight-bold" id="view-zh-room">Terem</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-layer-group mr-2"></i> Típus:</span>
                    <span class="tag is-warning is-light has-text-weight-bold" id="view-zh-type" style="border-radius: 6px;">Típus</span>
                </div>
            </div>

            <!-- Dobozok (Max pont, Hét) -->
            <div class="columns is-mobile mb-4">
                <div class="column is-half">
                    <div class="box p-3 has-text-centered has-background-light is-shadowless" style="border: 1px solid var(--bulma-border); border-radius: 8px;">
                        <p class="heading mb-1">Max Pont</p>
                        <p class="title is-4 has-text-info" id="view-zh-maxpoints">100</p>
                    </div>
                </div>
                <div class="column is-half">
                    <div class="box p-3 has-text-centered has-background-light is-shadowless" style="border: 1px solid var(--bulma-border); border-radius: 8px;">
                        <p class="heading mb-1">Oktatási Hét</p>
                        <p class="title is-4 has-text-primary" id="view-zh-week">1</p>
                    </div>
                </div>
            </div>

            <!-- Megjegyzések -->
            <div class="field mb-5">
                <label class="label is-small has-text-grey"><i class="fa-regular fa-comment-dots mr-1"></i> Megjegyzés</label>
                <div class="box p-3 has-background-light is-shadowless" style="border: 1px solid var(--bulma-border); border-radius: 8px; min-height: 80px;">
                    <p id="view-zh-notes" class="is-size-7 has-text-grey-dark m-0" style="white-space: pre-wrap;"></p>
                </div>
            </div>

            <!-- Gombok -->
            <div class="is-flex is-justify-content-space-between is-align-items-center">
                <button class="button is-danger is-light has-text-weight-bold" id="view-zh-delete-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-trash-can mr-2"></i> Törlés
                </button>
                <button class="button is-link has-text-weight-bold" id="view-zh-edit-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-pen mr-2"></i> Szerkesztés
                </button>
            </div>
            
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- VIZSGA RÉSZLETEK MODAL -->
<!-- ========================================== -->
<div class="modal" id="view-exam-modal">
    <div class="modal-background" id="view-exam-bg"></div>
    <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 450px; margin: 0;">
        <div class="box p-5" style="border-radius: 12px; border: 1px solid var(--bulma-border); box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;">
            
            <!-- Fejléc / Cím -->
            <button class="delete is-medium close-modal" aria-label="close" id="view-exam-cancel-btn" style="position: absolute; top: 15px; right: 15px; z-index: 2;"></button>
            
            <div class="is-flex is-align-items-center mb-5 pb-3" style="border-bottom: 1px solid var(--bulma-border);">
                <span class="icon is-large has-text-danger mr-3"><i class="fa-solid fa-graduation-cap fa-2x"></i></span>
                <div>
                    <p class="is-size-7 has-text-grey has-text-weight-bold is-uppercase mb-1">Vizsga Részletei</p>
                    <h3 class="title is-4 m-0 has-text-dark" id="view-exam-subject" style="line-height: 1.2;">Tantárgy</h3>
                </div>
            </div>

            <!-- Adatok -->
            <div class="mb-5">
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-regular fa-calendar mr-2"></i> Dátum:</span>
                    <span class="has-text-weight-bold" id="view-exam-dateof">Dátum</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-location-dot mr-2"></i> Terem:</span>
                    <span class="has-text-weight-bold" id="view-exam-room">Terem</span>
                </div>
                
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                    <span class="has-text-grey has-text-weight-medium"><i class="fa-solid fa-layer-group mr-2"></i> Típus:</span>
                    <span class="tag is-danger is-light has-text-weight-bold" id="view-exam-type" style="border-radius: 6px;">Típus</span>
                </div>
            </div>

            <!-- Megjegyzések -->
            <div class="field mb-5">
                <label class="label is-small has-text-grey"><i class="fa-regular fa-comment-dots mr-1"></i> Megjegyzés</label>
                <div class="box p-3 has-background-light is-shadowless" style="border: 1px solid var(--bulma-border); border-radius: 8px; min-height: 80px;">
                    <p id="view-exam-notes" class="is-size-7 has-text-grey-dark m-0" style="white-space: pre-wrap;"></p>
                </div>
            </div>

            <!-- Gombok -->
            <div class="is-flex is-justify-content-space-between is-align-items-center">
                <button class="button is-danger is-light has-text-weight-bold" id="view-exam-delete-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-trash-can mr-2"></i> Törlés
                </button>
                <button class="button is-link has-text-weight-bold" id="view-exam-edit-btn" style="border-radius: 8px;">
                    <i class="fa-solid fa-pen mr-2"></i> Szerkesztés
                </button>
            </div>
            
        </div>
    </div>
</div>
`;
}