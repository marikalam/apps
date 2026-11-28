// "SAT words for little kids": big, rich words taught early, with a
// definition a child understands and a sentence that shows how the word is
// used. They grow from picture words for toddlers to real SAT-prep words
// in 4th grade.

// Toddler and Kindergarten "Big Words": each one has a picture, so the
// question can be "Which one is ENORMOUS?" with four pictures. `group`
// keeps two words that mean the same thing out of the same question.
export const PICTURE_VOCAB = [
  { w: 'enormous', pic: '🐘', def: 'very, very big', group: 'big' },
  { w: 'gigantic', pic: '🐳', def: 'super huge', group: 'big' },
  { w: 'tiny', pic: '🐜', def: 'very, very small', group: 'small' },
  { w: 'speedy', pic: '🐆', def: 'very fast', group: 'fast' },
  { w: 'sluggish', pic: '🐢', def: 'very slow', group: 'slow' },
  { w: 'exhausted', pic: '😴', def: 'very, very tired', group: 'tired' },
  { w: 'furious', pic: '😡', def: 'very, very angry', group: 'angry' },
  { w: 'frightened', pic: '😱', def: 'very scared', group: 'scared' },
  { w: 'delighted', pic: '😄', def: 'very happy', group: 'happy' },
  { w: 'gloomy', pic: '🌧️', def: 'dark and sad', group: 'gloomy' },
  { w: 'freezing', pic: '🥶', def: 'very, very cold', group: 'cold' },
  { w: 'scorching', pic: '🥵', def: 'very, very hot', group: 'hot' },
  { w: 'delicious', pic: '🍰', def: 'tastes really good', group: 'tasty' },
  { w: 'sparkling', pic: '✨', def: 'shiny and twinkly', group: 'shiny' },
  { w: 'ancient', pic: '🏛️', def: 'very, very old', group: 'old' },
  { w: 'noisy', pic: '📢', def: 'very loud', group: 'loud' },
  { w: 'silent', pic: '🤫', def: 'no sound at all', group: 'quiet' },
  { w: 'prickly', pic: '🌵', def: 'covered in sharp points', group: 'prickly' },
  { w: 'fragile', pic: '🥚', def: 'breaks easily', group: 'fragile' },
  { w: 'towering', pic: '🦒', def: 'very, very tall', group: 'tall' },
  { w: 'brave', pic: '🦁', def: 'not afraid', group: 'brave' },
  { w: 'famished', pic: '🍽️', def: 'very, very hungry', group: 'hungry' },
  { w: 'curious', pic: '🧐', def: 'wants to find out', group: 'curious' },
  { w: 'drenched', pic: '💦', def: 'soaking wet', group: 'wet' },
];

// Word lists for 1st to 4th grade: [word, kid definition, a word that
// means about the same, the opposite (or null), a sentence with ___
// where the word goes].
const raw = {
  1: [
    ['enormous', 'very, very big', 'huge', 'tiny', 'The ___ whale was bigger than our whole boat.'],
    ['tiny', 'very, very small', 'little', 'huge', 'The ___ ladybug fit on the tip of my finger.'],
    ['brave', 'not afraid to do something hard or scary', 'bold', 'scared', 'The ___ firefighter ran into the smoky house.'],
    ['curious', 'wanting to know or learn about something', 'interested', 'bored', 'The ___ kitten sniffed every box in the room.'],
    ['delighted', 'very happy and pleased', 'glad', 'upset', 'Grandma was ___ when we came to visit her.'],
    ['furious', 'very, very angry', 'mad', 'calm', 'Dad was ___ when the puppy chewed his new shoes.'],
    ['exhausted', 'very, very tired', 'worn out', 'rested', 'After the long hike, we were ___ and fell right asleep.'],
    ['famished', 'very, very hungry', 'starving', 'full', 'I was so ___ that I ate two sandwiches.'],
    ['frightened', 'very scared', 'afraid', 'brave', 'The ___ puppy hid under the bed during the thunder.'],
    ['speedy', 'very fast', 'quick', 'slow', 'The ___ rabbit zoomed past the turtle.'],
    ['ancient', 'very, very old', 'old', 'new', 'We saw ___ dinosaur bones at the museum.'],
    ['gloomy', 'dark and sad', 'dreary', 'cheerful', 'It was a gray, rainy, ___ day.'],
    ['fragile', 'easy to break', 'delicate', 'sturdy', 'Be careful with the ___ glass vase.'],
    ['giggle', 'to laugh in a light, silly way', 'chuckle', 'cry', 'The baby began to ___ when I made a funny face.'],
    ['gather', 'to bring things together into one place', 'collect', 'scatter', 'Let’s ___ the leaves into one big pile.'],
    ['vanish', 'to disappear all of a sudden', 'disappear', 'appear', 'The magician made the coin ___ into thin air.'],
    ['observe', 'to watch something carefully', 'watch', 'ignore', 'We ___ the caterpillar every day to see it change.'],
    ['sprint', 'to run as fast as you can', 'dash', 'stroll', 'I had to ___ to catch the school bus.'],
    ['timid', 'shy and easily scared', 'shy', 'bold', 'The ___ turtle hid inside its shell.'],
    ['cozy', 'warm, soft and comfy', 'snug', 'uncomfortable', 'I curled up under my ___ blanket.'],
    ['soggy', 'very wet and mushy', 'soaked', 'dry', 'My cereal got ___ in the milk.'],
    ['peculiar', 'strange or unusual', 'odd', 'normal', 'The ___ bird had a purple beak and orange feet.'],
    ['generous', 'happy to share and give', 'giving', 'selfish', 'My ___ friend shared her snack with me.'],
    ['shiver', 'to shake because you are cold or scared', 'tremble', null, 'We started to ___ in the icy wind.'],
    ['nibble', 'to eat with tiny bites', 'bite', null, 'The bunny likes to ___ on carrots.'],
  ],
  2: [
    ['abundant', 'more than enough; plenty', 'plentiful', 'scarce', 'Apples were ___ in the orchard this fall.'],
    ['scarce', 'hard to find; not enough', 'rare', 'plentiful', 'Water is ___ in the desert.'],
    ['cautious', 'careful to stay away from danger', 'careful', 'reckless', 'Be ___ when you cross a busy street.'],
    ['eager', 'really wanting to do something', 'excited', 'unwilling', 'The ___ students raised their hands right away.'],
    ['grateful', 'thankful for what you have', 'thankful', 'ungrateful', 'I am ___ for my friends and family.'],
    ['humble', 'not bragging about yourself', 'modest', 'boastful', 'Even after she won, she stayed ___.'],
    ['determined', 'not giving up until you reach your goal', 'persistent', null, 'He was ___ to finish the puzzle, no matter how long it took.'],
    ['reluctant', 'not wanting to do something', 'unwilling', 'eager', 'The cat was ___ to get into the bath.'],
    ['persuade', 'to get someone to agree with you', 'convince', null, 'I tried to ___ Mom to let us stay up late.'],
    ['investigate', 'to look closely to find out the truth', 'examine', 'ignore', 'The detective will ___ the case of the missing cookies.'],
    ['predict', 'to guess what will happen next', 'forecast', null, 'Can you ___ how the story will end?'],
    ['vivid', 'bright, clear and full of color', 'bright', 'dull', 'The rainbow had ___ colors.'],
    ['cooperate', 'to work together', 'team up', null, 'If we ___, we can clean the room faster.'],
    ['fierce', 'strong and wild; ready to attack', 'ferocious', 'gentle', 'The ___ tiger roared loudly.'],
    ['gentle', 'soft and kind; not rough', 'tender', 'rough', 'Be ___ when you pet the baby bunny.'],
    ['hilarious', 'very, very funny', 'funny', 'serious', 'The clown’s ___ tricks made everyone laugh.'],
    ['brilliant', 'very smart, or very bright', 'clever', 'dim', 'What a ___ idea!'],
    ['drowsy', 'sleepy', 'sleepy', 'alert', 'The warm, quiet room made me feel ___.'],
    ['massive', 'very big and heavy', 'huge', 'tiny', 'A ___ rock blocked the path.'],
    ['nervous', 'worried or a little scared', 'anxious', 'calm', 'I felt ___ before my piano recital.'],
    ['shimmer', 'to shine with a soft, flickering light', 'glimmer', null, 'The lake seemed to ___ in the moonlight.'],
    ['triumph', 'a great win or success', 'victory', 'defeat', 'Finishing the race was a ___ for our team.'],
    ['wander', 'to walk around with no special place to go', 'roam', null, 'We like to ___ through the park on Sundays.'],
    ['ordinary', 'normal; nothing special', 'usual', 'unusual', 'It was just an ___ Tuesday until the parade came by.'],
    ['mischief', 'playful, naughty behavior', 'trouble', null, 'The puppy got into ___ and chewed my sock.'],
    ['sturdy', 'strong and hard to break', 'solid', 'flimsy', 'We built a ___ treehouse that could hold four kids.'],
  ],
  3: [
    ['benevolent', 'kind and wanting to help others', 'kind', 'cruel', 'The ___ king gave food to every family in the village.'],
    ['candid', 'honest; saying what you really think', 'honest', 'dishonest', 'Be ___ and tell me what you really think of my drawing.'],
    ['diligent', 'working hard and carefully', 'hardworking', 'lazy', 'The ___ student checked every answer twice.'],
    ['ecstatic', 'extremely happy and excited', 'thrilled', 'miserable', 'She was ___ when she got a puppy for her birthday.'],
    ['frugal', 'careful not to waste money', 'thrifty', 'wasteful', 'My ___ uncle saves every penny.'],
    ['gregarious', 'loving to be around other people', 'outgoing', 'shy', 'The ___ boy made five new friends on the first day of camp.'],
    ['hesitant', 'pausing because you are unsure', 'unsure', 'confident', 'I was ___ to jump off the high diving board.'],
    ['meticulous', 'paying close attention to every tiny detail', 'precise', 'careless', 'The ___ artist painted each feather one by one.'],
    ['novice', 'someone who is new at something', 'beginner', 'expert', 'As a ___ skater, I fell down a lot.'],
    ['obstinate', 'stubborn; refusing to change your mind', 'stubborn', 'flexible', 'The ___ mule would not move an inch.'],
    ['prudent', 'wise and careful about the future', 'sensible', 'foolish', 'It is ___ to bring an umbrella when the clouds are dark.'],
    ['resilient', 'able to bounce back after something hard', 'tough', 'fragile', 'The ___ little plant grew back after the storm.'],
    ['serene', 'calm and peaceful', 'peaceful', 'chaotic', 'The lake was ___ at sunrise, with no wind at all.'],
    ['vigilant', 'always watching carefully for danger', 'watchful', 'inattentive', 'The ___ guard watched the gate all night.'],
    ['wary', 'careful because something might be dangerous', 'suspicious', 'trusting', 'The deer was ___ of the strange noise in the bushes.'],
    ['zealous', 'full of energy and excitement for something', 'passionate', 'indifferent', 'The ___ fans cheered for every single point.'],
    ['ambitious', 'having big goals and working to reach them', 'driven', 'unmotivated', 'The ___ girl planned to become an astronaut.'],
    ['feeble', 'weak', 'weak', 'strong', 'The ___ baby bird could not fly yet.'],
    ['vast', 'very wide and huge in size', 'immense', 'tiny', 'From the plane, we saw the ___ ocean stretch for miles.'],
    ['conceal', 'to hide something', 'hide', 'reveal', 'The squirrel tried to ___ its acorns under the leaves.'],
    ['compassion', 'caring about others who are hurting', 'sympathy', 'cruelty', 'She showed ___ by helping the boy who fell.'],
    ['endure', 'to keep going through something hard', 'withstand', 'give up', 'Camels can ___ long days without water.'],
    ['scrutinize', 'to look at something very closely', 'inspect', null, 'The scientist will ___ the leaf under a microscope.'],
    ['tedious', 'long and boring', 'boring', 'exciting', 'Sorting all those buttons was a ___ job.'],
    ['inquisitive', 'asking lots of questions; curious', 'curious', 'uninterested', 'The ___ child asked, “Why is the sky blue?”'],
  ],
  4: [
    ['adversary', 'an enemy or opponent', 'opponent', 'ally', 'The knight faced his ___ in the final battle.'],
    ['ambiguous', 'having more than one meaning; unclear', 'unclear', 'clear', 'The ___ sign could have pointed to either road.'],
    ['apathetic', 'not caring at all', 'uninterested', 'enthusiastic', 'The ___ cat did not even look at its new toy.'],
    ['articulate', 'able to speak clearly and well', 'well-spoken', 'tongue-tied', 'The ___ speaker explained her idea so everyone understood.'],
    ['audacious', 'very bold and daring', 'daring', 'timid', 'The ___ climber tried the tallest cliff in the park.'],
    ['conspicuous', 'very easy to notice', 'noticeable', 'hidden', 'His bright orange hat was ___ in the crowd.'],
    ['empathy', 'understanding how someone else feels', 'understanding', 'indifference', 'She showed ___ when her friend’s dog ran away.'],
    ['frivolous', 'silly and not important', 'trivial', 'serious', 'Don’t waste your allowance on ___ things.'],
    ['gullible', 'easily tricked into believing things', 'naive', 'skeptical', 'The ___ boy believed the moon was made of cheese.'],
    ['impartial', 'fair; not taking sides', 'fair', 'biased', 'A good referee is ___ to both teams.'],
    ['inevitable', 'sure to happen; can’t be avoided', 'unavoidable', 'avoidable', 'If you never water a plant, it is ___ that it will wilt.'],
    ['lethargic', 'slow and without energy', 'sluggish', 'energetic', 'After the huge lunch, I felt ___ and sleepy.'],
    ['meager', 'very small in amount; not enough', 'scanty', 'plentiful', 'The mouse found only a ___ crumb for dinner.'],
    ['nonchalant', 'calm and relaxed, as if you don’t care', 'casual', 'anxious', 'He gave a ___ shrug, even though he had just won.'],
    ['obsolete', 'out of date; no longer used', 'outdated', 'modern', 'Typewriters are almost ___ now that we have computers.'],
    ['ominous', 'seeming like something bad will happen', 'threatening', 'promising', 'The ___ black clouds told us a storm was coming.'],
    ['pragmatic', 'practical; focused on what really works', 'practical', 'idealistic', 'The ___ plan used only the tools we already had.'],
    ['reverence', 'deep respect', 'respect', 'disrespect', 'The crowd stood in ___ as the anthem played.'],
    ['skeptical', 'doubting; not easily believing', 'doubtful', 'gullible', 'I was ___ when he said his dog did his homework.'],
    ['tenacious', 'holding on tight; never giving up', 'persistent', null, 'The ___ terrier would not let go of the rope.'],
    ['ubiquitous', 'found everywhere', 'everywhere', 'rare', 'In the fall, leaves are ___ on the sidewalk.'],
    ['venerable', 'respected because of age or wisdom', 'honored', null, 'The ___ old oak tree had stood for three hundred years.'],
    ['ephemeral', 'lasting only a very short time', 'fleeting', 'permanent', 'A soap bubble’s beauty is ___.'],
    ['jubilant', 'full of joy, especially after winning', 'joyful', 'sorrowful', 'The ___ team danced after winning the championship.'],
    ['mundane', 'ordinary and dull', 'ordinary', 'extraordinary', 'Brushing your teeth is a ___ task, but an important one.'],
  ],
};

export const VOCAB = Object.fromEntries(
  Object.entries(raw).map(([level, rows]) => [
    level,
    rows.map(([w, def, syn, ant, s]) => ({ w, def, syn, ant, s, level: Number(level) })),
  ]),
);

// Whether `c` could be mistaken for a right answer in a question about
// `t` (same meaning, or opposites of each other), so it's never offered
// as a wrong choice.
// Words in the same list that are close enough in meaning that one could
// pass for the other.
const NEAR = [
  ['frightened', 'timid'],
  ['wary', 'vigilant'],
  ['wary', 'prudent'],
  ['vigilant', 'prudent'],
  ['meticulous', 'diligent'],
  ['lethargic', 'apathetic'],
  ['nonchalant', 'apathetic'],
  ['enormous', 'massive'],
];

export function tooClose(t, c) {
  if (t.w === c.w) return true;
  if (NEAR.some(([x, y]) => (x === t.w && y === c.w) || (y === t.w && x === c.w))) return true;
  const a = [t.w, t.syn, t.ant].filter(Boolean);
  const b = [c.w, c.syn, c.ant].filter(Boolean);
  return a.some((x) => b.includes(x));
}
