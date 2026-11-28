import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountButton, AccountScreen, AddPlayerForm, PlayerSettingsCard, SyncStatus } from './Account.jsx';
import { Buzzy, LogoMark, Wordmark } from './bits.jsx';
import { ExploreLetters, WordBank } from './Explore.jsx';
import ProfileSwitcher from './ProfileSwitcher.jsx';
import Quiz from './Quiz.jsx';
import { GRADES, MODES, exploreFor, gradeInfo, gradeModes } from './grades.js';
import { SOUNDS, soundLabel } from './content/phonics.js';
import { dueKeys, nextDue } from './questions.js';
import { dueLabel } from './srs.js';
import { PICTURE_VOCAB, VOCAB } from './content/vocab.js';
import {
  deleteCloudProfile,
  flushPendingCloud,
  getUser,
  loadCloudProfiles,
  onAuthEvent,
  rememberedAccount,
  saveCloudProfile,
} from './cloud.js';
import {
  learnedCount,
  loadCurrent,
  loadProfiles,
  mergeProgress,
  newProfile,
  recordAnswer,
  recordRound,
  saveCurrent,
  saveProfiles,
} from './store.js';
import { prewarmVoice, speak, stopSpeaking, unlockAudio } from './sound.js';

// Today's word (the same all day, a new one tomorrow): a letter sound for
// Toddlers and Kindergarten, a vocabulary word for 1st grade and up.
function wordOfTheDay(gradeId) {
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const g = gradeInfo(gradeId).id;
  if (g === 'p') {
    const v = PICTURE_VOCAB[day % PICTURE_VOCAB.length];
    return { kind: 'Big word of the day', big: v.w, pic: v.pic, line: v.def, say: `Today's big word is ${v.w}. ${v.w} means ${v.def}.` };
  }
  if (g === 'k') {
    const s = SOUNDS[day % SOUNDS.length];
    return { kind: 'Sound of the day', big: soundLabel(s), pic: s.pic, line: `says “${s.say}” like ${s.key}`, say: `Today's sound is ${s.say}. ${s.say}, like ${s.key}.` };
  }
  const list = VOCAB[Number(g)];
  const v = list[day % list.length];
  return { kind: 'Word of the day', big: v.w, line: v.def, say: `Today's word is ${v.w}. ${v.w} means ${v.def}. ${v.s.replace('___', v.w)}` };
}

// First visit: "How old is your child?" Picking a grade sets up the first
// player (with their name, if given). Same as MathPop's welcome.
function Welcome({ onDone }) {
  const [name, setName] = useState('');
  return (
    <div className="modal-backdrop">
      <div className="modal welcome">
        <Buzzy size={84} />
        <h2 className="welcome-title">How old is your child?</h2>
        <p className="welcome-sub">Tap one and start playing.</p>
        <div className="welcome-grid">
          {GRADES.map((g) => (
            <button key={g.id} className="welcome-grade" style={{ '--grade-color': g.color }} onClick={() => onDone(g.id, name)}>
              <span className="welcome-grade-icon">{g.icon}</span>
              <span className="welcome-grade-age">{g.age}</span>
              <span className="welcome-grade-label">{g.id === 'p' ? 'Toddler' : g.label}</span>
            </button>
          ))}
        </div>
        <input className="welcome-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Their first name (optional)" aria-label="Their first name" />
        <button className="back-link" onClick={() => onDone(null, name)}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

function GradePill({ grade, onChange }) {
  const [open, setOpen] = useState(false);
  const info = gradeInfo(grade);
  return (
    <div className="level-switcher">
      <button className="level-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="level-dot" style={{ background: info.color }} />
        <span className="level-pill-text">
          <span className="level-pill-label">Grade</span>
          <span className="level-pill-name">{info.short}</span>
        </span>
        <span className="level-pill-chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="level-menu">
          {GRADES.map((g) => (
            <button
              key={g.id}
              className={`level-menu-item${g.id === info.id ? ' level-menu-item-active' : ''}`}
              onClick={() => {
                onChange(g.id);
                setOpen(false);
              }}
            >
              <span className="level-dot" style={{ background: g.color }} />
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Anki's "due today": the words this player is due to review. Spaced
// repetition brings each word back just before it would be forgotten.
function ReviewCard({ profile, onPlay }) {
  const items = profile.progress.items;
  const due = dueKeys(profile.grade, items).length;
  const next = nextDue(profile.grade, items);
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
    <button className="review-card" onClick={() => onPlay('review')}>
      <span className="review-icon">🔁</span>
      <span className="review-text">
        <span className="review-title">Review time</span>
        <span className="review-sub">
          {due} {due === 1 ? 'word is' : 'words are'} ready to practice again
        </span>
      </span>
      <span className="review-count">{due}</span>
    </button>
  );
}

function Home({ profile, onPlay, onExplore, onOpenPlayers }) {
  const [bounce, setBounce] = useState(0);
  const g = gradeInfo(profile.grade);
  const modes = gradeModes(g.id);
  const today = wordOfTheDay(g.id);
  const explore = exploreFor(g.id);
  const p = profile.progress;
  return (
    <>
      <button
        className="home-hero"
        onClick={() => {
          setBounce((b) => b + 1);
          speak(`Hi ${profile.name}! Let's pop some words!`);
        }}
      >
        <Buzzy size={92} bounce={bounce} />
        <span className="home-hero-main">
          <span className="home-hello">Hi {profile.name}!</span>
          <span className="home-grade">{g.label}</span>
          <span className="home-stats">
            <span className="home-chip home-chip-stars">★ {p.stars}</span>
            <span className="home-chip">{learnedCount(p)} learned</span>
          </span>
        </span>
      </button>

      <div className="today-card">
        <button className="today-word" onClick={() => speak(today.say)}>
          <span className="today-kind">{today.kind} 🔊</span>
          <span className="today-big">
            {today.pic && <span className="today-pic">{today.pic}</span>}
            {today.big}
          </span>
          <span className="today-line">{today.line}</span>
        </button>
        <button className="today-start" onClick={() => onPlay('mix')}>
          <span>Random Mix · 10 questions</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <ReviewCard profile={profile} onPlay={onPlay} />

      <div className="home-games-head">
        <p className="home-label">Games</p>
        <button className="home-link" onClick={onOpenPlayers}>
          Change grade
        </button>
      </div>
      <div className="home-games">
        {modes.map((m) => {
          const info = MODES[m];
          const best = p.best?.[m];
          return (
            <button key={m} className="home-game" style={{ '--card-from': info.from, '--card-to': info.to }} onClick={() => onPlay(m)}>
              <span className="home-game-title">{info.title}</span>
              <span className="home-game-bar" />
              <span className="home-game-sub">{info.sub}</span>
              <span className="home-game-art" aria-hidden="true">
                {info.icon}
              </span>
              {best ? <span className="home-game-best">Best {best}/10</span> : null}
            </button>
          );
        })}
        <button
          className="home-game home-game-explore"
          style={{ '--card-from': '#fff7e8', '--card-to': '#ffe9c7' }}
          onClick={() => onExplore(explore)}
        >
          <span className="home-game-title">{explore === 'letters' ? 'Explore Letters' : 'Word Bank'}</span>
          <span className="home-game-bar" />
          <span className="home-game-sub">{explore === 'letters' ? 'Tap a letter, hear its sound' : 'All your words, with stars'}</span>
          <span className="home-game-art" aria-hidden="true">
            {explore === 'letters' ? '🅰️' : '📒'}
          </span>
        </button>
      </div>
      {explore === 'letters' && g.id !== 'p' && (
        <button className="home-more" onClick={() => onExplore('bank')}>
          📒 Word Bank: all the big words →
        </button>
      )}
    </>
  );
}

// When the family account loads: the account's players, plus any player
// made on this device who isn't in the account yet and has played (so
// nobody's progress is lost). Progress from both is joined.
function mergePlayers(local, cloud) {
  const byId = new Map(cloud.map((p) => [p.id, p]));
  const merged = cloud.map((c) => {
    const l = local.find((x) => x.id === c.id);
    return { ...c, progress: mergeProgress(c.progress, l?.progress) };
  });
  for (const l of local) {
    if (!byId.has(l.id) && (l.progress?.answered > 0 || cloud.length === 0)) merged.push(l);
  }
  return merged;
}

export default function App() {
  const [profiles, setProfiles] = useState(() => loadProfiles() || [newProfile('Player 1')]);
  const [currentId, setCurrentId] = useState(() => loadCurrent());
  const [showWelcome, setShowWelcome] = useState(() => !loadProfiles());
  const [user, setUser] = useState(() => rememberedAccount());
  const [view, setView] = useState('home');
  const [quizMode, setQuizMode] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [logoPlay, setLogoPlay] = useState(0);
  const pageRef = useRef(null);

  const profile = profiles.find((p) => p.id === currentId) || profiles[0];

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
    // The first tap anywhere unlocks sound (phones need a tap) and starts
    // loading the voice.
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

  function addPlayer(name, grade) {
    const p = newProfile(name || `Player ${profiles.length + 1}`, grade || profile.grade);
    setProfiles((list) => [...list, p]);
    setCurrentId(p.id);
    saveCloudProfile(p);
  }

  function removePlayer(id) {
    if (profiles.length <= 1) return;
    const p = profiles.find((x) => x.id === id);
    if (!window.confirm(`Remove ${p.name}? Their progress will be deleted.`)) return;
    setProfiles((list) => list.filter((x) => x.id !== id));
    deleteCloudProfile(id);
    if (currentId === id) setCurrentId(profiles.find((x) => x.id !== id).id);
  }

  function finishWelcome(grade, name) {
    setShowWelcome(false);
    updateProfile(profile.id, { grade: grade || profile.grade, name: name.trim() || profile.name });
    if (grade) speak(`Hi${name.trim() ? ` ${name.trim()}` : ''}! Welcome to WordPop!`);
  }

  function play(mode) {
    setQuizMode(mode);
    setView('quiz');
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
          <button className="logo" onClick={() => { setLogoPlay((n) => n + 1); setView('home'); }} aria-label="WordPop home">
            <LogoMark playing={logoPlay} />
            <Wordmark />
          </button>
          <div className="brand-actions">
            <ProfileSwitcher profile={profile.id} profiles={profiles} onChange={setCurrentId} onOpenSettings={() => setView('players')} />
            <AccountButton user={user} onClick={() => setView('account')} />
          </div>
        </div>

        {view === 'home' && (
          <Home
            profile={profile}
            onPlay={play}
            onExplore={(e) => setView(e)}
            onOpenPlayers={() => setView('players')}
          />
        )}

        {view === 'quiz' && (
          <>
            <div className="nav-row">
              {back}
              <GradePill grade={profile.grade} onChange={(grade) => updateProfile(profile.id, { grade })} />
            </div>
            <Quiz
              key={`${profile.id}-${profile.grade}-${quizMode}`}
              mode={quizMode}
              profile={profile}
              onAnswer={(q, correct) => updateProfile(profile.id, (p) => ({ progress: recordAnswer(p.progress, q, correct) }), { sync: false })}
              onRoundDone={(mode, score) => updateProfile(profile.id, (p) => ({ progress: recordRound(p.progress, mode, score) }))}
              onHome={() => setView('home')}
            />
          </>
        )}

        {view === 'letters' && (
          <>
            <div className="nav-row">{back}</div>
            <ExploreLetters />
          </>
        )}

        {view === 'bank' && (
          <>
            <div className="nav-row">{back}</div>
            <WordBank profile={profile} />
          </>
        )}

        {view === 'players' && (
          <>
            <div className="nav-row">{back}</div>
            <h2 className="screen-title">Players &amp; grades</h2>
            <SyncStatus user={user} onOpenAccount={() => setView('account')} />
            {profiles.map((p) => (
              <PlayerSettingsCard
                key={p.id}
                profile={p}
                stats={p.progress}
                canRemove={profiles.length > 1}
                onUpdate={(change) => updateProfile(p.id, change)}
                onRemove={() => removePlayer(p.id)}
              />
            ))}
            <AddPlayerForm onAdd={(name) => addPlayer(name)} />
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
    </div>
  );
}
