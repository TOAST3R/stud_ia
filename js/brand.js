// Stud_IA brand: name, tagline, logo mark and wordmark, and the opening intro.
// The underscore is the signature: a blinking cursor (the "IA") that is also the
// launch pad of a small rocket. See docs/brand-guidelines.md.
(function () {
  const S = window.StudIA;
  const NAME = 'Stud_IA', TAGLINE = 'Aprende jugando, planeta a planeta.';

  // Mark: a glossy ringed planet with a rocket in orbit.
  const mark = (cls) => `<svg class="bmark ${cls || ''}" viewBox="0 0 120 120" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bm-p" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffb3d1"/><stop offset=".45" stop-color="#ff4f8b"/><stop offset="1" stop-color="#6d2fd6"/></radialGradient>
      <linearGradient id="bm-r" x1="0" x2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#2ed9a3"/></linearGradient>
      <clipPath id="bm-back"><rect x="0" y="0" width="120" height="60"/></clipPath>
    </defs>
    <ellipse cx="60" cy="62" rx="54" ry="15" fill="none" stroke="url(#bm-r)" stroke-width="7" transform="rotate(-18 60 62)" clip-path="url(#bm-back)"/>
    <circle cx="60" cy="60" r="34" fill="url(#bm-p)" stroke="#24164f" stroke-width="4"/>
    <path d="M38 48 Q46 32 62 30" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>
    <path d="M36 70 Q50 78 70 74" fill="none" stroke="#24164f" stroke-width="3" stroke-linecap="round" opacity=".25"/>
    <path d="M6 62 A54 15 0 0 0 114 62" fill="none" stroke="url(#bm-r)" stroke-width="7" transform="rotate(-18 60 62)"/>
    <g class="borbit"><g transform="translate(60 60)"><g transform="translate(0 -50) rotate(90)">
      <path d="M-9 0 Q0 -8 9 0 Q0 8 -9 0 Z" fill="#fff" stroke="#24164f" stroke-width="2.5"/>
      <circle cx="2" cy="0" r="2.3" fill="#3ec1ff"/><path d="M-9 0 L-16 -4 L-16 4 Z" fill="#ffd23f"/>
    </g></g></g>
  </svg>`;
  // Wordmark: "Stud" + the cursor underscore + holographic "IA".
  const wordmark = (cls) => `<span class="bword ${cls || ''}" aria-label="${NAME}"><span class="bw-stud">Stud</span><span class="bw-cursor" aria-hidden="true"></span><span class="bw-ia">IA</span></span>`;
  const logo = (cls) => `<div class="brand ${cls || ''}">${mark()}${wordmark()}</div>`;

  S.brand = { NAME, TAGLINE, mark, wordmark, logo };

  // Opening intro, once per visit: the planet lands, the word types itself.
  S.brandIntro = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try { if (sessionStorage.getItem('studia.intro')) return; sessionStorage.setItem('studia.intro', '1'); } catch (e) { /* ignore */ }
    const el = document.createElement('div');
    el.className = 'intro';
    el.innerHTML = `${logo('big')}<p class="intro-tag">${TAGLINE}</p>`;
    document.body.appendChild(el);
    const end = () => { el.classList.add('out'); setTimeout(() => el.remove(), 500); };
    el.addEventListener('click', end);
    setTimeout(end, 1900);
  };
})();
