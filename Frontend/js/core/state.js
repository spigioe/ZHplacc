// js/state.js
import { getCurrentSemesterString } from "../services/syncService.js";

export const state = {
    allSubjects: [],
    allZhs: [],
    allExams: [], 
    allTimetableEvents: [],
    appSettings: {},
    activeModal: "",
    unlockedFeature: false,
    currentDisplayedWeek: 1,
    currentlySelectedClass: null,
    currentSemesterStr: getCurrentSemesterString(),
    currentTimetableWeek: 1,
    showAllSubjects: false,
    isTimetableLoaded: false
};