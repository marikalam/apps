# GeoPop

A geography app for kids, the third in the MathPop family (with [MathPop](https://github.com/marikalam/mathpop) and WordPop): same look, same family account, and the same Anki-style spaced repetition as WordPop.

Will live at **marikalam.github.io/apps/geopop** once deployed.

## The idea: a journey that ripples out from home

GeoPop isn't split into school grades. It's split into **levels that spread out from where you live**, like ripples in a pond:

1. Each player picks their **home country** on the first visit (GeoPop guesses it from the device's language setting).
2. **Level 1, "Home Sweet Home"**, is home and the countries right next to it.
3. Each level after that is the **next-closest group of countries**, measured border to border, so neighbors always come first. Countries separated by water count too: for the US, the Bahamas are in Level 1, and Russia comes up early, just across the Bering Strait.
4. The last level is **"The Other Side of the World"**.

Every home gets its own journey, about 21 levels covering all 197 countries. For example:

| Home | Level 1 | Last level |
| --- | --- | --- |
| United States | US, Canada, Mexico, Bahamas | Madagascar, Sri Lanka, Singapore… |
| Japan | Japan, South Korea, North Korea, Russia | Argentina, Chile, Brazil… |
| France | France, Belgium, Germany, Spain, Switzerland, Andorra | New Zealand, Fiji, Tonga… |

Levels have names like Next Door, The Neighborhood, Road Trip, Across the Water, Jet Lag and Edge of the Map. Each one says how far it reaches from home ("up to 1,200 miles away").

## Three stops on every level

- **🗺️ Map**: a country lights up on a zoomed-in map and you name it, or a name is given and you **tap it on the map**. Tiny countries get a dot so you can tap them.
- **🚩 Flags**: pick the right flag out of four, or say whose flag it is.
- **🏛️ Capitals**: name the capital, or say whose capital it is.
- **🎲 Mix it up**: some of each.

The wrong choices are the closest countries to the right one, so it's never a giveaway: Ecuador's wrong answers are Peru and Colombia, not Japan. Neighboring flags often look alike, which is half the fun.

After every answer comes a fun fact, made from real data and from the player's home: "It's about 2,300 miles from the United States", "No beaches! Bolivia is landlocked", "China touches 14 countries!", "People from Peru are called Peruvian", "It's about 3 times as big as France".

## Unlocking, stamps and the passport

- The next level opens once **80% of this level's countries can be found on the map** (their last answer was right).
- Each level gets a **passport stamp**: ★ for its map, ★★ once its flags are known too, ★★★ with its capitals. The Passport screen shows them all.
- New levels and stamps get a celebration. Explorer ranks go from Rookie Explorer to Navigator, Voyager, Globetrotter and World Master.
- Any level already opened can be replayed from the journey list.

## Spaced repetition (like Anki)

Each country has three cards per player (map, flag, capital), scheduled with Anki's SM-2 method (`src/srs.js`, shared with WordPop):

- New or missed cards come back in about 10 minutes. Right again, and they graduate to tomorrow. After that the gaps grow: 1 day, 3, 8, 20, 50…
- Missing a learned card lowers its ease, halves its gap, and sends it back to relearning.
- A missed question is asked again three questions later in the same round ("Again!").
- Rounds put **due cards from every level reached so far first**, then up to 4 new countries from the current level. So Level 1's countries keep coming back while you're exploring Level 5.
- A **Review** card on the home screen shows how many cards are due, and Review rounds ask only those.

## The home screen

- Globie (a little planet in an explorer's hat), with stars, stamps and how many countries you've learned.
- **Your world**: a map centered on your home (★), colored by what you know: yellow learning, green learned, teal mastered. The current level is outlined.
- Review card, the current level's card (flags of its countries, the three stops with progress bars), and the journey trail.
- **Explore**: drag and zoom the whole map, tap any country to hear its name and see its flag, capital, languages, money, distance from home, neighbors and its review status.

## Running it

```
npm install
npm run dev        # http://localhost:5173/apps/geopop/
npm run check      # every home's journey, 5,000 questions, spaced repetition and unlocking
npm run data       # rebuild the country data, map and flags from the npm packages
npm run deploy     # build and publish to the apps site's gh-pages, under /geopop
```

## Data

- Country facts: [world-countries](https://github.com/mledoze/countries) (ODbL), built into `src/data/countries.js` by `scripts/build-data.mjs`. GeoPop teaches the 193 UN members plus Vatican City, Palestine, Taiwan and Kosovo.
- Map: [Natural Earth](https://www.naturalearthdata.com/) 1:50m shapes via `world-atlas` (public domain), drawn with `d3-geo`.
- Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT).

## Family account setup (one time)

GeoPop signs in to the same Supabase project as MathPop and WordPop:

1. Run `supabase/geopop_profiles.sql` in the Supabase SQL Editor. It adds a `geopop_profiles` table and doesn't touch the other apps' tables.
2. In Authentication → URL Configuration, add `https://marikalam.github.io/apps/geopop/**` to Redirect URLs.

Until then, GeoPop works fully with players and progress saved on the device.
