// Shared helpers: number formatting, random, saved progress, sounds, confetti.
(function () {
  const S = (window.StudIA = { subjects: {}, widgets: {} });

  // 12345 -> "12 345" (narrow no-break space, like the workbook)
  // 3.75 -> "3,75" (Spanish decimal comma)
  S.fmt = (n) => {
    const [int, dec] = String(Math.abs(n)).split('.');
    return (n < 0 ? '−' : '') + int.replace(/\B(?=(\d{3})+$)/g, ' ') + (dec ? ',' + dec : '');
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

  // ---- saved progress: several players on the same device ----
  const KEY = 'studia.v2', OLD_KEY = 'studia.v1';
  const newPlayer = (o) => Object.assign({
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: '', age: null, avatar: '🚀', crystals: 0, stars: {}, exams: {},
  }, o);
  const data = { players: [], current: null, sound: true };
  try {
    const saved = localStorage.getItem(KEY);
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    if (saved) {
      Object.assign(data, JSON.parse(saved));
      // a build of this version gave the migrated player age 9 without asking: ask him now
      if (old && old.name) data.players.forEach((p) => { if (!p.asked && p.name === old.name) p.age = null; });
    } else if (old && old.name) {
      // the first version had a single player: keep his progress, then ask his age
      const p = newPlayer({ name: old.name, avatar: old.avatar || '🚀', crystals: old.crystals || 0, stars: old.stars || {}, exams: old.exams || {} });
      data.players.push(p);
      data.current = p.id;
      data.sound = old.sound !== false;
    }
  } catch (e) { /* private mode or corrupted data: start fresh */ }
  S.store = {
    data,
    newPlayer,
    get player() { return data.players.find((p) => p.id === data.current) || null; },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    },
  };

  // ---- voice: reads questions aloud for children who can't read yet ----
  let voice = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voice = vs.find((v) => v.lang === 'es-ES' && /m[oó]nica|google/i.test(v.name))
      || vs.find((v) => v.lang === 'es-ES') || vs.find((v) => /^es/.test(v.lang)) || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  S.plain = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent
      .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}‍️⃣]/gu, '')
      .replace(/×/g, ' por ').replace(/−/g, ' menos ')
      .replace(/\s+/g, ' ').trim();
  };
  const esUtter = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.1;
    return u;
  };
  S.speak = (html) => {
    if (!data.sound || !window.speechSynthesis) return;
    const text = S.plain(html);
    speechSynthesis.cancel();
    if (!text) return;
    speechSynthesis.speak(esUtter(text));
  };

  // ---- English voice: the words children listen to in Inglés ----
  // British English first, then any English voice. Chosen on every call because
  // voices load late on some browsers. English audio ignores the sound switch:
  // it is the lesson itself, not decoration.
  let voicesKnown = false;
  if (window.speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', () => { voicesKnown = true; });
    setTimeout(() => { voicesKnown = true; }, 1000);
  }
  const enVoice = () => {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return vs.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB') || vs.find((v) => /^en[-_]/i.test(v.lang)) || null;
  };
  // 'ok': can speak English · 'none': cannot (show the words) · 'wait': still loading voices
  S.enStatus = () => (!window.speechSynthesis ? 'none' : enVoice() ? 'ok' : voicesKnown ? 'none' : 'wait');
  const enUtter = (text) => {
    const u = new SpeechSynthesisUtterance(text), v = enVoice();
    u.lang = v ? v.lang.replace('_', '-') : 'en-GB';
    if (v) u.voice = v;
    u.rate = 0.85;
    return u;
  };
  // Plays parts one after another: [{ es: html }, { en: 'sheep', start(), end() }].
  // Spanish parts stay silent with sound off; English parts always play.
  S.say = (parts) => {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    parts.forEach((p) => {
      let u = null;
      if (p.en) u = enUtter(p.en);
      else if (p.es && data.sound) { const t = S.plain(p.es); if (t) u = esUtter(t); }
      if (!u) return;
      if (p.start) u.onstart = p.start;
      if (p.end) { u.onend = p.end; u.onerror = p.end; }
      speechSynthesis.speak(u);
    });
  };
  S.speakEn = (text) => S.say([{ en: text }]);

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
    note: (i) => tone([330, 392, 494, 587, 659, 784][i % 6], 0, 0.32, 'triangle', 0.13),
    coin: () => { tone(988, 0, 0.07, 'square', 0.05); tone(1319, 0.06, 0.12, 'square', 0.05); },
    ok: () => { tone(660, 0, 0.12); tone(990, 0.1, 0.2); },
    bad: () => { tone(220, 0, 0.18, 'sawtooth', 0.06); tone(170, 0.14, 0.25, 'sawtooth', 0.06); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3)),
  };

  // ---- themes: the world a subject is played in ----
  // A subject says sub.theme ('space' if it says nothing). The map, exam node,
  // backdrop, wording and travel mini-game read it through S.themeOf(sub).
  //   node(state)   inside of a unit's orb: 'locked' | 'sleep' | 'play' | 'done'
  //   boss(isFinal) inside of the exam orb
  //   words         how the units are named: planeta / planetas / los planetas / todos los planetas…
  const O = '#24164f';
  const face = (state) => {
    if (state === 'done') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M14 18 H86 L82 32 Q70 40 58 32 L54 24 H46 L42 32 Q30 40 18 32 Z" fill="${O}"/><path d="M22 22 L30 22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M30 44 Q50 60 70 44" fill="#fff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/></svg>`;
    }
    if (state === 'sleep' || state === 'locked') {
      return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M22 26 Q31 34 40 26 M60 26 Q69 34 78 26" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="50" cy="46" rx="5" ry="4" fill="${O}"/>${state === 'sleep' ? '<text x="84" y="14" class="zz">z</text><text x="92" y="4" class="zz small">z</text>' : ''}</svg>`;
    }
    return `<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><g class="eyes"><circle cx="31" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="34" cy="27" r="5" fill="${O}"/><circle cx="69" cy="26" r="9" fill="#fff" stroke="${O}" stroke-width="3.5"/><circle cx="72" cy="27" r="5" fill="${O}"/></g><path d="M36 42 Q50 54 64 42" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/></svg>`;
  };
  const BOSS_FACE = '<svg viewBox="0 0 100 60" class="face" aria-hidden="true"><path d="M20 18 L42 26 M80 18 L58 26" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="32" r="7" fill="#ffd23f"/><circle cx="66" cy="32" r="7" fill="#ffd23f"/><path d="M34 48 Q50 40 66 48" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/></svg>';
  const PALM = '<svg viewBox="0 0 100 100" class="palm" aria-hidden="true"><path d="M58 88 Q62 60 52 30" fill="none" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><path d="M52 30 Q34 14 14 26 Q34 24 50 34 Q40 16 22 8 Q46 10 54 30 Q62 10 84 12 Q64 18 56 32 Q76 22 92 34 Q70 30 54 34 Z" fill="#2fd98a" stroke="' + O + '" stroke-width="3.5" stroke-linejoin="round"/><circle cx="50" cy="36" r="4" fill="#8a5a2b"/><circle cx="57" cy="35" r="4" fill="#8a5a2b"/></svg>';
  const SHIP = '<svg viewBox="0 0 120 90" class="ship" aria-hidden="true"><path d="M14 52 L106 44 L94 74 Q60 84 26 76 Z" fill="#7a4b2a" stroke="' + O + '" stroke-width="4" stroke-linejoin="round"/><path d="M60 48 L56 10" stroke="' + O + '" stroke-width="5" stroke-linecap="round"/><path d="M57 14 L84 22 L58 34 Z" fill="#e8e1cf" stroke="' + O + '" stroke-width="3" stroke-linejoin="round" opacity=".85"/><circle cx="36" cy="62" r="5" fill="#ffd23f" stroke="' + O + '" stroke-width="2.5"/><circle cx="58" cy="60" r="5" fill="#ffd23f" stroke="' + O + '" stroke-width="2.5"/><circle cx="80" cy="58" r="5" fill="#ffd23f" stroke="' + O + '" stroke-width="2.5"/><path d="M30 72 Q40 66 50 72" stroke="#2fd98a" stroke-width="3" fill="none"/></svg>';
  S.themes = {
    space: {
      id: 'space', words: { one: 'planeta', many: 'planetas', all: 'los planetas', every: 'todos los planetas', next: 'Siguiente planeta', icon: '🪐' },
      node: face,
      boss: (isFinal) => `<span class="swirl"></span>${isFinal ? '<span class="trophy">🏆</span>' : BOSS_FACE}`,
      exam: { title: 'Agujero Negro: el Examen', label: 'Simulacro', emoji: '🕳️', rounds: 10 },
      deco: (CH) => `<div class="ufo" aria-hidden="true">${CH('ovni')}</div>`,
      runner: 'jump', backdrop: 'stars',
    },
    ocean: {
      id: 'ocean', words: { one: 'isla', many: 'islas', all: 'las islas', every: 'todas las islas', next: 'Siguiente isla', icon: '🏝️' },
      node: (state) => PALM + face(state),
      boss: (isFinal) => (isFinal ? '<span class="trophy">🏆</span>' : `<span class="wreck">${SHIP}</span>`),
      exam: { title: 'El Barco Hundido: el Examen', label: 'Examen', emoji: '⚓', rounds: 10 },
      deco: () => '<div class="whale" aria-hidden="true">🐳</div>',
      runner: 'swim', backdrop: 'sea',
    },
  };
  S.themeOf = (sub) => S.themes[(sub && sub.theme) || 'space'] || S.themes.space;

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
    // underwater backdrop for the ocean theme: light rays and rising bubbles
    sea() {
      const host = document.getElementById('sea');
      if (!host) return;
      let html = '';
      for (let i = 0; i < 4; i++) html += `<i class="ray" style="left:${8 + i * 24}%;animation-delay:${-i * 2.3}s"></i>`;
      for (let i = 0; i < 26; i++) {
        const s = 6 + Math.random() * 16;
        html += `<i class="bub" style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${int(-40, 40)}px;animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s"></i>`;
      }
      host.innerHTML = html;
    },
  };
})();
