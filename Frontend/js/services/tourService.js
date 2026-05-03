// js/services/tourService.js
import { state } from '../core/state.js';
import { apiFetch } from '../core/api.js';

export function checkAndRunTour() {
    // Ellenőrizzük az adatbázisból betöltött értéket
    // Kifejezetten a "true"-t keressük, és ha egyáltalán nincs state.appSettings, 
    // akkor is true-nak vesszük (fallback)
    const isFirst = state.appSettings ? state.appSettings.isFirstLogin : false;

    if (isFirst === true) {
        // Ellenőrizzük, hogy nincs-e már megnyitva a modál
        if (!document.getElementById("onboarding-tour-modal")) {
            startTour();
        }
    }
}

function startTour() {
    const steps = [
        {
            title: "Üdvözlünk a platZH-ban! 🎉",
            icon: "fa-solid fa-hand-sparkles has-text-warning",
            content: "Nagyon örülünk, hogy itt vagy! Ez a te új, okos egyetemi asszisztensed, ami segít túlélni a félévet anélkül, hogy elvesznél a határidőkben."
        },
        {
            title: "Tájékozódás az appban 🧭",
            icon: "fa-solid fa-compass has-text-link",
            content: "A bal oldali menüben (mobilon az alsó sávban) találod a főbb funkciókat: az <b>Órarended</b>, a <b>Tantárgyaid</b>, és ami a legfontosabb: a <b>Számonkéréseket (ZH/Vizsga)</b> és a Teendőket."
        },
        {
            title: "A legfontosabb lépés ⚡",
            icon: "fa-solid fa-cloud-arrow-down has-text-info",
            content: `Ahhoz, hogy az app automatikusan felépítse a naptáradat, meg kell adnod egy <strong>Neptun ICS linket</strong>.<br><br>
                      <b>Hol találod?</b><br>
                      1. Lépj be a Neptunba weben!<br>
                      2. <i>Tanulmányok -> Órarend</i><br>
                      3. Kattints az <i>Órarend exportálása</i> gombra.<br>
                      4. Másold ki a kapott linket!`
        },
        {
            title: "Készen állsz? 🚀",
            icon: "fa-solid fa-rocket has-text-danger",
            content: "Most átirányítunk a <b>Beállításokba</b>. Kérlek, másold be a Neptunból szerzett linkedet, és kattints a <i>Szinkronizálás most</i> gombra! Ha elakadnál, a Súgóban bármikor megtalálod a leírást."
        }
    ];

    let currentStep = 0;

    // Létrehozzuk a Modál HTML-jét (Bekerült a Bezárás X gomb is)
    const modalHtml = `
        <div class="modal is-active" id="onboarding-tour-modal" style="z-index: 9999;">
            <div class="modal-background" style="background-color: rgba(0,0,0,0.8);"></div>
            <div class="modal-content" style="max-width: 450px; width: 90%;">
                <div class="box p-5" style="border-radius: 12px; border: 2px solid var(--bulma-link); position: relative;">
                    
                    <!-- ÚJ BEZÁRÁS (X) GOMB -->
                    <button class="delete is-medium" id="tour-close-btn" aria-label="close" style="position: absolute; top: 15px; right: 15px;"></button>

                    <div class="has-text-centered mb-4 mt-2">
                        <span class="icon is-large mb-2" id="tour-icon"><i class="fa-2x ${steps[0].icon}"></i></span>
                        <h3 class="title is-4 m-0" id="tour-title">${steps[0].title}</h3>
                    </div>
                    
                    <div class="content has-text-centered mb-5" id="tour-content" style="min-height: 120px; display: flex; align-items: center; justify-content: center; text-align: center;">
                        <p>${steps[0].content}</p>
                    </div>
                    
                    <!-- Progress Pöttyök -->
                    <div class="is-flex is-justify-content-center mb-5" id="tour-dots" style="gap: 8px;">
                        ${steps.map((_, i) => `<span class="tour-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: ${i === 0 ? 'var(--bulma-link)' : 'var(--bulma-border)'}; transition: all 0.3s;"></span>`).join('')}
                    </div>

                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                        <!-- ÁTNEVEZVE: Majd később -->
                        <button class="button is-ghost has-text-grey" id="tour-skip-btn">Majd később</button>
                        <button class="button is-link has-text-weight-bold" id="tour-next-btn" style="border-radius: 8px; padding-left: 1.5rem; padding-right: 1.5rem;">Tovább <i class="fa-solid fa-arrow-right ml-2"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById("onboarding-tour-modal");
    const nextBtn = document.getElementById("tour-next-btn");
    const skipBtn = document.getElementById("tour-skip-btn");
    const closeBtn = document.getElementById("tour-close-btn");
    const titleEl = document.getElementById("tour-title");
    const contentEl = document.getElementById("tour-content");
    const iconEl = document.getElementById("tour-icon");
    const dots = document.querySelectorAll(".tour-dot");

    function updateStep() {
        titleEl.textContent = steps[currentStep].title;
        contentEl.innerHTML = `<p>${steps[currentStep].content}</p>`;
        iconEl.innerHTML = `<i class="fa-2x ${steps[currentStep].icon}"></i>`;
        
        dots.forEach((dot, index) => {
            dot.style.backgroundColor = index === currentStep ? 'var(--bulma-link)' : 'var(--bulma-border)';
            dot.style.transform = index === currentStep ? 'scale(1.3)' : 'scale(1)';
        });

        if (currentStep === steps.length - 1) {
            nextBtn.innerHTML = `Irány a beállítások <i class="fa-solid fa-check ml-2"></i>`;
            nextBtn.classList.replace("is-link", "is-success");
            skipBtn.style.display = "none";
        }
    }

    // EZ A FÜGGVÉNY ÁLLÍTJA ÁT HAMISRA AZ ADATBÁZISBAN!
    async function finishTour() {
        // 1. Átállítjuk kliens oldalon, hogy a jelenlegi session-ben már ne nyíljon meg újra
        if (state.appSettings) {
            state.appSettings.isFirstLogin = false;
        }

        // 2. Beküldjük az adatbázisnak a TELJES beállítás objektumot, hogy az adatbázis frissüljön
        try {
            const res = await apiFetch('/settings', {
                method: 'POST',
                // Biztosítjuk, hogy minden mező megvan, a biztonság kedvéért explicit false-t írunk a payloadba:
                body: JSON.stringify({
                    semesterLength: state.appSettings?.semesterLength || 14,
                    icsUrl: state.appSettings?.icsUrl || "",
                    weekOffset: state.appSettings?.weekOffset || 0,
                    isFrylabsUnlocked: state.appSettings?.isFrylabsUnlocked || false,
                    isFirstLogin: false // <--- EZ A KULCS! Garantáljuk a false értéket!
                })
            });
            
            if (!res.ok) {
                console.error("Hiba a tour befejezése mentésekor! Státuszkód:", res.status);
            }
        } catch (error) {
            console.error("Hálózati hiba a tour mentésekor:", error);
        }

        // 3. Eltüntetjük a modált a képernyőről
        modal.remove(); 
        
        // 4. Ha az "Irány a beállítások" (vagyis az utolsó) lépésnél nyomott a Tovább-ra, akkor átdobjuk
        if (currentStep === steps.length - 1 && window.location.hash !== '#settings') {
            window.location.hash = '#settings'; 
        }
    }

    // Eseménykezelők bekötése
    nextBtn.addEventListener("click", () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            updateStep();
        } else {
            finishTour(); // Csak a végén menti el az adatbázisba
        }
    });

    skipBtn.addEventListener("click", () => {
        finishTour(); // Ha a "Kihagyás"-ra nyom, menti az adatbázisba
    });

    closeBtn.addEventListener("click", () => {
        finishTour(); // Ha az X-re nyom, szintén menti az adatbázisba, hogy bezárta
    });
}