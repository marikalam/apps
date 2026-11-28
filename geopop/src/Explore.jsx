import { useState } from 'react';
import { BY_ID, distanceKm, distanceLabel, flagUrl } from './geo.js';
import { countryStatus, levelStars } from './levels.js';
import { dueLabel } from './srs.js';
import { playPop, speak } from './sound.js';
import WorldMap from './WorldMap.jsx';

const STATUS_LABEL = { new: 'Not met yet', learning: 'Learning', learned: '★ Learned', mastered: '★★ Mastered' };

// Colors for the progress map: how well each country's place on the map
// is known, with the countries of levels not reached yet faded.
export function progressColor(progress, reached, homeId) {
  return (id) => {
    if (id === homeId) return 'map-home-fill';
    const s = countryStatus(progress, id);
    if (s === 'mastered') return 'map-mastered';
    if (s === 'learned') return 'map-learned';
    if (s === 'learning') return 'map-learning';
    return reached.has(id) ? 'map-level' : 'map-locked';
  };
}

// Explore: the whole world, turned to face home. Drag it around, zoom in,
// tap any country to see its flag, capital and facts and hear its name.
export function Explore({ world, profile, levels, reached }) {
  const [sel, setSel] = useState(null);
  const home = profile.home;
  const colorOf = (id) => (id === sel ? 'map-target' : progressColor(profile.progress, reached, home)(id));
  const c = sel && BY_ID[sel];
  const level = sel && levels.find((l) => l.ids.includes(sel));
  const km = sel && distanceKm(world, home, sel);
  return (
    <div className="explore">
      <h2 className="explore-title">Explore the world</h2>
      <p className="explore-sub">Drag the map, zoom in, and tap any country.</p>
      <WorldMap
        world={world}
        view={{ world: world.info[home].centroid[0] }}
        height={300}
        colorOf={colorOf}
        homeId={home}
        pannable
        onTap={(id) => {
          setSel(id);
          playPop();
          speak(`${BY_ID[id].name}. Capital: ${BY_ID[id].capital}.`);
        }}
      />
      <MapKey />
      {c ? (
        <div className="country-card">
          <div className="country-card-head">
            <img src={flagUrl(c.id)} alt="" />
            <div>
              <h3>{c.name}</h3>
              <p>{c.sub}</p>
            </div>
          </div>
          <dl className="country-facts">
            <dt>Capital</dt>
            <dd>{c.capital}</dd>
            <dt>Speaks</dt>
            <dd>{c.langs.join(', ') || '—'}</dd>
            <dt>Money</dt>
            <dd>{c.money.join(', ') || '—'}</dd>
            <dt>From home</dt>
            <dd>{sel === home ? 'This is home! 🏠' : km === 0 ? 'Right next door' : distanceLabel(km, home)}</dd>
            <dt>Journey</dt>
            <dd>
              Level {level.n}: {level.name}
            </dd>
            <dt>Map card</dt>
            <dd>
              {STATUS_LABEL[countryStatus(profile.progress, sel)]}
              {profile.progress.items[`map:${sel}`] && ` · next review ${dueLabel(profile.progress.items[`map:${sel}`])}`}
            </dd>
          </dl>
          {c.landlocked && <p className="country-note">🏔️ Landlocked: no ocean coast at all.</p>}
          {c.borders.length > 0 && (
            <div className="country-neighbors">
              <span>Neighbors:</span>
              {c.borders.map((b) => (
                <button key={b} onClick={() => setSel(b)}>
                  <img src={flagUrl(b)} alt="" /> {BY_ID[b].name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="explore-note">Your home has a ★. Colors show what you’ve learned so far.</p>
      )}
    </div>
  );
}

export function MapKey() {
  return (
    <div className="map-key">
      <span><i className="key-home" /> Home</span>
      <span><i className="key-level" /> To explore</span>
      <span><i className="key-learning" /> Learning</span>
      <span><i className="key-learned" /> Learned</span>
      <span><i className="key-mastered" /> Mastered</span>
    </div>
  );
}

// The passport: a stamp for every level. One star when its countries can
// be found on the map, two with their flags, three with their capitals.
export function Passport({ profile, levels }) {
  const total = levels.reduce((s, l) => s + levelStars(profile.progress, l), 0);
  return (
    <div className="passport">
      <div className="passport-cover">
        <span className="passport-emblem">🌍</span>
        <span className="passport-title">PASSPORT</span>
        <span className="passport-name">{profile.name}</span>
        <span className="passport-home">
          <img src={flagUrl(profile.home)} alt="" /> {BY_ID[profile.home].name}
        </span>
        <span className="passport-total">
          {total} of {levels.length * 3} stars
        </span>
      </div>
      <div className="stamp-grid">
        {levels.map((l, i) => {
          const stars = levelStars(profile.progress, l);
          return (
            <div
              key={l.n}
              className={`stamp${stars ? ' stamp-on' : ''}`}
              style={{ '--rot': `${((i * 37) % 13) - 6}deg`, '--hue': `${(i * 47) % 360}` }}
            >
              <span className="stamp-n">{l.n}</span>
              <span className="stamp-name">{l.name}</span>
              <span className="stamp-flags">
                {l.ids.slice(0, 4).map((id) => (
                  <img key={id} src={flagUrl(id)} alt="" />
                ))}
              </span>
              <span className="stamp-stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
