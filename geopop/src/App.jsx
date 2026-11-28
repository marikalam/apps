import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountButton, AccountScreen, AddPlayerForm, PlayerSettingsCard, SyncStatus } from './Account.jsx';
import { Confetti, Globie, LogoMark, Wordmark } from './bits.jsx';
import { COUNTRIES } from './data/countries.js';
import { Explore, MapKey, Passport, progressColor } from './Explore.jsx';
import { BY_ID, distanceLabel, flagUrl, loadWorld } from './geo.js';
import HomePicker, { guessHome } from './HomePicker.jsx';
import { KINDS, KIND_IDS, buildLevels, countryStatus, explorerRank, levelShare, levelStars, unlockedCount, UNLOCK_SHARE } from './levels.js';
import ProfileSwitcher from './ProfileSwitcher.jsx';
import Quiz from './Quiz.jsx';
import { dueCount, makeRound, nextDue } from './questions.js';
import { dueLabel } from './srs.js';
import { deleteCloudProfile, flushPendingCloud, getUser, loadCloudProfiles, onAuthEvent, rememberedAccount, saveCloudProfile } from './cloud.js';
import { loadCurrent, loadProfiles, mergeProgress, newProfile, recordAnswer, recordRound, saveCurrent, saveProfiles } from './store.js';
import { playFanfare, prewarmVoice, speak, stopSpeaking, unlockAudio } from './sound.js';
import WorldMap from './WorldMap.jsx';

// First visit: where's home? The journey starts there.
function Welcome({ onDone }) {
  const [home, setHome] = useState(guessHome);
  const [name, setName] = useState('');
  return (
    <div className="modal-backdrop">
      <div className="modal welcome">
        <Globie size={84} />
        <h2 className="welcome-title">Where is home?</h2>
        <p className="welcome-sub">Your trip around the world starts there and spreads out, country by country.</p>
        <HomePicker value={home} onChange={setHome} />
        <input className="welcome-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Explorer’s first name (optional)" aria-label="Explorer’s first name" />
        <button className="pill-btn-primary pill-btn-full" onClick={() => onDone(home, name)}>
          <img className="btn-flag" src={flagUrl(home)} alt="" /> Start in {BY_ID[home].name}
        </button>
      </div>
    </div>
  );
}

// A new stamp or a new level: a party.
function Celebrate({ news, onClose }) {
  useEffect(() => {
    playFanfare();
    speak(news.line);
  }, [news]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal celebrate">
        <Confetti />
        <span className="celebrate-stamp">{news.icon}</span>
        <h2 className="welcome-title">{news.title}</h2>
        <p className="welcome-sub">{news.line}</p>
        <button className="pill-btn-primary pill-btn-full" onClick={onClose}>
          Keep exploring
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ due, next, onPlay }) {
  if (next === null) return null;
  if (!due) {
    return (
      <div className="review-card review-card-done">
        <span className="review-icon">✅</span>
        <span className="review-text">
          <span className="review-title">All caught up!</span>
          <span className="review-sub">Next review {dueLabel({ state: 'review', due: next })}</span>
        </span>
      </div>
    );
  }
  return (
    <button className="review-card" onClick={onPlay}>
      <span className="review-icon">🔁</span>
      <span className="review-text">
        <span className="review-title">Review time</span>
        <span className="review-sub">
          {due} {due === 1 ? 'card is' : 'cards are'} ready to practice again
        </span>
      </span>
      <span className="review-count">{due}</span>
    </button>
  );
}

function Home({ world, profile, levels, unlocked, current, reached, onPlay, onPickLevel, onView }) {
  const [bounce, setBounce] = useState(0);
  const p = profile.progress;
  const level = levels[current - 1];
  const stamps = levels.reduce((s, l) => s + (levelStars(p, l) > 0 ? 1 : 0), 0);
  const found = COUNTRIES.filter((c) => ['learned', 'mastered'].includes(countryStatus(p, c.id))).length;
  const reachedIds = useMemo(() => [...reached], [reached]);
  const due = dueCount(p.items, reachedIds);
  const next = nextDue(p.items, reachedIds);
  const colorOf = useMemo(() => {
    const base = progressColor(p, reached, profile.home);
    const lit = new Set(level.ids);
    return (id) => `${base(id)}${lit.has(id) ? ' map-current' : ''}`;
  }, [p, reached, profile.home, level]);
  return (
    <>
      <button
        className="home-hero"
        onClick={() => {
          setBounce((b) => b + 1);
          speak(`Hi ${profile.name}! Where shall we go today?`);
        }}
      >
        <Globie size={88} bounce={bounce} />
        <span className="home-hero-main">
          <span className="home-hello">Hi {profile.name}!</span>
          <span className="home-grade">{explorerRank(stamps)}</span>
          <span className="home-stats">
            <span className="home-chip home-chip-stars">★ {p.stars}</span>
            <span className="home-chip">🛂 {stamps} stamps</span>
            <span className="home-chip">{found} countries</span>
          </span>
        </span>
      </button>

      <div className="map-card">
        <WorldMap world={world} view={{ world: world.info[profile.home].centroid[0] }} height={210} colorOf={colorOf} homeId={profile.home} onTap={() => onView('explore')} />
        <MapKey />
        <button className="map-card-link" onClick={() => onView('explore')}>
          🔎 Explore the map
        </button>
      </div>

      <ReviewCard due={due} next={next} onPlay={() => onPlay('review')} />

      <div className="trip-card">
        <div className="trip-head">
          <span className="trip-level">Level {level.n}</span>
          <span className="trip-name">{level.name}</span>
          <span className="trip-sub">
            {level.regions} · {level.farKm === 0 ? 'right next door' : `up to ${distanceLabel(level.farKm, profile.home)} away`}
          </span>
        </div>
        <div className="trip-flags">
          {level.ids.map((id) => (
            <img key={id} src={flagUrl(id)} alt={BY_ID[id].name} title={BY_ID[id].name} className={`trip-flag trip-flag-${countryStatus(p, id)}`} />
          ))}
        </div>
        <div className="trip-stops">
          {KIND_IDS.map((k) => {
            const share = Math.round(levelShare(p, level, k) * 100);
            return (
              <button key={k} className="trip-stop" style={{ '--card-from': KINDS[k].from, '--card-to': KINDS[k].to }} onClick={() => onPlay(k)}>
                <span className="trip-stop-icon">{KINDS[k].icon}</span>
                <span className="trip-stop-title">{KINDS[k].title}</span>
                <span className="trip-stop-bar">
                  <i style={{ width: `${share}%` }} />
                </span>
                <span className="trip-stop-pct">{share}%</span>
              </button>
            );
          })}
        </div>
        <button className="today-start" onClick={() => onPlay('mix')}>
          <span>🎲 Mix it up · 10 questions</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="home-games-head">
        <p className="home-label">Your journey</p>
        <button className="home-link" onClick={() => onView('passport')}>
          🛂 Passport
        </button>
      </div>
      <ol className="journey">
        {levels.map((l) => {
          const open = l.n <= unlocked;
          const stars = levelStars(p, l);
          const isNext = l.n === unlocked + 1;
          return (
            <li key={l.n} className={`journey-step${open ? '' : ' journey-locked'}${l.n === current ? ' journey-current' : ''}`}>
              <button disabled={!open} onClick={() => onPickLevel(l.n)}>
                <span className="journey-n">{open ? l.n : '🔒'}</span>
                <span className="journey-text">
                  <span className="journey-name">{l.name}</span>
                  <span className="journey-sub">
                    {isNext
                      ? `Find ${Math.round(UNLOCK_SHARE * 100)}% of Level ${l.n - 1} on the map to open`
                      : `${l.ids.length} countries · ${l.regions}`}
                  </span>
                </span>
                <span className="journey-stars">{open ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : ''}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function mergePlayers(local, cloud) {
  const ids = new Set(cloud.map((p) => p.id));
  const merged = cloud.map((c) => {
    const l = local.find((x) => x.id === c.id);
    return { ...c, progress: mergeProgress(c.progress, l?.progress) };
  });
  for (const l of local) if (!ids.has(l.id) && (l.progress?.answered > 0 || cloud.length === 0)) merged.push(l);
  return merged;
}

export default function App() {
  const [profiles, setProfiles] = useState(() => loadProfiles() || [newProfile('Explorer', guessHome())]);
  const [currentId, setCurrentId] = useState(() => loadCurrent());
  const [showWelcome, setShowWelcome] = useState(() => !loadProfiles());
  const [user, setUser] = useState(() => rememberedAccount());
  const [view, setView] = useState('home');
  const [quiz, setQuiz] = useState(null);
  const [world, setWorld] = useState(null);
  const [worldError, setWorldError] = useState(false);
  const [news, setNews] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [logoPlay, setLogoPlay] = useState(0);
  const pageRef = useRef(null);
  // The latest players, for "Play again" (a new round should see what the
  // last one taught).
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  const profile = profiles.find((p) => p.id === currentId) || profiles[0];
  const levels = useMemo(() => (world ? buildLevels(world, profile.home) : null), [world, profile.home]);
  const unlocked = levels ? unlockedCount(profile.progress, levels) : 1;
  const current = Math.min(profile.progress.level || unlocked, unlocked);
  const reached = useMemo(() => new Set(levels ? levels.slice(0, unlocked).flatMap((l) => l.ids) : []), [levels, unlocked]);

  useEffect(() => {
    loadWorld()
      .then(setWorld)
      .catch(() => setWorldError(true));
  }, []);
  useEffect(() => saveProfiles(profiles), [profiles]);
  useEffect(() => saveCurrent(profile.id), [profile.id]);
  useEffect(() => {
    pageRef.current?.scrollTo(0, 0);
    if (view !== 'quiz') stopSpeaking();
  }, [view]);

  const syncFromCloud = useCallback(async () => {
    const cloud = await loadCloudProfiles();
    if (!cloud) return;
    setProfiles((local) => {
      const merged = mergePlayers(local, cloud);
      merged.forEach((p) => saveCloudProfile(p));
      return merged.length ? merged : local;
    });
  }, []);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      if (u) syncFromCloud();
    });
    const off = onAuthEvent((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setUser(session?.user || null);
        setRecovery(true);
        setView('account');
      }
    });
    const online = () => flushPendingCloud();
    window.addEventListener('online', online);
    const first = () => {
      unlockAudio();
      prewarmVoice();
    };
    document.addEventListener('pointerdown', first, { once: true });
    return () => {
      off();
      window.removeEventListener('online', online);
    };
  }, [syncFromCloud]);

  function updateProfile(id, change, { sync = true } = {}) {
    setProfiles((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...(typeof change === 'function' ? change(p) : change) };
        if (sync) saveCloudProfile(next);
        return next;
      }),
    );
  }

  function finishWelcome(home, name) {
    setShowWelcome(false);
    updateProfile(profile.id, { home, name: name.trim() || profile.name });
    speak(`Welcome, ${name.trim() || 'explorer'}! Our trip starts in ${BY_ID[home].name}.`);
  }

  function play(mode) {
    const level = levels[current - 1];
    const title = mode === 'review' ? 'Review' : `Level ${level.n}`;
    const reachedIds = [...reached];
    const build = () =>
      makeRound({ world, mode, level, reachedIds, memory: profilesRef.current.find((p) => p.id === profile.id).progress.items, homeId: profile.home });
    setQuiz({ mode, title, build, key: Date.now() });
    setView('quiz');
  }

  // After a round: new stamps and newly opened levels get a celebration.
  function roundDone(score) {
    const before = profile.progress;
    updateProfile(profile.id, (p) => {
      const progress = recordRound(p.progress, quiz.mode, score);
      const unlockedBefore = unlockedCount(before, levels);
      const unlockedAfter = unlockedCount(progress, levels);
      const gained = levels.find((l) => levelStars(progress, l) > (progress.stamps?.[l.n] || 0));
      if (unlockedAfter > unlockedBefore) {
        const l = levels[unlockedAfter - 1];
        setNews({ icon: '🗺️', title: `Level ${l.n} is open!`, line: `New places to explore: ${l.name}! ${l.ids.slice(0, 3).map((id) => BY_ID[id].name).join(', ')} and more.` });
        progress.level = unlockedAfter;
      } else if (gained) {
        const s = levelStars(progress, gained);
        setNews({ icon: '🛂', title: `New stamp: ${'★'.repeat(s)}`, line: `${gained.name}: you know its ${['map', 'flags', 'capitals'][s - 1]}! A new stamp for your passport.` });
      }
      const stamps = { ...progress.stamps };
      for (const l of levels) stamps[l.n] = Math.max(stamps[l.n] || 0, levelStars(progress, l));
      return { progress: { ...progress, stamps } };
    });
  }

  async function onSignedIn(u) {
    setUser(u);
    if (u) {
      await syncFromCloud();
      setView('home');
    }
  }

  const back = (
    <button className="back-link" onClick={() => setView('home')}>
      ← Back
    </button>
  );

  return (
    <div className="page" ref={pageRef}>
      <div className="app">
        <div className="brand-row">
          <button className="logo" onClick={() => { setLogoPlay((n) => n + 1); setView('home'); }} aria-label="GeoPop home">
            <LogoMark playing={logoPlay} />
            <Wordmark />
          </button>
          <div className="brand-actions">
            <ProfileSwitcher profile={profile.id} profiles={profiles} onChange={setCurrentId} onOpenSettings={() => setView('players')} />
            <AccountButton user={user} onClick={() => setView('account')} />
          </div>
        </div>

        {!world && !['players', 'account'].includes(view) && (
          <div className="loading">
            <Globie size={90} bounce={1} />
            <p>{worldError ? 'The map couldn’t load. Check the internet and reload.' : 'Unfolding the map…'}</p>
          </div>
        )}

        {world && view === 'home' && (
          <Home
            world={world}
            profile={profile}
            levels={levels}
            unlocked={unlocked}
            current={current}
            reached={reached}
            onPlay={play}
            onView={setView}
            onPickLevel={(n) => updateProfile(profile.id, (p) => ({ progress: { ...p.progress, level: n } }))}
          />
        )}

        {world && view === 'quiz' && quiz && (
          <>
            <div className="nav-row">{back}</div>
            <Quiz
              key={quiz.key}
              title={quiz.title}
              build={quiz.build}
              world={world}
              profile={profile}
              onAnswer={(q, correct) => updateProfile(profile.id, (p) => ({ progress: recordAnswer(p.progress, q, correct) }), { sync: false })}
              onRoundDone={roundDone}
              onHome={() => setView('home')}
            />
          </>
        )}

        {world && view === 'explore' && (
          <>
            <div className="nav-row">{back}</div>
            <Explore world={world} profile={profile} levels={levels} reached={reached} />
          </>
        )}

        {world && view === 'passport' && (
          <>
            <div className="nav-row">{back}</div>
            <Passport profile={profile} levels={levels} />
          </>
        )}

        {view === 'players' && (
          <>
            <div className="nav-row">{back}</div>
            <h2 className="screen-title">Players</h2>
            <SyncStatus user={user} onOpenAccount={() => setView('account')} />
            {profiles.map((p) => (
              <PlayerSettingsCard
                key={p.id}
                profile={p}
                stats={p.progress}
                canRemove={profiles.length > 1}
                onUpdate={(change) => updateProfile(p.id, change)}
                onRemove={() => {
                  if (!window.confirm(`Remove ${p.name}? Their journey will be deleted.`)) return;
                  setProfiles((list) => list.filter((x) => x.id !== p.id));
                  deleteCloudProfile(p.id);
                  if (currentId === p.id) setCurrentId(profiles.find((x) => x.id !== p.id).id);
                }}
              />
            ))}
            <p className="settings-help settings-note">Changing a home country redraws that player’s journey from there. Everything they’ve learned stays learned.</p>
            <AddPlayerForm
              onAdd={(name) => {
                const np = newProfile(name || `Explorer ${profiles.length + 1}`, profile.home);
                setProfiles((list) => [...list, np]);
                setCurrentId(np.id);
                saveCloudProfile(np);
              }}
            />
          </>
        )}

        {view === 'account' && (
          <>
            <div className="nav-row">{back}</div>
            <AccountScreen
              user={user}
              playerCount={profiles.length}
              onSignedIn={onSignedIn}
              onAccountDeleted={() => setUser(null)}
              onOpenPlayers={() => setView('players')}
              onDone={() => setView('home')}
              recoveryMode={recovery}
              onPasswordUpdated={() => setRecovery(false)}
            />
          </>
        )}
      </div>
      {showWelcome && <Welcome onDone={finishWelcome} />}
      {news && <Celebrate news={news} onClose={() => setNews(null)} />}
    </div>
  );
}
