# Spec 20261106-1653-pausa-con-tecla-p (T10: Pausa con tecla P)

## Objetivo
La tecla P (mayúscula o minúscula) pausa y reanuda la partida, y mientras está en pausa se ve el aviso "Pausa" sobre el tablero. En pausa no se mueve ni cae nada, y al reanudar no hay caída brusca.

## Contexto del brain aplicado
- producto.md: P = pausa en PC. El botón táctil de pausa es T13 (fuera de aquí). Diseño vertical de celular.
- convenciones.md: lógica pura en `src/game/` sin DOM (estado como datos, función recibe estado y devuelve el nuevo); interfaz en `src/ui/`; nombres en inglés, comentarios y textos en español; pruebas Vitest de "pausa" en `tests/` (un archivo por módulo); sin dependencias nuevas; termina con `npm test` en verde.
- decisiones.md:
  - "Estado 'stopped'": el bucle deja de pedir frames con `stopped`. La pausa NO debe reutilizar `stopped` (T11 lo usa como fin de juego).
  - "Acciones de teclado": las acciones devuelven el MISMO estado si el juego no está en `'playing'`; `preventDefault` solo en teclas del juego; Ctrl/Alt/Meta se ignoran (ya implementado).
  - "Bolsa de 7 y tiempo inyectados": el reloj real solo se usa en `loop.ts`.
  - Panel `#hud` con `role="status"` (T09).
- No hay contradicciones con el brain. Sin preguntas abiertas.

## Diseño (decisiones a registrar en brain/decisiones.md)
1. Modelo de estado: `GameStatus = 'playing' | 'paused' | 'stopped'`. `'paused'` es reanudable; `'stopped'` es final.
2. `togglePause(state): GameState` en `src/game/actions.ts` (es una acción del jugador): `playing -> paused`, `paused -> playing`, `stopped -> mismo estado (misma referencia)`. Solo cambia `status`; conserva `dropTimer`, pieza, tablero y puntaje. No se toca `advance` ni las demás acciones: ya devuelven el mismo estado si `status !== 'playing'` (`advance`, `tick`, `isActive`), lo que cubre `'paused'` sin cambios. Las pruebas lo garantizan.
3. Bucle (`src/ui/loop.ts`): sigue pidiendo frames mientras `status !== 'stopped'` (antes: solo `playing`). En pausa cada frame redibuja (barato) y actualiza `last = ts`, así el delta del primer frame tras reanudar es de ~1 frame y la pausa no cuenta como tiempo transcurrido. `advance` ignora el delta en `paused`. Se conserva el tope `MAX_DELTA_MS`. El hallazgo "acción tras `stopped` no se redibuja" sigue siendo de T11 y no se resuelve aquí.
4. Teclado (`src/ui/keyboard.ts`): `KeyAction` gana `'pause'`; `keyToAction('p' | 'P')` devuelve `'pause'`. No está en `REPEATABLE`, así que `event.repeat` se ignora (mantener P pulsada no parpadea). Se llama `preventDefault` para P (como el resto de teclas del juego, pero con repeat ignorado igual). Ctrl/Alt/Meta siguen ignorándose antes (p. ej. Ctrl+P imprimir queda al navegador). Se usa `event.key`.
5. Aviso: elemento HTML, no canvas, para texto accesible y nítido en cualquier escala. En `index.html` dentro de `#app`: `<div id="pause" role="status">` vacío (siempre en el DOM). `main.ts` escribe `textContent = 'Pausa'` si `status === 'paused'` y `''` si no, solo cuando cambia (mismo patrón que `setText`). Un `role="status"` con texto que cambia se anuncia una vez y de forma educada (polite); no se usa `hidden` porque mostrar/ocultar un nodo se anuncia peor. CSS: `#app { position: relative }`; `#pause` absoluto con `top: var(--hud-height); left: 0; right: 0; bottom: 0`, flex centrado, fondo `rgba(0, 0, 0, 0.7)`, texto `#fff`, tamaño `clamp(1.5rem, 8vw, 2.5rem)`, `font-weight: bold`, `pointer-events: none`, y `#pause:empty { display: none }`. Cubre exactamente el área del canvas, así funciona en pantalla vertical. En pausa el tablero queda visible bajo el velo atenuado (se oculta lo justo; no es un truco anti-trampa, fuera de alcance).
6. `main.ts`: caso `'pause'` -> `loop.apply(togglePause)`; en `onFrame` actualizar el aviso.

## Alcance
- Incluye: status `'paused'`, `togglePause`, tecla P, bucle que sigue vivo en pausa, aviso "Pausa" (HTML+CSS), pruebas, registro en decisiones.md.
- No incluye: fin de juego/reinicio y redibujo tras `stopped` (T11), récord (T12), botón táctil/gestos de pausa (T13), pausa automática al perder foco de la pestaña, sonidos, ocultar el tablero en pausa.

## Criterios de aceptación
1. `togglePause` alterna `playing -> paused -> playing`; en `stopped` devuelve la misma referencia.
2. `togglePause` solo cambia `status`: tablero, pieza, bolsa, `dropTimer`, puntaje, líneas y nivel idénticos tras pausar y reanudar.
3. En `paused`, `advance` (con cualquier delta, incluso enorme), `tick`, `shiftLeft`, `shiftRight`, `rotateCurrent`, `softDrop` y `hardDrop` devuelven el mismo estado (misma referencia).
4. Tras reanudar, `advance` con delta pequeño no hace caer la pieza ni la bloquea (no hay caída acumulada por el tiempo en pausa).
5. `keyToAction('p')` y `keyToAction('P')` devuelven `'pause'`; `attachKeyboard` llama `onAction('pause')` y `preventDefault` con P.
6. Con `repeat: true`, P no llama a `onAction`; con Ctrl, Alt o Meta activo, P se ignora sin `preventDefault`.
7. Manual (PC, `npm run dev`): al pulsar P aparece "Pausa" centrado sobre el tablero y la pieza deja de caer; las flechas y espacio no hacen nada; al pulsar P de nuevo desaparece y la pieza sigue sin salto brusco (tras 30 s de pausa no cae de golpe); mantener P pulsada no parpadea; Ctrl+P abre imprimir del navegador. El aviso se ve completo en viewport vertical estrecho (p. ej. 375x667 en herramientas del navegador) y el texto tiene contraste alto.
8. Manual: tras fin de juego (`stopped`) P no hace nada ni muestra "Pausa".
9. `npm test` y `npm run build` en verde.

## Tareas
1. `game.ts`: ampliar `GameStatus` con `'paused'` y actualizar el comentario (`stopped` = fin; `paused` = pausa reanudable). Comprobar con `tsc` que ningún `switch`/comparación queda roto.
2. `actions.ts`: añadir `togglePause`. Prueba por separado en `tests/actions.test.ts` (criterios 1-4).
3. `keyboard.ts`: añadir `'pause'` y mapeo de `p`/`P`. Pruebas en `tests/keyboard.test.ts` (criterios 5-6, usando el objetivo falso existente).
4. `loop.ts`: seguir pidiendo frames mientras `status !== 'stopped'`; comentario sobre por qué (la pausa debe redibujar y mantener `last` al día).
5. `index.html` + `style.css`: añadir `#pause` y estilos (diseño punto 5).
6. `main.ts`: obtener `#pause` (lanzar error si falta, como los demás), caso `'pause'` y actualización del aviso en `onFrame`.
7. Verificación manual (criterios 7-8) y registrar en `brain/decisiones.md` una entrada "Pausa (T10)" con los puntos 1-5 del diseño. Actualizar la nota de la decisión "Estado 'stopped'" si procede (la pausa usa `paused`, no `stopped`).

## Pruebas requeridas
- `npm test` (Vitest): nuevas pruebas en `tests/actions.test.ts` (togglePause, inmutabilidad ante acciones en pausa, reanudación sin caída; usar `createGame` con `random` determinista como en las pruebas existentes) y `tests/keyboard.test.ts` (P/p, repeat, modificadores).
- `npm run build` (tsc estricto) sin errores.
- Verificación manual de interfaz según criterio 7 en PC y, si es posible, vista de celular vertical (sin botón táctil: solo se comprueba que el aviso encaja).

## Riesgo
medio: lógica nueva en varios archivos (game, actions, keyboard, loop, main, html, css) y cambio del contrato del bucle, pero sin datos persistentes, dependencias ni dinero. El punto delicado es el bucle: debe seguir vivo en `paused` y terminar en `stopped`.
