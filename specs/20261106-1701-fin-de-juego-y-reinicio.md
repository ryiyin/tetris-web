# Spec 20261106-1701-fin-de-juego-y-reinicio (T11)

## Objetivo
Cuando la pieza nueva no cabe, el juego termina: se muestra "Fin del juego" con la indicación de la tecla para reiniciar, el puntaje/nivel/líneas finales siguen visibles y, al pulsar Enter, empieza una partida nueva (con el bucle de animación reanudado correctamente).

## Contexto del brain aplicado
- convenciones.md: lógica pura en `src/game/` sin DOM (función que recibe estado y devuelve estado nuevo; azar inyectado); UI en `src/ui/`, `main.ts`, `index.html`, `style.css`; nombres en inglés, comentarios y textos en español; pruebas en `tests/` con Vitest ("fin de juego" está en la lista de pruebas); `npm test` en verde al terminar.
- decisiones.md "Estado 'stopped'": ya existe el fin de juego mínimo (`status: 'stopped'`, `piece: null`, bucle detenido). Esta tarea lo completa, tal como esa decisión anunciaba.
- decisiones.md "Pausa (T10)": `'stopped'` sigue siendo final; el aviso es un nodo `role="status"` siempre en el DOM; el bucle solo se detiene con `stopped`.
- decisiones.md "Acciones de teclado": hoy hay 6 teclas con `preventDefault`; Espacio ignora `event.repeat`; Ctrl/Alt/Meta se ignoran.
- producto.md: "Fin de juego y reinicio" en el MVP. Récord (T12) y táctil (T13) quedan fuera.
- Sin contradicciones con el brain. Sin preguntas abiertas.

## Decisiones de diseño (registrar en brain/decisiones.md como "Fin de juego y reinicio (T11)")
1. **Status**: se MANTIENE `'stopped'` como fin de juego; NO se renombra ni se añade otro. Motivo: ya está registrado, usado por loop/actions/pruebas y renombrar toca muchas pruebas sin aportar comportamiento. Solo se actualiza el comentario de `GameStatus` en `game.ts` ("'stopped' = fin de juego") y se documenta en la decisión.
2. **Reinicio**: nueva función pura `restartGame(state, random)` en `src/game/actions.ts`. Si `state.status === 'stopped'` devuelve `createGame(random)` (estado nuevo: tablero vacío, bolsa nueva, score 0, lines 0, level 1, dropTimer 0, status 'playing'). En `'playing'` o `'paused'` devuelve el MISMO estado (misma referencia): reiniciar a mitad de partida queda fuera para evitar pérdidas accidentales. `actions.ts` importa `createGame` de `game.ts` (ya importa `lockPiece`; sin ciclo nuevo).
3. **Tecla**: `Enter` -> acción `'restart'` (`KeyAction` gana `'restart'`). NO se usa Espacio (es la caída dura y mantenerlo pulsado al perder reiniciaría sin querer). `restart` no es repetible: se ignora `event.repeat` (un Enter mantenido no reinicia varias veces). Ctrl/Alt/Meta + Enter se ignoran como siempre. `preventDefault` también en Enter: pasan a ser 7 teclas (corregir el comentario/decisión de "6 teclas"). Nota: cuando T13 añada botones, un Enter sobre un botón enfocado lo activaría; T13 deberá revisar el foco. Enter durante la partida no hace nada (la función devuelve el mismo estado).
4. **Otras teclas en fin de juego**: P, flechas y Espacio ya devuelven el mismo estado si `status !== 'playing'` (`togglePause` devuelve el mismo estado en `stopped`). No se cambia esa lógica; solo se añaden pruebas que lo fijan.
5. **Aviso en pantalla**: se generaliza `#pause` en un único nodo `#overlay` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`, siempre en el DOM y vacío cuando no hay aviso). Un solo nodo evita dos regiones en vivo superpuestas. Textos (función pura nueva `overlayText(status)` en `src/ui/overlay.ts`, sin DOM, probada):
   - `'paused'` -> `"Pausa\nP para continuar"`
   - `'stopped'` -> `"Fin del juego\nEnter para reiniciar"`
   - `'playing'` -> `""`
   `main.ts` escribe con `setText(overlayEl, overlayText(s.status))` (solo si cambió). CSS con `white-space: pre-line` para el salto de línea.
6. **Bucle**: `startLoop` lleva un indicador `running`. En `frame`: si `state.status !== 'stopped'` pide otro frame; si no, `running = false`. En `apply`: tras `state = action(state)`, si `!running && state.status !== 'stopped'` entonces `running = true; last = null; requestAnimationFrame(frame)`. Así: (a) no hay dos bucles (solo se arranca si estaba detenido, y al detenerse no queda frame pendiente); (b) `last = null` hace que el primer frame tenga delta 0 (sin salto); (c) el listener de teclado se registra una sola vez en `main.ts` y no se vuelve a registrar; (d) el bucle sigue sin importar el contenido de la acción (genérico). Se resuelve el hallazgo "una acción aplicada después de 'stopped' no se redibuja".
7. **HUD**: no cambia. Al terminar el último frame dibuja puntaje/nivel/líneas finales y el tablero con la última pieza; al reiniciar el primer frame de la partida nueva escribe 0/1/0 (por `setText`, solo si cambian).
8. **Táctil**: sin Enter en celular no hay forma de reiniciar hasta T13. Anotar en el backlog (descripción de T13): "incluir botón de reiniciar visible en fin de juego". Hasta entonces, recargar la página.

## Alcance
- Incluye: `restartGame`; tecla Enter; `overlayText` y nodo `#overlay` con "Fin del juego" y "Pausa" más indicación de tecla; reinicio del bucle; pruebas; decisión en brain; hallazgos menores: `text-align: center` en el aviso, que el velo no sobresalga del ancho del canvas, y `aria-live`.
- No incluye: récord en localStorage (T12); botones o gestos táctiles (T13/T14); reiniciar durante partida o pausa; pantalla de menú; animaciones; renombrar `'stopped'`.

## Criterios de aceptación
1. `restartGame` sobre un estado `'stopped'` con puntaje/líneas/nivel > 0 devuelve un estado `'playing'` con `score 0`, `lines 0`, `level 1`, `dropTimer 0`, tablero vacío, pieza no nula y bolsa nueva (según el azar inyectado).
2. `restartGame` en `'playing'` y en `'paused'` devuelve la misma referencia.
3. Si la pieza nueva no cabe (tablero lleno en la zona de aparición), `spawnNext`/`lockPiece` dan `status 'stopped'`, `piece null`, conservando `score`, `lines`, `level` y el tablero; en ese estado `shiftLeft`, `shiftRight`, `rotateCurrent`, `softDrop`, `hardDrop`, `togglePause` y `advance`/`tick` devuelven la misma referencia.
4. `keyToAction('Enter')` es `'restart'`; `attachKeyboard`: Enter llama a la acción y a `preventDefault`; con `repeat: true` no llama a la acción pero sí `preventDefault`; con Ctrl/Alt/Meta no hace nada. Las teclas anteriores siguen igual.
5. `overlayText` devuelve los tres textos de la decisión 5.
6. Bucle (prueba con `requestAnimationFrame` simulado): tras llegar a `stopped` no quedan frames pendientes; `apply(restart)` pide exactamente UN frame nuevo; `apply` de una acción que deja el estado en `stopped` o `apply` con el bucle en marcha NO pide frames extra; el primer frame tras el reinicio usa delta 0 aunque el timestamp sea muy posterior (la pieza no cae); tras reiniciar el bucle sigue corriendo frames.
7. Verificación manual en PC (`npm run dev`): (a) jugar hasta llenar el tablero: aparece "Fin del juego / Enter para reiniciar" sobre el tablero, que sigue visible, y Puntaje/Nivel/Líneas conservan los valores finales; (b) en ese estado flechas, Espacio y P no hacen nada; (c) Enter reinicia: tablero vacío, 0/1/0, pieza cae a ritmo normal y el aviso desaparece; (d) mantener Enter pulsado reinicia una sola vez; (e) Enter durante la partida y en pausa no hace nada; (f) perder dos veces seguidas y reiniciar funciona (sin bucles duplicados: la caída no se acelera tras reiniciar); (g) mantener Espacio al perder no reinicia.
8. Verificación manual con ventana estrecha / pantalla vertical (DevTools, p. ej. 360x640): el aviso queda centrado, con el texto centrado y sin desbordar; el velo cubre exactamente el canvas (no sobresale por los lados ni cubre el HUD). "Pausa / P para continuar" se ve igual.
9. `npm test` y `npm run build` en verde.

## Tareas
1. `game.ts`: actualizar comentario de `GameStatus` ('stopped' = fin de juego). Sin cambio de lógica.
2. `actions.ts`: añadir `restartGame(state, random)` (decisión 2). Prueba en `tests/actions.test.ts`.
3. Pruebas de fin de juego en `tests/game.test.ts` y `tests/actions.test.ts` (criterio 3), con un tablero lleno construido a mano y azar fijo.
4. `keyboard.ts`: `'restart'` en `KeyAction`, caso `'Enter'` en `keyToAction`; no está en `REPEATABLE`. Pruebas en `tests/keyboard.test.ts` (criterio 4).
5. `src/ui/overlay.ts` con `overlayText(status)` y `tests/overlay.test.ts`.
6. `loop.ts`: indicador `running`, reinicio del bucle en `apply` (decisión 6). Nuevo `tests/loop.test.ts` con `vi.stubGlobal('requestAnimationFrame', ...)` que guarda el callback y lo ejecuta a mano (entorno node, sin jsdom); restaurar con `vi.unstubAllGlobals()`.
7. `index.html`: envolver canvas y aviso en `<div id="board">` y cambiar `<div id="pause" role="status">` por `<div id="overlay" role="status" aria-live="polite" aria-atomic="true"></div>` dentro de `#board`.
8. `style.css`: `#board { position: relative; align-self: center; }` (se ajusta al ancho real del canvas); `#overlay` con `position: absolute; inset: 0; box-sizing: border-box; padding: 0.5rem; display: flex; justify-content: center; align-items: center; text-align: center; white-space: pre-line; overflow-wrap: anywhere; ...` (conservar fondo, color, tamaño de fuente, `pointer-events: none`) y `#overlay:empty { background: none }`. Retirar `#pause` y el uso de `top: var(--hud-height)` para el aviso.
9. `main.ts`: obtener `#overlay` (mensaje de error actualizado), `setText(overlayEl, overlayText(s.status))`, caso `'restart'` -> `loop.apply((s) => restartGame(s, Math.random))`.
10. `brain/decisiones.md`: añadir "Fin de juego y reinicio (T11)" con las decisiones 1 a 8, y corregir "6 teclas" a 7 y `#pause` a `#overlay` en las decisiones de Pausa/Acciones (nota de reemplazo). `fabrica/backlog.md`: añadir a T13 el botón de reinicio.
11. Ejecutar `npm test`, `npm run build` y la verificación manual (criterios 7 y 8).

## Pruebas requeridas
`npm test` (Vitest): `tests/actions.test.ts` (restartGame y acciones inertes en fin de juego), `tests/game.test.ts` (detección de fin conservando puntaje), `tests/keyboard.test.ts` (Enter, repeat, modificadores), `tests/overlay.test.ts`, `tests/loop.test.ts` (reinicio del bucle sin duplicados y sin delta grande). Más `npm run build` (tsc estricto) y la verificación manual de los criterios 7 y 8.

## Riesgo
medio: lógica nueva y cambios en varios archivos (loop, teclado, HTML, CSS, main), sin datos persistentes, dependencias nuevas ni cambios de modelo. El punto delicado es el bucle (bucles duplicados o delta grande), cubierto con pruebas.
