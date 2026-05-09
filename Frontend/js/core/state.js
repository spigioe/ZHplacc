// js/core/state.js

// Segédfüggvény a félév meghatározásához (így nem kell importálni külső szervizből)
function calculateCurrentSemester() {
    const now = new Date(); 
    const month = now.getMonth() + 1; 
    const year = now.getFullYear();
    // Január -> előző év Ősz. Feb-Júl -> Tavasz. Aug-Dec -> Ősz.
    return (month >= 2 && month <= 7) ? `${year} Tavasz` : (month >= 8 ? `${year} Ősz` : `${year - 1} Ősz`);
}

export const state = {
    // --- ADATBÁZIS (Cache) ---
    allSubjects: [],
    allZhs: [],
    allExams: [], 
    allTimetableEvents: [],
    appSettings: {},
    
    // --- AKTUÁLIS ÁLLAPOTOK (Működés) ---
    currentSemesterStr: calculateCurrentSemester(),
    currentTimetableWeek: 1, // Az órarenden kiválasztott hét
    currentDisplayedWeek: 1, // A dashboardon kiválasztott hét
    currentlySelectedClass: null, // Az épp szerkesztett óra/esemény
    
    // --- UI (Felület) ÁLLAPOTOK ---
    isTimetableLoaded: false,
    showAllSubjects: false,
    
};