// Checks GeoPop's journeys and questions:
//  - for every one of the 197 possible home countries, the levels cover
//    every country exactly once, starting at home;
//  - every question has four different choices with the answer among
//    them (no two capitals or names alike);
//  - spaced repetition: due cards come first, and levels unlock.
import fs from 'node:fs';
import { COUNTRIES } from '../src/data/countries.js';
import { makeWorld, BY_ID } from '../src/geo.js';
import { buildLevels, unlockedCount, levelStars } from '../src/levels.js';
import { makeRound, dueCount } from '../src/questions.js';
import { recordAnswer } from '../src/store.js';

const world = makeWorld(JSON.parse(fs.readFileSync(new URL('../public/world-50m.json', import.meta.url))));
let problems = 0;
const fail = (m) => {
  problems++;
  if (problems < 30) console.log('✗', m);
};

const t0 = Date.now();
let levelsTotal = 0;
for (const c of COUNTRIES) {
  const levels = buildLevels(world, c.id);
  levelsTotal += levels.length;
  const all = levels.flatMap((l) => l.ids);
  if (all[0] !== c.id) fail(`${c.id}: journey doesn't start at home`);
  if (all.length !== COUNTRIES.length || new Set(all).size !== COUNTRIES.length) fail(`${c.id}: levels cover ${new Set(all).size}/${COUNTRIES.length}`);
  if (levels.some((l) => l.ids.length < 3 || l.ids.length > 14)) fail(`${c.id}: odd level size ${levels.map((l) => l.ids.length)}`);
  if (!fs.existsSync(new URL(`../public/flags/${c.id.toLowerCase()}.svg`, import.meta.url))) fail(`${c.id}: no flag`);
}
console.log(`Journeys for all ${COUNTRIES.length} homes OK (${(levelsTotal / COUNTRIES.length).toFixed(1)} levels each, ${Date.now() - t0} ms).`);

// Questions, from a few homes, every level, every game.
let qCount = 0;
for (const home of ['US', 'JP', 'KE', 'NZ', 'FR', 'BR']) {
  const levels = buildLevels(world, home);
  const reachedIds = levels.flatMap((l) => l.ids);
  for (const level of levels) {
    for (const mode of ['map', 'flag', 'cap', 'mix']) {
      const round = makeRound({ world, mode, level, reachedIds, memory: {}, homeId: home });
      if (round.length !== 10) fail(`${home} L${level.n} ${mode}: ${round.length} questions`);
      for (const q of round) {
        qCount++;
        if (!q.after.fact) fail(`${q.key}: no fact`);
        if (q.style === 'find') {
          if (!q.prompt.area.includes(q.answer)) fail(`${q.key}: answer not on the map`);
          continue;
        }
        const ids = q.choices.map((c) => c.id);
        const looks = q.choices.map((c) => c.label || c.flag);
        if (ids.length !== 4 || new Set(ids).size !== 4 || new Set(looks).size !== 4) fail(`${q.key}: choices ${looks}`);
        if (!ids.includes(q.answer)) fail(`${q.key}: answer missing`);
      }
    }
  }
}
console.log(`${qCount} questions checked.`);

// Spaced repetition and unlocking.
const levels = buildLevels(world, 'US');
let progress = { items: {} };
const reached1 = levels[0].ids;
const now = Date.now();
for (const id of levels[0].ids) progress = recordAnswer(progress, { key: `map:${id}`, kind: 'map' }, true, now);
if (unlockedCount(progress, levels) !== 2) fail('level 2 should open once level 1 map is known');
if (levelStars(progress, levels[0]) !== 1) fail('level 1 should have one star');
for (const id of levels[0].ids) progress = recordAnswer(progress, { key: `flag:${id}`, kind: 'flag' }, false, now - 2 * 86400000);
if (dueCount(progress.items, reached1, now) !== levels[0].ids.length) fail('missed flags should be due');
const round = makeRound({ world, mode: 'flag', level: levels[1], reachedIds: [...reached1, ...levels[1].ids], memory: progress.items, homeId: 'US' });
const dueAsked = round.filter((q) => reached1.includes(q.country)).length;
if (dueAsked !== reached1.length) fail(`due flags from level 1 should come first in level 2 (got ${dueAsked})`);
const review = makeRound({ world, mode: 'review', level: levels[1], reachedIds: reached1, memory: progress.items, homeId: 'US' });
if (!review.length || review.some((q) => q.kind !== 'flag')) fail('review should be the due flags');
console.log(`Spaced repetition & unlocking checked (US level 1: ${levels[0].ids.map((i) => BY_ID[i].name).join(', ')}).`);

console.log(problems ? `${problems} problems` : 'All good.');
process.exit(problems ? 1 : 0);
