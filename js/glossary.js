// Key concepts for the hint bubble: when a question mentions one of these words,
// the hint also explains what it means. S.concepts(text) → [[term, definition]].
(function () {
  const S = window.StudIA;
  const G = [
    // numbers and place value
    [/\bunidad(es)?\b(?! de)/, 'Unidad', 'Cada cosa suelta. En un número, la cifra de la derecha del todo.'],
    [/\bdecenas?\b(?! de)/, 'Decena', 'Un grupo de 10 unidades. En 34 hay 3 decenas.'],
    [/\bcentenas?\b(?! de)/, 'Centena', 'Un grupo de 100 unidades (10 decenas). En 352 hay 3 centenas.'],
    [/\b(unidades? de millar|millar(es)?)\b/, 'Millar', 'Un grupo de 1 000 unidades.'],
    [/\bmill(ón|ones)\b/, 'Millón', 'Mil millares: 1 000 000.'],
    [/\b(cifras?|dígitos?)\b/, 'Cifra', 'Cada uno de los signos 0, 1, 2… 9 con los que escribimos los números.'],
    [/\b(valor posicional|posicional)\b/, 'Valor posicional', 'Una cifra vale más o menos según el lugar que ocupa: el 4 de 400 vale más que el de 40.'],
    [/\banterior\b/, 'Anterior', 'El número que va justo antes: el anterior de 10 es 9.'],
    [/\bposterior\b/, 'Posterior', 'El número que va justo después: el posterior de 10 es 11.'],
    [/\bconsecutivos?\b|\bseguidos\b/, 'Números consecutivos', 'Números que van uno detrás de otro: 7, 8, 9.'],
    [/\b(aproxima|redondea|aproximadamente|decena más cercana)/, 'Aproximar', 'Cambiar un número por otro redondo que esté cerca. Mira la cifra de la derecha: si es 5 o más, sube.'],
    [/\bestim(a|ar|ación)\b/, 'Estimar', 'Calcular más o menos, con números redondos, sin hacer la cuenta exacta.'],
    [/\b(pares?|impares?)\b/, 'Par e impar', 'Un número par se puede repartir entre 2 sin que sobre nada (acaba en 0, 2, 4, 6 u 8). Si sobra 1, es impar.'],
    [/\bdoble\b/, 'Doble', 'Multiplicar por 2. El doble de 6 es 12.'],
    [/\bmitad\b/, 'Mitad', 'Dividir entre 2. La mitad de 12 es 6.'],
    [/\bserie\b/, 'Serie', 'Una lista de números o dibujos que siguen una regla, como ir de 2 en 2.'],
    [/\bromanos?\b/, 'Números romanos', 'I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Si uno pequeño va delante de uno mayor, resta: IV = 4.'],
    [/\b(enteros?|negativos?)\b/, 'Números enteros', 'Los números positivos, el 0 y los negativos (como −3, que es 3 por debajo de cero).'],
    // operations
    [/\bsuma(s|r|ndos?)?\b|\bsúmalos\b|\btotal\b/, 'Suma', 'Juntar cantidades. Los números que se suman son los sumandos y el resultado es la suma o total.'],
    [/\bresta(s|r)?\b|\bdiferencia\b/, 'Resta', 'Quitar una cantidad a otra. El resultado se llama diferencia.'],
    [/\bmultiplica(ción|ciones|r)?\b|\bproducto\b|\bfactor(es)?\b/, 'Multiplicación', 'Sumar varias veces el mismo número: 3 × 4 = 4 + 4 + 4. Los números son los factores y el resultado, el producto.'],
    [/\bdivid(e|ir|imos)|\bdivisi(ón|ones)\b|\brepart(e|ir|o|os)\b/, 'División', 'Repartir en partes iguales. Dividendo : divisor = cociente, y lo que sobra es el resto.'],
    [/\bcociente\b/, 'Cociente', 'El resultado de una división: cuántos le tocan a cada uno.'],
    [/\bresto\b|\bsobra(n)?\b|\d\s+r\s/, 'Resto', 'Lo que sobra al repartir. Siempre es más pequeño que el divisor.'],
    [/\bprueba de la división\b/, 'Prueba de la división', 'divisor × cociente + resto = dividendo. Si da el dividendo, la división está bien.'],
    [/\bprueba de la resta\b/, 'Prueba de la resta', 'diferencia + sustraendo = minuendo. Si da el número de arriba, la resta está bien.'],
    [/\btabla del\b/, 'Tabla de multiplicar', 'Los resultados de multiplicar un número por 1, 2, 3… 10.'],
    [/\boperaciones combinadas\b|\bparéntesis\b/, 'Operaciones combinadas', 'Primero lo que hay entre paréntesis, después multiplicaciones y divisiones, y al final sumas y restas.'],
    [/\bconmutativa\b/, 'Propiedad conmutativa', 'Cambiar el orden no cambia el resultado: 3 + 5 = 5 + 3.'],
    [/\basociativa\b/, 'Propiedad asociativa', 'Agrupar de otra forma no cambia el resultado: (2 + 3) + 4 = 2 + (3 + 4).'],
    [/\bdistributiva\b/, 'Propiedad distributiva', 'Multiplicar por una suma es multiplicar por cada sumando: 3 × (2 + 4) = 3 × 2 + 3 × 4.'],
    [/\bdescompon(er|iendo|e)|\bdescomposición\b/, 'Descomponer', 'Partir un número en trozos más fáciles: 47 = 40 + 7.'],
    [/\bmodelo rectangular\b/, 'Modelo rectangular', 'Dibujar la multiplicación como un rectángulo y partirlo en trozos fáciles de calcular.'],
    [/\bhechos? (conocidos?|derivados?)\b/, 'Hechos derivados', 'Usar una cuenta que ya sabes para deducir otra: si 6 × 5 = 30, entonces 12 × 5 = 60.'],
    // number theory
    [/\bnúmeros? cuadrados?\b/, 'Número cuadrado', 'El resultado de multiplicar un número por sí mismo: 5 × 5 = 25.'],
    [/\bmúltiplos?\b/, 'Múltiplo', 'Los resultados de la tabla de un número. 12 es múltiplo de 3 porque 3 × 4 = 12.'],
    [/\bdivisores?\b|\bdivisible\b/, 'Divisor', 'Un número que divide a otro sin que sobre nada. 3 es divisor de 12.'],
    [/\bprimos?\b/, 'Número primo', 'Un número que solo se puede dividir entre 1 y él mismo, como 7. El 1 no es primo.'],
    [/\bm\.c\.m\.|mínimo común múltiplo/, 'Mínimo común múltiplo', 'El múltiplo más pequeño que tienen en común dos números. m.c.m.(4, 6) = 12.'],
    [/\bm\.c\.d\.|máximo común divisor/, 'Máximo común divisor', 'El divisor más grande que tienen en común dos números. m.c.d.(12, 18) = 6.'],
    [/\bpotencias?\b|\bexponente\b/, 'Potencia', 'Una multiplicación de un número por sí mismo varias veces: 2³ = 2 × 2 × 2. El 2 es la base y el 3, el exponente.'],
    [/\braíz cuadrada\b|√/, 'Raíz cuadrada', 'El número que multiplicado por sí mismo da el número de dentro: √49 = 7.'],
    // fractions and decimals
    [/\bfracci(ón|ones)\b/, 'Fracción', 'Partes iguales de un todo. Abajo (denominador): en cuántas partes se divide. Arriba (numerador): cuántas cogemos.'],
    [/\bequivalentes?\b/, 'Fracciones equivalentes', 'Fracciones que valen lo mismo: 1/2 = 2/4. Se obtienen multiplicando arriba y abajo por el mismo número.'],
    [/\bnúmero mixto\b|\benteros y\b/, 'Número mixto', 'Un número entero y una fracción: 2 y 1/3.'],
    [/\bdecimal(es)?\b|,\d/, 'Número decimal', 'Un número con coma. A la izquierda de la coma, los enteros; a la derecha, décimas, centésimas…'],
    [/\bdécimas?\b/, 'Décima', 'Una de las 10 partes de una unidad: 0,1.'],
    [/\bcentésimas?\b/, 'Centésima', 'Una de las 100 partes de una unidad: 0,01.'],
    [/\bmilésimas?\b/, 'Milésima', 'Una de las 1000 partes de una unidad: 0,001.'],
    [/%|\bporcentajes?\b/, 'Porcentaje', 'Cuántos de cada 100. El 25 % de 80 es 25 de cada 100: 80 × 25 : 100 = 20.'],
    [/\bproporcional|\breducción a la unidad\b/, 'Proporcionalidad', 'Si una cantidad se multiplica por un número, la otra también. Calcula primero cuánto vale 1.'],
    [/\bescala\b/, 'Escala', 'Cuánto se ha reducido un mapa. 1 : 100 000 significa que 1 cm del mapa son 100 000 cm reales (1 km).'],
    // geometry
    [/\bángulos?\b/, 'Ángulo', 'La abertura entre dos líneas que salen del mismo punto. Agudo: menos de 90°; recto: 90°; obtuso: más de 90°; llano: 180°.'],
    [/\bequilátero\b/, 'Triángulo equilátero', 'Tiene los 3 lados iguales.'],
    [/\bisósceles\b/, 'Triángulo isósceles', 'Tiene 2 lados iguales.'],
    [/\bescaleno\b/, 'Triángulo escaleno', 'Tiene los 3 lados distintos.'],
    [/\bacutángulo|obtusángulo\b/, 'Triángulos según sus ángulos', 'Acutángulo: 3 ángulos agudos. Rectángulo: un ángulo recto. Obtusángulo: un ángulo obtuso.'],
    [/\bpolígonos?\b|\blados\b/, 'Polígono', 'Una figura plana cerrada con lados rectos. Se llama por su número de lados: triángulo (3), cuadrilátero (4), pentágono (5)…'],
    [/\bcuadriláteros?\b|\bparalelogramos?\b|\btrapecio\b|\bromboide\b/, 'Cuadriláteros', 'Polígonos de 4 lados. Paralelogramos: lados opuestos paralelos (cuadrado, rectángulo, rombo, romboide). Trapecio: solo dos lados paralelos.'],
    [/\bperímetro\b/, 'Perímetro', 'Lo que mide el borde de una figura: la suma de todos sus lados.'],
    [/\báreas?\b|cm²/, 'Área', 'Lo que ocupa una figura por dentro. Rectángulo: base × altura. Triángulo: base × altura : 2.'],
    [/\bradio\b/, 'Radio', 'El segmento que va del centro a la circunferencia.'],
    [/\bdiámetro\b/, 'Diámetro', 'El segmento que cruza la circunferencia pasando por el centro. Mide el doble que el radio.'],
    [/\bcircunferencia\b|\bcírculo\b/, 'Circunferencia y círculo', 'La circunferencia es la línea redonda; el círculo es la superficie de dentro. π vale unos 3,14.'],
    [/\bcuerpo(s)? geométricos?\b|\bpoliedro\b|\bcuerpo redondo\b/, 'Cuerpos geométricos', 'Figuras con volumen. Poliedros: todas sus caras planas (cubo, prisma, pirámide). Cuerpos redondos: tienen partes curvas (cilindro, cono, esfera).'],
    // measures, time and data
    [/\b(km|kilómetros?|metros?|cm|centímetros?|mm|kilos?|kg|gramos?|litros?|ml|mililitros?)\b/, 'Unidades de medida', 'Longitud: km, m, cm, mm. Masa: kg, g. Capacidad: l, ml. 1 km = 1000 m, 1 m = 100 cm, 1 kg = 1000 g, 1 l = 1000 ml.'],
    [/\b(horas?|minutos?|segundos?)\b|\breloj\b/, 'Medida del tiempo', '1 hora = 60 minutos; 1 minuto = 60 segundos. En el reloj, la aguja corta marca la hora y la larga, los minutos.'],
    [/\bmedia\b/, 'Media', 'Se suman todos los datos y se divide entre cuántos datos hay.'],
    [/\bmoda\b/, 'Moda', 'El dato que más se repite.'],
    [/\bprobab(le|ilidad)\b|\bseguro\b|\bimposible\b/, 'Probabilidad', 'Lo fácil que es que algo pase. Seguro: pasa siempre. Imposible: nunca. Probabilidad = casos favorables : casos posibles.'],
    [/\b€|\beuros?\b|\bcéntimos?\b/, 'Euros y céntimos', '1 euro = 100 céntimos. 2,50 € son 2 euros y 50 céntimos.'],
  ];
  // drawings say what they are: a fraction bar or a power become words
  const plain = (html) => (html.includes('class="frac"') ? ' fracción ' : '') + (html.includes('<sup>') ? ' potencia ' : '')
    + html.replace(/<[^>]*>/g, ' ').replace(/\{\{\d+\}\}/g, ' ').toLowerCase();
  S.concepts = (text, max) => {
    const t = plain(text || '');
    const out = [];
    for (const [re, term, def] of G) {
      if (re.test(t) && !out.some((x) => x[0] === term)) out.push([term, def]);
      if (out.length >= (max || 3)) break;
    }
    return out;
  };
})();
