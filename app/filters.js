// Filtering, sorting, spoiler masking and progress stats for the 55 trophies.
// A trophy is hidden by the spoiler setting only when it is a story trophy
// the player has not earned yet: its name and description stay hidden until
// it is earned (or spoilers are switched off).
export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
export const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

export function isStoryTrophy(trophy) {
  return trophy.kinds.includes('story');
}

export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn && isStoryTrophy(trophy) && !earned.has(trophy.name);
}

export function filterTrophies(trophies, filters, earned) {
  const query = filters.search.trim().toLowerCase();
  let list = trophies.filter((t) => {
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind === 'online') return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && !t.kinds.includes(filters.kind)) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide} ${t.area} ${t.tips}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  if (filters.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (filters.sort === 'grade') list = [...list].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  if (filters.sort === 'difficulty') list = [...list].sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || a.id - b.id);
  if (filters.sort === 'missable') list = [...list].sort((a, b) => Number(b.missable) - Number(a.missable) || a.id - b.id);
  return list;
}

export function gradeStats(trophies, earned) {
  const stats = {};
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const done = trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
    stats[grade] = { done, total };
  }
  return stats;
}

export function kindStats(trophies, earned) {
  const stats = {};
  for (const kind of ['story', 'missable', 'collectible', 'activity']) {
    const matches = (t) => kind === 'missable' ? t.missable : t.kinds.includes(kind);
    stats[kind] = {
      done: trophies.filter((t) => matches(t) && earned.has(t.name)).length,
      total: trophies.filter(matches).length,
    };
  }
  return stats;
}

export function nextSuggestion(trophies, earned) {
  // The platinum is earned last by definition, so never suggest it: the
  // earliest unearned non-platinum story trophy is the next unlock.
  return trophies.find((t) => t.grade !== 'platinum' && t.kinds.includes('story') && !earned.has(t.name)) ?? null;
}
