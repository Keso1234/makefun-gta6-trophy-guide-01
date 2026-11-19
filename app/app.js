// Leonida Trophy Guide: boot, render and events. The checklist, the detail
// pane, the roadmap, the missables page and the Next-up planner all read the
// same 55 trophies from data/trophies.json and the same progress store.
import {
  loadEarned, saveEarned, loadNotes, saveNotes, loadNextUp, saveNextUp,
  loadSpoiler, saveSpoiler, buildExportFile, parseImportFile, clearAllProgress,
} from './store.js';
import {
  filterTrophies, gradeStats, kindStats, nextSuggestion, isSpoilerHidden,
} from './filters.js';

const DEMO_EARNED_IDS = [2, 3, 4, 8, 9, 10, 21, 36, 41, 44, 46, 51, 55];
const ROADMAP_STAGES = [
  { stage: 1, title: 'Stage 1 — Story first', text: 'Play Chapters 1–4 and the final mission, plus the side strands for Andy, Kenton, Billy, Randy and Tyrone. Do the missable-flagged moments the first time they come — a unique hunt, a quiet robbery, a choice.' },
  { stage: 2, title: 'Stage 2 — Strangers & side missions', text: 'Eight stranger strands across Leonida, Bret’s unique-animal hunt, beating Cal at fishing, bowling at Kolt & Associates, and a cocktail with a view on Ocean Beach.' },
  { stage: 3, title: 'Stage 3 — Activities & skills', text: 'The skill grinds: gold in all 42 Shooting Range challenges, 20 race wins, drone races at all 14 spots, 250 stunts, meditation at 18 spots, 50 challenges, and the combat and driving feats.' },
  { stage: 4, title: 'Stage 4 — Collectibles & exploration', text: 'Three card sets, WAiNK at 100 spots, 100 vehicles discovered, all 52 areas explored, all 8 garages bought, 10 vehicles on the Scooter Bros app. Sweep one region at a time.' },
  { stage: 5, title: 'Stage 5 — Money, mayhem & cleanup', text: 'Five bank vaults, one illegal operation per gang, $250,000 of Marked Bills laundered, $100,000 spent — then 100% completion, and the platinum unlocks with it.' },
];

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const knownNames = new Set(trophies.map((t) => t.name));
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = loadEarned();
let notes = loadNotes();
let nextUp = loadNextUp();
let spoilerOn = loadSpoiler();
let selectedName = trophies[0].name;
let currentView = 'checklist';

const $ = (id) => document.getElementById(id);

function seedDemoProgress() {
  if (!params.has('demo')) return;
  if (earned.size > 0) return;
  for (const id of DEMO_EARNED_IDS) earned.add(byId.get(id).name);
  saveEarned(earned);
  $('demoNote').hidden = false;
}

function applyStagingParams() {
  if (params.get('view') && ['checklist', 'roadmap', 'missables', 'planner'].includes(params.get('view'))) {
    currentView = params.get('view');
  }
  if (params.get('kind')) $('kindFilter').value = params.get('kind');
  if (params.get('grade')) $('gradeFilter').value = params.get('grade');
  if (params.get('search')) $('search').value = params.get('search');
  if (params.get('spoiler') === 'on') spoilerOn = true;
  if (params.get('trophy')) {
    const found = trophies.find((t) => t.name.toLowerCase() === params.get('trophy').toLowerCase());
    if (found) selectedName = found.name;
  }
  $('spoilerToggle').checked = spoilerOn;
}

function currentFilters() {
  return {
    search: $('search').value,
    kind: $('kindFilter').value,
    grade: $('gradeFilter').value,
    sort: $('sortFilter').value,
  };
}

function gradeLabel(grade) {
  return grade[0].toUpperCase() + grade.slice(1);
}

function trophyCard(trophy, options = {}) {
  const hidden = isSpoilerHidden(trophy, spoilerOn, earned);
  const li = document.createElement('li');
  li.className = 'trophy-card' + (earned.has(trophy.name) ? ' earned' : '') + (trophy.name === selectedName ? ' selected' : '');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Earned: ${hidden ? 'hidden story trophy' : trophy.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name); else earned.delete(trophy.name);
    saveEarned(earned);
    renderAll();
  });
  const body = document.createElement('div');
  body.className = 'body';
  const title = document.createElement('h3');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const grade = document.createElement('span');
  grade.className = `grade grade-${trophy.grade}`;
  grade.textContent = gradeLabel(trophy.grade);
  title.append(grade);
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'Hidden until earned — turn spoilers off, or earn it to reveal its name and description.' : trophy.description;
  const meta = document.createElement('div');
  meta.className = 'meta';
  const chips = [];
  if (trophy.missable) chips.push(['⚠ Missable — do it when you see it', 'missable']);
  if (earned.has(trophy.name)) chips.push(['✓ Earned', 'earned-tag']);
  chips.push([`Difficulty: ${trophy.difficulty}`, '']);
  chips.push([`Time: ${trophy.time}`, '']);
  if (trophy.target !== null && trophy.target !== undefined) chips.push([`PSN target: ${trophy.target.toLocaleString('en-US')}`, '']);
  if (!hidden) chips.push([trophy.area, '']);
  for (const [text, cls] of chips) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    meta.append(s);
  }
  body.append(title, desc, meta);
  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'secondary guide-btn';
  guideBtn.textContent = 'Guide';
  guideBtn.addEventListener('click', () => {
    selectedName = trophy.name;
    switchView('checklist');
    renderAll();
    $('detailPane').scrollIntoView({ block: 'nearest' });
  });
  li.append(box, body, guideBtn);
  if (options.compact) guideBtn.remove();
  return li;
}

function renderHeader() {
  const done = earned.size;
  $('earnedCount').textContent = done;
  $('earnedPct').textContent = `${Math.round((done / trophies.length) * 100)}% to platinum`;
  $('barFill').style.width = `${(done / trophies.length) * 100}%`;
  const stats = gradeStats(trophies, earned);
  $('gradeChips').replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const s = document.createElement('span');
    s.textContent = `${gradeLabel(grade)[0]} ${stats[grade].done}/${stats[grade].total}`;
    $('gradeChips').append(s);
  }
  $('missableCount').textContent = `(${trophies.filter((t) => t.missable).length})`;
  $('nextUpCount').textContent = nextUp.length ? `(${nextUp.length})` : '';
}

function renderChecklist() {
  const filters = currentFilters();
  const list = filterTrophies(trophies, filters, earned);
  const kinds = kindStats(trophies, earned);
  $('listHeading').textContent = `Showing ${list.length} of 55 trophies — Story ${kinds.story.done}/${kinds.story.total} · Missable ${kinds.missable.done}/${kinds.missable.total} · Collectibles ${kinds.collectible.done}/${kinds.collectible.total} · Activities ${kinds.activity.done}/${kinds.activity.total}`;
  const note = $('filterNote');
  if (filters.kind === 'online') {
    note.textContent = 'No online trophies: all 55 are single-player, per the official list. Nothing to track here.';
  } else if (list.length === 0) {
    note.textContent = 'No trophies match these filters — clear the search or widen the kind and grade.';
  } else if (filters.search.trim()) {
    note.textContent = `Search matches names, official descriptions and guide text.`;
  } else {
    note.textContent = '';
  }
  $('trophyList').replaceChildren(...list.map((t) => trophyCard(t)));
}

function renderDetail() {
  const trophy = trophies.find((t) => t.name === selectedName) ?? trophies[0];
  const pane = $('detailPane');
  pane.replaceChildren();
  const hidden = isSpoilerHidden(trophy, spoilerOn, earned);
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const grade = document.createElement('span');
  grade.className = `grade grade-${trophy.grade}`;
  grade.style.cssText = 'font-size:12px;font-weight:800;text-transform:uppercase;color:#fff;padding:3px 9px;border-radius:20px;margin-left:8px;vertical-align:middle;';
  grade.textContent = gradeLabel(trophy.grade);
  title.append(grade);
  pane.append(title);
  if (hidden) {
    const p = document.createElement('p');
    p.className = 'official';
    p.textContent = 'Spoilers are on and this story trophy is not earned yet — its name, description and guide stay hidden. Earn it, or switch “Hide story spoilers” off, to reveal it.';
    pane.append(p);
    return;
  }
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${trophy.description}”`;
  const sources = document.createElement('div');
  sources.className = 'sources';
  sources.textContent = trophy.sources;
  pane.append(official, sources);
  if (trophy.missable && trophy.missable_note) {
    const warn = document.createElement('div');
    warn.className = 'callout';
    const b = document.createElement('b');
    b.textContent = '⚠ Possibly missable. ';
    warn.append(b, document.createTextNode(trophy.missable_note));
    pane.append(warn);
  }
  const facts = document.createElement('div');
  facts.className = 'facts';
  const factEntries = [
    ['Difficulty', trophy.difficulty],
    ['Time (estimate)', trophy.time],
    ['Where', trophy.area],
    ['Roadmap', `Stage ${trophy.stage}`],
    ['PSN target', trophy.target !== null && trophy.target !== undefined ? trophy.target.toLocaleString('en-US') : '—'],
    ['Missable', trophy.missable ? 'Yes — see the warning below' : 'No'],
  ];
  for (const [label, value] of factEntries) {
    const d = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = label;
    d.append(b, document.createTextNode(value));
    facts.append(d);
  }
  const guideTitle = document.createElement('h4');
  guideTitle.textContent = 'How to get it';
  const guideText = document.createElement('p');
  guideText.className = 'guide-text';
  guideText.textContent = trophy.guide;
  const stepsTitle = document.createElement('h4');
  stepsTitle.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const step of trophy.steps) {
    const li = document.createElement('li');
    li.textContent = step;
    steps.append(li);
  }
  const tipsTitle = document.createElement('h4');
  tipsTitle.textContent = 'Tip';
  const tips = document.createElement('p');
  tips.className = 'guide-text';
  tips.textContent = trophy.tips;
  pane.append(facts, guideTitle, guideText, stepsTitle, steps, tipsTitle, tips);
  const noteTitle = document.createElement('h4');
  noteTitle.textContent = 'Your note';
  const noteBox = document.createElement('textarea');
  noteBox.className = 'note-box';
  noteBox.placeholder = 'Your own note — a spot, a loadout, a reminder… (saved in this browser)';
  noteBox.value = notes[trophy.name] ?? '';
  noteBox.addEventListener('change', () => {
    if (noteBox.value.trim()) notes[trophy.name] = noteBox.value.trim();
    else delete notes[trophy.name];
    saveNotes(notes);
  });
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = earned.has(trophy.name) ? '✓ Earned — unmark' : 'Mark earned';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(trophy.name)) earned.delete(trophy.name); else earned.add(trophy.name);
    saveEarned(earned);
    renderAll();
  });
  const starBtn = document.createElement('button');
  starBtn.type = 'button';
  starBtn.className = 'secondary';
  starBtn.textContent = nextUp.includes(trophy.name) ? '★ In Next up — remove' : '☆ Add to Next up';
  starBtn.addEventListener('click', () => {
    if (nextUp.includes(trophy.name)) nextUp = nextUp.filter((n) => n !== trophy.name);
    else nextUp.push(trophy.name);
    saveNextUp(nextUp);
    renderAll();
  });
  actions.append(earnedBtn, starBtn);
  pane.append(noteTitle, noteBox, actions);
}

function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => earned.has(t.name)).length;
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `${stage.title} — ${done}/${members.length} earned`;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const ul = document.createElement('ul');
    for (const t of members) {
      const li = document.createElement('li');
      li.textContent = `${earned.has(t.name) ? '✓ ' : ''}${t.name} (${gradeLabel(t.grade)}${t.missable ? ', missable' : ''})`;
      ul.append(li);
    }
    card.append(h, p, ul);
    wrap.append(card);
  }
}

function renderMissables() {
  const list = trophies.filter((t) => t.missable);
  $('missableList').replaceChildren(...list.map((t) => trophyCard(t)));
}

function renderPlanner() {
  const suggestion = nextSuggestion(trophies, earned);
  $('suggestion').textContent = suggestion
    ? `Suggested next: ${suggestion.name} — ${suggestion.description} (Stage ${suggestion.stage}, ${suggestion.difficulty}, ${suggestion.time}).`
    : 'Every story trophy is earned — the suggestion now is the earliest unearned trophy of any kind.';
  const queued = nextUp.map((name) => trophies.find((t) => t.name === name)).filter(Boolean);
  const list = $('nextUpList');
  list.replaceChildren();
  if (queued.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nothing queued yet — open any trophy’s guide and press “Add to Next up”.';
    list.append(li);
    return;
  }
  list.append(...queued.map((t) => trophyCard(t)));
}

function renderAll() {
  renderHeader();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderPlanner();
}

function switchView(view) {
  currentView = view;
  for (const btn of document.querySelectorAll('#tabs button')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  for (const section of document.querySelectorAll('main .view')) {
    section.hidden = section.id !== `view-${view}`;
  }
}

function downloadExport() {
  const blob = new Blob([buildExportFile(earned, notes, nextUp)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function bindEvents() {
  for (const btn of document.querySelectorAll('#tabs button')) {
    btn.addEventListener('click', () => { switchView(btn.dataset.view); });
  }
  $('search').addEventListener('input', renderChecklist);
  $('kindFilter').addEventListener('change', renderChecklist);
  $('gradeFilter').addEventListener('change', renderChecklist);
  $('sortFilter').addEventListener('change', renderChecklist);
  $('spoilerToggle').addEventListener('change', (e) => {
    spoilerOn = e.target.checked;
    saveSpoiler(spoilerOn);
    renderAll();
  });
  $('exportBtn').addEventListener('click', downloadExport);
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = parseImportFile(await file.text(), knownNames);
      earned = parsed.earned;
      notes = parsed.notes;
      nextUp = parsed.nextUp;
      saveEarned(earned);
      saveNotes(notes);
      saveNextUp(nextUp);
    } catch {
      alert('That file is not a trophy-progress export — nothing was changed.');
    }
    e.target.value = '';
    renderAll();
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies, notes and your Next-up queue?')) return;
    clearAllProgress();
    earned = new Set();
    notes = {};
    nextUp = [];
    $('demoNote').hidden = true;
    renderAll();
  });
}

seedDemoProgress();
applyStagingParams();
bindEvents();
switchView(currentView);
renderAll();
