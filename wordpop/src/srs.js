// Spaced repetition, the way Anki does it (its SM-2 scheduler), for every
// word and sound a player practices. Each one is a "card":
//
//   new        never seen.
//   learning   just met (or missed): comes back soon, after LEARN_STEP.
//              Right again after that, and it "graduates": next review in
//              1 day.
//   review     learned. Each time it's right, the gap until the next
//              review grows by the card's ease (2.5 to start): 1 day, 3
//              days, 8, 20, 50… so known words show up less and less.
//   relearning a learned card that was missed: its ease drops (it'll come
//              back more often from now on), its gap is halved, and it
//              goes back to short steps until it's right again.
//
// A multiple-choice answer can't say "hard" or "easy" the way Anki's
// buttons do, so right is Anki's "Good" and wrong is "Again".
// A card is mature (mastered) once its gap is 21 days, as in Anki.

const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;
export const LEARN_STEP = 10 * MINUTE;
const START_EASE = 2.5;
const MIN_EASE = 1.3;
export const MATURE_DAYS = 21;

export function newCard() {
  return { state: 'new', interval: 0, ease: START_EASE, due: 0, reps: 0, lapses: 0, right: 0, wrong: 0, last: 0 };
}

// Cards saved before spaced repetition only had right/wrong counts: they
// start as learning cards, due now.
export function normalize(card) {
  if (!card) return newCard();
  if (card.state) return { ...newCard(), ...card };
  return { ...newCard(), right: card.right || 0, wrong: card.wrong || 0, state: card.right || card.wrong ? 'learning' : 'new' };
}

// A little randomness on longer gaps (Anki's "fuzz"), so words learned
// together don't all come back on the same day forever.
function fuzz(days) {
  if (days < 3) return days;
  return Math.max(1, Math.round(days * (0.95 + Math.random() * 0.1)));
}

// The card after one answer. `retry` is a second try at a word missed
// earlier in the same round: getting it right then counts, but the word
// still comes back soon (it isn't learned yet).
export function schedule(card, correct, { now = Date.now(), retry = false } = {}) {
  const c = { ...normalize(card), last: now };
  if (correct) c.right += 1;
  else c.wrong += 1;

  if (!correct) {
    if (c.state === 'review') {
      c.lapses += 1;
      c.ease = Math.max(MIN_EASE, c.ease - 0.2);
      c.interval = Math.max(1, Math.round(c.interval / 2));
      c.state = 'relearning';
    } else if (c.state === 'new') {
      c.state = 'learning';
    }
    c.due = now + LEARN_STEP;
    return c;
  }

  if (retry) {
    if (c.state === 'new') c.state = 'learning';
    c.due = now + LEARN_STEP;
    return c;
  }

  c.reps += 1;
  if (c.state === 'new') {
    c.state = 'learning';
    c.due = now + LEARN_STEP;
  } else if (c.state === 'learning') {
    c.state = 'review';
    c.interval = 1;
    c.due = now + DAY;
  } else if (c.state === 'relearning') {
    c.state = 'review';
    c.due = now + c.interval * DAY;
  } else {
    // Reviewed late and still remembered: some credit for the extra days.
    const daysLate = Math.max(0, (now - c.due) / DAY);
    c.interval = fuzz(Math.max(c.interval + 1, Math.round((c.interval + daysLate / 2) * c.ease)));
    c.due = now + c.interval * DAY;
  }
  return c;
}

export function isDue(card, now = Date.now()) {
  return !!card && card.state !== 'new' && (card.due || 0) <= now;
}

// 'new' | 'learning' | 'learned' | 'mastered'
export function cardStatus(card) {
  const c = card && normalize(card);
  if (!c || c.state === 'new') return 'new';
  if (c.state !== 'review') return 'learning';
  return c.interval >= MATURE_DAYS ? 'mastered' : 'learned';
}

// "now", "in 10 min", "tomorrow", "in 8 days"
export function dueLabel(card, now = Date.now()) {
  const c = normalize(card);
  if (c.state === 'new') return 'new';
  const ms = c.due - now;
  if (ms <= 0) return 'due now';
  if (ms < 60 * MINUTE) return `in ${Math.max(1, Math.round(ms / MINUTE))} min`;
  if (ms < DAY) return 'later today';
  const days = Math.round(ms / DAY);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

// Which of two copies of a card is newer (the same player practicing on
// two devices): the one answered last.
export function newerCard(a, b) {
  if (!a) return b;
  if (!b) return a;
  return (b.last || 0) > (a.last || 0) ? b : a;
}
