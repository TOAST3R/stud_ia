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
  // "young" mode (voice, big pictures) can be set per unit or section; Lógica and
  // Geometría are young only at the Infantil level.
  // (sub.youngByPlayer: it depends on the player, for subjects open to every age)
  const youngU = (sub, u) => (u && u.young !== undefined ? u.young : sub.youngByPlayer ? littleOne(me) : !!sub.young);
  const youngS = (sub, sec) => (sec && sec.young !== undefined ? sec.young : sub.youngByPlayer ? littleOne(me) : !!sub.young);
  // Subjects with levels (sec.level 0 Infantil · 1 = 1.º–2.º · 2 = 3.º–4.º · 3 = 5.º–6.º)
  // open every level up to the player's school year; higher ones need the exam.
  const LEVEL_OF = { i3: 0, i4: 0, i5: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3 };
  const myLevel = () => LEVEL_OF[me.curso] ?? 0;

  const starKey = (sub, u, m) => `${sub.id}.${u.id}.${m.id}`;
  const totalStars = (p) => Object.values((p || me).stars).reduce((a, b) => a + b, 0);
  const rank = () => RANKS.filter((r) => totalStars() >= r[0]).pop()[1];
  const starIcons = (n) => `<span class="st">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
  // A player's school year (curso) decides which subjects come first; without
  // one we guess from the age.
  const CURSOS = [['i3', 'Infantil 3'], ['i4', 'Infantil 4'], ['i5', 'Infantil 5'], ['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º'], ['6', '6.º']];
  const cursoName = (c) => (CURSOS.find((x) => x[0] === c) || [])[1];
  const forAge = (s, p) => (p.curso && s.grades ? s.grades.includes(p.curso) : !s.ages || (p.age >= s.ages[0] && p.age <= s.ages[1]));
  const cursoChips = (sel) => `<div class="ages cursos">${CURSOS.map(([id, name]) => `<button class="age curso${id === sel ? ' sel' : ''}" data-c="${id}">${name}</button>`).join('')}</div>`;
  const littleOne = (p) => ['i3', 'i4', 'i5', '1'].includes(p.curso);
  // who is playing and in which school year, on every screen
  const whoChip = () => `<span class="who">${CH(me.avatar)}<b>${esc(me.name)}</b>${me.curso ? `<i>${cursoName(me.curso)}</i>` : ''}</span>`;

  // ---------- locks ----------
  // Terms open in order: a term opens when the previous term's exam is passed
  // (5 or more). Inside a term, a planet opens when the previous one is done
  // (every mission with at least one star) and the term exam when all planets
  // are done. The final exam opens when the three term exams are passed.
  // Anything already played stays open, so older progress is never hidden.
  const PASS = 5;
  const missionsOf = (u) => u.missions.filter((m) => !m.arcade);
  const unitStars = (sub, u) => u.missions.reduce((a, m) => a + (me.stars[starKey(sub, u, m)] || 0), 0);
  const unitDone = (sub, u) => missionsOf(u).every((m) => me.stars[starKey(sub, u, m)]);
  const passed = (key) => (me.exams[key] ?? -1) >= PASS;
  const termSecs = (sub) => sectionsOf(sub).filter((s) => !s.free);
  function secOpen(sub, sec) {
    if (sec.free) return true;
    if (sec.level !== undefined && sec.level <= myLevel()) return true;
    const terms = termSecs(sub), i = terms.indexOf(sec);
    return i <= 0 || passed(terms[i - 1].key) || unitsOf(sub, sec).some((u) => unitStars(sub, u)) || me.exams[sec.key] !== undefined;
  }
  function unitOpen(sub, u) {
    const sec = sectionsOf(sub).find((s) => !s.id || s.id === u.section);
    if (sec.free) return true;
    if (!secOpen(sub, sec)) return false;
    const units = unitsOf(sub, sec), i = units.indexOf(u);
    return i <= 0 || unitDone(sub, units[i - 1]) || unitStars(sub, u) > 0;
  }
  const examOpen = (sub, sec) => secOpen(sub, sec) && (unitsOf(sub, sec).every((u) => unitDone(sub, u)) || me.exams[sec.key] !== undefined);
  const finalOpen = (sub) => !!sub.final && (termSecs(sub).every((s) => passed(s.key)) || me.exams[sub.final.key] !== undefined);
  function toast(msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

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
      <button class="hud-brand" data-nav="home" title="Stud_IA · inicio">${S.brand.mark()}</button>
      <button class="me" data-nav="players" title="Cambiar de jugador"><span class="ava">${CH(me.avatar)}</span><span class="metext"><b>${esc(me.name)}</b><small>${me.curso ? `<em>${cursoName(me.curso)}</em> · ` : ''}${rank()} · cambiar ⇄</small></span></button>
      <button class="pill" data-nav="progress" title="Tu progreso">📊 <span class="hide-s">Progreso</span></button>
      <span class="pill hstars">⭐ ${totalStars()}</span><span class="pill">💎 ${fmt(me.crystals)}</span>
      <button class="icon" data-act="sound" aria-label="Sonido">${data.sound ? '🔊' : '🔇'}</button>
    </header>`;
  }
  function bindHud(redraw) {
    on('[data-nav="players"]', players);
    on('[data-nav="progress"]', progress);
    on('.hud [data-nav="home"]', home);
    on('[data-act="sound"]', () => { data.sound = !data.sound; store.save(); redraw(); });
  }

  // ---------------- players ----------------
  function start() {
    // avatars used to be emoji: switch them to the drawn characters
    data.players.forEach((p) => (p.avatar = S.charId(p.avatar)));
    store.save();
    me = store.player;
    if (!data.players.length) return editPlayer(null);
    // a player from an older version without a school year is asked for it when
    // he is picked, never before the "¿Quién juega?" screen; his progress is kept
    if (data.players.length === 1) {
      me = data.players[0];
      data.current = me.id;
      store.save();
      return me.curso ? home() : editPlayer(me);
    }
    players();
  }

  function players() {
    render(`<section class="picker">
      ${S.brand.logo('hero')}
      <h1 class="title3d">¿Quién juega?</h1>
      <div class="players">
        ${data.players.map((p) => `<div class="pcard" data-tilt>
          <button class="pplay" data-id="${p.id}"><span class="podium">${CH(p.avatar)}</span><b>${esc(p.name)}</b><small>${p.curso ? cursoName(p.curso) : 'falta tu curso'} · ⭐ ${totalStars(p)}</small></button>
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
      me.curso ? home() : editPlayer(me);
    });
    on('.pedit', (b) => editPlayer(byId(b.dataset.id)));
    on('.pnew', () => editPlayer(null));
  }

  // Same form for the first player, a new one, or one carried over from the
  // first version (setup: his progress is kept, only name/age/avatar are asked).
  function editPlayer(p) {
    const isNew = !p, setup = !!p && !p.curso, first = !data.players.length || (setup && data.players.length === 1);
    let avatar = p ? S.charId(p.avatar) : 'astro', curso = p ? p.curso || null : null;
    const unlocked = S.CHARS.filter((a) => a.need <= (p ? totalStars(p) : 0));
    render(`<section class="welcome">
      ${first ? '' : '<button class="icon back" aria-label="Volver">←</button>'}
      <div class="logo">${CH(avatar, 'happy')}</div>
      ${first && !setup ? S.brand.logo('hero') : `<h1>${setup ? 'Tu curso' : isNew ? 'Nuevo jugador' : 'Editar jugador'}</h1>`}
      ${setup ? `<p class="lead">¡Hola, ${esc(p.name)}! Tu progreso está guardado (⭐ ${totalStars(p)}). Solo falta que elijas tu curso.</p>`
        : first ? `<p class="lead">${S.brand.TAGLINE}</p>` : ''}
      <label>¿Cómo te llamas?<input id="name" maxlength="14" autocomplete="off" placeholder="Tu nombre" value="${esc(p ? p.name : '')}"></label>
      <p class="q">¿En qué curso estás?</p>
      ${cursoChips(curso)}
      <p class="q">Elige tu personaje</p>
      <div class="avatars">${unlocked.map((a) => `<button class="avatar${a.id === avatar ? ' sel' : ''}" data-e="${a.id}">${CH(a.id)}<small>${a.name}</small></button>`).join('')}</div>
      <button class="btn primary big" id="go">${isNew || setup ? '¡Despegar!' : 'Guardar'}</button>
      ${isNew || setup ? '' : '<button class="btn ghost del">🗑️ Borrar jugador</button>'}
    </section>`);
    on('.curso', (b) => {
      curso = b.dataset.c;
      $app.querySelector('.cursos').classList.remove('need');
      $app.querySelectorAll('.curso').forEach((x) => x.classList.toggle('sel', x === b));
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
      if (!curso) {
        const ages = $app.querySelector('.cursos');
        ages.classList.remove('need');
        void ages.offsetWidth; // restart the shake animation
        ages.classList.add('need');
        return sfx.bad();
      }
      const name = document.getElementById('name').value.trim() || `Jugador ${data.players.length + (isNew ? 1 : 0)}`;
      if (isNew) {
        p = store.newPlayer({ name, avatar, curso, asked: true });
        data.players.push(p);
      } else Object.assign(p, { name, avatar, curso, asked: true });
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
      <div class="home-brand">${S.brand.logo('hero')}</div>
      <div class="greet">
        <div class="hero-char">${CH(me.avatar, 'happy')}</div>
        <div class="greet-talk"><h1 class="title3d">¡Hola, ${esc(me.name)}!</h1><p>${cursoName(me.curso) ? `Estás en ${cursoName(me.curso)}. ` : ''}¿Qué galaxia exploramos hoy?</p>
          <button class="btn ghost small" data-nav="progress">📊 Ver mi progreso</button></div>
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
      <footer class="sig"><span>${S.brand.TAGLINE}</span></footer>
    </section>`);
    bindHud(home);
    on('.subject[data-sub]', (b) => map(S.subjects[b.dataset.sub]));
    on('button.avatar', (b) => { me.avatar = b.dataset.e; store.save(); home(); });
    if (littleOne(me)) speak(`¡Hola, ${me.name}! Elige un juego.`);
  }

  // ---------------- planet map ----------------
  // Each term is a compact zigzag grid of planets joined by a dotted trail, so a
  // whole term fits on one screen. Only the current term is open; the others fold
  // (tap to open). Planets have faces: sleepy before you start, smiling while you
  // play, sunglasses when finished. Locked planets show a padlock.
  function planetFace(state) {
    const O = '#24164f';
    if (state === 'done') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M14 18 H86 L82 32 Q70 40 58 32 L54 24 H46 L42 32 Q30 40 18 32 Z" fill="${O}"/><path d="M22 22 L30 22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M30 44 Q50 60 70 44" fill="#fff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/></svg>`;
    }
    if (state === 'sleep' || state === 'locked') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M22 26 Q31 34 40 26 M60 26 Q69 34 78 26" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="50" cy="46" rx="5" ry="4" fill="${O}"/>${state === 'sleep' ? '<text x="84" y="14" class="zz">z</text><text x="92" y="4" class="zz small">z</text>' : ''}</svg>`;
    }
    return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><g class="eyes"><circle cx="31" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="34" cy="27" r="5" fill="${O}"/><circle cx="69" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="72" cy="27" r="5" fill="${O}"/></g><path d="M36 42 Q50 54 64 42" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/></svg>`;
  }
  const BOSS_FACE = '<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M20 18 L42 26 M80 18 L58 26" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="32" r="7" fill="#ffd23f"/><circle cx="66" cy="32" r="7" fill="#ffd23f"/><path d="M34 48 Q50 40 66 48" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/></svg>';
  const examText = (sub, key) => {
    const best = me.exams[key];
    if (best === undefined) return 'Sin hacer';
    return youngS(sub, sectionsOf(sub).find((x) => x.key === key)) ? '★'.repeat(examStars(best)) : `Nota: ${best}${best >= PASS ? ' ✅' : ' · necesitas un 5'}`;
  };
  let openSecs = {}; // which terms the player unfolded, per subject
  function map(sub) {
    const terms = sectionsOf(sub);
    // the level of the player's school year comes first; otherwise the first open term not passed
    const current = terms.find((s) => s.level !== undefined && s.level === myLevel())
      || terms.find((s) => !s.free && secOpen(sub, s) && !passed(s.key)) || terms[0];
    const isOpen = (sec) => (openSecs[sub.id] && sec.key in openSecs[sub.id] ? openSecs[sub.id][sec.key] : sec === current);
    const pool = current.id ? unitsOf(sub, current) : sub.units;
    const here = pool.find((u) => unitOpen(sub, u) && !unitDone(sub, u) && u.section !== 'arcade');
    const node = (u) => {
      const got = unitStars(sub, u), max = u.missions.length * 3, open = unitOpen(sub, u);
      const state = !open ? 'locked' : got === max ? 'done' : got ? 'play' : 'sleep';
      const st = Math.round((got / max) * 3);
      return `<button class="gnode ${state}${u === here ? ' here' : ''}" data-u="${u.id}" style="--c:${u.color}" ${open ? '' : 'aria-disabled="true"'}>
        <span class="orb">${planetFace(state)}<span class="badge">${open ? u.emoji : '🔒'}</span>${u === here ? `<span class="me-on">${CH(me.avatar, 'happy')}</span>` : ''}</span>
        <span class="tag"><b>${u.planet}</b><small>${unitLabel(sub, u)}</small><span class="pst">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></span>
      </button>`;
    };
    const boss = (sec, isFinal) => {
      const ex = isFinal ? sub.final : examOf(sub, sec), key = isFinal ? sub.final.key : sec.key;
      const open = isFinal ? finalOpen(sub) : examOpen(sub, sec);
      return `<button class="gnode boss${isFinal ? ' final' : ''}${open ? '' : ' locked'}" data-exam="${key}" ${open ? '' : 'aria-disabled="true"'}>
        <span class="orb"><span class="swirl"></span>${isFinal ? '<span class="trophy">🏆</span>' : BOSS_FACE}<span class="badge">${open ? (isFinal ? '🏆' : '📝') : '🔒'}</span></span>
        <span class="tag boss-tag"><b>${ex.title}</b><small>${ex.rounds} preguntas</small><span class="pst">${open ? examText(sub, key) : '🔒 Completa los planetas'}</span></span>
      </button>`;
    };
    const term = (sec) => {
      const units = unitsOf(sub, sec), open = secOpen(sub, sec), unfolded = open && isOpen(sec);
      const got = units.reduce((a, u) => a + unitStars(sub, u), 0), max = units.reduce((a, u) => a + u.missions.length * 3, 0);
      const terms2 = termSecs(sub), prev = terms2[terms2.indexOf(sec) - 1];
      const status = sec.free ? '¡Siempre abierto!' : !open ? `🔒 Aprueba el ${examOf(sub, prev).title.replace('Examen del ', 'examen del ')} para abrirlo`
        : passed(sec.key) ? `✅ Aprobado · nota ${me.exams[sec.key]}` : `⭐ ${got} / ${max}`;
      return `<section class="term${open ? '' : ' locked'}${unfolded ? ' open' : ''}" data-key="${sec.key}">
        ${sec.title ? `<button class="termhead" data-fold="${sec.key}" ${open ? '' : 'aria-disabled="true"'}>
          <span class="tname">${sec.emoji || ''} ${sec.title}</span>${sec.subtitle ? `<small>${sec.subtitle}</small>` : ''}
          <span class="tstatus">${status}</span>${open ? `<span class="tbar"><i style="width:${max ? (got / max) * 100 : 0}%"></i></span>` : ''}
          ${open ? `<span class="fold">${unfolded ? '▲' : '▼'}</span>` : ''}
        </button>` : ''}
        ${unfolded ? `<div class="grid">${units.map(node).join('')}${sec.exam === false ? '' : boss(sec)}<svg class="gtrail" aria-hidden="true"></svg></div>` : ''}
      </section>`;
    };
    render(`${hud()}<section class="map">
      <h1 class="title3d">${sub.emoji} ${sub.title}</h1>
      <div class="ufo" aria-hidden="true">${CH('ovni')}</div>
      ${terms.filter((s) => !s.free).map(term).join('')}
      ${sub.final ? `<section class="term final open"><div class="grid single">${boss(null, true)}</div>
        ${finalOpen(sub) ? '' : '<p class="lead center">🔒 Se abre al aprobar los exámenes de los tres trimestres.</p>'}</section>` : ''}
      ${terms.filter((s) => s.free).map(term).join('')}
    </section>`);
    bindHud(() => map(sub));
    layoutGrids();
    on('.gnode[data-u]', (b) => {
      const u = sub.units.find((x) => x.id === b.dataset.u);
      if (unitOpen(sub, u)) return sheet(sub, u);
      sfx.bad();
      const units = sub.units.filter((x) => x.section === u.section), prev = units[units.indexOf(u) - 1];
      const msg = prev ? `🔒 Primero completa <b>${prev.planet}</b> (todas sus misiones con al menos una ⭐).` : '🔒 Este trimestre todavía está cerrado.';
      toast(msg);
      if (youngU(sub, u)) speak(msg);
    });
    on('.gnode[data-exam]', (b) => {
      const key = b.dataset.exam, isFinal = sub.final && key === sub.final.key;
      if (isFinal) return finalOpen(sub) ? startExam(sub, null, true) : (sfx.bad(), toast('🔒 Aprueba los exámenes de los tres trimestres para abrir el examen final.'));
      const sec = terms.find((s) => s.key === key);
      if (examOpen(sub, sec)) return startExam(sub, sec);
      sfx.bad();
      toast('🔒 Completa todos los planetas del trimestre para abrir su examen.');
    });
    on('.termhead', (b) => {
      const sec = terms.find((s) => s.key === b.dataset.fold);
      if (!secOpen(sub, sec)) { sfx.bad(); return toast(b.querySelector('.tstatus').innerHTML); }
      openSecs[sub.id] = openSecs[sub.id] || {};
      openSecs[sub.id][sec.key] = !isOpen(sec);
      sfx.tap();
      const y = window.scrollY;
      map(sub);
      window.scrollTo(0, y);
    });
  }
  // zigzag rows (left→right, then right→left…) and the dotted trail between planets
  function layoutGrids() {
    $app.querySelectorAll('.grid:not(.single)').forEach((grid) => {
      const nodes = [...grid.querySelectorAll('.gnode')], w = grid.clientWidth;
      const cols = Math.max(3, Math.min(6, Math.floor(w / 128)));
      grid.style.setProperty('--cols', cols);
      nodes.forEach((n, i) => {
        const row = Math.floor(i / cols), k = i % cols;
        n.style.gridRow = row + 1;
        n.style.gridColumn = (row % 2 ? cols - k : k + 1);
      });
      const svgEl = grid.querySelector('.gtrail'), g = grid.getBoundingClientRect();
      const pts = nodes.map((n) => { const r = n.querySelector('.orb').getBoundingClientRect(); return [r.left + r.width / 2 - g.left, r.top + r.height / 2 - g.top]; });
      svgEl.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
      svgEl.innerHTML = `<path d="${d}" class="trail-glow"/><path d="${d}" class="trail-dots"/>`;
    });
  }
  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => $app.querySelector('.grid') && layoutGrids(), 120); });

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
    if (youngU(sub, u)) speak(u.planet);
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
  // a term exam asks about that term's planets; the final exam about the whole course
  function startExam(sub, sec, isFinal) {
    if (isFinal) sec = { key: sub.final.key, final: true };
    sec = sec || sectionsOf(sub)[0];
    const ex = isFinal ? sub.final : examOf(sub, sec);
    const units = isFinal ? sub.units.filter((u) => u.section !== 'arcade') : unitsOf(sub, sec);
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
      ${whoChip()}
      <h2 class="title3d">${from === to ? `Siguiente misión en ${to.planet}` : `Rumbo a ${to.planet}`} ${to.emoji}</h2>
      <div class="rhost"></div>
    </section>`);
    S.runner($app.querySelector('.rhost'), {
      avatar: me.avatar, target: to, young: youngU(sub, to), seconds: youngU(sub, to) ? 12 : 14,
      onEnd: (gems) => { me.crystals += gems; store.save(); then(); },
    });
  }

  function play(ses) {
    const arcade = ses.arcade, young = ses.exam ? youngS(ses.sub, ses.sec) : youngU(ses.sub, ses.unit);
    ses.young = young;
    ses.rankBefore = rank();
    const total = arcade ? Infinity : ses.queue.length;
    const log = []; // per round: { unit, first, solved }
    let i = 0, combo = 0, earned = 0, widget = null, ch = null, waitingNext = false, over = false, endAt = 0, concepts = [];

    render(`<section class="play${young ? ' young' : ''}${arcade ? ' arcade' : ''}" style="--c:${ses.color}">
      <header class="topbar">
        <button class="icon quit" aria-label="Salir">✕</button>
        ${whoChip()}
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
      concepts = S.concepts(`${ch.prompt} ${ch.hint || ''} ${ch.html || ''}`);
      q('.hint').hidden = ses.exam || (!ch.hint && !concepts.length);
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
        const terms = termSecs(ses.sub), nextTerm = ses.sec.final ? null : terms[terms.indexOf(terms.find((t) => t.key === key)) + 1];
        const unlock = nota < PASS ? `<div class="levelup warn">Necesitas un ${PASS} para aprobar${nextTerm ? ` y abrir el ${nextTerm.title}` : ''}. ¡Repasa y vuelve a intentarlo!</div>`
          : ses.sec.final ? '<div class="levelup">🏆 ¡Has aprobado el curso entero!</div>'
            : nextTerm ? `<div class="levelup">🔓 ¡Se abre el ${nextTerm.title}!</div>`
              : ses.sub.final ? '<div class="levelup">🔓 ¡Ya puedes hacer el examen final de curso!</div>' : '';
        result({
          ses, earned,
          head: young ? (stars === 3 ? '¡Reto superado!' : stars === 2 ? '¡Muy bien!' : '¡Buen intento!')
            : nota >= 9 ? '¡Examen espectacular!' : nota >= 7 ? '¡Muy buen examen!' : nota >= 5 ? '¡Aprobado!' : 'Hay que entrenar un poco más',
          big: (young ? bigStars(stars) : `<div class="nota">${nota}<small>/ 10</small></div>`) + unlock,
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
    // the hint, plus what the key words of the question mean
    q('.hint').addEventListener('click', () => {
      const defs = concepts.map(([t, d]) => `<span class="concept"><b>📘 ${t}:</b> ${d}</span>`).join('');
      q('.btext').innerHTML = `${ch.hint ? `<span class="hintline">💡 ${ch.hint}</span>` : ''}${defs}`;
      q('.bubble').hidden = false;
      if (young) speak(ch.hint || concepts.map(([t, d]) => `${t}: ${d}`).join('. '));
    });
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
    let nextUp = null, examUp = null;
    if (!ses.exam) {
      const ms = ses.unit.missions, mi = ms.indexOf(ses.mission);
      const ui = ses.sub.units.indexOf(ses.unit), nu = ses.sub.units[ui + 1];
      if (mi < ms.length - 1) nextUp = { u: ses.unit, m: ms[mi + 1] };
      else if (nu && nu.section === ses.unit.section && unitOpen(ses.sub, nu)) nextUp = { u: nu, m: nu.missions[0] };
      else {
        const sec = sectionsOf(ses.sub).find((x) => !x.id || x.id === ses.unit.section);
        if (sec && sec.exam !== false && examOpen(ses.sub, sec) && me.exams[sec.key] === undefined) examUp = sec;
      }
    }
    render(`<section class="result">
      ${whoChip()}
      <div class="hero-char big">${CH(me.avatar, r.party ? 'happy' : 'idle')}</div>
      <h1>${r.head}</h1>
      ${r.big}
      ${rank() !== ses.rankBefore ? `<div class="levelup">🎖️ ¡Has subido de rango! Ahora eres <b>${rank()}</b></div>` : ''}
      <div class="rbody">${r.body}</div>
      <p class="pill">💎 +${r.earned} cristales</p>
      <div class="rbtns">
        ${nextUp ? `<button class="btn primary" data-act="next">Siguiente: ${nextUp.m.title} ➜</button>` : ''}
        ${examUp ? `<button class="btn primary" data-act="exam">📝 ¡Al ${examOf(ses.sub, examUp).title.replace('Examen', 'examen')}! ➜</button>` : ''}
        <button class="btn ${nextUp || examUp ? 'ghost' : 'primary'}" data-act="again">🔁 ${ses.exam ? 'Otra vez' : 'Repetir'}</button>
        <button class="btn ghost" data-act="map">🪐 Volver al mapa</button>
      </div>
    </section>`);
    if (r.party) { sfx.win(); fx.confetti(60); }
    if (ses.young) speak(r.head);
    const goNext = () => travel(ses.sub, ses.unit, nextUp.u, () => startMission(ses.sub, nextUp.u, nextUp.m));
    on('[data-act="next"]', goNext);
    on('[data-act="exam"]', () => startExam(ses.sub, examUp));
    keyHandler = (e) => {
      if (nextUp && (e.key === 'ArrowRight' || e.key === 'Enter')) { e.preventDefault(); goNext(); }
    };
    on('[data-act="again"]', () => (ses.exam ? startExam(ses.sub, ses.sec.final ? null : ses.sec, !!ses.sec.final) : startMission(ses.sub, ses.unit, ses.mission)));
    on('[data-act="map"]', () => map(ses.sub));
    on('.chip[data-u]', (b) => { map(ses.sub); sheet(ses.sub, ses.sub.units.find((u) => u.id === b.dataset.u)); });
  }

  // ---------------- progress ----------------
  // One screen with where the player is: each subject of his school year (and any
  // other he has played), its terms with stars and exam marks, and the next step.
  function progress() {
    const all = Object.values(S.subjects);
    const played = (s) => s.units.some((u) => unitStars(s, u));
    // the player's own course first, then the rest of his school year, then anything else he played
    const score = (s) => (s.final && forAge(s, me) ? 0 : forAge(s, me) ? 1 : 2);
    const subs = all.filter((s) => forAge(s, me) || played(s)).sort((a, b) => score(a) - score(b));
    const nextStep = (s) => {
      const u = s.units.find((x) => x.section !== 'arcade' && unitOpen(s, x) && !unitDone(s, x));
      if (u) return `Siguiente planeta: <b>${u.emoji} ${u.planet}</b>`;
      const sec = termSecs(s).find((x) => examOpen(s, x) && !passed(x.key));
      if (sec) return `Te toca: <b>📝 ${examOf(s, sec).title}</b>`;
      if (s.final && finalOpen(s) && !passed(s.final.key)) return 'Te toca: <b>🏆 Examen final de curso</b>';
      return s.final && passed(s.final.key) ? '<b>🏆 ¡Curso completado!</b>' : '';
    };
    const card = (s) => {
      const units = s.units.filter((u) => u.section !== 'arcade');
      const got = units.reduce((a, u) => a + unitStars(s, u), 0), max = units.reduce((a, u) => a + u.missions.length * 3, 0);
      const rows = termSecs(s).map((sec) => {
        const us = unitsOf(s, sec), open = secOpen(s, sec);
        const g = us.reduce((a, u) => a + unitStars(s, u), 0), m = us.reduce((a, u) => a + u.missions.length * 3, 0);
        return `<div class="prow${open ? '' : ' locked'}">
          <div class="phead"><b>${sec.emoji || '🪐'} ${sec.title || 'Planetas'}</b><span>${!open ? '🔒 Cerrado' : sec.exam === false ? '' : `Examen: ${examText(s, sec.key)}`}</span></div>
          <span class="tbar"><i style="width:${m ? (g / m) * 100 : 0}%"></i></span>
          <div class="pchips">${us.map((u) => `<span class="pchip${unitOpen(s, u) ? (unitDone(s, u) ? ' done' : '') : ' locked'}" title="${u.planet}">${unitOpen(s, u) ? u.emoji : '🔒'}<i>${unitStars(s, u)}/${u.missions.length * 3}</i></span>`).join('')}</div>
        </div>`;
      }).join('');
      return `<article class="pcardp">
        <div class="ptop"><span class="semoji">${s.emoji}</span><div><h2>${s.title}</h2><small>⭐ ${got} / ${max} · ${max ? Math.round((got / max) * 100) : 0} %</small></div>
          <button class="btn primary small" data-sub="${s.id}">Ir al mapa ➜</button></div>
        <span class="tbar big"><i style="width:${max ? (got / max) * 100 : 0}%"></i></span>
        <p class="next">${nextStep(s)}</p>
        ${rows}
        ${s.final ? `<div class="prow final${finalOpen(s) ? '' : ' locked'}"><div class="phead"><b>🏆 Examen final de curso</b><span>${finalOpen(s) ? examText(s, s.final.key) : '🔒 Aprueba los tres trimestres'}</span></div></div>` : ''}
      </article>`;
    };
    render(`${hud()}<section class="progress">
      <div class="greet"><div class="hero-char">${CH(me.avatar, 'happy')}</div>
        <div class="greet-talk"><h1 class="title3d">Tu progreso</h1><p>${esc(me.name)} · ${cursoName(me.curso) || ''} · ${rank()} · ⭐ ${totalStars()} · 💎 ${fmt(me.crystals)}</p></div></div>
      ${subs.map(card).join('') || '<p class="lead">Todavía no has jugado. ¡Elige una galaxia y empieza!</p>'}
      <button class="btn ghost" data-nav="home">🏠 Volver al inicio</button>
    </section>`);
    bindHud(progress);
    on('.progress > [data-nav="home"]', home);
    on('.pcardp [data-sub]', (b) => map(S.subjects[b.dataset.sub]));
  }

  fx.starfield();
  S.brandIntro();
  start();
})();
