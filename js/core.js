// Shared helpers: number formatting, random, saved progress, sounds, confetti.
(function () {
  const S = (window.StudIA = { subjects: {}, widgets: {} });

  // 12345 -> "12 345" (narrow no-break space, like the workbook)
  S.fmt = (n) => {
    const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+$)/g, ' ');
    return (n < 0 ? '−' : '') + s;
  };

  const int = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  S.R = { int, shuffle, pick: (a) => a[int(0, a.length - 1)], sample: (a, n) => shuffle(a).slice(0, n) };

  // Digit-card challenges: slots is e.g. [3, '+', 3] or [5, '-', 1]
  S.cardsValue = (slots, digits) => {
    let k = 0, val = null, op = '+';
    for (const t of slots) {
      if (typeof t !== 'number') { op = t; continue; }
      let n = 0;
      for (let j = 0; j < t; j++) n = n * 10 + digits[k++];
      val = val === null ? n : op === '+' ? val + n : val - n;
    }
    return val;
  };
  S.cardsScore = (goal, v) => {
    if (v < 0) return -Infinity;
    return goal.kind === 'max' ? v : goal.kind === 'min' ? -v : -Math.abs(v - goal.target);
  };

  // ---- saved progress ----
  const KEY = 'studia.v1';
  const defaults = () => ({ name: '', avatar: '🚀', crystals: 0, stars: {}, exams: {}, sound: true });
  let data = defaults();
  try {
    data = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) { /* private mode or corrupted data: start fresh */ }
  S.store = {
    data,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    },
  };

  // ---- sounds (generated, no audio files) ----
  let actx = null;
  function tone(freq, start, dur, type, vol) {
    if (!data.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      const t = actx.currentTime + start;
      o.type = type || 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* no audio available */ }
  }
  S.sfx = {
    tap: () => tone(520, 0, 0.05, 'sine', 0.05),
    ok: () => { tone(660, 0, 0.12); tone(990, 0.1, 0.2); },
    bad: () => { tone(220, 0, 0.18, 'sawtooth', 0.06); tone(170, 0.14, 0.25, 'sawtooth', 0.06); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3)),
  };

  // ---- visual effects ----
  S.fx = {
    confetti(n) {
      const host = document.getElementById('fx');
      const colors = ['#ffd23f', '#2fd9a4', '#ff5a6e', '#58c4ff', '#8b6cff', '#ffffff'];
      for (let i = 0; i < (n || 40); i++) {
        const p = document.createElement('i');
        p.className = 'confetti';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = colors[i % colors.length];
        p.style.animationDuration = 1.4 + Math.random() * 1.4 + 's';
        p.style.animationDelay = Math.random() * 0.3 + 's';
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        host.appendChild(p);
        setTimeout(() => p.remove(), 3200);
      }
    },
    starfield() {
      const host = document.getElementById('stars');
      let html = '';
      for (let i = 0; i < 90; i++) {
        const s = 1 + Math.random() * 2;
        html += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-delay:${Math.random() * 4}s"></i>`;
      }
      host.innerHTML = html;
    },
  };
})();
