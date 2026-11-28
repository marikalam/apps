// Phonics, taught the way "Teach Your Child to Read in 100 Easy Lessons"
// (Engelmann, Haddox & Bruner) teaches it:
//   1. Letters are learned by their SOUND, not their name: "m" is "mmm",
//      not "em".
//   2. Sounds come in a set order, starting with sounds you can hold
//      (m, s, a, e, r…) because they are easiest to stretch and blend.
//      Stop sounds (t, d, c…) are said quickly, with no "uh" tacked on.
//   3. "Say it slowly, then say it fast": a word is stretched out sound by
//      sound ("mmmaaat"), then said fast ("mat"). That's blending.
//   4. Sounding out: the child touches each sound in a written word, says
//      it, then says the word fast.
//   5. Rhyming: words that end the same way are read together.
// The order below follows the book's order of new sounds (simplified: a
// few sounds the book marks with special symbols are left out). The book
// itself isn't reproduced here; only its method.

// Each sound: id (also how it's written), what the voice says for it,
// whether it can be held ("continuous") or is quick ("stop"), and a key
// word with a picture.
//   say: spelled so the voice gets close to the bare sound.
export const SOUNDS = [
  { id: 'm', say: 'mmm', kind: 'hold', key: 'moon', pic: '🌙' },
  { id: 's', say: 'sss', kind: 'hold', key: 'sun', pic: '☀️' },
  { id: 'a', say: 'aah', kind: 'hold', key: 'apple', pic: '🍎', vowel: true },
  { id: 'ee', show: 'ē', say: 'eee', kind: 'hold', key: 'eat', pic: '🍽️', vowel: true },
  { id: 'r', say: 'rrr', kind: 'hold', key: 'rabbit', pic: '🐇' },
  { id: 'd', say: 'd', kind: 'stop', key: 'dog', pic: '🐶' },
  { id: 'f', say: 'fff', kind: 'hold', key: 'fish', pic: '🐟' },
  { id: 'i', say: 'ih', kind: 'hold', key: 'insect', pic: '🐛', vowel: true },
  { id: 'th', say: 'thh', kind: 'hold', key: 'thumb', pic: '👍' },
  { id: 't', say: 't', kind: 'stop', key: 'turtle', pic: '🐢' },
  { id: 'n', say: 'nnn', kind: 'hold', key: 'nose', pic: '👃' },
  { id: 'c', say: 'k', kind: 'stop', key: 'cat', pic: '🐱' },
  { id: 'o', say: 'aw', kind: 'hold', key: 'octopus', pic: '🐙', vowel: true },
  { id: 'ay', show: 'ā', say: 'ay', kind: 'hold', key: 'acorn', pic: '🌰', vowel: true },
  { id: 'h', say: 'h', kind: 'stop', key: 'hat', pic: '🎩' },
  { id: 'u', say: 'uh', kind: 'hold', key: 'umbrella', pic: '☂️', vowel: true },
  { id: 'g', say: 'g', kind: 'stop', key: 'goat', pic: '🐐' },
  { id: 'l', say: 'lll', kind: 'hold', key: 'lion', pic: '🦁' },
  { id: 'w', say: 'www', kind: 'hold', key: 'web', pic: '🕸️' },
  { id: 'sh', say: 'shh', kind: 'hold', key: 'ship', pic: '🚢' },
  { id: 'ie', show: 'ī', say: 'eye', kind: 'hold', key: 'ice cream', pic: '🍦', vowel: true },
  { id: 'k', say: 'k', kind: 'stop', key: 'kite', pic: '🪁' },
  { id: 'oh', show: 'ō', say: 'oh', kind: 'hold', key: 'ocean', pic: '🌊', vowel: true },
  { id: 'v', say: 'vvv', kind: 'hold', key: 'van', pic: '🚐' },
  { id: 'p', say: 'p', kind: 'stop', key: 'pig', pic: '🐷' },
  { id: 'ch', say: 'ch', kind: 'stop', key: 'cheese', pic: '🧀' },
  { id: 'e', say: 'eh', kind: 'hold', key: 'egg', pic: '🥚', vowel: true },
  { id: 'b', say: 'b', kind: 'stop', key: 'ball', pic: '⚽' },
  { id: 'ing', say: 'ing', kind: 'hold', key: 'ring', pic: '💍' },
  { id: 'y', say: 'yee', kind: 'hold', key: 'yo-yo', pic: '🪀' },
  { id: 'er', say: 'urr', kind: 'hold', key: 'tiger', pic: '🐯' },
  { id: 'oo', say: 'ooo', kind: 'hold', key: 'boot', pic: '🥾', vowel: true },
  { id: 'j', say: 'j', kind: 'stop', key: 'juice', pic: '🧃' },
  { id: 'wh', say: 'www', kind: 'hold', key: 'whale', pic: '🐳' },
  { id: 'qu', say: 'kw', kind: 'stop', key: 'queen', pic: '👑' },
  { id: 'x', say: 'ks', kind: 'stop', key: 'fox', pic: '🦊' },
  { id: 'z', say: 'zzz', kind: 'hold', key: 'zebra', pic: '🦓' },
];

export function soundInfo(id) {
  return SOUNDS.find((s) => s.id === id);
}

export function soundLabel(s) {
  return s.show || s.id;
}

// How many sounds in the book's order each grade works with: Toddlers
// start with the first dozen, Kindergarten has them all.
export const SOUNDS_FOR_GRADE = { p: 14, k: SOUNDS.length, 1: SOUNDS.length, 2: SOUNDS.length, 3: SOUNDS.length, 4: SOUNDS.length };

// The bit of speech a sound makes in a word. Extra spellings that only
// show up inside words (ck, ar, a_e…) are listed here too.
export const SOUND_SAY = {
  ...Object.fromEntries(SOUNDS.map((s) => [s.id, s.say])),
  ck: 'k',
  ar: 'ar',
  or: 'or',
  ow: 'ow',
  ou: 'ow',
  ai: 'ay',
  oa: 'oh',
  ea: 'eee',
  igh: 'eye',
  ue: 'you',
  ng: 'ng',
  nk: 'nk',
  y_long: 'eye',
  ew: 'you',
  _: '',
};

// Picture words. `parts` splits the word into its sounds, as a child
// would touch them: "sh i p". A part written "a=ay" shows "a" but makes
// the "ay" sound; "e=_" is a silent letter.
//   level 1: three-sound words (cat, sun) - Toddler, K, 1st
//   level 2: blends, digraphs and long vowels (ship, frog, cake) - 1st, 2nd
export const PICTURE_WORDS = [
  // level 1
  { w: 'cat', pic: '🐱', parts: 'c a t', level: 1 },
  { w: 'hat', pic: '🎩', parts: 'h a t', level: 1 },
  { w: 'bat', pic: '🦇', parts: 'b a t', level: 1 },
  { w: 'rat', pic: '🐀', parts: 'r a t', level: 1 },
  { w: 'map', pic: '🗺️', parts: 'm a p', level: 1 },
  { w: 'van', pic: '🚐', parts: 'v a n', level: 1 },
  { w: 'fan', pic: '🪭', parts: 'f a n', level: 1 },
  { w: 'can', pic: '🥫', parts: 'c a n', level: 1 },
  { w: 'pan', pic: '🍳', parts: 'p a n', level: 1 },
  { w: 'man', pic: '👨', parts: 'm a n', level: 1 },
  { w: 'bag', pic: '👜', parts: 'b a g', level: 1 },
  { w: 'sad', pic: '😢', parts: 's a d', level: 1 },
  { w: 'dog', pic: '🐶', parts: 'd o g', level: 1 },
  { w: 'log', pic: '🪵', parts: 'l o g', level: 1 },
  { w: 'fox', pic: '🦊', parts: 'f o x', level: 1 },
  { w: 'box', pic: '📦', parts: 'b o x', level: 1 },
  { w: 'pot', pic: '🍲', parts: 'p o t', level: 1 },
  { w: 'sun', pic: '☀️', parts: 's u n', level: 1 },
  { w: 'run', pic: '🏃', parts: 'r u n', level: 1 },
  { w: 'bug', pic: '🐛', parts: 'b u g', level: 1 },
  { w: 'mug', pic: '☕', parts: 'm u g', level: 1 },
  { w: 'bus', pic: '🚌', parts: 'b u s', level: 1 },
  { w: 'cup', pic: '🥤', parts: 'c u p', level: 1 },
  { w: 'nut', pic: '🥜', parts: 'n u t', level: 1 },
  { w: 'hut', pic: '🛖', parts: 'h u t', level: 1 },
  { w: 'pig', pic: '🐷', parts: 'p i g', level: 1 },
  { w: 'pin', pic: '📌', parts: 'p i n', level: 1 },
  { w: 'bin', pic: '🗑️', parts: 'b i n', level: 1 },
  { w: 'six', pic: '6️⃣', parts: 's i x', level: 1 },
  { w: 'lips', pic: '👄', parts: 'l i p s', level: 1 },
  { w: 'bed', pic: '🛏️', parts: 'b e d', level: 1 },
  { w: 'red', pic: '🟥', parts: 'r e d', level: 1 },
  { w: 'hen', pic: '🐔', parts: 'h e n', level: 1 },
  { w: 'pen', pic: '🖊️', parts: 'p e n', level: 1 },
  { w: 'ten', pic: '🔟', parts: 't e n', level: 1 },
  { w: 'net', pic: '🥅', parts: 'n e t', level: 1 },
  { w: 'jet', pic: '✈️', parts: 'j e t', level: 1 },
  { w: 'web', pic: '🕸️', parts: 'w e b', level: 1 },
  { w: 'egg', pic: '🥚', parts: 'e gg=g', level: 1 },
  { w: 'ant', pic: '🐜', parts: 'a n t', level: 1 },
  // level 2
  { w: 'fish', pic: '🐟', parts: 'f i sh', level: 2 },
  { w: 'dish', pic: '🍽️', parts: 'd i sh', level: 2 },
  { w: 'ship', pic: '🚢', parts: 'sh i p', level: 2 },
  { w: 'duck', pic: '🦆', parts: 'd u ck', level: 2 },
  { w: 'sock', pic: '🧦', parts: 's o ck', level: 2 },
  { w: 'frog', pic: '🐸', parts: 'f r o g', level: 2 },
  { w: 'crab', pic: '🦀', parts: 'c r a b', level: 2 },
  { w: 'drum', pic: '🥁', parts: 'd r u m', level: 2 },
  { w: 'flag', pic: '🚩', parts: 'f l a g', level: 2 },
  { w: 'sled', pic: '🛷', parts: 's l e d', level: 2 },
  { w: 'plant', pic: '🪴', parts: 'p l a n t', level: 2 },
  { w: 'truck', pic: '🚚', parts: 't r u ck', level: 2 },
  { w: 'skunk', pic: '🦨', parts: 's k u nk', level: 2 },
  { w: 'king', pic: '🤴', parts: 'k ing', level: 2 },
  { w: 'ring', pic: '💍', parts: 'r ing', level: 2 },
  { w: 'chick', pic: '🐥', parts: 'ch i ck', level: 2 },
  { w: 'cake', pic: '🎂', parts: 'c a=ay k e=_', level: 2 },
  { w: 'snake', pic: '🐍', parts: 's n a=ay k e=_', level: 2 },
  { w: 'kite', pic: '🪁', parts: 'k i=ie t e=_', level: 2 },
  { w: 'bike', pic: '🚲', parts: 'b i=ie k e=_', level: 2 },
  { w: 'five', pic: '5️⃣', parts: 'f i=ie v e=_', level: 2 },
  { w: 'bone', pic: '🦴', parts: 'b o=oh n e=_', level: 2 },
  { w: 'nose', pic: '👃', parts: 'n o=oh s=z e=_', level: 2 },
  { w: 'tree', pic: '🌳', parts: 't r ee', level: 2 },
  { w: 'bee', pic: '🐝', parts: 'b ee', level: 2 },
  { w: 'sheep', pic: '🐑', parts: 'sh ee p', level: 2 },
  { w: 'three', pic: '3️⃣', parts: 'th r ee', level: 2 },
  { w: 'boat', pic: '⛵', parts: 'b oa t', level: 2 },
  { w: 'goat', pic: '🐐', parts: 'g oa t', level: 2 },
  { w: 'coat', pic: '🧥', parts: 'c oa t', level: 2 },
  { w: 'train', pic: '🚆', parts: 't r ai n', level: 2 },
  { w: 'car', pic: '🚗', parts: 'c ar', level: 2 },
  { w: 'star', pic: '⭐', parts: 's t ar', level: 2 },
  { w: 'jar', pic: '🫙', parts: 'j ar', level: 2 },
  { w: 'moon', pic: '🌙', parts: 'm oo n', level: 2 },
  { w: 'spoon', pic: '🥄', parts: 's p oo n', level: 2 },
  { w: 'horn', pic: '📯', parts: 'h or n', level: 2 },
  { w: 'corn', pic: '🌽', parts: 'c or n', level: 2 },
  { w: 'cow', pic: '🐮', parts: 'c ow', level: 2 },
  { w: 'house', pic: '🏠', parts: 'h ou s e=_', level: 2 },
  { w: 'whale', pic: '🐳', parts: 'wh a=ay l e=_', level: 2 },
  { w: 'cheese', pic: '🧀', parts: 'ch ee s=z e=_', level: 2 },
];

// "c a=ay k e=_" -> [{ text: 'c', sound: 'c' }, { text: 'a', sound: 'ay' }, ...]
export function wordParts(word) {
  return word.parts.split(' ').map((tok) => {
    const [text, sound] = tok.split('=');
    return { text, sound: sound ?? text };
  });
}

export function partSay(part) {
  return SOUND_SAY[part.sound] ?? part.sound;
}

// The first sound a picture word starts with, as a letter (or two) to tap.
export function firstSoundOf(word) {
  const first = wordParts(word)[0];
  return first.text;
}

// Rhyming families: every word in a family rhymes with the others.
export const RHYMES = [
  ['cat', 'hat', 'bat', 'rat'],
  ['dog', 'log', 'frog'],
  ['fan', 'van', 'can', 'pan', 'man'],
  ['bug', 'mug'],
  ['hen', 'pen', 'ten'],
  ['net', 'jet'],
  ['fox', 'box'],
  ['nut', 'hut'],
  ['pin', 'bin'],
  ['bed', 'red'],
  ['fish', 'dish'],
  ['cake', 'snake'],
  ['kite', 'bite'],
  ['tree', 'bee', 'three'],
  ['car', 'star', 'jar'],
  ['moon', 'spoon'],
  ['boat', 'goat', 'coat'],
  ['king', 'ring'],
  ['horn', 'corn'],
  ['sun', 'run'],
]
  .map((family) => family.filter((w) => PICTURE_WORDS.some((p) => p.w === w)))
  .filter((family) => family.length >= 2);

export function pictureWord(w) {
  return PICTURE_WORDS.find((p) => p.w === w);
}

// Sight words: common words that are learned by sight because they don't
// sound out neatly (Dolch lists: pre-primer, primer, first grade, second
// grade).
export const SIGHT_WORDS = {
  1: 'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you'.split(' '),
  2: 'all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes'.split(' '),
  3: 'after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when'.split(' '),
  4: 'always around because been before best both buy call cold does don’t fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your'.split(' '),
};
