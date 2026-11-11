// Lógica and Geometría by levels, for every school year:
//   level 0 Infantil · 1 = 1.º–2.º · 2 = 3.º–4.º · 3 = 5.º–6.º
// Each level is a section with its own exam. The app opens every level up to the
// player's school year; higher levels open by passing the previous level's exam.
// Infantil is "young" (voice, big pictures); the other levels are not.
// Loaded after primaria.js so it can reuse generators from other subjects.
(function () {
  const S = window.StudIA, { R, fmt } = S, K = S.kit, G = K.g;
  const { one, choose, cell, range } = K;
  const at = (gen, l) => (lvl, i) => gen(l, i);
  const upto = (gen, m) => (lvl, i) => gen(Math.min(lvl, m), i);
  const ri = (a, b) => R.int(a, b);
  // reuse a mission generator from another subject
  const from = (sub, unit, mission) => {
    const u = S.subjects[sub].units.find((x) => x.id === unit);
    return u.missions.find((m) => m.id === mission).gen;
  };
  const poly = (pts, w, h, fill, stroke) => K.svg(w || 130, h || 110, `<polygon points="${pts}" fill="${fill || '#ffe2b8'}" stroke="${stroke || '#ff9d3d'}" stroke-width="5" stroke-linejoin="round"/>`);

  // =====================================================================
  // LÓGICA
  // =====================================================================
  // number series, harder by difficulty d (0, 1, 2)
  const RULES = [
    [['de 2 en 2', (a, k) => a + 2 * k], ['de 5 en 5', (a, k) => a + 5 * k], ['de 10 en 10', (a, k) => a + 10 * k], ['restando 1', (a, k) => a + 20 - k], ['restando 2', (a, k) => a + 30 - 2 * k]],
    [['de 3 en 3', (a, k) => a + 3 * k], ['de 4 en 4', (a, k) => a + 4 * k], ['de 25 en 25', (a, k) => 25 * (a % 4) + 25 * k], ['multiplicando por 2', (a, k) => (1 + (a % 3)) * 2 ** k], ['sumando 2 y 3 por turnos', (a, k) => a + 5 * Math.floor(k / 2) + (k % 2) * 2]],
    [['números cuadrados (1×1, 2×2, 3×3…)', (a, k) => (k + 1 + (a % 3)) ** 2], ['multiplicando por 3', (a, k) => (1 + (a % 2)) * 3 ** k], ['cada número es la suma de los dos anteriores', (a, k) => { const f = [1 + (a % 2), 2 + (a % 3)]; while (f.length <= k) f.push(f[f.length - 1] + f[f.length - 2]); return f[k]; }], ['sumando 1, 2, 3, 4… (cada vez uno más)', (a, k) => a + (k * (k + 1)) / 2], ['números primos', (a, k) => [2, 3, 5, 7, 11, 13, 17, 19, 23, 29][k + (a % 3)]]],
  ];
  const numSeries = (d) => () => {
    const [name, f] = R.pick(RULES[d]), a = ri(1, 12), len = 6, seq = range(0, len - 1).map((k) => f(a, k));
    const hide = d === 0 ? [len - 1] : R.sample(range(1, len - 1), 2).sort((x, y) => x - y);
    let c = 0;
    return {
      type: 'cells', prompt: d === 0 ? '¿Qué número sigue? Descubre la regla de la serie.' : '¿Qué números faltan? Descubre la regla de la serie.',
      html: `<div class="chain">${seq.map((v, k) => (hide.includes(k) ? cell(c++) : `<span class="dbox">${fmt(v)}</span>`)).join('<span class="arrow"></span>')}</div>`,
      cells: hide.map((k) => ({ ans: seq[k] })),
      hint: 'Mira cuánto cambia de un número al siguiente.', explain: `La serie va ${name}: ${seq.map(fmt).join(', ')}.`,
    };
  };
  // the odd number out
  const FAMS = [
    ['pares', (n) => n % 2 === 0], ['impares', (n) => n % 2 === 1], ['múltiplos de 5', (n) => n % 5 === 0], ['múltiplos de 10', (n) => n % 10 === 0], ['múltiplos de 3', (n) => n % 3 === 0],
  ];
  function gOddNum(lvl) {
    const [name, ok] = R.pick(FAMS.slice(0, lvl ? 5 : 2)), hi = [30, 100, 200][lvl], good = new Set();
    while (good.size < 3) { const v = ri(2, hi); if (ok(v)) good.add(v); }
    let bad;
    do { bad = ri(2, hi); } while (ok(bad));
    return choose('¿Qué número no es de la familia?', bad, [...good], { explain: `Los demás son ${name}; el <b>${bad}</b> no.` });
  }
  // balance scales
  const FRUITS = ['🍎', '🍌', '🍍', '🍉', '🍐'];
  function gBalance(lvl) {
    const [a, b, c] = R.sample(FRUITS, 3), k = ri(2, 3), n = ri(2, lvl ? 5 : 3);
    const scale = (l, r) => `<div class="scale"><span>${l}</span><b>⚖️</b><span>${r}</span></div>`;
    if (lvl < 2) {
      return { type: 'cells', prompt: `En la balanza, ${b} pesa lo mismo que ${a.repeat(k)}. ¿Cuántas ${a} pesan lo mismo que ${b.repeat(n)}?${scale(b, a.repeat(k))}`,
        html: `<div class="eq big">${b.repeat(n)} = ${cell(0)} ${a}</div>`, cells: [{ ans: k * n }],
        hint: `Cada ${b} son ${k} ${a}.`, explain: `${n} × ${k} = <b>${k * n}</b> ${a}.` };
    }
    const m = ri(2, 3);
    return { type: 'cells', prompt: `${b} pesa lo mismo que ${a.repeat(k)}, y ${c} pesa lo mismo que ${b.repeat(m)}. ¿Cuántas ${a} pesan lo mismo que ${c}?${scale(b, a.repeat(k))}${scale(c, b.repeat(m))}`,
      html: `<div class="eq big">${c} = ${cell(0)} ${a}</div>`, cells: [{ ans: k * m }],
      hint: `Cambia cada ${b} por ${k} ${a}.`, explain: `${c} = ${m} ${b} = ${m} × ${k} = <b>${k * m}</b> ${a}.` };
  }
  // magic squares: rows, columns and diagonals add up to the same
  const LO_SHU = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  function gMagic(lvl) {
    let sq = LO_SHU.map((r) => r.slice());
    for (let t = ri(0, 3); t > 0; t--) sq = sq[0].map((x, c) => sq.map((r) => r[c]).reverse()); // rotate
    if (R.int(0, 1)) sq = sq.map((r) => r.slice().reverse());
    const k = lvl ? ri(1, lvl === 2 ? 20 : 9) : 0, total = 15 + 3 * k;
    sq = sq.map((r) => r.map((v) => v + k));
    const holes = R.sample(range(0, 8), [3, 4, 5][lvl]).sort((a, b) => a - b);
    let c = 0, html = '<div class="magic">';
    for (let i = 0; i < 9; i++) html += holes.includes(i) ? cell(c++) : `<span class="dbox">${sq[Math.floor(i / 3)][i % 3]}</span>`;
    return {
      type: 'cells', prompt: `<b>Cuadrado mágico</b>: cada fila, columna y diagonal suma <b>${total}</b>. Completa los huecos.`,
      html: html + '</div>', cells: holes.map((i) => ({ ans: sq[Math.floor(i / 3)][i % 3] })),
      hint: 'Busca una fila o columna a la que solo le falte un número.', explain: `Todas las filas, columnas y diagonales suman ${total}.`,
    };
  }
  // symbol equations
  const SYMS = ['🍎', '🌟', '🐱', '🎈', '🍩', '🚀', '🐸', '💎'];
  function gSymbols(lvl) {
    const [A, B, C] = R.sample(SYMS, 3), a = ri(2, lvl ? 12 : 9), b = ri(1, lvl ? 15 : 9), c = ri(1, 15);
    if (lvl < 2) {
      return { type: 'cells', prompt: 'Cada dibujo vale un número. ¿Cuánto vale cada uno?',
        html: `<div class="pair"><div class="op known">${A} + ${A} = ${2 * a}</div><div class="op known">${A} + ${B} = ${a + b}</div><div class="op ask">${A} = ${cell(0)} · ${B} = ${cell(1)}</div></div>`,
        cells: [{ ans: a }, { ans: b }], hint: `Empieza por la primera: dos ${A} valen ${2 * a}.`, explain: `${A} = ${2 * a} : 2 = <b>${a}</b>; ${B} = ${a + b} − ${a} = <b>${b}</b>.` };
    }
    return { type: 'cells', prompt: 'Cada dibujo vale un número. ¿Cuánto vale cada uno?',
      html: `<div class="pair"><div class="op known">${A} + ${A} + ${A} = ${3 * a}</div><div class="op known">${A} + ${B} = ${a + b}</div><div class="op known">${B} × ${C} = ${b * c}</div><div class="op ask">${A} = ${cell(0)} · ${B} = ${cell(1)} · ${C} = ${cell(2)}</div></div>`,
      cells: [{ ans: a }, { ans: b }, { ans: c }], hint: 'Resuelve de arriba abajo: cada línea te da un dibujo nuevo.', explain: `${A} = <b>${a}</b>, ${B} = <b>${b}</b>, ${C} = <b>${c}</b>.` };
  }
  // "I think of a number": undo the steps backwards
  const STEPS = [['le sumo', (x, k) => x + k, (y, k) => y - k], ['le resto', (x, k) => x - k, (y, k) => y + k], ['lo multiplico por', (x, k) => x * k, (y, k) => y / k]];
  function gThink(lvl) {
    for (;;) {
      const x = ri(2, 20), n = [1, 2, 3][lvl], ops = [];
      let y = x, ok = true;
      for (let s = 0; s < n; s++) {
        const [w, f] = R.pick(STEPS), k = w === 'lo multiplico por' ? ri(2, 4) : ri(2, 12);
        y = f(y, k);
        if (y < 0) { ok = false; break; }
        ops.push(`${w} ${k}`);
      }
      if (!ok || y > 200) continue;
      return one(`Pienso un número, ${ops.join(', después ')} y me sale <b>${y}</b>. ¿Qué número pensé?`, 'Pensé el', x,
        { hint: 'Empieza por el final y haz lo contrario de cada paso: si sumé, resta; si multipliqué, divide.', explain: `Deshaciendo los pasos desde ${y} llegamos a <b>${x}</b>.` });
    }
  }
  // counting combinations
  function gCombine(lvl) {
    if (lvl === 0) {
      const a = ri(2, 4), b = ri(2, 3);
      return one(`Tengo <b>${a} camisetas</b> y <b>${b} pantalones</b>. ¿De cuántas formas distintas me puedo vestir?`, 'Formas', a * b,
        { hint: 'Dibuja un árbol: de cada camiseta salen todos los pantalones.', explain: `${a} × ${b} = <b>${a * b}</b> formas.` });
    }
    if (lvl === 1) {
      const a = ri(2, 3), b = ri(2, 4), c = ri(2, 3);
      return one(`Un menú tiene <b>${a} primeros</b>, <b>${b} segundos</b> y <b>${c} postres</b>. ¿Cuántos menús distintos se pueden pedir?`, 'Menús', a * b * c,
        { hint: 'Multiplica las opciones de cada plato.', explain: `${a} × ${b} × ${c} = <b>${a * b * c}</b> menús.` });
    }
    const n = ri(4, 8);
    return R.int(0, 1)
      ? one(`En una fiesta hay <b>${n} amigos</b> y cada uno da la mano una vez a todos los demás. ¿Cuántos apretones de manos hay?`, 'Apretones', (n * (n - 1)) / 2,
        { hint: `Cada uno da ${n - 1} apretones, pero así cada apretón se cuenta dos veces.`, explain: `${n} × ${n - 1} : 2 = <b>${(n * (n - 1)) / 2}</b>.` })
      : one(`Con las cifras del 1 al ${Math.min(n, 5)}, ¿cuántos números de dos cifras <b>distintas</b> puedes formar?`, 'Números', Math.min(n, 5) * (Math.min(n, 5) - 1),
        { hint: 'Elige la primera cifra y luego la segunda, que no puede repetirse.', explain: `${Math.min(n, 5)} × ${Math.min(n, 5) - 1} = <b>${Math.min(n, 5) * (Math.min(n, 5) - 1)}</b>.` });
  }
  // number sudoku 4×4
  // shuffle rows inside each band, the bands, the columns likewise, and the digits
  const shuffle2x2 = () => { const bands = R.shuffle([0, 2]); return bands.flatMap((b) => R.shuffle([b, b + 1])); };
  function gSudokuNum(lvl) {
    const base = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
    const rows = shuffle2x2(), cols = shuffle2x2(), sym = R.shuffle([0, 1, 2, 3]);
    const sol = rows.map((r) => cols.map((c) => sym[base[r][c]]));
    const grid = sol.map((r) => r.slice());
    R.sample(range(0, 15), [7, 9, 11][lvl]).forEach((k) => (grid[Math.floor(k / 4)][k % 4] = null));
    return { type: 'latin', size: 4, grid, solution: sol, symbols: ['1', '2', '3', '4'],
      prompt: 'Sudoku: toca las casillas vacías para cambiar el número. No se puede repetir en ninguna fila ni columna.', explain: '¡Sudoku resuelto!' };
  }

  const L = S.subjects.logica, lg = (u, m) => from('logica', u, m);
  const LEVELS = [['Infantil', '🧸'], ['1.º y 2.º', '🎒'], ['3.º y 4.º', '📐'], ['5.º y 6.º', '🎓']];
  const sections = (id, subtitles) => LEVELS.map(([name, emoji], i) => ({
    id: `n${i}`, key: i === 0 ? id : `${id}.n${i}`, level: i, young: i === 0, emoji, title: `Nivel ${name}`, subtitle: subtitles[i],
    exam: i === 0 ? { title: 'El Gran Reto', label: 'Un poco de todo', emoji: '🏆', rounds: 10 } : { title: `Examen del nivel ${name}`, label: 'Examen', emoji: '🕳️', rounds: 10 },
  }));
  const COLORS = ['#ff6fb1', '#2fd9a4', '#8b6cff', '#ffd23f', '#ff9d3d', '#58c4ff', '#ff7a59', '#7d8cff', '#c58bff', '#4fd1c5'];
  const unit = (section, i, id, title, planet, emoji, missions) => ({ id, title, planet, emoji, section, young: section === 'n0', color: COLORS[i % COLORS.length], missions });
  const M = (id, title, desc, gen, rounds) => ({ id, title, desc, gen, rounds: rounds || 5 });

  L.units.forEach((u) => { u.section = 'n0'; u.young = true; });
  L.units.push(
    unit('n1', 0, 'l1series', 'Series de números', 'Planeta Saltarín', '🔢', [M('series', 'Sigue la serie', 'De 2 en 2, de 5 en 5…', numSeries(0), 6)]),
    unit('n1', 1, 'l1intruso', 'El intruso', 'Planeta Intruso', '🕵️', [M('intruso', '¿Qué número sobra?', 'Pares, impares, de 5 en 5…', at(gOddNum, 0), 6), M('clasifica', 'Clasifica', 'Toca todos los que…', at(lg('familias', 'clasifica'), 2))]),
    unit('n1', 2, 'l1balanza', 'Balanzas', 'Planeta Balanza', '⚖️', [M('balanza', '¿Cuánto pesa?', 'Cambia unas frutas por otras', at(gBalance, 0), 5)]),
    unit('n1', 3, 'l1sudoku', 'Sudoku 4 × 4', 'Isla Cuadrícula', '🏝️', [M('dibujos', 'Sudoku de dibujos', '4 × 4', at(lg('sudoku', 'mini'), 2), 3), M('numeros', 'Sudoku de números', '1, 2, 3 y 4', at(gSudokuNum, 0), 3)]),
    unit('n1', 4, 'l1robot', 'Robots', 'Fábrica de Robots', '🤖', [M('flechas', 'Programa largo', 'Más flechas', at(lg('robot', 'flechas'), 2), 5)]),
    unit('n1', 5, 'l1memoria', 'Memoria', 'Planeta Memoria', '🧠', [M('parejas', 'Parejas', '6 parejas', at(lg('memoria', 'parejas'), 2), 3)]),

    unit('n2', 0, 'l2series', 'Series difíciles', 'Planeta Patrón', '🔁', [M('series', 'Descubre la regla', '× 2, de 25 en 25, alternas…', numSeries(1), 6)]),
    unit('n2', 1, 'l2magia', 'Cuadrados mágicos', 'Planeta Mágico', '🔮', [M('magico', 'Cuadrado mágico', 'Todas las líneas suman igual', upto(gMagic, 1), 4)]),
    unit('n2', 2, 'l2simbolos', 'Ecuaciones de dibujos', 'Planeta Jeroglífico', '🧩', [M('simbolos', '¿Cuánto vale cada dibujo?', 'Dos incógnitas', at(gSymbols, 1), 5)]),
    unit('n2', 3, 'l2pienso', 'Pienso un número', 'Planeta Mentalista', '🎩', [M('pienso', 'Adivina el número', 'Deshaz los pasos', upto(gThink, 1), 5)]),
    unit('n2', 4, 'l2balanza', 'Balanzas dobles', 'Planeta Equilibrio', '⚖️', [M('balanza', 'Balanzas encadenadas', 'Dos cambios', at(gBalance, 2), 5)]),
    unit('n2', 5, 'l2sudoku', 'Sudoku de números', 'Isla Sudoku', '🏝️', [M('sudoku', 'Sudoku 4 × 4', 'Más huecos', at(gSudokuNum, 1), 3)]),
    unit('n2', 6, 'l2intruso', 'Familias de números', 'Planeta Divisor', '🧲', [M('intruso', '¿Qué número sobra?', 'Múltiplos de 3, 5 y 10', at(gOddNum, 2), 6)]),

    unit('n3', 0, 'l3series', 'Series expertas', 'Planeta Fibonacci', '🐚', [M('series', 'Series expertas', 'Cuadrados, primos, Fibonacci…', numSeries(2), 6)]),
    unit('n3', 1, 'l3simbolos', 'Ecuaciones de 3 dibujos', 'Planeta Código', '🔐', [M('simbolos', 'Tres incógnitas', 'Resuelve paso a paso', at(gSymbols, 2), 5)]),
    unit('n3', 2, 'l3pienso', 'Pienso un número', 'Planeta Mentalista', '🎩', [M('pienso', 'Tres pasos', 'Deshaz los pasos desde el final', at(gThink, 2), 5)]),
    unit('n3', 3, 'l3combina', 'Combinaciones', 'Planeta Árbol', '🌳', [M('combina', '¿De cuántas formas?', 'Diagramas de árbol', gCombine, 6)]),
    unit('n3', 4, 'l3magia', 'Cuadrados mágicos', 'Planeta Hechizo', '🔮', [M('magico', 'Cuadrado mágico experto', 'Con números grandes', at(gMagic, 2), 4)]),
    unit('n3', 5, 'l3sudoku', 'Sudoku experto', 'Isla Experta', '🏝️', [M('sudoku', 'Sudoku 4 × 4', 'Casi vacío', at(gSudokuNum, 2), 3)]),
  );
  L.sections = sections('logica', ['Series, familias, sombras, robots y adivinanzas', 'Series de números, balanzas, sudokus y robots', 'Cuadrados mágicos, ecuaciones de dibujos y adivina el número', 'Series expertas, combinaciones y ecuaciones']);
  L.young = true; // Infantil level; other units say young: false
  L.grades = ['i3', 'i4', 'i5', '1', '2', '3', '4', '5', '6'];
  L.tagline = 'De Infantil a 6.º: series, robots, sudokus y retos';
  delete L.exam;

  // =====================================================================
  // GEOMETRÍA
  // =====================================================================
  const OBJ_SHAPES = [['🍕', 'triángulo'], ['⚽', 'círculo'], ['🍪', 'círculo'], ['🕒', 'círculo'], ['🖼️', 'rectángulo'], ['📱', 'rectángulo'], ['🚪', 'rectángulo'], ['🎁', 'cuadrado'], ['🧇', 'cuadrado'], ['🔺', 'triángulo'], ['⛺', 'triángulo'], ['🪟', 'cuadrado']];
  function gObjShape(lvl) {
    const [e, shape] = R.pick(OBJ_SHAPES), opts = ['círculo', 'cuadrado', 'triángulo', 'rectángulo'].slice(0, lvl ? 4 : 3);
    if (!opts.includes(shape)) return gObjShape(lvl);
    return choose('¿Qué forma tiene?', shape, opts, { layout: 'big', scene: `<span class="hero">${e}</span>`, explain: `${e} tiene forma de <b>${shape}</b>.` });
  }
  const SOLID_OBJ = [['🎲', 'cubo'], ['🧊', 'cubo'], ['⚽', 'esfera'], ['🌍', 'esfera'], ['🥫', 'cilindro'], ['🪵', 'cilindro'], ['🍦', 'cono'], ['🎉', 'cono'], ['📦', 'prisma'], ['🧱', 'prisma']];
  function gObjSolid(lvl) {
    const [e, solid] = R.pick(SOLID_OBJ), opts = ['cubo', 'esfera', 'cilindro', 'cono', 'prisma'];
    return choose('¿Qué cuerpo geométrico parece?', solid, R.sample(opts.filter((x) => x !== solid), lvl ? 3 : 2), { layout: 'big', scene: `<span class="hero">${e}</span>`, explain: `${e} parece un <b>${solid}</b>.` });
  }
  const LINES = {
    recta: '<path d="M10 70 L190 30" />', curva: '<path d="M10 70 C60 -10 120 120 190 30" />',
    poligonal: '<path d="M10 70 L60 20 L100 80 L150 25 L190 60" />', mixta: '<path d="M10 70 L70 30 C110 0 140 110 190 40" />',
  };
  function gLines(lvl) {
    const pool = lvl ? Object.keys(LINES) : ['recta', 'curva'], k = R.pick(pool);
    return choose('¿Qué tipo de línea es?', `línea ${k}`, pool.filter((x) => x !== k).map((x) => `línea ${x}`), {
      scene: K.svg(200, 90, `<g fill="none" stroke="#5d3fd0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${LINES[k]}</g>`),
      explain: 'Recta: no se tuerce · curva: se dobla suave · poligonal: hecha de trozos rectos · mixta: con trozos rectos y curvos.',
    });
  }
  function gCountSquares(lvl) {
    const w = ri(2, [4, 6, 7][lvl]), h = ri(2, [3, 4, 5][lvl]), cut = lvl && R.int(0, 1) ? ri(1, Math.min(w, h) - 1) : 0;
    const s = 26;
    let b = '', n = 0;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      if (r < cut && c >= w - cut) continue; // an L shape
      n++;
      b += `<rect x="${4 + c * s}" y="${4 + r * s}" width="${s}" height="${s}" fill="#8be3a2" stroke="#0d6b4d" stroke-width="2"/>`;
    }
    return one('¿Cuántos cuadraditos tiene esta figura?', `<span class="fig-wrap">${K.svg(w * s + 8, h * s + 8, b)}</span><br>Cuadraditos`, n,
      { hint: 'Cuenta por filas y suma.', explain: `Hay <b>${n}</b> cuadraditos. Eso es su <b>área</b>.` });
  }
  const SYM = [
    ['cuadrado', 4, () => poly('25,15 105,15 105,95 25,95')], ['rectángulo', 2, () => poly('10,30 120,30 120,85 10,85')],
    ['triángulo equilátero', 3, () => K.polygonFig(3)], ['triángulo isósceles', 1, () => poly('65,8 105,100 25,100')],
    ['triángulo escaleno', 0, () => poly('15,95 120,95 40,20')], ['rombo', 2, () => poly('65,8 115,55 65,102 15,55')],
    ['romboide', 0, () => poly('35,25 125,25 95,85 5,85')], ['pentágono regular', 5, () => K.polygonFig(5)], ['hexágono regular', 6, () => K.polygonFig(6)],
  ];
  function gSymAxes(lvl) {
    const [name, n, fig] = R.pick(lvl ? SYM : SYM.slice(0, 6));
    return one(`¿Cuántos <b>ejes de simetría</b> tiene este ${name}?<div class="scene">${fig()}</div>`, 'Ejes', n,
      { hint: 'Un eje de simetría parte la figura en dos mitades iguales, como un espejo. Imagina que la doblas.', explain: `El ${name} tiene <b>${n}</b> eje${n === 1 ? '' : 's'} de simetría.` });
  }
  const COORD_ITEMS = ['🍎', '⭐', '🎈', '🐱', '🚀', '🍪', '⚽', '🌸', '🐟', '🎁'];
  function gCoords(lvl) {
    const cols = ['A', 'B', 'C', 'D', 'E'].slice(0, lvl ? 5 : 4), rows = lvl ? 5 : 4, items = R.sample(COORD_ITEMS, 4), cells = {};
    const keys = R.sample(cols.flatMap((c) => range(1, rows).map((r) => `${c}${r}`)), 4);
    keys.forEach((k, i) => (cells[k] = items[i]));
    let g = `<span></span>${cols.map((c) => `<b>${c}</b>`).join('')}`;
    for (let r = rows; r >= 1; r--) g += `<b>${r}</b>${cols.map((c) => `<span>${cells[c + r] || ''}</span>`).join('')}`;
    const grid = `<div class="coordgrid" style="grid-template-columns:repeat(${cols.length + 1},1fr)">${g}</div>`;
    const i = ri(0, 3);
    if (R.int(0, 1)) return choose(`¿Qué hay en la casilla <b>${keys[i]}</b>?<div class="scene">${grid}</div>`, items[i], items.filter((x, j) => j !== i), { layout: 'big', explain: `Columna ${keys[i][0]}, fila ${keys[i].slice(1)}: <b>${items[i]}</b>.` });
    return choose(`¿En qué casilla está ${items[i]}?<div class="scene">${grid}</div>`, keys[i], keys.filter((x, j) => j !== i), { hint: 'Primero la letra de la columna y después el número de la fila.', explain: `${items[i]} está en la columna ${keys[i][0]} y la fila ${keys[i].slice(1)}: <b>${keys[i]}</b>.` });
  }
  function gAngleSum(lvl) {
    if (lvl === 2 && R.int(0, 1)) {
      const a = ri(60, 120), b = ri(50, 120), c = ri(50, 360 - a - b - 40), d = 360 - a - b - c;
      if (d < 30 || d > 170) return gAngleSum(lvl);
      return one(`Un cuadrilátero tiene ángulos de <b>${a}°, ${b}° y ${c}°</b>. ¿Cuánto mide el cuarto?`, 'Ángulo (°)', d,
        { hint: 'Los ángulos de un cuadrilátero suman 360°.', explain: `360 − ${a} − ${b} − ${c} = <b>${d}°</b>` });
    }
    let A;
    do { A = [ri(30, 100), ri(30, 100)]; A.push(180 - A[0] - A[1]); } while (A[2] < 20);
    const sd = A.map((x) => Math.sin((x * Math.PI) / 180)), hide = ri(0, 2);
    const labels = A.map((x, i) => (i === hide ? '?' : x));
    return one(`¿Cuánto mide el ángulo que falta?<div class="scene">${K.triangleFig(sd[0], sd[1], sd[2], { angles: labels })}</div>`, 'Ángulo (°)', A[hide],
      { hint: 'Los tres ángulos de un triángulo siempre suman 180°.', explain: `180 − ${A.filter((x, i) => i !== hide).join(' − ')} = <b>${A[hide]}°</b>` });
  }
  function gVolume(lvl) {
    const a = ri(2, [3, 4, 6][lvl]), b = ri(2, [3, 4, 5][lvl]), c = ri(1, [2, 4, 5][lvl]);
    // isometric box: depth goes up and to the right
    const u = 24, dx = 0.6, dy = 0.42, ox = 26, oy = 16 + c * u + b * u * dy;
    const P = (x, y, z) => [+(ox + x * u + y * u * dx).toFixed(1), +(oy - z * u - y * u * dy).toFixed(1)];
    const f = (pts, fill) => `<polygon points="${pts.map((q) => q.join(',')).join(' ')}" fill="${fill}" stroke="#24164f" stroke-width="2.5" stroke-linejoin="round"/>`;
    const ln = (p1, p2) => `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="#24164f" stroke-width="1.2" opacity=".45"/>`;
    const W = ox + a * u + b * u * dx + 30, H = oy + 34;
    let body = f([P(0, 0, 0), P(a, 0, 0), P(a, 0, c), P(0, 0, c)], '#7fd3ff')
      + f([P(0, 0, c), P(a, 0, c), P(a, b, c), P(0, b, c)], '#c4ecff')
      + f([P(a, 0, 0), P(a, b, 0), P(a, b, c), P(a, 0, c)], '#4fb3e8');
    for (let x = 1; x < a; x++) body += ln(P(x, 0, 0), P(x, 0, c)) + ln(P(x, 0, c), P(x, b, c));
    for (let z = 1; z < c; z++) body += ln(P(0, 0, z), P(a, 0, z)) + ln(P(a, 0, z), P(a, b, z));
    for (let y = 1; y < b; y++) body += ln(P(0, y, c), P(a, y, c)) + ln(P(a, y, 0), P(a, y, c));
    const mid = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const la = mid(P(0, 0, 0), P(a, 0, 0)), lb = mid(P(a, 0, 0), P(a, b, 0)), lc = mid(P(0, 0, 0), P(0, 0, c));
    body += `<text x="${la[0]}" y="${la[1] + 22}" text-anchor="middle" class="t">${a}</text><text x="${lb[0] + 16}" y="${lb[1] + 12}" class="t">${b}</text><text x="${lc[0] - 14}" y="${lc[1] + 6}" text-anchor="middle" class="t">${c}</text>`;
    return one(`Una caja está llena de cubitos: <b>${a}</b> de largo, <b>${b}</b> de ancho y <b>${c}</b> de alto. ¿Cuántos cubitos caben?<div class="scene">${K.svg(W, H, body)}</div>`, 'Cubitos', a * b * c,
      { hint: 'Calcula los cubitos de una capa (largo × ancho) y multiplica por las capas (alto).', explain: `${a} × ${b} × ${c} = <b>${a * b * c}</b> cubitos. Eso es el <b>volumen</b>.` });
  }
  function gCartesian(lvl) {
    const n = 6, s = 30, pts = [], used = new Set(), letters = ['A', 'B', 'C', 'D'];
    while (pts.length < 4) { const x = ri(0, n), y = ri(0, n), k = `${x},${y}`; if (!used.has(k) && (x || y)) { used.add(k); pts.push([x, y]); } }
    let b = '';
    for (let i = 0; i <= n; i++) b += `<line x1="${30 + i * s}" y1="10" x2="${30 + i * s}" y2="${10 + n * s}" stroke="#e6d7b3"/><line x1="30" y1="${10 + i * s}" x2="${30 + n * s}" y2="${10 + i * s}" stroke="#e6d7b3"/><text x="${30 + i * s}" y="${n * s + 30}" text-anchor="middle" class="t tiny">${i}</text><text x="18" y="${10 + (n - i) * s + 4}" text-anchor="middle" class="t tiny">${i}</text>`;
    b += `<line x1="30" y1="${10 + n * s}" x2="${36 + n * s}" y2="${10 + n * s}" stroke="#24164f" stroke-width="3"/><line x1="30" y1="${10 + n * s}" x2="30" y2="4" stroke="#24164f" stroke-width="3"/>`;
    pts.forEach(([x, y], i) => (b += `<circle cx="${30 + x * s}" cy="${10 + (n - y) * s}" r="7" fill="#ff4f8b" stroke="#24164f" stroke-width="2"/><text x="${30 + x * s + 10}" y="${10 + (n - y) * s - 8}" class="t small red">${letters[i]}</text>`));
    const fig = `<div class="scene">${K.svg(n * s + 50, n * s + 40, b)}</div>`, i = ri(0, 3), [x, y] = pts[i];
    if (lvl && R.int(0, 1)) {
      return { type: 'cells', prompt: `¿Cuáles son las coordenadas del punto <b>${letters[i]}</b>?${fig}`, html: `<div class="eq big">${letters[i]} = (${cell(0)}, ${cell(1)})</div>`,
        cells: [{ ans: x }, { ans: y }], hint: 'Primero el número de abajo (eje horizontal, x) y después el del lado (eje vertical, y).', explain: `${letters[i]} = <b>(${x}, ${y})</b>` };
    }
    return choose(`¿Qué punto está en <b>(${x}, ${y})</b>?${fig}`, letters[i], letters.filter((l, j) => j !== i), { hint: 'Avanza por abajo hasta el primer número y sube hasta el segundo.', explain: `Avanzas ${x} y subes ${y}: el punto <b>${letters[i]}</b>.` });
  }
  function gRegPerim(lvl) {
    const [name, n] = R.pick([['triángulo equilátero', 3], ['cuadrado', 4], ['pentágono regular', 5], ['hexágono regular', 6], ['octógono regular', 8]]);
    const l = lvl === 2 ? ri(12, 45) / 10 : ri(2, 12);
    if (lvl === 2) return { type: 'cells', decimals: true, prompt: `Un <b>${name}</b> tiene lados de <b>${fmt(l)} cm</b>. ¿Cuál es su perímetro?`, html: `<div class="eq big">Perímetro = ${cell(0)} cm</div>`, cells: [{ ans: Math.round(n * l * 10) / 10 }], hint: 'Un polígono regular tiene todos los lados iguales.', explain: `${n} × ${fmt(l)} = <b>${fmt(Math.round(n * l * 10) / 10)} cm</b>` };
    return R.int(0, 1)
      ? one(`Un <b>${name}</b> tiene lados de <b>${l} cm</b>. ¿Cuál es su perímetro?`, 'Perímetro (cm)', n * l, { hint: 'Un polígono regular tiene todos los lados iguales.', explain: `${n} × ${l} = <b>${n * l} cm</b>` })
      : one(`Un <b>${name}</b> tiene un perímetro de <b>${n * l} cm</b>. ¿Cuánto mide cada lado?`, 'Lado (cm)', l, { hint: `Tiene ${n} lados iguales.`, explain: `${n * l} : ${n} = <b>${l} cm</b>` });
  }

  const g = (s, u, m) => from(s, u, m);
  const GEO_UNITS = [
    unit('n0', 0, 'g0formas', 'Las formas', 'Planeta Formas', '🔺', [M('toca', 'Toca la forma', 'Círculo, cuadrado, triángulo', g('numeros', 'formas', 'toca'), 6), M('cuenta', 'Cuenta las formas', '¿Cuántas hay?', g('numeros', 'formas', 'cuenta'), 5)]),
    unit('n0', 1, 'g0objetos', 'Formas a mi alrededor', 'Planeta Cosas', '🍕', [M('forma', '¿Qué forma tiene?', 'Pizza, balón, regalo…', gObjShape, 6)]),
    unit('n0', 2, 'g0lineas', 'Líneas', 'Planeta Garabato', '〰️', [M('lineas', 'Recta o curva', '¿Qué línea es?', at(gLines, 0), 5)]),
    unit('n0', 3, 'g0posiciones', 'Posiciones', 'Planeta Brújula', '🧭', [M('donde', 'Arriba, abajo, al lado', '¿Quién está ahí?', from('logica', 'posiciones', 'donde'), 6)]),
    unit('n0', 4, 'g0tamanos', 'Tamaños', 'Valle de los Tamaños', '📏', [M('ordena', 'Ordena por tamaño', 'Del pequeño al grande', from('logica', 'tamanos', 'ordena'), 4)]),

    unit('n1', 0, 'g1figuras', 'Figuras planas', 'Planeta Polígono', '🔷', [M('nombre', 'Nombres de figuras', 'Del triángulo al hexágono', g('mates1', 'formas', 'formas'), 6), M('lados', 'Cuenta los lados', 'Polígonos', upto(G.gPolygon, 1), 5)]),
    unit('n1', 1, 'g1lineas', 'Tipos de líneas', 'Planeta Garabato', '〰️', [M('lineas', 'Recta, curva, poligonal, mixta', '¿Qué línea es?', at(gLines, 1), 5)]),
    unit('n1', 2, 'g1cuerpos', 'Cuerpos geométricos', 'Planeta Cubo', '🧊', [M('objetos', '¿Qué cuerpo parece?', 'Dado, lata, cucurucho…', gObjSolid, 6), M('nombres', 'Nombres de cuerpos', 'Cubo, prisma, esfera…', at(g('mates3', 'cuerpos', 'cuerpos'), 0), 5)]),
    unit('n1', 3, 'g1cuadros', 'Cuenta cuadraditos', 'Planeta Baldosa', '🟩', [M('cuenta', '¿Cuántos cuadraditos?', 'La primera idea de área', upto(gCountSquares, 1), 5)]),
    unit('n1', 4, 'g1simetria', 'Simetría', 'Planeta Espejo', '🦋', [M('ejes', 'Ejes de simetría', 'Dobla la figura', at(gSymAxes, 0), 5)]),

    unit('n2', 0, 'g2angulos', 'Ángulos', 'Planeta Transportador', '📐', [M('angulos', 'Tipos de ángulos', 'Agudo, recto, obtuso, llano', upto(G.gAngle, 1), 6)]),
    unit('n2', 1, 'g2triangulos', 'Triángulos', 'Planeta Triángulo', '🔺', [M('triangulos', 'Clasifica triángulos', 'Por lados y por ángulos', upto(G.gTriangle, 1), 6)]),
    unit('n2', 2, 'g2cuadri', 'Cuadriláteros', 'Planeta Cuatro Lados', '🔶', [M('cuadrilateros', 'Clasifica cuadriláteros', 'Paralelogramos y trapecios', g('mates4', 'geometria', 'cuadrilateros'), 6)]),
    unit('n2', 3, 'g2simetria', 'Simetría', 'Planeta Espejo', '🦋', [M('ejes', 'Ejes de simetría', 'De todos los polígonos', at(gSymAxes, 1), 5)]),
    unit('n2', 4, 'g2perimetro', 'Perímetro y área', 'Planeta Valla', '🧱', [M('cuadros', 'Figuras de cuadraditos', 'Con forma de L', at(gCountSquares, 2), 4), M('rect', 'Rectángulos', 'Área y perímetro', at(G.gArea, 1), 5)]),
    unit('n2', 5, 'g2coordenadas', 'Coordenadas', 'Planeta Mapa', '🗺️', [M('casillas', 'Casillas del mapa', 'Letra y número: B3', upto(gCoords, 1), 6)]),
    unit('n2', 6, 'g2circulo', 'Circunferencia', 'Planeta Compás', '⭕', [M('partes', 'Radio, diámetro, cuerda', 'Las partes del círculo', upto(G.gCircle, 1), 5)]),

    unit('n3', 0, 'g3angulos', 'Suma de ángulos', 'Planeta Grados', '📐', [M('suma', 'El ángulo que falta', 'Triángulos (180°) y cuadriláteros (360°)', at(gAngleSum, 2), 6)]),
    unit('n3', 1, 'g3areas', 'Áreas', 'Planeta Parcela', '🟦', [M('areas', 'Área de rectángulos y triángulos', 'Base × altura', at(G.gArea, 2), 5), M('regulares', 'Polígonos regulares', 'Perímetro y lado', upto(gRegPerim, 2), 5)]),
    unit('n3', 2, 'g3circulo', 'Circunferencia y círculo', 'Planeta Pi', '🥧', [M('circulo', 'Longitud y área', 'Con π = 3,14', g('mates6', 'medida', 'circulo'), 4)]),
    unit('n3', 3, 'g3volumen', 'Volumen', 'Planeta Caja', '📦', [M('cubitos', '¿Cuántos cubitos caben?', 'Largo × ancho × alto', gVolume, 5)]),
    unit('n3', 4, 'g3cartesianas', 'Coordenadas cartesianas', 'Planeta Plano', '📍', [M('puntos', 'Puntos en el plano', '(x, y)', at(gCartesian, 1), 6)]),
    unit('n3', 5, 'g3escalas', 'Planos y escalas', 'Planeta Mapa', '🗺️', [M('escalas', 'Escalas', 'Del mapa a la realidad', g('mates6', 'proporcion', 'escalas'), 5)]),
  ];
  S.subjects.geometria = {
    id: 'geometria', title: 'Geometría', emoji: '📐', tagline: 'De Infantil a 6.º: formas, ángulos, simetría y volumen',
    grades: ['i3', 'i4', 'i5', '1', '2', '3', '4', '5', '6'], young: true, units: GEO_UNITS,
    sections: sections('geometria', ['Formas, líneas, posiciones y tamaños', 'Polígonos, cuerpos, cuadraditos y simetría', 'Ángulos, triángulos, cuadriláteros, coordenadas', 'Suma de ángulos, áreas, círculo, volumen y plano']),
  };
})();
