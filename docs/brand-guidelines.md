# Stud_IA · Guía de marca

## Resumen

| | |
|---|---|
| Nombre | **Stud_IA** (siempre con guion bajo y "IA" en mayúsculas) |
| Lema | *Aprende jugando, planeta a planeta.* |
| Público | Niños de Infantil 3 a 6.º de Primaria, y sus familias |
| Personalidad | Juguetona, valiente y clara: un juguete espacial que enseña |
| Tokens | Variables CSS en `css/style.css` (`:root`, bloque "Stud_IA brand") |
| Código del logo | `js/brand.js` (`S.brand.mark()`, `S.brand.wordmark()`, `S.brand.logo()`) |

## Concepto

Una **galaxia de juguete**: plástico brillante y grueso flotando en una nebulosa morada. Cada asignatura es una galaxia, cada tema un planeta y cada examen un agujero negro.

La firma de la marca es el **guion bajo**:
- es un **cursor que parpadea**, guiño a la "IA";
- es la **pista de despegue** desde la que sale el cohete del logo.

## Logo

- **Símbolo:** un planeta rosa chicle con degradado a violeta, con un anillo amarillo-menta y un cohete en órbita.
- **Logotipo:** "Stud" en blanco con relieve 3D morado, "_" como barra amarilla luminosa que parpadea, e "IA" con un degradado holográfico que se desplaza.
- **Versiones:**
  - `logo('hero')` en la pantalla de bienvenida y en "¿Quién juega?";
  - `logo('small')` como firma al pie del inicio;
  - `mark()` solo en la cabecera, donde sirve de botón de inicio, y en el icono de la pestaña.
- **No hacer:** escribir "StudIA", "Studia" o "STUD_IA"; poner el logo sobre fondos claros sin su halo; animar el logo además de la intro en la misma pantalla.

## Color

| Nombre | Hex | Uso |
|---|---|---|
| Nebulosa | `#1B0F4A` | Fondo |
| Tinta | `#24164F` | Contornos y texto sobre claro |
| Chicle | `#FF4F8B` | Símbolo, acentos |
| Violeta | `#6D2FD6` / `#8B5CF6` | Profundidad, botones secundarios |
| Limón | `#FFD23F` | Botón principal, cursor "_", estrellas |
| Menta | `#2ED9A3` | Acierto |
| Cielo | `#3EC1FF` | Información, respuestas mostradas |

**Holo:** degradado limón → chicle → violeta → cielo → menta. Se usa solo en "IA".

## Tipografía

- **Lilita One** para títulos, números grandes y el logotipo: gruesa y redondeada, como una etiqueta de juguete.
- **Nunito**, de 600 a 900, para leer.
- Los títulos llevan relieve 3D: sombras apiladas en violetas decrecientes.

## Movimiento

- **Una sola intro** por visita (1,9 s y se puede saltar): el planeta aterriza, la palabra se escribe letra a letra y aparece el lema.
- **Siempre presente, pero lento:** el cohete orbita (6 s por vuelta), el cursor parpadea, "IA" brilla y la nebulosa se mueve (40 s).
- **Como respuesta a una acción:** un salto al despegar, cartas que se inclinan, una transición entre pantallas y personajes que reaccionan.
- Con "reducir movimiento" activado no hay intro ni animaciones decorativas.

## Voz

- Habla de tú, en frases cortas y con verbos claros: "Elige tu personaje", "Aprueba el examen para abrirlo".
- Celebra el esfuerzo sin exagerar: "¡Conseguido!", "¡Casi! Prueba otra vez."
- Los errores dicen qué hacer, sin culpas: "🔒 Primero completa Cascada Cero."
- Pocos emojis y siempre con significado: 🔒 cerrado, ⭐ estrellas, 💎 cristales, 📝 examen.

## Tema océano (Inglés)

Inglés no ocurre en el espacio: **un submarino viaja de isla en isla**. Mismos juguetes de plástico brillante, ahora bajo el agua.

| Espacio (por defecto) | Océano (Inglés) |
|---|---|
| Galaxia | Océano |
| Nivel o trimestre | Mar: *Shallow Sea*, *Coral Sea*, *Deep Blue*, *The Abyss* |
| Planeta con cara | Isla de arena con palmera, colina del color del tema y la misma cara |
| Agujero negro (examen) | Barco hundido que se balancea en el fondo |
| Ovni cruzando el mapa | Ballena 🐳 cruzando el mapa |
| Estrellas y nebulosa | Rayos de luz y burbujas subiendo, fondo azul profundo |
| Cohete que salta meteoritos | Submarino amarillo con el personaje en el ojo de buey: sube al tocar, baja solo, esquiva medusas y minas y recoge perlas |

- **Color:** azules del mar (`#0C5C8F` → `#061C45`) y arena (`#FFE9B0`). El limón, el chicle y la tinta de la marca se mantienen para botones, estrellas y contornos.
- **Palabras:** "isla/islas" en lugar de "planeta/planetas" en avisos, examen y progreso. Los nombres de mares e islas van en inglés ("Colour Island"); las instrucciones siguen en español.
- **Voz:** las palabras en inglés suenan con voz británica (o la inglesa que haya), un poco más despacio, y suenan aunque el sonido esté apagado: son la lección. Nunca se usa el micrófono.

### Cómo se añade otro tema

Los temas viven en `S.themes` (`js/core.js`). Una asignatura elige el suyo con `theme: 'ocean'`; sin `theme` usa `space`. Cada tema define cómo se dibujan las islas o planetas (`node`), el examen (`boss`), el examen por defecto, las palabras (`words`), la decoración del mapa (`deco`), el modo del minijuego (`runner`: `jump` o `swim`) y el fondo (`backdrop`). Los estilos propios van en `css/style.css` bajo `body[data-theme="…"]`.
