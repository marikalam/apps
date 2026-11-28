import { useEffect, useId, useState } from 'react';

// The app icon: three letter tiles (A, b, c) on an orange-to-pink square.
// Tapping it makes the tiles hop, one after another.
export function LogoMark({ playing = 0, size = 32 }) {
  const bg = useId();
  return (
    <svg key={playing} className={`logo-mark${playing ? ' logo-mark-play' : ''}`} width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5a524" />
          <stop offset="1" stopColor="#ec5f9a" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="144" fill={`url(#${bg})`} />
      <g className="lm-tile lm-1">
        <rect x="70" y="150" width="150" height="170" rx="34" fill="#fff" />
        <text x="145" y="280" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="140" fill="#e07b12">A</text>
      </g>
      <g className="lm-tile lm-2">
        <rect x="236" y="110" width="150" height="170" rx="34" fill="#ffd23f" />
        <text x="311" y="240" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="140" fill="#171a2b">b</text>
      </g>
      <g className="lm-tile lm-3">
        <rect x="292" y="296" width="150" height="150" rx="34" fill="#fff" />
        <text x="367" y="414" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="130" fill="#cf3f7c">c</text>
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="ink">Word</span>
      <span className="pop-orange">P</span>
      <span className="pop-pink">o</span>
      <span className="pop-purple">p</span>
    </span>
  );
}

// Buzzy the bee, WordPop's friend on the home screen and the results page.
export function Buzzy({ size = 96, bounce = 0, mood = 'happy' }) {
  return (
    <svg key={bounce} className={`buzzy${bounce ? ' buzzy-bounce' : ''}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#171a2b" opacity="0.08" />
      <g className="buzzy-wings">
        <ellipse cx="40" cy="30" rx="18" ry="24" fill="#dff1ff" stroke="#9cc9f0" strokeWidth="3" transform="rotate(-25 40 30)" />
        <ellipse cx="80" cy="30" rx="18" ry="24" fill="#dff1ff" stroke="#9cc9f0" strokeWidth="3" transform="rotate(25 80 30)" />
      </g>
      <ellipse cx="60" cy="66" rx="40" ry="38" fill="#ffd23f" />
      <path d="M24 58 Q60 50 96 58 L98 70 Q60 62 22 70 Z" fill="#171a2b" />
      <path d="M26 84 Q60 78 94 84 L88 94 Q60 90 32 94 Z" fill="#171a2b" />
      <path d="M48 30 Q44 16 36 12" stroke="#171a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M72 30 Q76 16 84 12" stroke="#171a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="12" r="5" fill="#171a2b" />
      <circle cx="84" cy="12" r="5" fill="#171a2b" />
      <circle cx="47" cy="45" r="6" fill="#171a2b" />
      <circle cx="73" cy="45" r="6" fill="#171a2b" />
      <circle cx="49" cy="43" r="2" fill="#fff" />
      <circle cx="75" cy="43" r="2" fill="#fff" />
      <circle cx="38" cy="53" r="5" fill="#ff8fb1" opacity="0.7" />
      <circle cx="82" cy="53" r="5" fill="#ff8fb1" opacity="0.7" />
      {mood === 'happy' ? (
        <path d="M52 52 Q60 60 68 52" stroke="#171a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M53 56 Q60 52 67 56" stroke="#171a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
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
