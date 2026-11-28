// Checks the spaced-repetition scheduler (src/srs.js) and that rounds
// are built like an Anki session: due cards first, few new ones.
import { DAY, LEARN_STEP, schedule, isDue, cardStatus } from '../src/srs.js';
import { makeRound, dueKeys, againQuestion } from '../src/questions.js';
import { recordAnswer } from '../src/store.js';

let problems = 0;
const expect = (ok, msg) => {
  if (!ok) {
    problems++;
    console.log('✗', msg);
  }
};
const days = (c, now) => Math.round((c.due - now) / DAY);

// A card answered right every time it's due: 10 min, 1 day, then growing
// by the ease (2.5): about 3, 8, 20, 50 days.
let now = Date.parse('2026-01-01T09:00:00Z');
let c = schedule(undefined, true, { now });
expect(c.state === 'learning' && c.due - now === LEARN_STEP, 'new + right -> learning, back in 10 min');
now = c.due;
c = schedule(c, true, { now });
expect(c.state === 'review' && days(c, now) === 1, 'learning + right -> review in 1 day');
const gaps = [];
for (let i = 0; i < 4; i++) {
  now = c.due;
  c = schedule(c, true, { now });
  gaps.push(days(c, now));
}
console.log('Review gaps when always right (days):', [1, ...gaps].join(' → '));
expect(gaps[0] >= 2 && gaps[0] <= 4 && gaps[3] >= 40, `gaps grow like Anki's: ${gaps}`);
expect(cardStatus(c) === 'mastered', 'a card 21+ days apart is mastered');

// A lapse: ease drops, gap halves, back to relearning.
const before = c;
now = c.due;
c = schedule(c, false, { now });
expect(c.state === 'relearning' && c.lapses === 1 && c.ease < before.ease && c.due - now === LEARN_STEP, 'missed review -> relearning in 10 min, ease drops');
expect(c.interval === Math.round(before.interval / 2), 'missed review halves the gap');
now = c.due;
c = schedule(c, true, { now });
expect(c.state === 'review' && days(c, now) === c.interval, 'relearned -> back to review at the halved gap');

// A retry in the same round doesn't graduate a word.
let r = schedule(undefined, false, { now });
r = schedule(r, true, { now: now + 60000, retry: true });
expect(r.state === 'learning', 'retry right in the same round stays learning');

// Rounds: due cards come first.
now = Date.now();
let memory = {};
const round1 = makeRound('meaning', '3', memory);
for (const q of round1) memory = recordAnswer({ items: memory }, q, false, now - 2 * DAY).items; // missed 2 days ago -> due
const dueNow = new Set(dueKeys('3', memory, now));
expect(dueNow.size === round1.length, `missed words are due (${dueNow.size}/${round1.length})`);
const round2 = makeRound('which', '3', memory);
const dueAsked = round2.filter((q) => dueNow.has(q.key)).length;
expect(dueAsked === round1.length, `next round asks all ${round1.length} due words first (asked ${dueAsked})`);
const review = makeRound('review', '3', memory);
expect(review.length && review.every((q) => dueNow.has(q.key)), 'Review only asks due words');

// Learned words aren't asked again until due, and new words are capped
// while reviews wait.
memory = {};
for (const q of makeRound('meaning', '2', memory)) memory[q.key] = { ...schedule(undefined, true, { now }), state: 'review', interval: 5, due: now + 5 * DAY };
const later = makeRound('meaning', '2', memory);
expect(later.every((q) => !memory[q.key]), 'words not due yet wait while new ones remain');
const again = againQuestion(later[0]);
expect(again.retry && again.key === later[0].key, 'missed question comes back as a retry');
expect(isDue({ state: 'review', due: now - 1 }, now) && !isDue({ state: 'new', due: 0 }, now), 'isDue');

console.log(problems ? `${problems} problems` : 'Spaced repetition: all good.');
process.exit(problems ? 1 : 0);
