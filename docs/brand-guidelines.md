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
