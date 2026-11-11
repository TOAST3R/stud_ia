// Maths for 1.º, 2.º, 3.º, 4.º and 6.º de Primaria (5.º lives in mates5*.js).
// Topics follow the Spanish curriculum as organised in the Santillana / RecursosEP
// workbooks the family shared. Generators already written for 5.º (S.kit.g) are
// reused here at a fixed or capped level; the rest are new.
(function () {
  const S = window.StudIA, { R, fmt } = S, K = S.kit, G = K.g;
  const { one, choose, frac, cell, sum, range, r3, gcd, words, roman, randDigits } = K;

  // level helpers: the same generator at a fixed level, capped, or picked at random
  const at = (g, l) => (lvl, i) => g(l, i);
  const upto = (g, m) => (lvl, i) => g(Math.min(lvl, m), i);
  const mix = (...gens) => (lvl, i) => R.pick(gens)(lvl, i);
  const ri = (a, b) => R.int(a, b);

  // ---------- small drawings ----------
  const blocks = (n) => `<div class="blocks">${'<span class="ten"></span>'.repeat(Math.floor(n / 10))}${'<span class="unit"></span>'.repeat(n % 10)}</div>`;
  const COINS = { 1: ['#e8c34a', '#c79a1e'], 2: ['#e8c34a', '#c9cdd6'] };
  function money(v) {
    if (v <= 2) {
      const [a, b] = COINS[v];
      return `<svg class="coin" viewBox="0 0 60 60" aria-label="${v} euro${v > 1 ? 's' : ''}"><circle cx="30" cy="30" r="27" fill="${b}" stroke="#24164f" stroke-width="3"/><circle cx="30" cy="30" r="19" fill="${a}" stroke="#24164f" stroke-width="2"/><text x="30" y="37" text-anchor="middle" font-size="19" font-weight="900" fill="#24164f">${v}€</text></svg>`;
    }
    const c = { 5: '#9aa7b8', 10: '#e07a6a', 20: '#6aa0e0', 50: '#f0a64a' }[v];
    return `<svg class="note" viewBox="0 0 110 60" aria-label="${v} euros"><rect x="3" y="3" width="104" height="54" rx="7" fill="${c}" stroke="#24164f" stroke-width="3"/><circle cx="80" cy="30" r="15" fill="rgba(255,255,255,.35)"/><text x="30" y="40" text-anchor="middle" font-size="26" font-weight="900" fill="#24164f">${v}</text><text x="80" y="36" text-anchor="middle" font-size="16" font-weight="900" fill="#24164f">€</text></svg>`;
  }
  function solidFig(kind) {
    const O = 'stroke="#24164f" stroke-width="3" stroke-linejoin="round"', d = 'stroke="#24164f" stroke-width="2" stroke-dasharray="5 5" fill="none"';
    const f = {
      cubo: `<path d="M20 40 L70 40 L70 100 L20 100 Z" fill="#7fd3ff" ${O}/><path d="M20 40 L45 20 L95 20 L70 40 Z" fill="#b6e6ff" ${O}/><path d="M70 40 L95 20 L95 80 L70 100 Z" fill="#4fb3e8" ${O}/>`,
      prisma: `<path d="M10 50 L90 50 L90 100 L10 100 Z" fill="#ffb37a" ${O}/><path d="M10 50 L35 30 L115 30 L90 50 Z" fill="#ffd2ad" ${O}/><path d="M90 50 L115 30 L115 80 L90 100 Z" fill="#f08a45" ${O}/>`,
      pirámide: `<path d="M15 95 L75 95 L60 25 Z" fill="#ffe27a" ${O}/><path d="M75 95 L105 78 L60 25 Z" fill="#e8c34a" ${O}/><path d="M15 95 L45 78 L105 78" ${d}/><path d="M45 78 L60 25" ${d}/>`,
      cilindro: `<path d="M25 30 L25 92 A35 12 0 0 0 95 92 L95 30" fill="#9be7b4" ${O}/><ellipse cx="60" cy="30" rx="35" ry="12" fill="#c8f3d6" ${O}/>`,
      cono: `<path d="M25 90 L60 18 L95 90" fill="#ff9fc3" ${O}/><path d="M25 90 A35 12 0 0 0 95 90" fill="#ff9fc3" ${O}/><path d="M25 90 A35 12 0 0 1 95 90" ${d}/>`,
      esfera: `<circle cx="60" cy="58" r="40" fill="#c5b5ff" ${O}/><path d="M20 58 A40 12 0 0 0 100 58" fill="none" stroke="#24164f" stroke-width="2"/><path d="M20 58 A40 12 0 0 1 100 58" ${d}/><circle cx="46" cy="42" r="8" fill="#fff" opacity=".6"/>`,
    }[kind];
    return K.svg(124, 112, f);
  }
  function quadFig(kind) {
    const pts = { cuadrado: '30,20 100,20 100,90 30,90', rectángulo: '10,30 120,30 120,85 10,85', rombo: '65,10 115,55 65,100 15,55', romboide: '35,25 125,25 95,85 5,85', trapecio: '40,25 90,25 120,85 10,85' }[kind];
    return K.svg(130, 110, `<polygon points="${pts}" fill="#ffe2b8" stroke="#ff9d3d" stroke-width="5" stroke-linejoin="round"/>`);
  }
  const shapeFig = (k) => (k === 'círculo' ? K.svg(110, 110, '<circle cx="55" cy="55" r="45" fill="#ffe2b8" stroke="#ff9d3d" stroke-width="5"/>')
    : k === 'triángulo' ? K.svg(110, 100, '<polygon points="55,8 104,92 6,92" fill="#ffe2b8" stroke="#ff9d3d" stroke-width="5" stroke-linejoin="round"/>')
      : k === 'pentágono' ? K.polygonFig(5) : k === 'hexágono' ? K.polygonFig(6) : quadFig(k));
  const sign = (a, b) => (a < b ? '<' : a > b ? '>' : '=');
  const signQ = (a, b, prompt) => choose(prompt || '¿Qué signo va en el hueco?', sign(a, b), ['<', '>', '='], {
    layout: 'big',
    scene: `<div class="eq big">${fmt(a)} <span class="qbox">?</span> ${fmt(b)}</div>`,
    hint: 'La boca del signo se abre hacia el número más grande: 5 > 3.',
    explain: `${fmt(a)} ${sign(a, b)} ${fmt(b)}`,
  });
  function readNum(len) {
    const n = randDigits(len);
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
  function orderNums(nums, extra) {
    let items = [...new Set(nums)];
    while (items.every((x, i) => !i || items[i - 1] <= x)) items = R.shuffle(items);
    return Object.assign({ type: 'order', prompt: 'Ordena los números de <b>menor a mayor</b>.', items: items.map((v) => ({ label: `<span class="bignum">${fmt(v)}</span>`, rank: v })), ends: ['menor', 'mayor'], explain: [...items].sort((a, b) => a - b).map(fmt).join(' < ') }, extra);
  }
  const STUFF = [['🍬', 'caramelos'], ['🖍️', 'ceras'], ['⚽', 'balones'], ['🍪', 'galletas'], ['🎈', 'globos'], ['📚', 'libros'], ['🐟', 'peces'], ['🌸', 'flores']];
  const KIDS = ['Ana', 'Leo', 'Marta', 'Hugo', 'Sara', 'Pablo', 'Lucía', 'Nico'];

  // =====================================================================
  // 1.º
  // =====================================================================
  const n1 = (lvl) => R.int(...[[11, 20], [20, 59], [10, 99]][lvl]);
  const g1Blocks = (lvl) => {
    const n = n1(lvl);
    return { type: 'cells', prompt: '¿Qué número es? Cada barra es una <b>decena</b> (10) y cada cubito, una <b>unidad</b>.',
      html: `<div class="scene">${blocks(n)}</div><div class="eq big">${cell(0)}</div>`, cells: [{ ans: n }],
      explain: `${Math.floor(n / 10)} decenas y ${n % 10} unidades: <b>${n}</b>.` };
  };
  const g1TensUnits = (lvl) => {
    const n = n1(lvl);
    return { type: 'cells', prompt: `¿Cuántas decenas y unidades tiene el <b>${n}</b>?`,
      html: `<div class="eq big wrap">${n} = ${cell(0)} decenas y ${cell(1)} unidades</div>`, cells: [{ ans: Math.floor(n / 10) }, { ans: n % 10 }],
      explain: `${n} = ${Math.floor(n / 10) * 10} + ${n % 10}: <b>${Math.floor(n / 10)} decenas y ${n % 10} unidades</b>.` };
  };
  const g1Neighbors = (lvl) => {
    const n = R.int(...[[2, 19], [11, 50], [11, 98]][lvl]);
    return { type: 'cells', prompt: 'Escribe el número <b>anterior</b> y el <b>posterior</b>.',
      html: `<div class="chain">${cell(0)}<span class="dbox">${n}</span>${cell(1)}</div>`, cells: [{ ans: n - 1 }, { ans: n + 1 }],
      explain: `Antes del ${n} va el <b>${n - 1}</b> y después, el <b>${n + 1}</b>.` };
  };
  const g1Compare = (lvl) => { const a = n1(lvl), b = R.int(0, 4) ? n1(lvl) : a; return signQ(a, b); };
  const g1Order = (lvl) => orderNums(R.sample(range(1, [20, 50, 99][lvl]), [4, 4, 5][lvl]));
  const g1Add = (lvl) => {
    let a, b;
    if (lvl === 0) { a = ri(0, 9); b = ri(0, 10 - a); }
    else if (lvl === 1) { a = ri(5, 15); b = ri(1, 20 - a); }
    else if (R.int(0, 1)) { a = ri(1, 5) * 10; b = ri(1, 9 - a / 10) * 10; }
    else { a = ri(1, 7) * 10 + ri(0, 5); b = ri(1, 9 - Math.floor(a / 10)) * 10 + ri(0, 9 - (a % 10)); }
    return one('Suma.', `${a} + ${b}`, a + b, { hint: lvl === 2 ? 'Suma primero las unidades y después las decenas.' : 'Cuenta hacia delante desde el número mayor.', explain: `${a} + ${b} = <b>${a + b}</b>` });
  };
  const g1AddMissing = (lvl) => {
    const c = [10, 20, 50][lvl], a = ri(1, c - 1), total = ri(a + 1, c), b = total - a;
    return { type: 'cells', prompt: '¿Qué número falta?', html: `<div class="eq big">${a} + ${cell(0)} = ${total}</div>`, cells: [{ ans: b }],
      hint: `¿Cuánto le falta a ${a} para llegar a ${total}?`, explain: `${a} + <b>${b}</b> = ${total}` };
  };
  const g1Sub = (lvl) => {
    let a, b;
    if (lvl === 0) { a = ri(2, 10); b = ri(0, a); }
    else if (lvl === 1) { a = ri(11, 20); b = ri(1, a - 10 + ri(0, 3)); }
    else { a = ri(2, 9) * 10 + ri(1, 9); b = ri(1, Math.floor(a / 10)) * 10 + ri(0, a % 10); if (b >= a) b = ri(1, a - 1); }
    return one('Resta.', `${a} − ${b}`, a - b, { hint: lvl === 2 ? 'Resta primero las unidades y después las decenas.' : 'Cuenta hacia atrás.', explain: `${a} − ${b} = <b>${a - b}</b>` });
  };
  const g1SubMissing = (lvl) => {
    const a = ri(5, [10, 20, 50][lvl]), b = ri(1, a);
    return { type: 'cells', prompt: '¿Qué número falta?', html: `<div class="eq big">${a} − ${cell(0)} = ${a - b}</div>`, cells: [{ ans: b }], explain: `${a} − <b>${b}</b> = ${a - b}` };
  };
  const g1Problem = (lvl) => {
    const [e, it] = R.pick(STUFF), [p, q] = R.sample(KIDS, 2), kind = R.int(0, lvl === 2 ? 2 : 1);
    const a = ri(3, [9, 15, 40][lvl]), b = ri(1, Math.min(a - 1, [9, 9, 30][lvl]));
    const pics = lvl === 0 ? `<div class="scene"><div class="items">${`<span class="it">${e}</span>`.repeat(a)}</div></div>` : '';
    if (kind === 0) return one(`${p} tiene <b>${a} ${it}</b> y le regalan <b>${b}</b> más. ¿Cuántos ${it} tiene ahora?${pics}`, `${a} + ${b}`, a + b, { explain: `${a} + ${b} = <b>${a + b} ${it}</b>` });
    if (kind === 1) return one(`${p} tiene <b>${a} ${it}</b> y regala <b>${b}</b>. ¿Cuántos ${it} le quedan?${pics}`, `${a} − ${b}`, a - b, { explain: `${a} − ${b} = <b>${a - b} ${it}</b>` });
    return one(`${p} tiene <b>${a} ${it}</b> y ${q} tiene <b>${b}</b>. ¿Cuántos ${it} más tiene ${p}?`, `${a} − ${b}`, a - b, { hint: 'Para saber cuántos más, resta.', explain: `${a} − ${b} = <b>${a - b}</b> más.` });
  };
  const g1Series = (lvl) => {
    const step = R.pick([[1, 2], [2, 5, 10], [2, 3, 5, 10]][lvl]), down = lvl === 2 && R.int(0, 1), len = 6;
    const start = down ? ri(step * len, 99) : ri(0, Math.max(0, 99 - step * len));
    const seq = range(0, len - 1).map((k) => (down ? start - k * step : start + k * step)), hide = R.sample(range(1, len - 1), 2).sort((a, b) => a - b);
    let c = 0;
    return { type: 'cells', prompt: `Completa la serie: va de <b>${step} en ${step}</b> ${down ? 'hacia atrás' : 'hacia delante'}.`,
      html: `<div class="chain">${seq.map((v, k) => (hide.includes(k) ? cell(c++) : `<span class="dbox">${v}</span>`)).join('')}</div>`,
      cells: hide.map((k) => ({ ans: seq[k] })), explain: seq.join(', ') };
  };
  const g1Money = (lvl) => {
    const pool = [[1, 2], [1, 2, 5, 10], [2, 5, 10, 20]][lvl], k = ri(2, lvl ? 4 : 3), items = Array.from({ length: k }, () => R.pick(pool)).sort((a, b) => b - a);
    return one('¿Cuánto dinero hay?', `<span class="purse">${items.map(money).join('')}</span><br>Total (€)`, sum(items), { hint: 'Empieza por el billete o la moneda que más vale.', explain: `${items.join(' + ')} = <b>${sum(items)} €</b>` });
  };
  const hourName = (h) => (h === 1 ? 'la una' : `las ${words(h)}`);
  const g1Clock = (lvl) => {
    const h = ri(1, 12), half = lvl > 0 && R.int(0, 1) === 1;
    const t = (hh, hf) => `${hourName(((hh + 11) % 12) + 1)} ${hf ? 'y media' : 'en punto'}`;
    const right = t(h, half), cap = (s) => s[0].toUpperCase() + s.slice(1);
    return choose(`¿Qué hora es?<div class="scene">${K.clock(h, half ? 30 : 0)}</div>`, cap(right), [t(h + 1, half), t(h, !half), t(h - 1, half), t(6, false)].map(cap),
      { hint: 'La aguja corta marca la hora. Si la larga está en el 12 es en punto; si está en el 6, y media.', explain: `<b>${cap(right)}</b>.` });
  };
  const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const g1Week = (lvl) => {
    const list = lvl === 2 ? MONTHS : DAYS, n = list.length, i = ri(0, n - 1), after = R.int(0, 1) === 1, ans = list[(i + (after ? 1 : n - 1)) % n];
    return choose(`¿Qué ${lvl === 2 ? 'mes' : 'día'} va justo <b>${after ? 'después' : 'antes'}</b> ${lvl === 2 ? 'de' : 'del'} <b>${list[i]}</b>?`, ans, R.sample(list.filter((x) => x !== ans && x !== list[i]), 3),
      { explain: `${list.join(', ')}.` });
  };
  const g1Shapes = (lvl) => {
    const pool = [['círculo', 'triángulo', 'cuadrado'], ['círculo', 'triángulo', 'cuadrado', 'rectángulo'], ['triángulo', 'cuadrado', 'rectángulo', 'pentágono', 'hexágono', 'círculo']][lvl], k = R.pick(pool);
    if (lvl === 2 && k !== 'círculo' && R.int(0, 1)) {
      const sides = { triángulo: 3, cuadrado: 4, rectángulo: 4, pentágono: 5, hexágono: 6 }[k];
      return one(`¿Cuántos <b>lados</b> tiene esta figura?<div class="scene">${shapeFig(k)}</div>`, 'Lados', sides, { explain: `El ${k} tiene <b>${sides} lados</b>.` });
    }
    return choose(`¿Cómo se llama esta figura?<div class="scene">${shapeFig(k)}</div>`, k, pool.filter((x) => x !== k), { explain: `Es un <b>${k}</b>.` });
  };

  // =====================================================================
  // 2.º
  // =====================================================================
  const n3 = (lvl) => R.int(...[[100, 299], [100, 599], [100, 999]][lvl]);
  const g2Place = (lvl) => {
    const n = n3(lvl), c = Math.floor(n / 100), d = Math.floor(n / 10) % 10, u = n % 10;
    if (R.int(0, 1)) return { type: 'cells', prompt: `Descompón el número <b>${n}</b>.`, html: `<div class="eq big wrap">${n} = ${cell(0)} C + ${cell(1)} D + ${cell(2)} U</div>`, cells: [{ ans: c }, { ans: d }, { ans: u }], explain: `${n} = ${c * 100} + ${d * 10} + ${u}: <b>${c} centenas, ${d} decenas y ${u} unidades</b>.` };
    return one(`¿Qué número es <b>${c} centenas, ${d} decenas y ${u} unidades</b>?`, `${c} C + ${d} D + ${u} U`, n, { explain: `${c * 100} + ${d * 10} + ${u} = <b>${n}</b>` });
  };
  const g2Compare = (lvl) => { const a = n3(lvl); let b = Number(String(a).split('').reverse().join('')); if (b < 100 || R.int(0, 2) === 0) b = a + R.pick([-10, -1, 1, 10, 100]); return signQ(a, Math.max(100, b)); };
  const g2RoundTen = (lvl) => { const n = lvl === 2 ? n3(1) : ri(11, 98), ans = Math.round(n / 10) * 10; return one(`¿Cuál es la <b>decena más cercana</b> a ${n}?`, `${n} ≈`, ans, { hint: 'Si las unidades son 5 o más, sube a la decena siguiente.', explain: `<b>${n} ≈ ${ans}</b>` }); };
  const g2Add = (lvl) => {
    let a, b;
    if (lvl === 0) { a = ri(15, 69); b = ri(11, 99 - a); if (a % 10 + b % 10 < 10) b = Math.min(99 - a, b + (10 - a % 10)); }
    else if (lvl === 1) { a = ri(100, 699); b = ri(100, 899 - a); }
    else { a = ri(150, 699); b = ri(105, 980 - a); }
    return one('Suma. ¡Cuidado con las que te llevas!', `${a} + ${b}`, a + b, { hint: 'Suma unidades con unidades, decenas con decenas. Si pasas de 9, te llevas una a la columna de al lado.', explain: `${a} + ${b} = <b>${a + b}</b>` });
  };
  const g2Sub = (lvl) => {
    let a, b;
    if (lvl === 0) { a = ri(30, 99); b = ri(11, a - 5); }
    else if (lvl === 1) { a = ri(300, 999); b = ri(100, a - 100); }
    else { a = ri(300, 999); b = ri(105, a - 10); }
    return one('Resta.', `${a} − ${b}`, a - b, { hint: 'Si arriba hay menos que abajo, pide una decena prestada a la columna de al lado.', explain: `${a} − ${b} = <b>${a - b}</b>. Compruébalo: ${a - b} + ${b} = ${a}.` });
  };
  const g2Relation = (lvl) => {
    const a = ri(lvl ? 100 : 11, lvl ? 600 : 60), b = ri(lvl ? 100 : 11, lvl ? 350 : 39), c = a + b;
    return { type: 'cells', prompt: `Sabemos que <b>${a} + ${b} = ${c}</b>. Sin hacer la cuenta:`, html: `<div class="pair"><div class="op known">${c} − ${b} = ${cell(0)}</div><div class="op ask">${c} − ${a} = ${cell(1)}</div></div>`,
      cells: [{ ans: a }, { ans: b }], explain: 'La resta deshace la suma: si quitas uno de los sumandos, queda el otro.' };
  };
  const g2Three = (lvl) => { const a = ri(10, 40), b = ri(10, 30), c = ri(1, [20, 29, 99][lvl]); return one('Suma los tres números.', `${a} + ${b} + ${c}`, a + b + c, { hint: 'Busca primero dos que sumen un número redondo.', explain: `<b>${a + b + c}</b>` }); };
  const TABLES = [[2, 5, 10], [3, 4], [6, 7, 8, 9]];
  const g2Tables = (lvl) => {
    const t = R.pick(TABLES[lvl]), k = ri(1, 10), missing = lvl && R.int(0, 2) === 0;
    if (missing) return { type: 'cells', prompt: `Tabla del ${t}: ¿qué número falta?`, html: `<div class="eq big">${t} × ${cell(0)} = ${t * k}</div>`, cells: [{ ans: k }], explain: `${t} × ${k} = ${t * k}` };
    return one(`Tabla del ${t}.`, `${t} × ${k}`, t * k, { hint: `Cuenta de ${t} en ${t}.`, explain: `${t} × ${k} = <b>${t * k}</b>` });
  };
  const g2Repeated = (lvl) => {
    const [e] = R.pick(STUFF), k = ri(2, lvl ? 5 : 4), n = ri(2, lvl === 2 ? 9 : 5);
    return { type: 'cells', prompt: `Hay <b>${k} grupos</b> de <b>${n}</b>. Escríbelo como suma y como multiplicación.`,
      html: `<div class="scene"><div class="groups">${Array.from({ length: k }, () => `<span class="grp">${e.repeat(n)}</span>`).join('')}</div></div>
        <div class="eq wrap">${Array(k).fill(n).join(' + ')} = ${cell(0)}</div><div class="eq big">${k} × ${n} = ${cell(1)}</div>`,
      cells: [{ ans: k * n, stage: 0 }, { ans: k * n, stage: 1 }], explain: `Sumar ${k} veces el ${n} es lo mismo que <b>${k} × ${n} = ${k * n}</b>.` };
  };
  const g2DoubleHalf = (lvl) => {
    const half = R.int(0, 1) === 1, n = half ? 2 * ri(1, [10, 25, 50][lvl]) : ri(1, [10, 25, 50][lvl]);
    return one(`¿Cuál es ${half ? 'la <b>mitad</b>' : 'el <b>doble</b>'} de ${n}?`, half ? `${n} : 2` : `${n} × 2`, half ? n / 2 : n * 2, { explain: half ? `La mitad de ${n} es <b>${n / 2}</b>.` : `El doble de ${n} es <b>${n * 2}</b>.` });
  };
  const g2Share = (lvl) => {
    const [e, it] = R.pick(STUFF), k = ri(2, lvl ? 6 : 4), q = ri(2, lvl === 2 ? 9 : 5), n = k * q;
    return one(`Reparte <b>${n} ${it}</b> entre <b>${k}</b> niños a partes iguales. ¿Cuántos le tocan a cada uno?${lvl === 0 ? `<div class="scene"><div class="items">${`<span class="it">${e}</span>`.repeat(n)}</div></div>` : ''}`, `${n} : ${k}`, q,
      { hint: `Busca en la tabla del ${k}: ${k} × ? = ${n}.`, explain: `${n} : ${k} = <b>${q}</b>, porque ${k} × ${q} = ${n}.` });
  };
  const UNIT_THINGS = [['el largo de una goma de borrar', 'centímetros'], ['el largo del pasillo', 'metros'], ['la distancia entre dos ciudades', 'kilómetros'], ['el agua de una piscina', 'litros'], ['el peso de una sandía', 'kilos'], ['el peso de una carta', 'gramos'], ['la leche de un vaso', 'mililitros'], ['la altura de una puerta', 'metros']];
  const g2Units = () => {
    const [thing, unit] = R.pick(UNIT_THINGS);
    return choose(`¿Con qué unidad medirías <b>${thing}</b>?`, unit, R.sample(['centímetros', 'metros', 'kilómetros', 'litros', 'kilos', 'gramos', 'mililitros'].filter((u) => u !== unit), 3), { explain: `Lo mejor es medirlo en <b>${unit}</b>.` });
  };
  const g2Shop = (lvl) => {
    const a = ri(2, lvl ? 15 : 8), b = ri(1, lvl ? 9 : 5), pay = [10, 20, 20][lvl] + (a + b > 20 ? 30 : 0);
    if (lvl === 0 || R.int(0, 1)) return one(`Un libro cuesta <b>${a} €</b> y un cuaderno <b>${b} €</b>. ¿Cuánto cuestan los dos?`, `${a} € + ${b} €`, a + b, { explain: `${a} + ${b} = <b>${a + b} €</b>` });
    return one(`Compro un juguete de <b>${a + b} €</b> y pago con un billete de <b>${pay} €</b>. ¿Cuánto me devuelven?`, `${pay} − ${a + b}`, pay - a - b, { explain: `${pay} − ${a + b} = <b>${pay - a - b} €</b>` });
  };
  const g2TwoSteps = (lvl) => {
    const [, it] = R.pick(STUFF), p = R.pick(KIDS), a = ri(10, lvl ? 60 : 30), b = ri(5, 25), c = ri(1, a + b - 1);
    return { type: 'cells', prompt: `${p} tenía <b>${a} ${it}</b>. Le dieron <b>${b}</b> y después regaló <b>${c}</b>. ¿Cuántos ${it} tiene ahora?`,
      html: `<div class="pair"><div class="op known">Después de que le dieran: ${a} + ${b} = ${cell(0)}</div><div class="op ask">Después de regalar: ${cell(1)}</div></div>`,
      cells: [{ ans: a + b, stage: 0 }, { ans: a + b - c, stage: 1 }], explain: `${a} + ${b} = ${a + b}; ${a + b} − ${c} = <b>${a + b - c} ${it}</b>.` };
  };

  // =====================================================================
  // 3.º
  // =====================================================================
  const g3Compare = (lvl) => { const len = lvl === 2 ? 5 : 4, a = randDigits(len), b = R.int(0, 1) ? a + R.pick([-1000, -100, -10, 10, 100, 1000]) : randDigits(len); return signQ(a, Math.max(1000, b)); };
  const g3Round = (lvl) => {
    const [p, name] = R.pick([[10, 'las decenas'], [100, 'las centenas'], [1000, 'los millares']].slice(0, lvl + 1)), n = randDigits(lvl === 2 ? 5 : 4), ans = Math.round(n / p) * p;
    return one(`Aproxima <b>${fmt(n)}</b> a ${name}.`, `${fmt(n)} ≈`, ans, { hint: 'Mira la cifra de la derecha: si es 5 o más, sube.', explain: `<b>${fmt(n)} ≈ ${fmt(ans)}</b>` });
  };
  const g3AddSub = (lvl) => {
    const plus = R.int(0, 1) === 1, len = lvl === 2 ? 5 : 4;
    let a = randDigits(len), b = randDigits(len - (lvl ? 0 : 1));
    if (!plus && b > a) [a, b] = [b, a];
    return one(plus ? 'Suma.' : 'Resta.', `${fmt(a)} ${plus ? '+' : '−'} ${fmt(b)}`, plus ? a + b : a - b, { hint: 'Coloca las cifras en columnas: unidades con unidades, decenas con decenas…', explain: `<b>${fmt(plus ? a + b : a - b)}</b>` });
  };
  const g3Estimate = (lvl) => {
    const p = lvl === 2 ? 1000 : 100, a = ri(p + 1, p * 9), b = ri(p + 1, p * 9), plus = R.int(0, 1) === 1, ra = Math.round(a / p) * p, rb = Math.round(b / p) * p;
    const [x, y, rx, ry] = plus || a >= b ? [a, b, ra, rb] : [b, a, rb, ra];
    return one(`<b>Estima</b> aproximando cada número a ${p === 100 ? 'las centenas' : 'los millares'}.`, `${fmt(x)} ${plus ? '+' : '−'} ${fmt(y)} ≈`, plus ? rx + ry : rx - ry,
      { explain: `${fmt(rx)} ${plus ? '+' : '−'} ${fmt(ry)} = <b>${fmt(plus ? rx + ry : rx - ry)}</b>` });
  };
  const g3Mult = (lvl) => {
    if (lvl === 2 && R.int(0, 1)) { const n = ri(2, 99), p = R.pick([10, 100, 1000]); return one('Multiplica por la unidad seguida de ceros.', `${n} × ${fmt(p)}`, n * p, { hint: 'Añade al número tantos ceros como tenga.', explain: `<b>${fmt(n * p)}</b>` }); }
    const a = lvl ? ri(102, 999) : ri(12, 99), b = ri(2, 9);
    return one('Multiplica.', `${a} × ${b}`, a * b, { hint: `Descompón: ${a} = ${K.PLACES ? String(a).split('').map((d, i, s) => d * 10 ** (s.length - 1 - i)).filter(Boolean).join(' + ') : a}. Multiplica cada parte por ${b} y suma.`, explain: `${a} × ${b} = <b>${fmt(a * b)}</b>` });
  };
  const g3Div = (lvl) => {
    const d = ri(2, 9), q = ri(...[[2, 9], [10, 30], [20, 150]][lvl]), r = R.int(0, 2) ? ri(0, d - 1) : 0, N = d * q + r;
    if (lvl === 2 && R.int(0, 1)) return { type: 'cells', prompt: `Haz la <b>prueba de la división</b> de ${N} : ${d} = ${q} R ${r}.`, html: `<div class="eq big">${d} × ${q} + ${r} = ${cell(0)}</div>`, cells: [{ ans: N }], explain: `divisor × cociente + resto = dividendo: <b>${N}</b>. ¡Está bien!` };
    return { type: 'cells', prompt: `Divide <b>${N} : ${d}</b>.`, html: `<div class="eq big">${N} : ${d} = ${cell(0)} R ${cell(1)}</div>`, cells: [{ ans: q }, { ans: r }],
      hint: `Busca en la tabla del ${d} el número más cercano a ${N} sin pasarte.`, explain: `${d} × ${q} = ${d * q} y sobran ${r}. <b>${N} : ${d} = ${q} R ${r}</b>${r ? '' : ' (división exacta)'}.` };
  };
  const SOLIDS = { cubo: 'cubo', prisma: 'prisma', pirámide: 'pirámide', cilindro: 'cilindro', cono: 'cono', esfera: 'esfera' };
  const g3Solids = (lvl) => {
    const k = R.pick(Object.keys(SOLIDS));
    if (lvl === 2 && ['cilindro', 'cono', 'esfera'].includes(k) === R.int(0, 1)) {
      const round = ['cilindro', 'cono', 'esfera'].includes(k);
      return choose(`¿Este cuerpo es un <b>poliedro</b> o un <b>cuerpo redondo</b>?<div class="scene">${solidFig(k)}</div>`, round ? 'cuerpo redondo' : 'poliedro', [round ? 'poliedro' : 'cuerpo redondo'],
        { explain: `El ${k} ${round ? 'tiene superficies curvas: es un <b>cuerpo redondo</b>' : 'tiene todas sus caras planas: es un <b>poliedro</b>'}.` });
    }
    return choose(`¿Cómo se llama este cuerpo geométrico?<div class="scene">${solidFig(k)}</div>`, k, R.sample(Object.keys(SOLIDS).filter((x) => x !== k), 3), { explain: `Es un <b>${k}</b>.` });
  };
  const g3Money = (lvl) => {
    const a = ri(1, 9) + R.pick([0, 0.5, 0.2, 0.75, 0.1]) * (lvl ? 1 : 0), b = ri(1, 6) + R.pick([0, 0.5, 0.25, 0.3]) * (lvl ? 1 : 0), t = r3(a + b);
    return { type: 'cells', decimals: true, prompt: `Un bocadillo cuesta <b>${fmt(a)} €</b> y un zumo <b>${fmt(b)} €</b>. ¿Cuánto cuesta todo?`, html: `<div class="eq big">${fmt(a)} € + ${fmt(b)} € = ${cell(0)} €</div>`, cells: [{ ans: t }],
      hint: 'Suma los euros y los céntimos por separado (100 céntimos = 1 €).', explain: `<b>${fmt(t)} €</b>` };
  };

  // =====================================================================
  // 4.º
  // =====================================================================
  const g4Props = (lvl) => {
    const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9);
    const all = [['conmutativa', `${a} + ${b} = ${b} + ${a}`], ['conmutativa', `${a} × ${b} = ${b} × ${a}`], ['asociativa', `(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`], ['asociativa', `(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`], ['distributiva', `${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`]];
    if (lvl === 2 && R.int(0, 1)) return { type: 'cells', prompt: 'Aplica la <b>propiedad distributiva</b> y calcula.', html: `<div class="eq big wrap">${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c} = ${cell(0)} + ${cell(1)} = ${cell(2)}</div>`, cells: [{ ans: a * b, stage: 0 }, { ans: a * c, stage: 0 }, { ans: a * (b + c), stage: 1 }], explain: `${a * b} + ${a * c} = <b>${a * (b + c)}</b>` };
    const [name, t] = R.pick(lvl ? all : all.slice(0, 4));
    return choose(`¿Qué propiedad es?<div class="eq big wrap">${t}</div>`, name, ['conmutativa', 'asociativa', 'distributiva'], { explain: 'Conmutativa: cambiar el orden. Asociativa: cambiar cómo se agrupan. Distributiva: multiplicar por una suma.' });
  };
  const g4CheckSub = (lvl) => {
    const a = randDigits(lvl + 4), b = ri(Math.floor(a / 3), a - 1), c = a - b;
    return { type: 'cells', prompt: `Haz la <b>prueba de la resta</b>: ${fmt(a)} − ${fmt(b)} = ${fmt(c)}.`, html: `<div class="eq big">${fmt(c)} + ${fmt(b)} = ${cell(0)}</div>`, cells: [{ ans: a }], explain: `Diferencia + sustraendo = minuendo: <b>${fmt(a)}</b>. ¡Está bien!` };
  };
  const g4EstProd = (lvl) => {
    const a = ri(lvl ? 101 : 12, lvl ? 999 : 98), b = ri(3, 9), p = a > 99 ? 100 : 10, ra = Math.round(a / p) * p;
    return one(`<b>Estima</b> el producto aproximando ${a} a ${p === 10 ? 'las decenas' : 'las centenas'}.`, `${a} × ${b} ≈`, ra * b, { explain: `${ra} × ${b} = <b>${fmt(ra * b)}</b> (el resultado exacto es ${fmt(a * b)}).` });
  };
  const g4Mult = (lvl) => {
    const a = ri(lvl ? 102 : 21, lvl ? 999 : 99), b = lvl === 2 ? ri(102, 499) : ri(12, 89);
    const parts = String(b).split('').reverse().map((d, i) => Number(d) * 10 ** i).filter(Boolean);
    return { type: 'cells', prompt: `Multiplica <b>${a} × ${b}</b> por partes.`,
      html: `<div class="pair">${parts.map((p, i) => `<div class="op known">${a} × ${fmt(p)} = ${cell(i)}</div>`).join('')}<div class="op ask">${a} × ${b} = ${cell(parts.length)}</div></div>`,
      cells: parts.map((p) => ({ ans: a * p, stage: 0 })).concat({ ans: a * b, stage: 1 }), explain: `${parts.map((p) => fmt(a * p)).join(' + ')} = <b>${fmt(a * b)}</b>` };
  };
  const g4Div = (lvl) => {
    const d = lvl ? ri(12, 49) : ri(2, 9), q = ri(lvl ? 11 : 101, lvl === 2 ? 250 : lvl ? 60 : 909), r = ri(0, d - 1), N = d * q + r;
    if (R.int(0, 2) === 0) return { type: 'cells', prompt: `Haz la <b>prueba de la división</b>: ${fmt(N)} : ${d} = ${q} R ${r}.`, html: `<div class="eq big">${d} × ${q} + ${r} = ${cell(0)}</div>`, cells: [{ ans: N }], explain: `<b>${fmt(N)}</b>: coincide con el dividendo, ¡está bien!` };
    return { type: 'cells', prompt: `Divide <b>${fmt(N)} : ${d}</b>.`, html: `<div class="eq big">${fmt(N)} : ${d} = ${cell(0)} R ${cell(1)}</div>`, cells: [{ ans: q }, { ans: r }],
      hint: lvl ? `Empieza por las primeras cifras del dividendo que formen un número mayor que ${d}.` : '¡Cuidado con los ceros en el cociente!', explain: `${d} × ${q} = ${fmt(d * q)}, resto ${r}. <b>${q} R ${r}</b>` };
  };
  const QUADS = ['cuadrado', 'rectángulo', 'rombo', 'romboide', 'trapecio'];
  const g4Quads = (lvl) => {
    const k = R.pick(QUADS);
    if (lvl === 2 && R.int(0, 1)) {
      const par = k !== 'trapecio';
      return choose(`¿Es un <b>paralelogramo</b>?<div class="scene">${quadFig(k)}</div>`, par ? 'Sí' : 'No', [par ? 'No' : 'Sí'], { explain: `Un paralelogramo tiene los lados opuestos paralelos dos a dos. El ${k} ${par ? '<b>sí</b> lo es' : 'solo tiene dos lados paralelos: <b>no</b> lo es'}.` });
    }
    return choose(`¿Cómo se llama este cuadrilátero?<div class="scene">${quadFig(k)}</div>`, k, QUADS.filter((x) => x !== k).slice(0, 3), { explain: 'Cuadrado: 4 lados iguales y 4 ángulos rectos · rectángulo: ángulos rectos · rombo: 4 lados iguales sin ángulos rectos · romboide: inclinado · trapecio: solo 2 lados paralelos.' });
  };
  const g4Shop = (lvl) => {
    const price = r3(ri(1, 30) + ri(1, 19) * 0.05), pay = price < 5 ? 5 : price < 10 ? 10 : price < 20 ? 20 : 50, change = r3(pay - price);
    if (lvl === 0) return G.gDecOps(0);
    return { type: 'cells', decimals: true, prompt: `Compro algo de <b>${fmt(price)} €</b> y pago con <b>${pay} €</b>. ¿Cuánto me devuelven?`, html: `<div class="eq big">${pay} − ${fmt(price)} = ${cell(0)} €</div>`, cells: [{ ans: change }],
      hint: 'Puedes contar hacia delante: primero hasta el euro siguiente y luego hasta el billete.', explain: `<b>${fmt(change)} €</b>` };
  };

  // =====================================================================
  // 6.º
  // =====================================================================
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const g6Mcm = (lvl) => {
    let a, b;
    do { a = ri(2, [9, 15, 24][lvl]); b = ri(2, [9, 15, 24][lvl]); } while (a === b || lcm(a, b) > 180);
    if (lvl === 2 && R.int(0, 1)) return one(`Un faro se enciende cada <b>${a} segundos</b> y otro cada <b>${b} segundos</b>. Si se encienden a la vez, ¿cuántos segundos pasan hasta que vuelven a coincidir?`, 'Segundos', lcm(a, b), { hint: 'Busca el mínimo común múltiplo.', explain: `m.c.m.(${a}, ${b}) = <b>${lcm(a, b)}</b> segundos.` });
    return one(`Calcula el <b>mínimo común múltiplo</b>.`, `m.c.m.(${a}, ${b})`, lcm(a, b), { hint: `Escribe los múltiplos de ${Math.max(a, b)} hasta encontrar uno que también sea múltiplo de ${Math.min(a, b)}.`, explain: `m.c.m.(${a}, ${b}) = <b>${lcm(a, b)}</b>` });
  };
  const g6Mcd = (lvl) => {
    const g = ri(2, [6, 9, 15][lvl]), a = g * ri(1, 9), b = g * ri(1, 9);
    if (a === b) return g6Mcd(lvl);
    if (lvl === 2 && R.int(0, 1)) return one(`Tenemos <b>${a} caramelos de fresa</b> y <b>${b} de limón</b>. Queremos hacer bolsas iguales, lo más grandes posible, sin mezclar sabores y sin que sobre ninguno. ¿Cuántos caramelos van en cada bolsa?`, 'Caramelos por bolsa', gcd(a, b), { hint: 'Busca el máximo común divisor.', explain: `m.c.d.(${a}, ${b}) = <b>${gcd(a, b)}</b>` });
    return one('Calcula el <b>máximo común divisor</b>.', `m.c.d.(${a}, ${b})`, gcd(a, b), { hint: `Escribe los divisores de ${Math.min(a, b)} y busca el mayor que también divide a ${Math.max(a, b)}.`, explain: `m.c.d.(${a}, ${b}) = <b>${gcd(a, b)}</b>` });
  };
  const neg = (n) => fmt(n);
  const g6Integers = (lvl) => {
    const kind = R.int(0, [1, 2, 3][lvl]);
    if (kind === 0) {
      const ns = R.sample(range(-12, 12), 4), mx = R.int(0, 1) === 1, ans = mx ? Math.max(...ns) : Math.min(...ns);
      return choose(`¿Cuál es el número <b>${mx ? 'mayor' : 'menor'}</b>?`, neg(ans), ns.filter((x) => x !== ans).map(neg), { hint: 'En la recta, cuanto más a la derecha, mayor. −2 es mayor que −9.', explain: `${[...ns].sort((a, b) => a - b).map(neg).join(' < ')}` });
    }
    if (kind === 1) {
      const t = ri(-8, 6), d = ri(2, 12) * (R.int(0, 1) ? 1 : -1), ans = t + d;
      return choose(`Estamos a <b>${neg(t)} °C</b> y la temperatura ${d > 0 ? 'sube' : 'baja'} <b>${Math.abs(d)} grados</b>. ¿Qué temperatura hace ahora?`, `${neg(ans)} °C`, [ans + 2, ans - 2, -ans || 1, t - d].filter((x) => x !== ans).map((x) => `${neg(x)} °C`),
        { hint: 'Imagina un termómetro: subir es ir hacia arriba en la recta.', explain: `${neg(t)} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = <b>${neg(ans)} °C</b>` });
    }
    if (kind === 2) return orderNums(R.sample(range(-15, 15), 5), { prompt: 'Ordena los números enteros de <b>menor a mayor</b>.' });
    const a = ri(-9, 9), b = ri(-9, 9), ans = a + b;
    return choose(`Calcula.<div class="eq big">(${neg(a)}) + (${neg(b)})</div>`, neg(ans), [ans + 1, ans - 1, a - b, -ans].filter((x) => x !== ans).map(neg), { explain: `<b>${neg(ans)}</b>` });
  };
  const fracValidate = (N, D) => ([n, d]) => d > 0 && n * D === N * d;
  const g6FracOps = (lvl) => {
    const op = R.pick([['+', '−'], ['+', '−', '×'], ['+', '−', '×', ':']][lvl]);
    const b = ri(2, 9), d = ri(2, 9), a = ri(1, b - 1), c = ri(1, d - 1);
    let N, D;
    if (op === '+') { N = a * d + c * b; D = b * d; } else if (op === '−') { N = a * d - c * b; D = b * d; } else if (op === '×') { N = a * c; D = b * d; } else { N = a * d; D = b * c; }
    if (N <= 0) return g6FracOps(lvl);
    const g = gcd(N, D), how = { '+': 'Pasa las dos a común denominador y suma los numeradores.', '−': 'Pasa las dos a común denominador y resta los numeradores.', '×': 'Multiplica numerador por numerador y denominador por denominador.', ':': 'Multiplica en cruz: el primer numerador por el segundo denominador…' }[op];
    return { type: 'cells', prompt: 'Calcula. Puedes dejar el resultado sin simplificar.', html: `<div class="eq big">${frac(a, b)} ${op} ${frac(c, d)} = ${frac(cell(0), cell(1))}</div>`,
      cells: [{ ans: N / g }, { ans: D / g }], validate: fracValidate(N, D), hint: how, explain: `${how} Resultado: <b>${N}/${D}${g > 1 ? ` = ${N / g}/${D / g}` : ''}</b>.` };
  };
  const g6DecDiv = (lvl) => {
    const d = ri(2, lvl ? 9 : 5), q = r3(ri(11, lvl === 2 ? 999 : 99) / (lvl === 2 ? 100 : 10)), N = r3(q * d);
    return { type: 'cells', decimals: true, prompt: 'Divide el número decimal.', html: `<div class="eq big">${fmt(N)} : ${d} = ${cell(0)}</div>`, cells: [{ ans: q }],
      hint: 'Divide como si no hubiera coma y pon la coma en el cociente al bajar la primera cifra decimal.', explain: `<b>${fmt(q)}</b>` };
  };
  const g6Sqrt = (lvl) => { const k = ri(2, [10, 15, 20][lvl]); return one('Calcula la <b>raíz cuadrada</b>.', `√${k * k}`, k, { hint: '¿Qué número multiplicado por sí mismo da ese resultado?', explain: `${k} × ${k} = ${k * k}, así que <b>√${k * k} = ${k}</b>.` }); };
  const g6Expanded = (lvl) => {
    const n = randDigits(lvl + 4), parts = String(n).split('').map((d, i, s) => [Number(d), s.length - 1 - i]).filter(([d]) => d);
    const txt = parts.map(([d, e]) => (e ? `${d} · 10<sup>${e}</sup>` : `${d}`)).join(' + ');
    return one(`¿Qué número es? (descomposición polinómica)`, txt, n, { explain: `<b>${fmt(n)}</b>` });
  };
  const g6Proportion = (lvl) => {
    const [thing, unit] = R.pick([['kg de naranjas', '€'], ['entradas', '€'], ['litros de gasolina', '€'], ['cuadernos', '€']]);
    const p = ri(2, [5, 9, 12][lvl]), a = ri(2, 6), b = ri(3, 12);
    if (a === b) return g6Proportion(lvl);
    return one(`Si <b>${a} ${thing}</b> cuestan <b>${a * p} ${unit}</b>, ¿cuánto cuestan <b>${b} ${thing}</b>?`, `${b} ${thing}`, b * p, { hint: 'Calcula primero lo que cuesta 1 (reducción a la unidad).', explain: `1 cuesta ${a * p} : ${a} = ${p} ${unit}, así que ${b} cuestan ${b} × ${p} = <b>${b * p} ${unit}</b>.` });
  };
  const g6Scale = (lvl) => {
    const scale = R.pick([[1000, 100000, 200000], [100000, 500000, 1000000], [25000, 200000, 2000000]][lvl]), cm = ri(2, 9), realCm = cm * scale;
    const km = realCm / 100000, m = realCm / 100;
    const toKm = km >= 1;
    return { type: 'cells', decimals: true, prompt: `En un mapa de escala <b>1 : ${fmt(scale)}</b>, dos pueblos están a <b>${cm} cm</b>. ¿Qué distancia hay en la realidad?`,
      html: `<div class="eq big">${cell(0)} ${toKm ? 'km' : 'm'}</div>`, cells: [{ ans: toKm ? r3(km) : r3(m) }],
      hint: `Cada centímetro del mapa son ${fmt(scale)} cm reales. Después pasa a ${toKm ? 'km (÷ 100 000)' : 'm (÷ 100)'}.`, explain: `${cm} × ${fmt(scale)} = ${fmt(realCm)} cm = <b>${fmt(toKm ? r3(km) : r3(m))} ${toKm ? 'km' : 'm'}</b>` };
  };
  const g6PercentChange = (lvl) => {
    if (lvl === 0) return G.gPercent(2);
    const p = R.pick([10, 20, 25, 50]), price = R.pick([40, 60, 80, 120, 200]), up = R.int(0, 1) === 1, change = (price * p) / 100, end = up ? price + change : price - change;
    return one(`Un abrigo cuesta <b>${price} €</b> y su precio ${up ? '<b>sube</b>' : '<b>baja</b>'} un <b>${p} %</b>. ¿Cuánto cuesta ahora?`, 'Precio nuevo (€)', end, { hint: `Calcula primero el ${p} % de ${price}.`, explain: `${p} % de ${price} = ${change}; ${price} ${up ? '+' : '−'} ${change} = <b>${end} €</b>` });
  };
  const g6Circle = (lvl) => {
    const r = ri(2, 10), L = r3(2 * 3.14 * r), A = r3(3.14 * r * r), area = lvl === 2 && R.int(0, 1);
    return { type: 'cells', decimals: true, prompt: `Una circunferencia tiene <b>${r} cm de radio</b>. Usa π = 3,14.`, html: `<div class="eq big">${area ? 'Área del círculo' : 'Longitud'} = ${cell(0)} ${area ? 'cm²' : 'cm'}</div>`, cells: [{ ans: area ? A : L }],
      hint: area ? 'Área = π × r × r' : 'Longitud = 2 × π × r', explain: area ? `3,14 × ${r} × ${r} = <b>${fmt(A)} cm²</b>` : `2 × 3,14 × ${r} = <b>${fmt(L)} cm</b>` };
  };

  // ---------- quick games (arcade) ----------
  const fastAdd = (lvl) => { const a = ri(1, [9, 15, 40][lvl]), b = ri(1, [9, 10, 40][lvl]); return one('', `${a} + ${b}`, a + b, { explain: `<b>${a + b}</b>` }); };
  const fastSub = (lvl) => { const a = ri(5, [10, 20, 60][lvl]), b = ri(1, a); return one('', `${a} − ${b}`, a - b, { explain: `<b>${a - b}</b>` }); };
  const fastTable = (tables) => () => { const t = R.pick(tables), k = ri(1, 10); return one('', `${t} × ${k}`, t * k, { explain: `<b>${t * k}</b>` }); };
  const arcade = (missions) => ({ id: 'arcade', title: 'Contrarreloj', planet: 'Salón Recreativo', emoji: '🕹️', color: '#ff5a6e', missions });
  const AC = (id, title, desc, gen, seconds, goals) => ({ id, title, desc, gen, arcade: { seconds, goals } });

  // ---------- the courses ----------
  const COLORS = ['#ff9d3d', '#58c4ff', '#ffd23f', '#c58bff', '#2fd9a4', '#ff7a59', '#ff6fb1', '#7d8cff', '#4fd1c5', '#ff5a6e'];
  const U = (id, title, planet, emoji, missions) => ({ id, title, planet, emoji, missions });
  const M = (id, title, desc, gen, rounds) => ({ id, title, desc, gen, rounds: rounds || 5 });
  function course(id, n, title, emoji, tagline, grades, ages, units, extra) {
    units.forEach((u, i) => { u.color = u.color || COLORS[i % COLORS.length]; });
    S.subjects[id] = Object.assign({ id, title, emoji, tagline, grades, ages, exam: { title: `Agujero Negro: repaso de ${n}`, label: 'Repaso del curso', rounds: 10 }, units }, extra);
  }

  course('mates1', '1.º', 'Mates 1.º', '🐣', 'Números hasta el 99, sumas, restas y problemas', ['1'], [6, 7], [
    U('numeros', 'Los números hasta el 99', 'Planeta Decena', '🔟', [
      M('bloques', '¿Qué número es?', 'Barras de 10 y cubitos', g1Blocks), M('du', 'Decenas y unidades', '34 = 3 decenas y 4 unidades', g1TensUnits),
      M('vecinos', 'Anterior y posterior', 'El de antes y el de después', g1Neighbors), M('compara', 'Mayor, menor o igual', '<, > e =', g1Compare), M('ordena', 'Ordena los números', 'De menor a mayor', g1Order, 4)]),
    U('sumas', 'Sumamos', 'Planeta Suma', '➕', [M('sumas', 'Sumas', 'Hasta el 10, el 20 y más', g1Add, 6), M('falta', '¿Qué número falta?', '3 + ? = 7', g1AddMissing)]),
    U('restas', 'Restamos', 'Planeta Resta', '➖', [M('restas', 'Restas', 'Hasta el 10, el 20 y más', g1Sub, 6), M('falta', '¿Qué número falta?', '9 − ? = 4', g1SubMissing)]),
    U('problemas', 'Problemas', 'Planeta Cuento', '📖', [M('problemas', 'Problemas de sumar y restar', 'Lee, piensa y calcula', g1Problem, 5)]),
    U('series', 'Series', 'Planeta Saltos', '🦘', [M('series', 'Completa la serie', 'De 1 en 1, de 2 en 2, de 5 en 5…', g1Series)]),
    U('dinero', 'El dinero', 'Planeta Hucha', '💶', [M('cuanto', '¿Cuánto dinero hay?', 'Monedas y billetes', g1Money)]),
    U('tiempo', 'El tiempo', 'Planeta Reloj', '⏰', [M('reloj', '¿Qué hora es?', 'En punto e y media', g1Clock), M('dias', 'Días y meses', '¿Cuál va después?', g1Week)]),
    U('formas', 'Las formas', 'Planeta Figuras', '🔷', [M('formas', 'Figuras planas', 'Círculo, triángulo, cuadrado…', g1Shapes)]),
    arcade([AC('sumas', 'Sumas relámpago', '¡Todas las que puedas!', fastAdd, 60, [8, 14, 20]), AC('restas', 'Restas relámpago', '¡Todas las que puedas!', fastSub, 60, [8, 14, 20])]),
  ], { young: true });

  course('mates2', '2.º', 'Mates 2.º', '🎒', 'Hasta el 999, llevadas, tablas y repartos', ['2'], [7, 8], [
    U('numeros', 'Los números hasta el 999', 'Planeta Centena', '💯', [M('descompon', 'Centenas, decenas y unidades', 'Descompón y compón', g2Place), M('compara', 'Compara números', '<, > e =', g2Compare), M('decena', 'La decena más cercana', 'Redondea', g2RoundTen), M('ordena', 'Ordena', 'De menor a mayor', (l) => orderNums(R.sample(range(100, 999), 4)), 4)]),
    U('sumas', 'Sumas y restas', 'Planeta Llevadas', '🧮', [M('sumas', 'Sumas llevando', 'De 2 y 3 cifras', g2Add), M('restas', 'Restas llevando', 'De 2 y 3 cifras', g2Sub), M('relacion', 'La suma y la resta', 'Una deshace la otra', g2Relation, 4), M('tres', 'Tres sumandos', 'Busca parejas fáciles', g2Three, 4)]),
    U('multiplicar', 'La multiplicación', 'Planeta Grupos', '🍇', [M('grupos', 'Suma repetida', '4 + 4 + 4 = 3 × 4', g2Repeated, 4), M('tablas', 'Las tablas', 'Del 2 al 9', g2Tables, 8), M('doble', 'Doble y mitad', '× 2 y : 2', g2DoubleHalf)]),
    U('reparto', 'Reparto y división', 'Planeta Reparto', '🍰', [M('repartir', 'Repartimos', 'A partes iguales', g2Share)]),
    U('problemas', 'Problemas', 'Planeta Pistas', '🔎', [M('dos', 'Problemas de dos operaciones', 'Paso a paso', g2TwoSteps, 4), M('compras', 'De compras', 'Precios y vueltas', g2Shop)]),
    U('medida', 'La medida', 'Planeta Metro', '📏', [M('unidades', '¿Con qué lo medirías?', 'Metros, kilos y litros', g2Units)]),
    U('tiempo', 'El tiempo', 'Planeta Calendario', '📅', [M('reloj', '¿Qué hora es?', 'En punto, y cuarto, y media, menos cuarto', at(G.gClock, 0)), M('meses', 'Los meses', '¿Cuál va después?', at(g1Week, 2))]),
    U('geometria', 'Geometría', 'Planeta Polígono', '🔺', [M('poligonos', 'Polígonos', 'Cuenta los lados', at(G.gPolygon, 0))]),
    arcade([AC('tablas', 'Tablas del 2, 5 y 10', '60 segundos', fastTable([2, 5, 10]), 60, [10, 16, 22]), AC('tablas2', 'Todas las tablas', '60 segundos', fastTable([3, 4, 6, 7, 8, 9]), 60, [8, 13, 18])]),
  ]);

  course('mates3', '3.º', 'Mates 3.º', '✏️', 'Hasta el 99 999, multiplicar, dividir y fracciones', ['3'], [8, 9], [
    U('numeros', 'Números de 4 y 5 cifras', 'Planeta Millar', '🏙️', [M('leer', 'Lee y escribe números', 'Hasta 99 999', (l) => readNum(l === 2 ? 5 : 4)), M('valor', '¿Cuánto vale la cifra?', 'Unidades, decenas, centenas, millares', at(G.gPlace, 0)), M('compara', 'Compara', '<, > e =', g3Compare), M('aproxima', 'Aproxima', 'A decenas, centenas y millares', g3Round)]),
    U('sumas', 'Sumas y restas', 'Planeta Columnas', '🧱', [M('calcula', 'Suma y resta', 'Con llevadas', g3AddSub), M('estima', 'Estima', 'Aproxima antes de calcular', g3Estimate, 4)]),
    U('angulos', 'Rectas y ángulos', 'Planeta Ángulo', '📐', [M('angulos', 'Tipos de ángulos', 'Agudo, recto, obtuso', at(G.gAngle, 0))]),
    U('multiplicacion', 'La multiplicación', 'Planeta Tablas', '✖️', [M('multiplica', 'Multiplica', 'Por una cifra, por 10, 100 y 1000', g3Mult), M('tablas', 'Repaso de tablas', 'Del 2 al 9', at(g2Tables, 2), 8)]),
    U('division', 'La división', 'Planeta Divisor', '➗', [M('divide', 'Divide', 'Cociente y resto', g3Div), M('reparto', 'Problemas de reparto', 'Paquetes y ramos', at(G.gPack, 0), 4)]),
    U('figuras', 'Figuras planas', 'Planeta Polígono', '🔷', [M('poligonos', 'Polígonos', 'Del triángulo al octógono', upto(G.gPolygon, 1)), M('triangulos', 'Triángulos', 'Por sus lados', at(G.gTriangle, 0)), M('circulo', 'Circunferencia y círculo', 'Radio y diámetro', upto(G.gCircle, 1))]),
    U('fracciones', 'Fracciones y decimales', 'Planeta Pizza', '🍕', [M('leer', '¿Qué fracción es?', 'Quesitos y barras', upto(G.gFracRead, 1)), M('de', 'Fracción de un número', '1/4 de 20', at(G.gFracOf, 0)), M('compara', '¿Cuál es mayor?', 'Mismo denominador', at(G.gFracCompare, 0)), M('decimas', 'Décimas', '3/10 = 0,3', at(G.gDecFrac, 0)), M('euros', 'Euros y céntimos', 'Suma precios', g3Money)]),
    U('medida', 'Unidades de medida', 'Planeta Regla', '📏', [M('unidades', 'Cambio de unidades', 'km, m, cm, kg, g, l…', at(G.gConvert, 0))]),
    U('tiempo', 'La medida del tiempo', 'Planeta Reloj', '⏰', [M('reloj', '¿Qué hora es?', 'De 5 en 5 minutos', at(G.gClock, 1)), M('unidades', 'Horas, minutos, días…', 'Cambia de unidad', upto(G.gTimeConv, 1))]),
    U('cuerpos', 'Cuerpos geométricos', 'Planeta Cubo', '🧊', [M('cuerpos', 'Cuerpos geométricos', 'Prismas, pirámides y cuerpos redondos', g3Solids)]),
    arcade([AC('tablas', 'Batalla de tablas', '60 segundos', fastTable([2, 3, 4, 5, 6, 7, 8, 9]), 60, [8, 14, 20]), AC('mental', 'Cálculo mental', '+9, +99, × 10…', at(G.gMental, 0), 60, [5, 9, 13])]),
  ]);

  course('mates4', '4.º', 'Mates 4.º', '📐', 'Millones, divisiones, ángulos, fracciones y decimales', ['4'], [9, 10], [
    U('numeros', 'Números de hasta 7 cifras', 'Planeta Millón', '🌍', [M('leer', 'Lee y escribe números', 'Hasta los millones', (l) => readNum([5, 6, 7][l])), M('valor', '¿Cuánto vale la cifra?', 'Valor posicional', G.gPlace), M('ordena', 'Ordena números grandes', 'De menor a mayor', G.gOrderBig, 4), M('aproxima', 'Aproximaciones', 'Redondea', upto(G.gRound, 1)), M('romanos', 'Números romanos', 'I, V, X, L, C, D, M', upto(G.gRoman, 1))]),
    U('sumas', 'Sumas y restas', 'Planeta Propiedades', '🔁', [M('propiedades', 'Propiedades', 'Conmutativa, asociativa, distributiva', g4Props), M('prueba', 'Prueba de la resta', 'Comprueba con una suma', g4CheckSub, 4), M('combinadas', 'Operaciones combinadas', 'Paréntesis primero', upto(G.gCombined, 1))]),
    U('multiplicacion', 'Multiplicación', 'Planeta Producto', '✖️', [M('dos', 'Por dos y tres cifras', 'Por partes', g4Mult, 4), M('estima', 'Estima productos', 'Aproxima un factor', g4EstProd, 4)]),
    U('division', 'División', 'Planeta Cociente', '➗', [M('divide', 'Divisiones', 'Con divisor de una y dos cifras', g4Div), M('reparte', 'Repartos con resto', 'Problemas', upto(G.gPack, 1), 4)]),
    U('geometria', 'Ángulos y polígonos', 'Planeta Transportador', '📐', [M('angulos', 'Clasifica ángulos', 'Agudo, recto, obtuso, llano', at(G.gAngle, 1)), M('triangulos', 'Triángulos', 'Por lados y por ángulos', upto(G.gTriangle, 1)), M('cuadrilateros', 'Cuadriláteros', 'Paralelogramos y trapecios', g4Quads)]),
    U('fracciones', 'Fracciones', 'Planeta Pizza', '🍕', [M('leer', '¿Qué fracción es?', 'Quesitos y barras', upto(G.gFracRead, 1)), M('compara', 'Compara fracciones', '¿Cuál es mayor?', upto(G.gFracCompare, 1)), M('de', 'Fracción de un número', '3/4 de 20', upto(G.gFracOf, 1))]),
    U('decimales', 'Décimas y centésimas', 'Planeta Coma', '🔵', [M('cifras', '¿Qué cifra es?', 'Décimas y centésimas', upto(G.gDecPlace, 1)), M('fraccion', 'Fracción decimal ↔ decimal', '0,25 = 25/100', upto(G.gDecFrac, 1)), M('compras', 'Situaciones de compra', 'Precios y vueltas', g4Shop)]),
    U('medida', 'Medida y tiempo', 'Planeta Reloj', '⏰', [M('unidades', 'Longitud, capacidad y masa', 'Cambia de unidad', at(G.gConvert, 1)), M('reloj', 'El reloj digital', '¿A qué hora termina?', at(G.gTimeAdd, 0), 4), M('tiempo', 'Unidades de tiempo', 'Horas, minutos, semanas…', upto(G.gTimeConv, 2))]),
    U('datos', 'Probabilidad y estadística', 'Planeta Datos', '📊', [M('probabilidad', 'Seguro, posible, imposible', '¿Qué es más probable?', upto(G.gProb, 1)), M('media', 'La media', 'Suma y divide', at(G.gMean, 0), 4), M('graficos', 'Gráficos de barras', 'Lee el gráfico', upto(G.gChart, 1))]),
    U('cuerpos', 'Cuerpos geométricos', 'Planeta Cubo', '🧊', [M('cuerpos', 'Prismas, pirámides y cuerpos redondos', '¿Cómo se llama?', at(g3Solids, 2))]),
    arcade([AC('batalla', 'Batalla de multiplicaciones', '60 segundos', G.gBattle, 60, [10, 16, 22]), AC('divisiones', 'Divisiones relámpago', 'Divisiones exactas', G.gDivFast, 60, [8, 14, 20])]),
  ]);

  course('mates6', '6.º', 'Mates 6.º', '🎓', 'Enteros, m.c.m., fracciones, proporcionalidad y más', ['6'], [11, 12], [
    U('numeros', 'Números naturales', 'Planeta Millón', '🌍', [M('leer', 'Lee y escribe números', 'Hasta los cientos de millones', at(G.gReadNumber, 2)), M('aproxima', 'Aproximaciones', 'A los millones', at(G.gRound, 2)), M('romanos', 'Números romanos', 'Hasta el 3999', at(G.gRoman, 2))]),
    U('divisibilidad', 'Divisibilidad', 'Planeta Primo', '🧲', [M('mcm', 'Mínimo común múltiplo', 'Y problemas de coincidir', g6Mcm), M('mcd', 'Máximo común divisor', 'Y problemas de repartir', g6Mcd), M('primos', 'Números primos', 'Hasta el 50', at(G.gPrimes, 2), 3), M('criterios', 'Criterios de divisibilidad', 'Por 2, 3, 5, 9 y 10', at(G.gCriteria, 2))]),
    U('enteros', 'Números enteros', 'Planeta Termómetro', '🌡️', [M('enteros', 'Números negativos', 'Compara, ordena y calcula', g6Integers, 6)]),
    U('fracciones', 'Fracciones', 'Planeta Pizza', '🍕', [M('equivalentes', 'Fracciones equivalentes', 'Amplifica y simplifica', at(G.gFracEquiv, 2)), M('compara', 'Compara fracciones', 'Con distinto denominador', at(G.gFracCompare, 2)), M('operaciones', 'Operaciones con fracciones', 'Suma, resta, multiplica y divide', g6FracOps, 6), M('mixtos', 'Números mixtos', 'Fracciones impropias', at(G.gMixed, 2))]),
    U('decimales', 'Números decimales', 'Planeta Coma', '🔵', [M('compara', 'Compara decimales', '¡Cuidado con las cifras!', at(G.gDecCompare, 2)), M('operaciones', 'Suma y resta', 'Alinea las comas', at(G.gDecOps, 2)), M('coma', 'Por y entre 10, 100, 1000', 'Mueve la coma', at(G.gDecTimes, 2)), M('division', 'División de decimales', 'Decimal entre natural', g6DecDiv)]),
    U('potencias', 'Potencias y raíces', 'Planeta Potencia', '⚡', [M('potencias', 'Potencias', 'Base y exponente', at(G.gPow, 2)), M('raiz', 'Raíz cuadrada', '√49 = 7', g6Sqrt), M('polinomica', 'Descomposición polinómica', 'Con potencias de 10', g6Expanded, 4), M('combinadas', 'Operaciones combinadas', 'Jerarquía de operaciones', at(G.gCombined, 2))]),
    U('proporcion', 'Proporcionalidad y porcentajes', 'Planeta Escala', '🗺️', [M('proporcion', 'Proporcionalidad', 'Reducción a la unidad', g6Proportion), M('escalas', 'Escalas', 'Planos y mapas', g6Scale), M('porcentajes', 'Porcentajes', 'Aumentos y descuentos', g6PercentChange)]),
    U('medida', 'Medida y geometría', 'Planeta Compás', '🧭', [M('unidades', 'Cambio de unidades', 'Con decimales', at(G.gConvert, 2)), M('areas', 'Áreas', 'Rectángulos y triángulos', at(G.gArea, 2)), M('circulo', 'Circunferencia y círculo', 'Con π = 3,14', g6Circle, 4)]),
    U('datos', 'Estadística y probabilidad', 'Planeta Datos', '📊', [M('graficos', 'Gráficos', 'Moda, total y media', at(G.gChart, 2)), M('media', 'La media', 'Suma y divide', at(G.gMean, 2), 4), M('probabilidad', 'Probabilidad', 'Casos favorables entre posibles', at(G.gProb, 2))]),
    arcade([AC('mental', 'Cálculo mental', '+99, −99, × 100…', at(G.gMental, 2), 60, [6, 10, 14]), AC('cuadrados', 'Cuadrados y raíces', 'De 1 × 1 a 15 × 15', G.gSqFast, 45, [8, 13, 18])]),
  ]);

  // 5.º keeps its own file; it only needs the school year so it shows first for 5.º
  S.subjects.mates5.grades = ['5'];
  S.subjects.mates5.ages = [9, 11];
  S.subjects.numeros.grades = ['i3', 'i4', 'i5'];
  S.subjects.numeros.ages = [3, 6];
  S.subjects.logica.grades = ['i3', 'i4', 'i5', '1', '2'];
})();
