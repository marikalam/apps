// Chimes and the speaking voice, the same way MathPop does them: one
// shared AudioContext (unlocked on the first tap), a natural Piper voice
// made right in the browser, and the device's own voice as a fallback
// while Piper loads or where it can't run.
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {
      /* older iOS */
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  return audioCtx;
}

export function unlockAudio() {
  ensureAudio();
}

// After the app goes to the background (another app, or the screen
// turned off), iOS can leave its audio silent even once it says it's
// playing again, and only a tap may start it. So the first tap after
// coming back makes a fresh AudioContext and plays a moment of silence
// inside that tap, which wakes the sound up. (Same as MathPop.)
let audioStale = false;
function freshAudio() {
  audioStale = false;
  const old = audioCtx;
  audioCtx = null;
  if (old) {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch {
        /* already stopped */
      }
      currentSource = null;
    }
    old.close().catch(() => {});
  }
  const ctx = ensureAudio();
  const silence = ctx.createBufferSource();
  silence.buffer = ctx.createBuffer(1, 1, 22050);
  silence.connect(ctx.destination);
  silence.start(0);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') audioStale = true;
  });
  window.addEventListener('pagehide', () => {
    audioStale = true;
  });
  const onTap = () => {
    if (audioCtx && (audioStale || audioCtx.state !== 'running')) freshAudio();
  };
  document.addEventListener('pointerdown', onTap, true);
  document.addEventListener('touchend', onTap, true);
}

function tone(ctx, freq, start, dur, peak, type = 'sine') {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function playCorrectChime() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 523.25, now, 0.16, 0.18);
  tone(ctx, 659.25, now + 0.09, 0.22, 0.18);
  tone(ctx, 783.99, now + 0.18, 0.3, 0.18);
}

export function playIncorrectBuzz() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 523.25, now, 0.22, 0.12, 'triangle');
  tone(ctx, 392, now + 0.2, 0.32, 0.12, 'triangle');
}

export function playPop() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  tone(ctx, 880, now, 0.08, 0.12);
  tone(ctx, 1320, now + 0.05, 0.1, 0.1);
}

export function playFanfare() {
  const ctx = ensureAudio();
  const now = ctx.currentTime + 0.01;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, now + i * 0.12, 0.35, 0.16));
}

// ---------------------------------------------------------------- voice

let voicesPromise = null;
function loadVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  const existing = window.speechSynthesis.getVoices();
  if (existing.length) return Promise.resolve(existing);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const done = () => resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 1000);
    });
  }
  return voicesPromise;
}

function scoreVoice(v) {
  const t = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
  let s = v.lang.toLowerCase().startsWith('en') ? 0 : -10;
  if (t.includes('natural')) s += 4;
  if (t.includes('neural')) s += 6;
  if (/premium|enhanced/.test(t)) s += 4;
  if (/siri|samantha|ava|allison|google us english|aria|jenny/.test(t)) s += 2;
  if (/compact|espeak/.test(t)) s -= 4;
  return s;
}

async function speakWithDeviceVoice(text, run) {
  if (!('speechSynthesis' in window)) return;
  const voices = await loadVoices();
  if (run !== speechRun) return;
  const u = new SpeechSynthesisUtterance(text);
  const best = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
  if (best) u.voice = best;
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

let piperModule = null;
function getPiper() {
  if (!piperModule) piperModule = import('./piper.js');
  return piperModule;
}

export function prewarmVoice() {
  loadVoices();
  getPiper()
    .then((m) => m.loadPiper())
    .catch(() => {
      /* falls back to the device voice */
    });
}

let currentSource = null;
let speechRun = 0;

function stopCurrent() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      /* already stopped */
    }
    currentSource = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function stopSpeaking() {
  speechRun++;
  stopCurrent();
}

// Says `text`. A newer speak() or stopSpeaking() cuts it off.
export async function speak(text) {
  if (!text) return;
  const run = ++speechRun;
  stopCurrent();
  try {
    const { synthesizeSpeech } = await getPiper();
    // Piper takes a few seconds to load the first time: the device voice
    // speaks meanwhile rather than leaving the child waiting.
    const blob = await Promise.race([
      synthesizeSpeech(text),
      new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 2500)),
    ]);
    if (run !== speechRun) return;
    const ctx = ensureAudio();
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (run !== speechRun) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSource = source;
    source.start();
  } catch {
    if (run === speechRun) speakWithDeviceVoice(text, run);
  }
}

export function feedback(correct) {
  if (correct) playCorrectChime();
  else playIncorrectBuzz();
}
