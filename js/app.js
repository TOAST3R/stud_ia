// Screens and game flow: players → home → planet map → mission / exam → results.
(function () {
  const S = window.StudIA, { store, sfx, fx, fmt, R, speak } = S;
  const data = store.data;
  const $app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let me = store.player; // the player who is playing now

  const CH = S.char; // drawn characters (characters.js)
  const RANKS = [[0, 'Cadete'], [10, 'Piloto'], [25, 'Capitán'], [40, 'Comandante'], [55, 'Leyenda galáctica']];
  const DEFAULT_EXAM = { title: 'Agujero Negro: el Examen', label: 'Simulacro', emoji: '🕳️', rounds: 10 };
  // A subject may split its units in sections (u.section), each with its own exam.
  // Without sections it is one section whose exam result is saved under the subject id.
  const sectionsOf = (sub) => sub.sections || [{ id: null, key: sub.id }];
  const unitsOf = (sub, sec) => (sec.id ? sub.units.filter((u) => u.section === sec.id) : sub.units);
  const examOf = (sub, sec) => Object.assign({}, DEFAULT_EXAM, sub.exam, sec && sec.exam);
  const unitLabel = (sub, u) => (sub.young || !u.n ? u.title : `Unidad ${u.n} · ${u.title}`);
  const examStars = (nota) => (nota >= 9 ? 3 : nota >= 6 ? 2 : 1);

  const starKey = (sub, u, m) => `${sub.id}.${u.id}.${m.id}`;
  const totalStars = (p) => Object.values((p || me).stars).reduce((a, b) => a + b, 0);
  const rank = () => RANKS.filter((r) => totalStars() >= r[0]).pop()[1];
  const starIcons = (n) => `<span class="st">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
  const forAge = (s, p) => !s.ages || (p.age >= s.ages[0] && p.age <= s.ages[1]);

  let keyHandler = null, tick = null;
  document.addEventListener('keydown', (e) => { if (keyHandler) keyHandler(e); });
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(html) {
    keyHandler = null;
    clearInterval(tick);
    if (window.speechSynthesis) speechSynthesis.cancel();
    $app.innerHTML = html;
    // one "warp" entrance per screen change
    $app.classList.remove('warp');
    void $app.offsetWidth;
    $app.classList.add('warp');
    window.scrollTo(0, 0);
    tilt();
  }
  const on = (sel, fn) => $app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', () => fn(el)));
  // cards lean towards the finger or the mouse
  function tilt() {
    if (calm) return;
    $app.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${x * 16}deg`);
        el.style.setProperty('--rx', `${-y * 16}deg`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }

  function hud() {
    return `<header class="hud">
      <button class="me" data-nav="players" title="Cambiar de jugador"><span class="ava">${CH(me.avatar)}</span><span><b>${esc(me.name)}</b><small>${rank()} · cambiar ⇄</small></span></button>
      <span class="pill">⭐ ${totalStars()}</span><span class="pill">💎 ${fmt(me.crystals)}</span>
      <button class="icon" data-act="sound" aria-label="Sonido">${data.sound ? '🔊' : '🔇'}</button>
    </header>`;
  }
  function bindHud(redraw) {
    on('[data-nav="players"]', players);
    on('[data-act="sound"]', () => { data.sound = !data.sound; store.save(); redraw(); });
  }

  // ---------------- players ----------------
  function start() {
    // avatars used to be emoji: switch them to the drawn characters
    data.players.forEach((p) => (p.avatar = S.charId(p.avatar)));
    store.save();
    me = store.player;
    if (!data.players.length) return editPlayer(null);
    const unfinished = data.players.find((p) => !p.age);
    if (unfinished) return editPlayer(unfinished);
    if (data.players.length === 1) {
      me = data.players[0];
      data.current = me.id;
      store.save();
      return home();
    }
    players();
  }

  function players() {
    render(`<section class="picker">
      <h1 class="title3d">¿Quién juega?</h1>
      <div class="players">
        ${data.players.map((p) => `<div class="pcard" data-tilt>
          <button class="pplay" data-id="${p.id}"><span class="podium">${CH(p.avatar)}</span><b>${esc(p.name)}</b><small>${p.age ? `${p.age} años · ` : ''}⭐ ${totalStars(p)}</small></button>
          <button class="icon pedit" data-id="${p.id}" aria-label="Editar a ${esc(p.name)}">✏️</button>
        </div>`).join('')}
        <button class="pcard pnew" data-tilt><span class="podium empty">+</span><b>Nuevo jugador</b><small>Para otro hermano</small></button>
      </div>
    </section>`);
    const byId = (id) => data.players.find((p) => p.id === id);
    on('.pplay', (b) => {
      me = byId(b.dataset.id);
      data.current = me.id;
      store.save();
      sfx.ok();
      me.age ? home() : editPlayer(me);
    });
    on('.pedit', (b) => editPlayer(byId(b.dataset.id)));
    on('.pnew', () => editPlayer(null));
  }

  // Same form for the first player, a new one, or one carried over from the
  // first version (setup: his progress is kept, only name/age/avatar are asked).
  function editPlayer(p) {
    const isNew = !p, setup = !!p && !p.age, first = !data.players.length || setup;
    let age = p ? p.age : null, avatar = p ? S.charId(p.avatar) : 'astro';
    const unlocked = S.CHARS.filter((a) => a.need <= (p ? totalStars(p) : 0));
    render(`<section class="welcome">
      ${first ? '' : '<button class="icon back" aria-label="Volver">←</button>'}
      <div class="logo">${CH(avatar, 'happy')}</div>
      <h1>${first ? 'StudIA' : isNew ? 'Nuevo jugador' : 'Editar jugador'}</h1>
      ${!first ? '' : setup
        ? '<p class="lead">¡Nueva versión! Ahora pueden jugar varios hermanos. Tu progreso se guarda: solo confirma tus datos.</p>'
        : '<p class="lead">Una aventura espacial para aprender y preparar exámenes.</p>'}
      <label>¿Cómo te llamas?<input id="name" maxlength="14" autocomplete="off" placeholder="Tu nombre" value="${esc(p ? p.name : '')}"></label>
      <p class="q">¿Cuántos años tienes?</p>
      <div class="ages">${[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => `<button class="age${a === age ? ' sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="q">Elige tu personaje</p>
      <div class="avatars">${unlocked.map((a) => `<button class="avatar${a.id === avatar ? ' sel' : ''}" data-e="${a.id}">${CH(a.id)}<small>${a.name}</small></button>`).join('')}</div>
      <button class="btn primary big" id="go">${isNew || setup ? '¡Despegar!' : 'Guardar'}</button>
      ${isNew || setup ? '' : '<button class="btn ghost del">🗑️ Borrar jugador</button>'}
    </section>`);
    on('.age', (b) => {
      age = +b.dataset.a;
      $app.querySelector('.ages').classList.remove('need');
      $app.querySelectorAll('.age').forEach((x) => x.classList.toggle('sel', x === b));
    });
    on('.avatar', (b) => {
      avatar = b.dataset.e;
      $app.querySelectorAll('.avatar').forEach((x) => x.classList.toggle('sel', x === b));
      $app.querySelector('.logo').innerHTML = CH(avatar, 'happy');
      sfx.tap();
    });
    on('.back', players);
    on('.del', () => {
      if (!confirm(`¿Borrar a ${p.name} y todo su progreso?`)) return;
      data.players.splice(data.players.indexOf(p), 1);
      if (data.current === p.id) data.current = null;
      store.save();
      start();
    });
    const save = () => {
      if (!age) {
        const ages = $app.querySelector('.ages');
        ages.classList.remove('need');
        void ages.offsetWidth; // restart the shake animation
        ages.classList.add('need');
        return sfx.bad();
      }
      const name = document.getElementById('name').value.trim() || `Jugador ${data.players.length + (isNew ? 1 : 0)}`;
      if (isNew) {
        p = store.newPlayer({ name, age, avatar, asked: true });
        data.players.push(p);
      } else Object.assign(p, { name, age, avatar, asked: true });
      me = p;
      data.current = p.id;
      store.save();
      sfx.win();
      home();
    };
    document.getElementById('go').addEventListener('click', save);
    keyHandler = (e) => { if (e.key === 'Enter' && e.target.id === 'name') save(); };
  }

  // ---------------- home: pick a subject ----------------
  function subjectCard(s) {
    const max = s.units.reduce((a, u) => a + u.missions.length * 3, 0);
    const got = s.units.reduce((a, u) => a + u.missions.reduce((b, m) => b + (me.stars[starKey(s, u, m)] || 0), 0), 0);
    return `<button class="subject" data-sub="${s.id}" data-tilt><span class="semoji">${s.emoji}</span><b>${s.title}</b><small>${s.tagline}</small>
      <span class="bar"><i style="width:${(got / max) * 100}%"></i></span><small>⭐ ${got} / ${max}</small></button>`;
  }
  function home() {
    const all = Object.values(S.subjects);
    let mine = all.filter((s) => forAge(s, me));
    if (!mine.length) mine = all;
    const others = all.filter((s) => !mine.includes(s));
    const stars = totalStars();
    const next = S.CHARS.find((a) => a.need > stars);
    render(`${hud()}<section class="home">
      <div class="greet">
        <div class="hero-char">${CH(me.avatar, 'happy')}</div>
        <div class="greet-talk"><h1 class="title3d">¡Hola, ${esc(me.name)}!</h1><p>¿Qué galaxia exploramos hoy?</p></div>
      </div>
      <div class="subjects">${mine.map(subjectCard).join('')}
        <div class="subject ghost"><span class="semoji">🔭</span><b>Más galaxias</b><small>Pronto habrá nuevas asignaturas</small></div>
      </div>
      ${others.length ? `<h2>Otras galaxias</h2><div class="subjects small">${others.map(subjectCard).join('')}</div>` : ''}
      <h2>Tu tripulación</h2>
      <p class="lead">${next ? `Consigue ${next.need - stars} ⭐ más para desbloquear a ${next.name}.` : '¡Has desbloqueado a todos los personajes!'}</p>
      <div class="avatars crew">${S.CHARS.map((a) => (a.need > stars
        ? `<span class="avatar locked" title="Necesitas ${a.need} estrellas">${CH(a.id, 'idle', 'sil')}<small>🔒 ${a.need} ⭐</small></span>`
        : `<button class="avatar${a.id === me.avatar ? ' sel' : ''}" data-e="${a.id}">${CH(a.id, a.id === me.avatar ? 'happy' : 'idle')}<small>${a.name}</small></button>`)).join('')}</div>
    </section>`);
    bindHud(home);
    on('.subject[data-sub]', (b) => map(S.subjects[b.dataset.sub]));
    on('button.avatar', (b) => { me.avatar = b.dataset.e; store.save(); home(); });
    if (me.age < 7) speak(`¡Hola, ${me.name}! Elige un juego.`);
  }

  // ---------------- planet map ----------------
  // The map is a winding board-game track. Planets have faces: sleepy before you
  // start, smiling while you play, sunglasses when every mission has 3 stars.
  // Your character waits on the next planet to play; exams are black holes.
  const TRACK_X = [22, 70, 40, 78, 26, 60];
  const STEP = 168;
  function planetFace(state) {
    const O = '#24164f';
    if (state === 'done') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M14 18 H86 L82 32 Q70 40 58 32 L54 24 H46 L42 32 Q30 40 18 32 Z" fill="${O}"/><path d="M22 22 L30 22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M30 44 Q50 60 70 44" fill="#fff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/></svg>`;
    }
    if (state === 'sleep') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M22 26 Q31 34 40 26 M60 26 Q69 34 78 26" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="50" cy="46" rx="5" ry="4" fill="${O}"/><text x="84" y="14" class="zz">z</text><text x="92" y="4" class="zz small">z</text></svg>`;
    }
    return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><g class="eyes"><circle cx="31" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="34" cy="27" r="5" fill="${O}"/><circle cx="69" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="72" cy="27" r="5" fill="${O}"/></g><path d="M36 42 Q50 54 64 42" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/></svg>`;
  }
  function map(sub) {
    const stateOf = (u) => {
      const got = u.missions.reduce((a, m) => a + (me.stars[starKey(sub, u, m)] || 0), 0), max = u.missions.length * 3;
      return { got, max, state: got === max ? 'done' : got ? 'play' : 'sleep' };
    };
    // the character waits on the first planet that is not finished
    const here = sub.units.find((u) => stateOf(u).state !== 'done');
    const track = (sec) => {
      const units = unitsOf(sub, sec), withBoss = sec.exam !== false, n = units.length + (withBoss ? 1 : 0);
      const pos = (i) => [TRACK_X[i % TRACK_X.length], i * STEP + 150];
      let path = '';
      for (let i = 0; i < n; i++) {
        const [x, y] = pos(i);
        if (!i) path += `M${x} ${y}`;
        else { const [px, py] = pos(i - 1); path += ` C${px} ${py + STEP / 2} ${x} ${y - STEP / 2} ${x} ${y}`; }
      }
      const nodes = units.map((u, i) => {
        const { got, max, state } = stateOf(u), [x, y] = pos(i), size = 96 + ((u.id.length * 7 + i * 13) % 34);
        return `<button class="pnode ${state}${u === here ? ' here' : ''}" data-u="${u.id}" style="--c:${u.color};left:${x}%;top:${y}px;--s:${size}px;--t:${((i * 37) % 9) - 4}deg">
          <span class="orb">${i % 3 === 1 ? '<span class="ring"></span>' : ''}${i % 4 === 2 ? '<span class="moon"></span>' : ''}${planetFace(state)}<span class="badge">${u.emoji}</span></span>
          ${u === here ? `<span class="me-on">${CH(me.avatar, 'happy')}<i>¡Aquí!</i></span>` : ''}
          <span class="tag"><small>${unitLabel(sub, u)}</small><b>${u.planet}</b><span class="pst">${'★'.repeat(Math.round((got / max) * 3))}<i>${'★'.repeat(3 - Math.round((got / max) * 3))}</i> ${got}/${max}</span></span>
        </button>`;
      });
      if (withBoss) {
        const best = me.exams[sec.key], ex = examOf(sub, sec), [x, y] = pos(units.length);
        const bestText = best === undefined ? (sub.young ? 'Preguntas de todos los planetas' : 'Sin pistas. ¿Te atreves?')
          : sub.young ? `Tu mejor resultado: ${'★'.repeat(examStars(best))}` : `Tu mejor nota: ${best} / 10`;
        nodes.push(`<button class="pnode boss" data-exam="${sec.key}" style="left:${x}%;top:${y}px;--s:132px">
          <span class="orb"><span class="swirl"></span><svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M20 18 L42 26 M80 18 L58 26" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="32" r="7" fill="#ffd23f"/><circle cx="66" cy="32" r="7" fill="#ffd23f"/><path d="M34 48 Q50 40 66 48" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/></svg></span>
          <span class="tag boss-tag"><small>${ex.label} · ${ex.rounds} preguntas</small><b>${ex.title}</b><span class="pst">${bestText}</span></span>
        </button>`);
      }
      return `<div class="track" style="height:${(n - 1) * STEP + 300}px">
        <svg class="trail" viewBox="0 0 100 ${(n - 1) * STEP + 300}" preserveAspectRatio="none" aria-hidden="true">
          <path d="${path}" class="trail-glow"/><path d="${path}" class="trail-dots"/>
        </svg>${nodes.join('')}</div>`;
    };
    render(`${hud()}<section class="map">
      <h1 class="title3d">${sub.emoji} ${sub.title}</h1>
      <div class="ufo" aria-hidden="true">${CH('ovni')}</div>
      ${sectionsOf(sub).map((sec, i) => `
        ${sec.title ? `<div class="sechead" style="--t:${i % 2 ? 3 : -3}deg"><h2>${sec.emoji || ''} ${sec.title}</h2>${sec.subtitle ? `<small>${sec.subtitle}</small>` : ''}</div>` : ''}
        ${track(sec)}`).join('')}
    </section>`);
    bindHud(() => map(sub));
    on('.pnode[data-u]', (b) => sheet(sub, sub.units.find((u) => u.id === b.dataset.u)));
    on('.pnode[data-exam]', (b) => startExam(sub, sectionsOf(sub).find((s) => s.key === b.dataset.exam)));
    const meOn = $app.querySelector('.me-on');
    if (meOn && sub.units.indexOf(here) > 2) setTimeout(() => meOn.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' }), 450);
  }

  function sheet(sub, u) {
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = `<div class="sheet" style="--c:${u.color}">
      <button class="icon close" aria-label="Cerrar">✕</button>
      <div class="shead"><span class="ball">${u.emoji}</span><div><small>${unitLabel(sub, u)}</small><h2>${u.planet}</h2></div></div>
      ${u.missions.map((m) => {
        const k = starKey(sub, u, m), rec = m.arcade ? ` · 🏆 Récord: ${(me.records || {})[k] || 0}` : '';
        return `<button class="mission" data-m="${m.id}">
          <span><b>${m.arcade ? '⏱️ ' : ''}${m.title}</b><small>${m.desc}${rec}</small></span>${starIcons(me.stars[k] || 0)}<span class="go">▶</span></button>`;
      }).join('')}
    </div>`;
    $app.appendChild(wrap);
    if (sub.young) speak(u.planet);
    wrap.addEventListener('click', (e) => {
      const m = e.target.closest('.mission');
      if (m) startMission(sub, u, u.missions.find((x) => x.id === m.dataset.m));
      else if (e.target === wrap || e.target.closest('.close')) wrap.remove();
    });
  }

  // ---------------- sessions ----------------
  function startMission(sub, u, m) {
    if (m.arcade) return play({ sub, unit: u, mission: m, exam: false, arcade: m.arcade, queue: [], title: m.title, color: u.color });
    const queue = Array.from({ length: m.rounds }, (x, i) => ({
      unit: u, make: () => m.gen(Math.min(2, Math.floor((i * 3) / m.rounds)), i),
    }));
    play({ sub, unit: u, mission: m, exam: false, queue, title: m.title, color: u.color });
  }
  function startExam(sub, sec) {
    sec = sec || sectionsOf(sub)[0];
    const ex = examOf(sub, sec), units = unitsOf(sub, sec);
    const all = units.flatMap((u) => u.missions.filter((m) => !m.arcade).map((m) => ({ unit: u, make: () => m.gen(1) })));
    const queue = R.shuffle(units).map((u) => R.pick(all.filter((x) => x.unit === u))).filter(Boolean).slice(0, ex.rounds);
    while (queue.length < ex.rounds) queue.push(R.pick(all));
    play({ sub, sec, exam: true, queue: R.shuffle(queue), title: ex.title, color: '#8b6cff' });
  }

  const CHEERS = ['¡Genial!', '¡Bravo!', '¡Así se hace!', '¡Perfecto!', '¡Qué máquina!', '¡Brillante!', '¡Muy bien!'];

  // Arcade missions ({ arcade: { seconds, goals: [⭐, ⭐⭐, ⭐⭐⭐] } }) ask questions
  // non-stop until the time runs out; stars depend on how many were right.
  // Short run to the next mission's planet (runner.js); its crystals are a bonus.
  function travel(sub, from, to, then) {
    render(`<section class="travel" style="--c:${to.color}">
      <h2 class="title3d">${from === to ? `Siguiente misión en ${to.planet}` : `Rumbo a ${to.planet}`} ${to.emoji}</h2>
      <div class="rhost"></div>
    </section>`);
    S.runner($app.querySelector('.rhost'), {
      avatar: me.avatar, target: to, young: !!sub.young, seconds: sub.young ? 12 : 14,
      onEnd: (gems) => { me.crystals += gems; store.save(); then(); },
    });
  }

  function play(ses) {
    const arcade = ses.arcade, young = !!ses.sub.young;
    ses.rankBefore = rank();
    const total = arcade ? Infinity : ses.queue.length;
    const log = []; // per round: { unit, first, solved }
    let i = 0, combo = 0, earned = 0, widget = null, ch = null, waitingNext = false, over = false, endAt = 0;

    render(`<section class="play${young ? ' young' : ''}${arcade ? ' arcade' : ''}" style="--c:${ses.color}">
      <header class="topbar">
        <button class="icon quit" aria-label="Salir">✕</button>
        ${arcade
          ? '<div class="timer"><i></i></div><span class="pill score">✔ <b>0</b></span>'
          : `<div class="dots">${ses.queue.map(() => '<i></i>').join('')}</div>`}
        ${young ? '<button class="icon again" aria-label="Escuchar otra vez">🔊</button>' : ''}
        <span class="pill gems">💎 <b>0</b></span>
      </header>
      <div class="paper">
        <div class="ptitle"></div>
        <div class="prompt"></div>
        <div class="widget"></div>
      </div>
      <div class="bubble" hidden><span class="bot">${CH(me.avatar, 'oops')}</span><span class="btext"></span></div>
      <div class="actions">
        <button class="btn ghost hint">💡 Pista</button>
        <button class="btn primary check" disabled>${young ? '✔ ¡Listo!' : 'Comprobar'}</button>
      </div>
      <div class="feedback" hidden>
        <span class="fchar"></span>
        <div class="ftext"><b class="fhead"></b><span class="fbody"></span></div>
        <button class="btn primary next">Siguiente ➜</button>
      </div>
    </section>`);
    const q = (s) => $app.querySelector(s);
    const dots = [...$app.querySelectorAll('.dots i')];
    const say = (msg) => {
      q('.btext').innerHTML = msg;
      q('.bubble').hidden = false;
      if (young) speak(msg);
    };

    const ctx = {
      maxAttempts: ses.exam || arcade ? 1 : 2,
      ready: (b) => { q('.check').disabled = !b; },
      say,
      fail(msg) { sfx.bad(); say(msg || 'Casi… ¡inténtalo otra vez!'); },
      done(res) {
        if (over) return;
        log.push({ unit: arcade ? ses.unit : ses.queue[i].unit, first: res.first, solved: res.solved });
        combo = res.first ? combo + 1 : 0;
        const gain = arcade ? (res.first ? 3 : 0) : res.first ? 10 + (combo >= 3 ? 5 : 0) : res.solved ? 4 : 0;
        earned += gain;
        me.crystals += gain;
        store.save();
        q('.gems b').textContent = earned;
        if (arcade) {
          // no feedback panel: flash, then straight to the next question
          q('.score b').textContent = log.filter((r) => r.first).length;
          res.first ? sfx.ok() : sfx.bad();
          const paper = q('.paper');
          paper.classList.remove('flash-ok', 'flash-bad');
          void paper.offsetWidth;
          paper.classList.add(res.first ? 'flash-ok' : 'flash-bad');
          if (!res.first && ch.explain) say(ch.explain);
          setTimeout(() => { if (!over) { i++; round(); } }, res.first ? 350 : 1600);
          return;
        }
        dots[i].className = res.first ? 'ok' : res.solved ? 'meh' : 'bad';
        res.solved ? sfx.ok() : sfx.bad();
        if (res.first && (combo >= 3 || young)) fx.confetti(young ? 24 : 14);
        const fb = q('.feedback');
        const head = res.first ? R.pick(CHEERS) + (combo >= 3 ? ` 🔥 Racha de ${combo}` : '') : res.solved ? '¡Conseguido!' : 'Casi… mira cómo se hace';
        fb.className = 'feedback ' + (res.first ? 'ok' : res.solved ? 'meh' : 'bad');
        q('.fchar').innerHTML = CH(me.avatar, res.solved ? 'happy' : 'oops');
        const paper = q('.paper');
        paper.classList.remove('win');
        void paper.offsetWidth;
        if (res.first) paper.classList.add('win');
        q('.fhead').textContent = head;
        q('.fbody').innerHTML = ch.explain || '';
        q('.next').textContent = i === total - 1 ? 'Terminar ➜' : 'Siguiente ➜';
        q('.bubble').hidden = true;
        q('.actions').hidden = true;
        fb.hidden = false;
        waitingNext = true;
        if (young) speak(`${head.replace(/🔥.*/, '')}. ${ch.sayAfter !== undefined ? ch.sayAfter : ch.explain || ''}`);
        fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      },
    };

    function round() {
      ch = arcade ? ses.mission.gen(Math.min(2, Math.floor(i / 8)), i) : ses.queue[i].make();
      waitingNext = false;
      if (arcade) {
        q('.ptitle').textContent = `${ses.title} · pregunta ${i + 1}`;
        if (!endAt) {
          endAt = Date.now() + arcade.seconds * 1000;
          tick = setInterval(() => {
            const left = endAt - Date.now();
            q('.timer i').style.width = Math.max(0, (left / (arcade.seconds * 1000)) * 100) + '%';
            q('.timer').classList.toggle('hurry', left < 10000);
            if (left <= 0) { clearInterval(tick); over = true; finish(); }
          }, 100);
        }
      } else {
        dots[i].className = 'now';
        q('.ptitle').textContent = `${ses.title} · ${i + 1} de ${total}`;
      }
      q('.prompt').innerHTML = ch.prompt;
      q('.feedback').hidden = true;
      q('.bubble').hidden = true;
      q('.actions').hidden = false;
      q('.hint').hidden = ses.exam || !ch.hint;
      const old = q('.widget'), fresh = old.cloneNode(false); // drop the old widget's listeners
      old.replaceWith(fresh);
      q('.check').disabled = true;
      widget = S.widgets[ch.type](ch, fresh, ctx);
      q('.check').hidden = !widget.check;
      if (!widget.check && q('.hint').hidden) q('.actions').hidden = true;
      if (young) speak(ch.prompt);
      window.scrollTo(0, 0);
    }
    function next() {
      if (!waitingNext) return;
      i++;
      if (i < total) round();
      else finish();
    }
    function finish() {
      const first = log.filter((r) => r.first).length;
      if (arcade) {
        const k = starKey(ses.sub, ses.unit, ses.mission), goals = arcade.goals;
        const stars = goals.filter((g) => first >= g).length;
        me.records = me.records || {};
        const record = first > (me.records[k] || 0);
        if (record) me.records[k] = first;
        if (stars) me.stars[k] = Math.max(me.stars[k] || 0, stars);
        store.save();
        return result({
          ses, earned,
          head: record && first ? '¡Nuevo récord!' : stars === 3 ? '¡Velocidad de la luz!' : stars ? '¡Bien jugado!' : '¡Sigue entrenando!',
          big: bigStars(stars),
          body: `<p><b>${first}</b> aciertos en ${arcade.seconds} segundos · 🏆 Récord: ${me.records[k] || 0}</p>
            <p>⭐ ${goals[0]} · ⭐⭐ ${goals[1]} · ⭐⭐⭐ ${goals[2]} aciertos</p>`,
          party: stars >= 2 || (record && first > 0),
        });
      }
      if (ses.exam) {
        const nota = Math.round((first / total) * 10), key = ses.sec.key;
        if (me.exams[key] === undefined || nota > me.exams[key]) me.exams[key] = nota;
        store.save();
        const weak = [...new Set(log.filter((r) => !r.first).map((r) => r.unit))];
        const stars = examStars(nota);
        result({
          ses, earned,
          head: young ? (stars === 3 ? '¡Reto superado!' : stars === 2 ? '¡Muy bien!' : '¡Buen intento!')
            : nota >= 9 ? '¡Examen espectacular!' : nota >= 7 ? '¡Muy buen examen!' : nota >= 5 ? '¡Aprobado!' : 'Hay que entrenar un poco más',
          big: young ? bigStars(stars) : `<div class="nota">${nota}<small>/ 10</small></div>`,
          body: weak.length
            ? `<p>Para mejorar, repasa:</p><div class="weak">${weak.map((u) => `<button class="chip" data-u="${u.id}" style="--c:${u.color}">${u.emoji} ${u.planet}</button>`).join('')}</div>`
            : '<p>¡Ni un solo fallo! ¡Eres un crack!</p>',
          party: nota >= 7,
        });
      } else {
        const ratio = first / total, stars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
        const k = starKey(ses.sub, ses.unit, ses.mission);
        me.stars[k] = Math.max(me.stars[k] || 0, stars);
        store.save();
        result({
          ses, earned,
          head: stars === 3 ? '¡Misión perfecta!' : stars === 2 ? '¡Misión cumplida!' : '¡Misión terminada!',
          big: bigStars(stars),
          body: `<p>${first} de ${total} a la primera.${stars < 3 ? ' ¡Repite para conseguir las 3 estrellas!' : ''}</p>`,
          party: stars >= 2,
        });
      }
    }

    q('.check').addEventListener('click', () => widget.check && widget.check());
    q('.next').addEventListener('click', next);
    q('.hint').addEventListener('click', () => say(ch.hint));
    if (young) q('.again').addEventListener('click', () => speak(ch.prompt));
    q('.quit').addEventListener('click', () => { if (confirm('¿Salir de la misión? Perderás el progreso de esta partida.')) map(ses.sub); });
    keyHandler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (waitingNext) { if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); } return; }
      if (widget && widget.key && widget.key(e)) return e.preventDefault();
      if (e.key === 'Enter' && widget && widget.check && !q('.check').disabled) { e.preventDefault(); widget.check(); }
    };
    round();
  }

  const bigStars = (stars) => `<div class="bigstars">${[1, 2, 3].map((n) => `<span class="${n <= stars ? 'on' : ''}" style="animation-delay:${n * 0.25}s">★</span>`).join('')}</div>`;

  // ---------------- results ----------------
  function result(r) {
    const { ses } = r;
    let nextUp = null;
    if (!ses.exam) {
      const ms = ses.unit.missions, mi = ms.indexOf(ses.mission);
      const ui = ses.sub.units.indexOf(ses.unit);
      if (mi < ms.length - 1) nextUp = { u: ses.unit, m: ms[mi + 1] };
      else if (ui < ses.sub.units.length - 1) nextUp = { u: ses.sub.units[ui + 1], m: ses.sub.units[ui + 1].missions[0] };
    }
    render(`<section class="result">
      <div class="hero-char big">${CH(me.avatar, r.party ? 'happy' : 'idle')}</div>
      <h1>${r.head}</h1>
      ${r.big}
      ${rank() !== ses.rankBefore ? `<div class="levelup">🎖️ ¡Has subido de rango! Ahora eres <b>${rank()}</b></div>` : ''}
      <div class="rbody">${r.body}</div>
      <p class="pill">💎 +${r.earned} cristales</p>
      <div class="rbtns">
        ${nextUp ? `<button class="btn primary" data-act="next">Siguiente: ${nextUp.m.title} ➜</button>` : ''}
        <button class="btn ${nextUp ? 'ghost' : 'primary'}" data-act="again">🔁 ${ses.exam ? 'Otra vez' : 'Repetir'}</button>
        <button class="btn ghost" data-act="map">🪐 Volver al mapa</button>
      </div>
    </section>`);
    if (r.party) { sfx.win(); fx.confetti(60); }
    if (ses.sub.young) speak(r.head);
    const goNext = () => travel(ses.sub, ses.unit, nextUp.u, () => startMission(ses.sub, nextUp.u, nextUp.m));
    on('[data-act="next"]', goNext);
    keyHandler = (e) => {
      if (nextUp && (e.key === 'ArrowRight' || e.key === 'Enter')) { e.preventDefault(); goNext(); }
    };
    on('[data-act="again"]', () => (ses.exam ? startExam(ses.sub, ses.sec) : startMission(ses.sub, ses.unit, ses.mission)));
    on('[data-act="map"]', () => map(ses.sub));
    on('.chip[data-u]', (b) => { map(ses.sub); sheet(ses.sub, ses.sub.units.find((u) => u.id === b.dataset.u)); });
  }

  fx.starfield();
  start();
})();
