# Spec 20261106-1645-niveles-y-velocidad (T09)

## Objetivo
El nivel sube cada 10 líneas borradas y la caída por gravedad se acelera con el nivel. El panel muestra Nivel, Puntaje y Líneas.

## Contexto del brain aplicado
- producto.md: niveles, sube cada 10 líneas.
- convenciones.md: lógica pura en `src/game/` sin DOM (estado como datos, el tiempo entra como `deltaMs`); pruebas en `tests/` (un archivo por módulo de `src/game/`); interfaz en `index.html`, `src/style.css` y `src/main.ts`; nombres en inglés, comentarios y textos de interfaz en español; `npm test` en verde.
- decisiones.md: "Aparición, bloqueo inmediato y gravedad fija" (GRAVITY_MS fijo hasta T09) y "Líneas y puntaje (T08)" (`lockPiece` es el único punto de bloqueo; `level` solo había que actualizarlo; el nivel no se muestra hasta T09). Esta tarea cumple esas dos promesas. No hay contradicción.

## Decisiones de diseño (a registrar en brain/decisiones.md)
- Fórmula del nivel: `level = INITIAL_LEVEL + floor(lines / LINES_PER_LEVEL)` con `LINES_PER_LEVEL = 10` (0-9 líneas = nivel 1, 10-19 = nivel 2...). Se calcula con las líneas TOTALES, así que borrar varias líneas de golpe puede saltar más de un nivel si cruza varios múltiplos (no ocurre con máx. 4 líneas, pero la fórmula lo soporta).
- Dónde se recalcula: solo en `lockPiece`, justo después de sumar `lines`. El puntaje de ESA jugada usa el nivel ANTERIOR al bloqueo (el que tenía el jugador al borrar); el nivel nuevo aplica desde la siguiente pieza. Es la convención clásica y mantiene `lineScore(cleared, state.level)` sin cambios.
- Curva de velocidad: `gravityMs(level) = max(MIN_GRAVITY_MS, GRAVITY_MS - (level - 1) * GRAVITY_STEP_MS)` con `GRAVITY_MS = 1000` (se conserva como intervalo del nivel 1, así los tests actuales siguen válidos), `GRAVITY_STEP_MS = 80`, `MIN_GRAVITY_MS = 100`. Valores: nivel 1 = 1000, 2 = 920, 5 = 680, 10 = 280, 11 = 200, 12 = 120, 13 en adelante = 100 ms (10 caídas/s, aún jugable). Sin tope de nivel.
- Separador de miles: NO se incluye (depende de la configuración regional y no aporta a esta tarea). Queda descartado.

## Alcance
- Incluye:
  - Constantes nuevas en `src/game/constants.ts`: `LINES_PER_LEVEL`, `GRAVITY_STEP_MS`, `MIN_GRAVITY_MS`; actualizar los comentarios de `GRAVITY_MS` e `INITIAL_LEVEL` (ya no "fijos hasta T09").
  - Nuevo `src/game/levels.ts` con `levelForLines(lines: number): number` y `gravityMs(level: number): number` (puras).
  - `game.ts`: `lockPiece` actualiza `level` con `levelForLines(nuevasLíneas)`; `advance` usa `gravityMs(current.level)` en cada iteración del bucle (en lugar de `GRAVITY_MS`); actualizar el comentario de `level` en `GameState`.
  - `index.html`: añadir `<div class="stat">Nivel <span id="level">1</span></div>` al `#hud` (orden: Puntaje, Nivel, Líneas) y `role="status"` en `#hud`.
  - `src/style.css`: que los tres elementos quepan sin desbordar (ver criterios).
  - `src/main.ts`: obtener `#level`, validarlo en el mismo `throw` existente (mensaje actualizado) y escribir `s.level` en `onFrame`.
  - Pruebas nuevas y actualizadas.
  - Registrar en `brain/decisiones.md` una entrada "Niveles y velocidad (T09)" con la fórmula, la curva y el momento de recálculo, y anotar que reemplaza lo de "gravedad fija" de la decisión de aparición y lo de "el nivel no se muestra hasta T09".
- No incluye: pausa (T10), fin de juego/reinicio (T11), récord (T12), separador de miles, tabla de niveles por pieza, lock delay, cambios en `render.ts`, `actions.ts` ni `scoring.ts`.

## Criterios de aceptación
1. `levelForLines(0)=1`, `(9)=1`, `(10)=2`, `(19)=2`, `(20)=3`, `(99)=10`, `(100)=11`.
2. `gravityMs(1)=1000`, `(2)=920`, `(10)=280`, `(12)=120`, `(13)=100`, `(50)=100`; es no creciente al subir de nivel y nunca baja de `MIN_GRAVITY_MS`.
3. Al bloquear una pieza que lleva `lines` de 9 a 10 (borrando 1 línea), el estado resultante tiene `level = 2` y `lines = 10`; con `lines` 8 -> 10 (2 líneas) también `level = 2`; sin borrar líneas el nivel no cambia.
4. El puntaje de la jugada que cruza de nivel usa el nivel previo (ej. 1 línea a nivel 1 con lines=9 suma 100, no 200); la siguiente jugada con líneas usa nivel 2 (1 línea = 200).
5. `advance` con `level = 2`: con `deltaMs = 919` no baja la pieza; con `920` baja 1 fila y `dropTimer` queda en 0; con `level = 1` sigue valiendo 1000 (pruebas actuales de `game.test.ts` pasan sin cambios).
6. `advance` con nivel alto (ej. 13) y `deltaMs = 300` baja 3 filas.
7. Manual (PC): al jugar y llegar a 10 líneas, el panel muestra "Nivel 2" y la pieza cae visiblemente más rápido.
8. Manual (celular vertical, ancho ~320-360 px y también ~280 px en el DevTools): el panel con Puntaje, Nivel y Líneas (incluso con valores como Puntaje 123456, Nivel 15, Líneas 140) cabe en una sola fila de altura 3rem, no desborda horizontalmente ni se superpone, y el canvas conserva el mismo ancho que el panel. Propuesta de CSS: cada `.stat` en columna (etiqueta pequeña ~0.75rem arriba, valor en negrita abajo) con `text-align: center`, `white-space: nowrap`, `min-width: 0`; `#hud` con `justify-content: space-between` y `gap` pequeño. Se mantiene `--hud-height: 3rem` y `font-variant-numeric: tabular-nums`.
9. `#hud` tiene `role="status"`. Si el lector de pantalla resulta demasiado ruidoso por actualizarse cada frame, solo se escribe `textContent` cuando el valor cambia (opcional, ver tareas).
10. `npm test` y `npm run build` en verde.

## Tareas
1. Constantes nuevas y comentarios en `constants.ts`. Probar: `tests/constants.test.ts` (valores).
2. Crear `src/game/levels.ts` (`levelForLines`, `gravityMs`) con comentarios en español. Probar: `tests/levels.test.ts` (criterios 1 y 2).
3. `lockPiece`: calcular `lines` nuevas, `score` con `state.level` (previo) y `level: levelForLines(lines)`. Probar en `tests/game.test.ts` (criterios 3 y 4, armando un tablero con una fila casi completa y `lines: 9`; ver cómo lo hace `almostFull()` ya existente).
4. `advance`: reemplazar `GRAVITY_MS` por `gravityMs(current.level)` dentro del bucle, restando ese mismo intervalo. Probar (criterios 5 y 6) y confirmar que las pruebas existentes no cambian.
5. `index.html`: `role="status"` y elemento Nivel. `style.css`: diseño en columna con etiqueta/valor. `main.ts`: `#level`. Opcional: escribir `textContent` solo si cambió, para no saturar al lector de pantalla. Verificación manual (criterios 7 y 8).
6. Registrar la decisión en `brain/decisiones.md`.
7. Ejecutar `npm test` y `npm run build`.

## Pruebas requeridas
- `npm test` (Vitest) con: `tests/levels.test.ts` nuevo; ampliaciones en `tests/game.test.ts` (subida de nivel en `lockPiece`, puntaje con nivel previo/nuevo, `advance` según nivel) y `tests/constants.test.ts` (nuevas constantes; `GRAVITY_MS` sigue siendo 1000).
- `npm run build` sin errores de tipos (`tsc`).
- Verificación manual de interfaz descrita en los criterios 7 y 8 (la UI no se prueba automáticamente según el brain).

## Riesgo
medio: lógica nueva en el flujo central (`lockPiece`, `advance`) y cambios en varios archivos (lógica, HTML, CSS, main). Sin datos persistentes, dependencias ni dinero. Riesgo secundario de diseño del panel en pantallas angostas, cubierto con verificación manual.
