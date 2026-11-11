// Screens and game flow: players → home → planet map → mission / exam → results.
(function () {
  const S = window.StudIA, { store, sfx, fx, fmt, R, speak } = S;
  const data = store.data;
  const $app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let me = store.player; // the player who is playing now

  const AVATARS = [
    { e: '🚀', need: 0 }, { e: '🧑‍🚀', need: 0 }, { e: '🤖', need: 0 }, { e: '🐶', need: 0 }, { e: '🐱', need: 0 }, { e: '🦄', need: 0 },
    { e: '🛸', need: 6 }, { e: '👾', need: 15 }, { e: '🦊', need: 25 }, { e: '🐙', need: 40 }, { e: '🦖', need: 50 }, { e: '🐉', need: 65 },
  ];
  const RANKS = [[0, 'Cadete'], [10, 'Piloto'], [25, 'Capitán'], [40, 'Comandante'], [55, 'Leyenda galáctica']];
  const DEFAULT_EXAM = { title: 'Agujero Negro: el Examen', label: 'Simulacro', emoji: '🕳️', rounds: 10 };
  const examOf = (sub) => Object.assign({}, DEFAULT_EXAM, sub.exam);
  const examStars = (nota) => (nota >= 9 ? 3 : nota >= 6 ? 2 : 1);

  const starKey = (sub, u, m) => `${sub.id}.${u.id}.${m.id}`;
  const totalStars = (p) => Object.values((p || me).stars).reduce((a, b) => a + b, 0);
  const rank = () => RANKS.filter((r) => totalStars() >= r[0]).pop()[1];
  const starIcons = (n) => `<span class="st">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
  const forAge = (s, p) => !s.ages || (p.age >= s.ages[0] && p.age <= s.ages[1]);

  let keyHandler = null;
  document.addEventListener('keydown', (e) => { if (keyHandler) keyHandler(e); });
  function render(html) {
    keyHandler = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
    $app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  const on = (sel, fn) => $app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', () => fn(el)));

  function hud() {
    return `<header class="hud">
      <button class="me" data-nav="players" title="Cambiar de jugador"><span class="ava">${me.avatar}</span><span><b>${esc(me.name)}</b><small>${rank()} · cambiar ⇄</small></span></button>
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
      <div class="logo">🚀</div>
      <h1>¿Quién juega?</h1>
      <div class="players">
        ${data.players.map((p) => `<div class="pcard">
          <button class="pplay" data-id="${p.id}"><span class="ava big">${p.avatar}</span><b>${esc(p.name)}</b><small>${p.age ? `${p.age} años · ` : ''}⭐ ${totalStars(p)}</small></button>
          <button class="icon pedit" data-id="${p.id}" aria-label="Editar a ${esc(p.name)}">✏️</button>
        </div>`).join('')}
        <button class="pcard pnew"><span class="ava big">➕</span><b>Nuevo jugador</b><small>Para otro hermano</small></button>
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
    let age = p ? p.age : null, avatar = p ? p.avatar : '🚀';
    const unlocked = AVATARS.filter((a) => a.need <= (p ? totalStars(p) : 0));
    render(`<section class="welcome">
      ${first ? '' : '<button class="icon back" aria-label="Volver">←</button>'}
      <div class="logo">🚀</div>
      <h1>${first ? 'StudIA' : isNew ? 'Nuevo jugador' : 'Editar jugador'}</h1>
      ${!first ? '' : setup
        ? '<p class="lead">¡Nueva versión! Ahora pueden jugar varios hermanos. Tu progreso se guarda: solo confirma tus datos.</p>'
        : '<p class="lead">Una aventura espacial para aprender y preparar exámenes.</p>'}
      <label>¿Cómo te llamas?<input id="name" maxlength="14" autocomplete="off" placeholder="Tu nombre" value="${esc(p ? p.name : '')}"></label>
      <p class="q">¿Cuántos años tienes?</p>
      <div class="ages">${[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => `<button class="age${a === age ? ' sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="q">Elige tu personaje</p>
      <div class="avatars">${unlocked.map((a) => `<button class="avatar${a.e === avatar ? ' sel' : ''}" data-e="${a.e}">${a.e}</button>`).join('')}</div>
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
    return `<button class="subject" data-sub="${s.id}"><span class="semoji">${s.emoji}</span><b>${s.title}</b><small>${s.tagline}</small>
      <span class="bar"><i style="width:${(got / max) * 100}%"></i></span><small>⭐ ${got} / ${max}</small></button>`;
  }
  function home() {
    const all = Object.values(S.subjects);
    let mine = all.filter((s) => forAge(s, me));
    if (!mine.length) mine = all;
    const others = all.filter((s) => !mine.includes(s));
    const stars = totalStars();
    render(`${hud()}<section class="home">
      <h1>¡Hola, ${esc(me.name)}!</h1>
      <p class="lead">Elige tu misión de hoy.</p>
      <div class="subjects">${mine.map(subjectCard).join('')}
        <div class="subject ghost"><span class="semoji">🔭</span><b>Más galaxias</b><small>Pronto habrá nuevas asignaturas</small></div>
      </div>
      ${others.length ? `<h2>Otras galaxias</h2><div class="subjects small">${others.map(subjectCard).join('')}</div>` : ''}
      <h2>Tu hangar</h2>
      <div class="avatars">${AVATARS.map((a) => (a.need > stars
        ? `<span class="avatar locked" title="Necesitas ${a.need} estrellas">🔒<small>${a.need} ⭐</small></span>`
        : `<button class="avatar${a.e === me.avatar ? ' sel' : ''}" data-e="${a.e}">${a.e}</button>`)).join('')}</div>
    </section>`);
    bindHud(home);
    on('.subject[data-sub]', (b) => map(S.subjects[b.dataset.sub]));
    on('button.avatar', (b) => { me.avatar = b.dataset.e; store.save(); home(); });
    if (me.age < 7) speak(`¡Hola, ${me.name}! Elige un juego.`);
  }

  // ---------------- planet map ----------------
  function map(sub) {
    const best = me.exams[sub.id], ex = examOf(sub);
    const bestText = best === undefined ? (sub.young ? 'Preguntas de todos los planetas' : 'Sin pistas. ¿Te atreves?')
      : sub.young ? `Tu mejor resultado: ${'★'.repeat(examStars(best))}` : `Tu mejor nota: ${best} / 10`;
    render(`${hud()}<section class="map">
      <h1>${sub.emoji} ${sub.title}</h1>
      <div class="path">${sub.units.map((u) => {
        const got = u.missions.reduce((a, m) => a + (me.stars[starKey(sub, u, m)] || 0), 0), max = u.missions.length * 3;
        return `<button class="planet${got === max ? ' full' : ''}" data-u="${u.id}" style="--c:${u.color}">
          <span class="ball">${u.emoji}</span>
          <span class="ptext"><small>${sub.young ? u.title : `Unidad ${u.n} · ${u.title}`}</small><b>${u.planet}</b><span class="pst">⭐ ${got} / ${max}</span></span>
        </button>`;
      }).join('')}
        <button class="planet boss" data-exam style="--c:#3a2a6b">
          <span class="ball">${ex.emoji}</span>
          <span class="ptext"><small>${ex.label} · ${ex.rounds} preguntas</small><b>${ex.title}</b><span class="pst">${bestText}</span></span>
        </button>
      </div>
    </section>`);
    bindHud(() => map(sub));
    on('.planet[data-u]', (b) => sheet(sub, sub.units.find((u) => u.id === b.dataset.u)));
    on('.planet[data-exam]', () => startExam(sub));
  }

  function sheet(sub, u) {
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = `<div class="sheet" style="--c:${u.color}">
      <button class="icon close" aria-label="Cerrar">✕</button>
      <div class="shead"><span class="ball">${u.emoji}</span><div><small>${sub.young ? u.title : `Unidad ${u.n} · ${u.title}`}</small><h2>${u.planet}</h2></div></div>
      ${u.missions.map((m) => `<button class="mission" data-m="${m.id}">
        <span><b>${m.title}</b><small>${m.desc}</small></span>${starIcons(me.stars[starKey(sub, u, m)] || 0)}<span class="go">▶</span></button>`).join('')}
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
    const queue = Array.from({ length: m.rounds }, (x, i) => ({
      unit: u, make: () => m.gen(Math.min(2, Math.floor((i * 3) / m.rounds)), i),
    }));
    play({ sub, unit: u, mission: m, exam: false, queue, title: m.title, color: u.color });
  }
  function startExam(sub) {
    const ex = examOf(sub);
    const all = sub.units.flatMap((u) => u.missions.map((m) => ({ unit: u, make: () => m.gen(1) })));
    const queue = sub.units.map((u) => R.pick(all.filter((x) => x.unit === u)));
    while (queue.length < ex.rounds) queue.push(R.pick(all));
    play({ sub, exam: true, queue: R.shuffle(queue).slice(0, ex.rounds), title: ex.title, color: '#8b6cff' });
  }

  const CHEERS = ['¡Genial!', '¡Bravo!', '¡Así se hace!', '¡Perfecto!', '¡Qué máquina!', '¡Brillante!', '¡Muy bien!'];

  function play(ses) {
    const total = ses.queue.length, young = !!ses.sub.young;
    const log = []; // per round: { unit, first, solved }
    let i = 0, combo = 0, earned = 0, widget = null, ch = null, waitingNext = false;

    render(`<section class="play${young ? ' young' : ''}" style="--c:${ses.color}">
      <header class="topbar">
        <button class="icon quit" aria-label="Salir">✕</button>
        <div class="dots">${ses.queue.map(() => '<i></i>').join('')}</div>
        ${young ? '<button class="icon again" aria-label="Escuchar otra vez">🔊</button>' : ''}
        <span class="pill gems">💎 <b>0</b></span>
      </header>
      <div class="paper">
        <div class="ptitle"></div>
        <div class="prompt"></div>
        <div class="widget"></div>
      </div>
      <div class="bubble" hidden><span class="bot">🤖</span><span class="btext"></span></div>
      <div class="actions">
        <button class="btn ghost hint">💡 Pista</button>
        <button class="btn primary check" disabled>${young ? '✔ ¡Listo!' : 'Comprobar'}</button>
      </div>
      <div class="feedback" hidden>
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
      maxAttempts: ses.exam ? 1 : 2,
      ready: (b) => { q('.check').disabled = !b; },
      say,
      fail(msg) { sfx.bad(); say(msg || 'Casi… ¡inténtalo otra vez!'); },
      done(res) {
        log.push({ unit: ses.queue[i].unit, first: res.first, solved: res.solved });
        combo = res.first ? combo + 1 : 0;
        const gain = res.first ? 10 + (combo >= 3 ? 5 : 0) : res.solved ? 4 : 0;
        earned += gain;
        me.crystals += gain;
        store.save();
        q('.gems b').textContent = earned;
        dots[i].className = res.first ? 'ok' : res.solved ? 'meh' : 'bad';
        res.solved ? sfx.ok() : sfx.bad();
        if (res.first && (combo >= 3 || young)) fx.confetti(young ? 24 : 14);
        const fb = q('.feedback');
        const head = res.first ? R.pick(CHEERS) + (combo >= 3 ? ` 🔥 Racha de ${combo}` : '') : res.solved ? '¡Conseguido!' : 'Casi… mira cómo se hace';
        fb.className = 'feedback ' + (res.first ? 'ok' : res.solved ? 'meh' : 'bad');
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
      ch = ses.queue[i].make();
      waitingNext = false;
      dots[i].className = 'now';
      q('.ptitle').textContent = `${ses.title} · ${i + 1} de ${total}`;
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
      if (ses.exam) {
        const nota = Math.round((first / total) * 10);
        if (me.exams[ses.sub.id] === undefined || nota > me.exams[ses.sub.id]) me.exams[ses.sub.id] = nota;
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
      if (waitingNext) { if (e.key === 'Enter') { e.preventDefault(); next(); } return; }
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
      <div class="ava big">${me.avatar}</div>
      <h1>${r.head}</h1>
      ${r.big}
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
    on('[data-act="next"]', () => startMission(ses.sub, nextUp.u, nextUp.m));
    on('[data-act="again"]', () => (ses.exam ? startExam(ses.sub) : startMission(ses.sub, ses.unit, ses.mission)));
    on('[data-act="map"]', () => map(ses.sub));
    on('.chip[data-u]', (b) => { map(ses.sub); sheet(ses.sub, ses.sub.units.find((u) => u.id === b.dataset.u)); });
  }

  fx.starfield();
  start();
})();
