import { DEFAULT_GRADE } from './grades.js';
import { cardStatus, newerCard, schedule } from './srs.js';

// Players and their progress, kept on this device (and, when signed in,
// in the family account too - see cloud.js).
const PROFILES_KEY = 'wordpop-profiles-v1';
const CURRENT_KEY = 'wordpop-current-v1';

export function emptyProgress() {
  return { rounds: 0, stars: 0, answered: 0, correct: 0, modes: {}, items: {}, best: {} };
}

export function newProfile(name, grade = DEFAULT_GRADE) {
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { id, name: name?.trim() || 'Player 1', grade, progress: emptyProgress() };
}

export function loadProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILES_KEY));
    if (Array.isArray(saved) && saved.length) return saved.map((p) => ({ ...p, progress: { ...emptyProgress(), ...p.progress } }));
  } catch {
    /* nothing saved */
  }
  return null;
}

export function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    /* private mode */
  }
}

export function loadCurrent() {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

export function saveCurrent(id) {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {
    /* private mode */
  }
}

// One answer: counts it for the game, and reschedules the card for the
// word or sound asked about (spaced repetition, srs.js). A retry (a
// missed word asked again in the same round) only reschedules: the round's
// score and the game's numbers count first tries.
export function recordAnswer(progress, q, correct, now = Date.now()) {
  const p = { ...emptyProgress(), ...progress };
  const card = schedule(p.items[q.key], correct, { now, retry: !!q.retry });
  if (q.retry) return { ...p, items: { ...p.items, [q.key]: card } };
  const mode = p.modes[q.mode] || { answered: 0, correct: 0 };
  return {
    ...p,
    answered: p.answered + 1,
    correct: p.correct + (correct ? 1 : 0),
    modes: { ...p.modes, [q.mode]: { answered: mode.answered + 1, correct: mode.correct + (correct ? 1 : 0) } },
    items: { ...p.items, [q.key]: card },
  };
}

export function recordRound(progress, mode, score) {
  const p = { ...emptyProgress(), ...progress };
  return { ...p, rounds: p.rounds + 1, stars: p.stars + score, best: { ...p.best, [mode]: Math.max(p.best[mode] || 0, score) } };
}

// A word is "learned" once it has graduated from learning to review (it
// was right twice, the second time after its learning step), as in Anki.
export function isLearned(progress, key) {
  const status = cardStatus(progress?.items?.[key]);
  return status === 'learned' || status === 'mastered';
}

export function learnedCount(progress) {
  return Object.keys(progress?.items || {}).filter((k) => isLearned(progress, k)).length;
}

// Joins progress made on two devices: the bigger count wins for each.
export function mergeProgress(a = {}, b = {}) {
  const x = { ...emptyProgress(), ...a };
  const y = { ...emptyProgress(), ...b };
  const maxObj = (o1, o2, fields) => {
    const out = { ...o1 };
    for (const [k, v] of Object.entries(o2)) {
      out[k] = out[k] ? Object.fromEntries(fields.map((f) => [f, Math.max(out[k][f] || 0, v[f] || 0)])) : v;
    }
    return out;
  };
  const best = { ...x.best };
  for (const [k, v] of Object.entries(y.best)) best[k] = Math.max(best[k] || 0, v);
  return {
    rounds: Math.max(x.rounds, y.rounds),
    stars: Math.max(x.stars, y.stars),
    answered: Math.max(x.answered, y.answered),
    correct: Math.max(x.correct, y.correct),
    modes: maxObj(x.modes, y.modes, ['answered', 'correct']),
    items: Object.fromEntries([...new Set([...Object.keys(x.items), ...Object.keys(y.items)])].map((k) => [k, newerCard(x.items[k], y.items[k])])),
    best,
  };
}
