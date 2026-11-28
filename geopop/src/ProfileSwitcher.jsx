import { useEffect, useRef, useState } from 'react';
import { Avatar } from './bits.jsx';
import { flagUrl } from './geo.js';

// "Playing as": the player pill in the header picks who's playing (each
// has their own home and journey), and leads to the Players screen.
export default function ProfileSwitcher({ profile, profiles, onChange, onOpenSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = profiles.find((p) => p.id === profile) || profiles[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="profile-switcher" ref={ref}>
      <button className="profile-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Playing as ${current.name}. Change player.`}>
        <Avatar profile={current.id} size={26} />
        <span className="profile-pill-name">{current.name}</span>
        <span className="profile-pill-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="profile-menu">
          {profiles.map((p) => (
            <button
              key={p.id}
              className={`profile-menu-item${p.id === profile ? ' profile-menu-item-active' : ''}`}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
            >
              <Avatar profile={p.id} size={24} />
              <span>{p.name}</span>
              <img className="profile-flag" src={flagUrl(p.home)} alt="" />
            </button>
          ))}
          <div className="profile-menu-section">
            <button
              className="profile-settings-item"
              onClick={() => {
                onOpenSettings();
                setOpen(false);
              }}
            >
              ⚙️ <span>Players</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
