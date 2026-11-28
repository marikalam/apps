// The grades a player can be set to (same set and colors as MathPop).
// Each grade picks which practice games show on the home screen and how
// hard the words in them are.
export const GRADES = [
  { id: 'p', short: 'Toddler', label: 'Toddler (ages 2–4)', age: '2–4', color: '#F59E0B', icon: '🐣' },
  { id: 'k', short: 'K', label: 'Kindergarten', age: '5', color: '#F06F9A', icon: '🔤' },
  { id: '1', short: '1st', label: '1st grade', age: '6', color: '#F0954F', icon: '📖' },
  { id: '2', short: '2nd', label: '2nd grade', age: '7', color: '#2FAE6B', icon: '📚' },
  { id: '3', short: '3rd', label: '3rd grade', age: '8', color: '#3B6FEF', icon: '💡' },
  { id: '4', short: '4th', label: '4th grade', age: '9+', color: '#8E4FD6', icon: '🎓' },
];

export const DEFAULT_GRADE = 'k';

export function gradeInfo(id) {
  return GRADES.find((g) => g.id === id) || GRADES.find((g) => g.id === DEFAULT_GRADE);
}

// The practice games, with the colors of their home-screen tile.
export const MODES = {
  sounds: { title: 'Letter Sounds', sub: 'Hear a sound, find its letter', icon: '🔤', from: '#f5a524', to: '#e07b12' },
  first: { title: 'First Sound', sub: 'What does it start with?', icon: '🐟', from: '#3b8cf0', to: '#2563d6' },
  blend: { title: 'Say It Fast', sub: 'Slow sounds make a word', icon: '🐢', from: '#2fae6b', to: '#1e8a52' },
  soundout: { title: 'Sound It Out', sub: 'Tap each sound, read the word', icon: '👆', from: '#14b8a6', to: '#0e8f82' },
  rhyme: { title: 'Rhyme Time', sub: 'Cat, hat, bat!', icon: '🎵', from: '#ec5f9a', to: '#cf3f7c' },
  sight: { title: 'Sight Words', sub: 'Know it by looking', icon: '👀', from: '#8e4fd6', to: '#6d33b5' },
  bigwords: { title: 'Big Words', sub: 'Fancy words, fun pictures', icon: '🐘', from: '#e5484d', to: '#c22f35' },
  meaning: { title: 'What Does It Mean?', sub: 'Pick the meaning', icon: '💡', from: '#3b6fef', to: '#2b52c4' },
  which: { title: 'Word Match', sub: 'Find the word that fits', icon: '🎯', from: '#f0954f', to: '#d6742c' },
  blank: { title: 'Fill the Blank', sub: 'Finish the sentence', icon: '✏️', from: '#2fae6b', to: '#1e8a52' },
  same: { title: 'Same Meaning', sub: 'Find the synonym', icon: '🤝', from: '#14b8a6', to: '#0e8f82' },
  opposite: { title: 'Opposites', sub: 'Find the antonym', icon: '🔄', from: '#ec5f9a', to: '#cf3f7c' },
  mix: { title: 'Random Mix', sub: 'A bit of everything', icon: '🎲', from: '#f0954f', to: '#ec5f9a' },
  review: { title: 'Review', sub: 'Words due today', icon: '🔁', from: '#3b6fef', to: '#8e4fd6' },
  spell: { title: 'Spell It', sub: 'Which spelling is right?', icon: '🐝', from: '#8e4fd6', to: '#6d33b5' },
};

// The six games on each grade's home screen. Younger grades are all
// phonics (sounds, blending, sounding out, rhymes) with picture "big
// words"; reading grades move on to sight words; older grades are
// vocabulary, building up to real SAT words by 4th grade.
export const GRADE_PRACTICE = {
  p: ['bigwords', 'sounds', 'first', 'blend', 'rhyme'],
  k: ['sounds', 'blend', 'soundout', 'rhyme', 'sight', 'bigwords'],
  1: ['soundout', 'sight', 'rhyme', 'meaning', 'blank', 'opposite'],
  2: ['meaning', 'which', 'blank', 'opposite', 'sight', 'soundout'],
  3: ['meaning', 'which', 'blank', 'same', 'opposite', 'spell'],
  4: ['meaning', 'which', 'blank', 'same', 'opposite', 'spell'],
};

export function gradeModes(id) {
  return GRADE_PRACTICE[gradeInfo(id).id];
}

// The phonics corner of the home screen: Explore Letters for the grades
// still learning sounds, the Word Bank once they're on vocabulary.
export function exploreFor(id) {
  return ['p', 'k', '1'].includes(gradeInfo(id).id) ? 'letters' : 'bank';
}
