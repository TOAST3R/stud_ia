// Subjects for little ones (Infantil, ~5 años): "Números" and "Lógica".
// Everything is answered by tapping pictures, and every question is read aloud,
// so prompts are short sentences that sound right when spoken (emojis are skipped).
//   ch.sayAfter   what the voice says after answering (default: the explanation)
(function () {
  const S = window.StudIA, { R } = S;

  // [emoji, singular, plural, gender]
  const THINGS = [
    ['🍎', 'manzana', 'manzanas', 'f'], ['🐶', 'perrito', 'perritos', 'm'], ['⭐', 'estrella', 'estrellas', 'f'],
    ['🐟', 'pez', 'peces', 'm'], ['🎈', 'globo', 'globos', 'm'], ['🚗', 'coche', 'coches', 'm'],
    ['🐥', 'pollito', 'pollitos', 'm'], ['🌸', 'flor', 'flores', 'f'], ['🍓', 'fresa', 'fresas', 'f'],
    ['⚽', 'pelota', 'pelotas', 'f'], ['🦋', 'mariposa', 'mariposas', 'f'], ['🐞', 'mariquita', 'mariquitas', 'f'],
    ['🍪', 'galleta', 'galletas', 'f'], ['🐸', 'rana', 'ranas', 'f'], ['🦆', 'pato', 'patos', 'm'],
  ];
  const cuantos = (t) => (t[3] === 'f' ? 'Cuántas' : 'Cuántos');
  const say = (n, t) => (n === 1 ? `${t[3] === 'f' ? 'una' : 'un'} ${t[1]}` : `${n} ${t[2]}`);
  const row = (e, n, cls) => Array.from({ length: n }, () =>
    (cls === 'gone' ? `<span class="it gone"><i>${e}</i></span>` : `<span class="it">${e}</span>`)).join('');
  const items = (html, cls) => `<div class="items${cls ? ' ' + cls : ''}">${html}</div>`;
  const group = (e, n, size) => `<span class="grp"${size ? ` style="font-size:${size}"` : ''}>${row(e, n)}</span>`;
  const num = (v) => `<span class="num">${v}</span>`;
  const numsUpTo = (lo, hi) => Array.from({ length: hi - lo + 1 }, (x, i) => lo + i);
  function numOptions(ans, lo, hi, k) {
    const s = new Set([ans]);
    for (let g = 0; s.size < (k || 3) && g < 50; g++) {
      const v = ans + R.pick([-2, -1, 1, 2]);
      if (v >= lo && v <= hi) s.add(v);
    }
    while (s.size < (k || 3)) s.add(R.int(lo, hi));
    return R.shuffle([...s]).map((v) => ({ label: num(v), correct: v === ans }));
  }
  // shuffle, but never leave a list already in order
  function mix(list, rank) {
    let out;
    do { out = R.shuffle(list); } while (out.every((x, i) => i === 0 || rank(out[i - 1]) <= rank(x)));
    return out;
  }

  // ================= Números =================
  function gCount(lvl) {
    const t = R.pick(THINGS), n = R.int(...[[1, 5], [3, 8], [5, 10]][lvl]);
    return {
      type: 'choice', layout: 'big', prompt: `¿${cuantos(t)} ${t[2]} hay?`,
      scene: items(row(t[0], n)), options: numOptions(n, 1, 10),
      explain: `Hay <b>${say(n, t)}</b>.`,
    };
  }
  function gPick(lvl) {
    const t = R.pick(THINGS), n = R.int(2, [4, 6, 8][lvl]);
    return {
      type: 'pick', prompt: `Toca ${n} ${t[2]}.`, items: Array([6, 8, 10][lvl]).fill(t[0]), count: n,
      explain: `Había que tocar <b>${n}</b>.`,
    };
  }
  function gFindNum(lvl) {
    const hi = [5, 10, 20][lvl], n = R.int(lvl ? 0 : 1, hi), s = new Set([n]);
    if (n === 6) s.add(9);
    if (n === 9) s.add(6);
    if (n >= 12 && n % 10 > 0) s.add(+String(n).split('').reverse().join('')); // 12 ↔ 21
    while (s.size < (lvl ? 4 : 3)) s.add(R.int(0, hi));
    return {
      type: 'choice', layout: 'big', prompt: `Toca el número ${n}.`,
      options: R.shuffle([...s]).map((v) => ({ label: num(v), correct: v === n })),
      explain: `Este es el <b>${n}</b>.`,
    };
  }
  const dots = (n) => `<span class="pips" style="grid-template-columns:repeat(${n <= 4 ? 2 : n <= 6 ? 3 : 5},auto)">${'<i></i>'.repeat(n)}</span>`;
  function gMemNum(lvl) {
    const nums = R.sample(numsUpTo(1, [5, 8, 10][lvl]), [3, 4, 5][lvl]);
    return {
      type: 'memory', prompt: 'Busca las parejas: cada número con sus puntos.',
      pairs: nums.map((v) => [num(v), dots(v)]), explain: '¡Todas las parejas encontradas!',
    };
  }
  function gMore(lvl) {
    const more = R.int(0, 1) === 1, max = [6, 8, 10][lvl];
    let a, b;
    do { a = R.int(1, max); b = R.int(1, max); } while (Math.abs(a - b) < (lvl ? 1 : 2));
    const t1 = R.pick(THINGS), t2 = lvl ? R.pick(THINGS) : t1, win = more ? Math.max(a, b) : Math.min(a, b);
    // level 2 trick: the smaller group is drawn bigger. Count, don't look at the size!
    const size = (x) => (lvl === 2 ? (x === Math.min(a, b) ? '42px' : '22px') : null);
    return {
      type: 'choice', layout: 'big', prompt: `¿Dónde hay ${more ? 'más' : 'menos'}?`,
      options: [{ label: group(t1[0], a, size(a)), correct: a === win }, { label: group(t2[0], b, size(b)), correct: b === win }],
      explain: `En un lado hay ${a} y en el otro hay ${b}. Hay ${more ? 'más' : 'menos'} donde hay <b>${win}</b>.${lvl === 2 ? ' ¡Hay que contar, aunque sean más grandes!' : ''}`,
    };
  }
  function gBigger(lvl) {
    const big = R.int(0, 3) > 0, ns = R.sample(numsUpTo(0, [5, 10, 20][lvl]), lvl === 2 ? 3 : 2);
    const win = big ? Math.max(...ns) : Math.min(...ns);
    return {
      type: 'choice', layout: 'big', prompt: `¿Qué número es más ${big ? 'grande' : 'pequeño'}?`,
      options: ns.map((v) => ({ label: num(v), correct: v === win })),
      explain: `El <b>${win}</b> es el más ${big ? 'grande' : 'pequeño'}.`,
    };
  }
  const train = (cells) => `<div class="train"><span class="loco">🚂</span>${cells.map((v) =>
    `<span class="wagon${v === '?' ? ' q' : ''}">${v}</span>`).join('')}</div>`;
  function gTrain(lvl) {
    const hi = [6, 10, 20][lvl], len = lvl ? 5 : 4, s = R.int(lvl ? 0 : 1, hi - len + 1), gap = R.int(1, len - 1);
    const cells = numsUpTo(s, s + len - 1), ans = cells[gap];
    cells[gap] = '?';
    return {
      type: 'choice', layout: 'big', prompt: '¿Qué número falta en el tren?',
      scene: train(cells), options: numOptions(ans, 0, 20), explain: `Falta el <b>${ans}</b>.`,
    };
  }
  function gAdjacent(lvl) {
    const hi = [6, 10, 20][lvl], after = R.int(0, 1) === 1;
    const n = after ? R.int(1, hi - 1) : R.int(2, hi), ans = after ? n + 1 : n - 1;
    return {
      type: 'choice', layout: 'big', prompt: `¿Qué número va justo ${after ? 'después' : 'antes'} del ${n}?`,
      scene: train(after ? [n, '?'] : ['?', n]), options: numOptions(ans, 0, 20),
      explain: `${after ? 'Después' : 'Antes'} del ${n} va el <b>${ans}</b>.`,
    };
  }
  function gOrderNums(lvl) {
    const ns = R.sample(numsUpTo(1, [5, 10, 20][lvl]), [3, 4, 5][lvl]);
    return {
      type: 'order', prompt: 'Ordena los números, del más pequeño al más grande.',
      items: mix(ns, (v) => v).map((v) => ({ label: num(v), rank: v })), ends: ['pequeño', 'grande'],
      explain: `${ns.sort((a, b) => a - b).join(', ')}.`,
    };
  }
  function gSum(lvl) {
    const max = [5, 10, 10][lvl], a = R.int(1, max - 1), b = R.int(1, max - a), t = R.pick(THINGS);
    const pics = `<div class="sum">${group(t[0], a)}<b class="op">+</b>${group(t[0], b)}</div>`;
    return {
      type: 'choice', layout: 'big', prompt: `Hay ${say(a, t)} y ponemos ${b} más. ¿${cuantos(t)} hay ahora?`,
      scene: lvl < 2 ? pics : `<div class="sum">${num(a)}<b class="op">+</b>${num(b)}<b class="op">=</b>${num('?')}</div>${pics.replace('"sum"', '"sum mini"')}`,
      options: numOptions(a + b, 1, 10), explain: `${a} y ${b} son <b>${a + b}</b>.`,
    };
  }
  function gSub(lvl) {
    const max = [5, 8, 10][lvl], n = R.int(2, max), k = R.int(1, n - 1), t = R.pick(THINGS);
    const pics = items(row(t[0], n - k) + row(t[0], k, 'gone'));
    return {
      type: 'choice', layout: 'big', prompt: `Hay ${say(n, t)}. Quitamos ${k}. ¿${cuantos(t)} quedan?`,
      scene: lvl < 2 ? pics : `<div class="sum">${num(n)}<b class="op">−</b>${num(k)}<b class="op">=</b>${num('?')}</div>${pics}`,
      options: numOptions(n - k, 0, 10), explain: `${n} menos ${k} son <b>${n - k}</b>.`,
    };
  }

  const SHAPES = {
    circulo: ['círculo', 'círculos', '<circle cx="50" cy="50" r="44"/>'],
    cuadrado: ['cuadrado', 'cuadrados', '<rect x="8" y="8" width="84" height="84" rx="3"/>'],
    triangulo: ['triángulo', 'triángulos', '<polygon points="50,6 96,92 4,92"/>'],
    rectangulo: ['rectángulo', 'rectángulos', '<rect x="2" y="24" width="96" height="52" rx="3"/>'],
    rombo: ['rombo', 'rombos', '<polygon points="50,2 90,50 50,98 10,50"/>'],
  };
  const SHAPE_LEVELS = [['circulo', 'cuadrado', 'triangulo'], ['circulo', 'cuadrado', 'triangulo', 'rectangulo'], Object.keys(SHAPES)];
  const COLORS = ['#ff5a6e', '#2fd9a4', '#58c4ff', '#ffc21f', '#8b6cff', '#ff9d3d'];
  const shape = (k, color, size) => `<svg class="shape" viewBox="0 0 100 100" style="width:${size}em;height:${size}em" fill="${color || R.pick(COLORS)}" role="img" aria-label="${SHAPES[k][0]}">${SHAPES[k][2]}</svg>`;
  function gShapeFind(lvl) {
    const pool = SHAPE_LEVELS[lvl], t = R.pick(pool), color = lvl ? R.pick(COLORS) : null;
    const opts = [t, ...R.sample(pool.filter((k) => k !== t), Math.min(3, pool.length - 1))];
    return {
      type: 'choice', layout: 'big', prompt: `Toca el ${SHAPES[t][0]}.`,
      options: R.shuffle(opts).map((k) => ({ label: shape(k, color, lvl === 2 ? R.pick([1.1, 1.5, 1.9]) : 1.6), correct: k === t })),
      explain: `Este es el <b>${SHAPES[t][0]}</b>.`,
    };
  }
  function gShapeCount(lvl) {
    const pool = SHAPE_LEVELS[Math.max(lvl, 1)], t = R.pick(pool), n = R.int(1, [3, 5, 6][lvl]);
    const others = Array.from({ length: R.int(2, [3, 4, 5][lvl]) }, () => R.pick(pool.filter((k) => k !== t)));
    return {
      type: 'choice', layout: 'big', prompt: `¿Cuántos ${SHAPES[t][1]} hay?`,
      scene: items(R.shuffle([...Array(n).fill(t), ...others]).map((k) => shape(k, null, 1)).join(''), 'shapes'),
      options: numOptions(n, 1, 8), explain: `Hay <b>${n}</b> ${n === 1 ? SHAPES[t][0] : SHAPES[t][1]}.`,
    };
  }

  // ================= Lógica =================
  const SERIES_SETS = [['🔴', '🔵', '🟡', '🟢'], ['🟥', '🟦', '🟨', '🟩'], ['🍎', '🍌', '🍇', '🍓'], ['🐶', '🐱', '🐭', '🐰'], ['⭐', '🌙', '☀️', '☁️'], ['🚗', '🚲', '🚀', '⛵']];
  const PATTERNS = [['AB'], ['ABC', 'AAB', 'ABB'], ['AABB', 'ABCD', 'AABC', 'ABAC']];
  function gSeries(lvl) {
    const pat = R.pick(PATTERNS[lvl]), set = R.shuffle(R.pick(SERIES_SETS)), sym = (c) => set['ABCD'.indexOf(c)];
    const shown = Math.max(5, pat.length * 2 + R.int(0, pat.length - 1));
    const seq = Array.from({ length: shown }, (x, i) => sym(pat[i % pat.length])), ans = sym(pat[shown % pat.length]);
    const used = [...new Set(pat)].map(sym), opts = [...used, ...set.filter((s) => !used.includes(s))].slice(0, Math.max(3, used.length));
    return {
      type: 'choice', layout: 'big', prompt: '¿Qué va después?',
      scene: `<div class="series">${seq.map((s) => `<span class="it">${s}</span>`).join('')}<span class="it q">?</span></div>`,
      options: R.shuffle(opts).map((s) => ({ label: s, correct: s === ans })),
      explain: `Se repite: ${[...pat].map(sym).join(' ')}`, sayAfter: '',
    };
  }
  const FAMILIES = [
    { name: 'los animales', items: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐴'] },
    { name: 'las frutas', items: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐', '🍉', '🍒', '🍍', '🥝'] },
    { name: 'los vehículos', items: ['🚗', '🚕', '🚌', '🚒', '🚑', '🚜', '🚲', '🚀', '✈️', '🚂', '⛵', '🚁'] },
    { name: 'la ropa', items: ['👕', '👖', '👗', '🧦', '🧢', '👟', '🧤', '🧣', '👒'] },
    { name: 'las cosas del cole', items: ['✏️', '📏', '📚', '🎒', '✂️', '🖍️', '📐'] },
    { name: 'los instrumentos', items: ['🎸', '🥁', '🎺', '🎻', '🎹'] },
  ];
  function gOdd(lvl) {
    const [fam, other] = R.sample(FAMILIES, 2), odd = R.pick(other.items);
    return {
      type: 'choice', layout: 'big', prompt: '¿Cuál no es de la familia?',
      options: R.shuffle([...R.sample(fam.items, lvl ? 4 : 3), odd]).map((e) => ({ label: e, correct: e === odd })),
      explain: `${odd} no es de la familia de <b>${fam.name}</b>.`, sayAfter: `No es de la familia de ${fam.name}.`,
    };
  }
  const SHADOWS = ['🐘', '🦒', '🐇', '🐢', '🦀', '🐌', '🦋', '🐓', '🐟', '🦔', '🐊', '🦩', '🐪', '🦕', '🐈', '🐕', '🐎', '🐄', '🦆', '🐿️'];
  function gShadow(lvl) {
    const list = R.sample(SHADOWS, lvl ? 4 : 3), t = list[0];
    return {
      type: 'choice', layout: 'big', prompt: '¿Cuál es su sombra?', scene: `<span class="hero">${t}</span>`,
      options: R.shuffle(list).map((e) => ({ label: `<span class="shadow">${e}</span>`, correct: e === t })),
      explain: `${t} ➜ <span class="shadow">${t}</span>`, sayAfter: '',
    };
  }
  const SUDOKU_SETS = [['🐶', '🐱', '🐭', '🐰'], ['🍎', '🍌', '🍇', '🍓'], ['🔴', '🔵', '🟡', '🟢'], ['⭐', '🌙', '☀️', '☁️']];
  function latinSquare(n) {
    const rows = R.shuffle(numsUpTo(0, n - 1)), cols = R.shuffle(numsUpTo(0, n - 1)), sym = R.shuffle(numsUpTo(0, n - 1));
    return rows.map((r) => cols.map((c) => sym[(r + c) % n]));
  }
  function gSudoku(lvl) {
    const n = lvl < 2 ? 3 : 4, sol = latinSquare(n), grid = sol.map((r) => r.slice());
    R.sample(numsUpTo(0, n * n - 1), [3, 5, 7][lvl]).forEach((k) => (grid[Math.floor(k / n)][k % n] = null));
    return {
      type: 'latin', size: n, grid, solution: sol, symbols: R.shuffle(R.pick(SUDOKU_SETS)).slice(0, n),
      prompt: 'Toca las casillas vacías para cambiar el dibujo. ¡En cada fila y en cada columna no se puede repetir!',
      explain: '¡Sudoku resuelto!',
    };
  }
  const MEMO = ['🐶', '🐱', '🦁', '🐸', '🐵', '🦄', '🐙', '🐢', '🍎', '🍌', '🚗', '🚀', '⚽', '🎈', '🌈', '⭐'];
  function gPairs(lvl) {
    const k = [3, 4, 6][lvl];
    return { type: 'memory', prompt: 'Encuentra las parejas iguales.', pairs: R.sample(MEMO, k).map((e) => [e, e]), explain: '¡Todas las parejas encontradas!' };
  }
  const SIZE_THINGS = ['🐘', '🌳', '🏠', '🐻', '🎁', '🍉', '🚌', '🐳', '⛄', '🌻'];
  function gSizes(lvl) {
    const e = R.pick(SIZE_THINGS), up = lvl < 2 || R.int(0, 1) === 1;
    const sizes = [[24, 44, 72], [24, 38, 54, 72], [22, 32, 44, 58, 72]][lvl];
    const rank = (s) => (up ? s : -s);
    return {
      type: 'order', prompt: up ? 'Ordénalos del más pequeño al más grande.' : 'Ordénalos del más grande al más pequeño.',
      items: mix(sizes, rank).map((s) => ({ label: `<span style="font-size:${s}px">${e}</span>`, rank: rank(s) })),
      ends: up ? ['pequeño', 'grande'] : ['grande', 'pequeño'], explain: '¡Bien ordenados!',
    };
  }


  // ---------- more logic games ----------
  // growing series: one more each time (lvl 2: two more)
  function gGrowing(lvl) {
    const e = R.pick(['⭐', '🍎', '🐞', '🔵', '🌸']), step = lvl === 2 ? 2 : 1, start = R.int(1, lvl ? 2 : 1);
    const counts = [0, 1, 2].map((k) => start + k * step), ans = start + 3 * step;
    const grp = (n) => `<span class="grp" style="font-size:22px">${e.repeat(n)}</span>`;
    const opts = [...new Set([ans, ans - step, ans + step, ans + 1].filter((x) => x > 0))].slice(0, 3);
    return {
      type: 'choice', layout: 'big', prompt: 'Cada vez hay más. ¿Qué va después?',
      scene: `<div class="series">${counts.map(grp).join('<b class="op">→</b>')}<b class="op">→</b><span class="it q">?</span></div>`,
      options: R.shuffle(opts).map((n) => ({ label: grp(n), correct: n === ans })),
      explain: `Cada vez hay ${step} más: ${counts.join(', ')} y <b>${ans}</b>.`,
    };
  }
  // sorting: tap all the things that are…
  const SORTS = [
    ['que vuelan', ['🐦', '🦋', '✈️', '🐝', '🦅', '🚁', '🦆', '🎈'], ['🐶', '🚗', '🐟', '🐢', '🍎', '🐘', '🐌', '🚂']],
    ['que viven en el agua', ['🐟', '🐙', '🐳', '🦀', '🐬', '🦈', '🐠'], ['🐶', '🐱', '🐦', '🐘', '🦒', '🐴', '🐰']],
    ['que se comen', ['🍎', '🍌', '🥕', '🍞', '🧀', '🍓', '🍪', '🍉'], ['🧸', '⚽', '👟', '📚', '🔑', '🚗', '🧦', '✏️']],
    ['que tienen ruedas', ['🚗', '🚲', '🚌', '🛴', '🚜', '🚒', '🛹'], ['⛵', '✈️', '🐴', '🚀', '🏠', '🌳', '🐢']],
    ['que se ponen en el cuerpo', ['👕', '👖', '🧢', '🧦', '👟', '🧤', '🧣'], ['🍎', '🚗', '📚', '⚽', '🌸', '🔑', '🐶']],
    ['que dan luz', ['☀️', '💡', '🕯️', '🔦', '⭐', '🌙'], ['🧸', '🍎', '🐟', '📚', '🧦', '🌳']],
  ];
  function gSort(lvl) {
    const [name, yes, no] = R.pick(SORTS), k = [2, 3, 4][lvl], total = [6, 8, 10][lvl];
    const items = R.shuffle([...R.sample(yes, k).map((e) => [e, true]), ...R.sample(no, total - k).map((e) => [e, false])]);
    return {
      type: 'pick', prompt: `Toca todos los ${name}.`, items: items.map((x) => x[0]), targets: items.map((x, i) => (x[1] ? i : -1)).filter((i) => i >= 0),
      explain: `Los ${name} son: ${items.filter((x) => x[1]).map((x) => x[0]).join(' ')}`,
    };
  }
  // find the different one among very similar pictures
  const LOOKALIKES = [['🐟', '🐠'], ['🍎', '🍏'], ['🚗', '🚙'], ['🐶', '🐕'], ['😀', '😃'], ['🌕', '🌝'], ['🐱', '🐈'], ['🌷', '🌹'], ['🔵', '🟣'], ['⭐', '🌟'], ['🐭', '🐹'], ['🐻', '🐼']];
  function gDifferent(lvl) {
    const [same, diff] = R.shuffle(R.pick(LOOKALIKES)), n = [4, 6, 9][lvl], at = R.int(0, n - 1);
    return {
      type: 'choice', layout: 'big', repeats: true, prompt: '¿Cuál es diferente? ¡Mira bien!',
      options: Array.from({ length: n }, (x, i) => ({ label: i === at ? diff : same, correct: i === at })),
      explain: `Todos son ${same} menos uno: <b>${diff}</b>.`, sayAfter: '',
    };
  }
  // opposites and things that go together
  const OPPOSITES = [['☀️', '🌙', 'el día', 'la noche'], ['🔥', '🧊', 'caliente', 'frío'], ['😀', '😢', 'contento', 'triste'], ['🐘', '🐭', 'grande', 'pequeño'], ['⬆️', '⬇️', 'arriba', 'abajo'], ['🐇', '🐢', 'rápido', 'lento'], ['💡', '🌑', 'luz', 'oscuridad'], ['🌞', '❄️', 'verano', 'invierno']];
  function gOpposite(lvl) {
    const [a, b, wa, wb] = R.pick(OPPOSITES), flip = R.int(0, 1) === 1, [q, ans, wq, wans] = flip ? [b, a, wb, wa] : [a, b, wa, wb];
    const wrong = R.sample(OPPOSITES.flatMap((o) => [o[0], o[1]]).filter((x) => x !== q && x !== ans), lvl ? 3 : 2);
    return {
      type: 'choice', layout: 'big', prompt: '¿Qué es lo contrario?', scene: `<span class="hero">${q}</span>`,
      options: R.shuffle([ans, ...wrong]).map((e) => ({ label: e, correct: e === ans })),
      explain: `Lo contrario de <b>${wq}</b> es <b>${wans}</b>.`,
    };
  }
  const GOES_WITH = [['🔒', '🔑'], ['🧦', '👟'], ['🐝', '🍯'], ['🐶', '🦴'], ['🐰', '🥕'], ['☔', '🌧️'], ['🪥', '🦷'], ['✏️', '📒'], ['⚽', '🥅'], ['🍳', '🥚'], ['🐵', '🍌'], ['🧤', '✋'], ['🐟', '🎣'], ['🎂', '🕯️'], ['🚗', '⛽']];
  function gGoesWith(lvl) {
    const [a, b] = R.shuffle(R.pick(GOES_WITH)), pair = GOES_WITH.find((p) => p.includes(a));
    const wrong = R.sample(GOES_WITH.filter((p) => p !== pair).map((p) => R.pick(p)), lvl ? 3 : 2);
    return {
      type: 'choice', layout: 'big', prompt: '¿Qué va con esto?', scene: `<span class="hero">${a}</span>`,
      options: R.shuffle([b, ...wrong]).map((e) => ({ label: e, correct: e === b })),
      explain: `${a} va con <b>${b}</b>.`, sayAfter: '',
    };
  }
  function gMemGoes(lvl) {
    const k = [3, 4, 5][lvl];
    return { type: 'memory', prompt: 'Busca las parejas que van juntas.', pairs: R.sample(GOES_WITH, k), explain: '¡Todas las parejas encontradas!' };
  }
  // what happens first (time order)
  const STORIES = [
    ['🥚', '🐣', '🐥', '🐔'], ['🌱', '🌿', '🌳'], ['🐛', '🛌', '🦋'], ['🥣', '🥞', '😋'], ['🌑', '🌓', '🌕'], ['👶', '🧒', '🧑', '👴'],
    ['🌰', '🌱', '🌻'], ['🍞', '🥪', '😋'], ['☁️', '🌧️', '🌈'], ['🧊', '💧', '♨️'],
  ];
  function gStory(lvl) {
    const st = R.pick(STORIES.filter((x) => (lvl === 2 ? true : x.length <= (lvl ? 4 : 3)))), items = st.map((e, i) => ({ label: e, rank: i }));
    let mixed;
    do { mixed = R.shuffle(items); } while (mixed.every((x, i) => x.rank === i));
    return {
      type: 'order', prompt: '¿Qué pasa primero? Ordena la historia.', items: mixed, ends: ['primero', 'después'],
      explain: `${st.join(' → ')}`,
    };
  }
  // positions in a grid: arriba, abajo, izquierda, derecha
  const POS_THINGS = ['🐶', '🐱', '🐸', '🦊', '🐵', '🐰', '🐻', '🐼', '🦁', '🐷', '🐮', '🐔'];
  function gPosition(lvl) {
    const n = 3, things = R.sample(POS_THINGS, n * n), grid = [];
    for (let r = 0; r < n; r++) grid.push(things.slice(r * n, r * n + n));
    const dirs = lvl === 0 ? [['arriba', -1, 0], ['abajo', 1, 0]] : [['arriba', -1, 0], ['abajo', 1, 0], ['a la izquierda', 0, -1], ['a la derecha', 0, 1]];
    let r, c, d;
    do { r = R.int(0, n - 1); c = R.int(0, n - 1); d = R.pick(dirs); } while (r + d[1] < 0 || r + d[1] >= n || c + d[2] < 0 || c + d[2] >= n);
    const ref = grid[r][c], ans = grid[r + d[1]][c + d[2]];
    const wrong = R.sample(things.filter((x) => x !== ans && x !== ref), 2);
    return {
      type: 'choice', layout: 'big', prompt: `¿Quién está justo ${d[0]} del ${ref}?`,
      scene: `<div class="posgrid">${things.map((t) => `<span class="${t === ref ? 'ref' : ''}">${t}</span>`).join('')}</div>`,
      options: R.shuffle([ans, ...wrong]).map((e) => ({ label: e, correct: e === ans })),
      explain: `Justo ${d[0]} del ${ref} está <b>${ans}</b>.`, sayAfter: '',
    };
  }
  // riddles, read aloud
  const RIDDLES = [
    ['Tengo cuatro patas, mueve la cola y digo guau.', '🐶'], ['Soy amarillo, alargado y me pelan para comerme.', '🍌'], ['Salgo por la noche y brillo en el cielo, pero no soy una estrella.', '🌙'],
    ['Tengo ruedas y me llevan al cole muchos niños.', '🚌'], ['Vivo en el agua, tengo aletas y no tengo patas.', '🐟'], ['Tengo una trompa muy larga y orejas grandes.', '🐘'],
    ['Me pones en los pies antes de salir a la calle.', '👟'], ['Hago miel y zumbo: bzzz.', '🐝'], ['Doy calor y luz durante el día.', '☀️'],
    ['Soy roja por fuera, tengo semillas y a veces voy en la tarta.', '🍓'], ['Tengo teclas blancas y negras y hago música.', '🎹'], ['Me abres cuando llueve para no mojarte.', '☂️'],
    ['Soy de hielo y tengo nariz de zanahoria.', '⛄'], ['Llevo una casa a cuestas y voy muy despacio.', '🐌'], ['Vuelo muy alto y llevo a la gente de viaje.', '✈️'],
  ];
  function gRiddle(lvl) {
    const [text, ans] = R.pick(RIDDLES), wrong = R.sample(RIDDLES.map((x) => x[1]).filter((x) => x !== ans), lvl ? 3 : 2);
    return {
      type: 'choice', layout: 'big', prompt: `Adivina, adivinanza: ${text} ¿Quién soy?`,
      options: R.shuffle([ans, ...wrong]).map((e) => ({ label: e, correct: e === ans })),
      explain: `¡Es ${ans}!`, sayAfter: '',
    };
  }
  // the robot follows the arrows: where does it end?
  const ARROWS = { '⬆️': [-1, 0], '⬇️': [1, 0], '⬅️': [0, -1], '➡️': [0, 1] };
  function gRobot(lvl) {
    const n = lvl === 0 ? 3 : 4, steps = [2, 3, 5][lvl];
    let path, r0, c0, end;
    for (;;) {
      r0 = R.int(0, n - 1); c0 = R.int(0, n - 1); path = [];
      let r = r0, c = c0, ok = true;
      const seen = new Set([`${r},${c}`]);
      for (let k = 0; k < steps; k++) {
        const opts = Object.entries(ARROWS).filter(([, [dr, dc]]) => r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n && !seen.has(`${r + dr},${c + dc}`));
        if (!opts.length) { ok = false; break; }
        const [a, [dr, dc]] = R.pick(opts);
        path.push(a); r += dr; c += dc; seen.add(`${r},${c}`);
      }
      if (ok) { end = [r, c]; break; }
    }
    const prizes = R.sample(['🍎', '⭐', '🎈', '🍪', '💎', '🎁', '⚽', '🍦'], 4), cells = {};
    cells[end.join(',')] = prizes[0];
    const free = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!(r === r0 && c === c0) && `${r},${c}` !== end.join(',')) free.push(`${r},${c}`);
    R.sample(free, 3).forEach((k, i) => (cells[k] = prizes[i + 1]));
    let g = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g += `<span>${r === r0 && c === c0 ? '🤖' : cells[`${r},${c}`] || ''}</span>`;
    return {
      type: 'choice', layout: 'big', prompt: 'El robot sigue las flechas, una casilla cada vez. ¿Dónde llega?',
      scene: `<div class="robotgrid" style="grid-template-columns:repeat(${n},1fr)">${g}</div><div class="arrows">${path.join(' ')}</div>`,
      options: R.shuffle(prizes).map((e) => ({ label: e, correct: e === prizes[0] })),
      hint: 'Pon el dedo en el robot y muévelo una casilla por cada flecha.',
      explain: `Siguiendo ${path.join(' ')} el robot llega a <b>${prizes[0]}</b>.`, sayAfter: '',
    };
  }

  const reto = { title: 'El Gran Reto', label: 'Un poco de todo', emoji: '🏆', rounds: 8 };

  S.subjects.numeros = {
    id: 'numeros', title: 'Números', emoji: '🔢', tagline: 'Contar, sumar, restar y formas',
    ages: [3, 7], young: true, exam: reto,
    units: [
      { id: 'contar', n: 1, title: 'Contamos', planet: 'Planeta Cuentacosas', emoji: '🍎', color: '#ff5a6e', missions: [
        { id: 'cuantos', title: '¿Cuántos hay?', desc: 'Cuenta los dibujos', rounds: 6, gen: gCount },
        { id: 'toca', title: 'Toca los que te digo', desc: 'Toca justo los que hacen falta', rounds: 5, gen: gPick },
      ] },
      { id: 'numeros', n: 2, title: 'Los números', planet: 'Luna de los Números', emoji: '🔢', color: '#58c4ff', missions: [
        { id: 'busca', title: 'Busca el número', desc: '¿Dónde está?', rounds: 6, gen: gFindNum },
        { id: 'memoria', title: 'Memoria de números', desc: 'Cada número con sus puntos', rounds: 3, gen: gMemNum },
      ] },
      { id: 'mas', n: 3, title: 'Más y menos', planet: 'Planeta Balanza', emoji: '⚖️', color: '#ffd23f', missions: [
        { id: 'donde', title: '¿Dónde hay más?', desc: 'Más y menos', rounds: 6, gen: gMore },
        { id: 'mayor', title: '¿Qué número es mayor?', desc: 'Grande y pequeño', rounds: 5, gen: gBigger },
      ] },
      { id: 'orden', n: 4, title: 'Ordenamos', planet: 'Tren de los Números', emoji: '🚂', color: '#2fd9a4', missions: [
        { id: 'falta', title: '¿Qué número falta?', desc: 'Completa el tren', rounds: 5, gen: gTrain },
        { id: 'antes', title: 'Antes y después', desc: 'El vecino del número', rounds: 5, gen: gAdjacent },
        { id: 'ordena', title: 'Ordena los números', desc: 'Del pequeño al grande', rounds: 4, gen: gOrderNums },
      ] },
      { id: 'sumas', n: 5, title: 'Sumamos y restamos', planet: 'Planeta Globo', emoji: '🎈', color: '#ff9d3d', missions: [
        { id: 'juntamos', title: 'Juntamos', desc: 'Ponemos más', rounds: 6, gen: gSum },
        { id: 'quitamos', title: 'Quitamos', desc: '¿Cuántos quedan?', rounds: 6, gen: gSub },
      ] },
      { id: 'formas', n: 6, title: 'Las formas', planet: 'Planeta Formas', emoji: '🔺', color: '#c58bff', missions: [
        { id: 'toca', title: 'Toca la forma', desc: 'Círculo, cuadrado, triángulo…', rounds: 6, gen: gShapeFind },
        { id: 'cuenta', title: 'Cuenta las formas', desc: '¿Cuántas hay de cada una?', rounds: 5, gen: gShapeCount },
      ] },
    ],
  };

  S.subjects.logica = {
    id: 'logica', title: 'Lógica', emoji: '🧩', tagline: 'Series, clasificar, robots, adivinanzas y sudokus',
    ages: [3, 7], young: true, exam: Object.assign({}, reto, { rounds: 10 }),
    units: [
      { id: 'series', n: 1, title: 'Series', planet: 'Planeta Series', emoji: '🔁', color: '#ff6fb1', missions: [
        { id: 'sigue', title: 'Sigue la serie', desc: '¿Qué va después?', rounds: 6, gen: gSeries },
        { id: 'crece', title: 'Series que crecen', desc: 'Cada vez hay más', rounds: 5, gen: gGrowing },
      ] },
      { id: 'familias', n: 2, title: 'Familias', planet: 'Bosque de las Familias', emoji: '🌳', color: '#2fd9a4', missions: [
        { id: 'intruso', title: '¿Cuál no es de la familia?', desc: 'Busca al intruso', rounds: 6, gen: gOdd },
        { id: 'clasifica', title: 'Clasifica', desc: 'Toca todos los que…', rounds: 5, gen: gSort },
      ] },
      { id: 'sombras', n: 3, title: 'Sombras', planet: 'Cueva de las Sombras', emoji: '🔦', color: '#8b6cff', missions: [
        { id: 'sombra', title: 'Busca la sombra', desc: '¿De quién es esta sombra?', rounds: 5, gen: gShadow },
      ] },
      { id: 'ojo', n: 4, title: 'Ojo de lince', planet: 'Planeta Lupa', emoji: '🔍', color: '#4fd1c5', missions: [
        { id: 'diferente', title: '¿Cuál es diferente?', desc: 'Mira con mucha atención', rounds: 6, gen: gDifferent },
      ] },
      { id: 'tamanos', n: 5, title: 'Tamaños', planet: 'Valle de los Tamaños', emoji: '📏', color: '#ffd23f', missions: [
        { id: 'ordena', title: 'Ordena por tamaño', desc: 'Del pequeño al grande… ¡y al revés!', rounds: 4, gen: gSizes },
      ] },
      { id: 'contrarios', n: 6, title: 'Contrarios y parejas', planet: 'Planeta Espejo', emoji: '🪞', color: '#ff9d3d', missions: [
        { id: 'contrario', title: 'Lo contrario', desc: 'Día y noche, frío y caliente…', rounds: 5, gen: gOpposite },
        { id: 'vaconque', title: '¿Qué va con esto?', desc: 'La llave y el candado…', rounds: 5, gen: gGoesWith },
      ] },
      { id: 'historias', n: 7, title: 'Historias', planet: 'Planeta Cuento', emoji: '📖', color: '#ff7a59', missions: [
        { id: 'primero', title: '¿Qué pasa primero?', desc: 'Ordena la historia', rounds: 5, gen: gStory },
      ] },
      { id: 'posiciones', n: 8, title: 'Posiciones', planet: 'Planeta Brújula', emoji: '🧭', color: '#7d8cff', missions: [
        { id: 'donde', title: '¿Quién está al lado?', desc: 'Arriba, abajo, izquierda, derecha', rounds: 6, gen: gPosition },
      ] },
      { id: 'memoria', n: 9, title: 'Memoria', planet: 'Planeta Memoria', emoji: '🧠', color: '#58c4ff', missions: [
        { id: 'parejas', title: 'Parejas iguales', desc: 'Encuentra las cartas iguales', rounds: 3, gen: gPairs },
        { id: 'juntas', title: 'Parejas que van juntas', desc: 'La abeja y la miel…', rounds: 3, gen: gMemGoes },
      ] },
      { id: 'adivinanzas', n: 10, title: 'Adivinanzas', planet: 'Planeta Misterio', emoji: '❓', color: '#c58bff', missions: [
        { id: 'adivina', title: 'Adivina, adivinanza', desc: '¿Quién soy?', rounds: 6, gen: gRiddle },
      ] },
      { id: 'robot', n: 11, title: 'Robots', planet: 'Fábrica de Robots', emoji: '🤖', color: '#2ed9a3', missions: [
        { id: 'flechas', title: 'Sigue las flechas', desc: '¿Dónde llega el robot?', rounds: 5, gen: gRobot },
      ] },
      { id: 'sudoku', n: 12, title: 'Sudoku', planet: 'Isla Sudoku', emoji: '🏝️', color: '#ff5a6e', missions: [
        { id: 'mini', title: 'Mini sudoku', desc: 'Sin repetir en filas ni columnas', rounds: 3, gen: gSudoku },
      ] },
    ],
  };
})();
