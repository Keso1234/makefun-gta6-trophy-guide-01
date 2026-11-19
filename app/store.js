// Leonida Trophy Guide: progress store. Earned trophies, per-trophy notes,
// the Next-up queue and the spoiler setting live in localStorage, keyed by
// trophy name; export and import move the same data as one JSON file.
const PREFIX = 'leonida-trophy-guide:';
const KEYS = {
  earned: `${PREFIX}earned`,
  notes: `${PREFIX}notes`,
  nextUp: `${PREFIX}next-up`,
  spoiler: `${PREFIX}spoiler`,
};
const EXPORT_APP = 'leonida-trophy-guide';
const EXPORT_VERSION = 1;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private mode): progress stays in memory
    // for this session and the app keeps working.
  }
}

export function loadEarned() {
  const data = readJson(KEYS.earned, []);
  if (!Array.isArray(data)) return new Set();
  return new Set(data.filter((name) => typeof name === 'string'));
}

export function saveEarned(earned) {
  writeJson(KEYS.earned, [...earned]);
}

export function loadNotes() {
  const data = readJson(KEYS.notes, {});
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return {};
  const notes = {};
  for (const [name, text] of Object.entries(data)) {
    if (typeof text === 'string' && text.trim()) notes[name] = text;
  }
  return notes;
}

export function saveNotes(notes) {
  writeJson(KEYS.notes, notes);
}

export function loadNextUp() {
  const data = readJson(KEYS.nextUp, []);
  if (!Array.isArray(data)) return [];
  return data.filter((name) => typeof name === 'string');
}

export function saveNextUp(nextUp) {
  writeJson(KEYS.nextUp, nextUp);
}

export function loadSpoiler() {
  return readJson(KEYS.spoiler, false) === true;
}

export function saveSpoiler(spoilerOn) {
  writeJson(KEYS.spoiler, spoilerOn);
}

export function buildExportFile(earned, notes, nextUp) {
  return JSON.stringify({
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    earned: [...earned],
    notes,
    nextUp,
  }, null, 2);
}

export function parseImportFile(text, knownNames) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a JSON file.');
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Not a trophy-progress export.');
  }
  if (data.app !== EXPORT_APP || data.version !== EXPORT_VERSION) {
    throw new Error('Not a trophy-progress export.');
  }
  if (!Array.isArray(data.earned) || !Array.isArray(data.nextUp)) {
    throw new Error('Not a trophy-progress export.');
  }
  if (data.notes === null || typeof data.notes !== 'object' || Array.isArray(data.notes)) {
    throw new Error('Not a trophy-progress export.');
  }
  const earned = new Set();
  for (const name of data.earned) {
    if (typeof name !== 'string' || !knownNames.has(name)) {
      throw new Error('Export names a trophy this guide does not hold.');
    }
    earned.add(name);
  }
  const notes = {};
  for (const [name, note] of Object.entries(data.notes)) {
    if (!knownNames.has(name) || typeof note !== 'string') {
      throw new Error('Export names a trophy this guide does not hold.');
    }
    if (note.trim()) notes[name] = note;
  }
  const nextUp = [];
  for (const name of data.nextUp) {
    if (typeof name !== 'string' || !knownNames.has(name)) {
      throw new Error('Export names a trophy this guide does not hold.');
    }
    if (!nextUp.includes(name)) nextUp.push(name);
  }
  return { earned, notes, nextUp };
}

export function clearAllProgress() {
  try {
    for (const key of Object.values(KEYS)) localStorage.removeItem(key);
  } catch {
    // Nothing stored, or storage unavailable: nothing to clear.
  }
}
