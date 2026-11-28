import { useEffect, useId, useState } from 'react';

// The app icon: a globe with a map pin, on a green-to-blue square. Tapping
// it spins the globe.
export function LogoMark({ playing = 0, size = 32 }) {
  const bg = useId();
  return (
    <svg key={playing} className={`logo-mark${playing ? ' logo-mark-play' : ''}`} width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38c07f" />
          <stop offset="1" stopColor="#3b8cf0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="144" fill={`url(#${bg})`} />
      <g className="lm-globe">
        <circle cx="240" cy="276" r="150" fill="#bfe3ff" stroke="#fff" strokeWidth="18" />
        <path d="M150 220 q40 -40 90 -10 q30 20 10 50 q-30 30 -60 10 q-30 -10 -40 -50z M260 330 q40 -30 80 0 q20 30 -10 60 q-40 20 -60 -10 q-20 -30 -10 -50z M300 180 q30 -10 50 20 q-20 20 -50 -20z" fill="#38c07f" />
      </g>
      <path d="M352 96 c-38 0 -66 28 -66 64 c0 46 66 112 66 112 s66 -66 66 -112 c0 -36 -28 -64 -66 -64z" fill="#ff5d6c" stroke="#fff" strokeWidth="14" />
      <circle cx="352" cy="160" r="22" fill="#fff" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="ink">Geo</span>
      <span className="pop-green">P</span>
      <span className="pop-blue">o</span>
      <span className="pop-pink">p</span>
    </span>
  );
}

// Globie, GeoPop's friend: a little planet in an explorer's hat.
export function Globie({ size = 96, bounce = 0, mood = 'happy' }) {
  return (
    <svg key={bounce} className={`globie${bounce ? ' globie-bounce' : ''}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#171a2b" opacity="0.08" />
      <circle cx="60" cy="66" r="40" fill="#5aa9f5" />
      <g className="globie-land">
        <path d="M30 50 q12 -14 28 -6 q10 6 2 16 q-10 10 -22 4 q-10 -4 -8 -14z" fill="#3cc47f" />
        <path d="M66 82 q14 -10 26 0 q6 10 -4 18 q-14 6 -20 -4 q-6 -8 -2 -14z" fill="#3cc47f" />
        <path d="M76 40 q12 -4 16 8 q-8 6 -16 -8z" fill="#3cc47f" />
        <path d="M26 82 q6 -4 10 2 q-4 6 -10 -2z" fill="#3cc47f" />
      </g>
      <path d="M22 40 q38 -22 76 0 l-6 6 q-32 -14 -64 0z" fill="#8a5a2b" />
      <path d="M36 34 q24 -30 48 0 z" fill="#c98b4a" />
      <rect x="36" y="31" width="48" height="5" rx="2.5" fill="#6d4420" />
      <circle cx="48" cy="64" r="5.5" fill="#171a2b" />
      <circle cx="72" cy="64" r="5.5" fill="#171a2b" />
      <circle cx="50" cy="62" r="1.8" fill="#fff" />
      <circle cx="74" cy="62" r="1.8" fill="#fff" />
      <circle cx="40" cy="73" r="5" fill="#ff8fb1" opacity="0.7" />
      <circle cx="80" cy="73" r="5" fill="#ff8fb1" opacity="0.7" />
      {mood === 'happy' ? (
        <path d="M51 74 Q60 83 69 74" stroke="#171a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M52 78 Q60 73 68 78" stroke="#171a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

const LOOKS = [
  { badge: '#EDE1F9', hair: '#6B4226', pigtails: true, bow: true },
  { badge: '#DCEAFB', hair: '#3A2A1C', pigtails: false, bow: false },
  { badge: '#FDE3EC', hair: '#8B5E3C', pigtails: true, bow: false },
  { badge: '#E1F5EA', hair: '#2B2B2B', pigtails: false, bow: false },
  { badge: '#FFF1D6', hair: '#C68B3C', pigtails: true, bow: true },
];

// Each player gets a look picked from their id, so siblings look different.
export function Avatar({ profile, size = 32 }) {
  let hash = 0;
  for (const ch of String(profile)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const { badge, hair, pigtails, bow } = LOOKS[hash % LOOKS.length];
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="20" fill={badge} />
      {pigtails && (
        <>
          <circle cx="8.5" cy="23" r="4.2" fill={hair} />
          <circle cx="31.5" cy="23" r="4.2" fill={hair} />
        </>
      )}
      <path d={pigtails ? 'M 9 20 C 9 10.5 31 10.5 31 20 L 31 18.5 C 31 13 9 13 9 18.5 Z' : 'M 9 19 C 9 9.5 31 9.5 31 19 L 31 16.5 C 31 11 9 11 9 16.5 Z'} fill={hair} />
      <circle cx="20" cy="23" r="10.5" fill="#F3C9A0" />
      {bow && <path d="M 25 9 L 28.5 7 L 27.3 10.3 L 30.5 10.3 L 27 12.5 Z" fill="#E86BA0" />}
      <circle cx="16.3" cy="22.5" r="1.4" fill="#3A2E2A" />
      <circle cx="23.7" cy="22.5" r="1.4" fill="#3A2E2A" />
      <circle cx="14.5" cy="26.5" r="1.9" fill="#F3A6B0" opacity="0.65" />
      <circle cx="25.5" cy="26.5" r="1.9" fill="#F3A6B0" opacity="0.65" />
      <path d="M 16.5 27.5 Q 20 30.3 23.5 27.5" fill="none" stroke="#3A2E2A" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const COLORS = ['#ffd23f', '#ff6b9a', '#3b8cf0', '#2fae6b', '#ff9f43', '#9b6bf2', '#14b8a6'];

export function Confetti({ pieces = 40 }) {
  const [on, setOn] = useState(true);
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 120,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      color: COLORS[i % COLORS.length],
      round: i % 3 === 0,
      size: 7 + Math.random() * 6,
    })),
  );
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 3600);
    return () => clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <span className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            borderRadius: b.round ? '50%' : 2,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            '--drift': `${b.drift}px`,
            '--spin': `${b.spin}deg`,
          }}
        />
      ))}
    </span>
  );
}

export function CountUp({ to, ms = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) return undefined;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - (1 - k) * (1 - k))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <span className={n === to ? 'count-up count-up-done' : 'count-up'}>{n}</span>;
}
