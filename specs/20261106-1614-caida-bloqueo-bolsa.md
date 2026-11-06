# Spec 20261106-1614-caida-bloqueo-bolsa (T06)

## Objetivo
Convertir el tablero estático en un juego que corre solo: la pieza actual cae sola con un temporizador, se bloquea al tocar el fondo o la pila, y las piezas nuevas salen de una bolsa aleatoria de 7. Reemplaza la demo temporal de `src/main.ts`.

## Contexto del brain aplicado
- convenciones.md: lógica pura en `src/game/` sin DOM; el estado es dato y las funciones devuelven el estado nuevo; un archivo de prueba por módulo en `tests/`; nombres en inglés, comentarios y textos en español; el temporizador (`requestAnimationFrame`) va en `src/ui/` o `src/main.ts`; sin dependencias nuevas; `npm test` en verde al terminar.
- decisiones.md "Modelo de datos": `Board` y `Piece` inmutables; "Las filas con y < 0 no colisionan" (la pieza puede aparecer parcialmente arriba); "Wall kick simple y contrato de movimiento": `moveDown` devuelve la MISMA referencia si no puede bajar, y T06 detecta el bloqueo con `result === piece`.
- producto.md: bolsa aleatoria de 7 y caída/bloqueo forman parte del MVP; hold, sombra, sonidos quedan fuera (tampoco se muestra "siguiente pieza").
- No hay contradicciones con el brain.

## Alcance
- Incluye:
  - `src/game/bag.ts`: bolsa de 7 con azar inyectado.
  - `src/game/game.ts`: estado del juego, aparición de pieza, paso de caída, bloqueo y acumulador de tiempo (todo puro).
  - `src/ui/loop.ts`: bucle con `requestAnimationFrame` que inyecta tiempo (`performance.now`) y azar (`Math.random`).
  - `src/main.ts`: crea el estado inicial, arranca el bucle y dibuja con `drawBoard`. Se elimina la demo.
  - Constante `GRAVITY_MS = 1000` en `src/game/constants.ts` (velocidad fija; T09 la hará depender del nivel).
  - Pruebas `tests/bag.test.ts` y `tests/game.test.ts`.
  - Registrar las decisiones nuevas en `brain/decisiones.md` (ver abajo).
- No incluye: teclado (T07; por eso la pieza solo cae, sin moverse), borrado de líneas y puntaje (T08), niveles/velocidad variable (T09), pausa (T10), mensaje de fin de juego, reinicio (T11), vista previa de la siguiente pieza, retardo de bloqueo (lock delay), caída suave/dura.

## Diseño

### Bolsa (`src/game/bag.ts`)
- `type Random = () => number` (devuelve [0, 1), como `Math.random`).
- `shuffleBag(random: Random): PieceType[]`: devuelve las 7 piezas (`PIECE_TYPES`) en orden aleatorio con Fisher-Yates, sin mutar `PIECE_TYPES`.
- `takeFromBag(bag: readonly PieceType[], random: Random): { type: PieceType; bag: PieceType[] }`: si la bolsa está vacía, genera una nueva con `shuffleBag`; devuelve el primer tipo y el resto de la bolsa (sin mutar la entrada).
- Propiedad que garantiza la bolsa: en cada bloque de 7 tomas consecutivas (empezando con bolsa vacía) salen las 7 piezas exactamente una vez.

### Juego (`src/game/game.ts`)
- `type GameStatus = 'playing' | 'stopped'` ('stopped' = no cabe la pieza nueva; T11 lo ampliará/renombrará a fin de juego).
- `type GameState = { readonly board: Board; readonly piece: Piece | null; readonly bag: readonly PieceType[]; readonly status: GameStatus; readonly dropTimer: number }` (`dropTimer` en ms acumulados desde la última caída).
- `spawnPiece(type): Piece`: `{ type, rotation: 0, y: 0, x }` con x = 4 para `O` y x = 3 para las demás (centrada en 10 columnas; I y O quedan visibles dentro del tablero).
- `createGame(random: Random): GameState`: tablero vacío, bolsa vacía, `dropTimer` 0, y aparece la primera pieza tomada de la bolsa (usa `spawnNext`).
- `spawnNext(state, random): GameState` (interno o exportado): toma de la bolsa; si `collides(board, nueva)` devuelve `{ ...state, piece: null, status: 'stopped' }`; si no, `piece` = nueva.
- `tick(state, random): GameState`: un paso de gravedad.
  - Si `status !== 'playing'` o `piece === null`: devuelve el mismo `state`.
  - `moved = moveDown(board, piece)`. Si `moved !== piece`: devuelve `{ ...state, piece: moved }`.
  - Si `moved === piece` (no puede bajar): bloquea al instante (sin lock delay): `board = placePiece(board, piece)` y luego `spawnNext`. No hay borrado de líneas aún.
- `advance(state, deltaMs, random): GameState`: suma `deltaMs` a `dropTimer`; mientras `dropTimer >= GRAVITY_MS` y el estado siga en `playing`, resta `GRAVITY_MS` y aplica `tick`. Si `status` no es `playing`, devuelve el estado sin cambios. `deltaMs` negativo se trata como 0.

### Comportamiento cuando la pieza nueva no cabe (adelanto mínimo de T11)
`status` pasa a `'stopped'`, `piece` queda en `null`, el tablero conserva la última pieza bloqueada, y `advance`/`tick` ya no cambian nada. El bucle de UI deja de pedir frames tras dibujar el último estado. No se muestra texto ni hay reinicio (recargar la página reinicia). No debe lanzar errores.

### Bucle (`src/ui/loop.ts`)
- `startLoop(initial: GameState, onFrame: (state) => void, random: Random): void` (o equivalente): en cada `requestAnimationFrame(ts)` calcula `delta = ts - last` (limitado a un máximo de 1000 ms para no encadenar caídas tras volver a la pestaña), llama `advance`, dibuja con `onFrame` y reprograma solo si `status === 'playing'`. Primer frame: delta 0.
- Sin pruebas automáticas (UI, se verifica a mano según el brain).

## Decisiones nuevas a registrar en `brain/decisiones.md`
1. Bolsa de 7 con Fisher-Yates y azar inyectado (`Random`); el tiempo entra como `deltaMs` en `advance`, el reloj real solo en `src/ui/loop.ts`.
2. Aparición en `y: 0`, x = 4 (O) o 3 (resto); bloqueo inmediato cuando `moveDown` devuelve la misma referencia; gravedad fija `GRAVITY_MS = 1000` hasta T09.
3. Si la pieza nueva no cabe: `status: 'stopped'`, `piece: null`, el bucle se detiene (T11 lo completa).

## Criterios de aceptación
1. `shuffleBag` devuelve una permutación de las 7 piezas; con el mismo `random` determinista da el mismo resultado; con distintos valores da órdenes distintos.
2. 14 tomas consecutivas con `takeFromBag` (empezando con `[]`) contienen cada pieza exactamente 2 veces, 7 por 7 (cada bloque de 7 es una permutación).
3. `takeFromBag` no muta la bolsa recibida ni `PIECE_TYPES`.
4. `createGame` devuelve tablero vacío, `status: 'playing'`, `dropTimer: 0`, pieza en posición de aparición y 6 piezas restantes en la bolsa.
5. `tick` con pieza libre la baja 1 fila y no toca el tablero.
6. `tick` con la pieza apoyada en el fondo la escribe en el tablero (celdas con su tipo) y aparece otra pieza arriba tomada de la bolsa.
7. `tick` con la pieza apoyada sobre celdas ocupadas (la pila) la bloquea igual.
8. `advance` con delta menor que `GRAVITY_MS` no baja la pieza y acumula `dropTimer`; con `GRAVITY_MS` baja 1 fila; con `3 * GRAVITY_MS` baja 3 filas (o bloquea) y `dropTimer` conserva el resto.
9. Si la pieza nueva colisiona al aparecer: `status === 'stopped'`, `piece === null`, sin excepción; `tick` y `advance` posteriores devuelven un estado equivalente sin errores.
10. Las funciones no mutan el estado recibido (el objeto y el `board` originales quedan iguales).
11. Manual (`npm run dev`): al abrir http://localhost:5173/tetris-web/ la pieza aparece arriba y baja una fila por segundo; al tocar fondo se queda fija con su color y sale otra; tras varias piezas se apila; cuando la pila llega arriba y la pieza no cabe, el juego se congela sin errores en la consola; observando 14 piezas seguidas no se repite una pieza más de 2 veces seguidas y cada 7 salen las 7 tipos.
12. `npm test` y `npm run build` en verde.

## Tareas
1. Agregar `GRAVITY_MS` a `src/game/constants.ts` (ajustar `tests/constants.test.ts` si cubre el archivo).
2. Crear `src/game/bag.ts` + `tests/bag.test.ts` (criterios 1-3).
3. Crear `src/game/game.ts` con `spawnPiece`, `createGame`, `tick`, `advance` + `tests/game.test.ts` (criterios 4-10). Para los casos de bloqueo y fin, construir tableros a mano con `createBoard`/`placePiece` y un `random` determinista (por ejemplo una secuencia fija o `() => 0`).
4. Crear `src/ui/loop.ts` con el bucle de `requestAnimationFrame`.
5. Reescribir `src/main.ts`: quitar la demo, crear el juego con `Math.random`, llamar `drawBoard(ctx, state.board, state.piece)` en cada frame.
6. Registrar las decisiones en `brain/decisiones.md`; actualizar estado en backlog/registro según el flujo de la fábrica.
7. Verificación manual (criterio 11), `npm test`, `npm run build`.

## Pruebas requeridas
- `npm test` (Vitest): `tests/bag.test.ts` y `tests/game.test.ts` cubren los criterios 1-10, sin DOM, sin `Math.random` ni reloj reales.
- Verificación manual del criterio 11 en PC (el celular no aplica hasta T13).
- `npm run build` para validar tipos (`tsc` strict).

## Riesgo
medio: lógica nueva en varios archivos y reescritura de `main.ts`, pero sin datos persistentes, dependencias nuevas, ni cambios en estructuras existentes. Las decisiones nuevas son de estilo/juego y se registran en el brain.
