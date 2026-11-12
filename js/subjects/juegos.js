// Zona de juegos: open for every school year, no padlocks and no exams.
// Each game has Fácil / Normal / Difícil missions. Voice and big pictures follow
// the player (on for Infantil and 1.º).
(function () {
  const S = window.StudIA, { R } = S;
  const at = (gen, l) => (lvl, i) => gen(l, i);
  const from = (sub, unit, mission) => S.subjects[sub].units.find((x) => x.id === unit).missions.find((m) => m.id === mission).gen;
  const num = (v) => `<span class="num">${v}</span>`;

  // ---------- sudoku 6×6 ----------
  function gSudoku6(lvl) {
    const n = 6, rows = R.shuffle([0, 1, 2, 3, 4, 5]), cols = R.shuffle([0, 1, 2, 3, 4, 5]), sym = R.shuffle([0, 1, 2, 3, 4, 5]);
    const sol = rows.map((r) => cols.map((c) => sym[(r + c) % n]));
    const grid = sol.map((r) => r.slice());
    R.sample([...Array(36).keys()], [12, 16, 20][lvl]).forEach((k) => (grid[Math.floor(k / n)][k % n] = null));
    return { type: 'latin', size: n, grid, solution: sol, symbols: ['1', '2', '3', '4', '5', '6'],
      prompt: 'Sudoku 6 × 6: toca las casillas vacías para cambiar el número. No se puede repetir en ninguna fila ni columna.', explain: '¡Sudoku resuelto!' };
  }
  // ---------- memory variants ----------
  const MEMO = ['🐶', '🐱', '🦁', '🐸', '🐵', '🦄', '🐙', '🐢', '🍎', '🍌', '🚗', '🚀', '⚽', '🎈', '🌈', '⭐', '🐼', '🦊', '🍓', '🎸'];
  const memoSame = (k) => () => ({ type: 'memory', prompt: `Encuentra las ${k} parejas iguales.`, pairs: R.sample(MEMO, k).map((e) => [e, e]), explain: '¡Todas las parejas encontradas!' });
  function memoSums(lvl) {
    const k = [4, 5, 6][lvl], seen = new Set(), pairs = [];
    while (pairs.length < k) {
      let a, b, t, v;
      if (lvl === 0) { a = R.int(1, 9); b = R.int(1, 10 - a); t = `${a} + ${b}`; v = a + b; }
      else if (lvl === 1) { a = R.int(5, 20); b = R.int(1, 9); [t, v] = R.int(0, 1) ? [`${a} + ${b}`, a + b] : [`${a + b} − ${b}`, a]; }
      else { a = R.int(2, 9); b = R.int(2, 9); t = `${a} × ${b}`; v = a * b; }
      if (seen.has(v)) continue;
      seen.add(v); pairs.push([`<span class="mtxt">${t}</span>`, num(v)]);
    }
    return { type: 'memory', prompt: 'Busca las parejas: cada operación con su resultado.', pairs, explain: '¡Todas las parejas encontradas!' };
  }
  const WORDS = [['perro', '🐶'], ['gato', '🐱'], ['sol', '☀️'], ['luna', '🌙'], ['casa', '🏠'], ['árbol', '🌳'], ['pez', '🐟'], ['coche', '🚗'], ['flor', '🌸'], ['pato', '🦆'], ['tren', '🚂'], ['pelota', '⚽'], ['manzana', '🍎'], ['rana', '🐸']];
  function memoWords(lvl) {
    return { type: 'memory', prompt: 'Busca las parejas: cada palabra con su dibujo.', pairs: R.sample(WORDS, [3, 4, 6][lvl]).map(([w, e]) => [`<span class="mtxt">${w}</span>`, e]), explain: '¡Todas las parejas encontradas!' };
  }
  // ---------- the new games ----------
  const simon = (pads, length) => () => ({ type: 'simon', pads, length, prompt: 'Simón dice: mira el orden en que se encienden los colores y repítelo.', explain: '¡Qué buena memoria!' });
  const HEROES = [['🐭', '🧀'], ['🐰', '🥕'], ['🐶', '🦴'], ['🐝', '🌸'], ['🤖', '🔋'], ['🐵', '🍌']];
  const maze = (size) => () => { const [hero, prize] = R.pick(HEROES); return { type: 'maze', size, hero, prize, prompt: `Lleva ${hero} hasta ${prize}. Usa las flechas o toca la casilla de al lado.`, explain: '¡Has salido del laberinto!' }; };
  const PIECES = [['⭐', '🪐'], ['🐱', '🐶'], ['🍎', '🍌'], ['🚀', '🛸']];
  const ttt = (level) => () => { const [me, cpu] = R.pick(PIECES); return { type: 'ttt', level, me, cpu, prompt: ['Tres en raya: pon tres en línea antes que el ordenador.', 'Tres en raya: ¡el ordenador ya sabe defenderse!', 'Tres en raya: el ordenador no falla nunca. ¿Consigues empatar?'][level], explain: level === 2 ? 'Contra un rival perfecto, empatar es ganar.' : '¡Bien jugado!' }; };
  const slide = (size, shuffle) => () => ({ type: 'slide', size, shuffle, prompt: `Ordena los números del 1 al ${size * size - 1} moviendo las fichas al hueco.`, explain: '¡Puzzle resuelto!' });


  // ---------- blocks, 2048, lights, Hanoi, secret code ----------
  const tetris = (lines, speed, garbage) => () => ({ type: 'tetris', lines, speed, garbage,
    prompt: `Bloques que caen: completa <b>${lines}</b> ${lines === 1 ? 'línea' : 'líneas'} enteras para que desaparezcan. ⬅️ ➡️ mover · 🔄 girar · ⏬ soltar (con el teclado: flechas y espacio).`,
    explain: '¡Líneas completadas! Has pensado rápido dónde encaja cada pieza.' });
  const g2048 = (goal) => () => ({ type: 'g2048', goal,
    prompt: `Desliza las fichas. Dos fichas iguales se juntan y se suman: 2 + 2 = 4, 4 + 4 = 8… ¡Llega hasta el <b>${goal}</b>!`,
    explain: `Cada ficha es el doble de la anterior: 2, 4, 8, 16, 32, 64… ¡Has llegado al ${goal}!` });
  const lights = (size, presses) => () => ({ type: 'lights', size, presses,
    prompt: 'Apaga todas las luces. Cuidado: al tocar una luz, también cambian las de arriba, abajo y los lados.',
    hint: 'Apaga la primera fila tocando las luces de la fila de debajo. Luego haz lo mismo fila a fila hasta abajo.',
    explain: '¡Todo a oscuras! Pulsar dos veces la misma luz es como no pulsarla.' });
  const hanoi = (discs) => () => ({ type: 'hanoi', discs,
    prompt: `Torres de Hanói: lleva los ${discs} discos hasta la torre 🏁. Toca una torre para coger su disco de arriba y otra para dejarlo. Nunca pongas un disco grande sobre uno pequeño.`,
    hint: discs % 2 ? 'Con un número impar de discos, el disco más pequeño empieza yendo a la torre 🏁.' : 'Con un número par de discos, el disco más pequeño empieza yendo a la torre del medio.',
    explain: `Con ${discs} discos se necesitan como mínimo ${2 ** discs - 1} movimientos: cada disco más duplica el trabajo y suma uno.` });
  const code = (slots, colors, tries, exact, repeat) => () => ({ type: 'code', slots, colors, tries, exact, repeat,
    prompt: `Código secreto: adivina los <b>${slots}</b> colores escondidos y su orden. Tienes ${tries} intentos. Elige los colores y pulsa «Comprobar».`,
    hint: exact ? 'Deja los verdes donde están y mueve los amarillos a otro sitio.' : 'Cambia un solo color cada vez para saber qué pista ha cambiado.',
    explain: 'Los buenos detectives usan cada pista para descartar posibilidades.' });

  // ---------- nonograms: pixel pictures ----------
  const PICS5 = [
    ['un corazón ❤️', ['.#.#.', '#####', '#####', '.###.', '..#..']],
    ['una casa 🏠', ['..#..', '.###.', '#####', '##.##', '##.##']],
    ['un árbol 🌲', ['..#..', '.###.', '#####', '..#..', '..#..']],
    ['una flecha ⬆️', ['..#..', '.###.', '#.#.#', '..#..', '..#..']],
    ['un gato 🐱', ['#...#', '#####', '#.#.#', '#####', '.###.']],
    ['una copa 🏆', ['#####', '#####', '.###.', '..#..', '.###.']],
    ['una seta 🍄', ['.###.', '#####', '#.#.#', '.###.', '.#.#.']],
    ['un robot 🤖', ['..#..', '#####', '#.#.#', '#####', '#.#.#']],
  ];
  const PICS7 = [
    ['un cohete 🚀', ['...#...', '..###..', '..#.#..', '..###..', '.#####.', '##.#.##', '#..#..#']],
    ['un corazón ❤️', ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...']],
    ['un barco ⛵', ['...#...', '...##..', '...###.', '...#...', '#######', '.#####.', '..###..']],
    ['una cara 🙂', ['.#####.', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#..#..#', '.#####.']],
    ['una estrella ⭐', ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '#.....#']],
    ['un pez 🐟', ['.......', '..###.#', '.######', '#.#####', '.######', '..###.#', '.......']],
  ];
  const picture = (pics) => () => { const [name, rows] = R.pick(pics); return { type: 'nono', name, grid: rows.map((r) => [...r].map((x) => x === '#')),
    prompt: 'Pinta el dibujo: los números dicen cuántas casillas seguidas hay que pintar en cada fila y columna. ¿Qué dibujo sale?',
    hint: 'Empieza por las filas o columnas con números grandes. Marca con ✕ las casillas que seguro que van vacías.', explain: `¡Era ${name}!` }; };
  const pixels = (rows, cols, fill) => () => {
    let grid;
    do grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() < fill));
    while (grid.some((r) => !r.some(Boolean)) || grid[0].some((x, j) => !grid.some((r) => r[j])));
    return { type: 'nono', grid, prompt: `Nonograma ${rows} × ${cols}: los números dicen cuántas casillas seguidas hay que pintar en cada fila y columna, en ese orden y con al menos un hueco entre grupos.`,
      hint: 'Si un número es mayor que la mitad de la fila, las casillas del centro seguro que van pintadas.', explain: '¡Nonograma resuelto!' };
  };

  // ---------- word search: vocabulary ----------
  const TEMAS = {
    animales: ['Animales', [['perro', '🐶'], ['gato', '🐱'], ['vaca', '🐮'], ['pato', '🦆'], ['león', '🦁'], ['oso', '🐻'], ['rana', '🐸'], ['mono', '🐵'], ['cerdo', '🐷'], ['ratón', '🐭'], ['tigre', '🐯'], ['jirafa', '🦒'], ['caballo', '🐴'], ['conejo', '🐰'], ['tortuga', '🐢'], ['elefante', '🐘']]],
    frutas: ['Frutas', [['pera', '🍐'], ['uva', '🍇'], ['kiwi', '🥝'], ['piña', '🍍'], ['limón', '🍋'], ['melón', '🍈'], ['fresa', '🍓'], ['cereza', '🍒'], ['plátano', '🍌'], ['naranja', '🍊'], ['manzana', '🍎'], ['sandía', '🍉'], ['coco', '🥥'], ['mango', '🥭']]],
    colores: ['Colores', [['rojo', '🟥'], ['azul', '🟦'], ['verde', '🟩'], ['negro', '⬛'], ['blanco', '⬜'], ['rosa', '🌸'], ['gris', '🐘'], ['marrón', '🟫'], ['amarillo', '🟨'], ['naranja', '🟧'], ['morado', '🟪'], ['dorado', '🏆']]],
    cuerpo: ['El cuerpo', [['ojo', '👁️'], ['boca', '👄'], ['nariz', '👃'], ['oreja', '👂'], ['mano', '✋'], ['pie', '🦶'], ['brazo', '💪'], ['pierna', '🦵'], ['diente', '🦷'], ['lengua', '👅'], ['cabeza', '🙂'], ['corazón', '❤️'], ['cerebro', '🧠'], ['hueso', '🦴']]],
    espacio: ['El espacio', [['sol', '☀️'], ['luna', '🌙'], ['marte', '🔴'], ['tierra', '🌍'], ['cohete', '🚀'], ['estrella', '⭐'], ['cometa', '☄️'], ['planeta', '🪐'], ['satélite', '🛰️'], ['galaxia', '🌌'], ['júpiter', '🟠'], ['saturno', '🪐'], ['astronauta', '🧑‍🚀']]],
    numeros: ['Números', [['uno', '1️⃣'], ['dos', '2️⃣'], ['tres', '3️⃣'], ['cuatro', '4️⃣'], ['cinco', '5️⃣'], ['seis', '6️⃣'], ['siete', '7️⃣'], ['ocho', '8️⃣'], ['nueve', '9️⃣'], ['diez', '🔟'], ['cien', '💯'], ['once', '⚽'], ['doce', '🕛'], ['veinte', '✌️']]],
    geometria: ['Geometría', [['recta', '📏'], ['punto', '•'], ['ángulo', '📐'], ['círculo', '⚪'], ['cuadrado', '⬛'], ['triángulo', '🔺'], ['rombo', '🔷'], ['cubo', '🧊'], ['esfera', '🔮'], ['vértice', '📍'], ['lado', '➖'], ['radio', '📻'], ['prisma', '🔶'], ['polígono', '⬟']]],
    ciencias: ['Naturaleza', [['agua', '💧'], ['fuego', '🔥'], ['aire', '💨'], ['nube', '☁️'], ['lluvia', '🌧️'], ['río', '🏞️'], ['mar', '🌊'], ['volcán', '🌋'], ['montaña', '⛰️'], ['planta', '🌱'], ['semilla', '🌰'], ['raíz', '🌿'], ['hoja', '🍃'], ['flor', '🌸'], ['bosque', '🌲']]],
  };
  const sopa = (size, count, dirs, temas) => () => {
    const [title, list] = TEMAS[R.pick(temas)];
    const words = R.sample(list.filter(([w]) => w.length <= size), count);
    const how = dirs === 1 ? 'Todas van de izquierda a derecha.' : dirs === 2 ? 'Van de izquierda a derecha o de arriba abajo.' : dirs < 8 ? 'Pueden ir en horizontal, en vertical o en diagonal.' : '¡Pueden ir en cualquier dirección, incluso al revés!';
    return { type: 'sopa', size, dirs, words, prompt: `Sopa de letras · <b>${title}</b>: encuentra las ${count} palabras. Toca la primera letra y luego la última (o arrastra). ${how}`, explain: `¡Has encontrado todas las palabras de ${title.toLowerCase()}!` };
  };

  // ---------- the sums snake ----------
  const near = (a, k, min = 0) => { const s = new Set(); let guard = 0; while (s.size < k && guard++ < 200) { const v = a + R.pick([-3, -2, -1, 1, 2, 3, 10, -10]); if (v >= min && v !== a) s.add(v); } return [...s]; };
  const ASK = {
    suma10: () => { const a = R.int(0, 9), b = R.int(1, 10 - a); return { q: `¿${a} + ${b}?`, a: a + b }; },
    resta10: () => { const a = R.int(2, 10), b = R.int(1, a); return { q: `¿${a} − ${b}?`, a: a - b }; },
    suma20: () => { const a = R.int(5, 15), b = R.int(2, 20 - a); return { q: `¿${a} + ${b}?`, a: a + b }; },
    resta20: () => { const a = R.int(10, 20), b = R.int(2, 9); return { q: `¿${a} − ${b}?`, a: a - b }; },
    dobles: () => { const a = R.int(2, 25); return R.int(0, 1) ? { q: `¿Doble de ${a}?`, a: 2 * a } : { q: `¿Mitad de ${2 * a}?`, a }; },
    decenas: () => { const a = R.int(1, 9) * 10, b = R.int(1, 9) * (R.int(0, 1) ? 10 : 1); return { q: `¿${a} + ${b}?`, a: a + b }; },
    tablas1: () => { const a = R.pick([2, 5, 10]), b = R.int(1, 10); return { q: `¿${a} × ${b}?`, a: a * b }; },
    tablas2: () => { const a = R.pick([3, 4, 6]), b = R.int(1, 10); return { q: `¿${a} × ${b}?`, a: a * b }; },
    tablas3: () => { const a = R.pick([7, 8, 9]), b = R.int(2, 10); return { q: `¿${a} × ${b}?`, a: a * b }; },
    division: () => { const b = R.int(2, 9), a = R.int(2, 10); return { q: `¿${a * b} : ${b}?`, a }; },
  };
  const snake = (kind, goal, speed, wrap) => () => ({ type: 'snake', goal, speed, wrap,
    ask: () => { const x = ASK[kind](); return Object.assign(x, { wrong: near(x.a, 3) }); },
    prompt: `Serpiente de cuentas: guía a la serpiente hasta el número que responde a la pregunta. Necesitas <b>${goal}</b> respuestas. ¡No comas los números equivocados!${wrap ? ' Si sales por un lado, entras por el otro.' : ' ¡Cuidado con las paredes!'}`,
    explain: '¡Qué serpiente tan lista! Calcular rápido es un superpoder.' });

  const M = (id, title, desc, gen, rounds) => ({ id, title, desc, gen, rounds: rounds || 3 });
  const U = (id, title, planet, emoji, color, missions) => ({ id, title, planet, emoji, color, section: 'juegos', missions });
  S.subjects.juegos = {
    id: 'juegos', title: 'Zona de juegos', emoji: '🎮', tagline: 'Bloques, serpientes, sudokus, sopas de letras, códigos secretos y muchos más',
    grades: ['i3', 'i4', 'i5', '1', '2', '3', '4', '5', '6'], youngByPlayer: true,
    sections: [{ id: 'juegos', key: 'juegos', free: true, exam: false, emoji: '🎮', title: 'Todo abierto', subtitle: 'Elige un juego y un nivel. ¡Sin candados!' }],
    units: [
      U('sudoku', 'Sudoku', 'Isla Sudoku', '🧩', '#ff9d3d', [
        M('facil', 'Fácil · 3 × 3 de dibujos', 'Para empezar', at(from('logica', 'sudoku', 'mini'), 0)),
        M('normal', 'Normal · 4 × 4 de dibujos', 'Cuatro dibujos', at(from('logica', 'sudoku', 'mini'), 2)),
        M('numeros', 'Normal · 4 × 4 de números', 'Del 1 al 4', from('logica', 'l1sudoku', 'numeros')),
        M('dificil', 'Difícil · 6 × 6 de números', 'Del 1 al 6', gSudoku6, 2),
      ]),
      U('memoria', 'Memoria', 'Planeta Memoria', '🧠', '#58c4ff', [
        M('facil', 'Fácil · 4 parejas', 'Cartas iguales', memoSame(4)),
        M('normal', 'Normal · 6 parejas', 'Cartas iguales', memoSame(6)),
        M('dificil', 'Difícil · 10 parejas', '¡20 cartas!', memoSame(10), 2),
        M('cuentas', 'Cuentas y resultados', 'Sumas, restas y tablas', memoSums),
        M('palabras', 'Palabras y dibujos', 'Lee y empareja', memoWords),
      ]),
      U('simon', 'Simón dice', 'Planeta Música', '🎵', '#ff4f8b', [
        M('facil', 'Fácil · 3 colores', 'Secuencias de 3', simon(3, 3)),
        M('normal', 'Normal · 4 colores', 'Secuencias de 5', simon(4, 5)),
        M('dificil', 'Difícil · 6 colores', 'Secuencias de 7', simon(6, 7)),
      ]),
      U('laberinto', 'Laberintos', 'Planeta Laberinto', '🌀', '#2ed9a3', [
        M('facil', 'Fácil · 5 × 5', 'Laberinto pequeño', maze(5)),
        M('normal', 'Normal · 7 × 7', 'Laberinto mediano', maze(7)),
        M('dificil', 'Difícil · 10 × 10', '¡Laberinto gigante!', maze(10)),
      ]),
      U('tresenraya', 'Tres en raya', 'Planeta Cuadrícula', '❌', '#8b5cf6', [
        M('facil', 'Fácil', 'El ordenador juega al azar', ttt(0)),
        M('normal', 'Normal', 'El ordenador se defiende', ttt(1)),
        M('dificil', 'Difícil', 'El ordenador no falla nunca', ttt(2)),
      ]),
      U('puzzle', 'Puzzle deslizante', 'Planeta Fichas', '🔢', '#ffd23f', [
        M('facil', 'Fácil · 3 × 3', 'Poco desordenado', slide(3, 12), 2),
        M('normal', 'Normal · 3 × 3', 'Muy desordenado', slide(3, 50), 2),
        M('dificil', 'Difícil · 4 × 4', 'Del 1 al 15', slide(4, 60), 1),
      ]),
      U('robots', 'Robots', 'Fábrica de Robots', '🤖', '#7d8cff', [
        M('facil', 'Fácil', '2 flechas', at(from('logica', 'robot', 'flechas'), 0)),
        M('normal', 'Normal', '3 flechas', at(from('logica', 'robot', 'flechas'), 1)),
        M('dificil', 'Difícil', '5 flechas', at(from('logica', 'robot', 'flechas'), 2)),
      ]),
      U('bloques', 'Bloques que caen', 'Planeta Bloques', '🧱', '#3ec1ff', [
        M('n1', 'Nivel 1 · 3 líneas', 'Muy despacio', tetris(3, 850), 1),
        M('n2', 'Nivel 2 · 5 líneas', 'Despacio', tetris(5, 720), 1),
        M('n3', 'Nivel 3 · 6 líneas', 'Un poco más rápido', tetris(6, 620), 1),
        M('n4', 'Nivel 4 · 8 líneas', 'Velocidad normal', tetris(8, 530), 1),
        M('n5', 'Nivel 5 · 8 líneas', 'Con escombros abajo', tetris(8, 480, 2), 1),
        M('n6', 'Nivel 6 · 10 líneas', 'Rápido', tetris(10, 420, 2), 1),
        M('n7', 'Nivel 7 · 12 líneas', 'Más escombros', tetris(12, 360, 4), 1),
        M('n8', 'Nivel 8 · 14 líneas', 'Muy rápido', tetris(14, 300, 4), 1),
        M('n9', 'Nivel 9 · 16 líneas', '¡Rapidísimo!', tetris(16, 240, 5), 1),
        M('n10', 'Nivel 10 · 20 líneas', '¡Maestro de los bloques!', tetris(20, 190, 6), 1),
      ]),
      U('serpiente', 'Serpiente de cuentas', 'Planeta Serpiente', '🐍', '#2ed9a3', [
        M('n1', 'Nivel 1 · Sumas hasta 10', 'Despacio, sin paredes', snake('suma10', 5, 420, true), 1),
        M('n2', 'Nivel 2 · Restas hasta 10', 'Despacio, sin paredes', snake('resta10', 5, 420, true), 1),
        M('n3', 'Nivel 3 · Sumas hasta 20', 'Sin paredes', snake('suma20', 6, 380, true), 1),
        M('n4', 'Nivel 4 · Restas hasta 20', 'Sin paredes', snake('resta20', 6, 360, true), 1),
        M('n5', 'Nivel 5 · Dobles y mitades', '¡Con paredes!', snake('dobles', 6, 350), 1),
        M('n6', 'Nivel 6 · Decenas', 'Sumas con decenas', snake('decenas', 7, 330), 1),
        M('n7', 'Nivel 7 · Tablas del 2, 5 y 10', 'Multiplica', snake('tablas1', 7, 320), 1),
        M('n8', 'Nivel 8 · Tablas del 3, 4 y 6', 'Multiplica', snake('tablas2', 8, 300), 1),
        M('n9', 'Nivel 9 · Tablas del 7, 8 y 9', 'Las difíciles', snake('tablas3', 8, 280), 1),
        M('n10', 'Nivel 10 · Divisiones', '¡Rápido!', snake('division', 10, 250), 1),
      ]),
      U('dosmil', 'Junta y dobla (2048)', 'Planeta Dobles', '🔶', '#ff8a1f', [
        M('n1', 'Nivel 1 · Llega al 16', 'Para aprender', g2048(16), 1),
        M('n2', 'Nivel 2 · Llega al 32', '', g2048(32), 1),
        M('n3', 'Nivel 3 · Llega al 64', '', g2048(64), 1),
        M('n4', 'Nivel 4 · Llega al 128', '', g2048(128), 1),
        M('n5', 'Nivel 5 · Llega al 256', 'Hay que pensar', g2048(256), 1),
        M('n6', 'Nivel 6 · Llega al 512', 'Partida larga', g2048(512), 1),
        M('n7', 'Nivel 7 · Llega al 1024', '¡Muy larga!', g2048(1024), 1),
        M('n8', 'Nivel 8 · Llega al 2048', '¡El reto final!', g2048(2048), 1),
      ]),
      U('luces', 'Apaga las luces', 'Planeta Faros', '💡', '#ffd23f', [
        M('n1', 'Nivel 1 · 3 × 3', 'Se apaga con 1 toque', lights(3, 1)),
        M('n2', 'Nivel 2 · 3 × 3', 'Con 2 toques', lights(3, 2)),
        M('n3', 'Nivel 3 · 3 × 3', 'Con 3 toques', lights(3, 3)),
        M('n4', 'Nivel 4 · 4 × 4', 'Con 3 toques', lights(4, 3)),
        M('n5', 'Nivel 5 · 4 × 4', 'Con 5 toques', lights(4, 5), 2),
        M('n6', 'Nivel 6 · 5 × 5', 'Con 4 toques', lights(5, 4), 2),
        M('n7', 'Nivel 7 · 5 × 5', 'Con 7 toques', lights(5, 7), 2),
        M('n8', 'Nivel 8 · 5 × 5', '¡Con 10 toques!', lights(5, 10), 1),
      ]),
      U('hanoi', 'Torres de Hanói', 'Planeta Torres', '🗼', '#ff4f8b', [
        M('n1', 'Nivel 1 · 2 discos', 'Para aprender', hanoi(2), 2),
        M('n2', 'Nivel 2 · 3 discos', 'Mínimo 7 movimientos', hanoi(3), 2),
        M('n3', 'Nivel 3 · 4 discos', 'Mínimo 15 movimientos', hanoi(4), 1),
        M('n4', 'Nivel 4 · 5 discos', 'Mínimo 31 movimientos', hanoi(5), 1),
        M('n5', 'Nivel 5 · 6 discos', 'Mínimo 63 movimientos', hanoi(6), 1),
        M('n6', 'Nivel 6 · 7 discos', '¡Mínimo 127 movimientos!', hanoi(7), 1),
      ]),
      U('codigo', 'Código secreto', 'Planeta Espía', '🕵️', '#5d3fd0', [
        M('n1', 'Nivel 1 · 3 bolas, 3 colores', 'Con pistas de colores', code(3, 3, 6, true)),
        M('n2', 'Nivel 2 · 3 bolas, 4 colores', 'Con pistas de colores', code(3, 4, 6, true)),
        M('n3', 'Nivel 3 · 4 bolas, 5 colores', 'Con pistas de colores', code(4, 5, 7, true)),
        M('n4', 'Nivel 4 · 4 bolas, 6 colores', 'Se repiten colores', code(4, 6, 8, true, true), 2),
        M('n5', 'Nivel 5 · 3 bolas, 4 colores', 'Solo pistas ⚫ ⚪', code(3, 4, 7, false), 2),
        M('n6', 'Nivel 6 · 4 bolas, 5 colores', 'Solo pistas ⚫ ⚪', code(4, 5, 8, false), 2),
        M('n7', 'Nivel 7 · 4 bolas, 6 colores', 'Solo pistas ⚫ ⚪', code(4, 6, 9, false), 2),
        M('n8', 'Nivel 8 · 4 bolas, 6 colores', '¡Se repiten! Solo ⚫ ⚪', code(4, 6, 10, false, true), 1),
      ]),
      U('pixel', 'Pinta el dibujo', 'Planeta Píxel', '🎨', '#8b5cf6', [
        M('n1', 'Nivel 1 · Dibujos 5 × 5', '¿Qué dibujo sale?', picture(PICS5)),
        M('n2', 'Nivel 2 · Nonograma 5 × 5', 'Sin dibujo', pixels(5, 5, 0.6)),
        M('n3', 'Nivel 3 · Dibujos 7 × 7', '¿Qué dibujo sale?', picture(PICS7), 2),
        M('n4', 'Nivel 4 · Nonograma 6 × 6', '', pixels(6, 6, 0.6), 2),
        M('n5', 'Nivel 5 · Nonograma 7 × 7', '', pixels(7, 7, 0.58), 2),
        M('n6', 'Nivel 6 · Nonograma 8 × 8', '', pixels(8, 8, 0.58), 1),
        M('n7', 'Nivel 7 · Nonograma 10 × 10', 'Difícil', pixels(10, 10, 0.6), 1),
        M('n8', 'Nivel 8 · Nonograma 12 × 12', '¡Muy difícil!', pixels(12, 12, 0.6), 1),
      ]),
      U('sopa', 'Sopa de letras', 'Planeta Letras', '🔤', '#ff9d3d', [
        M('n1', 'Nivel 1 · 3 palabras', 'Animales y frutas · →', sopa(6, 3, 1, ['animales', 'frutas']), 2),
        M('n2', 'Nivel 2 · 4 palabras', 'Colores y números · →', sopa(7, 4, 1, ['colores', 'numeros']), 2),
        M('n3', 'Nivel 3 · 4 palabras', 'El cuerpo · → ↓', sopa(7, 4, 2, ['cuerpo', 'animales']), 2),
        M('n4', 'Nivel 4 · 5 palabras', 'Naturaleza · → ↓', sopa(8, 5, 2, ['ciencias', 'frutas']), 1),
        M('n5', 'Nivel 5 · 6 palabras', 'Con diagonales ↘', sopa(9, 6, 3, ['animales', 'cuerpo', 'ciencias']), 1),
        M('n6', 'Nivel 6 · 6 palabras', 'El espacio · ↘ ↗', sopa(10, 6, 4, ['espacio']), 1),
        M('n7', 'Nivel 7 · 8 palabras', 'Geometría · ¡al revés!', sopa(11, 8, 8, ['geometria']), 1),
        M('n8', 'Nivel 8 · 10 palabras', '¡Todas las direcciones!', sopa(12, 10, 8, ['animales', 'espacio', 'ciencias', 'frutas']), 1),
      ]),
    ],
  };
})();
