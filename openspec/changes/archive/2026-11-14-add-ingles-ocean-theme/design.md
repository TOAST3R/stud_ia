# Design

## Context

See proposal.md for the motivation. The app is plain browser JavaScript with no build step and no test framework. `index.html` loads the files in order and uses a `?v=N` cache-busting suffix. These are the parts this change touches:

- **Subjects** register on `S.subjects` (`js/subjects/*.js`). Lógica and Geometría build their four levels with a local `sections()` helper and `unit(section, i, id, title, planet, emoji, missions)` in `js/subjects/logica-geo.js:146-153`. Level opening by school year lives in `app.js` (`LEVEL_OF`, `secOpen`) and works for any section with a `level`.
- **Space look** is spread across `app.js`: `planetFace()` and the `.orb` node (`map()`, ~L271-326), `BOSS_FACE` and the default exam title "Agujero Negro", travel title "Rumbo a <planet>" (~L436), and planet wording in lock toasts (~L343, L353), exam lock label (~L310) and the progress screen (~L705, L718). The starfield is `#stars`, filled by `S.fx.starfield()`.
- **Travel mini-game** `S.runner(host, opts)` in `js/runner.js` is a canvas jump runner: gravity, double jump, space background, craters and emoji obstacles.
- **Voice**: `S.speak(html)` in `js/core.js` picks an `es-ES` voice, strips emojis and does nothing when `data.sound` is off. It calls `speechSynthesis.cancel()` before every utterance.
- **Widgets** (`js/widgets.js`): `choice` (with `layout: 'big'` for pictures), `pick`, `order` (tap items in rank order), `memory` (pairs). Challenge helpers `S.kit.one` and `S.kit.choose` are in `mates5-mas.js`.

## Goals / Non-Goals

**Goals:**
- Add a theme switch that leaves the `space` subjects pixel-identical.
- Build the English content from the existing widgets. Add a new widget only if no existing one fits.
- Keep English audio independent from the Spanish voice and from the sound toggle.

**Non-Goals:**
- Speech recognition, recording or any microphone use.
- Recorded audio files. All English audio comes from speech synthesis.
- Theming the home, players or progress screens beyond wording, and theming characters or ranks ("Cadete", "Piloto"… stay as they are).
- A theme picker for players. The subject defines its theme.

## Decisions

### 1. Theme registry instead of `if (sub.id === 'ingles')`
`S.themes = { space: {...}, ocean: {...} }` lives in a new section of `core.js`. `themeOf(sub)` returns `S.themes[sub.theme || 'space']`. A theme holds:
- `word: ['planeta', 'planetas']` / `['isla', 'islas']`. Also the gendered articles the messages need ("el planeta" / "la isla"), so messages are built per theme and not by string replacement.
- `node(state, u)`: the HTML of a unit's orb. Space wraps today's `planetFace`. Ocean draws an island (sand mound + palm in SVG) with the same face SVGs on it.
- `bossNode(isFinal)` and `examDefault`: the black hole, or a shipwreck with "El Barco Hundido".
- `backdrop: 'stars' | 'sea'`, `runner: 'jump' | 'swim'`.

*Why:* every themed spot in `app.js` reads one object. A third theme later only adds an entry. *Alternative:* CSS-only theming (`.theme-ocean .orb {…}`). It was rejected because the wording and the runner are not CSS, and the island needs different markup.

### 2. Backdrop switched by a body class
`render()` in `app.js` sets `document.body.dataset.theme` from the subject on screen, or `space` on screens without a subject. CSS shows `#stars` for space. For ocean it hides the stars and shows bubbles and light rays: a second fixed layer, `#sea`, filled once by `S.fx.sea()`. *Why:* one place to switch it, and screens that don't belong to a subject reset it for free.

### 3. Runner swim mode inside `S.runner`
A `mode: 'swim'` option changes the physics: the submarine sinks slowly, and a tap or space gives an upward impulse capped at a maximum speed. It also clamps the submarine between the sea floor and the surface, and changes the drawing: blue gradient, sand floor, seaweed, a submarine body around the avatar image, jellyfish 🪼 and sea mines as obstacles, and pearls and treasure as collectibles. Item placement, collisions, crystals, skip, end screen and timing are shared. *Why:* most of the runner (item generation, collision, scoring, end) is mode-independent. A separate file would copy about 100 lines. *Alternative:* reuse the jump physics underwater. It was rejected because "swimming" was the agreed feel.

### 4. English audio API: `S.speakEn(text, opts)` and `ch.listen`
- `core.js` picks the English voice the same way it picks the Spanish one: `en-GB`, then any `en-*`, with rate ≈ 0.85. `S.speakEn` **ignores `data.sound`**, as the spec requires.
- `S.speak` currently calls `cancel()`. For "Spanish then English", play gets a `S.say([{ es: prompt }, { en: word }])` sequence helper. It cancels once and then queues the utterances, so the English one is not cut off. The existing `S.speak` keeps its behaviour for every other caller.
- A challenge declares its audio with `listen: 'sheep'`, or an array for sequences such as "cat, then each option". The play screen in `app.js` handles `listen` for every widget: it plays the audio on show and renders a big 🔊 button near the prompt that calls `speakEn` again without touching attempts. In the explanation, `explainListen` (default `listen`) is played when feedback appears.
- If the device has no English voice (`speechSynthesis` missing, or no `en` voice after `voiceschanged`), the play screen shows the `listen` text in a pill with "Tu dispositivo no tiene voz en inglés".

*Why:* a challenge-level field keeps the generators declarative and works with `choice`, `pick`, `order` and `memory` without changing them. *Alternative:* a dedicated `listen` widget. It was rejected because it would duplicate `choice`.

### 5. Exercises built on existing widgets
| Exercise | Widget | Notes |
|---|---|---|
| Listen and tap the picture | `choice`, `layout: 'big'` | `listen: word`, options are emojis only |
| Picture → word | `choice` | scene = emoji, options = English words |
| Spell the word | `order` | letters as items; new `ch.byLabel` option makes **items with the same label interchangeable**, so either "p" of "apple" or "t" of "toilet" works |
| Memory | `memory` | new `ch.says` option speaks each card's English word when it turns; Infantil pairs picture with picture, 1.º–2.º word with picture |
| Same first sound (Infantil) | `choice` big | `listen: [target, ...optionWords]`; the play screen highlights option *i* while word *i+1* plays (via `onboundary`/`onend` of each utterance) |
| Rhymes, minimal pairs, homophones | `choice` | written options with emoji when one exists |
| -ed endings | `choice` | options `/t/` `/d/` `/ɪd/` with a sample word each |
| Word stress | `choice` | options like `ba·<b>NA</b>·na` |
| Silent letters | `choice` | options are the letters of the word, e.g. k-n-e-e, pick the silent one |
| "th" vs s/f/t | `choice` | minimal pairs: think/sink, three/free, thank/tank |

*Why:* no new widget means no new UI bugs. The new behaviour is `listen` on the play screen plus two small opt-in widget options (`byLabel` for `order`, `says` for `memory`); other subjects never set them.

Letter sounds alone (phonics like /b/) are **not** spoken. Speech engines read "b" as "bee". First-sound work therefore always plays whole words.

### 6. Content data in `js/subjects/ingles.js`
Word lists are data: `[en, emoji, es]`, for example `['sheep', '🐑', 'oveja']`. They are grouped by island, and pronunciation sets are lists of pairs or groups (`['ship','sheep']`, `['wanted','ɪd']`, `['banana', 1]` = stress index). Generators are small functions over that data. Wrong options come from the same island first, then from the same level. Each level has 5–8 islands with 1–3 missions each, so a level is about as long as a Lógica level. Levels, sections and exams reuse the same pattern as `logica-geo.js`. The `sections()`/`unit()` helpers are local there, so `ingles.js` defines its own small versions rather than exporting them (it is the only consumer).

- Infantil, *Shallow Sea* 🐠: Colours, Numbers, Animals, Fruit, Toys, First Sounds.
- 1.º–2.º, *Coral Sea* 🪸: Body, Clothes, Food, Classroom, Pets & Farm, Short Words (cat/cot/cut), Rhymes.
- 3.º–4.º, *Deep Blue* 🐋: House, Weather & Seasons, Days & Months, Daily Routines, Jobs, Minimal Pairs (plus long/short vowels), Silent Letters.
- 5.º–6.º, *Abyss* 🦑: Town, Hobbies & Sports, Feelings, Past Actions, -ed Endings, Word Stress, TH Sounds, Homophones.

Island names are in English ("Colour Island"). Instructions, hints and explanations are in Spanish. Subject: `id: 'ingles'`, title "Inglés", emoji 🔤, `theme: 'ocean'`, grades `i3`…`6`.

## Risks / Trade-offs

- [Speech engines differ in voice quality, and some pronounce minimal pairs badly] → Keep pairs where common voices differ clearly. Check the full pair list by ear on Chrome desktop, Safari iOS and Android Chrome before release, and drop any pair that sounds identical.
- [Voices load asynchronously (`voiceschanged`), so the first question may come before the English voice is known] → Choose the voice lazily on each `speakEn` call. Show the "no English voice" notice only after `voiceschanged` has fired or 1 s has passed.
- [iOS Safari blocks speech that is not started by a tap] → The first question of a mission is reached through a tap (start button), and the 🔊 button always works. Automatic playback on later questions follows the same path the Spanish voice already uses.
- [Sound toggle ignored for English could surprise a parent] → It applies only to the word being taught, never to effects. The behaviour is documented in the spec. The 🔊 button makes the audio's purpose obvious.
- [Theme refactor could change the space subjects by accident] → The space theme reuses today's functions as they are. Check by comparing screenshots of a space map, exam node, travel and progress screen before and after.
- [`order` with duplicate letters] → Sharing the rank of the first occurrence fails when the repeats are apart ("toilet" sorted as "ttoile"), so `order` gained `byLabel`: same-label items are interchangeable. Checked with "apple" and "toilet".

## Migration Plan

Additive. A new subject has no saved stars, and existing progress keys (`sub.unit.mission`) don't change. Bump `?v=18` to `?v=19` in `index.html` so browsers fetch the new files. Rollback: remove the `ingles.js` script tag. The theme code with only `space` in use behaves as before.

## Open Questions

- Exact word lists per island (about 8–15 words each). They can be adjusted during implementation and review without changing specs or tasks.
