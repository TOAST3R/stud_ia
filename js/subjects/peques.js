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
    id: 'logica', title: 'Lógica', emoji: '🧩', tagline: 'Series, sombras, sudokus y parejas',
    ages: [3, 7], young: true, exam: reto,
    units: [
      { id: 'series', n: 1, title: 'Series', planet: 'Planeta Series', emoji: '🔁', color: '#ff6fb1', missions: [
        { id: 'sigue', title: 'Sigue la serie', desc: '¿Qué va después?', rounds: 6, gen: gSeries },
      ] },
      { id: 'familias', n: 2, title: 'Familias', planet: 'Bosque de las Familias', emoji: '🌳', color: '#2fd9a4', missions: [
        { id: 'intruso', title: '¿Cuál no es de la familia?', desc: 'Busca al intruso', rounds: 6, gen: gOdd },
      ] },
      { id: 'sombras', n: 3, title: 'Sombras', planet: 'Cueva de las Sombras', emoji: '🔦', color: '#8b6cff', missions: [
        { id: 'sombra', title: 'Busca la sombra', desc: '¿De quién es esta sombra?', rounds: 5, gen: gShadow },
      ] },
      { id: 'tamanos', n: 4, title: 'Tamaños', planet: 'Valle de los Tamaños', emoji: '📏', color: '#ffd23f', missions: [
        { id: 'ordena', title: 'Ordena por tamaño', desc: 'Del pequeño al grande… ¡y al revés!', rounds: 4, gen: gSizes },
      ] },
      { id: 'memoria', n: 5, title: 'Memoria', planet: 'Planeta Memoria', emoji: '🧠', color: '#58c4ff', missions: [
        { id: 'parejas', title: 'Parejas', desc: 'Encuentra las cartas iguales', rounds: 3, gen: gPairs },
      ] },
      { id: 'sudoku', n: 6, title: 'Sudoku', planet: 'Isla Sudoku', emoji: '🏝️', color: '#ff9d3d', missions: [
        { id: 'mini', title: 'Mini sudoku', desc: 'Sin repetir en filas ni columnas', rounds: 3, gen: gSudoku },
      ] },
    ],
  };
})();
