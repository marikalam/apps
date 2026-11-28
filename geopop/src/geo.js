import { geoArea, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import { COUNTRIES } from './data/countries.js';

export const BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const EARTH_KM = 6371;

let worldPromise = null;

// The world's shapes, loaded once: every shape (for drawing), and for each
// country its shapes, its "mainland" (for zooming the map to it) and a
// sample of points along its borders (for distances).
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch(`${import.meta.env.BASE_URL}world-50m.json`)
      .then((r) => r.json())
      .then(makeWorld)
      .catch((err) => {
  worldPromise = null;
  throw err;
      });
  }
  return worldPromise;
}

export function makeWorld(topo) {
  const features = feature(topo, topo.objects.countries).features;
  const byCountry = {};
  for (const f of features) {
    const id = f.properties.id;
    if (id) (byCountry[id] ||= []).push(f);
  }
  const info = {};
  for (const c of COUNTRIES) {
    const shapes = byCountry[c.id] || [];
    const main = mainland(shapes, c);
    const points = samplePoints(main, c);
    info[c.id] = { shapes, main, vec: toVectors(points), centroid: shapes.length ? geoCentroid(main) : [c.lng, c.lat] };
  }
  return { features, info };
}

// A country's main pieces of land: its biggest polygon and any other at
// least 18% as big (so the US keeps Alaska, but France leaves out French
// Guiana when the map zooms to it). Countries with no shape on the map
// (Tuvalu) get a point.
function mainland(shapes, c) {
  const polys = [];
  for (const f of shapes) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') polys.push(g.coordinates);
    else if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
  }
  if (!polys.length) return { type: 'Point', coordinates: [c.lng, c.lat] };
  const sized = polys.map((p) => ({ p, a: geoArea({ type: 'Polygon', coordinates: p }) }));
  const biggest = Math.max(...sized.map((s) => s.a));
  return { type: 'MultiPolygon', coordinates: sized.filter((s) => s.a >= biggest * 0.18).map((s) => s.p) };
}

function samplePoints(geom, c) {
  if (geom.type === 'Point') return [geom.coordinates];
  const all = geom.coordinates.flatMap((poly) => poly[0]);
  const step = Math.max(1, Math.floor(all.length / 90));
  const pts = all.filter((_, i) => i % step === 0);
  return pts.length ? pts : [[c.lng, c.lat]];
}

function toVectors(points) {
  const out = new Float64Array(points.length * 3);
  points.forEach(([lng, lat], i) => {
    const l = (lng * Math.PI) / 180;
    const p = (lat * Math.PI) / 180;
    out[i * 3] = Math.cos(p) * Math.cos(l);
    out[i * 3 + 1] = Math.cos(p) * Math.sin(l);
    out[i * 3 + 2] = Math.sin(p);
  });
  return out;
}

// The shortest distance between two countries' borders, in km (0 for
// neighbors).
const distCache = new Map();
export function distanceKm(world, a, b) {
  if (a === b) return 0;
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  if (distCache.has(key)) return distCache.get(key);
  // Points as 3D unit vectors: the closest pair has the biggest dot
  // product, which is much quicker to find than great-circle distances.
  const pa = world.info[a].vec;
  const pb = world.info[b].vec;
  let best = -2;
  for (let i = 0; i < pa.length; i += 3) {
    const x = pa[i];
    const y = pa[i + 1];
    const z = pa[i + 2];
    for (let j = 0; j < pb.length; j += 3) {
      const d = x * pb[j] + y * pb[j + 1] + z * pb[j + 2];
      if (d > best) best = d;
    }
  }
  const km = BY_ID[a].borders.includes(b) ? 0 : Math.round(Math.acos(Math.min(1, best)) * EARTH_KM);
  distCache.set(key, km);
  return km;
}

// Countries that use miles (for "how far from home").
const MILES = new Set(['US', 'GB', 'LR', 'MM']);
export function distanceLabel(km, homeId) {
  if (MILES.has(homeId)) {
    const mi = Math.round(km * 0.621371);
    return `${roundNice(mi).toLocaleString()} miles`;
  }
  return `${roundNice(km).toLocaleString()} km`;
}

function roundNice(n) {
  if (n < 100) return Math.max(10, Math.round(n / 10) * 10);
  if (n < 1000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}

// Where a flag's picture is.
export function flagUrl(id) {
  return `${import.meta.env.BASE_URL}flags/${id.toLowerCase()}.svg`;
}
