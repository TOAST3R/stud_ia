// More widgets for the Zona de juegos: falling blocks, 2048, lights out, Hanoi towers,
// secret code, nonograms (pixel pictures), word search and the sums snake.
// Same contract as widgets.js: widget(challenge, element, ctx) -> { check?, key? }
(function () {
  const S = window.StudIA, { R, sfx } = S, W = S.widgets;

  // on-screen buttons answer on pointerdown (fast on touch, never steal the keyboard focus)
  const pad = (node, fn) => node.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    e.preventDefault();
    fn(b.dataset.act);
  });
  // swipes on a board: 0 up · 1 right · 2 down · 3 left · -1 tap
  const swipe = (node, fn) => {
    let x0 = null, y0 = 0;
    node.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
    node.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return fn(-1, e);
      fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0, e);
    });
  };
  const ARROWS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3 };
  // a lost game: try again, or end the round once the attempts run out
  function lost(st, ctx, msg, restart) {
    st.attempts++;
    if (st.attempts >= ctx.maxAttempts) { st.over = true; return ctx.done({ first: false, solved: false }); }
    ctx.fail(msg);
    setTimeout(restart, 1300);
  }

  // ---------------------------------------------------------------
  // tetris: falling blocks. ch.lines to clear, ch.speed (ms per step), ch.garbage rows
  // ---------------------------------------------------------------
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  const TCOL = { I: '#3ec1ff', O: '#ffd23f', T: '#8b5cf6', S: '#2ed9a3', Z: '#ff4f5e', J: '#3d6bff', L: '#ff8a1f' };
  const rot = (m) => m[0].map((x, c) => m.map((row) => row[c]).reverse()); // clockwise
  W.tetris = function (ch, el, ctx) {
    const C = 10, H = ch.rows || 16, st = { attempts: 0, over: false };
    let board, cur, next, lines = 0, running = false, timer = 0, bag = [];
    el.innerHTML = `<div class="tetris">
        <div class="tboard" style="--c:${C}">${'<span class="tb"></span>'.repeat(C * H)}<div class="tstart"><button type="button" class="btn primary big" data-act="start">▶ Empezar</button></div></div>
        <div class="tside"><small>Siguiente</small><div class="tnext"></div><small>Líneas</small><b class="tlines"></b></div>
      </div>
      <div class="gpad tpad"><button type="button" data-act="left" aria-label="Izquierda">⬅️</button><button type="button" data-act="rot" aria-label="Girar">🔄</button><button type="button" data-act="right" aria-label="Derecha">➡️</button><button type="button" data-act="down" aria-label="Bajar">⬇️</button><button type="button" data-act="drop" aria-label="Soltar">⏬</button></div>`;
    const cells = [...el.querySelectorAll('.tb')], boardEl = el.querySelector('.tboard'), startEl = el.querySelector('.tstart');
    const fits = (m, r, c) => m.every((row, i) => row.every((v, j) => !v || (c + j >= 0 && c + j < C && r + i < H && (r + i < 0 || !board[r + i][c + j]))));
    const draw7 = () => { if (!bag.length) bag = R.shuffle(Object.keys(SHAPES)); return bag.pop(); };
    function spawn() {
      const k = next, m = SHAPES[k];
      next = draw7();
      cur = { k, m, c: Math.floor((C - m.length) / 2), r: -m.findIndex((row) => row.some(Boolean)) };
      if (!fits(cur.m, cur.r, cur.c)) gameOver();
    }
    function reset() {
      board = Array.from({ length: H }, () => Array(C).fill(0));
      for (let i = 0; i < (ch.garbage || 0); i++) {
        const hole = R.int(0, C - 1);
        board[H - 1 - i] = board[H - 1 - i].map((x, j) => (j === hole || Math.random() < 0.2 ? 0 : '#9aa3c7'));
      }
      lines = 0; bag = []; next = draw7(); st.over = false;
      spawn(); paint();
      startEl.hidden = false;
    }
    function paint() {
      const g = board.map((r) => r.slice());
      if (cur) {
        let gr = cur.r;
        while (fits(cur.m, gr + 1, cur.c)) gr++;
        cur.m.forEach((row, i) => row.forEach((v, j) => { if (v && gr + i >= 0 && !g[gr + i][cur.c + j]) g[gr + i][cur.c + j] = 'ghost'; }));
        cur.m.forEach((row, i) => row.forEach((v, j) => { if (v && cur.r + i >= 0) g[cur.r + i][cur.c + j] = TCOL[cur.k]; }));
      }
      cells.forEach((e, k) => {
        const v = g[Math.floor(k / C)][k % C];
        e.className = 'tb' + (v === 'ghost' ? ' ghost' : v ? ' on' : '');
        e.style.background = v && v !== 'ghost' ? v : '';
      });
      const nm = SHAPES[next];
      el.querySelector('.tnext').innerHTML = `<div style="--c:${nm.length}">${nm.flat().map((v) => `<i${v ? ` style="background:${TCOL[next]}"` : ''}></i>`).join('')}</div>`;
      el.querySelector('.tlines').textContent = `${lines} / ${ch.lines}`;
    }
    function move(dr, dc) {
      if (!fits(cur.m, cur.r + dr, cur.c + dc)) return false;
      cur.r += dr; cur.c += dc;
      return true;
    }
    function turn() {
      const m = rot(cur.m);
      for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.r, cur.c + k)) { cur.m = m; cur.c += k; return sfx.tap(); }
    }
    function lock() {
      if (cur.m.some((row, i) => row.some((v) => v && cur.r + i < 0))) return gameOver();
      cur.m.forEach((row, i) => row.forEach((v, j) => { if (v) board[cur.r + i][cur.c + j] = TCOL[cur.k]; }));
      const keep = board.filter((row) => !row.every(Boolean)), full = H - keep.length;
      if (full) {
        board = [...Array.from({ length: full }, () => Array(C).fill(0)), ...keep];
        lines += full;
        sfx.coin();
        boardEl.classList.remove('zap'); void boardEl.offsetWidth; boardEl.classList.add('zap');
      }
      if (lines >= ch.lines) {
        running = false; st.over = true; cur = null; paint();
        return ctx.done({ first: !st.attempts, solved: true });
      }
      spawn();
    }
    function gameOver() {
      running = false; clearTimeout(timer); cur = null;
      paint();
      lost(st, ctx, '¡Los bloques han llegado arriba! Prueba otra vez.', reset);
    }
    function tick() {
      if (!el.isConnected || !running) return;
      if (!move(1, 0)) lock();
      paint();
      if (running) timer = setTimeout(tick, ch.speed);
    }
    function start() {
      if (running || st.over || !cur) return;
      startEl.hidden = true; running = true;
      clearTimeout(timer);
      timer = setTimeout(tick, ch.speed);
    }
    function act(a) {
      if (a === 'start' || !running) return start();
      if (a === 'left') move(0, -1);
      else if (a === 'right') move(0, 1);
      else if (a === 'rot') turn();
      else if (a === 'down') { if (!move(1, 0)) lock(); }
      else if (a === 'drop') { while (move(1, 0)); lock(); }
      if (cur) paint();
    }
    pad(el, act);
    swipe(boardEl, (d, e) => { if (e.target.closest('[data-act]')) return; act(['rot', 'right', 'drop', 'left'][d] || 'rot'); });
    reset();
    ch._state = () => ({ board, cur, lines, running }); // lets the automated tests look inside
    return {
      key(e) {
        const a = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rot', ArrowDown: 'down', ' ': 'drop', Enter: 'start', x: 'rot', X: 'rot' }[e.key];
        if (!a || st.over) return false;
        act(running || a === 'start' || a === 'drop' ? a : 'start');
        return true;
      },
    };
  };

  // ---------------------------------------------------------------
  // g2048: slide and join equal tiles (2+2=4, 4+4=8…) up to ch.goal
  // ---------------------------------------------------------------
  const T2K = ['#eee4da', '#ede0c8', '#f2b179', '#f59563', '#f67c5f', '#f65e3b', '#edcf72', '#edcc61', '#edc850', '#edc53f', '#edc22e', '#3ec1ff'];
  W.g2048 = function (ch, el, ctx) {
    const n = ch.size || 4, st = { attempts: 0, over: false };
    let b = [], busy = false;
    el.innerHTML = `<p class="gmsg">Meta: <b>${ch.goal}</b> · Ficha más alta: <b class="hi">2</b></p>
      <div class="g2k" style="--n:${n}">${'<span></span>'.repeat(n * n)}</div>
      <div class="gpad"><span></span><button type="button" data-act="0" aria-label="Arriba">⬆️</button><span></span><button type="button" data-act="3" aria-label="Izquierda">⬅️</button><button type="button" data-act="2" aria-label="Abajo">⬇️</button><button type="button" data-act="1" aria-label="Derecha">➡️</button></div>`;
    const tiles = [...el.querySelectorAll('.g2k span')];
    const add = () => { const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (free.length) b[R.pick(free)] = Math.random() < 0.9 ? 2 : 4; return free.length; };
    function paint(born = -1, joined = []) {
      tiles.forEach((t, i) => {
        const v = b[i], lv = v ? Math.log2(v) - 1 : -1;
        t.textContent = v || '';
        t.className = (v ? 'on' : '') + (i === born ? ' born' : '') + (joined.includes(i) ? ' join' : '') + (v >= 100 ? ' small' : '') + (v >= 1000 ? ' tiny' : '');
        t.style.background = v ? T2K[Math.min(lv, T2K.length - 1)] : '';
        t.style.color = v > 4 ? '#fff' : '';
      });
      el.querySelector('.hi').textContent = Math.max(...b);
    }
    function reset() { b = Array(n * n).fill(0); add(); add(); busy = false; st.over = false; paint(); }
    function slide(d) {
      let moved = false;
      const joined = [];
      for (let k = 0; k < n; k++) {
        const idx = Array.from({ length: n }, (x, j) => (d === 3 ? k * n + j : d === 1 ? k * n + n - 1 - j : d === 0 ? j * n + k : (n - 1 - j) * n + k));
        const vals = idx.map((i) => b[i]).filter(Boolean), out = [];
        for (let j = 0; j < vals.length; j++) {
          if (vals[j] === vals[j + 1]) { joined.push(idx[out.length]); out.push(vals[j] * 2); j++; } else out.push(vals[j]);
        }
        while (out.length < n) out.push(0);
        idx.forEach((i, j) => { if (b[i] !== out[j]) moved = true; b[i] = out[j]; });
      }
      return moved ? joined : null;
    }
    const canMove = () => b.some((v, i) => !v || (i % n < n - 1 && v === b[i + 1]) || (i + n < n * n && v === b[i + n]));
    function go(d) {
      if (st.over || busy || d < 0) return;
      const joined = slide(d);
      if (!joined) return;
      joined.length ? sfx.coin() : sfx.tap();
      const before = b.slice();
      add();
      paint(b.findIndex((v, i) => v && !before[i]), joined);
      if (Math.max(...b) >= ch.goal) { st.over = true; return ctx.done({ first: !st.attempts, solved: true }); }
      if (!canMove()) { busy = true; lost(st, ctx, '¡No quedan movimientos! Empezamos otra vez.', reset); }
    }
    pad(el, (a) => go(+a));
    swipe(el.querySelector('.g2k'), (d) => go(d));
    reset();
    ch._board = () => b; // lets the automated tests play
    return { key(e) { const d = ARROWS[e.key]; if (d === undefined) return false; go(d); return true; } };
  };

  // ---------------------------------------------------------------
  // lights: lights out. A press switches the light and its neighbours.
  //   ch.size, ch.presses (the puzzle is made with that many presses: always solvable)
  // ---------------------------------------------------------------
  W.lights = function (ch, el, ctx) {
    const n = ch.size, limit = ch.presses * 2 + 2;
    const tog = (a, i) => {
      const r = Math.floor(i / n), c = i % n;
      [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => { if (r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n) a[(r + dr) * n + c + dc] ^= 1; });
    };
    let on, presses = 0, over = false, plan;
    do {
      on = Array(n * n).fill(0);
      plan = R.sample([...Array(n * n).keys()], ch.presses);
      plan.forEach((i) => tog(on, i));
    } while (!on.some(Boolean));
    const start = on.slice();
    ch._plan = plan; // lets the automated tests play
    el.innerHTML = `<p class="gmsg">Pulsaciones: <b class="np">0</b> · ¡Se puede en ${ch.presses}!</p>
      <div class="lights" style="--n:${n}">${on.map((x, i) => `<button type="button" class="lt" data-i="${i}" aria-label="Luz ${i + 1}"></button>`).join('')}</div>
      <p class="center"><button type="button" class="btn ghost lreset">↺ Empezar de nuevo</button></p>`;
    const bs = [...el.querySelectorAll('.lt')];
    const paint = () => { bs.forEach((x, i) => x.classList.toggle('on', !!on[i])); el.querySelector('.np').textContent = presses; };
    el.addEventListener('click', (e) => {
      if (over) return;
      if (e.target.closest('.lreset')) { on = start.slice(); presses = 0; sfx.tap(); return paint(); }
      const x = e.target.closest('.lt');
      if (!x) return;
      tog(on, +x.dataset.i); presses++; sfx.note(on[+x.dataset.i] ? 4 : 1); paint();
      if (!on.some(Boolean)) { over = true; el.querySelector('.lights').classList.add('dark'); ctx.done({ first: presses <= limit, solved: true }); }
    });
    paint();
    return {};
  };

  // ---------------------------------------------------------------
  // hanoi: move the tower from the first peg to the last. ch.discs
  // ---------------------------------------------------------------
  const DISC = ['#ff4f5e', '#ff8a1f', '#ffd23f', '#2ed9a3', '#3ec1ff', '#8b5cf6', '#ff4f8b'];
  W.hanoi = function (ch, el, ctx) {
    const n = ch.discs, best = 2 ** n - 1, t = [Array.from({ length: n }, (x, i) => n - i), [], []];
    let sel = -1, moves = 0, over = false;
    el.innerHTML = `<p class="gmsg">Movimientos: <b class="hm">0</b> · El mínimo posible es ${best}</p>
      <div class="hanoi">${[0, 1, 2].map((p) => `<button type="button" class="peg" data-p="${p}" aria-label="Torre ${p + 1}"><span class="rod"></span><span class="stack"></span><span class="base">${p === 2 ? '🏁' : p + 1}</span></button>`).join('')}</div>`;
    const pegs = [...el.querySelectorAll('.peg')];
    const paint = () => {
      pegs.forEach((p, i) => {
        p.classList.toggle('sel', i === sel);
        p.querySelector('.stack').innerHTML = t[i].map((d, k) => `<i class="${i === sel && k === t[i].length - 1 ? 'up' : ''}" style="width:${28 + (d / n) * 68}%;background:${DISC[(d - 1) % DISC.length]}"></i>`).join('');
      });
      el.querySelector('.hm').textContent = moves;
    };
    function pick(i) {
      if (over) return;
      if (sel < 0) { if (t[i].length) { sel = i; sfx.tap(); } return paint(); }
      if (i === sel) { sel = -1; return paint(); }
      const d = t[sel][t[sel].length - 1], top = t[i][t[i].length - 1];
      if (top && top < d) { sfx.bad(); ctx.say('Un disco grande no puede ir encima de uno más pequeño.'); return; }
      t[i].push(t[sel].pop()); sel = -1; moves++; sfx.note(d - 1); paint();
      if (t[2].length === n) { over = true; ctx.done({ first: moves <= Math.ceil(best * 1.5), solved: true }); }
    }
    el.addEventListener('click', (e) => { const p = e.target.closest('.peg'); if (p) pick(+p.dataset.p); });
    paint();
    ch._towers = t; // lets the automated tests play
    return { key(e) { const i = ['1', '2', '3'].indexOf(e.key); if (i < 0) return false; pick(i); return true; } };
  };

  // ---------------------------------------------------------------
  // code: find the secret code of colours (like Mastermind).
  //   ch.slots, ch.colors, ch.tries, ch.repeat (colours may repeat)
  //   ch.exact: each ball says if it is right (green), elsewhere (yellow) or not there;
  //   otherwise only counts: ⚫ right colour and place · ⚪ right colour, other place
  // ---------------------------------------------------------------
  const BALLS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];
  W.code = function (ch, el, ctx) {
    const pal = BALLS.slice(0, ch.colors);
    const secret = ch.repeat ? Array.from({ length: ch.slots }, () => R.int(0, ch.colors - 1)) : R.sample([...Array(ch.colors).keys()], ch.slots);
    let guess = [], hist = [], over = false;
    ch._secret = secret; // lets the automated tests play
    const marks = (g) => {
      const left = {};
      secret.forEach((v, i) => { if (g[i] !== v) left[v] = (left[v] || 0) + 1; });
      return g.map((v, i) => (v === secret[i] ? 'ok' : left[v] ? (left[v]--, 'near') : 'no'));
    };
    const row = (g, m) => {
      const balls = g.map((v, i) => `<span class="cball ${ch.exact && m ? m[i] : ''}">${pal[v]}</span>`).join('');
      if (!m || ch.exact) return `<div class="crow">${balls}</div>`;
      const ok = m.filter((x) => x === 'ok').length, near = m.filter((x) => x === 'near').length;
      return `<div class="crow">${balls}<span class="pegs">${'<i class="b"></i>'.repeat(ok)}${'<i class="w"></i>'.repeat(near)}${'<i></i>'.repeat(ch.slots - ok - near)}</span></div>`;
    };
    function paint(msg) {
      el.innerHTML = `<div class="code">
          ${hist.map(([g, m]) => row(g, m)).join('')}
          ${over ? '' : `<div class="crow now">${Array.from({ length: ch.slots }, (x, i) => `<button type="button" class="cball slot" data-s="${i}">${guess[i] !== undefined ? pal[guess[i]] : ''}</button>`).join('')}</div>`}
        </div>
        <p class="gmsg">${msg || `Intento ${hist.length + 1} de ${ch.tries}`}</p>
        ${over ? '' : `<div class="cpal">${pal.map((p, i) => `<button type="button" data-c="${i}">${p}</button>`).join('')}</div>`}
        <p class="clegend">${ch.exact ? '<span class="cball ok">🟢</span> en su sitio · <span class="cball near">🟡</span> está, pero en otro sitio · <span class="cball no">⚪</span> no está'
          : '<i class="b"></i> color y sitio correctos · <i class="w"></i> color correcto en otro sitio'}${ch.repeat ? ' · ¡Los colores se pueden repetir!' : ' · No se repiten colores.'}</p>`;
      ctx.ready(!over && guess.length === ch.slots);
    }
    function add(c) { if (over || guess.length >= ch.slots) return; guess.push(c); sfx.note(c); paint(); }
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]'), s = e.target.closest('.slot');
      if (c) add(+c.dataset.c);
      else if (s && guess[+s.dataset.s] !== undefined) { guess.splice(+s.dataset.s, 1); sfx.tap(); paint(); }
    });
    paint();
    return {
      check() {
        if (over || guess.length < ch.slots) return;
        const m = marks(guess);
        hist.push([guess, m]); guess = [];
        if (m.every((x) => x === 'ok')) { over = true; paint(`¡Código descubierto en ${hist.length} ${hist.length === 1 ? 'intento' : 'intentos'}!`); return ctx.done({ first: true, solved: true }); }
        if (hist.length >= ch.tries) { over = true; paint(`El código era: ${secret.map((v) => pal[v]).join(' ')}`); return ctx.done({ first: false, solved: false }); }
        sfx.tap(); paint();
      },
      key(e) {
        const k = +e.key;
        if (k >= 1 && k <= ch.colors) { add(k - 1); return true; }
        if (e.key === 'Backspace' && guess.length) { guess.pop(); paint(); return true; }
        return false;
      },
    };
  };

  // ---------------------------------------------------------------
  // nono: nonogram. The numbers say how many squares in a row are painted.
  //   ch.grid (booleans), ch.name (what the picture is, if it is one)
  // ---------------------------------------------------------------
  const runs = (line) => { const out = []; let k = 0; line.forEach((v) => { if (v) k++; else if (k) { out.push(k); k = 0; } }); if (k) out.push(k); return out; };
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  W.nono = function (ch, el, ctx) {
    const sol = ch.grid, rows = sol.length, cols = sol[0].length;
    const rc = sol.map(runs), cc = sol[0].map((x, j) => runs(sol.map((r) => r[j])));
    const st = sol.map((r) => r.map(() => 0)); // 0 empty · 1 painted · 2 marked with ✕
    let mode = 1, over = false;
    el.innerHTML = `<div class="nmodes"><button type="button" class="on" data-mode="1">✏️ Pintar</button><button type="button" data-mode="2">✕ Marcar vacía</button></div>
      <div class="nono" style="--cols:${cols};--rows:${rows}">
        <span class="ncorner"></span>${cc.map((c, j) => `<span class="nclue col" data-cc="${j}">${(c.length ? c : [0]).map((v) => `<b>${v}</b>`).join('')}</span>`).join('')}
        ${sol.map((r, i) => `<span class="nclue row" data-rc="${i}">${(rc[i].length ? rc[i] : [0]).map((v) => `<b>${v}</b>`).join('')}</span>${r.map((x, j) => `<button type="button" class="nc${(j + 1) % 5 === 0 && j < cols - 1 ? ' vr' : ''}${(i + 1) % 5 === 0 && i < rows - 1 ? ' hr' : ''}" data-r="${i}" data-c="${j}"></button>`).join('')}`).join('')}
      </div>`;
    const cellOf = (i, j) => el.querySelector(`.nc[data-r="${i}"][data-c="${j}"]`);
    function check() {
      let all = true;
      rc.forEach((want, i) => { const ok = same(runs(st[i].map((v) => v === 1)), want); el.querySelector(`[data-rc="${i}"]`).classList.toggle('ok', ok); all = all && ok; });
      cc.forEach((want, j) => { const ok = same(runs(st.map((r) => r[j] === 1)), want); el.querySelector(`[data-cc="${j}"]`).classList.toggle('ok', ok); all = all && ok; });
      if (all) {
        over = true;
        el.querySelector('.nono').classList.add('solved');
        ctx.done({ first: true, solved: true });
      }
    }
    function set(i, j, v) {
      st[i][j] = v;
      const c = cellOf(i, j);
      c.classList.toggle('fill', v === 1); c.classList.toggle('x', v === 2);
    }
    // paint by tapping or by dragging over the squares
    let painting = null;
    const grid = el.querySelector('.nono');
    grid.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.nc');
      if (!c || over) return;
      e.preventDefault();
      const i = +c.dataset.r, j = +c.dataset.c;
      painting = st[i][j] === mode ? 0 : mode;
      set(i, j, painting); sfx.tap(); check();
    });
    grid.addEventListener('pointermove', (e) => {
      if (painting === null || over) return;
      const c = document.elementFromPoint(e.clientX, e.clientY);
      const nc = c && c.closest && c.closest('.nc');
      if (!nc || !grid.contains(nc)) return;
      const i = +nc.dataset.r, j = +nc.dataset.c;
      if (st[i][j] !== painting) { set(i, j, painting); check(); }
    });
    const stop = () => (painting = null);
    grid.addEventListener('pointerup', stop);
    grid.addEventListener('pointerleave', stop);
    el.querySelector('.nmodes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      mode = +b.dataset.mode;
      el.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
    });
    check();
    return {};
  };

  // ---------------------------------------------------------------
  // sopa: word search. ch.words [[word, emoji]], ch.size, ch.dirs (1 → only left to right,
  // 2 + downwards, 3 + diagonal, 8 every direction, also backwards)
  // Tap the first letter and then the last one (or drag from one to the other).
  // ---------------------------------------------------------------
  const DIRS8 = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  const FILL = 'AAABCDEEEFGHIIJLLMNNOOOPRRSSTTUUVZ';
  const upper = (w) => w.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ');
  W.sopa = function (ch, el, ctx) {
    const n = ch.size, dirs = DIRS8.slice(0, ch.dirs);
    let grid, placed;
    for (let tryAll = 0; tryAll < 40; tryAll++) {
      grid = Array(n * n).fill(''); placed = [];
      const words = ch.words.map(([w, e]) => ({ w: upper(w), show: w, e })).sort((a, b) => b.w.length - a.w.length);
      for (const wd of words) {
        for (let k = 0; k < 300; k++) {
          const [dr, dc] = R.pick(dirs), r = R.int(0, n - 1), c = R.int(0, n - 1);
          const er = r + dr * (wd.w.length - 1), ec = c + dc * (wd.w.length - 1);
          if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
          const path = [...wd.w].map((x, i) => (r + dr * i) * n + c + dc * i);
          if (!path.every((p, i) => !grid[p] || grid[p] === wd.w[i])) continue;
          path.forEach((p, i) => (grid[p] = wd.w[i]));
          placed.push(Object.assign(wd, { path }));
          break;
        }
      }
      if (placed.length === words.length) break;
    }
    grid = grid.map((x) => x || R.pick([...FILL]));
    ch._placed = placed; // lets the automated tests play
    const found = new Set();
    let sel = -1, mistakes = 0, over = false, dragging = false;
    el.innerHTML = `<div class="swords">${placed.map((p, k) => `<span data-w="${k}">${p.e ? `${p.e} ` : ''}${p.show.toUpperCase()}</span>`).join('')}</div>
      <div class="sopa" style="--n:${n}">${grid.map((x, i) => `<span class="sl" data-i="${i}">${x}</span>`).join('')}</div>
      <p class="gmsg sfound">Encontradas: <b>0</b> de ${placed.length}</p>`;
    const cells = [...el.querySelectorAll('.sl')], box = el.querySelector('.sopa');
    const line = (a, b) => {
      const ar = Math.floor(a / n), ac = a % n, br = Math.floor(b / n), bc = b % n, dr = br - ar, dc = bc - ac;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
      const len = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc);
      return Array.from({ length: len + 1 }, (x, i) => (ar + sr * i) * n + ac + sc * i);
    };
    const hue = (k) => (k * 67) % 360;
    function paint(hover = null) {
      cells.forEach((c) => { c.classList.remove('sel', 'spath'); c.style.background = ''; });
      placed.forEach((p, k) => { if (found.has(k)) p.path.forEach((i) => (cells[i].style.background = `hsl(${hue(k)} 85% 75%)`)); });
      if (sel >= 0) cells[sel].classList.add('sel');
      if (hover) hover.forEach((i) => cells[i].classList.add('spath'));
    }
    function tryPick(a, b) {
      const path = line(a, b);
      const k = path ? placed.findIndex((p, k2) => !found.has(k2) && (same(p.path, path) || same(p.path, path.slice().reverse()))) : -1;
      if (k < 0) {
        mistakes++; sfx.bad();
        box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
        return paint();
      }
      found.add(k); sfx.ok();
      el.querySelector(`[data-w="${k}"]`).classList.add('got');
      el.querySelector('.sfound b').textContent = found.size;
      paint();
      if (found.size === placed.length) { over = true; ctx.done({ first: mistakes < 3, solved: true }); }
    }
    const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest && t.closest('.sl') && box.contains(t) ? +t.closest('.sl').dataset.i : -1; };
    box.addEventListener('pointerdown', (e) => {
      if (over) return;
      const i = at(e);
      if (i < 0) return;
      e.preventDefault();
      if (sel < 0) { sel = i; dragging = true; sfx.tap(); return paint(); }
      const a = sel;
      sel = -1;
      if (a !== i) tryPick(a, i); else paint();
    });
    box.addEventListener('pointermove', (e) => {
      if (!dragging || sel < 0) return;
      const i = at(e);
      if (i >= 0) paint(line(sel, i));
    });
    box.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      const i = at(e);
      if (sel >= 0 && i >= 0 && i !== sel) { const a = sel; sel = -1; tryPick(a, i); }
    });
    paint();
    return {};
  };

  // ---------------------------------------------------------------
  // snake: eat the number that answers the question.
  //   ch.ask() -> { q, a, wrong: [numbers] }, ch.goal (answers to win), ch.speed (ms), ch.wrap
  // ---------------------------------------------------------------
  W.snake = function (ch, el, ctx) {
    const n = 11, st = { attempts: 0, over: false }, DIR = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    let body, dir, turnTo, q, tokens, got, lives, running = false, timer = 0;
    el.innerHTML = `<div class="snhead"><span class="snlives"></span><b class="snq"></b><span class="sngot"></span></div>
      <div class="snake" style="--n:${n}">${'<span></span>'.repeat(n * n)}<div class="tstart"><button type="button" class="btn primary big" data-act="start">▶ Empezar</button></div></div>
      <div class="gpad"><span></span><button type="button" data-act="0" aria-label="Arriba">⬆️</button><span></span><button type="button" data-act="3" aria-label="Izquierda">⬅️</button><button type="button" data-act="2" aria-label="Abajo">⬇️</button><button type="button" data-act="1" aria-label="Derecha">➡️</button></div>`;
    const cells = [...el.querySelectorAll('.snake > span')], startEl = el.querySelector('.tstart'), boardEl = el.querySelector('.snake');
    const mid = Math.floor(n / 2);
    function place() {
      const busy = new Set(body), [hr, hc] = [Math.floor(body[0] / n), body[0] % n];
      const free = [...Array(n * n).keys()].filter((i) => !busy.has(i) && Math.abs(Math.floor(i / n) - hr) + Math.abs((i % n) - hc) > 2);
      const spots = R.sample(free, 1 + q.wrong.length);
      tokens = spots.map((i, k) => ({ i, v: k ? q.wrong[k - 1] : q.a, ok: !k }));
    }
    function ask() { q = ch.ask(); place(); }
    function home() { body = [mid * n + 2, mid * n + 1, mid * n]; dir = 1; turnTo = 1; } // left edge, heading right
    function reset() { home(); got = 0; lives = 3; st.over = false; ask(); paint(); startEl.hidden = false; }
    function paint() {
      const sn = new Set(body);
      cells.forEach((c, i) => {
        const tk = tokens.find((t) => t.i === i);
        c.className = i === body[0] ? 'sh' : sn.has(i) ? 'sb' : tk ? 'tok' : '';
        c.textContent = i === body[0] ? '👀' : tk && !sn.has(i) ? tk.v : '';
      });
      el.querySelector('.snq').textContent = q.q;
      el.querySelector('.snlives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives);
      el.querySelector('.sngot').textContent = `✔ ${got} / ${ch.goal}`;
    }
    function hurt(msg) {
      lives--;
      sfx.bad();
      boardEl.classList.remove('bump'); void boardEl.offsetWidth; boardEl.classList.add('bump');
      if (lives <= 0) { running = false; paint(); return lost(st, ctx, 'Te has quedado sin vidas. ¡Otra vez!', reset); }
      ctx.say(msg);
      return true;
    }
    function tick() {
      if (!el.isConnected || !running) return;
      if ((turnTo + 2) % 4 !== dir) dir = turnTo;
      let r = Math.floor(body[0] / n) + DIR[dir][0], c = (body[0] % n) + DIR[dir][1];
      if (ch.wrap) { r = (r + n) % n; c = (c + n) % n; }
      const head = r * n + c;
      if (r < 0 || r >= n || c < 0 || c >= n || body.slice(0, -1).includes(head)) {
        if (hurt('¡Cuidado con chocar! Vuelves a empezar desde la izquierda.') === true) { home(); paint(); running = false; startEl.hidden = false; }
        return;
      }
      body.unshift(head);
      const tk = tokens.find((t) => t.i === head);
      if (tk && tk.ok) {
        got++; sfx.ok();
        if (got >= ch.goal) { running = false; st.over = true; paint(); return ctx.done({ first: !st.attempts, solved: true }); }
        ask();
      } else {
        body.pop();
        if (tk) {
          tokens = tokens.filter((t) => t !== tk);
          if (hurt(`¡Ese no! ${q.q.replace('?', '').replace('¿', '')} → ${q.a}`) !== true) return paint();
        }
      }
      paint();
      timer = setTimeout(tick, ch.speed);
    }
    function start() {
      if (running || st.over || lives <= 0) return;
      startEl.hidden = true; running = true;
      clearTimeout(timer);
      timer = setTimeout(tick, ch.speed);
    }
    const steer = (d) => { if (st.over) return; if (!running) return start(); turnTo = d; };
    pad(el, (a) => (a === 'start' ? start() : steer(+a)));
    swipe(boardEl, (d, e) => { if (!e.target.closest('[data-act]') && d >= 0) steer(d); });
    reset();
    ch._state = () => ({ body, tokens, q, got, lives, running }); // lets the automated tests look inside
    return {
      key(e) {
        if (st.over) return false;
        if (e.key === 'Enter' || e.key === ' ') { start(); return true; }
        const d = ARROWS[e.key];
        if (d === undefined) return false;
        steer(d);
        return true;
      },
    };
  };
})();
