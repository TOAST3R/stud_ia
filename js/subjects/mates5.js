// Subject: Matemáticas 5º de primaria (workbook units 3–10).
//
// HOW TO ADD CONTENT
//   A subject is { id, title, emoji, tagline, ages: [min, max], units: [...] } registered in
//   StudIA.subjects. Optional: young: true (big pictures + questions read aloud) and
//   exam: { title, label, emoji, rounds }. Players see the subjects for their age first.
//   A unit is a planet: { id, n, title, planet, emoji, color, missions: [...] }.
//   A mission is { id, title, desc, rounds, gen(lvl, i) } where gen returns one challenge:
//     lvl goes 0 → 2 (easy → hard) through the mission, i is the round number
//     (undefined in the exam).
//   A challenge is { type, prompt, hint?, explain?, ...data } with type one of the
//   widgets in widgets.js: 'cells', 'choice', 'paint', 'cards', 'pick', 'order', 'latin', 'memory'.
//   To add another subject, copy this file, change the id, and add a <script> in index.html.
(function () {
  const S = window.StudIA, { R, fmt } = S;
  const cell = (i) => `{{${i}}}`;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const tcards = (ds) => `<span class="tcards">${ds.map((d) => `<span class="tcard">${d}</span>`).join('')}</span>`;
  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // 2659 -> [2000, 600, 50, 9]
  const places = (n) => {
    const out = [];
    for (let p = 1; n > 0; n = Math.floor(n / 10), p *= 10) if (n % 10) out.unshift((n % 10) * p);
    return out;
  };

  // One-answer question with a unit ("kg", "€"…)
  const question = (prompt, ans, unit, extra) => Object.assign({
    type: 'cells', prompt,
    html: `<div class="eq">Respuesta: ${cell(0)} <span class="unit">${unit || ''}</span></div>`,
    cells: [{ ans }],
  }, extra);

  // ================= Unidad 3 · Sumamos =================
  function twoDigit(ds) {
    const nums = [];
    ds.forEach((a) => ds.forEach((b) => { if (a !== b) nums.push(a * 10 + b); }));
    return nums;
  }
  function g3Formar() {
    const ds = R.sample(DIGITS, 3).sort((a, b) => a - b);
    const nums = twoDigit(ds), total = sum(nums), s = sum(ds);
    return {
      type: 'cells',
      prompt: 'Con estas 3 tarjetas, forma <b>todos</b> los números de 2 cifras diferentes. Después, súmalos.',
      html: `<div class="eq">${tcards(ds)}</div>
        <div class="eq wrap">${[0, 1, 2, 3, 4, 5].map(cell).join('<span>+</span>')}</div>
        <div class="eq">Suma = ${cell(6)}</div>`,
      cells: [0, 1, 2, 3, 4, 5].map(() => ({ set: 'n', stage: 0 })).concat({ ans: total, stage: 1 }),
      sets: { n: nums },
      hint: 'Salen 6 números. Elige una tarjeta para las decenas y júntala con cada una de las otras dos.',
      explain: `Los números son ${nums.join(', ')}. <b>Truco:</b> suma las tarjetas (${ds.join(' + ')} = ${s}) y multiplica por 22: ${s} × 22 = <b>${total}</b>.`,
    };
  }
  function g3Truco() {
    const ds = R.sample(DIGITS, 3).sort((a, b) => a - b);
    const s = sum(ds), total = 22 * s;
    const why = 'Cada tarjeta aparece 2 veces en las decenas y 2 veces en las unidades. Por eso la suma de los 6 números es siempre <b>22 × (suma de las tarjetas)</b>.';
    const kind = R.pick(['suma', 'tarjetas', 'cuales']);
    if (kind === 'suma') {
      return {
        type: 'cells',
        prompt: 'Sin escribir los 6 números: ¿cuánto suman todos los números de 2 cifras diferentes que se forman con estas tarjetas?',
        html: `<div class="eq">${tcards(ds)}</div><div class="eq">Suma = ${cell(0)}</div>`,
        cells: [{ ans: total }],
        hint: why,
        explain: `${ds.join(' + ')} = ${s}, y ${s} × 22 = <b>${total}</b>.`,
      };
    }
    if (kind === 'tarjetas') {
      return {
        type: 'cells',
        prompt: `Con 3 tarjetas se forman los 6 números de 2 cifras diferentes, y todos juntos suman <b>${total}</b>. ¿Cuánto suman las 3 tarjetas?`,
        html: `<div class="eq">${tcards(['?', '?', '?'])}</div><div class="eq">Las tarjetas suman ${cell(0)}</div>`,
        cells: [{ ans: s }],
        hint: why,
        explain: `${total} : 22 = <b>${s}</b>. Por ejemplo, las tarjetas ${ds.join(', ')}.`,
      };
    }
    const trios = [ds], seen = new Set([s]);
    while (trios.length < 4) {
      const t = R.sample(DIGITS, 3).sort((a, b) => a - b);
      if (!seen.has(sum(t))) { seen.add(sum(t)); trios.push(t); }
    }
    return {
      type: 'choice',
      prompt: `¿Con qué 3 tarjetas la suma de los 6 números de 2 cifras diferentes es <b>${total}</b>?`,
      options: R.shuffle(trios.map((t, i) => ({ label: tcards(t), correct: i === 0 }))),
      hint: why,
      explain: `${total} : 22 = ${s}, así que las tarjetas tienen que sumar ${s}: <b>${ds.join(' + ')} = ${s}</b>.`,
    };
  }

  // ================= Unidad 4 · Restamos =================
  function diffRows(start) {
    const rows = [start];
    let cur = start;
    while (cur.some((x) => x) && rows.length < 12) {
      cur = cur.map((x, i) => Math.abs(x - cur[(i + 1) % 4]));
      rows.push(cur);
    }
    return rows;
  }
  function g4Diffy(lvl) {
    const max = [30, 120, 1000][lvl], maxRows = lvl === 0 ? 4 : 5;
    let rows;
    do {
      const start = [0, 1, 2, 3].map(() => R.int(1, max));
      if (lvl === 2) start[0] = 1000;
      rows = diffRows(start);
    } while (rows.length - 1 < 3 || rows.length - 1 > maxRows);
    const cells = [];
    let html = '<div class="diffy">';
    rows.forEach((row, r) => {
      html += `<div class="drow" style="--r:${r}">`;
      row.forEach((v) => {
        if (r === 0) html += `<span class="dbox">${v}</span>`;
        else { html += cell(cells.length); cells.push({ ans: v, stage: r - 1 }); }
      });
      html += '</div>';
    });
    return {
      type: 'cells',
      prompt: 'Completa el diagrama fila a fila. Cada casilla es la <b>diferencia</b> entre las dos casillas que tiene encima. La última de cada fila es la diferencia entre el último y el primer número de la fila anterior. ¡Sigue hasta llegar a una fila de ceros!',
      html: html + '</div>',
      cells,
      hint: 'Resta siempre el pequeño al grande. Para la última casilla de cada fila, usa el último y el primer número de la fila de arriba.',
      explain: `Has necesitado ${rows.length - 1} filas para llegar a los ceros.`,
    };
  }

  // ================= Unidad 5 · Relacionamos sumas y restas =================
  function g5Compensa(lvl) {
    const k = lvl === 0 ? R.int(1, 2) : lvl === 1 ? R.int(3, 9) : R.pick([10, 11, 12, 15, 20, 30]);
    const kind = R.pick(['s-both', 's-swap', 's-one', 'r-less', 'r-more', 'r-both', 'r-first']);
    let known, ask, ans, hint, why;
    if (kind[0] === 's') {
      const A = 50 * R.int(6, 30), B = kind === 's-swap' ? R.int(210, 1400) : 50 * R.int(6, 30), T = A + B;
      known = `${fmt(A)} + ${fmt(B)} = ${fmt(T)}`;
      if (kind === 's-both') {
        ask = `${fmt(A - k)} + ${fmt(B - k)}`; ans = T - 2 * k;
        hint = `Los dos sumandos han bajado ${k}.`;
        why = `Cada sumando tiene ${k} menos, así que el resultado tiene ${2 * k} menos: ${fmt(T)} − ${2 * k} = <b>${fmt(ans)}</b>.`;
      } else if (kind === 's-swap') {
        ask = `${fmt(A - k)} + ${fmt(B + k)}`; ans = T;
        hint = `Un sumando ha bajado ${k} y el otro ha subido ${k}.`;
        why = `Lo que le quitas a un sumando se lo das al otro: el resultado <b>no cambia</b>.`;
      } else {
        ask = `${fmt(A)} + ${fmt(B + k)}`; ans = T + k;
        hint = `Solo ha cambiado el segundo sumando: ha subido ${k}.`;
        why = `Un sumando tiene ${k} más, así que el resultado también: ${fmt(T)} + ${k} = <b>${fmt(ans)}</b>.`;
      }
    } else {
      const B = 10 * R.int(10, 90), A = B + R.int(120, 1200), D = A - B;
      known = `${fmt(A)} − ${fmt(B)} = ${fmt(D)}`;
      if (kind === 'r-less') {
        ask = `${fmt(A)} − ${fmt(B - k)}`; ans = D + k;
        hint = `Ahora restas ${k} menos que antes.`;
        why = `Si quitas ${k} menos, te quedan ${k} más: ${fmt(D)} + ${k} = <b>${fmt(ans)}</b>.`;
      } else if (kind === 'r-more') {
        ask = `${fmt(A)} − ${fmt(B + k)}`; ans = D - k;
        hint = `Ahora restas ${k} más que antes.`;
        why = `Si quitas ${k} más, te quedan ${k} menos: ${fmt(D)} − ${k} = <b>${fmt(ans)}</b>.`;
      } else if (kind === 'r-both') {
        ask = `${fmt(A + k)} − ${fmt(B + k)}`; ans = D;
        hint = `Los dos números han subido ${k}.`;
        why = `Si sumas lo mismo a los dos números, la diferencia <b>no cambia</b>.`;
      } else {
        ask = `${fmt(A + k)} − ${fmt(B)}`; ans = D + k;
        hint = `Solo ha cambiado el primer número: ha subido ${k}.`;
        why = `Empiezas con ${k} más, así que te quedan ${k} más: ${fmt(D)} + ${k} = <b>${fmt(ans)}</b>.`;
      }
    }
    return {
      type: 'cells',
      prompt: 'Usa la primera operación para resolver la segunda <b>sin hacer toda la cuenta</b>. ¿Qué ha cambiado?',
      html: `<div class="pair"><div class="op known">${known}</div><div class="op ask">${ask} = ${cell(0)}</div></div>`,
      cells: [{ ans }],
      hint, explain: why,
    };
  }
  function g5Sencilla() {
    let orig, opts, why;
    if (R.int(0, 1)) {
      const d = R.int(1, 5), A = 100 * R.int(4, 30) - d;
      let B;
      do { B = R.int(215, 2900); } while (B % 10 < 5);
      orig = `${fmt(A)} + ${fmt(B)}`;
      opts = [[A + d, B - d], [A + d, B + d], [A + d, B], [A - d, B - d]].map(([x, y]) => `${fmt(x)} + ${fmt(y)}`);
      why = `Le das ${d} al primer sumando y se lo quitas al segundo: ${opts[0]} = <b>${fmt(A + B)}</b>.`;
    } else {
      const A = 1000 * R.int(1, 9);
      let B;
      do { B = R.int(125, A - 110); } while (B % 10 === 0);
      orig = `${fmt(A)} − ${fmt(B)}`;
      opts = [[A - 1, B - 1], [A - 1, B + 1], [A + 1, B - 1], [A - 1, B]].map(([x, y]) => `${fmt(x)} − ${fmt(y)}`);
      why = `Quitas 1 a los dos números y la diferencia no cambia. ¡Y ya no hay que llevarse! ${opts[0]} = <b>${fmt(A - B)}</b>.`;
    }
    return {
      type: 'choice',
      prompt: `¿Qué operación más sencilla da <b>el mismo resultado</b> que esta?<div class="eq big">${orig}</div>`,
      options: R.shuffle(opts.map((label, i) => ({ label, correct: i === 0 }))),
      hint: 'En una suma, lo que quitas a un número se lo das al otro. En una resta, cambia los dos números igual.',
      explain: why,
    };
  }
  function g5Problema() {
    const kind = R.int(0, 2);
    if (kind === 0) {
      const exp = [R.int(2, 9), R.int(2, 9), R.int(2, 9)].map((x) => x * 100), off = [R.int(2, 6), R.int(1, 5), R.int(2, 6)];
      const real = exp.map((x, i) => x - off[i]);
      const who = R.pick([['Un carpintero', 'camiones con cargas', 'kg de madera', 'kg'], ['Una panadera', 'sacos', 'kg de harina', 'kg'], ['Un granjero', 'remolques', 'kg de paja', 'kg']]);
      return question(
        `${who[0]} esperaba recibir tres ${who[1]} de ${exp[0]}, ${exp[1]} y ${exp[2]} ${who[2]}. Pero al pesarlos, el primero traía ${real[0]}, el segundo ${real[1]} y el tercero ${real[2]}. ¿Cuántos kilos ha recibido realmente?`,
        sum(real), who[3], {
          hint: `Suma primero los números redondos (${exp.join(' + ')}) y después quita lo que falta.`,
          explain: `${exp.join(' + ')} = ${fmt(sum(exp))}. Faltan ${off.join(' + ')} = ${sum(off)}. ${fmt(sum(exp))} − ${sum(off)} = <b>${fmt(sum(real))}</b>.`,
        });
    }
    if (kind === 1) {
      const C = 50 * R.int(3, 9), P = C + 100 * R.int(2, 6), a = R.int(1, 4), b = R.int(1, 4);
      const who = R.pick([['Marco', 'una cafetera'], ['Lucía', 'una bici'], ['Hugo', 'una tableta']]);
      return question(
        `${who[0]} fue a comprar ${who[1]} que costaba ${C} €. Pensaba que llevaba ${P} €, así que esperaba volver con ${P - C} €. Pero en realidad llevaba ${P + a} € y el precio era ${C - b} €. ¿Con cuánto dinero volvió a casa?`,
        P - C + a + b, '€', {
          hint: `Tenía ${a} € más y pagó ${b} € menos de lo que pensaba.`,
          explain: `Esperaba ${P - C} €. Llevaba ${a} € más y pagó ${b} € menos: ${P - C} + ${a} + ${b} = <b>${P - C + a + b} €</b>.`,
        });
    }
    const A = 100 * R.int(5, 20), B = 100 * R.int(3, 12), a = R.int(2, 6);
    return question(
      `En una carrera solidaria, 5.º A quería recorrer ${fmt(A)} m y 5.º B ${fmt(B)} m. Al final, 5.º A recorrió ${fmt(A - a)} m y 5.º B ${fmt(B + a)} m. ¿Cuántos metros recorrieron entre las dos clases?`,
      A + B, 'm', {
        hint: `Una clase hizo ${a} m menos y la otra ${a} m más.`,
        explain: `Lo que le falta a una clase lo hizo la otra: ${fmt(A)} + ${fmt(B)} = <b>${fmt(A + B)} m</b>.`,
      });
  }

  // ================= Unidad 6 · Estimamos sumas y restas =================
  const ZONES = 'ABCDEFGHIJ';
  const zoneOptions = (z) => ZONES.split('').map((l, i) => ({ label: l, correct: i === z }));
  const zoneRange = (z) => `entre ${fmt(z * 1000)} y ${fmt((z + 1) * 1000)}`;
  function g6Zona(lvl) {
    const margin = [150, 60, 1][lvl];
    let a, b, r, plus;
    do {
      plus = R.int(0, 1) === 1;
      a = R.int(1100, 9800);
      b = R.int(1100, 8800);
      r = plus ? a + b : a - b;
    } while (r < 100 || r > 9900 || r % 1000 < margin || r % 1000 > 1000 - margin);
    const z = Math.floor(r / 1000), sign = plus ? '+' : '−';
    const ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
    return {
      type: 'choice', layout: 'line',
      prompt: `¿A qué zona pertenece el resultado? Toca la zona en la recta.<div class="eq big">${fmt(a)} ${sign} ${fmt(b)}</div>`,
      options: zoneOptions(z),
      hint: `No hace falta el resultado exacto. Redondea: ${fmt(ra)} ${sign} ${fmt(rb)}.`,
      explain: `${fmt(a)} ${sign} ${fmt(b)} = ${fmt(r)}, que está ${zoneRange(z)}: <b>zona ${ZONES[z]}</b>.`,
    };
  }
  function g6Manchas() {
    const blot = '<span class="blot"></span>';
    let pa, pb, hb, lo, hi, plus;
    do {
      plus = R.int(0, 1) === 1;
      pa = R.int(12, 98);
      pb = R.int(11, 89);
      hb = R.int(1, 2); // hidden digits in the second number
      const aLo = pa * 100, aHi = aLo + 99, bLo = pb * 10 ** hb, bHi = bLo + 10 ** hb - 1;
      lo = plus ? aLo + bLo : aLo - bHi;
      hi = plus ? aHi + bHi : aHi - bLo;
    } while (lo < 1 || hi > 9999 || Math.floor(lo / 1000) !== Math.floor(hi / 1000));
    const z = Math.floor(lo / 1000), sign = plus ? '+' : '−';
    return {
      type: 'choice', layout: 'line',
      prompt: `Unas manchas de tinta tapan algunas cifras. ¿A qué zona pertenece <b>sin duda</b> el resultado?<div class="eq big">${pa}${blot}${blot} ${sign} ${pb}${blot.repeat(hb)}</div>`,
      options: zoneOptions(z),
      hint: 'Piensa en el resultado más pequeño posible (manchas = 0) y en el más grande (manchas = 9).',
      explain: `Pase lo que pase bajo las manchas, el resultado está entre ${fmt(lo)} y ${fmt(hi)}: <b>zona ${ZONES[z]}</b> (${zoneRange(z)}).`,
    };
  }
  function g6Aprox() {
    const r100 = (x) => Math.round(x / 100) * 100;
    const kind = R.int(0, 2);
    let text, nums, approx, exact, unit, calc;
    if (kind === 0) {
      nums = [R.int(420, 980), R.int(1050, 1900), R.int(520, 990)];
      approx = sum(nums.map(r100)); exact = sum(nums); unit = 'entradas';
      text = `El viernes se vendieron ${fmt(nums[0])} entradas para el cine del pueblo, el sábado ${fmt(nums[1])} y el domingo ${fmt(nums[2])}. ¿Cuántas entradas se han vendido <b>aproximadamente</b> entre los tres días?`;
      calc = nums.map((x) => fmt(r100(x))).join(' + ');
    } else {
      const total = 1000 * R.int(7, 12) + (kind === 2 ? 100 * R.int(1, 9) : 0);
      nums = [R.int(2100, 4400), R.int(1100, total - 5000)];
      approx = total - r100(nums[0]) - r100(nums[1]); exact = total - nums[0] - nums[1];
      calc = `${fmt(total)} − ${fmt(r100(nums[0]))} − ${fmt(r100(nums[1]))}`;
      if (kind === 1) {
        unit = 'localidades';
        text = `En un polideportivo donde caben ${fmt(total)} espectadores se han vendido ${fmt(nums[0])} entradas y se han repartido ${fmt(nums[1])} invitaciones. <b>Aproximadamente</b>, ¿cuántas localidades quedan disponibles?`;
      } else {
        unit = '€';
        text = `María y Tomás quieren comprar un coche que vale ${fmt(total)} €. Ella tiene ahorrados ${fmt(nums[0])} € y él ${fmt(nums[1])} €. <b>Aproximadamente</b>, ¿cuánto dinero les falta?`;
      }
    }
    const vals = new Set([approx]);
    while (vals.size < 4) {
      const v = approx + R.pick([-1500, -1000, -600, 600, 1000, 1500]);
      if (v > 0) vals.add(v);
    }
    return {
      type: 'choice',
      prompt: text,
      options: R.shuffle([...vals].map((v) => ({ label: `Unas ${fmt(v)} ${unit}`, correct: v === approx }))),
      hint: 'Redondea cada número a la centena más cercana y calcula con números fáciles.',
      explain: `Redondeando: ${calc} = <b>${fmt(approx)}</b>. (El resultado exacto es ${fmt(exact)}.)`,
    };
  }

  // ================= Unidad 7 · Multiplicamos =================
  const BOARD_WIDTH = { 3: 7, 4: 9, 5: 9, 6: 5, 7: 7, 8: 9, 9: 6 };
  function g7Pinta(lvl) {
    const t = R.pick([[4, 5, 6], [6, 7, 8], [7, 8, 9]][lvl]);
    const width = BOARD_WIDTH[t], to = Math.ceil((10 * t) / width) * width;
    const targets = [];
    for (let v = t; v <= to; v += t) targets.push(v);
    return {
      type: 'paint',
      prompt: `Pinta en el tablero todos los resultados de la <b>tabla del ${t}</b>.`,
      board: { to, width }, targets,
      hint: `Cuenta de ${t} en ${t}: ${t}, ${2 * t}, ${3 * t}…`,
      explain: `Tabla del ${t}: ${targets.join(', ')}. ¡Fíjate en el dibujo que forman en el tablero!`,
    };
  }
  function g7Tablero(lvl) {
    const n = lvl === 0 ? 3 : 4;
    const top = R.sample(DIGITS.slice(1), n), left = R.sample(DIGITS.slice(1), n);
    const cells = [];
    let html = `<table class="area"><tr><th class="x">×</th>${top.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    left.forEach((r) => {
      html += `<tr><th>${r}</th>`;
      top.forEach((c) => { html += `<td>${cell(cells.length)}</td>`; cells.push({ ans: r * c }); });
      html += '</tr>';
    });
    return {
      type: 'cells',
      prompt: 'Completa el tablero multiplicativo: en cada casilla, multiplica el número de su fila por el de su columna.',
      html: html + '</table>',
      cells,
      hint: 'Usa ➜ para saltar a la casilla siguiente. Si no recuerdas una, usa una vecina: 7 × 8 es 7 × 7 más 7.',
    };
  }
  function g7Rapido(lvl) {
    const lo = lvl === 0 ? 2 : lvl === 1 ? 4 : 6;
    const a = R.int(lo, 9), b = R.int(2, 9), p = a * b, kind = R.int(0, 3);
    const eq = kind < 2 ? `${a} × ${b} = ${cell(0)}` : kind === 2 ? `${cell(0)} × ${b} = ${p}` : `${a} × ${cell(0)} = ${p}`;
    return {
      type: 'cells',
      prompt: '¡Tablas relámpago! Completa:',
      html: `<div class="eq big">${eq}</div>`,
      cells: [{ ans: kind < 2 ? p : kind === 2 ? a : b }],
      explain: `${a} × ${b} = <b>${p}</b>`,
    };
  }

  // ================= Unidades 8 y 9 · Multiplicamos descomponiendo =================
  function areaModel(A, B, extra) {
    const cols = places(A), rows = places(B), cells = [], parts = [];
    let html = `<table class="area"><tr><th class="x">×</th>${cols.map((c) => `<th>${fmt(c)}</th>`).join('')}</tr>`;
    rows.forEach((r) => {
      html += `<tr><th>${fmt(r)}</th>`;
      cols.forEach((c) => { html += `<td>${cell(cells.length)}</td>`; cells.push({ ans: r * c, stage: 0 }); parts.push(fmt(r * c)); });
      html += '</tr>';
    });
    cells.push({ ans: A * B, stage: 1 });
    return Object.assign({
      type: 'cells',
      prompt: 'Resuelve con el <b>modelo rectangular</b>: rellena cada trozo del rectángulo y después súmalos todos.',
      html: `<div class="eq big">${fmt(A)} × ${fmt(B)}</div>${html}</table><div class="eq">${fmt(A)} × ${fmt(B)} = ${cell(cells.length - 1)}</div>`,
      cells,
      hint: 'Cada casilla es el número de su fila por el de su columna. Multiplica las cifras y luego añade los ceros.',
      explain: `${parts.join(' + ')} = <b>${fmt(A * B)}</b>`,
    }, extra);
  }
  const g8Rect = (lvl) => areaModel(10 * R.int(lvl === 0 ? 1 : 2, lvl === 0 ? 4 : 9) + R.int(1, 9), R.int(lvl === 0 ? 2 : 3, 9));
  function g8Vertical(lvl) {
    const n = lvl === 2 ? 100 * R.int(1, 9) + 10 * R.int(1, 9) + R.int(1, 9) : 10 * R.int(lvl === 0 ? 1 : 3, 9) + R.int(2, 9);
    const a = R.int(lvl === 0 ? 2 : 3, 9), parts = places(n).reverse(), cells = [];
    let html = `<div class="vert"><div class="vrow">${fmt(n)}</div><div class="vrow">× ${a}</div><div class="vline"></div>`;
    parts.forEach((p) => {
      html += `<div class="vrow">${cell(cells.length)}<small>${a} × ${p}</small></div>`;
      cells.push({ ans: a * p, stage: 0 });
    });
    html += `<div class="vline"></div><div class="vrow">${cell(cells.length)}<small>total</small></div></div>`;
    cells.push({ ans: a * n, stage: 1 });
    return {
      type: 'cells',
      prompt: 'Resuelve con el <b>esquema vertical</b>: primero las unidades, luego las decenas… y al final suma.',
      html, cells,
      hint: `Descompón el ${fmt(n)}: ${places(n).join(' + ')}. Multiplica cada trozo por ${a}.`,
      explain: `${parts.map((p) => a * p).join(' + ')} = <b>${fmt(a * n)}</b>`,
    };
  }
  function g8Igualdad() {
    let l, r, lv, rv;
    if (R.int(0, 1)) { // "moving a digit": 2 × 65 = 26 × 5 ?
      if (R.int(0, 1)) {
        const [a, n, m, c] = R.pick([[1, 64, 16, 4], [1, 95, 19, 5], [2, 65, 26, 5], [4, 98, 49, 8]]);
        l = `${a} × ${n}`; r = `${m} × ${c}`; lv = a * n; rv = m * c;
      } else {
        do {
          const a = R.int(1, 4), b = R.int(2, 9), c = R.int(2, 9);
          l = `${a} × ${10 * b + c}`; r = `${10 * a + b} × ${c}`; lv = a * (10 * b + c); rv = (10 * a + b) * c;
        } while (lv === rv);
      }
    } else { // half and double: 4 × 35 = 2 × 70 ?
      const x = 2 * R.int(2, 8), y = 5 * R.int(3, 11), y2 = R.int(0, 1) ? 2 * y : 2 * y + R.pick([-10, 5, 10]);
      l = `${x} × ${y}`; r = `${x / 2} × ${y2}`; lv = x * y; rv = (x / 2) * y2;
    }
    const ok = lv === rv;
    return {
      type: 'choice',
      prompt: `¿Es correcta esta igualdad? Compruébalo multiplicando.<div class="eq big">${l} = ${r}</div>`,
      options: [{ label: '✅ Correcta', correct: ok }, { label: '❌ Incorrecta', correct: !ok }],
      hint: 'Calcula cada lado por separado y compara.',
      explain: `${l} = ${fmt(lv)} y ${r} = ${fmt(rv)}. ${ok ? '<b>Son iguales.</b>' : '<b>No son iguales.</b>'}`,
    };
  }
  function g8Problema() {
    const n = R.int(11, 29);
    const [text, k, unit, why] = R.pick([
      [`¿Cuál es la máxima puntuación que podemos conseguir si sumamos los resultados de lanzar ${n} dados a la vez?`, 6, 'puntos', 'Lo máximo en cada dado es un 6'],
      [`¿Cuántos días hay en ${n} semanas?`, 7, 'días', 'Cada semana tiene 7 días'],
      [`Una araña tiene 8 patas. ¿Cuántas patas tienen ${n} arañas?`, 8, 'patas', 'Cada araña tiene 8 patas'],
      [`En una caja caben 6 huevos. ¿Cuántos huevos hay en ${n} cajas llenas?`, 6, 'huevos', 'Cada caja tiene 6 huevos'],
      [`Un equipo de voleibol tiene 9 jugadores. ¿Cuántos jugadores hay en ${n} equipos?`, 9, 'jugadores', 'Cada equipo tiene 9 jugadores'],
    ]);
    const t = Math.floor(n / 10) * 10, u = n % 10;
    return question(text, n * k, unit, {
      hint: `${why}. Descompón el ${n} en ${t} + ${u}.`,
      explain: `${why}: ${n} × ${k} = ${t} × ${k} + ${u} × ${k} = ${t * k} + ${u * k} = <b>${n * k}</b>.`,
    });
  }

  const MAGIC = [[823, 15], [733, 32], [2659, 13], [662, 69], [521, 109]];
  function g9Rect(lvl, i) {
    if (i >= 2) {
      const [A, B] = R.pick(MAGIC);
      return areaModel(A, B, { explain: `El resultado es <b>${fmt(A * B)}</b>. ¿Has visto sus cifras? ¡Van seguidas: ${String(A * B).split('').join(', ')}!` });
    }
    let A;
    do { A = R.int(112, 989); } while (A % 10 === 0);
    return areaModel(A, lvl === 0 ? R.int(11, 19) : 10 * R.int(2, 4) + R.int(1, 9));
  }
  function g9Cadena(lvl) {
    const n = lvl === 0 ? 100 * R.int(1, 9) : lvl === 1 ? 10 * R.int(11, 99) : R.int(101, 999);
    const steps = [n * 7, n * 77, n * 1001];
    return {
      type: 'cells',
      prompt: 'Completa la cadena de multiplicaciones, paso a paso. ¡Fíjate bien en el último resultado!',
      html: `<div class="chain"><span class="dbox">${n}</span>${[7, 11, 13].map((m, j) => `<span class="arrow">×${m}</span>${cell(j)}`).join('')}</div>`,
      cells: steps.map((ans, stage) => ({ ans, stage })),
      hint: 'Para multiplicar por 11: multiplica por 10 y suma el número una vez. Para multiplicar por 13: por 10, más por 3.',
      explain: `${n} → ${fmt(steps[0])} → ${fmt(steps[1])} → ${fmt(steps[2])}. <b>¡Sale el número repetido!</b> Es porque 7 × 11 × 13 = 1 001.`,
    };
  }
  function g9Truco() {
    const n = R.int(102, 998), kind = R.int(0, 3);
    const why = '7 × 11 × 13 = 1 001, y multiplicar un número de 3 cifras por 1 001 es escribirlo dos veces seguidas.';
    if (kind === 3) {
      return {
        type: 'cells',
        prompt: '¿Qué número falta? Recuerda el truco de la cadena.',
        html: `<div class="eq big wrap">${cell(0)} × 7 × 11 × 13 = ${fmt(n * 1001)}</div>`,
        cells: [{ ans: n }], hint: why, explain: `${why} El número era <b>${n}</b>.`,
      };
    }
    const q = [`${n} × 1 001`, `${n} × 7 × 11 × 13`, `${n} × 13 × 7 × 11`][kind];
    return {
      type: 'cells',
      prompt: 'Calcula con el truco de la cadena, ¡sin hacer las cuentas!',
      html: `<div class="eq big wrap">${q} = ${cell(0)}</div>`,
      cells: [{ ans: n * 1001 }], hint: why, explain: `${why} ${n} → <b>${fmt(n * 1001)}</b>.`,
    };
  }

  // ================= Unidad 10 · Practicamos (tarjetas 1–6) =================
  const CARD_DIGITS = [1, 2, 3, 4, 5, 6];
  function permutations(a) {
    if (a.length <= 1) return [a];
    return a.flatMap((x, i) => permutations(a.filter((y, j) => j !== i)).map((p) => [x, ...p]));
  }
  const ALL_PERMS = permutations(CARD_DIGITS);
  const CARD_SHAPES = {
    sum: [{ slots: [3, '+', 3], near: [500, 600, 700, 800, 900, 1000] }, { slots: [2, '+', 2, '+', 2], near: [90, 100, 120, 140] }],
    sub: [{ slots: [5, '-', 1], near: [20000, 30000, 40000, 50000] }, { slots: [3, '-', 3], near: [100, 200, 300, 400] }],
  };
  function g10(op, lvl, i) {
    const shape = i === undefined ? R.pick(CARD_SHAPES[op]) : CARD_SHAPES[op][i < 3 ? 0 : 1];
    const kind = i === undefined ? R.pick(['max', 'min', 'near']) : ['max', 'min', 'near'][i % 3];
    const goal = { kind, target: kind === 'near' ? R.pick(shape.near) : null };
    let bestScore = -Infinity, bestArr = null;
    ALL_PERMS.forEach((p) => {
      const sc = S.cardsScore(goal, S.cardsValue(shape.slots, p));
      if (sc > bestScore) { bestScore = sc; bestArr = p; }
    });
    let k = 0;
    const shown = shape.slots.map((t) => (typeof t === 'number' ? bestArr.slice(k, (k += t)).join('') : t === '-' ? '−' : t)).join(' ');
    const goalText = { max: 'el <b>mayor</b> resultado posible', min: 'el <b>menor</b> resultado posible', near: `el resultado <b>más cercano a ${fmt(goal.target || 0)}</b>` }[kind];
    const tip = kind === 'near' ? 'Prueba, calcula y ve ajustando poco a poco.'
      : op === 'sum' ? `Pon las cifras más ${kind === 'max' ? 'grandes' : 'pequeñas'} en el lugar que más vale (el de la izquierda de cada número).`
      : kind === 'max' ? 'Haz el primer número lo más grande posible y el segundo lo más pequeño posible.'
      : 'Busca que los dos números se parezcan todo lo posible (¡pero sin pasarte, el resultado no puede ser negativo!).';
    return {
      type: 'cards',
      prompt: `Coloca las 6 tarjetas (cada una se usa una sola vez) para conseguir ${goalText}.`,
      digits: CARD_DIGITS, slots: shape.slots, goal, bestScore, bestArr,
      hint: tip,
      explain: `Una solución: ${shown} = <b>${fmt(S.cardsValue(shape.slots, bestArr))}</b>. ${tip}`,
    };
  }

  // ================= The subject =================
  S.subjects.mates5 = {
    id: 'mates5',
    title: 'Mates 5.º',
    emoji: '🧮',
    tagline: 'Sumas, restas y multiplicaciones',
    ages: [8, 12],
    units: [
      { id: 'u3', n: 3, title: 'Sumamos', planet: 'Planeta Baraja', emoji: '🃏', color: '#ff9d3d', missions: [
        { id: 'formar', title: 'Todas las combinaciones', desc: 'Forma los 6 números con 3 tarjetas y súmalos', rounds: 3, gen: g3Formar },
        { id: 'truco', title: 'El truco del 22', desc: 'Adivina la suma sin escribir los números', rounds: 5, gen: g3Truco },
      ] },
      { id: 'u4', n: 4, title: 'Restamos', planet: 'Cascada Cero', emoji: '💧', color: '#58c4ff', missions: [
        { id: 'cascada', title: 'Cascada de diferencias', desc: 'Resta fila a fila hasta llegar a los ceros', rounds: 3, gen: (lvl) => g4Diffy(Math.min(lvl, 1)) },
        { id: 'gigante', title: 'Cascada gigante', desc: 'El diagrama del libro, con números hasta 1 000', rounds: 2, gen: () => g4Diffy(2) },
      ] },
      { id: 'u5', n: 5, title: 'Relacionamos sumas y restas', planet: 'Luna Balanza', emoji: '⚖️', color: '#ffd23f', missions: [
        { id: 'compensa', title: '¿Qué ha cambiado?', desc: 'Usa una operación para resolver otra', rounds: 6, gen: g5Compensa },
        { id: 'sencilla', title: 'La operación fácil', desc: 'Encuentra una operación más sencilla', rounds: 5, gen: g5Sencilla },
        { id: 'problema', title: 'Problemas con sorpresa', desc: 'Lo esperado y lo que pasó de verdad', rounds: 4, gen: g5Problema },
      ] },
      { id: 'u6', n: 6, title: 'Estimamos sumas y restas', planet: 'Nebulosa Tinta', emoji: '🎯', color: '#c58bff', missions: [
        { id: 'zona', title: 'Zonas de aterrizaje', desc: '¿En qué zona de la recta cae el resultado?', rounds: 6, gen: g6Zona },
        { id: 'manchas', title: 'Manchas de tinta', desc: 'Estima aunque falten cifras', rounds: 5, gen: g6Manchas },
        { id: 'aprox', title: 'Más o menos', desc: 'Problemas con respuesta aproximada', rounds: 4, gen: g6Aprox },
      ] },
      { id: 'u7', n: 7, title: 'Multiplicamos', planet: 'Ciudad Tablero', emoji: '🏙️', color: '#2fd9a4', missions: [
        { id: 'pinta', title: 'Pinta la tabla', desc: 'Colorea los resultados de una tabla', rounds: 3, gen: g7Pinta },
        { id: 'tablero', title: 'Tablero multiplicativo', desc: 'Completa todas las casillas', rounds: 3, gen: g7Tablero },
        { id: 'rapido', title: 'Tablas relámpago', desc: '10 multiplicaciones a toda velocidad', rounds: 10, gen: g7Rapido },
      ] },
      { id: 'u8', n: 8, title: 'Multiplicamos descomponiendo', planet: 'Taller Rectángulo', emoji: '🧱', color: '#ff7a59', missions: [
        { id: 'rect', title: 'Modelo rectangular', desc: 'Parte el rectángulo y suma los trozos', rounds: 4, gen: g8Rect },
        { id: 'vertical', title: 'Esquema vertical', desc: 'Unidades, decenas… y suma', rounds: 4, gen: g8Vertical },
        { id: 'igualdad', title: '¿Verdad o coincidencia?', desc: 'Comprueba si la igualdad es correcta', rounds: 6, gen: g8Igualdad },
        { id: 'problema', title: 'Dados y semanas', desc: 'Problemas de multiplicar', rounds: 4, gen: g8Problema },
      ] },
      { id: 'u9', n: 9, title: 'Multiplicamos números grandes', planet: 'Estrella 1001', emoji: '✨', color: '#ff6fb1', missions: [
        { id: 'cadena', title: 'La cadena ×7 ×11 ×13', desc: 'Tres multiplicaciones y una sorpresa', rounds: 3, gen: g9Cadena },
        { id: 'truco', title: 'El truco del 1 001', desc: 'Usa la sorpresa para calcular al instante', rounds: 5, gen: g9Truco },
        { id: 'rect', title: 'Rectángulos XL', desc: 'Multiplica por números de 2 cifras', rounds: 4, gen: g9Rect },
      ] },
      { id: 'u10', n: 10, title: 'Practicamos', planet: 'Estación Seis Cartas', emoji: '🛰️', color: '#7d8cff', missions: [
        { id: 'sumas', title: 'Sumas con tarjetas', desc: 'El mayor, el menor y el más cercano', rounds: 6, gen: (lvl, i) => g10('sum', lvl, i) },
        { id: 'restas', title: 'Restas con tarjetas', desc: 'El mayor, el menor y el más cercano', rounds: 6, gen: (lvl, i) => g10('sub', lvl, i) },
      ] },
    ],
  };
})();
