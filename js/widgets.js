// Answer widgets. Each one is: widget(challenge, element, ctx) -> { check?, key? }
// ctx = { maxAttempts, ready(bool), say(msg), fail(msg), done({ first, solved }) }
(function () {
  const S = window.StudIA, { fmt, sfx } = S;
  const W = S.widgets;

  // ---------------------------------------------------------------
  // cells: number boxes filled with an on-screen keypad.
  //   ch.html   template with {{0}}, {{1}}… where the boxes go
  //   ch.cells  [{ ans, stage }] or [{ set: 'name', stage }]
  //   ch.sets   { name: [values] } boxes of a set accept its values in any order
  //   ch.decimals  adds a decimal-comma key (answers may be decimals)
  //   ch.validate(values) → bool: for questions with many right answers
  //              (single stage; cells[i].ans is one valid solution, shown if wrong)
  // Stages are solved one after another (e.g. row by row).
  // ---------------------------------------------------------------
  W.cells = function (ch, el, ctx) {
    const n = ch.cells.length;
    const vals = Array(n).fill('');
    const status = Array(n).fill(''); // '', 'ok', 'wrong', 'shown'
    const stageOf = (i) => ch.cells[i].stage || 0;
    const lastStage = Math.max(...ch.cells.map((c) => c.stage || 0));
    const lenOf = (c) => String(c.set ? Math.max(...ch.sets[c.set]) : c.ans).length;
    const num = (v) => Number(String(v).replace(',', '.'));
    const disp = (v) => {
      if (v === '') return '';
      const [a, b] = String(v).replace('.', ',').split(',');
      return fmt(Number(a || 0)) + (b !== undefined ? ',' + b : '');
    };
    const KEYS = ch.decimals
      ? ['1', '2', '3', '4', '5', ',', 'del', '6', '7', '8', '9', '0', 'next']
      : ['1', '2', '3', '4', '5', 'del', '6', '7', '8', '9', '0', 'next'];
    let stage = 0, attempts = 0, mistakes = 0, revealed = false, finished = false, active = -1;

    el.innerHTML =
      `<div class="cells-body">${ch.html.replace(/\{\{(\d+)\}\}/g, (m, i) =>
        `<button type="button" class="cell" data-i="${i}" style="--len:${lenOf(ch.cells[i])}"></button>`)}</div>
      <div class="numpad${ch.decimals ? ' dec' : ''}">${KEYS.map((k) =>
        `<button type="button" class="key${k.length > 1 ? ' fn' : ''}" data-k="${k}">${k === 'del' ? '⌫' : k === 'next' ? '➜' : k}</button>`).join('')}</div>`;
    const cellEls = [];
    el.querySelectorAll('.cell').forEach((b) => (cellEls[+b.dataset.i] = b));

    const isLocked = (i) => status[i] === 'ok' || status[i] === 'shown';
    const open = () => ch.cells.map((c, i) => i).filter((i) => stageOf(i) === stage && !isLocked(i));
    const isReady = () => !finished && open().length > 0 && open().every((i) => vals[i] !== '');

    function paint() {
      cellEls.forEach((b, i) => {
        b.textContent = disp(vals[i]);
        b.className = 'cell ' + status[i] + (i === active ? ' active' : '') + (stageOf(i) > stage ? ' future' : '');
        b.disabled = finished || isLocked(i) || stageOf(i) !== stage;
      });
      ctx.ready(isReady());
    }
    function focusFirst() {
      const o = open();
      active = o.length ? (o.find((i) => vals[i] === '') ?? o[0]) : -1;
    }
    function move() {
      const o = open();
      if (!o.length) return;
      const later = o.filter((i) => i > active);
      active = later.length ? later[0] : o[0];
      paint();
    }
    function press(k) {
      if (finished) return;
      if (k === 'next') return move();
      if (active < 0) return;
      if (k === 'del') vals[active] = vals[active].slice(0, -1);
      else if (k === ',') {
        if (!ch.decimals || vals[active].includes(',')) return;
        vals[active] = (vals[active] || '0') + ',';
      } else if (vals[active] === '0') vals[active] = k;
      else if (vals[active].length < 10) vals[active] += k;
      if (status[active] === 'wrong') status[active] = '';
      sfx.tap();
      paint();
    }
    function advance() {
      attempts = 0;
      if (stage === lastStage) {
        finished = true;
        active = -1;
        el.querySelector('.numpad').hidden = true;
        paint();
        ctx.done({ first: mistakes === 0, solved: !revealed });
      } else {
        stage++;
        focusFirst();
        paint();
      }
    }
    function check() {
      if (!isReady()) return;
      const remaining = {};
      Object.keys(ch.sets || {}).forEach((name) => {
        remaining[name] = ch.sets[name].slice();
        ch.cells.forEach((c, i) => {
          if (c.set === name && isLocked(i)) remaining[name].splice(remaining[name].indexOf(Number(vals[i])), 1);
        });
      });
      const wrong = [];
      if (ch.validate) {
        // many right answers: all boxes are right or all are wrong
        if (ch.validate(vals.map(num))) open().forEach((i) => (status[i] = 'ok'));
        else wrong.push(...open());
      } else open().forEach((i) => {
        const c = ch.cells[i], v = num(vals[i]);
        let ok;
        if (c.set) {
          const p = remaining[c.set].indexOf(v);
          ok = p >= 0;
          if (ok) remaining[c.set].splice(p, 1);
        } else ok = Math.abs(v - c.ans) < 1e-9;
        if (ok) status[i] = 'ok';
        else wrong.push(i);
      });
      if (!wrong.length) {
        if (stage < lastStage) sfx.ok();
        return advance();
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        revealed = true;
        wrong.forEach((i) => {
          const c = ch.cells[i];
          vals[i] = String(c.set ? remaining[c.set].shift() : c.ans);
          status[i] = 'shown';
        });
        if (stage < lastStage) ctx.say('Te enseño esta parte en azul. ¡Sigue con la siguiente!');
        advance();
      } else {
        wrong.forEach((i) => (status[i] = 'wrong'));
        active = wrong[0];
        paint();
        ctx.fail(wrong.length === 1 ? 'Hay una casilla que no está bien. ¡Revísala!' : `Hay ${wrong.length} casillas que no están bien. ¡Revísalas!`);
      }
    }

    el.addEventListener('click', (e) => {
      const c = e.target.closest('.cell'), k = e.target.closest('.key');
      if (c && !c.disabled) { active = +c.dataset.i; paint(); }
      if (k) press(k.dataset.k);
    });
    focusFirst();
    paint();
    return {
      check,
      key(e) {
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === ',' || e.key === '.') press(',');
        else if (e.key === 'Backspace') press('del');
        else if (e.key === 'Tab' || e.key === 'ArrowRight' || (e.key === 'Enter' && !isReady())) press('next');
        else return false;
        return true;
      },
    };
  };

  // ---------------------------------------------------------------
  // choice: tap one option. ch.options [{ label, correct }]
  //   ch.scene   optional picture shown above the options
  //   ch.layout  'line' a number line split in zones (the options);
  //                     ch.ticks are its labels (default 0, 1000 … 10 000)
  //              'big'  large picture tiles (for little ones)
  // With more than 2 options a wrong tap can be retried (not in exams).
  // ---------------------------------------------------------------
  W.choice = function (ch, el, ctx) {
    let over = false, misses = 0;
    const retry = ctx.maxAttempts > 1 && ch.options.length > 2;
    const scene = ch.scene ? `<div class="scene">${ch.scene}</div>` : '';
    if (ch.layout === 'line') {
      const ticks = ch.ticks || Array.from({ length: ch.options.length + 1 }, (x, i) => fmt(i * 1000));
      el.innerHTML = scene + `<div class="zline">
        <div class="zticks">${ticks.map((t, i) => `<span style="left:${(i * 100) / (ticks.length - 1)}%">${t}</span>`).join('')}</div>
        <div class="zbar">${ch.options.map((o, i) => `<button type="button" class="choice zone" data-i="${i}">${o.label}</button>`).join('')}</div>
      </div>`;
    } else {
      el.innerHTML = scene + `<div class="choices${ch.layout ? ' ' + ch.layout : ''}">${ch.options.map((o, i) =>
        `<button type="button" class="choice" data-i="${i}">${o.label}</button>`).join('')}</div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.choice');
      if (!b || b.disabled || over) return;
      const ok = !!ch.options[+b.dataset.i].correct;
      if (!ok && retry && misses + 1 < ctx.maxAttempts) {
        misses++;
        b.classList.add('wrong');
        b.disabled = true;
        return ctx.fail('¡Casi! Prueba otra vez.');
      }
      over = true;
      el.querySelectorAll('.choice').forEach((x) => {
        x.disabled = true;
        if (ch.options[+x.dataset.i].correct) x.classList.add('ok');
      });
      if (!ok) b.classList.add('wrong');
      ctx.done({ first: ok && !misses, solved: ok });
    });
    return {};
  };

  // ---------------------------------------------------------------
  // paint: tap the right numbers on a board.
  //   ch.board { to, width } (numbers 1…to) or { values: [..], width }
  //   ch.targets [numbers]
  // ---------------------------------------------------------------
  W.paint = function (ch, el, ctx) {
    const targets = new Set(ch.targets), picked = new Set();
    const values = ch.board.values || Array.from({ length: ch.board.to }, (x, i) => i + 1);
    let attempts = 0, mistakes = 0, over = false;
    let html = `<div class="board" style="grid-template-columns:repeat(${ch.board.width},minmax(0,1fr));max-width:${ch.board.width * 46}px">`;
    values.forEach((v) => (html += `<button type="button" class="sq" data-v="${v}">${v}</button>`));
    el.innerHTML = html + '</div>';
    const sq = (v) => el.querySelector(`.sq[data-v="${v}"]`);

    el.addEventListener('click', (e) => {
      const b = e.target.closest('.sq');
      if (!b || over) return;
      const v = +b.dataset.v;
      picked.has(v) ? picked.delete(v) : picked.add(v);
      b.classList.toggle('on', picked.has(v));
      b.classList.remove('wrong');
      sfx.tap();
      ctx.ready(picked.size > 0);
    });
    function check() {
      if (over || !picked.size) return;
      const missing = [...targets].filter((v) => !picked.has(v));
      const extra = [...picked].filter((v) => !targets.has(v));
      if (!missing.length && !extra.length) {
        over = true;
        targets.forEach((v) => sq(v).classList.add('ok'));
        return ctx.done({ first: mistakes === 0, solved: true });
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        over = true;
        extra.forEach((v) => sq(v).classList.add('wrong'));
        targets.forEach((v) => sq(v).classList.add(picked.has(v) ? 'ok' : 'shown'));
        return ctx.done({ first: false, solved: false });
      }
      const parts = [];
      if (missing.length) parts.push(missing.length === 1 ? 'te falta 1 número' : `te faltan ${missing.length} números`);
      if (extra.length) parts.push(extra.length === 1 ? 'te sobra 1' : `te sobran ${extra.length}`);
      ctx.fail('Casi: ' + parts.join(' y ') + '.');
    }
    ctx.ready(false);
    return { check };
  };

  // ---------------------------------------------------------------
  // cards: place digit cards (each used once) into the slots.
  //   ch.digits [1..6]  ch.slots [3,'+',3]  ch.goal { kind, target }
  //   ch.bestScore  ch.bestArr (one best arrangement)
  // ---------------------------------------------------------------
  W.cards = function (ch, el, ctx) {
    const total = ch.slots.filter((t) => typeof t === 'number').reduce((a, b) => a + b, 0);
    const placed = Array(total).fill(null); // digit in each slot
    let attempts = 0, mistakes = 0, over = false;

    function paint() {
      let k = 0;
      const slotsHtml = ch.slots.map((t) => {
        if (typeof t !== 'number') return `<span class="cop">${t === '-' ? '−' : t}</span>`;
        let g = '<span class="cgroup">';
        for (let j = 0; j < t; j++, k++) {
          g += placed[k] === null
            ? `<span class="slot"></span>`
            : `<button type="button" class="tcard in" data-slot="${k}"${over ? ' disabled' : ''}>${placed[k]}</button>`;
        }
        return g + '</span>';
      }).join('');
      const tray = ch.digits.map((d) =>
        `<button type="button" class="tcard" data-d="${d}"${placed.includes(d) || over ? ' disabled' : ''}>${d}</button>`).join('');
      el.innerHTML = `<div class="cslots">${slotsHtml}</div><div class="ctray">${tray}</div>`;
      ctx.ready(!over && !placed.includes(null));
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.tcard');
      if (!b || b.disabled || over) return;
      if (b.dataset.slot !== undefined) placed[+b.dataset.slot] = null;
      else {
        const free = placed.indexOf(null);
        if (free < 0) return;
        placed[free] = +b.dataset.d;
      }
      sfx.tap();
      paint();
    });
    function check() {
      if (over || placed.includes(null)) return;
      const v = S.cardsValue(ch.slots, placed);
      if (S.cardsScore(ch.goal, v) === ch.bestScore) {
        over = true;
        paint();
        el.querySelector('.cslots').classList.add('ok');
        return ctx.done({ first: mistakes === 0, solved: true });
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        over = true;
        ch.bestArr.forEach((d, i) => (placed[i] = d));
        paint();
        el.querySelector('.cslots').classList.add('shown');
        return ctx.done({ first: false, solved: false });
      }
      const more = v < 0 ? 'No vale un resultado negativo.'
        : ch.goal.kind === 'max' ? '¡Se puede conseguir más!'
        : ch.goal.kind === 'min' ? '¡Se puede conseguir menos!' : '¡Se puede acercar más!';
      ctx.fail(`Te sale ${fmt(v)}. ${more}`);
    }
    paint();
    return { check };
  };

  // ---------------------------------------------------------------
  // pick: tap exactly ch.count of the ch.items, or, with ch.targets [indexes],
  // exactly those items (sorting: "toca todos los que vuelan").
  // ---------------------------------------------------------------
  W.pick = function (ch, el, ctx) {
    const picked = new Set();
    let attempts = 0, mistakes = 0, over = false;
    el.innerHTML = `<div class="pickgrid">${ch.items.map((h, i) =>
      `<button type="button" class="pk" data-i="${i}">${h}</button>`).join('')}</div>`;
    const pks = [...el.querySelectorAll('.pk')];
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.pk');
      if (!b || over) return;
      const i = +b.dataset.i;
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.classList.toggle('on', picked.has(i));
      sfx.tap();
      ctx.ready(picked.size > 0);
    });
    function check() {
      if (over || !picked.size) return;
      const targets = ch.targets && new Set(ch.targets);
      const right = targets ? picked.size === targets.size && [...picked].every((i) => targets.has(i)) : picked.size === ch.count;
      if (right) {
        over = true;
        pks.forEach((b) => (b.disabled = true));
        picked.forEach((i) => pks[i].classList.add('ok'));
        return ctx.done({ first: !mistakes, solved: true });
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        over = true;
        pks.forEach((b, i) => {
          b.disabled = true;
          b.classList.remove('on');
          if (targets ? targets.has(i) : i < ch.count) b.classList.add('shown');
        });
        return ctx.done({ first: false, solved: false });
      }
      if (targets) {
        const missing = [...targets].filter((i) => !picked.has(i)).length, extra = [...picked].filter((i) => !targets.has(i)).length;
        return ctx.fail(missing && extra ? 'Hay alguno que no es y te falta alguno. ¡Mira otra vez!' : missing ? '¡Te falta alguno! Mira bien.' : 'Has tocado alguno que no es. ¡Quítalo!');
      }
      ctx.fail(picked.size < ch.count ? `Has tocado ${picked.size}. ¡Faltan más!` : `Has tocado ${picked.size}. ¡Te has pasado!`);
    }
    ctx.ready(false);
    return { check };
  };

  // ---------------------------------------------------------------
  // order: tap the items in order. ch.items [{ label, rank }] (ascending rank wins)
  //   ch.ends ['pequeño', 'grande'] labels shown under the row
  // ---------------------------------------------------------------
  W.order = function (ch, el, ctx) {
    const n = ch.items.length, seq = [];
    const sorted = ch.items.map((x, i) => i).sort((a, b) => ch.items[a].rank - ch.items[b].rank);
    const rightAt = (k) => ch.items[seq[k]].rank === ch.items[sorted[k]].rank;
    let attempts = 0, mistakes = 0, over = false, state = '';

    function paint() {
      const slots = Array.from({ length: n }, (x, k) => (seq[k] === undefined
        ? `<span class="oslot">${k + 1}</span>`
        : `<button type="button" class="ocard in" data-k="${k}"${over ? ' disabled' : ''}>${ch.items[seq[k]].label}</button>`)).join('');
      const tray = ch.items.map((it, i) =>
        `<button type="button" class="ocard${seq.includes(i) ? ' used' : ''}" data-i="${i}"${over || seq.includes(i) ? ' disabled' : ''}>${it.label}</button>`).join('');
      el.innerHTML = `<div class="orow ${state}">${slots}</div>
        ${ch.ends ? `<div class="oends">${ch.ends[0]} ⟶ ${ch.ends[1]}</div>` : ''}
        <div class="otray">${tray}</div>`;
      ctx.ready(!over && seq.length === n);
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.ocard');
      if (!b || b.disabled || over) return;
      if (b.dataset.k !== undefined) seq.splice(+b.dataset.k, 1);
      else seq.push(+b.dataset.i);
      state = '';
      sfx.tap();
      paint();
    });
    function check() {
      if (over || seq.length < n) return;
      if (seq.every((x, k) => rightAt(k))) {
        over = true;
        state = 'ok';
        paint();
        return ctx.done({ first: !mistakes, solved: true });
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        over = true;
        state = 'shown';
        seq.splice(0, n, ...sorted);
        paint();
        return ctx.done({ first: false, solved: false });
      }
      let good = 0;
      while (good < n && rightAt(good)) good++;
      seq.length = good;
      paint();
      ctx.fail(good ? '¡Uy! Algo no estaba en su sitio. Te dejo los que están bien.' : '¡Uy! El primero no es ese. ¡Prueba otra vez!');
    }
    paint();
    return { check };
  };

  // ---------------------------------------------------------------
  // latin: picture sudoku. Tap an empty square to change its picture.
  //   ch.size n, ch.symbols [n], ch.grid [[index|null]], ch.solution [[index]]
  // Any grid with no repeats in rows and columns is accepted.
  // ---------------------------------------------------------------
  W.latin = function (ch, el, ctx) {
    const n = ch.size, val = ch.grid.map((r) => r.slice());
    const fixed = (r, c) => ch.grid[r][c] !== null;
    const wrong = new Set(), shown = new Set();
    let attempts = 0, mistakes = 0, over = false;

    function paint() {
      let cells = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const k = r * n + c, v = val[r][c];
        const cls = fixed(r, c) ? 'given' : wrong.has(k) ? 'wrong' : shown.has(k) ? 'shown' : over ? 'ok' : '';
        cells += `<button type="button" class="lc ${cls}" data-k="${k}"${fixed(r, c) || over ? ' disabled' : ''}>${v === null ? '' : ch.symbols[v]}</button>`;
      }
      el.innerHTML = `<div class="legend">${ch.symbols.map((s) => `<span>${s}</span>`).join('')}</div>
        <div class="latin" style="grid-template-columns:repeat(${n},minmax(0,1fr));--n:${n}">${cells}</div>`;
      ctx.ready(!over && val.every((row) => row.every((v) => v !== null)));
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.lc');
      if (!b || b.disabled || over) return;
      const k = +b.dataset.k, r = Math.floor(k / n), c = k % n, v = val[r][c];
      val[r][c] = v === null ? 0 : v + 1 < n ? v + 1 : null;
      wrong.delete(k);
      sfx.tap();
      paint();
    });
    function check() {
      if (over) return;
      wrong.clear();
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (fixed(r, c)) continue;
        for (let j = 0; j < n; j++) {
          if ((j !== c && val[r][j] === val[r][c]) || (j !== r && val[j][c] === val[r][c])) wrong.add(r * n + c);
        }
      }
      if (!wrong.size) {
        over = true;
        paint();
        return ctx.done({ first: !mistakes, solved: true });
      }
      mistakes++;
      attempts++;
      if (attempts >= ctx.maxAttempts) {
        over = true;
        wrong.clear();
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          if (!fixed(r, c) && val[r][c] !== ch.solution[r][c]) { val[r][c] = ch.solution[r][c]; shown.add(r * n + c); }
        }
        paint();
        return ctx.done({ first: false, solved: false });
      }
      paint();
      ctx.fail('Hay dibujos repetidos en una fila o en una columna. ¡Mira los rojos!');
    }
    paint();
    return { check };
  };

  // ---------------------------------------------------------------
  // memory: find the pairs. ch.pairs [[a, b]] (a and b can differ, e.g. 3 and •••)
  // ---------------------------------------------------------------
  W.memory = function (ch, el, ctx) {
    const cards = S.R.shuffle(ch.pairs.flatMap((p, i) => [{ i, h: p[0] }, { i, h: p[1] }]));
    const cols = cards.length <= 6 ? 3 : 4;
    el.innerHTML = `<div class="memory" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${cards.map((c, k) =>
      `<button type="button" class="mcard" data-k="${k}"><span class="mfront">${c.h}</span><span class="mback">⭐</span></button>`).join('')}</div>`;
    const els = [...el.querySelectorAll('.mcard')];
    let open = [], matched = 0, misses = 0, busy = false;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.mcard');
      if (!b || busy || b.classList.contains('up')) return;
      b.classList.add('up');
      sfx.tap();
      open.push(+b.dataset.k);
      if (open.length < 2) return;
      const [a, c] = open;
      open = [];
      if (cards[a].i === cards[c].i) {
        els[a].classList.add('ok');
        els[c].classList.add('ok');
        matched++;
        if (matched === ch.pairs.length) ctx.done({ first: misses <= ch.pairs.length, solved: true });
        else sfx.ok();
      } else {
        misses++;
        busy = true;
        setTimeout(() => {
          els[a].classList.remove('up');
          els[c].classList.remove('up');
          busy = false;
        }, 1000);
      }
    });
    return {};
  };

  // ---------------------------------------------------------------
  // simon: watch the sequence of coloured pads, then repeat it.
  //   ch.pads (3–6), ch.length
  // ---------------------------------------------------------------
  const PADS = ['#ff4f5e', '#3ec1ff', '#ffd23f', '#2ed9a3', '#8b5cf6', '#ff8a1f'];
  W.simon = function (ch, el, ctx) {
    const n = ch.pads, seq = Array.from({ length: ch.length }, () => S.R.int(0, n - 1));
    ch._seq = seq; // lets the automated tests play
    let pos = 0, attempts = 0, mistakes = 0, busy = true, over = false;
    el.innerHTML = `<div class="simon" style="--cols:${n > 4 ? 3 : 2}">${Array.from({ length: n }, (x, i) => `<button type="button" class="pad" data-i="${i}" style="--pc:${PADS[i]}" aria-label="Botón ${i + 1}"></button>`).join('')}</div>
      <p class="simonmsg">Mira bien…</p>`;
    const pads = [...el.querySelectorAll('.pad')], msg = el.querySelector('.simonmsg');
    const flash = (i, ms) => { pads[i].classList.add('lit'); sfx.note(i); setTimeout(() => pads[i].classList.remove('lit'), ms); };
    function show() {
      busy = true; pos = 0;
      msg.textContent = 'Mira bien…';
      seq.forEach((i, k) => setTimeout(() => flash(i, 420), 700 + k * 650));
      setTimeout(() => { busy = false; msg.textContent = `¡Tu turno! Repite los ${seq.length} colores.`; }, 700 + seq.length * 650);
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.pad');
      if (!b || busy || over) return;
      const i = +b.dataset.i;
      flash(i, 220);
      if (i === seq[pos]) {
        pos++;
        msg.textContent = `${pos} de ${seq.length}`;
        if (pos === seq.length) { over = true; msg.textContent = '¡Perfecto!'; ctx.done({ first: !mistakes, solved: true }); }
        return;
      }
      mistakes++; attempts++;
      if (attempts >= ctx.maxAttempts) { over = true; msg.textContent = 'Era así:'; seq.forEach((j, k) => setTimeout(() => flash(j, 380), 400 + k * 500)); return setTimeout(() => ctx.done({ first: false, solved: false }), 500 + seq.length * 500); }
      ctx.fail('¡Uy! Ese no era. Mira otra vez la secuencia.');
      setTimeout(show, 900);
    });
    show();
    return {};
  };

  // ---------------------------------------------------------------
  // maze: take the mouse to the cheese. ch.size; arrows, swipe-free buttons or tap
  // ---------------------------------------------------------------
  W.maze = function (ch, el, ctx) {
    const n = ch.size, walls = Array.from({ length: n * n }, () => [true, true, true, true]); // top right bottom left
    const seen = new Set([0]), stack = [0];
    while (stack.length) { // carve with a depth-first walk
      const c = stack[stack.length - 1], r = Math.floor(c / n), k = c % n;
      const next = [[-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1]].filter(([dr, dk]) => r + dr >= 0 && r + dr < n && k + dk >= 0 && k + dk < n && !seen.has((r + dr) * n + k + dk));
      if (!next.length) { stack.pop(); continue; }
      const [dr, dk, w, ow] = S.R.pick(next), nb = (r + dr) * n + k + dk;
      walls[c][w] = false; walls[nb][ow] = false; seen.add(nb); stack.push(nb);
    }
    let at = 0, moves = 0, over = false;
    const goal = n * n - 1;
    ch._walls = walls; // lets the automated tests play
    el.innerHTML = `<div class="maze" style="--n:${n}">${walls.map((w, i) => `<span class="mz${w[0] ? ' t' : ''}${w[1] ? ' r' : ''}${w[2] ? ' b' : ''}${w[3] ? ' l' : ''}" data-i="${i}"></span>`).join('')}</div>
      <div class="mzpad"><span></span><button type="button" data-d="0">⬆️</button><span></span><button type="button" data-d="3">⬅️</button><button type="button" data-d="2">⬇️</button><button type="button" data-d="1">➡️</button></div>`;
    const cells = [...el.querySelectorAll('.mz')];
    const paint = () => { cells.forEach((c, i) => (c.textContent = i === at ? ch.hero : i === goal ? ch.prize : '')); };
    const DIR = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    function go(d) {
      if (over || walls[at][d]) { if (!over) { sfx.bad(); el.querySelector('.maze').classList.remove('bump'); void el.offsetWidth; el.querySelector('.maze').classList.add('bump'); } return; }
      at = (Math.floor(at / n) + DIR[d][0]) * n + (at % n) + DIR[d][1];
      moves++; sfx.tap(); paint();
      if (at === goal) { over = true; cells[goal].classList.add('win'); ctx.done({ first: true, solved: true }); }
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]');
      if (b) return go(+b.dataset.d);
      const c = e.target.closest('.mz');
      if (!c) return;
      const i = +c.dataset.i, dr = Math.floor(i / n) - Math.floor(at / n), dk = (i % n) - (at % n);
      if (Math.abs(dr) + Math.abs(dk) === 1) go(dr === -1 ? 0 : dk === 1 ? 1 : dr === 1 ? 2 : 3);
    });
    paint();
    return { key(e) { const d = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key]; if (d === undefined) return false; go(d); return true; } };
  };

  // ---------------------------------------------------------------
  // tictactoe against the computer. ch.level 0 random · 1 blocks · 2 never loses
  // ---------------------------------------------------------------
  const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winner = (b) => { for (const [a, c, d] of LINES3) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; return b.every(Boolean) ? 'draw' : null; };
  function best(b, me) { // minimax
    const w = winner(b);
    if (w === 'O') return { s: 1 }; if (w === 'X') return { s: -1 }; if (w === 'draw') return { s: 0 };
    let pick = null;
    b.forEach((v, i) => {
      if (v) return;
      b[i] = me; const r = best(b, me === 'O' ? 'X' : 'O'); b[i] = null;
      if (!pick || (me === 'O' ? r.s > pick.s : r.s < pick.s)) pick = { s: r.s, i };
    });
    return pick;
  }
  W.ttt = function (ch, el, ctx) {
    let b = Array(9).fill(null), attempts = 0, over = false, busy = false;
    el.innerHTML = `<p class="tttmsg">Tú eres ${ch.me}. ¡Haz tres en raya!</p><div class="ttt">${b.map((x, i) => `<button type="button" class="tc" data-i="${i}"></button>`).join('')}</div>`;
    const cs = [...el.querySelectorAll('.tc')], msg = el.querySelector('.tttmsg');
    const paint = (line) => cs.forEach((c, i) => { c.textContent = b[i] === 'X' ? ch.me : b[i] === 'O' ? ch.cpu : ''; c.disabled = !!b[i] || over; c.classList.toggle('hl', !!line && line.includes(i)); });
    const lineOf = () => LINES3.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]);
    function cpuMove() {
      const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      let i;
      if (ch.level === 2) i = best(b, 'O').i;
      else if (ch.level === 1) {
        const find = (who) => free.find((f) => { b[f] = who; const w = winner(b) === who; b[f] = null; return w; });
        i = find('O') ?? find('X') ?? (b[4] ? S.R.pick(free) : 4);
      } else i = S.R.pick(free);
      b[i] = 'O';
    }
    function end() {
      const w = winner(b);
      if (!w) return false;
      over = true; paint(lineOf());
      if (w === 'X') { msg.textContent = '¡Has ganado! 🎉'; ctx.done({ first: !attempts, solved: true }); }
      else if (w === 'draw') { msg.textContent = 'Empate. ¡Muy bien defendido!'; ctx.done({ first: ch.level === 2 && !attempts, solved: true }); }
      else {
        attempts++;
        if (attempts >= ctx.maxAttempts) { msg.textContent = 'Ha ganado el ordenador.'; ctx.done({ first: false, solved: false }); }
        else { ctx.fail('¡Ha ganado el ordenador! Fíjate en sus jugadas y prueba otra vez.'); setTimeout(() => { b = Array(9).fill(null); over = false; msg.textContent = `Revancha. Tú eres ${ch.me}.`; paint(); }, 1400); }
      }
      return true;
    }
    el.addEventListener('click', (e) => {
      const c = e.target.closest('.tc');
      if (!c || over || busy || b[+c.dataset.i]) return;
      b[+c.dataset.i] = 'X'; sfx.tap(); paint();
      if (end()) return;
      busy = true;
      setTimeout(() => { cpuMove(); busy = false; paint(); end(); }, 450);
    });
    paint();
    return {};
  };

  // ---------------------------------------------------------------
  // slide: sliding puzzle (3×3 or 4×4). ch.size, ch.shuffle (random moves)
  // ---------------------------------------------------------------
  W.slide = function (ch, el, ctx) {
    const n = ch.size, N = n * n;
    let t = Array.from({ length: N }, (x, i) => (i + 1) % N), hole = N - 1, last = -1, moves = 0, over = false;
    const nbrs = (h) => [h - n, h + n, h % n ? h - 1 : -1, (h + 1) % n ? h + 1 : -1].filter((x) => x >= 0 && x < N);
    for (let k = 0; k < ch.shuffle; k++) { // only legal moves: always solvable
      const opts = nbrs(hole).filter((x) => x !== last), m = S.R.pick(opts);
      [t[hole], t[m]] = [t[m], t[hole]]; last = hole; hole = m;
    }
    if (t.every((v, i) => v === (i + 1) % N)) { const m = nbrs(hole)[0]; [t[hole], t[m]] = [t[m], t[hole]]; hole = m; }
    ch._tiles = () => t.slice(); // lets the automated tests play
    el.innerHTML = `<p class="slidemsg">Movimientos: <b>0</b></p><div class="slide" style="--n:${n}"></div>`;
    const box = el.querySelector('.slide'), mv = el.querySelector('.slidemsg b');
    const paint = () => { box.innerHTML = t.map((v, i) => (v ? `<button type="button" class="tile${v === i + 1 ? ' home' : ''}" data-i="${i}">${v}</button>` : '<span class="hole"></span>')).join(''); };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.tile');
      if (!b || over) return;
      const i = +b.dataset.i;
      if (!nbrs(hole).includes(i)) return sfx.bad();
      [t[hole], t[i]] = [t[i], t[hole]]; hole = i; moves++; mv.textContent = moves; sfx.tap(); paint();
      if (t.every((v, k) => v === (k + 1) % N)) { over = true; box.classList.add('solved'); ctx.done({ first: true, solved: true }); }
    });
    paint();
    return {};
  };
})();
