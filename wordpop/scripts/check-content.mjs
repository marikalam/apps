// Plays thousands of made-up rounds for every grade and game and checks
// each question: four different choices, the right answer among them,
// and something to show or say for every choice.
import { makeRound, MODE_IDS, misspellings } from '../src/questions.js';
import { GRADES, GRADE_PRACTICE } from '../src/grades.js';
import { VOCAB } from '../src/content/vocab.js';

let problems = 0;
const fail = (msg) => {
  problems++;
  if (problems < 40) console.log('✗', msg);
};

for (const g of GRADES) {
  for (const mode of [...GRADE_PRACTICE[g.id], 'mix']) {
    for (let i = 0; i < 300; i++) {
      const round = makeRound(mode, g.id, {});
      if (round.length < 8) fail(`${g.id}/${mode}: only ${round.length} questions`);
      for (const q of round) {
        const ids = q.choices.map((c) => c.id);
        const labels = q.choices.map((c) => c.label || c.pic);
        if (q.choices.length !== 4) fail(`${g.id}/${q.mode} ${q.key}: ${q.choices.length} choices`);
        if (new Set(ids).size !== ids.length) fail(`${g.id}/${q.mode} ${q.key}: repeated choice ${ids}`);
        if (new Set(labels).size !== labels.length) fail(`${g.id}/${q.mode} ${q.key}: repeated look ${labels}`);
        if (!ids.includes(q.answer)) fail(`${g.id}/${q.mode} ${q.key}: answer missing`);
        if (labels.some((l) => !l)) fail(`${g.id}/${q.mode} ${q.key}: empty choice`);
      }
    }
  }
}
for (const list of Object.values(VOCAB)) {
  for (const v of list) {
    if (!v.s.includes('___')) fail(`sentence for ${v.w} has no blank`);
    if (misspellings(v.w, 3).length < 3) fail(`not enough misspellings for ${v.w}: ${misspellings(v.w, 3)}`);
  }
}
console.log(problems ? `${problems} problems` : `All good: ${GRADES.length} grades × games × 300 rounds checked.`);
process.exit(problems ? 1 : 0);
