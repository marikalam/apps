# WordPop

A reading and vocabulary app for kids, built as a sibling to [MathPop](https://github.com/marikalam/mathpop): same game shape, same look, same family account, just words instead of numbers.

Little ones learn to read with phonics, following the method of *Teach Your Child to Read in 100 Easy Lessons*. Older kids learn "SAT words for little kids": big, rich words with a kid-sized definition and a sentence, growing into real SAT-prep words by 4th grade.

Will live at **marikalam.github.io/apps/wordpop** once deployed.

## How it maps to MathPop

| MathPop | WordPop |
| --- | --- |
| "How old is your child?" on the first visit | Same, Toddler (2–4) to 4th grade (9+) |
| Header: logo, player pill, Sign in | Same |
| Greeting card with Pip | Greeting card with Buzzy the bee, stars and words learned |
| Daily Math | Word of the Day (Sound of the Day for K, Big Word for Toddlers) and Random Mix |
| Big colored game tiles, picked per grade | Same: six per grade (`GRADE_PRACTICE` in `src/grades.js`) |
| Explore Numbers | Explore Letters (Toddler–1st) and Word Bank (2nd–4th) |
| Rounds of ten: big colored card, chime and confetti, or a buzz and the right answer | Same, and every answer explains the word ("Enormous means very, very big…") |
| Players & grades, each player at their own grade | Same screen |
| Family account (Supabase), offline-friendly sync | The **same account**: one email and password for MathPop, PitchPop and WordPop |
| Piper voice in the browser | Same voice; everything can be tapped to hear it |

## What each grade plays

| Grade | Games |
| --- | --- |
| Toddler | Big Words (picture vocabulary), Letter Sounds, First Sound, Say It Fast, Rhyme Time, Explore Letters |
| Kindergarten | Letter Sounds, Say It Fast, Sound It Out, Rhyme Time, Sight Words, Big Words |
| 1st | Sound It Out, Sight Words, Rhyme Time, What Does It Mean?, Fill the Blank, Opposites |
| 2nd | What Does It Mean?, Word Match, Fill the Blank, Opposites, Sight Words, Sound It Out (blends, digraphs, long vowels) |
| 3rd–4th | What Does It Mean?, Word Match, Fill the Blank, Same Meaning, Opposites, Spell It |

Random Mix draws from the grade's own games.

## The phonics method

From *Teach Your Child to Read in 100 Easy Lessons* (Engelmann, Haddox & Bruner), as described in `src/content/phonics.js`:

- Letters are learned by their **sound**, not their name ("m" says *mmm*).
- New sounds come in the book's order, starting with sounds you can hold (m, s, a, ē, r…). Quick sounds (t, d, c…) are said with no "uh".
- **Say It Fast**: the word is said slowly, sound by sound, and the child says it fast (blending).
- **Sound It Out**: the child touches each sound in a written word, then reads it. Long vowels and silent letters are marked the way the book marks them.
- **Rhyming** with word families (cat, hat, bat).

The book's text and lessons aren't reproduced here, only the method.

## Words get harder by grade

- Toddler and K: 24 picture words (enormous 🐘, famished 🍽️, fragile 🥚…).
- 1st: brave, curious, furious, peculiar, generous…
- 2nd: abundant, cautious, reluctant, investigate, triumph…
- 3rd: benevolent, diligent, frugal, meticulous, resilient…
- 4th: ambiguous, audacious, conspicuous, ephemeral, ubiquitous…

Each grade also reviews a few words from the year before. Words a child misses come back more often, and a word counts as *learned* (a star in the Word Bank) once it's been right twice and more often right than wrong. The lists are in `src/content/vocab.js`, and the sight words (Dolch lists) are in `src/content/phonics.js`.

Wrong answers are picked so they can't also be right: words that mean the same thing, or are each other's opposites, never appear together as choices. `npm run check` plays thousands of rounds for every grade and checks every question.

## Running it

```
npm install
npm run dev        # http://localhost:5173/apps/wordpop/
npm run check      # checks every game's questions
npm run deploy     # builds and publishes to the apps site's gh-pages, under /wordpop
```

## Family account setup (one time)

WordPop signs in to the same Supabase project as MathPop. Two things to set up there:

1. **Players table**: run `supabase/wordpop_profiles.sql` in the Supabase SQL Editor. It adds a `wordpop_profiles` table, locked so each family sees only its own players. It doesn't touch MathPop's or PitchPop's tables. Deleting an account removes its WordPop players too.
2. **Email links**: in Authentication → URL Configuration, add `https://marikalam.github.io/apps/wordpop/**` to Redirect URLs, so the sign-up and password-reset emails lead back to WordPop.

Until the table exists, WordPop still works: players and progress stay on the device.
