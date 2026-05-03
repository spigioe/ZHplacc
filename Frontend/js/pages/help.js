// js/pages/help.js

export async function renderHelp(container) {
    container.innerHTML = `
        <div style="display: block; width: 100%; height: 100%; overflow-y: auto; padding-bottom: 50px;">
            <div style="max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem;">
                
                <div class="has-text-centered mb-6">
                    <span class="icon is-large has-text-info mb-2"><i class="fa-solid fa-circle-question fa-2x"></i></span>
                    <h1 class="title is-3 mb-2 has-text-weight-bold">Súgó és Tudástár</h1>
                    <p class="subtitle is-6 has-text-grey">Minden, amit a platZH használatáról tudni érdemes.</p>
                </div>

                <!-- 1. NEPTUN ICS ÚTMUTATÓ -->
                <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border); border-left: 4px solid var(--bulma-info);">
                    <h3 class="title is-5 mb-4 has-text-grey-dark">
                        <i class="fa-solid fa-cloud-arrow-down mr-2 has-text-info"></i> Hogyan szinkronizáljam a Neptun órarendem?
                    </h3>
                    <p class="mb-4">Ahhoz, hogy a platZH automatikusan lássa az óráidat, meg kell adnod egy úgynevezett <strong>ICS naptár linket</strong>. Ezt a Neptunból tudod kinyerni az alábbi módon:</p>
                    
                    <div class="content">
                        <ol>
                            <li class="mb-2">Jelentkezz be a <strong>Neptun</strong> felületére.</li>
                            <li class="mb-2">A felső menüben válaszd a <strong>Naptár</strong> menüpontot.</li>
                            <li class="mb-2">A megjelenő órarend felett van a <strong>Naptár kezelése</strong> gomb. Erre nyomj rá.</li>
                            <li class="mb-2">A legördülő menüben válaszd ki a <strong>Feliratkozási link másolása</strong> gombot.</li>
                            <li class="mb-2">Onnan másold ki a teljes linket!</li>
                            <li class="mb-2">Gyere vissza a platZH-ba, nyisd meg a <strong>Beállítások</strong> menüt, és illeszd be a <em>Naptár (ICS) Link</em> mezőbe.</li>
                            <li>Kattints a mentésre, majd a Szinkronizálásra!</li>
                        </ol>
                    </div>
                </div>

                <!-- 2. TANTÁRGYAK ÉS ZH-K -->
                <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border);">
                    <h3 class="title is-5 mb-4 has-text-grey-dark">
                        <i class="fa-solid fa-file-pen mr-2 has-text-warning-dark"></i> Tantárgyak és Számonkérések
                    </h3>
                    <p class="mb-3">A sikeres szinkronizálás után az alkalmazás automatikusan felismeri a tantárgyaidat az órarendből. </p>
                    <p>Ha beírsz egy új <strong>Zárthelyit (ZH)</strong> vagy <strong>Vizsgát</strong>, az egyből megjelenik a vezérlőpultodon, kiszámolva, hogy mennyi időd van még hátra a felkészülésre.</p>
                </div>

                <!-- 3. EGYÉNI ÓRÁK -->
                <div class="box mb-5 p-5" style="border: 1px solid var(--bulma-border);">
                    <h3 class="title is-5 mb-4 has-text-grey-dark">
                        <i class="fa-solid fa-calendar-plus mr-2 has-text-link"></i> Egyéni események az órarendben
                    </h3>
                    <p>Az órarend nézetben a <strong>+ Új esemény</strong> gombra kattintva saját, egyéni elfoglaltságokat (pl. Csoporttalálkozó, Edzés, Konzultáció) is felvihetsz. Ezek pontosan úgy jelennek meg, mint a hagyományos egyetemi órák.</p>
                </div>

            </div>
        </div>
    `;
}