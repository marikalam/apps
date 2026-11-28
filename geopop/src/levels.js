import { COUNTRIES } from './data/countries.js';
import { BY_ID, distanceKm } from './geo.js';
import { cardStatus } from './srs.js';

// GeoPop's journey: rings that spread out from the player's home, like
// ripples in a pond. Level 1 is home and the countries right next to it;
// each level after that is the next-closest group of countries (measured
// border to border, so neighbors always come first), out to the far side
// of the world. Two players with different homes get different journeys.

const NAMES = [
  'Home Sweet Home',
  'Next Door',
  'The Neighborhood',
  'Down the Road',
  'Road Trip',
  'Over the Horizon',
  'Across the Water',
  'Passport, Please',
  'Long Haul',
  'Far Away',
  'Distant Shores',
  'Jet Lag',
  'Faraway Lands',
  'Halfway Around',
  'Way Out There',
  'Edge of the Map',
  'Wild Frontiers',
  'Beyond the Clouds',
  'The Long Way Round',
  'Almost There',
];
const LAST_NAME = 'The Other Side of the World';

// How many countries each level has: small first steps, then tens.
const SIZES = [6, 8, 8, 9];
const LATER_SIZE = 10;

export function buildLevels(world, homeId) {
  const home = BY_ID[homeId] ? homeId : 'US';
  const others = COUNTRIES.filter((c) => c.id !== home)
    .map((c) => ({ id: c.id, km: distanceKm(world, home, c.id) }))
    .sort((a, b) => a.km - b.km || a.id.localeCompare(b.id));

  // Level 1: home plus up to five countries right next to it, and at
  // least three in all (the nearest ones across the water, for islands or
  // countries with few neighbors).
  const touching = others.filter((o) => o.km < 60).slice(0, 5);
  const first = touching.length >= 3 ? touching : others.slice(0, 3);
  const rest = others.filter((o) => !first.includes(o));
  const groups = [[{ id: home, km: 0 }, ...first]];
  let i = 0;
  while (i < rest.length) {
    const size = SIZES[groups.length] || LATER_SIZE;
    let group = rest.slice(i, i + size);
    // Don't leave a tiny last level: fold it in.
    if (rest.length - (i + size) > 0 && rest.length - (i + size) < 5) group = rest.slice(i);
    groups.push(group);
    i += group.length;
  }
  return groups.map((g, n) => ({
    n: n + 1,
    name: n === groups.length - 1 ? LAST_NAME : NAMES[n] || `Level ${n + 1}`,
    ids: g.map((x) => x.id),
    farKm: Math.max(...g.map((x) => x.km)),
    regions: topRegions(g.map((x) => x.id)),
  }));
}

function topRegions(ids) {
  const counts = {};
  for (const id of ids) counts[BY_ID[id].sub] = (counts[BY_ID[id].sub] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([r]) => r)
    .join(' · ');
}

// The three things to learn about every country: where it is on the map,
// its flag and its capital. Each is its own spaced-repetition card.
export const KINDS = {
  map: { title: 'Map', long: 'Find it on the map', icon: '🗺️', from: '#2fae6b', to: '#1e8a52' },
  flag: { title: 'Flags', long: 'Match the flags', icon: '🚩', from: '#ec5f9a', to: '#cf3f7c' },
  cap: { title: 'Capitals', long: 'Name the capital cities', icon: '🏛️', from: '#3b6fef', to: '#2b52c4' },
};
export const KIND_IDS = Object.keys(KINDS);

// A country "counts" for a level when its last answer was right.
function knownShare(progress, kind, ids) {
  const items = progress?.items || {};
  return ids.filter((id) => items[`${kind}:${id}`]?.lastRight).length / ids.length;
}

export const UNLOCK_SHARE = 0.8;

// Stamps in the passport, one per level: ★ for its map, ★★ with its flags
// too, ★★★ with its capitals too (80% of its countries right each time).
export function levelStars(progress, level) {
  let stars = 0;
  for (const kind of KIND_IDS) {
    if (knownShare(progress, kind, level.ids) >= UNLOCK_SHARE) stars++;
    else break;
  }
  return stars;
}

// The next level opens once 80% of this level's countries can be found on
// the map.
export function unlockedCount(progress, levels) {
  let n = 1;
  while (n < levels.length && knownShare(progress, 'map', levels[n - 1].ids) >= UNLOCK_SHARE) n++;
  return n;
}

export function levelShare(progress, level, kind) {
  return knownShare(progress, kind, level.ids);
}

// A country's status on the progress map: the best its map card has got.
export function countryStatus(progress, id) {
  return cardStatus(progress?.items?.[`map:${id}`]);
}

export function explorerRank(stamps) {
  if (stamps >= 18) return 'World Master';
  if (stamps >= 12) return 'Globetrotter';
  if (stamps >= 7) return 'Voyager';
  if (stamps >= 3) return 'Navigator';
  if (stamps >= 1) return 'Explorer';
  return 'Rookie Explorer';
}
