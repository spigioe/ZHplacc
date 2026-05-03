// js/components/modals.js

export function injectModals() {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = `
<!-- ========================================== -->
<!-- 1. BEÁLLÍTÁSOK MODAL -->
<!-- ========================================== -->
<div class="modal" id="settings-modal">
    <div class="modal-background" id="settings-bg"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title has-text-weight-bold">
                <i class="fa-solid fa-gear has-text-grey-light mr-2"></i> Beállítások
            </p>
            <button class="delete" aria-label="close" id="settings-close"></button>
        </header>
        
        <div class="tabs is-centered is-boxed is-fullwidth mb-0 pt-3" style="background-color: var(--bulma-background-light);">
            <ul id="settings-tabs">
                <li class="is-active" data-target="settings-tab-system">
                    <a><span class="icon is-small"><i class="fa-solid fa-sliders"></i></span><span>Rendszer</span></a>
                </li>
                <li data-target="settings-tab-account">
                    <a><span class="icon is-small"><i class="fa-solid fa-user"></i></span><span>Fiókom</span></a>
                </li>
            </ul>
        </div>

        <section class="modal-card-body p-0" style="overflow-x: hidden;">
            <!-- RENDSZER FÜL -->
            <div id="settings-tab-system" class="p-5">
                <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                    <h3 class="title is-6 has-text-grey is-uppercase mb-4" style="letter-spacing: 1px; font-size: 0.75rem;">
                        <i class="fa-solid fa-calendar-days mr-2"></i> Oktatási Időszak
                    </h3>
                    <div class="columns is-mobile mb-0">
                        <div class="column is-half field mb-0">
                            <label class="label is-small">Hét eltolás</label>
                            <div class="control">
                                <input class="input has-text-centered has-text-weight-bold" type="number" id="setting-week-offset" value="0">
                            </div>
                        </div>
                        <div class="column is-half field mb-0">
                            <label class="label is-small">Félév hossza (Hét)</label>
                            <div class="control">
                                <input class="input has-text-centered has-text-weight-bold" type="number" id="setting-semester-length" value="14">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="box is-shadowless mb-6" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                    <h3 class="title is-6 has-text-grey is-uppercase mb-4" style="letter-spacing: 1px; font-size: 0.75rem;">
                        <i class="fa-solid fa-cloud-arrow-down mr-2"></i> Neptun Szinkronizáció
                    </h3>
                    <div class="field">
                        <label class="label is-small">Naptár (ICS) Link</label>
                        <div class="control has-icons-left">
                            <input class="input" type="text" id="setting-neptun-ics" placeholder="https://neptun.hu/...">
                            <span class="icon is-small is-left has-text-grey"><i class="fa-solid fa-link"></i></span>
                        </div>
                    </div>
                    <button class="button is-info is-light is-fullwidth has-text-weight-bold mt-4" id="sync-now-btn">
                        <i class="fa-solid fa-rotate mr-2"></i> Szinkronizálás most
                    </button>
                </div>

                <div class="box is-shadowless mt-auto" style="border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05);">
                    <h3 class="title is-6 has-text-danger is-uppercase mb-4" style="letter-spacing: 1px; font-size: 0.75rem;">
                        <i class="fa-solid fa-triangle-exclamation mr-2"></i> Veszélyzóna
                    </h3>
                    <div class="buttons is-flex-direction-column">
                        <button class="button is-warning is-light is-fullwidth mb-3" id="reset-settings-btn" style="justify-content: flex-start;">
                            <span class="icon"><i class="fa-solid fa-rotate-left"></i></span><span>Alapértelmezett beállítások</span>
                        </button>
                        <button class="button is-danger is-fullwidth has-text-weight-bold" id="clear-all-btn" style="justify-content: flex-start;">
                            <span class="icon"><i class="fa-solid fa-trash-can"></i></span><span>ÖSSZES ADAT TÖRLÉSE</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- FIÓKOM FÜL -->
            <div id="settings-tab-account" class="p-5 is-hidden">
                <div class="box is-shadowless mb-5" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                    <h3 class="title is-6 has-text-grey is-uppercase mb-4" style="letter-spacing: 1px; font-size: 0.75rem;">
                        <i class="fa-solid fa-address-card mr-2"></i> Személyes Adatok
                    </h3>
                    
                    <div class="is-flex is-align-items-center mb-4 pb-4" style="border-bottom: 1px solid var(--bulma-border);">
                        <div class="mr-4" style="position: relative; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background-color: var(--bulma-border); flex-shrink: 0;">
                            <img id="setting-profile-pic-preview" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                            <div id="setting-profile-pic-placeholder" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: var(--bulma-link); color: white; font-weight: bold; font-size: 1.5rem;">ZH</div>
                        </div>
                        <div class="is-flex-grow-1">
                            <div class="file is-small is-info is-light">
                                <label class="file-label">
                                    <input class="file-input" type="file" id="setting-profile-pic-upload" accept="image/png, image/jpeg">
                                    <span class="file-cta">
                                        <span class="file-icon"><i class="fa-solid fa-upload"></i></span>
                                        <span class="file-label">Kép módosítása...</span>
                                    </span>
                                </label>
                            </div>
                            <input type="hidden" id="setting-profile-pic-base64">
                        </div>
                    </div>

                    <div class="field">
                        <label class="label is-small">Teljes Név</label>
                        <div class="control has-icons-left">
                            <input class="input has-text-weight-semibold" type="text" id="setting-account-name" placeholder="Pl.: Kiss Péter">
                            <span class="icon is-small is-left"><i class="fa-solid fa-user"></i></span>
                        </div>
                    </div>
                    <div class="field">
                        <label class="label is-small">Email cím</label>
                        <div class="control has-icons-left">
                            <input class="input" type="email" id="setting-account-email">
                            <span class="icon is-small is-left"><i class="fa-solid fa-envelope"></i></span>
                        </div>
                    </div>
                    <button class="button is-link is-light is-fullwidth has-text-weight-bold mt-4" id="save-profile-btn">Adatok frissítése</button>
                </div>

                <div class="box is-shadowless mb-2" style="border: 1px solid var(--bulma-border); background: var(--bulma-background);">
                    <h3 class="title is-6 has-text-grey is-uppercase mb-4" style="letter-spacing: 1px; font-size: 0.75rem;">
                        <i class="fa-solid fa-lock mr-2"></i> Jelszó módosítása
                    </h3>
                    <div class="field">
                        <label class="label is-small">Jelenlegi jelszó</label>
                        <div class="control has-icons-left">
                            <input class="input" type="password" id="setting-old-password" placeholder="******">
                            <span class="icon is-small is-left"><i class="fa-solid fa-key"></i></span>
                        </div>
                    </div>
                    <div class="field">
                        <label class="label is-small">Új jelszó</label>
                        <div class="control has-icons-left">
                            <input class="input" type="password" id="setting-new-password" placeholder="Legalább 6 karakter">
                            <span class="icon is-small is-left"><i class="fa-solid fa-asterisk"></i></span>
                        </div>
                    </div>
                    <button class="button is-warning is-light is-fullwidth has-text-weight-bold mt-4" id="save-password-btn">Jelszó megváltoztatása</button>
                </div>
            </div>
        </section>
        
        <footer class="modal-card-foot is-flex is-justify-content-space-between is-align-items-center">
            <button id="settings-cancel-btn" class="button is-ghost has-text-grey">Mégse</button>
            <button id="save-settings-btn" class="button is-link is-rounded px-6 has-text-weight-bold">
                <span class="icon mr-1"><i class="fa-solid fa-check"></i></span><span>Rendszer Mentése</span>
            </button>
        </footer>
    </div>
</div>

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
    `;
}