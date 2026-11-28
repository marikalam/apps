import { useMemo, useState } from 'react';
import { COUNTRIES } from './data/countries.js';
import { BY_ID, flagUrl } from './geo.js';

// A best guess at where the player lives, from the device's language
// setting ("en-US" -> US). Only a starting point: they pick.
export function guessHome() {
  try {
    for (const tag of navigator.languages || [navigator.language]) {
      const region = new Intl.Locale(tag).maximize().region;
      if (region && BY_ID[region]) return region;
    }
  } catch {
    /* old browser */
  }
  return 'US';
}

const POPULAR = ['US', 'CA', 'GB', 'AU', 'IN', 'MX', 'BR', 'DE', 'FR', 'JP', 'CN', 'PH', 'SG', 'NG', 'ZA', 'KR'];

// Choose a home country: a search box and a list of flags. `compact`
// shows just the current choice until it's tapped.
export default function HomePicker({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(!compact);
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const first = [value, ...POPULAR.filter((id) => id !== value)].filter((id) => BY_ID[id]);
      return [...first.map((id) => BY_ID[id]), ...COUNTRIES.filter((c) => !first.includes(c.id))];
    }
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase() === q);
  }, [query, value]);

  if (!open) {
    return (
      <button type="button" className="home-picker-current" onClick={() => setOpen(true)}>
        <img src={flagUrl(value)} alt="" />
        <span>{BY_ID[value]?.name}</span>
        <span className="home-picker-change">Change</span>
      </button>
    );
  }
  return (
    <div className="home-picker">
      <input
        className="home-picker-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a country…"
        aria-label="Search for a country"
      />
      <div className="home-picker-list">
        {shown.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`home-picker-item${c.id === value ? ' home-picker-item-on' : ''}`}
            onClick={() => {
              onChange(c.id);
              if (compact) setOpen(false);
            }}
          >
            <img src={flagUrl(c.id)} alt="" loading="lazy" />
            <span>{c.name}</span>
          </button>
        ))}
        {!shown.length && <p className="home-picker-none">No country called that. Try another spelling?</p>}
      </div>
    </div>
  );
}
