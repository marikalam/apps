import {
  SOUNDS,
  SOUNDS_FOR_GRADE,
  PICTURE_WORDS,
  RHYMES,
  SIGHT_WORDS,
  firstSoundOf,
  partSay,
  pictureWord,
  soundLabel,
  wordParts,
} from './content/phonics.js';
import { PICTURE_VOCAB, VOCAB, tooClose } from './content/vocab.js';
import { gradeInfo, gradeModes } from './grades.js';

export const ROUND_LENGTH = 10;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(list, n) {
  return shuffle(list).slice(0, n);
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Picks `n` different items, favoring ones this player has missed or
// hasn't seen much: an item missed twice is about three times as likely
// to come up as one they always get right. `memory` is the player's
// { [key]: { right, wrong } }.
function pickFavoringMisses(items, keyOf, memory, n) {
  const pool = items.map((item) => {
    const m = memory?.[keyOf(item)] || { right: 0, wrong: 0 };
    const seen = m.right + m.wrong;
    const weight = Math.max(0.35, 1 + m.wrong * 1.2 - m.right * 0.3 + (seen === 0 ? 0.6 : 0));
    return { item, weight };
  });
  const chosen = [];
  while (chosen.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    chosen.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  // Too few items for a whole round: go round again.
  while (chosen.length < n && items.length) chosen.push(items[chosen.length % items.length]);
  return chosen;
}

// Puts the right answer and the wrong ones in a random order.
function withChoices(q, right, wrong) {
  const choices = shuffle([right, ...wrong]);
  return { ...q, choices, answer: right.id };
}

// ---------------------------------------------------------------- pools

function gradeSounds(g) {
  return SOUNDS.slice(0, SOUNDS_FOR_GRADE[g]);
}

function gradePictureWords(g) {
  if (g === 'p' || g === 'k') return PICTURE_WORDS.filter((p) => p.level === 1);
  if (g === '1') return PICTURE_WORDS;
  return PICTURE_WORDS.filter((p) => p.level === 2);
}

function gradeSight(g) {
  if (g === 'p' || g === 'k') return SIGHT_WORDS[1];
  if (g === '1') return [...SIGHT_WORDS[2], ...SIGHT_WORDS[1]];
  if (g === '2') return SIGHT_WORDS[3];
  return SIGHT_WORDS[4];
}

// Vocabulary for a grade: its own list, plus a few words from the grade
// before to keep them fresh.
function gradeVocab(g) {
  const level = { p: 1, k: 1, 1: 1, 2: 2, 3: 3, 4: 4 }[g];
  const own = VOCAB[level];
  const review = VOCAB[level - 1] ? sample(VOCAB[level - 1], 6) : [];
  return [...own, ...review];
}

// The words a question draws wrong answers from: same list as the word.
function vocabSiblings(t) {
  return VOCAB[t.level];
}

// --------------------------------------------------------- question makers

const MAKERS = {
  // Hear a sound, tap its letter.
  sounds(g, memory, n) {
    const pool = gradeSounds(g);
    return pickFavoringMisses(pool, (s) => `snd:${s.id}`, memory, n).map((s) => {
      const wrong = sample(
        pool.filter((o) => o.id !== s.id && o.say !== s.say && !(['c', 'k'].includes(o.id) && ['c', 'k'].includes(s.id))),
        3,
      );
      const asChoice = (o) => ({ id: o.id, label: soundLabel(o), speak: `${o.say}` });
      return withChoices(
        {
          mode: 'sounds',
          key: `snd:${s.id}`,
          title: 'Which letter makes this sound?',
          prompt: { kind: 'sound', big: '🔊', small: 'Tap to hear it again' },
          speak: `Which letter says ${s.say}?`,
          replay: `${s.say}. ${s.say}.`,
          style: 'letter',
          after: { text: `“${soundLabel(s)}” says ${s.say}, like ${s.key} ${s.pic}`, speak: `${s.say}. ${s.say}, like ${s.key}.` },
        },
        asChoice(s),
        wrong.map(asChoice),
      );
    });
  },

  // A picture: which letter does its word start with?
  first(g, memory, n) {
    const pool = gradePictureWords(g === 'p' ? 'k' : g);
    return pickFavoringMisses(pool, (p) => `first:${p.w}`, memory, n).map((p) => {
      const right = firstSoundOf(p);
      const letters = [...new Set(SOUNDS.filter((s) => !s.show && s.id.length <= 2 && s.id !== 'ing').map((s) => s.id))];
      const clash = (l) => l === right || (['c', 'k'].includes(l) && ['c', 'k'].includes(right)) || (right.startsWith(l) || l.startsWith(right));
      const wrong = sample(letters.filter((l) => !clash(l)), 3);
      const say = partSay(wordParts(p)[0]);
      return withChoices(
        {
          mode: 'first',
          key: `first:${p.w}`,
          title: 'What sound does it start with?',
          prompt: { kind: 'pic', big: p.pic, small: p.w },
          speak: `${p.w}. What sound does ${p.w} start with?`,
          replay: p.w,
          style: 'letter',
          after: { text: `${cap(p.w)} starts with “${right}”: ${say}…${p.w}`, speak: `${say}. ${p.w}.` },
        },
        { id: right, label: right, speak: say },
        wrong.map((l) => ({ id: l, label: l, speak: partSay({ sound: l }) })),
      );
    });
  },

  // "Say it slowly, then say it fast": the sounds are said one at a time,
  // and the child finds the word they make.
  blend(g, memory, n) {
    const pool = gradePictureWords(g === 'p' ? 'k' : g);
    return pickFavoringMisses(pool, (p) => `blend:${p.w}`, memory, n).map((p) => {
      const parts = wordParts(p).filter((x) => partSay(x));
      const slow = parts.map(partSay);
      const letters = parts.map((x) => x.text).join('–');
      const wrong = sample(pool.filter((o) => o.w !== p.w), 3);
      const asChoice = (o) => ({ id: o.w, label: o.w, pic: o.pic, speak: o.w });
      return withChoices(
        {
          mode: 'blend',
          key: `blend:${p.w}`,
          title: 'Say it fast! Which one is it?',
          prompt: { kind: 'slow', big: `👂 ${slow.map(() => '●').join(' ')}`, small: `${slow.length} sounds · tap to hear them again` },
          speak: `Listen, then say it fast. ${slow.join('... ')}.`,
          replay: `${slow.join('... ')}.`,
          style: 'pic',
          after: { text: `${letters} … ${p.w}! ${p.pic}`, speak: `${slow.join('... ')}. ${p.w}!` },
        },
        asChoice(p),
        wrong.map(asChoice),
      );
    });
  },

  // A written word to read sound by sound (each sound can be tapped and
  // heard), then match to its picture.
  soundout(g, memory, n) {
    const pool = gradePictureWords(g);
    return pickFavoringMisses(pool, (p) => `read:${p.w}`, memory, n).map((p) => {
      const parts = wordParts(p);
      const wrong = sample(pool.filter((o) => o.w !== p.w), 3);
      const asChoice = (o) => ({ id: o.w, label: '', pic: o.pic, speak: '' });
      const slow = parts.map(partSay).filter(Boolean);
      return withChoices(
        {
          mode: 'soundout',
          key: `read:${p.w}`,
          title: 'Sound it out. Which picture is it?',
          prompt: { kind: 'parts', parts, small: 'Tap each sound, then say it fast' },
          speak: 'Sound it out. Touch each sound, then say it fast.',
          style: 'pic',
          after: { text: `${parts.filter((x) => partSay(x)).map((x) => x.text).join('–')} … “${p.w}” ${p.pic}`, speak: `${slow.join('... ')}. ${p.w}!` },
        },
        asChoice(p),
        wrong.map(asChoice),
      );
    });
  },

  // Which word rhymes with this one?
  rhyme(g, memory, n) {
    const families = RHYMES;
    const words = families.flat().map(pictureWord);
    return pickFavoringMisses(words, (p) => `rhyme:${p.w}`, memory, n).map((p) => {
      const family = families.find((f) => f.includes(p.w));
      const right = pictureWord(sample(family.filter((w) => w !== p.w), 1)[0]);
      const others = families.filter((f) => f !== family).flat().map(pictureWord);
      const wrong = sample(others, 3);
      const asChoice = (o) => ({ id: o.w, label: o.w, pic: o.pic, speak: o.w });
      const ending = p.w.slice(p.w.search(/[aeiou]/));
      return withChoices(
        {
          mode: 'rhyme',
          key: `rhyme:${p.w}`,
          title: 'Which one rhymes?',
          prompt: { kind: 'pic', big: p.pic, small: p.w },
          speak: `Which one rhymes with ${p.w}?`,
          replay: p.w,
          style: 'pic',
          after: {
            text: `${cap(p.w)} and ${right.w} rhyme: they both end in “-${ending}”.`,
            speak: `${p.w}, ${right.w}. They rhyme!`,
          },
        },
        asChoice(right),
        wrong.map(asChoice),
      );
    });
  },

  // Hear a sight word, tap it. Wrong choices look alike (same first letter
  // or same length), so it takes really reading it.
  sight(g, memory, n) {
    const pool = gradeSight(g);
    return pickFavoringMisses(pool, (w) => `sight:${w}`, memory, n).map((w) => {
      const look = pool.filter((o) => o !== w && o.toLowerCase() !== w.toLowerCase());
      const alike = look.filter((o) => o[0].toLowerCase() === w[0].toLowerCase() || Math.abs(o.length - w.length) <= 1);
      const wrong = sample(alike.length >= 3 ? alike : look, 3);
      return withChoices(
        {
          mode: 'sight',
          key: `sight:${w}`,
          title: 'Find the word you hear',
          prompt: { kind: 'sound', big: '🔊', small: 'Tap to hear it again' },
          speak: `Find the word: ${w}.`,
          replay: w,
          style: 'word',
          after: { text: `That word is “${w}”.`, speak: w },
        },
        { id: w, label: w, speak: w },
        wrong.map((o) => ({ id: o, label: o, speak: o })),
      );
    });
  },

  // "Which one is ENORMOUS?" with four pictures.
  bigwords(g, memory, n) {
    const pool = PICTURE_VOCAB;
    return pickFavoringMisses(pool, (v) => `big:${v.w}`, memory, n).map((v) => {
      const wrong = sample(pool.filter((o) => o.group !== v.group), 3);
      const asChoice = (o) => ({ id: o.w, label: '', pic: o.pic, speak: '' });
      return withChoices(
        {
          mode: 'bigwords',
          key: `big:${v.w}`,
          title: 'Which one is it?',
          prompt: { kind: 'word', big: v.w, small: 'Tap to hear it' },
          speak: `Which one is ${v.w}?`,
          replay: v.w,
          style: 'pic',
          after: { text: `${cap(v.w)} means ${v.def}. ${v.pic}`, speak: `${v.w} means ${v.def}.` },
        },
        asChoice(v),
        wrong.map(asChoice),
      );
    });
  },

  // What does this word mean?
  meaning(g, memory, n) {
    return pickFavoringMisses(gradeVocab(g), (v) => `word:${v.w}`, memory, n).map((v) => {
      const wrong = sample(vocabSiblings(v).filter((o) => !tooClose(v, o)), 3);
      const asChoice = (o) => ({ id: o.w, label: o.def, speak: o.def });
      return withChoices(
        {
          mode: 'meaning',
          key: `word:${v.w}`,
          title: 'What does it mean?',
          prompt: { kind: 'word', big: v.w, small: 'Tap to hear it' },
          speak: `What does ${v.w} mean?`,
          replay: v.w,
          style: 'text',
          after: vocabAfter(v),
        },
        asChoice(v),
        wrong.map(asChoice),
      );
    });
  },

  // A meaning: which word is it?
  which(g, memory, n) {
    return pickFavoringMisses(gradeVocab(g), (v) => `word:${v.w}`, memory, n).map((v) => {
      const wrong = sample(vocabSiblings(v).filter((o) => !tooClose(v, o)), 3);
      const asChoice = (o) => ({ id: o.w, label: o.w, speak: o.w });
      return withChoices(
        {
          mode: 'which',
          key: `word:${v.w}`,
          title: 'Which word means…',
          prompt: { kind: 'text', big: `“${v.def}”`, small: 'Tap to hear it' },
          speak: `Which word means ${v.def}?`,
          replay: v.def,
          style: 'word',
          after: vocabAfter(v),
        },
        asChoice(v),
        wrong.map(asChoice),
      );
    });
  },

  // A sentence with a gap: which word fits?
  blank(g, memory, n) {
    return pickFavoringMisses(gradeVocab(g), (v) => `word:${v.w}`, memory, n).map((v) => {
      const wrong = sample(vocabSiblings(v).filter((o) => !tooClose(v, o)), 3);
      const asChoice = (o) => ({ id: o.w, label: o.w, speak: o.w });
      return withChoices(
        {
          mode: 'blank',
          key: `word:${v.w}`,
          title: 'Which word fits?',
          prompt: { kind: 'text', big: v.s, small: 'Tap to hear it' },
          speak: v.s.replace('___', 'blank'),
          replay: v.s.replace('___', 'blank'),
          style: 'word',
          after: vocabAfter(v),
        },
        asChoice(v),
        wrong.map(asChoice),
      );
    });
  },

  // Which word means about the same?
  same(g, memory, n) {
    const pool = gradeVocab(g).filter((v) => v.syn);
    return pickFavoringMisses(pool, (v) => `word:${v.w}`, memory, n).map((v) => {
      const others = vocabSiblings(v).filter((o) => !tooClose(v, o));
      const wrong = sample([...new Set(others.map((o) => o.syn).filter((x) => x && x !== v.ant))], 3);
      return withChoices(
        {
          mode: 'same',
          key: `word:${v.w}`,
          title: 'Which word means about the same?',
          prompt: { kind: 'word', big: v.w, small: 'Tap to hear it' },
          speak: `Which word means about the same as ${v.w}?`,
          replay: v.w,
          style: 'word',
          after: { ...vocabAfter(v), text: `${cap(v.w)} ≈ ${v.syn}. ${vocabAfter(v).text}` },
        },
        { id: v.syn, label: v.syn, speak: v.syn },
        wrong.map((w) => ({ id: w, label: w, speak: w })),
      );
    });
  },

  // What's the opposite?
  opposite(g, memory, n) {
    const pool = gradeVocab(g).filter((v) => v.ant);
    return pickFavoringMisses(pool, (v) => `word:${v.w}`, memory, n).map((v) => {
      const others = vocabSiblings(v).filter((o) => !tooClose(v, o));
      const candidates = [...new Set(others.map((o) => o.ant).filter((a) => a && a !== v.ant && a !== v.syn))];
      const wrong = sample(candidates, 3);
      return withChoices(
        {
          mode: 'opposite',
          key: `word:${v.w}`,
          title: 'What is the opposite?',
          prompt: { kind: 'word', big: v.w, small: 'Tap to hear it' },
          speak: `What is the opposite of ${v.w}?`,
          replay: v.w,
          style: 'word',
          after: { ...vocabAfter(v), text: `${cap(v.w)} ↔ ${v.ant}. ${vocabAfter(v).text}` },
        },
        { id: v.ant, label: v.ant, speak: v.ant },
        wrong.map((w) => ({ id: w, label: w, speak: w })),
      );
    });
  },

  // Hear a word, pick the right spelling out of four.
  spell(g, memory, n) {
    const pool = gradeVocab(g);
    return pickFavoringMisses(pool, (v) => `spell:${v.w}`, memory, n).map((v) => {
      const wrong = misspellings(v.w, 3);
      return withChoices(
        {
          mode: 'spell',
          key: `spell:${v.w}`,
          title: 'Which spelling is right?',
          prompt: { kind: 'sound', big: '🔊', small: `“${v.def}”` },
          speak: `Spell ${v.w}. ${v.s.replace('___', v.w)}`,
          replay: v.w,
          style: 'word',
          after: vocabAfter(v),
        },
        { id: v.w, label: v.w, speak: '' },
        wrong.map((w) => ({ id: w, label: w, speak: '' })),
      );
    });
  },
};

function vocabAfter(v) {
  const sentence = v.s.replace('___', v.w);
  return { text: `${cap(v.w)} means ${v.def}. “${sentence}”`, speak: `${v.w} means ${v.def}. ${sentence}` };
}

// Believable wrong spellings: doubled or undoubled letters, swapped
// vowels, common ending mix-ups.
const ENDINGS = [
  ['ous', 'us'],
  ['ious', 'eous'],
  ['ent', 'ant'],
  ['ant', 'ent'],
  ['ence', 'ance'],
  ['ible', 'able'],
  ['tion', 'sion'],
  ['ate', 'ait'],
  ['ic', 'ick'],
  ['y', 'ey'],
  ['le', 'el'],
  ['al', 'le'],
];
const VOWEL_SWAP = { a: 'e', e: 'i', i: 'e', o: 'u', u: 'o' };

export function misspellings(word, n) {
  const out = new Set();
  const tries = [];
  for (const [from, to] of ENDINGS) if (word.endsWith(from)) tries.push(word.slice(0, -from.length) + to);
  for (let i = 1; i < word.length - 1; i++) {
    const ch = word[i];
    if (VOWEL_SWAP[ch]) tries.push(word.slice(0, i) + VOWEL_SWAP[ch] + word.slice(i + 1));
    if (ch === word[i + 1]) tries.push(word.slice(0, i) + word.slice(i + 1));
    else if (!'aeiouy'.includes(ch) && 'aeiou'.includes(word[i - 1]) && 'aeiou'.includes(word[i + 1] || '')) {
      tries.push(word.slice(0, i) + ch + word.slice(i));
    }
  }
  if (word.includes('c')) tries.push(word.replace('c', 'k'));
  if (word.includes('ph')) tries.push(word.replace('ph', 'f'));
  if (word.endsWith('e')) tries.push(word.slice(0, -1));
  // Fallbacks for short words: two letters swapped, an extra e, the last
  // letter doubled.
  const backup = [];
  for (let i = 1; i < word.length - 1; i++) backup.push(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  if (!word.endsWith('e')) backup.push(`${word}e`);
  backup.push(word + word[word.length - 1]);
  if (VOWEL_SWAP[word[0]]) backup.push(VOWEL_SWAP[word[0]] + word.slice(1));
  for (const t of [...shuffle(tries), ...shuffle(backup)]) {
    if (t !== word && /^[a-z-]+$/.test(t)) out.add(t);
    if (out.size >= n) break;
  }
  return [...out];
}

// One round: ten questions from one game, or for Random Mix, from all of
// the grade's games.
export function makeRound(mode, gradeId, memory) {
  const g = gradeInfo(gradeId).id;
  if (mode !== 'mix') return MAKERS[mode](g, memory, ROUND_LENGTH);
  const modes = gradeModes(g);
  const counts = {};
  for (let i = 0; i < ROUND_LENGTH; i++) {
    const m = modes[i % modes.length];
    counts[m] = (counts[m] || 0) + 1;
  }
  // A couple of spares from each game, so the round is still ten long
  // after dropping repeats (the same word asked two ways).
  const qs = Object.entries(counts).flatMap(([m, c]) => MAKERS[m](g, memory, c + 2).map((q, i) => ({ q, spare: i >= c })));
  const seen = new Set();
  const keep = (list) => list.filter(({ q }) => (seen.has(q.key.replace(/^\w+:/, '')) ? false : seen.add(q.key.replace(/^\w+:/, ''))));
  const main = keep(shuffle(qs.filter((x) => !x.spare)));
  const spares = keep(shuffle(qs.filter((x) => x.spare)));
  return shuffle([...main, ...spares].slice(0, ROUND_LENGTH).map((x) => x.q));
}

export const MODE_IDS = Object.keys(MAKERS);
