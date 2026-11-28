import { BY_ID, distanceKm, distanceLabel } from './geo.js';
import { KIND_IDS } from './levels.js';
import { isDue, normalize } from './srs.js';

export const ROUND_LENGTH = 10;
const NEW_PER_ROUND = 4;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(list, n) {
  return shuffle(list).slice(0, n);
}

// Countries near `id`, closest first: wrong answers come from the
// neighborhood, so a choice can't be ruled out just by being on the wrong
// continent (and nearby flags often look alike, which is the fun of it).
function nearby(world, id, count, exclude = []) {
  return Object.keys(BY_ID)
    .filter((o) => o !== id && !exclude.includes(o))
    .map((o) => ({ o, km: distanceKm(world, id, o) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count)
    .map((x) => x.o);
}

// Three wrong answers: two from the closest dozen countries, one from a
// little further, all different from each other by `look`.
function wrongOnes(world, id, look) {
  const close = nearby(world, id, 12);
  const further = nearby(world, id, 30).slice(12);
  const picked = [];
  const seen = new Set([look(id)]);
  for (const o of [...sample(close, 12).slice(0, 2), ...sample(further, 18), ...sample(close, 12)]) {
    if (picked.length >= 3) break;
    const v = look(o);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    picked.push(o);
  }
  return picked;
}

// A little something to learn after each answer, different each time.
export function funFact(world, id, homeId) {
  const c = BY_ID[id];
  const home = BY_ID[homeId];
  const facts = [];
  if (id === homeId) facts.push(`This is home! 🏠`);
  else {
    const km = distanceKm(world, homeId, id);
    facts.push(km === 0 ? `It touches ${home.name}: you could walk there!` : `It’s about ${distanceLabel(km, homeId)} from ${home.name}.`);
  }
  if (c.landlocked) facts.push(`No beaches! ${c.name} is landlocked: it has no ocean coast.`);
  if (c.borders.length >= 7) facts.push(`${c.name} touches ${c.borders.length} countries!`);
  if (c.borders.length === 0 && c.area < 1000000) facts.push(`${c.name} is surrounded by water.`);
  if (c.langs.length) facts.push(`People there speak ${listWords(c.langs)}.`);
  if (c.money.length) facts.push(`Money there is the ${c.money[0]}.`);
  if (c.people) facts.push(`People from ${c.name} are called ${c.people}.`);
  if (id !== homeId && home.area && c.area) {
    const r = c.area / home.area;
    if (r >= 1.5) facts.push(`It’s about ${Math.round(r)} times as big as ${home.name}.`);
    else if (r <= 0.67) facts.push(`${home.name} is about ${Math.round(1 / r).toLocaleString()} times as big as ${c.name}.`);
    else facts.push(`It’s about the same size as ${home.name}.`);
  }
  return facts[Math.floor(Math.random() * facts.length)];
}

function listWords(list) {
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

// ------------------------------------------------------------ questions

const MAKE = {
  // Where is it? Half the time the map shows a country and you name it;
  // half the time you find a named country on the map.
  map(world, id, levelIds) {
    const c = BY_ID[id];
    if (Math.random() < 0.5) {
      const wrong = wrongOnes(world, id, (o) => BY_ID[o].name);
      return {
        style: 'name',
        prompt: { kind: 'map', focus: id },
        title: 'Which country is this?',
        speak: 'Which country is this?',
        choices: shuffle([id, ...wrong]).map((o) => ({ id: o, label: BY_ID[o].name })),
      };
    }
    return {
      style: 'find',
      prompt: { kind: 'find', area: levelIds },
      title: `Find ${c.name}!`,
      speak: `Can you find ${c.name} on the map?`,
      choices: [],
    };
  },

  // Flags: which flag is it, or whose flag is this?
  flag(world, id) {
    const c = BY_ID[id];
    const wrong = wrongOnes(world, id, (o) => o);
    const options = shuffle([id, ...wrong]);
    if (Math.random() < 0.5) {
      return {
        style: 'flags',
        prompt: { kind: 'name', text: c.name },
        title: `Which is the flag of ${c.name}?`,
        speak: `Which is the flag of ${c.name}?`,
        choices: options.map((o) => ({ id: o, flag: o })),
      };
    }
    return {
      style: 'name',
      prompt: { kind: 'flag', flag: id },
      title: 'Whose flag is this?',
      speak: 'Whose flag is this?',
      choices: options.map((o) => ({ id: o, label: BY_ID[o].name })),
    };
  },

  // Capitals: name the capital, or whose capital is it?
  cap(world, id) {
    const c = BY_ID[id];
    const wrong = wrongOnes(world, id, (o) => BY_ID[o].capital);
    const options = shuffle([id, ...wrong]);
    if (Math.random() < 0.6) {
      return {
        style: 'name',
        prompt: { kind: 'name', text: c.name, flag: id },
        title: `What is the capital of ${c.name}?`,
        speak: `What is the capital of ${c.name}?`,
        choices: options.map((o) => ({ id: o, label: BY_ID[o].capital })),
      };
    }
    return {
      style: 'name',
      prompt: { kind: 'name', text: c.capital, icon: '🏛️' },
      title: `${c.capital} is the capital of…`,
      speak: `${c.capital} is the capital of which country?`,
      choices: options.map((o) => ({ id: o, label: BY_ID[o].name })),
    };
  },
};

function makeQuestion(world, kind, id, levelIds, homeId) {
  const c = BY_ID[id];
  const q = MAKE[kind](world, id, levelIds);
  const answerLine =
    kind === 'cap' ? `The capital of ${c.name} is ${c.capital}.` : kind === 'flag' ? `That’s the flag of ${c.name}.` : `That’s ${c.name}!`;
  return {
    ...q,
    kind,
    key: `${kind}:${id}`,
    country: id,
    answer: id,
    after: { text: answerLine, fact: funFact(world, id, homeId), speak: answerLine },
  };
}

// Picks countries the way Anki builds a study session: cards that are due
// first (from every level reached so far, most overdue first), then up to
// four new countries from the level being played (more if nothing is
// due), then practice-ahead. `dueOnly` is the Review game.
function pickCountries({ kind, levelIds, reachedIds, memory, n, dueOnly = false, now = Date.now() }) {
  const card = (id) => (memory?.[`${kind}:${id}`] ? normalize(memory[`${kind}:${id}`]) : null);
  const due = shuffle(reachedIds.filter((id) => isDue(card(id), now))).sort((a, b) => card(a).due - card(b).due);
  if (dueOnly) return due.slice(0, n);
  const fresh = shuffle(levelIds.filter((id) => !card(id) || card(id).state === 'new'));
  const ahead = levelIds.filter((id) => card(id) && card(id).state !== 'new' && !isDue(card(id), now)).sort((a, b) => card(a).due - card(b).due);
  const chosen = due.slice(0, n);
  const cap = chosen.length ? Math.min(NEW_PER_ROUND, n - chosen.length) : n;
  chosen.push(...fresh.slice(0, Math.max(0, cap)));
  // Still short (a small level): practice ahead from the level, then from
  // earlier levels (soonest due first), then go round the level again.
  const earlier = reachedIds
    .filter((id) => !levelIds.includes(id) && card(id) && !isDue(card(id), now))
    .sort((a, b) => card(a).due - card(b).due);
  for (const id of [...fresh.slice(Math.max(0, cap)), ...ahead, ...earlier]) {
    if (chosen.length >= n) break;
    if (!chosen.includes(id)) chosen.push(id);
  }
  const out = shuffle(chosen.slice(0, n));
  // Going round again: never the same country twice in a row.
  const again = shuffle(levelIds);
  for (let i = 0; out.length < n && again.length; i++) {
    const id = again[i % again.length];
    if (out[out.length - 1] !== id) out.push(id);
    if (i > n * 4) break;
  }
  return out;
}

// A round of ten. mode is a kind (map, flag, cap), 'mix' (all three for
// the level) or 'review' (only what's due, from every level reached).
export function makeRound({ world, mode, level, reachedIds, memory, homeId }) {
  const levelIds = level.ids;
  if (mode === 'review') {
    const qs = KIND_IDS.flatMap((kind) =>
      pickCountries({ kind, levelIds, reachedIds, memory, n: ROUND_LENGTH, dueOnly: true }).map((id) => ({ kind, id })),
    );
    const due = (x) => normalize(memory[`${x.kind}:${x.id}`]).due;
    return qs
      .sort((a, b) => due(a) - due(b))
      .slice(0, ROUND_LENGTH)
      .map((x) => makeQuestion(world, x.kind, x.id, regionAround(world, x.id, reachedIds), homeId));
  }
  if (mode === 'mix') {
    const per = { map: 4, flag: 3, cap: 3 }; // ten in all
    const picks = KIND_IDS.flatMap((kind) => pickCountries({ kind, levelIds, reachedIds, memory, n: per[kind] }).map((id) => ({ kind, id })));
    return shuffle(picks).map((x) => makeQuestion(world, x.kind, x.id, levelIds, homeId));
  }
  return pickCountries({ kind: mode, levelIds, reachedIds, memory, n: ROUND_LENGTH }).map((id) =>
    makeQuestion(world, mode, id, levelIds.includes(id) ? levelIds : regionAround(world, id, reachedIds), homeId),
  );
}

// For a "find it" question about a country from an earlier level: the map
// shows it with its nearest reached neighbors.
function regionAround(world, id, reachedIds) {
  return [id, ...nearby(world, id, 8).filter((o) => reachedIds.includes(o)).slice(0, 6)];
}

export function dueCount(memory, reachedIds, now = Date.now()) {
  let n = 0;
  for (const kind of KIND_IDS) for (const id of reachedIds) if (isDue(memory?.[`${kind}:${id}`] && normalize(memory[`${kind}:${id}`]), now)) n++;
  return n;
}

export function nextDue(memory, reachedIds) {
  let next = null;
  for (const kind of KIND_IDS) {
    for (const id of reachedIds) {
      const c = memory?.[`${kind}:${id}`];
      if (c && normalize(c).state !== 'new' && (next === null || c.due < next)) next = c.due;
    }
  }
  return next;
}

// A missed question asked again three questions later (Anki's "Again").
export function againQuestion(q) {
  return { ...q, choices: shuffle(q.choices), retry: true };
}
