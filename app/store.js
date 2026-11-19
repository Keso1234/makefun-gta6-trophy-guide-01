// Progress store: earned trophies, per-trophy notes, Next-up queue and the
// spoiler setting, all in localStorage. Export writes one JSON file;
// import validates every name against the official list before applying.
export const EARNED_KEY = 'gta6-trophy-checklist';
export const NOTES_KEY = 'gta6-trophy-notes';
export const NEXTUP_KEY = 'gta6-trophy-nextup';
export const SPOILER_KEY = 'gta6-trophy-spoiler';

export function loadEarned() {
  try { return new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

export function saveEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

export function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}'); }
  catch { return {}; }
}

export function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadNextUp() {
  try { return JSON.parse(localStorage.getItem(NEXTUP_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveNextUp(nextUp) {
  localStorage.setItem(NEXTUP_KEY, JSON.stringify(nextUp));
}

export function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === 'on';
}

export function saveSpoiler(on) {
  localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
}

export function buildExportFile(earned, notes, nextUp) {
  return JSON.stringify({
    app: 'Leonida Trophy Guide - GTA VI (PS5)',
    exportedAt: new Date().toISOString(),
    earned: [...earned],
    notes,
    nextUp,
  }, null, 2);
}

export function parseImportFile(text, knownNames) {
  const data = JSON.parse(text);
  const earned = new Set();
  const source = Array.isArray(data) ? data : (data.earned ?? []);
  for (const name of source) {
    if (typeof name === 'string' && knownNames.has(name)) earned.add(name);
  }
  const notes = {};
  if (data && typeof data === 'object' && !Array.isArray(data) && data.notes) {
    for (const [name, note] of Object.entries(data.notes)) {
      if (knownNames.has(name) && typeof note === 'string') notes[name] = note;
    }
  }
  const nextUp = [];
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.nextUp)) {
    for (const name of data.nextUp) {
      if (knownNames.has(name) && !nextUp.includes(name)) nextUp.push(name);
    }
  }
  return { earned, notes, nextUp };
}

export function clearAllProgress() {
  localStorage.removeItem(EARNED_KEY);
  localStorage.removeItem(NOTES_KEY);
  localStorage.removeItem(NEXTUP_KEY);
}
