# Proposal

## Why

Stud_IA covers maths, logic and geometry, but not English, which every child studies from Infantil to 6.º. Children most need help with English **pronunciation** and **vocabulary**, and a game can teach both by having them listen to words. Every subject now shares the same space look (galaxies, planets, black holes). English should feel like its own world: a submarine that travels from island to island.

## What Changes

- New subject **Inglés**, open to every school year (Infantil 3 to 6.º). It has four levels (Infantil, 1.º–2.º, 3.º–4.º, 5.º–6.º), the same structure as Lógica and Geometría. Each level is a sea of islands and ends with an exam.
- Each level mixes **vocabulary islands** (colours, animals, food, house, town…) with **pronunciation islands** (first sounds, rhymes, minimal pairs such as ship/sheep, silent letters, -ed endings, word stress, "th", homophones).
- Pronunciation is trained **by listening only**. The app speaks English words with an English voice and the child tells sounds and words apart. There is **no speech recognition and no microphone**.
- English audio is separate from the existing Spanish voice. Each English question has its own "listen again" button. Instructions stay in Spanish.
- A reusable **subject theme** system. Each subject declares a theme. `space` is the default and looks exactly like today. The new `ocean` theme draws islands instead of planets and a shipwreck instead of the black hole. It replaces the starfield with bubbles, says "islas" instead of "planetas", and turns the travel mini-game into a submarine that swims instead of a runner that jumps. Only Inglés uses `ocean` for now.
- The brand guide gains a short section on the ocean theme.

No existing subject changes its behaviour or its saved progress.

## Capabilities

### New Capabilities

- `subject-themes`: how a subject chooses its visual world (map nodes, exam node, backdrop, wording, travel mini-game). Covers the default `space` theme and the `ocean` theme.
- `english-audio`: speaking English words aloud for listening exercises: choice of voice, the replay button, what happens with sound turned off or with no English voice available.
- `english-subject`: the Inglés subject: its levels, islands, vocabulary and pronunciation exercises, exams and unlocking.

### Modified Capabilities

None. There are no existing specs. Today's subjects keep their behaviour under the default `space` theme.

## Impact

- New file `js/subjects/ingles.js` and a new `<script>` in `index.html`. The cache-busting version goes from `?v=18` to `?v=19`.
- `js/app.js`: the map nodes, exam node, travel screen, progress screen and lock messages read the subject's theme. The play screen shows the English replay button.
- `js/core.js`: an English voice next to the Spanish one, plus the theme registry and backdrop switch.
- `js/runner.js`: a swim mode for the ocean theme.
- `css/style.css`: island, shipwreck, bubbles and submarine styles.
- `docs/brand-guidelines.md`: ocean theme section.
- No new dependencies. Everything runs in the browser with the Web Speech synthesis API, which the app already uses.
