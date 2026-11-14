# Tasks

Verification runs the app in a browser (`python3 -m http.server` from the repo root, then open `http://localhost:8000`). Use the Playwright tools for screenshots and console checks. There is no test framework. "No console errors" is part of every browser check.

## 1. Theme registry (space parity)

- [x] 1.1 Before any change, take reference screenshots of the Lógica map (open level, locked level, exam node), a travel screen, a locked-planet toast and the progress screen. Save them in the scratchpad and verify the files exist.
- [x] 1.2 Add `S.themes` and `themeOf(sub)` in `js/core.js`. The `space` entry wraps today's planet face, black-hole exam node, default exam ("Agujero Negro: el Examen"), wording (planeta/planetas) and runner mode `jump`. Verify in the console that `StudIA.themes.space` exists and `themeOf({})` returns it.
- [x] 1.3 In `js/app.js`, make `map()` (unit node, exam node, exam lock label), the lock toasts, `travel()` title and the progress screen read their visuals and wording from `themeOf(sub)`. Verify by retaking the 1.1 screenshots and comparing them: identical for every space subject.
- [x] 1.4 In `render()`, set `document.body.dataset.theme` to the theme of the subject on screen, or `space` without a subject. Verify that `body[data-theme]` is `space` on home and in Matemáticas.

## 2. Ocean theme visuals

- [x] 2.1 Add the `ocean` theme entry: island node (SVG sand mound + palm, reusing the four face states and the emoji badge), shipwreck exam node, default exam "El Barco Hundido", wording isla/islas with feminine articles, runner mode `swim`, backdrop `sea`. Verify with a temporary test subject (`theme: 'ocean'`, set in the console) that the map shows locked, sleepy, playing and finished islands and a shipwreck.
- [x] 2.2 Add `#sea` (bubbles + light rays) to `index.html` and `S.fx.sea()`, with CSS that shows `#sea` and hides `#stars` when `body[data-theme="ocean"]`. Add island and shipwreck styles in `css/style.css`. Verify the backdrop changes on entering the ocean subject and goes back to stars on home.
- [x] 2.3 Check ocean wording. Verify that tapping a locked island shows "Primero completa la isla <name>…", the exam lock label says "Completa las islas", and the progress screen says "Siguiente isla". There is no "planeta" text anywhere in the ocean subject.

## 3. Submarine mini-game

- [x] 3.1 Add `mode: 'swim'` to `S.runner`: sinking with a capped upward impulse on tap or space, clamped between floor and surface, with the same timing, skip, crystals and no game over. Verify that a travel in the ocean subject can be played to the end by tapping and that skip works.
- [x] 3.2 Draw the underwater scene: blue gradient, sand floor, seaweed, submarine around the avatar image, jellyfish and sea-mine obstacles, pearl and treasure collectibles that award crystals. Verify by screenshot. Also verify that bumping an obstacle costs at most one crystal (none for young players), that collected items increase `crystals`, and that `travel()` passes `mode` from the theme.
- [x] 3.3 Verify that the space runner is unchanged: one travel in Matemáticas still jumps over meteors with double jump.

## 4. English audio

- [x] 4.1 Add the English voice choice (`en-GB`, then any `en-*`, chosen lazily, rate about 0.85) and `S.speakEn(text)` that ignores `data.sound`. Add `S.say(parts)`, which cancels once and queues Spanish and English utterances. Verify in the console that `StudIA.speakEn('sheep')` speaks with an English voice even with sound off.
- [x] 4.2 In the play screen, support `ch.listen` (a string or an array). Play it on show, after the Spanish prompt when young. Render a big 🔊 replay button that does not count attempts, and play `ch.explainListen || ch.listen` with the feedback. Verify with a temporary challenge that the audio plays on show and on each tap, and that attempts and stars are unaffected.
- [x] 4.3 For an array `listen` on a `choice` question, highlight option *i* while word *i+1* plays. Verify by screenshot during playback.
- [x] 4.4 Add the fallback for a device without an English voice: show the `listen` text with "Tu dispositivo no tiene voz en inglés" after `voiceschanged` or 1 s. Verify by stubbing `speechSynthesis.getVoices` to return only Spanish voices: the word appears and the question can be answered.
- [x] 4.5 Verify that no Inglés code calls `getUserMedia` or `SpeechRecognition` (`grep -rn "getUserMedia\|SpeechRecognition" js` returns nothing) and that no microphone prompt appears while playing.

## 5. Inglés subject content

- [x] 5.1 Create `js/subjects/ingles.js` with the subject (`id: 'ingles'`, "Inglés", 🔤, `theme: 'ocean'`, grades `i3`…`6`, tagline), four sections (Shallow Sea, Coral Sea, Deep Blue, Abyss), each with a 10-question exam, Infantil young, and shared generators: listen-and-tap, picture→word, spell (repeated letters interchangeable via `byLabel`), memory pairs. Add the script tag to `index.html`. Verify that Inglés appears on the home screen for an Infantil 3 player and a 6.º player.
- [x] 5.2 Infantil islands: Colours, Numbers, Animals, Fruit, Toys (listen-and-tap + memory) and First Sounds (whole words, highlight sequence). Verify by playing one mission of each island: pictures only, Spanish prompt read aloud, English word after it.
- [x] 5.3 1.º–2.º islands: Body, Clothes, Food, Classroom, Pets & Farm (listen-and-tap, picture→word, memory), plus Short Words (cat/cot/cut) and Rhymes. Verify by playing one mission of each.
- [x] 5.4 3.º–4.º islands: House, Weather & Seasons, Days & Months, Daily Routines, Jobs (adds spelling), plus Minimal Pairs (with long/short vowels) and Silent Letters. Verify by playing one mission of each, including spelling "apple" with either "p" first.
- [x] 5.5 5.º–6.º islands: Town, Hobbies & Sports, Feelings, Past Actions, plus -ed Endings, Word Stress, TH Sounds and Homophones. Verify by playing one mission of each.
- [x] 5.6 Feedback for every generator: right word + emoji + Spanish meaning, or a note about the sound. Verify that a wrong minimal-pair answer shows e.g. "sheep 🐑 = oveja" with the long/short vowel note and replays the word.
- [x] 5.7 Add a console self-check (a temporary snippet, not shipped). It generates 50 challenges from every Inglés mission and asserts: exactly one right option, no duplicate options, every word has an emoji, and spelling items rebuild the word. Verify that it passes with zero failures.
- [x] 5.8 Listen to every minimal pair, TH pair, homophone and stress word on Chrome desktop, and on Safari iOS or Android Chrome if available. Remove any item the voices make indistinguishable. Verify by recording the removed items, if any, in the commit message.

## 6. Unlocking, docs and release

- [x] 6.1 Verify the opening rules with a 3.º player: Infantil, 1.º–2.º and 3.º–4.º are open (3.º–4.º unfolded), and 5.º–6.º is locked until the 3.º–4.º exam is passed with 5 or more. Islands open in order, and the shipwreck opens when all islands are done.
- [x] 6.2 Add an "Tema océano (Inglés)" section to `docs/brand-guidelines.md` (submarine, islands, shipwreck, sea backdrop, theme registry for future themes). Verify that the section exists and names `S.themes`.
- [x] 6.3 Bump every `?v=18` to `?v=19` in `index.html`. Verify with `grep -c "v=19" index.html` against the number of asset tags and confirm that no `v=18` remains.

## 7. Integration check

- [x] 7.1 Full pass with a fresh player in Infantil 5 and one in 6.º. Play an Inglés mission, a travel, an exam question, then a Matemáticas mission and travel. Verify the theme switches back and forth, that saved progress of existing players is untouched, and that there are no console errors.
