// Mini-game between missions: the player's avatar runs to the next planet, jumping
// over aliens and meteors and collecting crystals. About 12–15 seconds, skippable.
// No game over: bumping into something only costs a crystal (nothing for little ones).
// mode 'swim' (ocean theme): a submarine swims to the next island instead; it sinks
// slowly and rises on each tap, past jellyfish and sea mines, collecting pearls.
//   S.runner(host, { avatar, target: unit, young, seconds, mode: 'jump' | 'swim', onEnd(gems) })
(function () {
  const S = window.StudIA, { R, sfx } = S;

  S.runner = function (host, o) {
    const young = !!o.young, SPEED = young ? 190 : 260, END = SPEED * (o.seconds || 14), PX = 90;
    const GRAVITY = 2400, JUMP = [840, 720], hero = S.charImage(o.avatar);
    const swim = o.mode === 'swim', SINK = 520, MAX_SINK = 190, KICK = 330;
    host.innerHTML = `<div class="runner${swim ? ' swim' : ''}">
      <canvas aria-label="${swim ? 'Minijuego: esquiva medusas y minas y recoge perlas' : 'Minijuego: salta los obstáculos y recoge cristales'}"></canvas>
      <div class="rtop"><span class="pill">💎 <b>0</b></span><button type="button" class="btn ghost rskip">Saltar ⏭</button></div>
      <div class="rtip">${swim ? '👆 Toca o pulsa <b>espacio</b> para subir · el submarino baja solo' : '👆 Toca o pulsa <b>espacio</b> para saltar · ¡puedes saltar dos veces!'}</div>
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
      if (swim) {
        // a jellyfish or a mine somewhere in the water, pearls above or below it
        const LANES = [6, 70, 135, 200], h = R.pick(LANES), ph = R.pick(LANES.filter((y) => Math.abs(y - h) > 100));
        if (Math.random() < (young ? 0.4 : 0.65)) items.push({ x, rock: true, e: R.pick(['jelly', 'mine']), h: h === 6 ? 0 : h });
        for (let i = 0, n = R.int(2, 4); i < n; i++) items.push({ x: x + 50 + i * 46, e: Math.random() < 0.1 ? '💎' : 'pearl', h: ph });
      } else if (Math.random() < (young ? 0.35 : 0.6)) {
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
      if (over) return;
      if (swim) { vy = Math.min(KICK * 1.4, Math.max(vy, 0) + KICK); return sfx.tap(); }
      if (jumps >= 2) return;
      vy = JUMP[jumps++];
      sfx.tap();
    }
    function collide(it) {
      if (it.got) return;
      const sx = it.x - d + PX;
      if (Math.abs(sx - PX) > 26) return;
      const top = it.h + (it.rock ? 30 : 24);
      if (py + (swim ? 52 : 40) < it.h + 4 || py > top - 4) return;
      if (!it.rock) {
        it.got = true;
        gems += it.e === '⭐' || it.e === '💎' ? 3 : 1;
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
    // ---- underwater drawing (swim mode) ----
    function pearl(x, bottom) {
      const y = bottom - 12;
      const gr = c.createRadialGradient(x - 3, y - 3, 1, x, y, 10);
      gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#cfd8f0');
      c.fillStyle = gr;
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(36,22,79,.6)'; c.lineWidth = 2; c.stroke();
    }
    function mine(x, bottom) {
      const y = bottom - 18;
      c.strokeStyle = '#24164f'; c.lineWidth = 4;
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + t; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20); c.stroke(); }
      c.fillStyle = '#3b3f5c';
      c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = Math.floor(t * 3) % 2 ? '#ff4f8b' : '#ffd23f';
      c.beginPath(); c.arc(x - 4, y - 4, 4, 0, Math.PI * 2); c.fill();
    }
    function jelly(x, bottom) {
      const y = bottom - 24, wob = Math.sin(t * 4 + x) * 3;
      c.strokeStyle = '#c58bff'; c.lineWidth = 3; c.lineCap = 'round';
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 6, y + 6); c.quadraticCurveTo(x + k * 6 + wob, y + 16, x + k * 6 - wob, y + 26); c.stroke(); }
      c.fillStyle = '#ff9ee6'; c.strokeStyle = '#24164f'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y + 4, 18, 16, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#24164f';
      c.beginPath(); c.arc(x - 6, y - 2, 2.5, 0, Math.PI * 2); c.arc(x + 6, y - 2, 2.5, 0, Math.PI * 2); c.fill();
    }
    function submarine(cx, cy) {
      c.save();
      c.translate(cx, cy);
      c.rotate(Math.max(-0.25, Math.min(0.25, -vy / 1400)));
      c.fillStyle = '#ffd23f'; c.strokeStyle = '#24164f'; c.lineWidth = 4;
      c.beginPath(); c.ellipse(0, 0, 50, 26, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(-10, -40, 26, 18, 6); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(6, -40); c.lineTo(6, -52); c.lineTo(18, -52); c.stroke();
      // propeller
      const sp = Math.sin(t * 30) * 10;
      c.fillStyle = '#ff8a1f';
      c.beginPath(); c.ellipse(-56, 0, 5, Math.abs(sp) + 3, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      // porthole with the player inside
      c.fillStyle = '#9fe6ff';
      c.beginPath(); c.arc(14, 0, 20, 0, Math.PI * 2); c.fill();
      c.save(); c.clip();
      if (hero.complete && hero.naturalWidth) c.drawImage(hero, -8, -20, 44, 44);
      c.restore();
      c.lineWidth = 5; c.beginPath(); c.arc(14, 0, 20, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    function drawSea() {
      const g = H - 46, p = Math.min(1, d / END);
      const sea = c.createLinearGradient(0, 0, 0, H);
      sea.addColorStop(0, '#1d8fc4');
      sea.addColorStop(1, '#062a5c');
      c.fillStyle = sea;
      c.fillRect(0, 0, W, H);
      // light rays and bubbles (the stars, rising instead of drifting)
      c.fillStyle = 'rgba(200,245,255,.07)';
      for (let k = 0; k < 4; k++) { const x0 = ((k * 260 - d * 0.05) % (W + 260) + W + 260) % (W + 260) - 130; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 90, 0); c.lineTo(x0 + 220, H); c.lineTo(x0 + 120, H); c.fill(); }
      c.strokeStyle = 'rgba(220,250,255,.5)'; c.lineWidth = 1.5;
      STARS.forEach((s) => { const x = (((s.x - d * s.z) % W) + W) % W, y = ((s.y * H - t * 40 * (s.z + 0.2)) % H + H) % H; c.beginPath(); c.arc(x, y, s.r * 2, 0, Math.PI * 2); c.stroke(); });
      // the destination island grows as we get closer
      const pr = 24 + p * 50, pxp = W - 70 - p * 30, pyp = g * 0.35;
      c.fillStyle = '#ffe9b0';
      c.beginPath(); c.ellipse(pxp, pyp, pr * 1.3, pr * 0.7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = o.target.color;
      c.beginPath(); c.ellipse(pxp, pyp - pr * 0.2, pr * 0.9, pr * 0.45, 0, Math.PI, 0); c.fill();
      c.textBaseline = 'middle'; c.textAlign = 'center';
      c.font = `${pr}px sans-serif`;
      c.fillText(o.target.emoji, pxp, pyp - pr * 0.1);
      // sandy floor with seaweed
      c.fillStyle = '#e9c77a';
      c.fillRect(0, g, W, H - g);
      c.strokeStyle = '#2fd98a'; c.lineWidth = 6; c.lineCap = 'round';
      for (let k = -1; k < W / 140 + 2; k++) {
        const x = k * 140 - (d % 140) + 30;
        c.beginPath(); c.moveTo(x, g + 4); c.quadraticCurveTo(x + Math.sin(t * 2 + k) * 14, g - 30, x + Math.sin(t * 2 + k + 1) * 8, g - 54); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.fillRect(0, g, W, 4);
      c.fillStyle = 'rgba(0,0,0,.25)';
      c.fillRect(16, H - 16, W - 32, 6);
      c.fillStyle = '#fff';
      c.fillRect(16, H - 16, (W - 32) * p, 6);
      const fx = END + PX + 30 - d;
      if (fx < W + 40) emoji('🏁', fx, g + 2, 50);
      items.forEach((it) => {
        const x = it.x - d + PX;
        if (it.got || x < -40 || x > W + 40) return;
        const y = g - it.h + Math.sin(t * 3 + it.x) * 4;
        if (it.e === 'pearl') pearl(x, y);
        else if (it.e === 'mine') mine(x, y);
        else if (it.e === 'jelly') jelly(x, y);
        else emoji(it.e, x, y, it.rock ? 40 : 28);
      });
      c.globalAlpha = inv > 0 && Math.floor(t * 12) % 2 ? 0.35 : 1;
      submarine(PX, g - py - 30);
      c.globalAlpha = 1;
    }
    function draw() {
      if (swim) return drawSea();
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
        if (swim) {
          // sink gently, never faster than MAX_SINK; stay between the floor and the surface
          vy = Math.max(-MAX_SINK, vy - SINK * dt);
          py += vy * dt;
          const roof = H - 46 - 100;
          if (py <= 0) { py = 0; vy = Math.max(0, vy); }
          if (py >= roof) { py = roof; vy = Math.min(0, vy); }
        } else {
          vy -= GRAVITY * dt;
          py += vy * dt;
          if (py <= 0) { py = 0; vy = 0; jumps = 0; }
        }
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
    if (young) S.speak(swim ? '¡Toca la pantalla para subir!' : '¡Toca la pantalla para saltar!');
    raf = requestAnimationFrame(frame);
    return { close };
  };
})();
