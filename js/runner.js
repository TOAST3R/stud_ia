// Mini-game between missions: the player's avatar runs to the next planet, jumping
// over aliens and meteors and collecting crystals. About 12–15 seconds, skippable.
// No game over: bumping into something only costs a crystal (nothing for little ones).
//   S.runner(host, { avatar, target: unit, young, seconds, onEnd(gems) })
(function () {
  const S = window.StudIA, { R, sfx } = S;

  S.runner = function (host, o) {
    const young = !!o.young, SPEED = young ? 190 : 260, END = SPEED * (o.seconds || 14), PX = 90;
    const GRAVITY = 2400, JUMP = [840, 720], hero = S.charImage(o.avatar);
    host.innerHTML = `<div class="runner">
      <canvas aria-label="Minijuego: salta los obstáculos y recoge cristales"></canvas>
      <div class="rtop"><span class="pill">💎 <b>0</b></span><button type="button" class="btn ghost rskip">Saltar ⏭</button></div>
      <div class="rtip">👆 Toca o pulsa <b>espacio</b> para saltar · ¡puedes saltar dos veces!</div>
      <div class="rend" hidden></div>
    </div>`;
    const root = host.firstElementChild, canvas = root.querySelector('canvas'), c = canvas.getContext('2d');
    let W = 0, H = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ---- world: obstacles with a crystal arc above them, and rows of crystals ----
    const items = [];
    for (let x = 560; x < END - 260; x += R.int(young ? 320 : 240, young ? 440 : 360)) {
      if (Math.random() < (young ? 0.35 : 0.6)) {
        items.push({ x, rock: true, e: R.pick(['👾', '☄️']), h: 0 });
        [-56, 0, 56].forEach((dx, i) => items.push({ x: x + dx, e: '💎', h: i === 1 ? 128 : 92 }));
      } else {
        const h = R.pick([6, 6, 70, 125]);
        for (let i = 0, n = R.int(2, 4); i < n; i++) items.push({ x: x + i * 46, e: Math.random() < 0.1 ? '⭐' : '💎', h });
      }
    }
    const STARS = Array.from({ length: 70 }, () => ({ x: Math.random() * 2000, y: Math.random(), z: 0.05 + Math.random() * 0.3, r: 1 + Math.random() * 1.6, a: 0.3 + Math.random() * 0.6 }));

    let d = 0, py = 0, vy = 0, jumps = 0, inv = 0, gems = 0, t = 0, last = performance.now(), raf = 0, over = false, closed = false;
    const gemEl = root.querySelector('.pill b');

    function jump() {
      if (over || jumps >= 2) return;
      vy = JUMP[jumps++];
      sfx.tap();
    }
    function collide(it) {
      if (it.got) return;
      const sx = it.x - d + PX;
      if (Math.abs(sx - PX) > 26) return;
      const top = it.h + (it.rock ? 30 : 24);
      if (py + 40 < it.h + 4 || py > top - 4) return;
      if (!it.rock) {
        it.got = true;
        gems += it.e === '⭐' ? 3 : 1;
        sfx.coin();
      } else if (!inv) {
        inv = 1.2;
        if (!young && gems) gems--;
        sfx.bad();
        root.classList.remove('bonk');
        void root.offsetWidth;
        root.classList.add('bonk');
      }
      gemEl.textContent = gems;
    }
    function emoji(e, x, bottom, size) {
      c.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(e, x, bottom);
    }
    function draw() {
      const g = H - 54, p = Math.min(1, d / END);
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a0e2a');
      sky.addColorStop(1, '#2a2160');
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff';
      STARS.forEach((s) => { c.globalAlpha = s.a; c.fillRect((((s.x - d * s.z) % W) + W) % W, s.y * g, s.r, s.r); });
      c.globalAlpha = 1;
      // the destination planet grows as we get closer
      const pr = 24 + p * 50, pxp = W - 70 - p * 30, pyp = g * 0.4;
      c.fillStyle = o.target.color;
      c.shadowColor = o.target.color;
      c.shadowBlur = 30;
      c.beginPath(); c.arc(pxp, pyp, pr, 0, Math.PI * 2); c.fill();
      c.shadowBlur = 0;
      c.textBaseline = 'middle';
      c.font = `${pr}px sans-serif`;
      c.textAlign = 'center';
      c.fillText(o.target.emoji, pxp, pyp + 2);
      // ground with moving craters
      c.fillStyle = o.target.color;
      c.fillRect(0, g, W, H - g);
      c.fillStyle = 'rgba(0,0,0,.2)';
      for (let k = -1; k < W / 110 + 2; k++) { c.beginPath(); c.ellipse(k * 110 - (d % 110) + 40, g + 24, 22, 7, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.3)';
      c.fillRect(0, g, W, 4);
      // progress
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.fillRect(16, H - 16, W - 32, 6);
      c.fillStyle = '#fff';
      c.fillRect(16, H - 16, (W - 32) * p, 6);
      // finish flag, crystals and obstacles
      const fx = END + PX + 30 - d;
      if (fx < W + 40) emoji('🏁', fx, g + 2, 50);
      items.forEach((it) => {
        const x = it.x - d + PX;
        if (it.got || x < -40 || x > W + 40) return;
        emoji(it.e, x, g - it.h + (it.rock ? 2 : Math.sin(t * 5 + it.x) * 4), it.rock ? 40 : 28);
      });
      // the player (blinks after a bump)
      const bob = py === 0 && !over ? Math.abs(Math.sin(t * 12)) * 4 : 0;
      if (py > 0) emoji('🔥', PX - 6, g - py + 20, 22);
      c.globalAlpha = inv > 0 && Math.floor(t * 12) % 2 ? 0.35 : 1;
      if (hero.complete && hero.naturalWidth) c.drawImage(hero, PX - 30, g - py - bob - 58, 60, 60);
      else emoji('🧑‍🚀', PX, g - py - bob + 2, 46);
      c.globalAlpha = 1;
    }
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      t += dt;
      if (!over) {
        d += SPEED * dt;
        vy -= GRAVITY * dt;
        py += vy * dt;
        if (py <= 0) { py = 0; vy = 0; jumps = 0; }
        inv = Math.max(0, inv - dt);
        items.forEach(collide);
        if (d >= END) arrive();
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function arrive() {
      over = true;
      sfx.win();
      S.fx.confetti(40);
      const end = root.querySelector('.rend');
      end.innerHTML = `<div>¡Has llegado a <b>${o.target.planet}</b>! ${o.target.emoji}</div><div class="gain">+${gems} 💎</div><button type="button" class="btn primary big rgo">¡Vamos! ➜</button>`;
      end.hidden = false;
      end.querySelector('.rgo').addEventListener('click', close);
      if (young) S.speak(`¡Has llegado! Has conseguido ${gems} cristales.`);
    }
    function close() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('keydown', onKey);
      o.onEnd(gems);
    }
    function onKey(e) {
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); over ? close() : jump(); }
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && over) { e.preventDefault(); close(); }
    }
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
    root.querySelector('.rskip').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    if (young) S.speak('¡Toca la pantalla para saltar!');
    raf = requestAnimationFrame(frame);
    return { close };
  };
})();
