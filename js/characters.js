// Playable characters, drawn in SVG (no emoji): chunky toy style with a thick ink
// outline. Every animal wears a glass space helmet. Moods: 'idle', 'happy', 'oops'.
//   S.CHARS            [{ id, name, need }]   need = stars to unlock
//   S.char(id, mood, cls)  → SVG string (eyes blink, antennas glow… via CSS)
//   S.charImage(id)    → Image, for the canvas mini-game
//   S.charId(value)    → id, also for avatars saved as emoji by older versions
(function () {
  const S = window.StudIA;
  const O = '#24164f';
  const st = (w) => `stroke="${O}" stroke-width="${w || 3.5}" stroke-linejoin="round" stroke-linecap="round"`;

  S.CHARS = [
    { id: 'astro', name: 'Astra', need: 0 }, { id: 'robot', name: 'Robi', need: 0 }, { id: 'cohete', name: 'Chispa', need: 0 },
    { id: 'perro', name: 'Laika', need: 0 }, { id: 'gata', name: 'Mishi', need: 0 }, { id: 'unicornio', name: 'Nube', need: 0 },
    { id: 'ovni', name: 'Zum', need: 6 }, { id: 'alien', name: 'Glup', need: 15 }, { id: 'zorro', name: 'Fuji', need: 25 },
    { id: 'pulpo', name: 'Ocho', need: 40 }, { id: 'dino', name: 'Rex', need: 50 }, { id: 'dragon', name: 'Brasa', need: 65 },
  ];
  const LEGACY = { '🚀': 'cohete', '🧑‍🚀': 'astro', '🤖': 'robot', '🐶': 'perro', '🐱': 'gata', '🦄': 'unicornio', '🛸': 'ovni', '👾': 'alien', '🦊': 'zorro', '🐙': 'pulpo', '🦖': 'dino', '🐉': 'dragon' };
  S.charId = (v) => (S.CHARS.some((c) => c.id === v) ? v : LEGACY[v] || 'astro');

  // ---------- shared parts ----------
  function eyes(x1, x2, y, r, mood) {
    if (mood === 'happy') {
      return `<path d="M${x1 - r} ${y + 2} Q${x1} ${y - r - 3} ${x1 + r} ${y + 2} M${x2 - r} ${y + 2} Q${x2} ${y - r - 3} ${x2 + r} ${y + 2}" fill="none" ${st(3.5)}/>`;
    }
    const dy = mood === 'oops' ? r * 0.3 : 0;
    const one = (x) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${st(3)}/><circle cx="${x + r * 0.15}" cy="${y + dy}" r="${r * 0.56}" fill="${O}"/><circle cx="${x + r * 0.38}" cy="${y + dy - r * 0.28}" r="${r * 0.22}" fill="#fff"/>`;
    return `<g class="eyes">${one(x1)}${one(x2)}</g>`;
  }
  function mouth(x, y, mood, w) {
    w = w || 8;
    if (mood === 'happy') return `<path d="M${x - w} ${y - 2} Q${x} ${y + w + 5} ${x + w} ${y - 2} Z" fill="#b5174f" ${st(3)}/><path d="M${x - w * 0.45} ${y + w * 0.62} Q${x} ${y + w * 0.15} ${x + w * 0.45} ${y + w * 0.62}" fill="#ff8fb1"/>`;
    if (mood === 'oops') return `<ellipse cx="${x}" cy="${y + 2}" rx="${w * 0.42}" ry="${w * 0.55}" fill="#b5174f" ${st(3)}/>`;
    return `<path d="M${x - w * 0.8} ${y} Q${x} ${y + w * 0.85} ${x + w * 0.8} ${y}" fill="none" ${st(3.2)}/>`;
  }
  const cheeks = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="5" ry="3.2" fill="#ff6f9f" opacity=".5"/><ellipse cx="${x2}" cy="${y}" rx="5" ry="3.2" fill="#ff6f9f" opacity=".5"/>`;
  const helmet = `<circle cx="60" cy="57" r="43" fill="rgba(190,225,255,.2)" ${st(3.5)}/><path d="M27 42 Q33 23 52 16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/><circle cx="88" cy="34" r="3" fill="#fff" opacity=".8"/>`;
  const suit = (c, trim) => `<path d="M28 120 Q28 94 60 94 Q92 94 92 120 Z" fill="${c}" ${st()}/><rect x="49" y="102" width="22" height="11" rx="3" fill="${trim}" ${st(2.5)}/><circle cx="54" cy="107.5" r="2" fill="${O}"/><circle cx="62" cy="107.5" r="2" fill="#ff4f8b"/>`;

  // ---------- characters ----------
  const DRAW = {
    astro: (m) => `
      <path d="M22 70 Q14 70 14 80 L14 98 Q14 104 22 104 L30 104 L30 70 Z" fill="#ff8a1f" ${st()}/>
      <path d="M98 70 Q106 70 106 80 L106 98 Q106 104 98 104 L90 104 L90 70 Z" fill="#ff8a1f" ${st()}/>
      ${suit('#eef2ff', '#ffd23f')}
      <circle cx="60" cy="54" r="40" fill="#eef2ff" ${st()}/>
      <line x1="60" y1="14" x2="60" y2="4" ${st(3)}/><circle class="ant" cx="60" cy="4" r="4.5" fill="#ffd23f" ${st(2.5)}/>
      <ellipse cx="60" cy="57" rx="29" ry="25" fill="#ffd0aa" ${st()}/>
      <path d="M33 50 Q40 28 60 30 Q82 28 87 52 Q74 40 62 44 Q50 38 33 50 Z" fill="#6b3a24" ${st(3)}/>
      ${eyes(49, 71, 59, 6, m)}${cheeks(41, 79, 67)}${mouth(60, 70, m, 7)}
      <path d="M38 40 Q46 32 56 32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
    robot: (m) => {
      const e = m === 'happy'
        ? `<path d="M42 54 Q48 46 54 54 M66 54 Q72 46 78 54" fill="none" stroke="#5ff7ff" stroke-width="4" stroke-linecap="round"/>`
        : `<g class="eyes"><rect x="42" y="${m === 'oops' ? 50 : 46}" width="12" height="${m === 'oops' ? 8 : 13}" rx="4" fill="#5ff7ff"/><rect x="66" y="${m === 'oops' ? 50 : 46}" width="12" height="${m === 'oops' ? 8 : 13}" rx="4" fill="#5ff7ff"/></g>`;
      const mo = m === 'happy' ? '<path d="M48 64 Q60 74 72 64" fill="none" stroke="#5ff7ff" stroke-width="4" stroke-linecap="round"/>' : m === 'oops' ? '<circle cx="60" cy="67" r="4" fill="none" stroke="#5ff7ff" stroke-width="3.5"/>' : '<path d="M50 66 H70" stroke="#5ff7ff" stroke-width="4" stroke-linecap="round"/>';
      return `
      <rect x="16" y="86" width="14" height="26" rx="7" fill="#22b88a" ${st()}/><rect x="90" y="86" width="14" height="26" rx="7" fill="#22b88a" ${st()}/>
      <rect x="32" y="82" width="56" height="40" rx="12" fill="#22b88a" ${st()}/><circle cx="60" cy="100" r="8" fill="#ffd23f" ${st(3)}/><path d="M60 100 L64 96" ${st(3)}/>
      <line x1="60" y1="22" x2="60" y2="10" ${st(3)}/><circle class="ant" cx="60" cy="8" r="6" fill="#ff4f8b" ${st(3)}/>
      <rect x="20" y="44" width="10" height="18" rx="4" fill="#ffd23f" ${st(3)}/><rect x="90" y="44" width="10" height="18" rx="4" fill="#ffd23f" ${st(3)}/>
      <rect x="26" y="20" width="68" height="62" rx="18" fill="#2ed9a3" ${st()}/>
      <rect x="34" y="32" width="52" height="42" rx="11" fill="#1d2a4a" ${st(3)}/>${e}${mo}
      <path d="M34 26 Q44 22 56 23" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`;
    },
    cohete: (m) => `
      <path class="flame" d="M48 98 Q60 128 72 98 Z" fill="#ffd23f" stroke="#ff8a1f" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 70 L20 94 L40 92 Z" fill="#ff4f5e" ${st()}/><path d="M82 70 L100 94 L80 92 Z" fill="#ff4f5e" ${st()}/>
      <path d="M60 6 Q90 30 84 98 L36 98 Q30 30 60 6 Z" fill="#f4f6ff" ${st()}/>
      <path d="M60 6 Q76 18 81 34 L39 34 Q44 18 60 6 Z" fill="#ff4f5e" ${st()}/>
      <circle cx="60" cy="56" r="15" fill="#3ec1ff" ${st()}/>${eyes(54, 66, 56, 4.5, m)}
      ${mouth(60, 80, m, 7)}<rect x="44" y="90" width="32" height="8" rx="3" fill="#8b5cf6" ${st(3)}/>
      <path d="M46 24 Q52 14 60 12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
    perro: (m) => `
      ${suit('#3ec1ff', '#fff')}
      <path d="M38 44 Q22 46 26 76 Q34 78 40 64 Z" fill="#8a5a33" ${st()}/><path d="M82 44 Q98 46 94 76 Q86 78 80 64 Z" fill="#8a5a33" ${st()}/>
      <circle cx="60" cy="60" r="25" fill="#d99a5b" ${st()}/>
      <ellipse cx="70" cy="52" rx="8" ry="7" fill="#b5763e"/>
      <ellipse cx="60" cy="71" rx="13" ry="10" fill="#f6dcb8" ${st(3)}/><ellipse cx="60" cy="65" rx="5.5" ry="4" fill="${O}"/>
      ${eyes(50, 70, 55, 5.5, m)}${mouth(60, 74, m, 6)}${cheeks(42, 78, 64)}${helmet}`,
    gata: (m) => `
      ${suit('#ff4f8b', '#ffd23f')}
      <path d="M38 50 L34 26 L54 40 Z" fill="#ffa24d" ${st()}/><path d="M82 50 L86 26 L66 40 Z" fill="#ffa24d" ${st()}/>
      <path d="M40 44 L38 32 L48 40 Z" fill="#ffb3c8"/><path d="M80 44 L82 32 L72 40 Z" fill="#ffb3c8"/>
      <circle cx="60" cy="60" r="25" fill="#ffad5e" ${st()}/>
      <path d="M54 38 L56 46 M60 37 L60 46 M66 38 L64 46" ${st(3)}/>
      <path d="M57 66 L63 66 L60 70 Z" fill="#ff6f9f" ${st(2.5)}/>
      <path d="M38 66 L28 64 M38 70 L28 72 M82 66 L92 64 M82 70 L92 72" ${st(2.5)}/>
      ${eyes(50, 70, 57, 6, m)}${m === 'idle' ? `<path d="M53 72 Q56.5 76 60 72 Q63.5 76 67 72" fill="none" ${st(3)}/>` : mouth(60, 73, m, 6)}${helmet}`,
    unicornio: (m) => `
      ${suit('#8b5cf6', '#ffd23f')}
      <path d="M34 48 Q22 60 30 80 Q36 66 40 58 Q30 70 34 48 Z" fill="#ff7ab8" ${st(3)}/>
      <path d="M40 40 Q26 46 30 64 Q36 52 46 48 Z" fill="#9b7bff" ${st(3)}/>
      <circle cx="60" cy="60" r="25" fill="#fff6ff" ${st()}/>
      <path d="M44 42 Q52 30 64 34 Q58 42 44 42 Z" fill="#ff7ab8" ${st(3)}/>
      <path d="M60 14 L52 40 L68 40 Z" fill="#ffd23f" ${st()}/><path d="M55 30 L64 27 M54 35 L66 32" ${st(2.5)}/>
      <path d="M78 42 L84 32 L86 46 Z" fill="#fff6ff" ${st(3)}/>
      ${eyes(50, 70, 58, 6, m)}<path d="M44 52 L42 49 M46 50 L45 47 M76 52 L78 49 M74 50 L75 47" ${st(2.5)}/>
      ${cheeks(42, 78, 67)}${mouth(60, 73, m, 6)}${helmet}`,
    ovni: (m) => `
      <path d="M44 50 Q44 26 60 26 Q76 26 76 50 Z" fill="rgba(190,225,255,.35)" ${st()}/>
      <ellipse cx="60" cy="48" rx="11" ry="12" fill="#7be35b" ${st(3)}/>${eyes(56, 64, 46, 3.5, m)}
      <path d="M50 34 Q54 28 60 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="60" cy="62" rx="50" ry="15" fill="#b9c3ff" ${st()}/>
      <ellipse cx="60" cy="57" rx="34" ry="8" fill="#d8ddff" stroke="none"/>
      <g class="lights"><circle cx="24" cy="64" r="4.5" fill="#ffd23f" ${st(2.5)}/><circle cx="42" cy="69" r="4.5" fill="#ff4f8b" ${st(2.5)}/><circle cx="60" cy="71" r="4.5" fill="#2ed9a3" ${st(2.5)}/><circle cx="78" cy="69" r="4.5" fill="#ffd23f" ${st(2.5)}/><circle cx="96" cy="64" r="4.5" fill="#ff4f8b" ${st(2.5)}/></g>
      <path class="beam" d="M44 78 L30 118 L90 118 L76 78 Z" fill="#fff9b0" opacity=".35"/>
      <text x="60" y="${m === 'happy' ? 104 : 106}" text-anchor="middle" font-size="16" font-weight="900" fill="${O}">${m === 'happy' ? '¡bip!' : m === 'oops' ? '¿?' : ''}</text>`,
    alien: (m) => `
      ${suit('#8b5cf6', '#2ed9a3')}
      <path d="M48 34 Q42 18 34 14" fill="none" ${st(3)}/><circle class="ant" cx="33" cy="13" r="5" fill="#ff4f8b" ${st(3)}/>
      <path d="M72 34 Q78 18 86 14" fill="none" ${st(3)}/><circle class="ant" cx="87" cy="13" r="5" fill="#ffd23f" ${st(3)}/>
      <path d="M60 30 Q88 30 86 60 Q84 86 60 88 Q36 86 34 60 Q32 30 60 30 Z" fill="#7be35b" ${st()}/>
      ${m === 'happy' ? eyes(48, 72, 54, 6, m) : `<g class="eyes">${[[46, 56], [60, 48], [74, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#fff" ${st(3)}/><circle cx="${x + 1}" cy="${y + (m === 'oops' ? 2 : 0)}" r="3.6" fill="${O}"/><circle cx="${x + 2.4}" cy="${y - 1.8}" r="1.4" fill="#fff"/>`).join('')}</g>`}
      ${mouth(60, 72, m, 7)}<circle cx="44" cy="70" r="2" fill="#4caf3a"/><circle cx="78" cy="68" r="2.5" fill="#4caf3a"/>${helmet}`,
    zorro: (m) => `
      ${suit('#2ed9a3', '#fff')}
      <path d="M38 48 L30 18 L56 38 Z" fill="#ff7a2e" ${st()}/><path d="M82 48 L90 18 L64 38 Z" fill="#ff7a2e" ${st()}/>
      <path d="M33 26 L30 18 L38 23 Z M87 26 L90 18 L82 23 Z" fill="${O}"/>
      <path d="M60 36 Q86 36 86 58 Q86 74 60 86 Q34 74 34 58 Q34 36 60 36 Z" fill="#ff7a2e" ${st()}/>
      <path d="M36 60 Q48 64 60 84 Q40 78 36 60 Z M84 60 Q72 64 60 84 Q80 78 84 60 Z" fill="#fff4e8"/>
      <ellipse cx="60" cy="72" rx="5" ry="3.6" fill="${O}"/>
      ${eyes(50, 70, 56, 5.5, m)}${mouth(60, 77, m, 5)}${helmet}`,
    pulpo: (m) => `
      ${[30, 46, 62, 78].map((x, i) => `<path class="tent" style="animation-delay:${i * -0.4}s" d="M${x + 4} 80 Q${x - 4} 98 ${x + 6} 108 Q${x + 14} 114 ${x + 8} 102" fill="none" stroke="#9a6cff" stroke-width="10" stroke-linecap="round"/><path d="M${x + 4} 80 Q${x - 4} 98 ${x + 6} 108" fill="none" stroke="${O}" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"/>`).join('')}
      <path d="M60 22 Q94 22 92 56 Q90 86 60 86 Q30 86 28 56 Q26 22 60 22 Z" fill="#9a6cff" ${st()}/>
      <circle cx="44" cy="38" r="4" fill="#c4a8ff"/><circle cx="76" cy="34" r="3" fill="#c4a8ff"/><circle cx="80" cy="46" r="2.5" fill="#c4a8ff"/>
      ${eyes(48, 72, 56, 8, m)}${cheeks(38, 82, 68)}${mouth(60, 70, m, 6)}
      <path d="M38 30 Q46 24 56 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
    dino: (m) => `
      ${suit('#ffd23f', '#ff4f8b')}
      <path d="M40 40 L44 28 L50 38 L56 24 L62 36 L70 26 L72 40 Z" fill="#2a9d5c" ${st(3)}/>
      <path d="M60 34 Q88 34 88 60 Q88 84 60 86 Q32 84 32 60 Q32 34 60 34 Z" fill="#47c96b" ${st()}/>
      <ellipse cx="60" cy="72" rx="20" ry="11" fill="#8be3a2" ${st(3)}/><circle cx="54" cy="68" r="1.8" fill="${O}"/><circle cx="66" cy="68" r="1.8" fill="${O}"/>
      ${eyes(48, 72, 52, 6, m)}
      ${m === 'happy' ? mouth(60, 76, m, 8) : `<path d="M48 77 Q60 82 72 77" fill="none" ${st(3)}/><path d="M52 78 L54 82 L56 79 M64 79 L66 82 L68 78" fill="#fff" ${st(2)}/>`}${helmet}`,
    dragon: (m) => `
      <path d="M30 56 Q8 40 14 18 Q24 32 34 30 Q30 44 40 50 Z" fill="#ff8a1f" ${st(3)}/><path d="M90 56 Q112 40 106 18 Q96 32 86 30 Q90 44 80 50 Z" fill="#ff8a1f" ${st(3)}/>
      ${suit('#24164f', '#ffd23f')}
      <path d="M44 40 Q38 24 46 16 Q46 28 52 36 Z M76 40 Q82 24 74 16 Q74 28 68 36 Z" fill="#fff1c9" ${st(3)}/>
      <path d="M60 34 Q88 34 86 62 Q84 84 60 86 Q36 84 34 62 Q32 34 60 34 Z" fill="#ff4f5e" ${st()}/>
      <path d="M48 46 Q60 40 72 46" fill="none" stroke="#ff8a8f" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="60" cy="72" rx="16" ry="10" fill="#ff8a8f" ${st(3)}/><circle cx="55" cy="69" r="2" fill="${O}"/><circle cx="65" cy="69" r="2" fill="${O}"/>
      ${eyes(49, 71, 56, 6, m)}${mouth(60, 77, m, 5)}
      <g class="smoke"><circle cx="76" cy="62" r="4" fill="#d9d4ff"/><circle cx="84" cy="56" r="5.5" fill="#d9d4ff"/></g>${helmet}`,
  };

  S.char = (id, mood, cls) => {
    id = S.charId(id);
    const delay = (id.charCodeAt(0) % 7) * -0.6;
    return `<svg class="char ${cls || ''}" data-char="${id}" viewBox="0 0 120 120" style="--d:${delay}s" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${DRAW[id](mood || 'idle')}</svg>`;
  };
  const cache = {};
  S.charImage = (id) => {
    id = S.charId(id);
    if (!cache[id]) {
      cache[id] = new Image();
      cache[id].src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(S.char(id));
    }
    return cache[id];
  };
})();
