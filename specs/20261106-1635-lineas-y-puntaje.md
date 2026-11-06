# Spec 20261106-1635-lineas-y-puntaje (T08: Líneas y puntaje)

## Objetivo
Al bloquear una pieza se detectan y borran de 1 a 4 líneas completas, se suma puntaje (100/300/500/800 por 1/2/3/4 líneas, multiplicado por el nivel) y la caída suave da 1 punto por celda. El puntaje y las líneas se muestran en pantalla, en español.

## Contexto del brain aplicado
- convenciones.md: lógica pura en `src/game/` sin DOM; el estado son datos y las funciones devuelven estado nuevo; pruebas en `tests/` (un archivo por módulo de `src/game/`); UI en `src/ui/` y `main.ts`; nombres en inglés, comentarios y textos de interfaz en español; `npm test` en verde; sin dependencias nuevas.
- decisiones.md: "Aparición, bloqueo inmediato y gravedad fija" (bloqueo al instante cuando `moveDown` devuelve la misma referencia); "Acciones de teclado" (softDrop = un tick, hardDrop = bajar + bloquear + `spawnNext`, devuelven el MISMO estado si no hay cambio, "no dan puntaje hasta T08"); "Modelo de datos del tablero" (Board inmutable, 20x10, `null` = vacía); "Bolsa de 7 y tiempo inyectados" (azar inyectado).
- producto.md: líneas y puntaje dentro del MVP; niveles, pausa, fin de juego y récord son tareas posteriores.
- Sin contradicciones con el brain.

## Decisiones de diseño (se registran en brain/decisiones.md)
1. Punto único de bloqueo: nueva función `lockPiece(state, piece, random)` en `src/game/game.ts`. Hace: `placePiece` -> `clearLines` -> suma `lines` y `score` -> `spawnNext`. La usan `tick` (que ya bloquea al no poder bajar), `softDrop` (vía `tick`) y `hardDrop`. Así el borrado vive en un solo lugar.
2. Módulo nuevo `src/game/scoring.ts` (puro):
   - `LINE_POINTS = [0, 100, 300, 500, 800]` (índice = líneas borradas).
   - `SOFT_DROP_POINTS_PER_CELL = 1`.
   - `clearLines(board): { board: Board; cleared: number }`: quita las filas sin `null`, añade filas vacías arriba, conserva el orden del resto. Si no hay líneas devuelve la MISMA referencia del tablero y `cleared: 0`.
   - `lineScore(cleared, level): number` = `LINE_POINTS[cleared] * level` (0 si cleared es 0).
3. Estado nuevo en `GameState`: `score: number`, `lines: number` y `level: number`. `createGame` los inicia en 0, 0 y `INITIAL_LEVEL`. `INITIAL_LEVEL = 1` en `constants.ts`, comentado: "T09 hará que el nivel suba cada 10 líneas; hasta entonces es fijo". `lockPiece` y la caída suave usan `state.level` como multiplicador, de modo que T09 solo tenga que actualizar `level`.
4. Caída suave: 1 punto por cada celda que la pieza baja por acción del jugador. `softDrop` mueve con `moveDown`: si baja, suma `SOFT_DROP_POINTS_PER_CELL` (sin multiplicar por nivel) y pone `dropTimer` en 0; si no puede bajar, bloquea con `lockPiece` y no suma puntos de caída. La caída automática (`tick` desde `advance`) NO puntúa.
5. Caída dura: NO puntúa por celdas (solo suma las líneas que borre al bloquear). Motivo: la tarea original solo menciona la caída suave y es lo más simple. Registrar en decisiones.md.
6. Pantalla: panel HTML junto al canvas (no dibujado en el canvas), con etiquetas en español "Puntaje" y "Líneas", actualizado en cada frame desde `onFrame` en `main.ts`. En pantalla vertical el panel va ARRIBA del canvas en una fila (puntaje a la izquierda, líneas a la derecha, mismo ancho que el canvas); sin lógica de nivel visible (se muestra en T09). Así no se toca el canvas de 300x600 ni `render.ts`.

## Alcance
- Incluye: `scoring.ts`, campos `score`/`lines`/`level` en el estado, `lockPiece` compartido, puntaje de caída suave, panel HTML y CSS, hallazgo menor de `keyboard.ts` (ignorar Ctrl/Alt/Meta), pruebas, registro en decisiones.md (incluida la actualización de la frase "no dan puntaje hasta T08" de la decisión de acciones de teclado).
- No incluye: niveles y velocidad (T09), mostrar el nivel, pausa (T10), fin de juego/reinicio (T11), récord (T12), animación o sonido de borrado, puntaje por caída dura, botones táctiles.

## Criterios de aceptación
1. `clearLines` con una fila llena la borra, las filas de arriba bajan una posición y aparece una fila vacía arriba; `cleared` = 1.
2. `clearLines` con 2, 3 y 4 filas llenas (contiguas y no contiguas) devuelve `cleared` correcto y el resto de filas en el mismo orden relativo; el tablero resultante sigue siendo 20x10.
3. `clearLines` sin filas llenas devuelve la misma referencia del tablero y `cleared: 0`; no muta el tablero de entrada.
4. `lineScore(1..4, 1)` = 100/300/500/800; `lineScore(n, 3)` = 3 veces eso; `lineScore(0, n)` = 0.
5. `createGame` devuelve `score: 0`, `lines: 0`, `level: 1`.
6. Con un tablero casi lleno y una pieza que completa una línea, `tick` bloquea, borra la línea, `lines` = 1, `score` = 100 y aparece la pieza siguiente. Con una pieza I vertical que completa 4 filas: `lines` = 4, `score` = 800.
7. `hardDrop` que completa líneas suma `lineScore` y NO suma puntos por las celdas recorridas; sin líneas, `score` no cambia.
8. `softDrop` cuando la pieza baja una celda: `score` +1, `dropTimer` = 0. Cuando no puede bajar y bloquea: no suma 1 y, si completa líneas, suma `lineScore`.
9. `tick` que solo baja la pieza (caída automática) no cambia `score`.
10. `score` y `lines` se acumulan entre bloqueos sucesivos; `softDrop`/`hardDrop` con estado distinto de `'playing'` o sin pieza devuelven la misma referencia (sin cambios de comportamiento previo).
11. `keyboard.ts`: un `keydown` con `ctrlKey`, `altKey` o `metaKey` activo no llama a `onAction` ni a `preventDefault`, aunque la tecla sea una flecha (p. ej. Alt+Flecha izquierda). Sin modificadores el comportamiento actual no cambia.
12. Manual en PC (`npm run dev`): se ve "Puntaje" y "Líneas" sobre el tablero, ambos en 0 al iniciar; bajar con flecha abajo suma 1 por celda; completar una línea la borra y suma 100 y +1 línea; caída dura no suma por celda; Alt+Flecha izquierda del navegador vuelve a funcionar. En ancho de celular (~375 px, modo responsive de DevTools) el panel y el canvas caben sin desbordar ni cortarse.
13. `npm test` y `npm run build` en verde.

## Tareas
1. `constants.ts`: añadir `INITIAL_LEVEL = 1` con comentario sobre T09.
2. Crear `src/game/scoring.ts` con `LINE_POINTS`, `SOFT_DROP_POINTS_PER_CELL`, `clearLines`, `lineScore`. Crear `tests/scoring.test.ts` (criterios 1 a 4).
3. `game.ts`: añadir `score`, `lines`, `level` a `GameState` y `createGame`; crear y exportar `lockPiece`; hacer que `tick` la use. Actualizar `tests/game.test.ts` (criterios 5, 6, 9) y arreglar los estados construidos a mano en pruebas existentes si el tipo lo exige.
4. `actions.ts`: `hardDrop` usa `lockPiece` (con `dropTimer: 0`); `softDrop` mueve con `moveDown`, suma 1 punto si baja y delega en `lockPiece` si no puede bajar. Actualizar `tests/actions.test.ts` (criterios 7, 8, 10).
5. `keyboard.ts`: salir al inicio del manejador si `event.ctrlKey || event.altKey || event.metaKey`, antes de `keyToAction`. Probar (criterio 11) extrayendo el manejador a una función exportable o usando un `target` falso con `addEventListener` que capture el callback; el archivo de prueba va en `tests/keyboard.test.ts` (excepción justificada: es lógica de entrada sin DOM real; no necesita jsdom).
6. `index.html`: panel con `<div id="hud">` con dos bloques (`Puntaje` -> `<span id="score">0</span>`, `Líneas` -> `<span id="lines">0</span>`), agrupado con el canvas en un contenedor. `style.css`: columna centrada, panel en fila con el ancho del canvas, tipografía legible, y ajustar el `max-height` del canvas para que quepa el panel (p. ej. `calc(100dvh - alto del panel)`).
7. `main.ts`: obtener los spans (error claro si faltan, como con el canvas) y actualizarlos en `onFrame` con `textContent`. Para que se actualicen tras una acción del jugador basta con el siguiente frame (ya es el contrato del bucle).
8. Registrar en `brain/decisiones.md` una entrada fechada 2026-11-06 con: fórmula de puntaje (`LINE_POINTS * level`; 1 punto por celda en caída suave sin multiplicar; caída automática y caída dura sin puntos por celda), punto único de bloqueo `lockPiece`, campo `level` fijo en 1 hasta T09, panel HTML sobre el canvas para puntaje y líneas, y la corrección de la frase "no dan puntaje hasta T08". Mencionar el ajuste de teclado con modificadores.
9. Marcar T08 en el backlog según el flujo de la fábrica; correr `npm test` y `npm run build`.

## Pruebas requeridas
- `npm test` (Vitest): `tests/scoring.test.ts` (nuevo), `tests/game.test.ts`, `tests/actions.test.ts`, `tests/keyboard.test.ts` (nuevo) cubren los criterios 1 a 11. Usar tableros armados a mano (filas llenas salvo una columna) y `Random` determinista.
- `npm run build` (tsc estricto) en verde.
- Manual según criterio 12 (PC y ancho de celular en DevTools; en celular real basta mirar la maqueta, los controles táctiles llegan en T13).

## Riesgo
medio: lógica nueva y cambios en varios archivos (game, actions, UI, HTML, CSS), pero sin datos persistentes, dinero ni dependencias nuevas. Punto delicado: que `softDrop` y `hardDrop` mantengan los contratos previos (misma referencia si no hay cambio, `dropTimer` en 0).
