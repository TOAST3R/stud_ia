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

  const M = (id, title, desc, gen, rounds) => ({ id, title, desc, gen, rounds: rounds || 3 });
  const U = (id, title, planet, emoji, color, missions) => ({ id, title, planet, emoji, color, section: 'juegos', missions });
  S.subjects.juegos = {
    id: 'juegos', title: 'Zona de juegos', emoji: '🎮', tagline: 'Sudokus, memoria, laberintos, Simón, tres en raya y puzzles',
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
    ],
  };
})();
