// Mates 5.º, part 2: everything added on top of units 3–10 (mates5.js).
//   · Cuadernillo 1 (Innovamat): the families' strategy pages and sessions 11–20.
//   · Resto del curso: the rest of the 5.º syllabus (fractions, decimals, divisibility,
//     powers and Roman numerals, geometry, measures, time, statistics).
//   · Arcade: timed games against the clock.
// Units say which section they belong to with `section`; the map groups them.
(function () {
  const S = window.StudIA, { R, fmt } = S;
  const sub = S.subjects.mates5;
  const cell = (i) => `{{${i}}}`;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (x, i) => a + i);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const frac = (n, d) => `<span class="frac"><i>${n}</i><i>${d}</i></span>`;
  const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  // one box: "html = [ ]"
  const one = (prompt, html, ans, extra) => Object.assign({
    type: 'cells', prompt, html: `<div class="eq big wrap">${html} = ${cell(0)}</div>`, cells: [{ ans }],
  }, extra);
  // multiple choice: the right label and some wrong ones (duplicates removed)
  const choose = (prompt, right, wrongs, extra) => {
    const labels = [...new Set([String(right), ...wrongs.map(String)])].slice(0, 4);
    return Object.assign({ type: 'choice', prompt, options: R.shuffle(labels).map((l) => ({ label: l, correct: l === String(right) })) }, extra);
  };

  // ---------- drawings (SVG) ----------
  const svg = (w, h, body, cls) => `<svg class="fig ${cls || ''}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
  function gridSquare(n, label) {
    const s = Math.min(18, Math.floor(200 / n)), size = n * s;
    let b = `<rect x="2" y="2" width="${size}" height="${size}" fill="#d9ccff" stroke="#6a4fe0" stroke-width="2"/>`;
    for (let i = 1; i < n; i++) b += `<line x1="${2 + i * s}" y1="2" x2="${2 + i * s}" y2="${2 + size}" stroke="#6a4fe0" stroke-width=".8"/><line x1="2" y1="${2 + i * s}" x2="${2 + size}" y2="${2 + i * s}" stroke="#6a4fe0" stroke-width=".8"/>`;
    if (label) b += `<text x="${2 + size / 2}" y="${size + 18}" text-anchor="middle" class="t">${n}</text>`;
    return svg(size + 4, size + (label ? 24 : 4), b);
  }
  function fracPic(n, k, kind) {
    const fill = (i) => (i < k ? '#ff9d3d' : '#fff');
    let b = '';
    if (kind === 'bar') {
      const w = 220 / n;
      for (let i = 0; i < n; i++) b += `<rect x="${4 + i * w}" y="4" width="${w}" height="56" fill="${fill(i)}" stroke="#1d2340" stroke-width="2"/>`;
      return svg(228, 64, b);
    }
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const p = (a) => `${(60 + 54 * Math.cos(a)).toFixed(2)},${(60 + 54 * Math.sin(a)).toFixed(2)}`;
      b += `<path d="M60,60 L${p(a0)} A54,54 0 ${1 / n > 0.5 ? 1 : 0} 1 ${p(a1)} Z" fill="${fill(i)}" stroke="#1d2340" stroke-width="2"/>`;
    }
    return svg(120, 120, b);
  }
  function clock(h, m) {
    let b = '<circle cx="60" cy="60" r="55" fill="#fff" stroke="#1d2340" stroke-width="4"/>';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
      b += `<text x="${(60 + 43 * Math.cos(a)).toFixed(1)}" y="${(60 + 43 * Math.sin(a) + 5).toFixed(1)}" text-anchor="middle" class="t small">${i}</text>`;
    }
    const hand = (deg, len, w, c) => { const a = ((deg - 90) * Math.PI) / 180; return `<line x1="60" y1="60" x2="${(60 + len * Math.cos(a)).toFixed(1)}" y2="${(60 + len * Math.sin(a)).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
    b += hand(((h % 12) + m / 60) * 30, 27, 6, '#1d2340') + hand(m * 6, 42, 3.5, '#ff5a6e') + '<circle cx="60" cy="60" r="4" fill="#1d2340"/>';
    return svg(120, 120, b, 'clock');
  }
  function angleFig(deg) {
    const a = (-deg * Math.PI) / 180, x = 70, y = 90;
    const end = `${(x + 100 * Math.cos(a)).toFixed(1)},${(y + 100 * Math.sin(a)).toFixed(1)}`;
    const arc = deg === 90
      ? `<path d="M${x + 18},${y} L${x + 18},${y - 18} L${x},${y - 18}" fill="none" stroke="#ff5a6e" stroke-width="3"/>`
      : `<path d="M${x + 24},${y} A24,24 0 ${deg > 180 ? 1 : 0} 0 ${(x + 24 * Math.cos(a)).toFixed(1)},${(y + 24 * Math.sin(a)).toFixed(1)}" fill="none" stroke="#ff5a6e" stroke-width="3"/>`;
    return svg(190, 110, `<line x1="${x}" y1="${y}" x2="${x + 110}" y2="${y}" stroke="#1d2340" stroke-width="4" stroke-linecap="round"/><polyline points="${x},${y} ${end}" fill="none" stroke="#1d2340" stroke-width="4" stroke-linecap="round"/>${arc}`);
  }
  // triangle from its 3 sides (a = BC, b = AC, c = AB); labels: sides or angles
  function triangleFig(a, b, c, labels) {
    const cx = (b * b + c * c - a * a) / (2 * c), cy = Math.sqrt(Math.max(0, b * b - cx * cx));
    const pts = [[0, 0], [c, 0], [cx, -cy]];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxY = Math.max(...ys), w = Math.max(...xs) - minX, h = maxY - Math.min(...ys);
    const k = Math.min(180 / w, 120 / h), P = pts.map(([x, y]) => [30 + (x - minX) * k, 140 - (maxY - y) * k - 10]);
    const ctr = [sum(P.map((p) => p[0])) / 3, sum(P.map((p) => p[1])) / 3];
    let body = `<polygon points="${P.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="#cfeaff" stroke="#1d2340" stroke-width="3"/>`;
    const out = (p, d) => { const dx = p[0] - ctr[0], dy = p[1] - ctr[1], l = Math.hypot(dx, dy) || 1; return [p[0] + (dx / l) * d, p[1] + (dy / l) * d]; };
    if (labels.sides) {
      [[1, 2, labels.sides[0]], [0, 2, labels.sides[1]], [0, 1, labels.sides[2]]].forEach(([i, j, t]) => {
        const m = out([(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2], 16);
        body += `<text x="${m[0].toFixed(1)}" y="${(m[1] + 5).toFixed(1)}" text-anchor="middle" class="t small">${t}</text>`;
      });
    }
    if (labels.angles) {
      P.forEach((p, i) => { const m = out(p, -22); body += `<text x="${m[0].toFixed(1)}" y="${(m[1] + 5).toFixed(1)}" text-anchor="middle" class="t small red">${labels.angles[i]}°</text>`; });
    }
    return svg(240, 150, body);
  }
  function polygonFig(n, irregular) {
    const pts = range(0, n - 1).map((i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2, r = irregular ? 45 + R.int(-12, 12) : 52;
      return `${(65 + r * Math.cos(a)).toFixed(1)},${(62 + r * Math.sin(a)).toFixed(1)}`;
    });
    return svg(130, 124, `<polygon points="${pts.join(' ')}" fill="#ffe2b8" stroke="#ff9d3d" stroke-width="4"/>`);
  }
  function circleFig(part) {
    const C = '<circle cx="70" cy="70" r="56" fill="#fff8e8" stroke="#1d2340" stroke-width="3"/><circle cx="70" cy="70" r="3.5" fill="#1d2340"/>';
    const red = 'stroke="#ff5a6e" stroke-width="5" stroke-linecap="round"';
    const extra = {
      radio: `<line x1="70" y1="70" x2="${70 + 56 * Math.cos(-0.6)}" y2="${70 + 56 * Math.sin(-0.6)}" ${red}/>`,
      diámetro: `<line x1="14" y1="70" x2="126" y2="70" ${red}/>`,
      cuerda: `<line x1="${70 + 56 * Math.cos(2.5)}" y1="${70 + 56 * Math.sin(2.5)}" x2="${70 + 56 * Math.cos(0.9)}" y2="${70 + 56 * Math.sin(0.9)}" ${red}/>`,
      arco: `<path d="M${70 + 56 * Math.cos(-2.4)},${70 + 56 * Math.sin(-2.4)} A56,56 0 0 1 ${70 + 56 * Math.cos(-0.8)},${70 + 56 * Math.sin(-0.8)}" fill="none" ${red}/>`,
      centro: '<circle cx="70" cy="70" r="7" fill="#ff5a6e"/>',
    }[part];
    return svg(140, 140, C + extra);
  }
  function rectFig(w, h, tri) {
    const s = Math.min(22, Math.floor(200 / Math.max(w, h))), W = w * s, H = h * s;
    let b = '';
    for (let i = 0; i <= w; i++) b += `<line x1="${10 + i * s}" y1="10" x2="${10 + i * s}" y2="${10 + H}" stroke="#d8cba6"/>`;
    for (let j = 0; j <= h; j++) b += `<line x1="10" y1="${10 + j * s}" x2="${10 + W}" y2="${10 + j * s}" stroke="#d8cba6"/>`;
    b += tri
      ? `<polygon points="10,${10 + H} ${10 + W},${10 + H} ${10 + Math.round(w / 3) * s},10" fill="rgba(88,196,255,.45)" stroke="#145a86" stroke-width="3"/>`
      : `<rect x="10" y="10" width="${W}" height="${H}" fill="rgba(47,217,164,.35)" stroke="#0d6b4d" stroke-width="3"/>`;
    b += `<text x="${10 + W / 2}" y="${H + 30}" text-anchor="middle" class="t small">${w} cm</text><text x="${W + 16}" y="${10 + H / 2 + 5}" class="t small">${h} cm</text>`;
    return svg(W + 64, H + 38, b);
  }
  function barChart(data, showValues) {
    const max = Math.max(...data.map((d) => d.v)), step = max > 12 ? 5 : 2, top = Math.ceil(max / step) * step;
    const H = 130, bw = 34, gap = 16, x0 = 34;
    let b = '';
    for (let t = 0; t <= top; t += step) {
      const y = 10 + H - (t / top) * H;
      b += `<line x1="${x0}" y1="${y}" x2="${x0 + data.length * (bw + gap) + gap}" y2="${y}" stroke="#e6d7b3"/><text x="${x0 - 6}" y="${y + 4}" text-anchor="end" class="t tiny">${t}</text>`;
    }
    data.forEach((d, i) => {
      const x = x0 + gap + i * (bw + gap), hh = (d.v / top) * H;
      b += `<rect x="${x}" y="${10 + H - hh}" width="${bw}" height="${hh}" rx="4" fill="${d.c}"/><text x="${x + bw / 2}" y="${H + 34}" text-anchor="middle" class="t">${d.e}</text>`;
      if (showValues) b += `<text x="${x + bw / 2}" y="${10 + H - hh - 5}" text-anchor="middle" class="t small">${d.v}</text>`;
    });
    return svg(x0 + data.length * (bw + gap) + gap + 4, H + 44, b, 'chart');
  }

  // ---------- Spanish number words and Roman numerals ----------
  const UN = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const DEC = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const CEN = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const w99 = (n) => (n < 30 ? UN[n] : DEC[Math.floor(n / 10)] + (n % 10 ? ' y ' + UN[n % 10] : ''));
  const w999 = (n) => (n === 100 ? 'cien' : [Math.floor(n / 100) ? CEN[Math.floor(n / 100)] : '', n % 100 ? w99(n % 100) : ''].filter(Boolean).join(' '));
  const apoc = (s) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
  function words(n) {
    if (!n) return 'cero';
    const mill = Math.floor(n / 1e6), th = Math.floor(n / 1000) % 1000, rest = n % 1000, parts = [];
    if (mill) parts.push(mill === 1 ? 'un millón' : apoc(w999(mill)) + ' millones');
    if (th) parts.push(th === 1 ? 'mil' : apoc(w999(th)) + ' mil');
    if (rest) parts.push(w999(rest));
    return parts.join(' ');
  }
  function roman(n) {
    const T = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    T.forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } });
    return s;
  }
  const PLACES = ['unidades', 'decenas', 'centenas', 'unidades de millar', 'decenas de millar', 'centenas de millar', 'unidades de millón', 'decenas de millón', 'centenas de millón'];
  const randDigits = (len) => Number(String(R.int(1, 9)) + Array.from({ length: len - 1 }, () => R.int(0, 9)).join(''));

  // =====================================================================
  // CUADERNILLO 1 · Estrategias (espacio para familias)
  // =====================================================================
  function gJumps(lvl) {
    const plus = lvl === 0 || R.int(0, 1) === 1;
    const H = R.int(1, lvl === 2 ? 6 : 3), T = R.int(lvl ? 1 : 0, 9), U = R.int(1, 9), b = H * 100 + T * 10 + U;
    const a = plus ? R.int(lvl === 2 ? 1200 : 120, lvl === 2 ? 8500 : 860) : b + R.int(120, lvl === 2 ? 6000 : 700);
    const steps = [H * 100, T * 10, U].filter(Boolean), sign = plus ? '+' : '−';
    const vals = [];
    steps.reduce((acc, s) => { const v = plus ? acc + s : acc - s; vals.push(v); return v; }, a);
    return {
      type: 'cells',
      prompt: `Calcula <b>${fmt(a)} ${sign} ${fmt(b)}</b> con <b>saltos</b> en la recta numérica: primero las centenas, luego las decenas y al final las unidades.`,
      html: `<div class="chain"><span class="dbox">${fmt(a)}</span>${steps.map((s, i) => `<span class="arrow">${sign}${fmt(s)}</span>${cell(i)}`).join('')}</div>`,
      cells: vals.map((ans, stage) => ({ ans, stage })),
      hint: `Salta ${sign}${steps.map(fmt).join(`, luego ${sign}`)}.`,
      explain: `${fmt(a)} ${steps.map((s, i) => `${sign} ${fmt(s)} → ${fmt(vals[i])}`).join(' ')}. <b>${fmt(a)} ${sign} ${fmt(b)} = ${fmt(vals[vals.length - 1])}</b>`,
    };
  }
  function gDecompAdd(lvl) {
    const len = lvl === 2 ? 4 : 3, a = randDigits(len), b = randDigits(len);
    const da = String(a).padStart(len, '0').split('').map(Number), db = String(b).padStart(len, '0').split('').map(Number);
    const rows = da.map((d, i) => { const p = 10 ** (len - 1 - i); return [d * p, db[i] * p]; }).filter(([x, y]) => x || y);
    return {
      type: 'cells',
      prompt: `Suma <b>descomponiendo</b>: suma cada orden por separado y después junta los resultados.`,
      html: `<div class="eq big">${fmt(a)} + ${fmt(b)}</div><div class="pair">${rows.map(([x, y], i) => `<div class="op known">${fmt(x)} + ${fmt(y)} = ${cell(i)}</div>`).join('')}
        <div class="op ask">${fmt(a)} + ${fmt(b)} = ${cell(rows.length)}</div></div>`,
      cells: rows.map(([x, y]) => ({ ans: x + y, stage: 0 })).concat({ ans: a + b, stage: 1 }),
      explain: `${rows.map(([x, y]) => fmt(x + y)).join(' + ')} = <b>${fmt(a + b)}</b>`,
    };
  }
  function gDerived(lvl) {
    let rows, why;
    if (R.int(0, 2) < 2 || lvl === 0) {
      const a = R.int(2, 9), b = R.int(2, 9), k = R.pick([2, 10]);
      const r2 = k === 2 ? [2 * a, b] : [a, 10 * b];
      const r3 = k === 2 ? [2 * a, 10 * b] : [10 * a, 10 * b];
      rows = [[`${a} × ${b}`, a * b], [`${r2[0]} × ${r2[1]}`, r2[0] * r2[1]], [`${fmt(r3[0])} × ${fmt(r3[1])}`, r3[0] * r3[1]]];
      why = k === 2 ? `Si un factor es el doble, el resultado es el doble. Si un factor es 10 veces mayor, el resultado también.` : 'Cada vez que un factor se multiplica por 10, el resultado se multiplica por 10.';
    } else {
      const d = R.int(2, 9), q = R.int(2, 9);
      rows = [[`${d * q} : ${d}`, q], [`${d * q * 10} : ${d}`, q * 10], [`${fmt(d * q * 10)} : ${d * 10}`, q]];
      why = 'Si el dividendo es 10 veces mayor, el cociente también. Si dividendo y divisor se multiplican por 10, el cociente no cambia.';
    }
    return {
      type: 'cells',
      prompt: '<b>Hechos conocidos y derivados</b>: usa el resultado de arriba para deducir el de abajo, ¡sin calcular desde cero!',
      html: `<div class="pair">${rows.map(([t], i) => `<div class="op ${i ? 'ask' : 'known'}">${t} = ${cell(i)}</div>`).join('')}</div>`,
      cells: rows.map(([, ans], stage) => ({ ans, stage })),
      hint: why, explain: why,
    };
  }
  function gPlace(lvl) {
    const len = [R.int(4, 5), R.int(5, 6), R.int(6, 7)][lvl], n = randDigits(len), ds = String(n).split('');
    let p;
    do { p = R.int(0, len - 1); } while (ds[len - 1 - p] === '0');
    const d = Number(ds[len - 1 - p]);
    const shown = fmt(n).split('').map((ch, i, arr) => {
      const digitsAfter = arr.slice(i + 1).filter((c) => /\d/.test(c)).length;
      return /\d/.test(ch) && digitsAfter === p ? `<span class="hl">${ch}</span>` : ch;
    }).join('');
    const opts = [p, p - 1, p + 1, p + 2, p - 2].filter((x) => x >= 0 && x < 9).map((x) => fmt(d * 10 ** x));
    return choose(`¿Cuánto vale la cifra marcada?<div class="eq big">${shown}</div>`, fmt(d * 10 ** p), opts.slice(1),
      { explain: `El ${d} está en las <b>${PLACES[p]}</b>: vale ${d} × ${fmt(10 ** p)} = <b>${fmt(d * 10 ** p)}</b>.` });
  }
  function gOrderBig(lvl) {
    const len = [4, 6, 7][lvl], base = R.sample(range(1, 9), len - 1).concat(0);
    const set = new Set();
    while (set.size < [4, 4, 5][lvl]) {
      const p = R.shuffle(base);
      if (p[0] !== 0) set.add(Number(p.join('')));
    }
    let items = [...set];
    while (items.every((x, i) => !i || items[i - 1] <= x)) items = R.shuffle(items);
    return {
      type: 'order', prompt: 'Ordena los números de <b>menor a mayor</b>. ¡Fíjate bien en el valor de cada cifra!',
      items: items.map((v) => ({ label: `<span class="bignum">${fmt(v)}</span>`, rank: v })), ends: ['menor', 'mayor'],
      explain: [...set].sort((a, b) => a - b).map(fmt).join(' < '),
    };
  }

  // =====================================================================
  // CUADERNILLO 1 · Sesiones 11–20
  // =====================================================================
  const POP = [['🇩🇪', 'Alemania', 83019214], ['🇫🇷', 'Francia', 67028048], ['🇮🇹', 'Italia', 60359546], ['🇪🇸', 'España', 46934632], ['🇳🇱', 'Países Bajos', 17282163], ['🇧🇪', 'Bélgica', 11467923], ['🇬🇷', 'Grecia', 10722287], ['🇵🇹', 'Portugal', 10276617], ['🇦🇹', 'Austria', 8858775], ['🇫🇮', 'Finlandia', 5517919]];
  const ROUND_TO = [[1000, 'los millares'], [10000, 'las decenas de millar'], [100000, 'las centenas de millar'], [1000000, 'los millones']];
  function gRound(lvl) {
    const [p, name] = [R.pick(ROUND_TO.slice(0, 2)), ROUND_TO[2], ROUND_TO[3]][lvl];
    const n = randDigits(Math.max(String(p).length + 1, [5, 7, R.int(8, 9)][lvl])), ans = Math.round(n / p) * p;
    const next = Math.floor((n % p) / (p / 10));
    return one(`Aproxima <b>${fmt(n)}</b> a ${name}.`, fmt(n) + ' ≈', ans, {
      hint: 'Mira la cifra que hay justo a la derecha: si es 5 o más, sube; si es menor que 5, se queda igual.',
      explain: `La cifra de la derecha es un ${next}: ${next >= 5 ? 'subimos' : 'se queda igual'}. <b>${fmt(n)} ≈ ${fmt(ans)}</b>`,
    });
  }
  function gPopulation(lvl) {
    const kind = lvl === 0 ? 0 : R.int(0, 2);
    if (kind === 0) {
      const [flag, name, pop] = R.pick(POP), z = Math.floor(pop / 1e7);
      return {
        type: 'choice', layout: 'line', ticks: range(0, 10).map((i) => (i ? `${i * 10} M` : '0')),
        prompt: `¿En qué tramo de la recta está la población de ${flag} <b>${name}</b>?<div class="eq big">${fmt(pop)} habitantes</div>`,
        options: 'ABCDEFGHIJ'.split('').map((l, i) => ({ label: l, correct: i === z })),
        hint: 'Aproxima a los millones. Cada marca de la recta son 10 millones (10 M).',
        explain: `${fmt(pop)} ≈ ${Math.round(pop / 1e6)} millones: entre ${z * 10} y ${z * 10 + 10} millones, <b>tramo ${'ABCDEFGHIJ'[z]}</b>.`,
      };
    }
    if (kind === 1) {
      const c = R.pick(POP), m = Math.round(c[2] / 1e6);
      const others = R.shuffle(POP.filter((x) => Math.abs(Math.round(x[2] / 1e6) - m) >= 2)).slice(0, 3);
      return choose(`¿Qué país tiene <b>aproximadamente ${m} millones</b> de habitantes?`, `${c[0]} ${c[1]}`, others.map((x) => `${x[0]} ${x[1]}`),
        { explain: `${c[1]} tiene ${fmt(c[2])} habitantes ≈ <b>${m} millones</b>.` });
    }
    const T = R.pick([10, 20, 50, 70]) * 1e6, sorted = [...POP].sort((x, y) => Math.abs(x[2] - T) - Math.abs(y[2] - T));
    if (Math.abs(sorted[0][2] - T) === Math.abs(sorted[1][2] - T)) return gPopulation(1);
    return choose(`¿Qué país tiene la población <b>más cercana a ${fmt(T)}</b>?`, `${sorted[0][0]} ${sorted[0][1]}`, R.shuffle(sorted.slice(1, 6)).map((x) => `${x[0]} ${x[1]}`),
      { explain: `${sorted[0][1]}: ${fmt(sorted[0][2])}. Es el que está más cerca de ${fmt(T)}.` });
  }
  function gCardsBig(lvl) {
    const k = [6, 7, 9][lvl], digits = R.sample(range(1, 9), k), max = R.int(0, 1) === 1;
    const best = [...digits].sort((a, b) => (max ? b - a : a - b)), v = Number(best.join(''));
    return {
      type: 'cards', prompt: `Coloca las ${k} tarjetas para formar el número <b>${max ? 'mayor' : 'menor'}</b> posible.`,
      digits, slots: [k], goal: { kind: max ? 'max' : 'min' }, bestArr: best, bestScore: max ? v : -v,
      hint: max ? 'Pon la cifra más grande en el lugar que más vale: el de la izquierda.' : 'Pon la cifra más pequeña a la izquierda.',
      explain: `<b>${fmt(v)}</b>, que aproximado a ${k >= 7 ? 'los millones' : 'los millares'} es ${fmt(Math.round(v / (k >= 7 ? 1e6 : 1e3)) * (k >= 7 ? 1e6 : 1e3))}.`,
    };
  }

  function gSqGrid(lvl) {
    const n = R.int([2, 4, 7][lvl], [5, 8, 12][lvl]);
    return one('¿Cuántos cuadraditos tiene este cuadrado en total?', `<span class="fig-wrap">${gridSquare(n, lvl === 2)}</span>`, n * n,
      { hint: 'No hace falta contarlos uno a uno: cuenta los de un lado y multiplica.', explain: `${n} × ${n} = <b>${n * n}</b>. ¡Por eso se llaman <b>números cuadrados</b>!` });
  }
  function gSqChain(lvl) {
    const K = [8, 10, 15][lvl], squares = range(1, K).map((k) => k * k);
    const hide = R.sample(range(1, K - 1), [3, 4, 5][lvl]).sort((a, b) => a - b);
    let c = 0;
    return {
      type: 'cells', prompt: 'Completa la cadena de los primeros <b>números cuadrados</b>.',
      html: `<div class="chain">${squares.map((s, i) => (hide.includes(i) ? cell(c++) : `<span class="dbox">${s}</span>`)).join('')}</div>`,
      cells: hide.map((i) => ({ ans: squares[i] })),
      hint: '1 × 1, 2 × 2, 3 × 3, 4 × 4…',
      explain: 'Fíjate en los saltos de uno al siguiente: 3, 5, 7, 9, 11… ¡son los números impares!',
    };
  }
  function gSqJump(lvl) {
    const k = R.int(2, [7, 10, 14][lvl]), a = k * k, b = (k + 1) * (k + 1);
    if (lvl === 2 && R.int(0, 1)) {
      return {
        type: 'cells', prompt: `Para ir de un número cuadrado al siguiente hay que saltar <b>${2 * k + 1}</b>. ¿Qué dos números cuadrados son?`,
        html: `<div class="eq big">${cell(0)} <span class="arrow">+${2 * k + 1}</span> ${cell(1)}</div>`,
        cells: [{ ans: a }, { ans: b }],
        hint: `Los saltos son 3, 5, 7, 9… El salto después de n × n es 2 × n + 1.`,
        explain: `${k} × ${k} = ${a} y ${k + 1} × ${k + 1} = ${b}: <b>${a} + ${2 * k + 1} = ${b}</b>.`,
      };
    }
    return one(`¿Cuánto hay que saltar para ir del número cuadrado <b>${a}</b> al siguiente, <b>${b}</b>?`, `${b} − ${a}`, b - a,
      { explain: `El salto es <b>${b - a}</b>. Los saltos entre cuadrados seguidos son los números impares: 3, 5, 7, 9…` });
  }
  function gSqProduct(lvl) {
    const k = R.int(...[[1, 2], [2, 4], [4, 7]][lvl]), p = k * (k + 1) * (k + 2) * (k + 3), s = Math.sqrt(p + 1);
    return {
      type: 'cells', prompt: 'Multiplica y busca el <b>número cuadrado más cercano</b> al resultado.',
      html: `<div class="eq big wrap">${k} × ${k + 1} × ${k + 2} × ${k + 3} = ${cell(0)}</div><div class="eq">El número cuadrado más cercano es ${cell(1)}</div>`,
      cells: [{ ans: p, stage: 0 }, { ans: p + 1, stage: 1 }],
      hint: 'Puedes multiplicar por parejas: primero los dos de fuera y luego los dos de dentro.',
      explain: `${fmt(p)} + 1 = ${fmt(p + 1)} = ${s} × ${s}. ¡Al multiplicar 4 números seguidos siempre sale <b>uno menos que un número cuadrado</b>!`,
    };
  }
  function gIsSquare(lvl) {
    const hi = [10, 15, 25][lvl], k = R.int(3, hi), sq = k * k, notIt = R.int(0, 1) === 1;
    const fakes = new Set();
    while (fakes.size < 3) { const v = sq + R.pick([-3, -2, -1, 1, 2, 3, 5, 10]) * R.int(1, 3); if (v > 1 && !isSquare(v)) fakes.add(v); }
    if (!notIt) return choose('¿Cuál de estos es un <b>número cuadrado</b>?', sq, [...fakes], { explain: `<b>${sq} = ${k} × ${k}</b>.` });
    const sqs = R.sample(range(2, hi), 3).map((x) => x * x), odd = [...fakes][0];
    return choose('¿Cuál de estos <b>NO</b> es un número cuadrado?', odd, sqs, { explain: `${sqs.map((s) => `${s} = ${Math.sqrt(s)} × ${Math.sqrt(s)}`).join(', ')}. El <b>${odd}</b> no se puede escribir como n × n.` });
  }
  function gDigitRoot(lvl) {
    const k = R.int(4, [15, 25, 45][lvl]), n = k * k, steps = [];
    let v = n;
    while (v >= 10) { v = sum(String(v).split('').map(Number)); steps.push(v); }
    if (!steps.length) return gDigitRoot(lvl);
    return {
      type: 'cells', prompt: `Suma las cifras del número cuadrado <b>${fmt(n)}</b> (${k} × ${k}). Si sale 10 o más, vuelve a sumar sus cifras hasta tener <b>una sola cifra</b>.`,
      html: `<div class="chain"><span class="dbox">${n}</span>${steps.map((s, i) => `<span class="arrow">suma</span>${cell(i)}`).join('')}</div>`,
      cells: steps.map((ans, stage) => ({ ans, stage })),
      explain: `${[n, ...steps].join(' → ')}. ¡Con los números cuadrados siempre acaba saliendo <b>1, 4, 7 o 9</b>!`,
    };
  }
  function gPlusOne(lvl) {
    const [a, b] = lvl === 2 ? R.sample([4, 6, 20], 2).sort((x, y) => x - y) : (() => { const x = R.int(...[[2, 9], [10, 30]][lvl]); return [x, x + 2]; })();
    const s = Math.sqrt(a * b + 1);
    return {
      type: 'cells', prompt: 'Multiplica y suma 1. ¿Qué tipo de número sale?',
      html: `<div class="eq big">${a} × ${b} = ${cell(0)} <span class="arrow">+1</span> ${cell(1)}</div>`,
      cells: [{ ans: a * b, stage: 0 }, { ans: a * b + 1, stage: 1 }],
      explain: `${a * b} + 1 = ${a * b + 1} = <b>${s} × ${s}</b>: ¡un número cuadrado!${b === a + 2 ? ` Pasa siempre con dos números que se llevan 2: el cuadrado es el del medio (${a + 1}).` : ''}`,
    };
  }
  function gFourSquares(lvl) {
    const n = R.int(...[[1, 5], [4, 9], [8, 15]][lvl]), sq = [0, 1, 2, 3].map((i) => (n + i) * (n + i));
    return {
      type: 'cells', prompt: `Escribe 4 números cuadrados seguidos empezando por ${n} × ${n}. Después suma los dos de los <b>extremos</b> y los dos del <b>medio</b>.`,
      html: `<div class="eq wrap">${sq.map((x, i) => cell(i)).join(' ')}</div>
        <div class="pair"><div class="op known">Extremos: ${cell(4)}</div><div class="op known">Medio: ${cell(5)}</div><div class="op ask">Diferencia: ${cell(6)}</div></div>`,
      cells: sq.map((ans) => ({ ans, stage: 0 })).concat({ ans: sq[0] + sq[3], stage: 1 }, { ans: sq[1] + sq[2], stage: 1 }, { ans: 4, stage: 2 }),
      explain: `${sq[0]} + ${sq[3]} = ${sq[0] + sq[3]} y ${sq[1]} + ${sq[2]} = ${sq[1] + sq[2]}. ¡Siempre se diferencian en <b>4</b>!`,
    };
  }

  const PATTERNS = [
    [[12, 9], [123, 9], [1234, 9], [12345, 9], [123456, 9]],
    [[98, 9], [987, 9], [9876, 9], [98765, 9]],
    [[1, 1], [11, 11], [111, 111], [1111, 1111]],
    [[37, 3], [37, 6], [37, 9], [37, 12], [37, 15], [37, 18]],
    [[1, 8, 1], [12, 8, 2], [123, 8, 3], [1234, 8, 4], [12345, 8, 5]],
    [[9, 9, 7], [98, 9, 6], [987, 9, 5], [9876, 9, 4]],
    [[15873, 7], [15873, 14], [15873, 21], [15873, 28]],
  ];
  function gPattern(lvl) {
    const fam = R.pick(PATTERNS), known = Math.min(fam.length - 1, [3, 3, 2][lvl]), rows = fam.slice(0, known + 1);
    const txt = ([a, b, c]) => `${fmt(a)} × ${b}${c ? ` + ${c}` : ''}`, val = ([a, b, c]) => a * b + (c || 0);
    return {
      type: 'cells', prompt: `Calcula las primeras y, fijándote en el <b>patrón</b>, adivina la última sin hacer la cuenta.`,
      html: `<div class="pair">${rows.map((r, i) => `<div class="op ${i === known ? 'ask' : 'known'}">${i === known ? '¿' : ''}${txt(r)} = ${cell(i)}${i === known ? ' ?' : ''}</div>`).join('')}</div>`,
      cells: rows.map((r, i) => ({ ans: val(r), stage: i === known ? 1 : 0 })),
      hint: 'Mira cómo cambian las cifras del resultado de una fila a la siguiente.',
      explain: `${rows.map((r) => `${txt(r)} = ${fmt(val(r))}`).join('<br>')}`,
    };
  }
  const MIRROR = [[198, 9], [297, 8], [396, 7], [495, 6], [594, 5], [693, 4], [792, 3], [891, 2]];
  function gMirror() {
    const i = R.int(0, 7), [a, b] = MIRROR[i], [c, d] = MIRROR[7 - i];
    const wrongs = R.shuffle(MIRROR.filter((x, j) => j !== i && j !== 7 - i && x[0] * x[1] !== a * b)).slice(0, 3).map(([x, y]) => `${x} × ${y}`);
    return choose(`¿Qué multiplicación da <b>lo mismo</b> que esta?<div class="eq big">${a} × ${b}</div>`, `${c} × ${d}`, wrongs,
      { hint: 'Calcula la de arriba y luego las de abajo.', explain: `${a} × ${b} = ${fmt(a * b)} y ${c} × ${d} = ${fmt(c * d)}. ¡Las cifras están al revés en los dos factores!` });
  }
  function gConsec(lvl) {
    const n = R.int(...[[10, 30], [50, 68], [70, 88]][lvl]);
    return {
      type: 'cells', prompt: `Con los números seguidos <b>${n}, ${n + 1} y ${n + 2}</b>: multiplica el primero por el último y el del medio por sí mismo.`,
      html: `<div class="pair"><div class="op known">${n} × ${n + 2} = ${cell(0)}</div><div class="op known">${n + 1} × ${n + 1} = ${cell(1)}</div><div class="op ask">Diferencia: ${cell(2)}</div></div>`,
      cells: [{ ans: n * (n + 2), stage: 0 }, { ans: (n + 1) * (n + 1), stage: 0 }, { ans: 1, stage: 1 }],
      hint: 'Usa el modelo rectangular: descompón en decenas y unidades.',
      explain: `${fmt(n * (n + 2))} y ${fmt((n + 1) ** 2)}: ¡siempre se diferencian en <b>1</b>!`,
    };
  }
  function gMosaic(lvl) {
    const s = R.int(18, 28), t = R.int(8, [12, 14, 15][lvl]), m = R.int(12, 20), total = s * t + m * m, k = Math.floor(Math.sqrt(total));
    if (total === k * k) return gMosaic(lvl);
    return {
      type: 'cells', prompt: `Mosaicos: cada uno de los <b>${s}</b> alumnos de 5.º decora <b>${t}</b> baldosas. Los de 6.º hacen un mosaico de <b>${m} filas de ${m}</b> baldosas.`,
      html: `<div class="pair"><div class="op known">Baldosas de 5.º: ${cell(0)}</div><div class="op known">Baldosas de 6.º: ${cell(1)}</div>
        <div class="op ask">Si juntamos todas para hacer un mosaico de ${k} × ${k}, sobran: ${cell(2)}</div></div>`,
      cells: [{ ans: s * t, stage: 0 }, { ans: m * m, stage: 0 }, { ans: total - k * k, stage: 1 }],
      explain: `${s} × ${t} = ${s * t}; ${m} × ${m} = ${m * m}; en total ${total}. ${k} × ${k} = ${k * k}, así que sobran <b>${total - k * k}</b>.`,
    };
  }

  function gPack(lvl) {
    const d = R.int(3, lvl ? 9 : 6), q = R.int(...[[3, 9], [5, 12], [12, 40]][lvl]), r = R.int(lvl ? 0 : 1, d - 1), N = d * q + r;
    const [it, kind] = R.pick([['bombones', 0], ['avellanas', 0], ['galletas', 0], ['tulipanes', 1], ['margaritas', 1], ['rosas', 1]]);
    const prompt = kind ? `Con <b>${N} ${it}</b> queremos hacer <b>${d} ramos iguales</b>.` : `Tenemos <b>${N} ${it}</b> y hacemos paquetes de <b>${d}</b>.`;
    return {
      type: 'cells', prompt,
      html: `<div class="pair"><div class="op known">${kind ? `${it[0].toUpperCase()}${it.slice(1)} en cada ramo` : 'Total de paquetes'}: ${cell(0)}</div><div class="op known">Sobran: ${cell(1)}</div></div>`,
      cells: [{ ans: q }, { ans: r }],
      hint: `Busca en la tabla del ${d} el resultado más cercano a ${N} sin pasarte.`,
      explain: `${d} × ${q} = ${d * q}, y ${N} − ${d * q} = ${r}. <b>${N} : ${d} = ${q} R ${r}</b>`,
    };
  }
  function gFactTriangle(lvl) {
    const d = R.int(2, 9), q = R.int(3, 9), a = d * q, up = R.int(0, 2) > 0, k = R.int(1, d - 1);
    const b = up ? a + k : a - k, qb = Math.floor(b / d), rb = b % d;
    return {
      type: 'cells', prompt: 'Usa la división exacta para resolver la de al lado.',
      html: `<div class="tri"><b>${a}</b><span>${d}</span><span>?</span></div><div class="pair"><div class="op known">${a} : ${d} = ${cell(0)}</div><div class="op ask">${b} : ${d} = ${cell(1)} R ${cell(2)}</div></div>`,
      cells: [{ ans: q, stage: 0 }, { ans: qb, stage: 1 }, { ans: rb, stage: 1 }],
      explain: `${a} : ${d} = ${q}. ${up ? `${b} tiene ${k} más: el cociente es igual y sobran ${k}.` : `${b} tiene ${k} menos: el cociente baja a ${qb} y sobran ${rb}.`} <b>${b} : ${d} = ${qb} R ${rb}</b>`,
    };
  }
  function gWeb(lvl) {
    const d = R.int(2, [4, 6, 9][lvl]), parts = [d * 10 * R.int(1, 9), d * R.int(1, 9)];
    if (lvl === 2) parts.unshift(d * 100 * R.int(1, 4));
    const N = sum(parts);
    return {
      type: 'cells', prompt: `Divide cada parte entre ${d} y después junta los resultados.`,
      html: `<div class="eq big">${N} = ${parts.join(' + ')}</div><div class="pair">${parts.map((p, i) => `<div class="op known">${p} : ${d} = ${cell(i)}</div>`).join('')}<div class="op ask">${N} : ${d} = ${cell(parts.length)}</div></div>`,
      cells: parts.map((p) => ({ ans: p / d, stage: 0 })).concat({ ans: N / d, stage: 1 }),
      explain: `${parts.map((p) => p / d).join(' + ')} = <b>${N / d}</b>`,
    };
  }
  function divPieces(N, d) {
    const pieces = [];
    let rem = N;
    [100, 10].forEach((p) => { const q = Math.floor(rem / (d * p)); if (q) { pieces.push(q * d * p); rem -= q * d * p; } });
    if (rem) pieces.push(rem);
    return pieces;
  }
  function gDivDecomp(lvl) {
    const d = R.int(...[[2, 4], [3, 6], [4, 9]][lvl]), N = R.int(...[[30, 99], [100, 499], [200, 999]][lvl]), pieces = divPieces(N, d);
    if (pieces.length < 2) return gDivDecomp(lvl);
    const cells = [], last = pieces.length - 1;
    const rows = pieces.map((p, i) => {
      if (i < last || p % d === 0) { cells.push({ ans: p / d, stage: 0 }); return `<div class="op known">${p} : ${d} = ${cell(cells.length - 1)}</div>`; }
      cells.push({ ans: Math.floor(p / d), stage: 0 }, { ans: p % d, stage: 0 });
      return `<div class="op known">${p} : ${d} = ${cell(cells.length - 2)} R ${cell(cells.length - 1)}</div>`;
    });
    cells.push({ ans: Math.floor(N / d), stage: 1 }, { ans: N % d, stage: 1 });
    return {
      type: 'cells', prompt: `Divide <b>${N} : ${d}</b> con la <b>estrategia de descomposición</b>.`,
      html: `<div class="eq big">${N} = ${pieces.join(' + ')}</div><div class="pair">${rows.join('')}<div class="op ask">${N} : ${d} = ${cell(cells.length - 2)} R ${cell(cells.length - 1)}</div></div>`,
      cells,
      hint: 'Divide cada trocito y suma los cocientes. Solo el último trocito puede tener resto.',
      explain: `${pieces.map((p) => Math.floor(p / d)).join(' + ')} = ${Math.floor(N / d)}, y sobran ${N % d}. <b>${N} : ${d} = ${Math.floor(N / d)} R ${N % d}</b>`,
    };
  }
  function gShare(lvl) {
    const d = R.int(3, 9), N = R.int(...[[40, 99], [100, 299], [200, 999]][lvl]);
    const chunks = [];
    let rem = N;
    [100, 10, 1].forEach((p) => { const q = Math.floor(rem / (d * p)); if (q) { chunks.push(q * p); rem -= q * p * d; } });
    const cells = [];
    let left = N;
    const rows = chunks.map((c) => { const after = left - c * d; cells.push({ ans: after, stage: cells.length }); const row = `<div class="share"><span>${left} − ${c * d} = ${cell(cells.length - 1)}</span><b>${c}</b></div>`; left = after; return row; });
    const st = cells.length;
    cells.push({ ans: Math.floor(N / d), stage: st }, { ans: N % d, stage: st });
    return {
      type: 'cells', prompt: `Reparte <b>${N}</b> entre <b>${d}</b> con la <b>estrategia de repartos</b>: en cada paso das a cada uno lo que pone a la derecha.`,
      html: `<div class="shares">${rows.join('')}</div><div class="eq big">${N} : ${d} = ${cell(st)} R ${cell(st + 1)}</div>`,
      cells,
      explain: `Cada uno recibe ${chunks.join(' + ')} = ${Math.floor(N / d)} y sobran ${N % d}.`,
    };
  }
  function gSqBy4(lvl) {
    if (lvl === 2) {
      const k = R.int(11, 31), s = k * k;
      return choose(`Sin hacer la división: ¿qué <b>resto</b> dará <b>${s} : 4</b>?`, s % 4, [0, 1, 2, 3].filter((x) => x !== s % 4),
        { hint: '¿Es par o impar el número cuadrado?', explain: `${s} = ${k} × ${k} es ${k % 2 ? 'impar' : 'par'}. Los cuadrados pares dan resto 0 y los impares, resto 1. <b>Resto ${s % 4}</b>.` });
    }
    const k = R.int(2, lvl ? 14 : 9), s = k * k;
    return {
      type: 'cells', prompt: `Divide el número cuadrado <b>${s}</b> entre 4.`,
      html: `<div class="eq big">${s} : 4 = ${cell(0)} R ${cell(1)}</div>`, cells: [{ ans: Math.floor(s / 4) }, { ans: s % 4 }],
      explain: `4 × ${Math.floor(s / 4)} = ${s - (s % 4)}, sobran <b>${s % 4}</b>. ¿Te has fijado? Los cuadrados pares dan resto 0 y los impares, resto 1.`,
    };
  }
  function gRestFromQ(lvl) {
    const d = lvl === 2 ? R.int(11, 25) : R.int(3, 9), q = R.int(20, 150), r = R.int(0, d - 1), N = d * q + r;
    return {
      type: 'cells', prompt: 'Ya conocemos el cociente. Calcula el resto <b>sin hacer la división</b>.',
      html: `<div class="eq big">${fmt(N)} : ${d} = ${q} R ${cell(0)}</div>`, cells: [{ ans: r }],
      hint: `Multiplica el cociente por el divisor y mira cuánto falta para llegar al dividendo.`,
      explain: `${d} × ${q} = ${fmt(d * q)} y ${fmt(N)} − ${fmt(d * q)} = <b>${r}</b>.`,
    };
  }
  function gCalc(lvl) {
    const d = R.pick(lvl === 2 ? [8, 16, 20, 25, 40] : [2, 4, 5, 8]), q = R.int(lvl ? 100 : 20, lvl ? 999 : 150), r = R.int(1, d - 1), N = d * q + r;
    return {
      type: 'cells', prompt: `La calculadora dice <b>${fmt(N)} : ${d} = ${fmt(r3(N / d))}</b>. ¿Cuál es el cociente y el resto?`,
      html: `<div class="eq big">${fmt(N)} : ${d} = ${cell(0)} R ${cell(1)}</div>`, cells: [{ ans: q, stage: 0 }, { ans: r, stage: 1 }],
      hint: 'El cociente es la parte de antes de la coma. Para el resto, multiplica el cociente por el divisor y réstalo.',
      explain: `Cociente <b>${q}</b>. Resto: ${fmt(N)} − ${q} × ${d} = ${fmt(N)} − ${fmt(q * d)} = <b>${r}</b>.`,
    };
  }
  function gSheets(lvl) {
    const g = R.int(3, 9), q = R.int(5, lvl ? 30 : 15), r = R.int(1, g - 1), N = g * q + r;
    return {
      type: 'cells', prompt: `La maestra tiene un paquete de <b>${N} hojas</b> para repartir entre los <b>${g} grupos</b> de la clase. Cada grupo recibe la misma cantidad.`,
      html: `<div class="pair"><div class="op known">Hojas para cada grupo: ${cell(0)}</div><div class="op known">Hojas que sobran: ${cell(1)}</div><div class="op ask">Hojas repartidas: ${cell(2)}</div></div>`,
      cells: [{ ans: q, stage: 0 }, { ans: r, stage: 0 }, { ans: N - r, stage: 1 }],
      explain: `${N} : ${g} = ${q} R ${r}. Ha repartido ${g} × ${q} = <b>${N - r}</b> hojas.`,
    };
  }
  function fourSquares(n) {
    for (let a = Math.floor(Math.sqrt(n)); a >= 0; a--) for (let b = Math.min(a, Math.floor(Math.sqrt(n - a * a))); b >= 0; b--) {
      for (let c = Math.min(b, Math.floor(Math.sqrt(n - a * a - b * b))); c >= 0; c--) {
        const rest = n - a * a - b * b - c * c;
        if (isSquare(rest) && Math.sqrt(rest) <= c) return [a * a, b * b, c * c, rest];
      }
    }
    return null;
  }
  function gSumSquares(lvl) {
    const n = R.int(...[[10, 40], [40, 80], [60, 120]][lvl]), sol = fourSquares(n);
    return {
      type: 'cells', prompt: `Escribe <b>${n}</b> como suma de <b>números cuadrados</b> (1, 4, 9, 16, 25…). Como mucho 4 sumandos: si te sobra alguna casilla, pon un 0.`,
      html: `<div class="eq big wrap">${n} = ${[0, 1, 2, 3].map(cell).join(' + ')}</div>`,
      cells: sol.map((ans) => ({ ans })),
      validate: (v) => v.every(isSquare) && sum(v) === n,
      hint: 'Empieza por el número cuadrado más grande que quepa y mira cuánto te falta.',
      explain: `Por ejemplo: ${n} = ${sol.filter(Boolean).join(' + ')}. ¡Todos los números naturales se pueden escribir como suma de 4 cuadrados como mucho!`,
    };
  }

  // =====================================================================
  // RESTO DEL CURSO
  // =====================================================================
  function gFracRead(lvl) {
    const n = R.int(...[[2, 6], [3, 10], [4, 12]][lvl]), k = R.int(1, n - 1), kind = n > 8 || R.int(0, 1) ? 'bar' : 'pie';
    return {
      type: 'cells', prompt: '¿Qué fracción está coloreada?',
      html: `<div class="scene">${fracPic(n, k, kind)}</div><div class="eq big">${frac(cell(0), cell(1))}</div>`,
      cells: [{ ans: k }, { ans: n }],
      hint: 'Abajo (denominador): en cuántas partes iguales está partido. Arriba (numerador): cuántas están coloreadas.',
      explain: `${n} partes iguales y ${k} coloreadas: <b>${k}/${n}</b>.`,
    };
  }
  function gFracOf(lvl) {
    const d = R.int(2, [5, 8, 10][lvl]), k = lvl ? R.int(1, d - 1) : 1, m = R.int(2, [6, 10, 15][lvl]), W = d * m;
    return {
      type: 'cells', prompt: '¿Cuánto es la fracción de ese número?',
      html: `<div class="eq big">${frac(k, d)} de ${W} = ${cell(0)}</div>`, cells: [{ ans: m * k }],
      hint: 'Divide entre el denominador y multiplica por el numerador.',
      explain: `${W} : ${d} = ${m}, y ${m} × ${k} = <b>${m * k}</b>.`,
    };
  }
  function gFracCompare(lvl) {
    let a, b, c, d;
    if (lvl === 0) { d = b = R.int(3, 12); [a, c] = R.sample(range(1, b - 1), 2); }
    else if (lvl === 1) { a = c = R.int(1, 5); [b, d] = R.sample(range(a + 1, 12), 2); }
    else {
      b = R.int(2, 6); d = b * R.int(2, 3); a = R.int(1, b - 1); c = R.pick([a * (d / b), a * (d / b) + 1, a * (d / b) - 1].filter((x) => x > 0 && x < d));
    }
    const v1 = a / b, v2 = c / d, right = v1 === v2 ? 'Son iguales' : frac(...(v1 > v2 ? [a, b] : [c, d]));
    const why = lvl === 0 ? 'Mismo denominador: es mayor la que tiene el numerador mayor.' : lvl === 1 ? 'Mismo numerador: es mayor la que tiene el denominador menor (las partes son más grandes).' : `Pasa ${a}/${b} a ${a * (d / b)}/${d} y compara.`;
    return choose('¿Qué fracción es <b>mayor</b>?', right, [frac(a, b), frac(c, d), 'Son iguales'].filter((x) => x !== right),
      { explain: `${why} <b>${v1 === v2 ? 'Son iguales' : `${v1 > v2 ? `${a}/${b}` : `${c}/${d}`} es mayor`}</b>.` });
  }
  function gFracEquiv(lvl) {
    const b = R.int(2, 6), a = R.int(1, b - 1), f = R.int(2, [3, 5, 6][lvl]), top = R.int(0, 1) === 1;
    return {
      type: 'cells', prompt: 'Completa para que las fracciones sean <b>equivalentes</b>.',
      html: `<div class="eq big">${frac(a, b)} = ${top ? frac(cell(0), b * f) : frac(a * f, cell(0))}</div>`,
      cells: [{ ans: top ? a * f : b * f }],
      hint: 'Multiplica el numerador y el denominador por el mismo número.',
      explain: `Multiplicamos arriba y abajo por ${f}: ${a}/${b} = <b>${a * f}/${b * f}</b>.`,
    };
  }
  function gFracAdd(lvl) {
    const d = R.int(3, 12);
    if (lvl === 2 && R.int(0, 1)) {
      const a = R.int(1, d - 1);
      return { type: 'cells', prompt: 'Calcula.', html: `<div class="eq big">1 − ${frac(a, d)} = ${frac(cell(0), d)}</div>`, cells: [{ ans: d - a }], explain: `1 = ${d}/${d}, y ${d}/${d} − ${a}/${d} = <b>${d - a}/${d}</b>.` };
    }
    const plus = lvl === 0 || R.int(0, 1) === 1;
    let [a, b] = [R.int(1, d - 1), R.int(1, d - 1)];
    if (!plus && a < b) [a, b] = [b, a];
    if (!plus && a === b) a = Math.min(d - 1, a + 1), b = Math.max(1, b - 1);
    const ans = plus ? a + b : a - b;
    return {
      type: 'cells', prompt: 'Suma o resta las fracciones (tienen el mismo denominador).',
      html: `<div class="eq big">${frac(a, d)} ${plus ? '+' : '−'} ${frac(b, d)} = ${frac(cell(0), d)}</div>`, cells: [{ ans }],
      hint: 'Con el mismo denominador, se suman o restan los numeradores y el denominador se queda igual.',
      explain: `${a} ${plus ? '+' : '−'} ${b} = ${ans}: <b>${ans}/${d}</b>.`,
    };
  }
  function gMixed(lvl) {
    const d = R.int(2, [4, 6, 9][lvl]), w = R.int(1, [3, 5, 8][lvl]), r = R.int(1, d - 1), n = w * d + r;
    return {
      type: 'cells', prompt: 'Escribe la fracción como <b>número mixto</b>: enteros y una fracción menor que 1.',
      html: `<div class="eq big">${frac(n, d)} = ${cell(0)} enteros y ${frac(cell(1), d)}</div>`,
      cells: [{ ans: w }, { ans: r }],
      hint: `Divide ${n} : ${d}. El cociente son los enteros y el resto, el numerador.`,
      explain: `${n} : ${d} = ${w} R ${r}: <b>${w} enteros y ${r}/${d}</b>.`,
    };
  }

  const DEC_PLACES = ['décimas', 'centésimas', 'milésimas'];
  function gDecPlace(lvl) {
    const k = lvl + 1, digits = R.sample(range(1, 9), k + 1), n = Number(`${digits[0]}.${digits.slice(1).join('')}`), p = R.int(0, k - 1);
    return choose(`¿Qué cifra ocupa las <b>${DEC_PLACES[p]}</b> en <b>${fmt(n)}</b>?`, digits[p + 1], digits.filter((x, i) => i !== p + 1),
      { explain: `Después de la coma: décimas, centésimas, milésimas. En ${fmt(n)} las ${DEC_PLACES[p]} son el <b>${digits[p + 1]}</b>.` });
  }
  function gDecFrac(lvl) {
    const den = [10, 100, 1000][Math.min(lvl, R.int(0, 2))], num = R.int(1, den === 10 ? 9 : den === 100 ? 99 : 999);
    if (R.int(0, 1)) {
      return { type: 'cells', decimals: true, prompt: 'Escribe la fracción decimal como número decimal.', html: `<div class="eq big">${frac(num, den)} = ${cell(0)}</div>`, cells: [{ ans: num / den }],
        hint: 'Entre 10: una cifra después de la coma; entre 100: dos; entre 1000: tres.', explain: `${num}/${den} = <b>${fmt(num / den)}</b>` };
    }
    return { type: 'cells', prompt: 'Escribe el número decimal como fracción decimal.', html: `<div class="eq big">${fmt(num / den)} = ${frac(cell(0), den)}</div>`, cells: [{ ans: num }],
      explain: `${fmt(num / den)} son ${num} ${['décimas', 'centésimas', 'milésimas'][String(den).length - 2]}: <b>${num}/${den}</b>.` };
  }
  function gDecCompare(lvl) {
    const a = R.int(1, 8), b = R.int(1, 9);
    const pool = [...new Set([a / 10, (a * 10 + b) / 100, (b * 10 + a) / 100, (a * 100 + b) / 1000, (a + 1) / 10 - 0.01].map(r3))].filter((x) => x > 0);
    const opts = R.sample(pool, Math.min(4, pool.length)), max = R.int(0, 1) === 1 || lvl === 0;
    const right = max ? Math.max(...opts) : Math.min(...opts);
    return choose(`¿Cuál es el número <b>${max ? 'mayor' : 'menor'}</b>?`, fmt(right), opts.filter((x) => x !== right).map(fmt),
      { hint: 'Compara primero las décimas; si son iguales, las centésimas… ¡Tener más cifras no lo hace mayor!', explain: `${[...opts].sort((x, y) => x - y).map(fmt).join(' < ')}` });
  }
  function gDecOps(lvl) {
    const dp = (x) => (lvl === 0 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100);
    let a = dp(R.int(10, 900) / (lvl ? 100 : 10)), b = dp(R.int(10, 600) / (lvl === 2 ? 10 : lvl ? 100 : 10));
    const plus = lvl === 0 || R.int(0, 1) === 1;
    if (!plus && b > a) [a, b] = [b, a];
    if (lvl === 2 && !plus) a = Math.ceil(b) + R.int(1, 5); // whole number minus a decimal: 9 − 6,35
    const ans = r3(plus ? a + b : a - b);
    return { type: 'cells', decimals: true, prompt: 'Calcula. ¡Coloca bien la coma!', html: `<div class="eq big">${fmt(a)} ${plus ? '+' : '−'} ${fmt(b)} = ${cell(0)}</div>`, cells: [{ ans }],
      hint: 'Alinea las comas: décimas con décimas y centésimas con centésimas. Puedes añadir ceros al final.', explain: `${fmt(a)} ${plus ? '+' : '−'} ${fmt(b)} = <b>${fmt(ans)}</b>` };
  }
  function gDecTimes(lvl) {
    const n = r3(R.int(101, 9999) / R.pick([10, 100])), p = R.pick([10, 100, 1000].slice(0, lvl + 1)), times = R.int(0, 1) === 1;
    const ans = r3(times ? n * p : n / p), z = String(p).length - 1;
    return { type: 'cells', decimals: true, prompt: 'Calcula moviendo la coma.', html: `<div class="eq big">${fmt(n)} ${times ? '×' : ':'} ${fmt(p)} = ${cell(0)}</div>`, cells: [{ ans }],
      explain: `${times ? 'Al multiplicar' : 'Al dividir'} por ${fmt(p)}, la coma se mueve ${z} lugar${z > 1 ? 'es' : ''} a la ${times ? 'derecha' : 'izquierda'}: <b>${fmt(ans)}</b>.` };
  }
  function gPercent(lvl) {
    const p = R.pick([[50, 10], [50, 10, 25, 20], [25, 20, 75, 10, 30]][lvl]), base = { 50: 2, 10: 10, 25: 4, 20: 5, 75: 4, 30: 10 }[p] * R.int(2, 25), ans = (base * p) / 100;
    if (lvl === 2 && R.int(0, 1)) {
      const price = R.pick([20, 40, 60, 80, 120]), off = (price * p) / 100;
      return { type: 'cells', prompt: `Unas zapatillas cuestan <b>${price} €</b> y tienen un <b>${p} % de descuento</b>.`,
        html: `<div class="pair"><div class="op known">Descuento: ${cell(0)} €</div><div class="op ask">Precio final: ${cell(1)} €</div></div>`,
        cells: [{ ans: off, stage: 0 }, { ans: price - off, stage: 1 }], explain: `${p} % de ${price} = ${off} €. ${price} − ${off} = <b>${price - off} €</b>.` };
    }
    const tip = { 50: 'El 50 % es la mitad.', 10: 'El 10 % es dividir entre 10.', 25: 'El 25 % es la cuarta parte.', 20: 'El 20 % es la quinta parte.', 75: 'El 75 % son tres cuartas partes.', 30: 'El 30 % es 3 veces el 10 %.' }[p];
    return one('Calcula el porcentaje.', `${p} % de ${base}`, ans, { hint: tip, explain: `${tip} <b>${ans}</b>.` });
  }

  function gMultiplesBoard(lvl) {
    const n = R.int(2, [5, 7, 9][lvl]), to = 50;
    return { type: 'paint', prompt: `Toca todos los <b>múltiplos de ${n}</b>.`, board: { to, width: 10 }, targets: range(1, Math.floor(to / n)).map((k) => k * n),
      hint: `Los múltiplos de ${n} son los resultados de su tabla: ${n}, ${2 * n}, ${3 * n}…`, explain: `Múltiplos de ${n}: ${range(1, Math.floor(to / n)).map((k) => k * n).join(', ')}.` };
  }
  function gDivisorsBoard(lvl) {
    const N = R.pick([[12, 16, 18, 20], [24, 28, 30, 36], [40, 42, 48, 60]][lvl]), divs = range(1, N).filter((d) => N % d === 0);
    return { type: 'paint', prompt: `Toca todos los <b>divisores de ${N}</b>.`, board: { to: N, width: N > 30 ? 10 : 6 }, targets: divs,
      hint: `Un divisor de ${N} divide a ${N} sin que sobre nada. Búscalos por parejas: 1 × ${N}, 2 × …`, explain: `Divisores de ${N}: ${divs.join(', ')}.` };
  }
  function gPrimes(lvl) {
    const to = [20, 30, 50][lvl], primes = range(2, to).filter((n) => range(2, Math.floor(Math.sqrt(n))).every((d) => n % d));
    return { type: 'paint', prompt: `Toca todos los <b>números primos</b> hasta el ${to}.`, board: { to, width: 10 }, targets: primes,
      hint: 'Un número primo solo tiene dos divisores: el 1 y él mismo. ¡El 1 no es primo!', explain: `Primos: ${primes.join(', ')}.` };
  }
  const CRITERIA = { 2: 'acaba en cifra par (0, 2, 4, 6, 8)', 3: 'la suma de sus cifras es múltiplo de 3', 5: 'acaba en 0 o en 5', 9: 'la suma de sus cifras es múltiplo de 9', 10: 'acaba en 0' };
  function gCriteria(lvl) {
    const k = R.pick([[2, 5, 10], [2, 3, 5], [3, 9, 5]][lvl]), hi = [99, 999, 9999][lvl];
    let right;
    do { right = R.int(12, hi); } while (right % k);
    const wrongs = new Set();
    while (wrongs.size < 3) { const v = R.int(12, hi); if (v % k) wrongs.add(v); }
    return choose(`¿Cuál de estos números es <b>divisible por ${k}</b>?`, fmt(right), [...wrongs].map(fmt),
      { hint: `Un número es divisible por ${k} si ${CRITERIA[k]}.`, explain: `<b>${fmt(right)}</b>: ${CRITERIA[k]}.` });
  }

  function gPow(lvl) {
    if (R.int(0, 3) === 0) {
      const b = R.int(2, 9), e = R.int(3, 5);
      return choose(`¿Cómo se escribe como potencia?<div class="eq big">${Array(e).fill(b).join(' × ')}</div>`, `${b}<sup>${e}</sup>`, [`${e}<sup>${b}</sup>`, `${b} × ${e}`, `${b * e}`],
        { explain: `El ${b} se multiplica ${e} veces: <b>${b}<sup>${e}</sup></b> (base ${b}, exponente ${e}).` });
    }
    const ten = lvl === 2 && R.int(0, 1), b = ten ? 10 : R.int(2, [5, 9, 12][lvl]), e = ten ? R.int(2, 6) : R.int(2, lvl ? 3 : 2), ans = b ** e;
    return one('Calcula la potencia.', `${b}<sup>${e}</sup>`, ans, { hint: `${b}<sup>${e}</sup> = ${Array(e).fill(b).join(' × ')}`, explain: `${Array(e).fill(b).join(' × ')} = <b>${fmt(ans)}</b>` });
  }
  function gRoman(lvl) {
    const n = R.int(1, [50, 500, 3999][lvl]);
    const why = 'I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Un símbolo menor delante de uno mayor resta (IV = 4).';
    if (R.int(0, 1)) return one(`¿Qué número es <b class="roman">${roman(n)}</b>?`, `<span class="roman">${roman(n)}</span>`, n, { hint: why, explain: `${roman(n)} = <b>${fmt(n)}</b>` });
    const wrongs = [n + 1, n - 1, n + 10, n + 5, n - 10].filter((x) => x > 0 && x < 4000).map(roman);
    return choose(`¿Cómo se escribe <b>${fmt(n)}</b> en números romanos?`, `<span class="roman">${roman(n)}</span>`, wrongs.map((r) => `<span class="roman">${r}</span>`), { hint: why, explain: `${fmt(n)} = <b>${roman(n)}</b>` });
  }
  function gReadNumber(lvl) {
    const len = [R.int(5, 6), 7, R.int(8, 9)][lvl];
    let n;
    do { n = randDigits(len); } while (!String(n).includes('0') && R.int(0, 2));
    if (R.int(0, 1)) return one(`Escribe con cifras: <b>${words(n)}</b>.`, '', n, { html: `<div class="eq big">${cell(0)}</div>`, explain: `<b>${fmt(n)}</b>` });
    const ds = String(n).split(''), wrong = new Set();
    for (let g = 0; wrong.size < 3 && g < 40; g++) {
      const c = [...ds], i = R.int(1, c.length - 1), j = Math.min(c.length - 1, i + 1);
      if (R.int(0, 1)) [c[i], c[j]] = [c[j], c[i]]; else c[i] = c[i] === '0' ? String(R.int(1, 9)) : '0';
      const v = Number(c.join(''));
      if (v !== n) wrong.add(words(v));
    }
    return choose(`¿Cómo se lee <b>${fmt(n)}</b>?`, words(n), [...wrong], { explain: `${fmt(n)}: <b>${words(n)}</b>.` });
  }
  function gCombined(lvl) {
    const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), d = R.int(1, 9);
    const forms = [
      [`${a} + ${b} × ${c}`, a + b * c, `Primero la multiplicación: ${b} × ${c} = ${b * c}; luego ${a} + ${b * c}.`],
      [`${a * c + d} − ${a} × ${c}`, d, `Primero ${a} × ${c} = ${a * c}; luego ${a * c + d} − ${a * c}.`],
      [`(${a} + ${b}) × ${c}`, (a + b) * c, `Primero el paréntesis: ${a} + ${b} = ${a + b}; luego × ${c}.`],
      [`${a} × (${b + c} − ${c})`, a * b, `Paréntesis: ${b + c} − ${c} = ${b}; luego ${a} × ${b}.`],
      [`${a} × ${b} + ${c} × ${d}`, a * b + c * d, `Las dos multiplicaciones primero: ${a * b} + ${c * d}.`],
      [`${a} × (${b} + ${c}) − ${d * a} : ${a}`, a * (b + c) - d, `Paréntesis (${b + c}), luego ${a} × ${b + c} = ${a * (b + c)} y ${d * a} : ${a} = ${d}; al final la resta.`],
    ];
    const [t, ans, why] = R.pick(forms.slice(0, [2, 4, 6][lvl]));
    return one('Calcula. Recuerda el orden: <b>paréntesis</b>, después <b>× y :</b>, y al final <b>+ y −</b>.', t, ans, { hint: why, explain: `${why} <b>= ${ans}</b>` });
  }

  const ANGLE_TYPES = [['agudo', 20, 80], ['recto', 90, 90], ['obtuso', 100, 170], ['llano', 180, 180]];
  function gAngle(lvl) {
    const [name, lo, hi] = R.pick(lvl ? ANGLE_TYPES : ANGLE_TYPES.slice(0, 3)), deg = R.int(lo, hi);
    return choose(`¿Qué tipo de ángulo es?<div class="scene">${angleFig(deg)}</div>`, name, ANGLE_TYPES.map((x) => x[0]).filter((x) => x !== name),
      { explain: `Mide ${deg}°: es <b>${name}</b>. Agudo < 90° · recto = 90° · obtuso entre 90° y 180° · llano = 180°.` });
  }
  function gTriangle(lvl) {
    if (lvl === 0 || R.int(0, 1)) {
      const kind = R.pick(['equilátero', 'isósceles', 'escaleno']);
      let s;
      if (kind === 'equilátero') { const L = R.int(3, 9); s = [L, L, L]; }
      else if (kind === 'isósceles') { const L = R.int(5, 9); let B; do { B = R.int(3, 9); } while (B === L); s = R.shuffle([L, L, B]); }
      else { do { s = R.sample(range(4, 10), 3); } while (s[0] + s[1] <= s[2] || s[0] + s[2] <= s[1] || s[1] + s[2] <= s[0]); }
      return choose(`Según sus <b>lados</b>, ¿qué triángulo es?<div class="scene">${triangleFig(s[0], s[1], s[2], { sides: s.map((x) => x + ' cm') })}</div>`, kind, ['equilátero', 'isósceles', 'escaleno'],
        { explain: `Equilátero: 3 lados iguales · isósceles: 2 iguales · escaleno: todos distintos. Es <b>${kind}</b>.` });
    }
    const kind = R.pick(['acutángulo', 'rectángulo', 'obtusángulo']);
    let A;
    do {
      const first = kind === 'rectángulo' ? 90 : kind === 'obtusángulo' ? R.int(100, 130) : R.int(50, 80);
      const second = R.int(20, Math.min(85, 170 - first));
      A = [first, second, 180 - first - second];
    } while (A[2] < 15 || (kind === 'acutángulo' && Math.max(...A) >= 90));
    A = R.shuffle(A);
    const sd = A.map((x) => Math.sin((x * Math.PI) / 180));
    return choose(`Según sus <b>ángulos</b>, ¿qué triángulo es?<div class="scene">${triangleFig(sd[0], sd[1], sd[2], { angles: A })}</div>`, kind, ['acutángulo', 'rectángulo', 'obtusángulo'],
      { explain: `Ángulos: ${A.join('°, ')}°. Rectángulo: tiene un ángulo de 90° · obtusángulo: uno mayor de 90° · acutángulo: los tres menores de 90°. Es <b>${kind}</b>.` });
  }
  const POLY = { 3: 'triángulo', 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono', 7: 'heptágono', 8: 'octógono', 9: 'eneágono', 10: 'decágono' };
  function gPolygon(lvl) {
    const n = R.int(3, [6, 8, 10][lvl]);
    return choose(`¿Cómo se llama este polígono?<div class="scene">${polygonFig(n, lvl === 2)}</div>`, POLY[n], R.shuffle(Object.keys(POLY).filter((k) => +k !== n)).map((k) => POLY[k]),
      { hint: 'Cuenta los lados.', explain: `Tiene ${n} lados: es un <b>${POLY[n]}</b>.` });
  }
  function gCircle(lvl) {
    if (lvl === 2 && R.int(0, 1)) {
      const r = R.int(2, 15), fromR = R.int(0, 1) === 1;
      return fromR ? one(`Una circunferencia tiene un <b>radio</b> de ${r} cm. ¿Cuánto mide su <b>diámetro</b>?`, 'Diámetro', 2 * r, { explain: `El diámetro mide el doble que el radio: <b>${2 * r} cm</b>.` })
        : one(`Una circunferencia tiene un <b>diámetro</b> de ${2 * r} cm. ¿Cuánto mide su <b>radio</b>?`, 'Radio', r, { explain: `El radio es la mitad del diámetro: <b>${r} cm</b>.` });
    }
    const part = R.pick(['radio', 'diámetro', 'cuerda', 'arco', 'centro']);
    return choose(`¿Cómo se llama lo que está en rojo?<div class="scene">${circleFig(part)}</div>`, part, ['radio', 'diámetro', 'cuerda', 'arco', 'centro'].filter((x) => x !== part),
      { explain: 'Radio: del centro a la circunferencia · diámetro: cuerda que pasa por el centro · cuerda: une dos puntos de la circunferencia · arco: un trozo de circunferencia.' });
  }

  const UNITS = {
    longitud: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
    capacidad: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'],
    masa: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'],
  };
  const EASY_PAIRS = [['longitud', 0, 3], ['longitud', 3, 5], ['longitud', 5, 6], ['masa', 0, 3], ['capacidad', 3, 6], ['longitud', 3, 6]];
  function gConvert(lvl) {
    let fam, i, j;
    if (lvl === 0) [fam, i, j] = R.pick(EASY_PAIRS);
    else { fam = R.pick(Object.keys(UNITS)); [i, j] = R.sample(range(0, 6), 2).sort((a, b) => a - b); if (j - i > 3) j = i + 3; }
    const down = lvl === 0 || R.int(0, 2) > 0, f = 10 ** (j - i), u = UNITS[fam];
    let v, ans, from, to;
    if (down) { v = lvl === 2 ? R.int(11, 99) / 10 : R.int(2, 40); ans = r3(v * f); from = u[i]; to = u[j]; }
    else { v = R.int(1, 99) * (lvl === 2 ? 10 ** R.int(0, j - i) : f); ans = r3(v / f); from = u[j]; to = u[i]; }
    return { type: 'cells', decimals: true, prompt: `Pasa de <b>${from}</b> a <b>${to}</b>.`, html: `<div class="eq big">${fmt(v)} ${from} = ${cell(0)} ${to}</div>`, cells: [{ ans }],
      hint: `${u.join(' → ')}: cada paso a la derecha es × 10.`, explain: `De ${from} a ${to} hay ${j - i} paso${j - i > 1 ? 's' : ''}: ${down ? '×' : ':'} ${fmt(f)}. <b>${fmt(v)} ${from} = ${fmt(ans)} ${to}</b>` };
  }
  function gArea(lvl) {
    const w = R.int(2, 9), h = R.int(2, 7);
    if (lvl === 2 && R.int(0, 1)) {
      const b = w % 2 ? w + 1 : w;
      return one('¿Cuál es el <b>área</b> del triángulo?', `<span class="fig-wrap">${rectFig(b, h, true)}</span><br>Área (cm²)`, (b * h) / 2,
        { hint: 'Área del triángulo = base × altura : 2', explain: `${b} × ${h} : 2 = <b>${(b * h) / 2} cm²</b>` });
    }
    const per = lvl > 0 && R.int(0, 1);
    return one(`¿Cuál es el <b>${per ? 'perímetro' : 'área'}</b> del rectángulo?`, `<span class="fig-wrap">${rectFig(w, h)}</span><br>${per ? 'Perímetro (cm)' : 'Área (cm²)'}`, per ? 2 * (w + h) : w * h,
      { hint: per ? 'El perímetro es la suma de todos los lados.' : 'Área del rectángulo = base × altura (o cuenta los cuadraditos).', explain: per ? `${w} + ${h} + ${w} + ${h} = <b>${2 * (w + h)} cm</b>` : `${w} × ${h} = <b>${w * h} cm²</b>` });
  }

  const pad2 = (m) => String(m).padStart(2, '0');
  function gClock(lvl) {
    const h = R.int(1, 12), m = R.int(0, [3, 11, 59][lvl]) * [15, 5, 1][lvl];
    const t = (hh, mm) => `${((hh + 11) % 12) + 1}:${pad2(((mm % 60) + 60) % 60)}`;
    const wrongs = [t(h + 1, m), t(Math.round(m / 5) || 12, (h % 12) * 5), t(h, m + 5), t(h - 1, m), t(h, m - 5)];
    return choose(`¿Qué hora marca el reloj?<div class="scene">${clock(h, m)}</div>`, t(h, m), wrongs,
      { hint: 'La aguja corta marca la hora; la larga (roja), los minutos: cada número son 5 minutos.', explain: `La aguja corta está en el ${h}${m ? ' (o pasada)' : ''} y la larga marca ${m} minutos: <b>${t(h, m)}</b>.` });
  }
  function gTimeConv(lvl) {
    const kind = R.int(0, [1, 3, 4][lvl]);
    if (kind === 0) { const h = R.int(1, 5), m = R.int(0, 11) * 5; return one(`¿Cuántos minutos son <b>${h} h ${m} min</b>?`, `${h} h ${m} min`, h * 60 + m, { hint: '1 hora = 60 minutos.', explain: `${h} × 60 + ${m} = <b>${h * 60 + m} min</b>` }); }
    if (kind === 1) { const m = R.int(2, 9); return one(`¿Cuántos segundos son <b>${m} minutos</b>?`, `${m} min`, m * 60, { explain: `${m} × 60 = <b>${m * 60} s</b>` }); }
    if (kind === 2) { const w = R.int(3, 20); return one(`¿Cuántos días hay en <b>${w} semanas</b>?`, `${w} semanas`, w * 7, { explain: `${w} × 7 = <b>${w * 7} días</b>` }); }
    if (kind === 3) { const d = R.int(2, 6); return one(`¿Cuántas horas hay en <b>${d} días</b>?`, `${d} días`, d * 24, { explain: `${d} × 24 = <b>${d * 24} horas</b>` }); }
    const t = R.int(70, 300);
    return { type: 'cells', prompt: `Expresa <b>${t} minutos</b> en horas y minutos.`, html: `<div class="eq big">${t} min = ${cell(0)} h ${cell(1)} min</div>`, cells: [{ ans: Math.floor(t / 60) }, { ans: t % 60 }],
      hint: 'Divide entre 60: el cociente son las horas y el resto, los minutos.', explain: `${t} : 60 = ${Math.floor(t / 60)} R ${t % 60}: <b>${Math.floor(t / 60)} h ${t % 60} min</b>` };
  }
  function gTimeAdd(lvl) {
    const h = R.int(9, 20), m = R.int(0, 11) * 5, dh = lvl ? R.int(0, 2) : 0, dm = R.int(lvl ? 5 : 10, 55 - (lvl ? 0 : 0)) - (R.int(0, 1) ? 0 : 0);
    const total = h * 60 + m + dh * 60 + dm, eh = Math.floor(total / 60) % 24, em = total % 60;
    return { type: 'cells', prompt: `Una película empieza a las <b>${h}:${pad2(m)}</b> y dura <b>${dh ? `${dh} h ` : ''}${dm} min</b>. ¿A qué hora termina?`,
      html: `<div class="eq big">${cell(0)} : ${cell(1)}</div>`, cells: [{ ans: eh }, { ans: em }],
      hint: 'Suma primero las horas y luego los minutos. Si pasas de 60 minutos, son una hora más.', explain: `${h}:${pad2(m)} + ${dh ? `${dh} h ` : ''}${dm} min = <b>${eh}:${pad2(em)}</b>` };
  }

  const CHART_CATS = [['🍎', '#ff5a6e', 'manzana'], ['🍌', '#ffd23f', 'plátano'], ['🍇', '#8b6cff', 'uva'], ['🍊', '#ff9d3d', 'naranja'], ['🍓', '#ff6fb1', 'fresa']];
  function gChart(lvl) {
    const n = [3, 4, 5][lvl], cats = R.sample(CHART_CATS, n);
    let vals;
    do { vals = cats.map(() => R.int(2, lvl ? 14 : 10)); } while (new Set(vals).size !== n);
    const kind = R.pick([['moda', 'total'], ['moda', 'total', 'diferencia'], ['total', 'diferencia', 'media']][lvl]);
    if (kind === 'media') { const t = sum(vals), fix = (n - (t % n)) % n; vals[vals.indexOf(Math.min(...vals))] += fix; if (new Set(vals).size !== n) return gChart(lvl); }
    const data = cats.map((c, i) => ({ e: c[0], c: c[1], v: vals[i] })), chart = `<div class="scene">${barChart(data, lvl === 0)}</div>`;
    const intro = `Votos de la clase a su fruta favorita.${chart}`;
    if (kind === 'moda') {
      const mx = cats[vals.indexOf(Math.max(...vals))];
      return choose(`${intro}¿Cuál es la <b>moda</b> (la fruta más votada)?`, `${mx[0]} ${mx[2]}`, cats.filter((c) => c !== mx).map((c) => `${c[0]} ${c[2]}`), { explain: `La moda es el dato que más se repite: <b>${mx[0]} ${mx[2]}</b> con ${Math.max(...vals)} votos.` });
    }
    if (kind === 'total') return one(`${intro}¿Cuántos votos hay en total?`, 'Total', sum(vals), { explain: `${vals.join(' + ')} = <b>${sum(vals)}</b>` });
    if (kind === 'diferencia') {
      const [i, j] = R.sample(range(0, n - 1), 2).sort((a, b) => vals[b] - vals[a]);
      return one(`${intro}¿Cuántos votos más tiene ${cats[i][0]} que ${cats[j][0]}?`, `${cats[i][0]} − ${cats[j][0]}`, vals[i] - vals[j], { explain: `${vals[i]} − ${vals[j]} = <b>${vals[i] - vals[j]}</b>` });
    }
    return one(`${intro}¿Cuál es la <b>media</b> de votos por fruta?`, 'Media', sum(vals) / n, { hint: 'Suma todos los votos y divide entre el número de frutas.', explain: `${vals.join(' + ')} = ${sum(vals)}; ${sum(vals)} : ${n} = <b>${sum(vals) / n}</b>` });
  }
  function gMean(lvl) {
    const n = [3, 4, 5][lvl], m = R.int(4, [10, 20, 50][lvl]);
    let devs;
    do { devs = Array.from({ length: n - 1 }, () => R.int(-3, 3) * (lvl + 1)); devs.push(-sum(devs)); } while (devs.some((d) => m + d <= 0) || devs.every((d) => !d));
    const vals = R.shuffle(devs.map((d) => m + d));
    const [what, ctx] = R.pick([['goles', 'Goles marcados en cada partido'], ['puntos', 'Puntos en cada partida'], ['km', 'Kilómetros recorridos cada día']]);
    return one(`${ctx}: <b>${vals.join(', ')}</b>. ¿Cuál es la <b>media</b>?`, 'Media', m, { hint: 'Suma todos los datos y divide entre cuántos datos hay.', explain: `${vals.join(' + ')} = ${sum(vals)}; ${sum(vals)} : ${n} = <b>${m} ${what}</b>` });
  }
  const BALLS = [['🔴', 'roja', 'rojas'], ['🔵', 'azul', 'azules'], ['🟢', 'verde', 'verdes'], ['🟡', 'amarilla', 'amarillas']];
  function gProb(lvl) {
    const cols = R.sample(BALLS, R.int(2, 3));
    let counts;
    do { counts = cols.map(() => R.int(1, 6)); } while (new Set(counts).size !== counts.length);
    const bag = `<div class="bag">${R.shuffle(cols.flatMap((c, i) => Array(counts[i]).fill(c[0]))).join('')}</div>`, total = sum(counts);
    if (lvl === 0) {
      const mx = cols[counts.indexOf(Math.max(...counts))];
      return choose(`Sacamos una bola sin mirar.${bag}¿De qué color es <b>más probable</b> que salga?`, `${mx[0]} ${mx[1]}`, cols.filter((c) => c !== mx).map((c) => `${c[0]} ${c[1]}`), { explain: `Hay más bolas ${mx[2]} (${Math.max(...counts)}): es lo más probable.` });
    }
    if (lvl === 1) {
      const missing = BALLS.find((b) => !cols.includes(b)), q = R.pick([['imposible', missing], ['posible', cols[0]], ['seguro', null]]);
      const text = q[0] === 'seguro' ? 'que salga una bola' : `que salga una bola ${q[1][1]}`;
      return choose(`Sacamos una bola sin mirar.${bag}¿Es seguro, posible o imposible ${text}?`, q[0], ['seguro', 'posible', 'imposible'], { explain: q[0] === 'imposible' ? 'No hay ninguna: es <b>imposible</b>.' : q[0] === 'seguro' ? 'Todas son bolas: es <b>seguro</b>.' : 'Hay alguna, pero también hay de otros colores: es <b>posible</b>.' });
    }
    const i = R.int(0, cols.length - 1), c = counts[i];
    return { type: 'cells', prompt: `Sacamos una bola sin mirar.${bag}¿Cuál es la <b>probabilidad</b> de sacar una bola ${cols[i][1]}?`, html: `<div class="eq big">${frac(cell(0), cell(1))}</div>`,
      cells: [{ ans: c }, { ans: total }], validate: ([n, d]) => d > 0 && n * total === c * d,
      hint: 'Casos favorables (bolas de ese color) entre casos posibles (todas las bolas).', explain: `Hay ${c} bolas ${cols[i][2]} de ${total}: <b>${c}/${total}</b>.` };
  }

  // =====================================================================
  // ARCADE
  // =====================================================================
  function gBattle(lvl) {
    const a = R.int(lvl ? 3 : 2, lvl === 2 ? 12 : 9), b = R.int(2, 9);
    return one('', `${a} × ${b}`, a * b, { explain: `${a} × ${b} = <b>${a * b}</b>` });
  }
  function gMental(lvl) {
    const n = R.int(lvl ? 150 : 101, lvl === 2 ? 9000 : 900);
    const [t, ans] = R.pick([[`${fmt(n)} + 9`, n + 9], [`${fmt(n)} + 99`, n + 99], [`${fmt(n)} − 9`, n - 9], [`${fmt(n)} + 101`, n + 101], [`${fmt(n)} − 99`, n - 99], [`${n} × 10`, n * 10], [`${n} × 100`, n * 100], [`${fmt(n * 10)} : 10`, n], [`${fmt(n)} + 11`, n + 11], [`${fmt(n)} − 11`, n - 11]]);
    return one('', t, ans, { explain: `${t} = <b>${fmt(ans)}</b>. Truco: +99 es +100 −1; +101 es +100 +1.` });
  }
  function gDivFast(lvl) {
    const d = R.int(2, 9), q = R.int(2, lvl === 2 ? 12 : 10);
    return one('', `${d * q} : ${d}`, q, { explain: `${d * q} : ${d} = <b>${q}</b> porque ${d} × ${q} = ${d * q}.` });
  }
  function gSqFast(lvl) {
    const k = R.int(1, [10, 12, 15][lvl]);
    return one('', `${k} × ${k}`, k * k, { explain: `${k} × ${k} = <b>${k * k}</b>` });
  }

  // =====================================================================
  // Units and sections
  // =====================================================================
  const C1 = (u) => Object.assign({ section: 'c1' }, u), C2 = (u) => Object.assign({ section: 'c2' }, u);
  const strategies = C1({ id: 'est', title: 'Espacio para familias', planet: 'Base Estrategia', emoji: '🧪', color: '#7d8cff', missions: [
    { id: 'saltos', title: 'Saltos en la recta', desc: 'Sumas y restas saltando: centenas, decenas, unidades', rounds: 5, gen: gJumps },
    { id: 'descompon', title: 'Sumamos descomponiendo', desc: 'Cada orden por separado y después juntamos', rounds: 4, gen: gDecompAdd },
    { id: 'derivados', title: 'Hechos conocidos y derivados', desc: 'De 6 × 5 a 12 × 50 sin empezar de cero', rounds: 5, gen: gDerived },
    { id: 'posicion', title: '¿Cuánto vale la cifra?', desc: 'El sistema decimal posicional', rounds: 5, gen: gPlace },
    { id: 'ordena', title: 'Ordena números grandes', desc: 'Hasta los millones', rounds: 4, gen: gOrderBig },
  ] });
  const c1 = [
    C1({ id: 'u11', n: 11, title: 'Aproximamos números', planet: 'Planeta Redondo', emoji: '🌍', color: '#4fd1c5', missions: [
      { id: 'redondea', title: 'Redondea', desc: 'A los millares, centenas de millar y millones', rounds: 5, gen: gRound },
      { id: 'paises', title: 'Países de la zona euro', desc: 'Poblaciones en la recta numérica', rounds: 5, gen: gPopulation },
      { id: 'tarjetas', title: 'Nueve tarjetas', desc: 'El mayor y el menor número posible', rounds: 3, gen: gCardsBig },
    ] }),
    C1({ id: 'u12', n: 12, title: 'Conocemos los números cuadrados', planet: 'Planeta Cuadrado', emoji: '🟪', color: '#8b6cff', missions: [
      { id: 'cuadricula', title: '¿Cuántos cuadraditos?', desc: 'n × n en la cuadrícula', rounds: 4, gen: gSqGrid },
      { id: 'cadena', title: 'La cadena de cuadrados', desc: '1, 4, 9, 16… ¿cuáles faltan?', rounds: 3, gen: gSqChain },
      { id: 'saltos', title: 'Saltos entre cuadrados', desc: '¿Cuánto hay del uno al siguiente?', rounds: 4, gen: gSqJump },
      { id: 'cuatro', title: 'Cuatro números seguidos', desc: '1 × 2 × 3 × 4 y su cuadrado más cercano', rounds: 3, gen: gSqProduct },
      { id: 'cual', title: '¿Es cuadrado o no?', desc: 'Encuentra los números cuadrados', rounds: 5, gen: gIsSquare },
    ] }),
    C1({ id: 'u13', n: 13, title: 'Trabajamos con números cuadrados', planet: 'Laboratorio Cuadrado', emoji: '🔬', color: '#c58bff', missions: [
      { id: 'cifras', title: 'Suma sus cifras', desc: '¿En qué cifra acaban los cuadrados?', rounds: 4, gen: gDigitRoot },
      { id: 'mas1', title: 'Multiplica y suma 1', desc: '4 × 6 + 1, 4 × 20 + 1…', rounds: 4, gen: gPlusOne },
      { id: 'extremos', title: 'Extremos y medio', desc: '4 cuadrados seguidos', rounds: 3, gen: gFourSquares },
    ] }),
    C1({ id: 'u14', n: 14, title: 'Multiplicamos descomponiendo', planet: 'Planeta Patrón', emoji: '🔮', color: '#ff6fb1', missions: [
      { id: 'patron', title: 'Descubre el patrón', desc: '12 × 9, 123 × 9… ¿y el siguiente?', rounds: 4, gen: gPattern },
      { id: 'espejo', title: 'Multiplicaciones espejo', desc: '198 × 9 y 891 × 2', rounds: 4, gen: gMirror },
    ] }),
    C1({ id: 'u15', n: 15, title: 'Multiplicamos descomponiendo', planet: 'Taller Mosaico', emoji: '🔲', color: '#ff7a59', missions: [
      { id: 'seguidos', title: 'Tres números seguidos', desc: 'El primero por el último y el del medio por sí mismo', rounds: 4, gen: gConsec },
      { id: 'mosaicos', title: 'Mosaicos', desc: 'Problemas de baldosas', rounds: 3, gen: gMosaic },
    ] }),
    C1({ id: 'u16', n: 16, title: 'Dividimos descomponiendo', planet: 'Fábrica de Paquetes', emoji: '📦', color: '#ff9d3d', missions: [
      { id: 'paquetes', title: 'Paquetes y ramos', desc: '¿Cuántos y cuántos sobran?', rounds: 5, gen: gPack },
      { id: 'triangulos', title: 'Triángulos de división', desc: '18 : 6 y 19 : 6', rounds: 5, gen: gFactTriangle },
      { id: 'telaraña', title: 'La telaraña', desc: '68 : 2 = 60 : 2 + 8 : 2', rounds: 4, gen: gWeb },
    ] }),
    C1({ id: 'u17', n: 17, title: 'Dividimos descomponiendo', planet: 'Planeta Trocitos', emoji: '✂️', color: '#ffd23f', missions: [
      { id: 'trocitos', title: 'Divide a trocitos', desc: '440 = 300 + 120 + 20', rounds: 5, gen: gDivDecomp },
    ] }),
    C1({ id: 'u18', n: 18, title: 'Dividimos repartiendo', planet: 'Planeta Reparto', emoji: '🍰', color: '#ff5a6e', missions: [
      { id: 'repartos', title: 'Estrategia de repartos', desc: 'Damos a cada uno, quitamos y seguimos', rounds: 4, gen: gShare },
      { id: 'entre4', title: 'Cuadrados entre 4', desc: '¿Qué resto dan los pares y los impares?', rounds: 5, gen: gSqBy4 },
    ] }),
    C1({ id: 'u19', n: 19, title: 'Relacionamos multiplicaciones y divisiones', planet: 'Estación Resto', emoji: '🧮', color: '#58c4ff', missions: [
      { id: 'resto', title: 'El resto sin dividir', desc: '725 : 9 = 80 R ?', rounds: 5, gen: gRestFromQ },
      { id: 'calculadora', title: 'Con calculadora', desc: '1789 : 4 = 447,25… ¿y el resto?', rounds: 4, gen: gCalc },
      { id: 'hojas', title: 'Las hojas de colores', desc: 'Repartir entre los grupos', rounds: 3, gen: gSheets },
    ] }),
    C1({ id: 'u20', n: 20, title: 'Practicamos', planet: 'Isla Cuatro Cuadrados', emoji: '🏝️', color: '#2fd9a4', missions: [
      { id: 'sumas', title: 'Suma de cuadrados', desc: 'Cualquier número con 4 cuadrados como mucho', rounds: 4, gen: gSumSquares },
    ] }),
  ];
  const c2 = [
    C2({ id: 'fracciones', title: 'Fracciones', planet: 'Planeta Pizza', emoji: '🍕', color: '#ff9d3d', missions: [
      { id: 'leer', title: '¿Qué fracción es?', desc: 'Quesitos y barras', rounds: 5, gen: gFracRead },
      { id: 'de', title: 'Fracción de un número', desc: '3/4 de 20', rounds: 5, gen: gFracOf },
      { id: 'compara', title: '¿Cuál es mayor?', desc: 'Comparar fracciones', rounds: 5, gen: gFracCompare },
      { id: 'equivalentes', title: 'Fracciones equivalentes', desc: '2/3 = ?/12', rounds: 5, gen: gFracEquiv },
      { id: 'sumas', title: 'Sumas y restas', desc: 'Con el mismo denominador', rounds: 5, gen: gFracAdd },
      { id: 'mixtos', title: 'Números mixtos', desc: '7/2 = 3 y 1/2', rounds: 4, gen: gMixed },
    ] }),
    C2({ id: 'decimales', title: 'Decimales y porcentajes', planet: 'Planeta Coma', emoji: '🔵', color: '#58c4ff', missions: [
      { id: 'cifras', title: 'Décimas, centésimas, milésimas', desc: '¿Qué cifra ocupa cada lugar?', rounds: 5, gen: gDecPlace },
      { id: 'fracciones', title: 'Fracción decimal ↔ decimal', desc: '27/100 = 0,27', rounds: 5, gen: gDecFrac },
      { id: 'compara', title: '¿Cuál es mayor?', desc: '0,5 o 0,45… ¡cuidado!', rounds: 5, gen: gDecCompare },
      { id: 'operaciones', title: 'Sumas y restas', desc: 'Alinea las comas', rounds: 5, gen: gDecOps },
      { id: 'coma', title: 'Por 10, 100 y 1000', desc: 'Mueve la coma', rounds: 5, gen: gDecTimes },
      { id: 'porcentajes', title: 'Porcentajes', desc: '25 % de 80 y descuentos', rounds: 5, gen: gPercent },
    ] }),
    C2({ id: 'divisibilidad', title: 'Múltiplos y divisores', planet: 'Planeta Primo', emoji: '🧲', color: '#ff6fb1', missions: [
      { id: 'multiplos', title: 'Múltiplos', desc: 'Píntalos en el tablero', rounds: 3, gen: gMultiplesBoard },
      { id: 'divisores', title: 'Divisores', desc: 'Todos los divisores de un número', rounds: 3, gen: gDivisorsBoard },
      { id: 'primos', title: 'Números primos', desc: 'Solo se dividen entre 1 y ellos mismos', rounds: 3, gen: gPrimes },
      { id: 'criterios', title: 'Criterios de divisibilidad', desc: 'Por 2, 3, 5, 9 y 10', rounds: 5, gen: gCriteria },
    ] }),
    C2({ id: 'potencias', title: 'Números grandes, potencias y romanos', planet: 'Planeta Potencia', emoji: '⚡', color: '#ffd23f', missions: [
      { id: 'leer', title: 'Lee y escribe números', desc: 'Hasta los cientos de millones', rounds: 5, gen: gReadNumber },
      { id: 'potencias', title: 'Potencias', desc: 'Base y exponente', rounds: 5, gen: gPow },
      { id: 'romanos', title: 'Números romanos', desc: 'I, V, X, L, C, D, M', rounds: 5, gen: gRoman },
      { id: 'combinadas', title: 'Operaciones combinadas', desc: 'Paréntesis, × y :, + y −', rounds: 5, gen: gCombined },
    ] }),
    C2({ id: 'geometria', title: 'Geometría', planet: 'Planeta Polígono', emoji: '📐', color: '#2fd9a4', missions: [
      { id: 'angulos', title: 'Tipos de ángulos', desc: 'Agudo, recto, obtuso, llano', rounds: 5, gen: gAngle },
      { id: 'triangulos', title: 'Tipos de triángulos', desc: 'Por sus lados y por sus ángulos', rounds: 5, gen: gTriangle },
      { id: 'poligonos', title: 'Polígonos', desc: 'Del triángulo al decágono', rounds: 5, gen: gPolygon },
      { id: 'circulo', title: 'Circunferencia y círculo', desc: 'Radio, diámetro, cuerda, arco', rounds: 5, gen: gCircle },
    ] }),
    C2({ id: 'medida', title: 'Medida y áreas', planet: 'Planeta Regla', emoji: '📏', color: '#ff7a59', missions: [
      { id: 'unidades', title: 'Cambio de unidades', desc: 'Longitud, capacidad y masa', rounds: 5, gen: gConvert },
      { id: 'areas', title: 'Áreas y perímetros', desc: 'Rectángulos y triángulos', rounds: 5, gen: gArea },
    ] }),
    C2({ id: 'tiempo', title: 'El tiempo', planet: 'Planeta Reloj', emoji: '⏰', color: '#7d8cff', missions: [
      { id: 'reloj', title: '¿Qué hora es?', desc: 'Lee el reloj de agujas', rounds: 5, gen: gClock },
      { id: 'unidades', title: 'Horas, minutos y segundos', desc: 'Cambia de unidad', rounds: 5, gen: gTimeConv },
      { id: 'pelis', title: '¿A qué hora termina?', desc: 'Sumar tiempos', rounds: 4, gen: gTimeAdd },
    ] }),
    C2({ id: 'datos', title: 'Estadística y probabilidad', planet: 'Planeta Datos', emoji: '📊', color: '#c58bff', missions: [
      { id: 'graficos', title: 'Gráficos de barras', desc: 'Moda, total, diferencias y media', rounds: 5, gen: gChart },
      { id: 'media', title: 'La media', desc: 'Suma y divide', rounds: 4, gen: gMean },
      { id: 'probabilidad', title: 'Probabilidad', desc: 'Seguro, posible, imposible… y fracciones', rounds: 5, gen: gProb },
    ] }),
  ];
  const arcade = { id: 'arcade', section: 'arcade', title: 'Contrarreloj', planet: 'Salón Recreativo', emoji: '🕹️', color: '#ff5a6e', missions: [
    { id: 'batalla', title: 'Batalla de multiplicaciones', desc: '60 segundos de tablas', arcade: { seconds: 60, goals: [10, 16, 22] }, gen: gBattle },
    { id: 'mental', title: 'Cálculo mental', desc: '+9, +99, +101, × 10…', arcade: { seconds: 60, goals: [6, 10, 14] }, gen: gMental },
    { id: 'divisiones', title: 'Divisiones relámpago', desc: 'Divisiones exactas', arcade: { seconds: 60, goals: [8, 14, 20] }, gen: gDivFast },
    { id: 'cuadrados', title: 'Cuadrados relámpago', desc: 'De 1 × 1 a 15 × 15', arcade: { seconds: 45, goals: [8, 13, 18] }, gen: gSqFast },
  ] };

  sub.units.forEach((u) => (u.section = 'c1'));
  sub.units.unshift(strategies);
  sub.units.push(...c1, ...c2, arcade);
  sub.sections = [
    { id: 'c1', key: 'mates5', emoji: '📗', title: 'Cuadernillo 1', subtitle: 'Las sesiones del primer trimestre de Innovamat',
      exam: { title: 'Agujero Negro: el Examen', label: 'Simulacro del cuadernillo 1' } },
    { id: 'c2', key: 'mates5.c2', emoji: '📘', title: 'Resto de 5.º', subtitle: 'Fracciones, decimales, geometría, medida y más (para los próximos cuadernillos)',
      exam: { title: 'Supernova: repaso del curso', label: 'Repaso de todo', emoji: '🌟', rounds: 12 } },
    { id: 'arcade', key: 'mates5.arcade', emoji: '🕹️', title: 'Arcade', subtitle: 'Contra el reloj. ¡Bate tu récord!', exam: false },
  ];
  sub.tagline = 'Cuadernillo 1, todo el curso y arcade';

  // Shared with the other school years (primaria.js): drawing helpers and the
  // generators, which other courses use at a fixed or capped level.
  S.kit = {
    one, choose, frac, cell, sum, range, r3, gcd, isSquare, words, roman, randDigits, PLACES,
    svg, fracPic, clock, angleFig, triangleFig, polygonFig, rectFig, barChart,
    g: {
      gJumps, gDecompAdd, gDerived, gPlace, gOrderBig, gRound, gCardsBig, gPack, gFactTriangle, gWeb, gDivDecomp, gShare, gRestFromQ, gCalc,
      gFracRead, gFracOf, gFracCompare, gFracEquiv, gFracAdd, gMixed,
      gDecPlace, gDecFrac, gDecCompare, gDecOps, gDecTimes, gPercent,
      gMultiplesBoard, gDivisorsBoard, gPrimes, gCriteria, gPow, gRoman, gReadNumber, gCombined,
      gAngle, gTriangle, gPolygon, gCircle, gConvert, gArea, gClock, gTimeConv, gTimeAdd, gChart, gMean, gProb,
      gBattle, gMental, gDivFast, gSqFast,
    },
  };
})();
