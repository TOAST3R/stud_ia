// Inglés: vocabulary and pronunciation from Infantil to 6.º, all by listening.
// A submarine travels from island to island (ocean theme, core.js).
//   level 0 Infantil · 1 = 1.º–2.º · 2 = 3.º–4.º · 3 = 5.º–6.º, one exam each
// Instructions are in Spanish; the English words are played with ch.listen (app.js
// plays them and shows the 🔊 button). No microphone, no speech recognition.
(function () {
  const S = window.StudIA, { R } = S;

  // ---------- data: "en, emoji, es; en, emoji, es; …" ----------
  const words = (s) => s.split(';').map((t) => {
    const [en, e, es] = t.split(',').map((x) => x.trim());
    return { en, e, es };
  });
  const en = (w) => `<span class="word-en">${w}</span>`;
  const meaning = (w) => `${en(w.en)} ${w.e} = ${w.es}`;
  const LISTEN_HINT = 'Pulsa 🔊 Escuchar todas las veces que quieras.';
  // n wrong options from the same list: never the same word or the same picture
  // (words: compare words only, for lists that share one picture such as 📅)
  const others = (w, list, n, wordsOnly) => R.sample(list.filter((x) => x.en !== w.en && (wordsOnly || x.e !== w.e)), n);
  const opt = (label, correct, say) => ({ label, correct: !!correct, say });

  // ---------- vocabulary exercises ----------
  // listen and tap the picture (the word is heard, not written)
  const gListen = (list, n) => () => {
    const w = R.pick(list);
    return {
      type: 'choice', layout: 'big', prompt: 'Escucha y toca el dibujo.', listen: w.en,
      options: R.shuffle([w, ...others(w, list, n - 1)]).map((o) => opt(o.e, o === w, o.en)),
      hint: LISTEN_HINT, explain: meaning(w), sayAfter: `${w.es}.`,
    };
  };
  // listen and tap the written word (for words without a clear picture: days, months)
  const gListenWord = (list, n) => () => {
    const w = R.pick(list);
    return {
      type: 'choice', prompt: 'Escucha y toca la palabra que has oído.', listen: w.en,
      options: R.shuffle([w, ...others(w, list, n - 1, true)]).map((o) => opt(en(o.en), o === w)),
      hint: LISTEN_HINT, explain: `${en(w.en)} = ${w.es}`,
    };
  };
  // see the picture, tap the English word (its sound comes with the feedback)
  const gRead = (list, n) => () => {
    const w = R.pick(list);
    return {
      type: 'choice', prompt: '¿Cómo se dice en inglés?', scene: `<span class="hero">${w.e}</span>`,
      options: R.shuffle([w, ...others(w, list, n - 1)]).map((o) => opt(en(o.en), o === w)),
      explain: meaning(w), explainListen: w.en,
    };
  };
  // spell: tap the letters in order. Repeated letters are interchangeable
  // (byLabel), so either "p" of "apple" or "t" of "toilet" is right.
  const spellable = (list) => list.filter((w) => /^[a-z]{3,8}$/.test(w.en));
  const gSpell = (list) => () => {
    const w = R.pick(spellable(list)), letters = w.en.split('');
    const items = letters.map((c, i) => ({ label: c, rank: i }));
    let mixed;
    do { mixed = R.shuffle(items); } while (mixed.map((x) => x.label).join('') === w.en);
    return {
      type: 'order', byLabel: true, prompt: `<span class="hero">${w.e}</span> Escucha y ordena las letras.`, listen: w.en, items: mixed,
      hint: 'Escúchalo otra vez despacio: ¿con qué sonido empieza?', explain: meaning(w),
    };
  };
  // memory pairs; each card says its English word when it turns.
  // Infantil: picture with picture (no reading); later: word with picture.
  const gMemory = (list, k, pictures) => () => {
    const ws = R.sample(list, k);
    return {
      type: 'memory', says: ws.map((w) => w.en),
      prompt: pictures ? 'Busca las parejas iguales. ¡Escucha cómo se dice cada dibujo en inglés!' : 'Busca las parejas: cada palabra con su dibujo.',
      pairs: ws.map((w) => (pictures ? [w.e, w.e] : [`<span class="mtxt word-en">${w.en}</span>`, w.e])),
      explain: ws.map(meaning).join(' · '),
    };
  };
  // put a run of a sequence in order (days of the week, months)
  const gSequence = (list, len, prompt) => () => {
    const start = R.int(0, list.length - len), run = list.slice(start, start + len);
    return {
      type: 'order', prompt, items: R.shuffle(run.map((w, i) => ({ label: en(w.en), rank: i }))),
      explain: run.map((w) => `${en(w.en)} = ${w.es}`).join(' · '),
    };
  };

  // ---------- pronunciation exercises ----------
  // Infantil: which picture starts with the same sound? Whole words only:
  // speech engines read a lone "b" as "bee".
  const FIRST = [
    words('ball, ⚽, pelota; bus, 🚌, autobús; bear, 🐻, oso; banana, 🍌, plátano; bed, 🛏️, cama'),
    words('cat, 🐱, gato; car, 🚗, coche; cake, 🎂, tarta; cow, 🐮, vaca; kite, 🪁, cometa'),
    words('dog, 🐶, perro; duck, 🦆, pato; drum, 🥁, tambor; door, 🚪, puerta'),
    words('sun, ☀️, sol; sock, 🧦, calcetín; star, ⭐, estrella; snake, 🐍, serpiente'),
    words('moon, 🌙, luna; mouse, 🐭, ratón; milk, 🥛, leche; monkey, 🐵, mono'),
    words('pig, 🐷, cerdo; pizza, 🍕, pizza; panda, 🐼, panda; pen, 🖊️, bolígrafo'),
    words('tree, 🌳, árbol; tiger, 🐯, tigre; train, 🚂, tren; tomato, 🍅, tomate'),
    words('fish, 🐟, pez; frog, 🐸, rana; fox, 🦊, zorro; foot, 🦶, pie'),
    words('hat, 🎩, sombrero; horse, 🐴, caballo; house, 🏠, casa; hand, ✋, mano'),
  ];
  const gFirstSound = (n) => () => {
    const gi = R.int(0, FIRST.length - 1), [target, right] = R.sample(FIRST[gi], 2);
    const wrongs = R.sample(FIRST.filter((g, j) => j !== gi), n - 1).map((g) => R.pick(g));
    return {
      type: 'choice', layout: 'big', sayOptions: true,
      prompt: `¿Qué dibujo empieza con el mismo sonido que este? <span class="hero">${target.e}</span>`, listen: target.en,
      options: R.shuffle([right, ...wrongs]).map((o) => opt(o.e, o === right, o.en)),
      hint: 'Escucha el principio de cada palabra.',
      explain: `${en(target.en)} ${target.e} y ${en(right.en)} ${right.e} empiezan igual.`, sayAfter: `${target.es} y ${right.es} empiezan igual en inglés.`,
      explainListen: `${target.en}, ${right.en}`,
    };
  };
  // sets of words that sound alike; one is played, the player taps it.
  // set: { words: [{ en, e, es }], note }
  const set = (s, note) => ({ words: words(s), note });
  const label = (w) => `${en(w.en)}${w.e ? ` ${w.e}` : ''}`;
  const gSoundSet = (sets, prompt) => () => {
    const st = R.pick(sets), right = R.pick(st.words);
    return {
      type: 'choice', prompt, listen: right.en,
      options: R.shuffle(st.words).map((o) => opt(label(o), o === right)),
      hint: LISTEN_HINT,
      explain: `Has oído ${en(right.en)}${right.e ? ` ${right.e}` : ''}${right.es ? ` = ${right.es}` : ''}. ${st.note}`,
    };
  };
  // 1.º–2.º: short words that differ only in the middle vowel
  const SHORT = [
    set('cat, 🐱, gato; cot, , cuna; cut, ✂️, cortar', 'Fíjate en la vocal del medio: a, o, u.'),
    set('hat, 🎩, sombrero; hot, 🔥, caliente; hut, 🛖, cabaña', 'Fíjate en la vocal del medio: a, o, u.'),
    set('bag, 👜, bolso; big, 🐘, grande; bug, 🐛, bicho', 'Fíjate en la vocal del medio: a, i, u.'),
    set('pen, 🖊️, bolígrafo; pin, 📌, chincheta; pan, 🍳, sartén', 'Fíjate en la vocal del medio: e, i, a.'),
    set('bed, 🛏️, cama; bad, 👎, malo; bud, 🌱, brote', 'Fíjate en la vocal del medio: e, a, u.'),
    set('ten, 🔟, diez; tin, 🥫, lata', 'Fíjate en la vocal del medio: e, i.'),
    set('dog, 🐶, perro; dig, ⛏️, cavar', 'Fíjate en la vocal del medio: o, i.'),
    set('map, 🗺️, mapa; mop, 🧹, fregona', 'Fíjate en la vocal del medio: a, o.'),
    set('sit, 🪑, sentarse; sat, , se sentó; set, , conjunto', 'Fíjate en la vocal del medio: i, a, e.'),
  ];
  // 1.º–2.º: rhymes
  const RHYMES = [
    words('cat, 🐱, gato; hat, 🎩, sombrero; bat, 🦇, murciélago; rat, 🐀, rata'),
    words('dog, 🐶, perro; frog, 🐸, rana; log, 🪵, tronco'),
    words('bee, 🐝, abeja; tree, 🌳, árbol; three, 3️⃣, tres; key, 🔑, llave'),
    words('cake, 🎂, tarta; snake, 🐍, serpiente; lake, 🏞️, lago'),
    words('star, ⭐, estrella; car, 🚗, coche; jar, 🫙, tarro'),
    words('moon, 🌙, luna; spoon, 🥄, cuchara'),
    words('bear, 🐻, oso; chair, 🪑, silla; pear, 🍐, pera'),
    words('boat, ⛵, barco; goat, 🐐, cabra; coat, 🧥, abrigo'),
    words('mouse, 🐭, ratón; house, 🏠, casa'),
    words('sock, 🧦, calcetín; clock, 🕐, reloj; rock, 🪨, roca'),
    words('bed, 🛏️, cama; red, 🔴, rojo; bread, 🍞, pan'),
    words('king, 🤴, rey; ring, 💍, anillo'),
    words('fish, 🐟, pez; dish, 🍽️, plato'),
    words('train, 🚂, tren; rain, 🌧️, lluvia'),
  ];
  const gRhyme = (n) => () => {
    const gi = R.int(0, RHYMES.length - 1), [target, right] = R.sample(RHYMES[gi], 2);
    const wrongs = R.sample(RHYMES.filter((g, j) => j !== gi), n - 1).map((g) => R.pick(g));
    return {
      type: 'choice', sayOptions: true,
      prompt: `¿Qué palabra rima con ${en(target.en)} ${target.e}?`, listen: target.en,
      options: R.shuffle([right, ...wrongs]).map((o) => opt(`${o.e} ${en(o.en)}`, o === right, o.en)),
      hint: 'Dos palabras riman si terminan con el mismo sonido.',
      explain: `${en(target.en)} y ${en(right.en)} terminan igual: ¡riman!`, explainListen: `${target.en}, ${right.en}`,
    };
  };
  // 3.º–4.º: minimal pairs, and the "magic e" that makes a vowel long
  const PAIRS = [
    set('ship, 🚢, barco; sheep, 🐑, oveja', 'En sheep la «ee» es larga (iii); en ship la «i» es corta.'),
    set('sit, 🪑, sentarse; seat, 💺, asiento', 'En seat la «ea» es larga (iii); en sit la «i» es corta.'),
    set('hill, ⛰️, colina; heel, 👠, tacón', 'En heel la «ee» es larga (iii); en hill la «i» es corta.'),
    set('chip, 🍟, patata frita; cheap, 💲, barato', 'En cheap la «ea» es larga (iii); en chip la «i» es corta.'),
    set('hat, 🎩, sombrero; hut, 🛖, cabaña', 'La «a» de hat es muy abierta; la «u» de hut es una «a» corta y oscura.'),
    set('cap, 🧢, gorra; cup, ☕, taza', 'La «a» de cap es muy abierta; la «u» de cup es una «a» corta y oscura.'),
    set('bag, 👜, bolso; bug, 🐛, bicho', 'La «a» de bag es muy abierta; la «u» de bug es una «a» corta y oscura.'),
    set('cat, 🐱, gato; cut, ✂️, cortar', 'La «a» de cat es muy abierta; la «u» de cut es una «a» corta y oscura.'),
    set('pen, 🖊️, bolígrafo; pan, 🍳, sartén', 'La «e» de pen es como la nuestra; la «a» de pan es más abierta.'),
    set('bed, 🛏️, cama; bad, 👎, malo', 'La «e» de bed es como la nuestra; la «a» de bad es más abierta.'),
  ];
  const MAGIC_E = [
    set('kit, 🧰, equipo; kite, 🪁, cometa', 'La «e» final no suena, pero hace que la «i» diga «ai».'),
    set('pin, 📌, chincheta; pine, 🌲, pino', 'La «e» final no suena, pero hace que la «i» diga «ai».'),
    set('tap, 🚰, grifo; tape, 📼, cinta', 'La «e» final no suena, pero hace que la «a» diga «ei».'),
    set('can, 🥫, lata; cane, 🦯, bastón', 'La «e» final no suena, pero hace que la «a» diga «ei».'),
    set('not, 🚫, no; note, 📝, nota', 'La «e» final no suena, pero hace que la «o» diga «ou».'),
    set('hop, 🐇, saltar; hope, 🤞, esperanza', 'La «e» final no suena, pero hace que la «o» diga «ou».'),
    set('cub, 🐻, cachorro; cube, 🧊, cubo', 'La «e» final no suena, pero hace que la «u» diga «iu».'),
  ];
  // 3.º–4.º: silent letters. Options are the word's consonants, so vowel pairs
  // and the final "e" are never in doubt.
  const SILENT = [
    ['knee', '🦵', 'rodilla', 'k'], ['knife', '🔪', 'cuchillo', 'k'], ['write', '✍️', 'escribir', 'w'], ['wrist', '⌚', 'muñeca', 'w'],
    ['lamb', '🐑', 'cordero', 'b'], ['comb', '🪮', 'peine', 'b'], ['climb', '🧗', 'trepar', 'b'], ['castle', '🏰', 'castillo', 't'],
    ['listen', '👂', 'escuchar', 't'], ['hour', '🕐', 'hora', 'h'], ['ghost', '👻', 'fantasma', 'h'], ['island', '🏝️', 'isla', 's'],
    ['half', '🌗', 'mitad', 'l'], ['talk', '🗣️', 'hablar', 'l'], ['walk', '🚶', 'caminar', 'l'],
  ];
  const gSilent = () => {
    const [w, e, es, silent] = R.pick(SILENT);
    const cons = [...new Set(w.replace(/[aeiouy]/g, '').split(''))];
    const opts = [silent, ...R.sample(cons.filter((c) => c !== silent), 3)];
    return {
      type: 'choice', prompt: `<span class="hero">${e}</span> Escucha ${en(w)}. ¿Qué letra se escribe pero no suena?`, listen: w,
      options: R.shuffle(opts).map((c) => opt(en(c), c === silent)),
      hint: 'Escucha despacio y ve tocando las letras con el dedo.',
      explain: `En ${en(w)} ${e} (${es}) la «${silent}» no suena.`,
    };
  };
  // 5.º–6.º: the three sounds of -ed
  const ED = {
    t: ['walked', 'jumped', 'cooked', 'helped', 'washed', 'watched', 'kicked', 'danced', 'laughed', 'kissed', 'stopped', 'looked'],
    d: ['played', 'cleaned', 'opened', 'called', 'lived', 'rained', 'cried', 'listened', 'closed', 'loved', 'smiled', 'tried'],
    id: ['wanted', 'needed', 'painted', 'started', 'visited', 'waited', 'landed', 'decided', 'shouted', 'counted', 'planted', 'ended'],
  };
  const ED_NAME = { t: '/t/', d: '/d/', id: '/ɪd/' };
  const ED_WHY = {
    t: 'Después de sonidos sordos (p, k, s, sh, ch, f) la -ed suena /t/.',
    d: 'Después de vocales y sonidos sonoros (l, n, m, v, z…) la -ed suena /d/.',
    id: 'Después de «t» o «d» la -ed suena /ɪd/: añade una sílaba.',
  };
  const gEd = () => {
    const k = R.pick(['t', 'd', 'id']), w = R.pick(ED[k]);
    return {
      type: 'choice', prompt: `Escucha ${en(w)}. ¿Cómo suena su final -ed?`, listen: w,
      // fixed order /t/ /d/ /ɪd/, each with a different example word
      options: ['t', 'd', 'id'].map((x) => opt(`${ED_NAME[x]} <small>como ${en(R.pick(ED[x].filter((y) => y !== w)))}</small>`, x === k)),
      hint: 'Fíjate en el sonido justo antes de -ed.', explain: `${en(w)} termina en ${ED_NAME[k]}. ${ED_WHY[k]}`,
    };
  };
  // 5.º–6.º: word stress — which part is strongest?
  const STRESS = [
    ['banana', '🍌', ['ba', 'na', 'na'], 1], ['tomato', '🍅', ['to', 'ma', 'to'], 1], ['potato', '🥔', ['po', 'ta', 'to'], 1],
    ['elephant', '🐘', ['e', 'le', 'phant'], 0], ['hamburger', '🍔', ['ham', 'bur', 'ger'], 0], ['butterfly', '🦋', ['but', 'ter', 'fly'], 0],
    ['computer', '💻', ['com', 'pu', 'ter'], 1], ['umbrella', '☂️', ['um', 'brel', 'la'], 1], ['dinosaur', '🦕', ['di', 'no', 'saur'], 0],
    ['kangaroo', '🦘', ['kan', 'ga', 'roo'], 2], ['volcano', '🌋', ['vol', 'ca', 'no'], 1], ['holiday', '🏖️', ['ho', 'li', 'day'], 0],
    ['guitar', '🎸', ['gui', 'tar'], 1], ['balloon', '🎈', ['bal', 'loon'], 1], ['pencil', '✏️', ['pen', 'cil'], 0],
    ['rabbit', '🐰', ['rab', 'bit'], 0], ['giraffe', '🦒', ['gi', 'raffe'], 1], ['hotel', '🏨', ['ho', 'tel'], 1],
    ['football', '⚽', ['foot', 'ball'], 0], ['monkey', '🐵', ['mon', 'key'], 0],
  ];
  const stressed = (syl, k) => syl.map((s, i) => (i === k ? `<b>${s.toUpperCase()}</b>` : s)).join('·');
  const gStress = () => {
    const [w, e, syl, k] = R.pick(STRESS);
    return {
      type: 'choice', prompt: `<span class="hero">${e}</span> Escucha ${en(w)}. ¿Qué parte suena más fuerte?`, listen: w,
      options: syl.map((s, i) => opt(`<span class="word-en">${stressed(syl, i)}</span>`, i === k)),
      hint: 'Dila tú en voz alta dando palmadas: la parte fuerte es la palmada más fuerte.',
      explain: `Se dice <span class="word-en">${stressed(syl, k)}</span>: la parte fuerte es «${syl[k]}».`,
    };
  };
  // 5.º–6.º: "th" against s, f and t
  const TH = [
    set('think, 🤔, pensar; sink, 🚰, fregadero', '«th» se dice con la lengua entre los dientes; «s» no.'),
    set('three, 3️⃣, tres; free, 🆓, gratis', '«th» se dice con la lengua entre los dientes; «f» con el labio y los dientes.'),
    set('three, 3️⃣, tres; tree, 🌳, árbol', '«th» se dice con la lengua entre los dientes; «t» con la lengua detrás.'),
    set('thank, 🙏, agradecer; tank, 🛢️, tanque', '«th» se dice con la lengua entre los dientes; «t» con la lengua detrás.'),
    set('mouth, 👄, boca; mouse, 🐭, ratón', '«th» se dice con la lengua entre los dientes; «s» no.'),
    set('thumb, 👍, pulgar; sum, ➕, suma', '«th» se dice con la lengua entre los dientes; «s» no.'),
    set('thin, , delgado; tin, 🥫, lata', '«th» se dice con la lengua entre los dientes; «t» con la lengua detrás.'),
  ];
  // 5.º–6.º: homophones — they sound the same, the picture decides
  const HOMO = [
    ['🌊', 'sea', 'mar', 'see', 'ver'], ['👀', 'see', 'ver', 'sea', 'mar'], ['🌸', 'flower', 'flor', 'flour', 'harina'],
    ['🐝', 'bee', 'abeja', 'be', 'ser'], ['8️⃣', 'eight', 'ocho', 'ate', 'comió'], ['🍐', 'pear', 'pera', 'pair', 'par'],
    ['🐻', 'bear', 'oso', 'bare', 'desnudo'], ['🦌', 'deer', 'ciervo', 'dear', 'querido'], ['🥩', 'meat', 'carne', 'meet', 'conocer'],
    ['⛵', 'sail', 'vela', 'sale', 'rebajas'], ['🔵', 'blue', 'azul', 'blew', 'sopló'], ['1️⃣', 'one', 'uno', 'won', 'ganó'],
    ['4️⃣', 'four', 'cuatro', 'for', 'para'], ['👂', 'hear', 'oír', 'here', 'aquí'], ['✍️', 'write', 'escribir', 'right', 'correcto'],
    ['☀️', 'sun', 'sol', 'son', 'hijo'], ['🌙', 'night', 'noche', 'knight', 'caballero'], ['🐇', 'hare', 'liebre', 'hair', 'pelo'],
  ];
  const gHomophone = () => {
    const [e, right, es, wrong, wes] = R.pick(HOMO);
    return {
      type: 'choice', prompt: 'Estas dos palabras suenan igual. ¿Cuál es la del dibujo?', scene: `<span class="hero">${e}</span>`, listen: right,
      options: R.shuffle([opt(en(right), true), opt(en(wrong), false)]),
      explain: `${en(right)} ${e} = ${es} · ${en(wrong)} = ${wes}. ¡Suenan igual!`,
    };
  };
  // 5.º–6.º: past actions
  const PAST = [
    ['go', 'went', '🚶', 'ir'], ['eat', 'ate', '🍽️', 'comer'], ['drink', 'drank', '🥤', 'beber'], ['see', 'saw', '👀', 'ver'],
    ['swim', 'swam', '🏊', 'nadar'], ['run', 'ran', '🏃', 'correr'], ['sleep', 'slept', '😴', 'dormir'], ['write', 'wrote', '✍️', 'escribir'],
    ['sing', 'sang', '🎤', 'cantar'], ['buy', 'bought', '🛒', 'comprar'], ['fly', 'flew', '✈️', 'volar'], ['ride', 'rode', '🚲', 'montar'],
    ['play', 'played', '⚽', 'jugar'], ['dance', 'danced', '💃', 'bailar'], ['cook', 'cooked', '🍳', 'cocinar'], ['paint', 'painted', '🎨', 'pintar'],
    ['jump', 'jumped', '🤸', 'saltar'], ['climb', 'climbed', '🧗', 'trepar'],
  ];
  const PAST_WORDS = PAST.map(([base, past, e, es]) => ({ en: past, e, es: `${es} en pasado (${base} → ${past})` }));
  const gPastOf = () => {
    const [base, past, e, es] = R.pick(PAST), regular = past === base + 'ed' || past === base + 'd';
    const fake = regular ? base : base + (base.endsWith('e') ? 'd' : 'ed');
    const other = R.pick(PAST.filter((p) => p[0] !== base))[1];
    return {
      type: 'choice', prompt: `<span class="hero">${e}</span> ¿Cuál es el pasado de ${en(base)}?`, listen: base,
      options: R.shuffle([opt(en(past), true), opt(en(fake), false), opt(en(other), false)]),
      hint: regular ? 'Es un verbo regular: añade -ed.' : 'Es un verbo irregular: no lleva -ed.',
      explain: `${en(base)} → ${en(past)} (${es}).${regular ? ' Verbo regular.' : ' Verbo irregular.'}`, explainListen: `${base}, ${past}`,
    };
  };

  // ---------- word lists ----------
  // Infantil
  const COLOURS = words('red, 🔴, rojo; blue, 🔵, azul; green, 🟢, verde; yellow, 🟡, amarillo; orange, 🟠, naranja; purple, 🟣, morado; black, ⚫, negro; white, ⚪, blanco; brown, 🟤, marrón; pink, 💗, rosa');
  const NUMBERS = words('one, 1️⃣, uno; two, 2️⃣, dos; three, 3️⃣, tres; four, 4️⃣, cuatro; five, 5️⃣, cinco; six, 6️⃣, seis; seven, 7️⃣, siete; eight, 8️⃣, ocho; nine, 9️⃣, nueve; ten, 🔟, diez');
  const ANIMALS = words('dog, 🐶, perro; cat, 🐱, gato; cow, 🐮, vaca; pig, 🐷, cerdo; duck, 🦆, pato; horse, 🐴, caballo; sheep, 🐑, oveja; fish, 🐟, pez; bird, 🐦, pájaro; lion, 🦁, león; frog, 🐸, rana; rabbit, 🐰, conejo; monkey, 🐵, mono; elephant, 🐘, elefante');
  const FRUIT = words('apple, 🍎, manzana; banana, 🍌, plátano; orange, 🍊, naranja; grapes, 🍇, uvas; pear, 🍐, pera; strawberry, 🍓, fresa; lemon, 🍋, limón; cherry, 🍒, cereza; watermelon, 🍉, sandía; pineapple, 🍍, piña');
  const TOYS = words('ball, ⚽, pelota; teddy bear, 🧸, osito de peluche; car, 🚗, coche; kite, 🪁, cometa; train, 🚂, tren; balloon, 🎈, globo; robot, 🤖, robot; drum, 🥁, tambor; puzzle, 🧩, puzle; yo-yo, 🪀, yoyó; boat, ⛵, barco');
  // 1.º–2.º
  const BODY = words('eye, 👁️, ojo; ear, 👂, oreja; nose, 👃, nariz; mouth, 👄, boca; hand, ✋, mano; foot, 🦶, pie; leg, 🦵, pierna; arm, 💪, brazo; tooth, 🦷, diente; hair, 💇, pelo; tongue, 👅, lengua; finger, ☝️, dedo');
  const CLOTHES = words('T-shirt, 👕, camiseta; dress, 👗, vestido; trainers, 👟, zapatillas; hat, 👒, sombrero; socks, 🧦, calcetines; coat, 🧥, abrigo; trousers, 👖, pantalones; scarf, 🧣, bufanda; gloves, 🧤, guantes; cap, 🧢, gorra; boots, 👢, botas; shorts, 🩳, pantalón corto');
  const FOOD = words('bread, 🍞, pan; cheese, 🧀, queso; egg, 🥚, huevo; milk, 🥛, leche; water, 💧, agua; rice, 🍚, arroz; pizza, 🍕, pizza; chicken, 🍗, pollo; cake, 🎂, tarta; ice cream, 🍦, helado; soup, 🍲, sopa; carrot, 🥕, zanahoria; sandwich, 🥪, sándwich; biscuit, 🍪, galleta; juice, 🧃, zumo');
  const CLASSROOM = words('pencil, ✏️, lápiz; book, 📘, libro; ruler, 📏, regla; scissors, ✂️, tijeras; schoolbag, 🎒, mochila; crayon, 🖍️, cera; clock, 🕐, reloj; computer, 💻, ordenador; paper, 📄, papel; pen, 🖊️, bolígrafo; chair, 🪑, silla; paints, 🎨, pinturas');
  const PETS = words('dog, 🐶, perro; cat, 🐱, gato; rabbit, 🐰, conejo; hamster, 🐹, hámster; fish, 🐟, pez; parrot, 🦜, loro; turtle, 🐢, tortuga; horse, 🐴, caballo; cow, 🐮, vaca; pig, 🐷, cerdo; sheep, 🐑, oveja; goat, 🐐, cabra; hen, 🐔, gallina; duck, 🦆, pato');
  // 3.º–4.º
  const HOUSE = words('bed, 🛏️, cama; sofa, 🛋️, sofá; door, 🚪, puerta; window, 🪟, ventana; bath, 🛁, bañera; shower, 🚿, ducha; toilet, 🚽, váter; mirror, 🪞, espejo; key, 🔑, llave; television, 📺, televisión; chair, 🪑, silla; house, 🏠, casa; garden, 🏡, jardín; lamp, 💡, lámpara');
  const WEATHER = words('sunny, ☀️, soleado; rainy, 🌧️, lluvioso; cloudy, ☁️, nublado; snowy, 🌨️, nevado; windy, 🌬️, con viento; stormy, ⛈️, con tormenta; foggy, 🌫️, con niebla; hot, 🥵, calor; cold, 🥶, frío; rainbow, 🌈, arcoíris; spring, 🌸, primavera; summer, 🏖️, verano; autumn, 🍂, otoño; winter, ⛄, invierno');
  const DAYS = words('Monday, 📅, lunes; Tuesday, 📅, martes; Wednesday, 📅, miércoles; Thursday, 📅, jueves; Friday, 📅, viernes; Saturday, 📅, sábado; Sunday, 📅, domingo');
  const MONTHS = words('January, 📅, enero; February, 📅, febrero; March, 📅, marzo; April, 📅, abril; May, 📅, mayo; June, 📅, junio; July, 📅, julio; August, 📅, agosto; September, 📅, septiembre; October, 📅, octubre; November, 📅, noviembre; December, 📅, diciembre');
  const ROUTINES = words('wake up, ⏰, despertarse; get dressed, 👕, vestirse; brush my teeth, 🪥, lavarse los dientes; have a shower, 🚿, ducharse; have breakfast, 🥣, desayunar; go to school, 🏫, ir al colegio; have lunch, 🍽️, comer; do my homework, 📝, hacer los deberes; watch TV, 📺, ver la tele; read a book, 📖, leer un libro; go to bed, 🛌, irse a la cama; wash my hands, 🧼, lavarse las manos; walk the dog, 🐕, pasear al perro; ride my bike, 🚲, montar en bici');
  const JOBS = words('doctor, 🧑‍⚕️, médico; teacher, 🧑‍🏫, profesor; farmer, 🧑‍🌾, granjero; cook, 🧑‍🍳, cocinero; police officer, 👮, policía; firefighter, 🧑‍🚒, bombero; pilot, 🧑‍✈️, piloto; astronaut, 🧑‍🚀, astronauta; artist, 🧑‍🎨, artista; singer, 🧑‍🎤, cantante; mechanic, 🧑‍🔧, mecánico; scientist, 🧑‍🔬, científico; builder, 👷, albañil');
  // 5.º–6.º
  const TOWN = words('school, 🏫, colegio; hospital, 🏥, hospital; bank, 🏦, banco; park, 🏞️, parque; library, 📚, biblioteca; museum, 🏛️, museo; supermarket, 🛒, supermercado; church, ⛪, iglesia; post office, 🏤, correos; cinema, 🎬, cine; station, 🚉, estación; restaurant, 🍽️, restaurante; hotel, 🏨, hotel; bakery, 🥖, panadería; swimming pool, 🏊, piscina');
  const HOBBIES = words('football, ⚽, fútbol; basketball, 🏀, baloncesto; tennis, 🎾, tenis; swimming, 🏊, natación; cycling, 🚴, ciclismo; skating, ⛸️, patinaje; dancing, 💃, baile; reading, 📖, lectura; painting, 🎨, pintura; singing, 🎤, canto; chess, ♟️, ajedrez; fishing, 🎣, pesca; skiing, ⛷️, esquí; surfing, 🏄, surf; volleyball, 🏐, voleibol');
  const FEELINGS = words('happy, 😀, contento; sad, 😢, triste; angry, 😠, enfadado; scared, 😨, asustado; tired, 😴, cansado; bored, 🥱, aburrido; surprised, 😲, sorprendido; excited, 🤩, emocionado; worried, 😟, preocupado; hungry, 😋, con hambre; sick, 🤒, enfermo; shy, 😳, tímido');

  // ---------- islands ----------
  const COLORS = ['#ff6fb1', '#2fd9a4', '#8b6cff', '#ffd23f', '#ff9d3d', '#58c4ff', '#ff7a59', '#7d8cff', '#c58bff', '#4fd1c5'];
  const island = (section, i, id, title, name, emoji, missions) => ({ id, title, planet: name, emoji, section, young: section === 'n0', color: COLORS[i % COLORS.length], missions });
  const M = (id, title, desc, gen, rounds) => ({ id, title, desc, gen, rounds: rounds || 6 });
  const listenM = (list, n) => M('escucha', 'Escucha y toca', 'Oye la palabra y busca su dibujo', gListen(list, n), 6);
  const readM = (list) => M('lee', '¿Cómo se dice?', 'Mira el dibujo y elige la palabra', gRead(list, 4), 6);
  const spellM = (list) => M('deletrea', 'Ordena las letras', 'Escucha y escribe la palabra', gSpell(list), 4);
  const memoM = (list, k, pictures) => M('memoria', 'Memoria', pictures ? 'Parejas de dibujos que hablan' : 'Cada palabra con su dibujo', gMemory(list, k, pictures), 2);

  const UNITS = [
    island('n0', 0, 'e0colours', 'Colours', 'Colour Island', '🎨', [listenM(COLOURS, 3), memoM(COLOURS, 4, true)]),
    island('n0', 1, 'e0numbers', 'Numbers', 'Number Island', '🔢', [listenM(NUMBERS, 3), memoM(NUMBERS, 4, true)]),
    island('n0', 2, 'e0animals', 'Animals', 'Animal Island', '🐶', [listenM(ANIMALS, 3), memoM(ANIMALS, 4, true)]),
    island('n0', 3, 'e0fruit', 'Fruit', 'Fruit Island', '🍎', [listenM(FRUIT, 3), memoM(FRUIT, 4, true)]),
    island('n0', 4, 'e0toys', 'Toys', 'Toy Island', '🧸', [listenM(TOYS, 3), memoM(TOYS, 4, true)]),
    island('n0', 5, 'e0sounds', 'First sounds', 'Echo Island', '👂', [M('empieza', '¿Empieza igual?', 'Dibujos que empiezan con el mismo sonido', gFirstSound(3), 6)]),

    island('n1', 0, 'e1body', 'My body', 'Body Island', '✋', [listenM(BODY, 4), readM(BODY), memoM(BODY, 5)]),
    island('n1', 1, 'e1clothes', 'Clothes', 'Clothes Island', '👕', [listenM(CLOTHES, 4), readM(CLOTHES), memoM(CLOTHES, 5)]),
    island('n1', 2, 'e1food', 'Food', 'Food Island', '🍕', [listenM(FOOD, 4), readM(FOOD), memoM(FOOD, 5)]),
    island('n1', 3, 'e1class', 'Classroom', 'School Island', '✏️', [listenM(CLASSROOM, 4), readM(CLASSROOM), memoM(CLASSROOM, 5)]),
    island('n1', 4, 'e1pets', 'Pets & farm', 'Farm Island', '🐐', [listenM(PETS, 4), readM(PETS), memoM(PETS, 5)]),
    island('n1', 5, 'e1short', 'Short words', 'Vowel Island', '🔤', [M('cortas', 'cat, cot, cut', 'Escucha la vocal del medio', gSoundSet(SHORT, 'Escucha. ¿Qué palabra has oído?'), 6)]),
    island('n1', 6, 'e1rhymes', 'Rhymes', 'Rhyme Island', '🎵', [M('rimas', '¿Qué rima?', 'cat rima con hat', gRhyme(3), 6)]),

    island('n2', 0, 'e2house', 'My house', 'House Island', '🏠', [listenM(HOUSE, 4), readM(HOUSE), spellM(HOUSE)]),
    island('n2', 1, 'e2weather', 'Weather & seasons', 'Weather Island', '🌦️', [listenM(WEATHER, 4), readM(WEATHER), spellM(WEATHER)]),
    island('n2', 2, 'e2days', 'Days & months', 'Calendar Island', '📅', [
      M('escucha', 'Escucha y elige', 'Días y meses', gListenWord([...DAYS, ...MONTHS], 4), 6),
      M('semana', 'La semana', 'Ordena los días', gSequence(DAYS, 5, 'Ordena los días de la semana, del primero al último.'), 3),
      M('meses', 'Los meses', 'Ordena los meses', gSequence(MONTHS, 5, 'Ordena los meses del año, del primero al último.'), 3),
    ]),
    island('n2', 3, 'e2routines', 'Daily routines', 'Routine Island', '⏰', [listenM(ROUTINES, 4), readM(ROUTINES)]),
    island('n2', 4, 'e2jobs', 'Jobs', 'Job Island', '🧑‍🚒', [listenM(JOBS, 4), readM(JOBS), spellM(JOBS)]),
    island('n2', 5, 'e2pairs', 'Sounds alike', 'Twin Island', '👯', [
      M('parejas', 'ship o sheep', 'Palabras que casi suenan igual', gSoundSet(PAIRS, 'Escucha con atención. ¿Qué palabra has oído?'), 6),
      M('magica', 'La e mágica', 'kit o kite, not o note', gSoundSet(MAGIC_E, 'Escucha. ¿Qué palabra has oído?'), 6),
    ]),
    island('n2', 6, 'e2silent', 'Silent letters', 'Silent Island', '🤫', [M('mudas', 'Letras mudas', 'Se escriben pero no suenan', gSilent, 6)]),

    island('n3', 0, 'e3town', 'My town', 'Town Island', '🏙️', [listenM(TOWN, 4), readM(TOWN), spellM(TOWN)]),
    island('n3', 1, 'e3hobbies', 'Hobbies & sports', 'Sports Island', '⚽', [listenM(HOBBIES, 4), readM(HOBBIES), spellM(HOBBIES)]),
    island('n3', 2, 'e3feelings', 'Feelings', 'Feelings Island', '😀', [listenM(FEELINGS, 4), readM(FEELINGS), spellM(FEELINGS)]),
    island('n3', 3, 'e3past', 'Yesterday', 'Yesterday Island', '⏪', [
      M('escucha', 'Escucha el pasado', 'went, swam, played…', gListen(PAST_WORDS, 4), 6),
      M('pasado', '¿Cuál es el pasado?', 'Regulares e irregulares', gPastOf, 6),
    ]),
    island('n3', 4, 'e3ed', 'The -ed ending', 'Echo Reef', '🔚', [M('ed', '/t/, /d/ o /ɪd/', 'Cómo suena el final -ed', gEd, 6)]),
    island('n3', 5, 'e3stress', 'Word stress', 'Drum Island', '🥁', [M('fuerte', 'La parte fuerte', 'ba·NA·na', gStress, 6)]),
    island('n3', 6, 'e3th', 'TH sounds', 'Tongue Island', '👅', [M('th', 'think o sink', 'La lengua entre los dientes', gSoundSet(TH, 'Escucha. ¿Has oído «th»? Elige la palabra.'), 6)]),
    island('n3', 7, 'e3homo', 'Homophones', 'Mirror Island', '🪞', [M('iguales', 'Suenan igual', 'sea y see, pear y pair', gHomophone, 6)]),
  ];

  // ---------- seas (levels) ----------
  const LEVELS = [['Infantil', '🐠', 'Shallow Sea'], ['1.º y 2.º', '🪸', 'Coral Sea'], ['3.º y 4.º', '🐋', 'Deep Blue'], ['5.º y 6.º', '🦑', 'The Abyss']];
  const SUBTITLES = [
    'Colores, números, animales, fruta, juguetes y primeros sonidos',
    'Cuerpo, ropa, comida, clase y mascotas · vocales y rimas',
    'Casa, tiempo, días, rutinas y oficios · ship/sheep y letras mudas',
    'Ciudad, deportes, emociones y el pasado · -ed, acento, «th» y homófonos',
  ];
  S.subjects.ingles = {
    id: 'ingles', title: 'Inglés', emoji: '🔤', theme: 'ocean',
    tagline: 'De Infantil a 6.º: escucha, pronuncia y aprende palabras',
    grades: ['i3', 'i4', 'i5', '1', '2', '3', '4', '5', '6'],
    units: UNITS,
    sections: LEVELS.map(([name, emoji, sea], i) => ({
      id: `n${i}`, key: `ingles.n${i}`, level: i, young: i === 0, emoji, title: `Nivel ${name} · ${sea}`, subtitle: SUBTITLES[i],
      exam: i === 0 ? { title: 'El Gran Reto', label: 'Un poco de todo', emoji: '⚓', rounds: 10 } : { title: `Examen del nivel ${name}`, label: 'Examen', emoji: '⚓', rounds: 10 },
    })),
  };
})();
