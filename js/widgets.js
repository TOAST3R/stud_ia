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
  // Stages are solved one after another (e.g. row by row).
  // ---------------------------------------------------------------
  W.cells = function (ch, el, ctx) {
    const n = ch.cells.length;
    const vals = Array(n).fill('');
    const status = Array(n).fill(''); // '', 'ok', 'wrong', 'shown'
    const stageOf = (i) => ch.cells[i].stage || 0;
    const lastStage = Math.max(...ch.cells.map((c) => c.stage || 0));
    const lenOf = (c) => String(c.set ? Math.max(...ch.sets[c.set]) : c.ans).length;
    let stage = 0, attempts = 0, mistakes = 0, revealed = false, finished = false, active = -1;

    el.innerHTML =
      `<div class="cells-body">${ch.html.replace(/\{\{(\d+)\}\}/g, (m, i) =>
        `<button type="button" class="cell" data-i="${i}" style="--len:${lenOf(ch.cells[i])}"></button>`)}</div>
      <div class="numpad">${['1', '2', '3', '4', '5', 'del', '6', '7', '8', '9', '0', 'next'].map((k) =>
        `<button type="button" class="key${k.length > 1 ? ' fn' : ''}" data-k="${k}">${k === 'del' ? '⌫' : k === 'next' ? '➜' : k}</button>`).join('')}</div>`;
    const cellEls = [];
    el.querySelectorAll('.cell').forEach((b) => (cellEls[+b.dataset.i] = b));

    const isLocked = (i) => status[i] === 'ok' || status[i] === 'shown';
    const open = () => ch.cells.map((c, i) => i).filter((i) => stageOf(i) === stage && !isLocked(i));
    const isReady = () => !finished && open().length > 0 && open().every((i) => vals[i] !== '');

    function paint() {
      cellEls.forEach((b, i) => {
        b.textContent = vals[i] === '' ? '' : fmt(Number(vals[i]));
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
      else if (vals[active] === '0') vals[active] = k;
      else if (vals[active].length < 7) vals[active] += k;
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
      open().forEach((i) => {
        const c = ch.cells[i], v = Number(vals[i]);
        let ok;
        if (c.set) {
          const p = remaining[c.set].indexOf(v);
          ok = p >= 0;
          if (ok) remaining[c.set].splice(p, 1);
        } else ok = v === c.ans;
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
        else if (e.key === 'Backspace') press('del');
        else if (e.key === 'Tab' || e.key === 'ArrowRight' || (e.key === 'Enter' && !isReady())) press('next');
        else return false;
        return true;
      },
    };
  };

  // ---------------------------------------------------------------
  // choice: tap one option. ch.options [{ label, correct }]
  //   ch.layout 'line' draws the 0–10 000 number line with zones A–J
  // ---------------------------------------------------------------
  W.choice = function (ch, el, ctx) {
    let over = false;
    if (ch.layout === 'line') {
      el.innerHTML = `<div class="zline">
        <div class="zticks">${Array.from({ length: 11 }, (x, i) => `<span style="left:${i * 10}%">${fmt(i * 1000)}</span>`).join('')}</div>
        <div class="zbar">${ch.options.map((o, i) => `<button type="button" class="choice zone" data-i="${i}">${o.label}</button>`).join('')}</div>
      </div>`;
    } else {
      el.innerHTML = `<div class="choices">${ch.options.map((o, i) =>
        `<button type="button" class="choice" data-i="${i}">${o.label}</button>`).join('')}</div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.choice');
      if (!b || over) return;
      over = true;
      const ok = !!ch.options[+b.dataset.i].correct;
      el.querySelectorAll('.choice').forEach((x) => {
        x.disabled = true;
        if (ch.options[+x.dataset.i].correct) x.classList.add('ok');
      });
      if (!ok) b.classList.add('wrong');
      ctx.done({ first: ok, solved: ok });
    });
    return {};
  };

  // ---------------------------------------------------------------
  // paint: tap the right numbers on a board.
  //   ch.board { to, width }   ch.targets [numbers]
  // ---------------------------------------------------------------
  W.paint = function (ch, el, ctx) {
    const targets = new Set(ch.targets), picked = new Set();
    let attempts = 0, mistakes = 0, over = false;
    let html = `<div class="board" style="grid-template-columns:repeat(${ch.board.width},1fr);max-width:${ch.board.width * 46}px">`;
    for (let v = 1; v <= ch.board.to; v++) html += `<button type="button" class="sq" data-v="${v}">${v}</button>`;
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
})();
