# Spec 20261106-1608-movimiento-y-rotacion (T05)

## Objetivo
Añadir la lógica pura para mover una pieza a izquierda/derecha, bajarla un paso y rotarla con un wall kick simple, devolviendo un resultado que permita saber si el movimiento fue posible.

## Contexto del brain aplicado
- convenciones.md: lógica en `src/game/` sin DOM; estado como datos (función recibe estado y devuelve el nuevo, sin mutar); nombres en inglés y comentarios en español; un archivo de pruebas por módulo en `tests/`; `npm test` en verde; TypeScript strict.
- decisiones.md "Modelo de datos": `Piece = { type, rotation, x, y }` inmutable; celdas `[col, row]`.
- decisiones.md "Las filas con y < 0 no colisionan": `collides` ya lo resuelve; el nuevo módulo NO añade reglas propias de filas negativas, solo usa `collides`.
- Se reutilizan `collides` (board.ts) y `rotate` (pieces.ts). No se duplica lógica de celdas ni de colisión.
- Sin dependencias nuevas.

## Alcance
- Incluye: nuevo módulo `src/game/movement.ts` y `tests/movement.test.ts`; registro en `brain/decisiones.md` de la decisión de wall kick y del contrato de retorno.
- No incluye: tablas SRS completas de wall kick, kicks verticales (floor kick), caída dura, bloqueo/fijado, caída automática, bolsa de 7 (T06), teclado (T07), puntaje en caída suave (T08), cambios en la interfaz.

## Contrato de retorno (para T06)
Todas las funciones reciben `(board, piece)` y devuelven `Piece`:
- Si el movimiento es posible: devuelven un objeto `Piece` NUEVO con los cambios aplicados.
- Si NO es posible: devuelven la MISMA referencia `piece` recibida (sin copiar). T06 detecta el fallo con `result === piece`.
- Nunca mutan `piece` ni `board`. Nunca lanzan error por movimiento imposible.
- Ejemplo de bloqueo en T06: `const next = moveDown(board, piece); if (next === piece) { /* fijar pieza */ }`.

## API (`src/game/movement.ts`)
- `moveLeft(board, piece): Piece` → intenta `x - 1`.
- `moveRight(board, piece): Piece` → intenta `x + 1`.
- `moveDown(board, piece): Piece` → intenta `y + 1`.
- `rotatePiece(board, piece, direction: 1 | -1 = 1): Piece` → calcula la nueva rotación con `rotate(piece.rotation, direction)` e intenta los desplazamientos horizontales (wall kick) en este orden: `0, -1, +1, -2, +2` (la `y` no cambia). Devuelve la primera variante que no colisione; si ninguna sirve, devuelve la misma `piece`.
- Función interna `tryMove(board, candidate, original)`: devuelve `candidate` si `!collides(board, candidate)`, si no `original`. Exportar la lista de kicks como constante `WALL_KICKS` (readonly) para poder probarla.
- Nota: para `O`, la rotación cambia el índice pero no la forma; es válido y se devuelve una pieza nueva si no colisiona.

## Criterios de aceptación
1. `moveLeft`/`moveRight`/`moveDown` en tablero vacío devuelven pieza nueva con `x-1`, `x+1`, `y+1` y el resto de campos iguales.
2. Pegada a la pared izquierda (celda en col 0), `moveLeft` devuelve la misma referencia; análogo con `moveRight` en col 9, para al menos las piezas I y T.
3. En el fondo (celda en fila 19), `moveDown` devuelve la misma referencia.
4. Una celda ocupada del tablero a la izquierda, derecha o debajo bloquea el movimiento respectivo (misma referencia).
5. Con la pieza parcialmente sobre el tablero (celdas con fila < 0), `moveLeft`, `moveRight`, `moveDown` y `rotatePiece` funcionan según `collides` (no se bloquean por la fila negativa).
6. `rotatePiece` en espacio libre devuelve rotación +1 (y -1 con `direction = -1`, 0 -> 3) con la misma `x`, `y`.
7. Wall kick: T (o J) rotada pegada a la pared derecha/izquierda donde la rotación directa colisiona se desplaza 1 columna y es válida; la I vertical contra una pared necesita un kick de 2 columnas y se resuelve con él. El resultado nunca colisiona.
8. Si ninguna de las 5 variantes cabe (pieza encajonada por celdas ocupadas), `rotatePiece` devuelve la misma referencia.
9. Ninguna función muta `piece` ni `board` (se comprueba comparando con copia/`Object.freeze` en el test).
10. `npm test` y `npm run build` en verde.

## Tareas
1. Crear `src/game/movement.ts` con `tryMove` y `moveLeft`/`moveRight`/`moveDown`; prueba de movimiento libre y bordes (criterios 1-5).
2. Añadir `WALL_KICKS` y `rotatePiece`; pruebas de rotación libre, ambas direcciones, kicks y rotación imposible (criterios 6-8).
3. Pruebas de inmutabilidad (criterio 9).
4. Registrar en `brain/decisiones.md` (fecha 2026-11-06): "Wall kick simple y contrato de movimiento": kicks horizontales `0,-1,+1,-2,+2` sin tablas SRS; movimiento imposible devuelve la misma referencia.
5. Ejecutar `npm test` y `npm run build`.

## Pruebas requeridas
`tests/movement.test.ts` (Vitest) cubriendo los criterios 1-9, usando `createBoard()` y piezas construidas a mano; para ocupar celdas se usa `placePiece` o un tablero armado con `map`. Comando: `npm test`.

## Riesgo
bajo: lógica nueva pero aislada en un archivo nuevo, sin cambios en módulos existentes, sin datos, dependencias ni interfaz. (Técnicamente "medio" por ser lógica nueva; se trata como bajo-medio y la revisión debe centrarse en el contrato de retorno por referencia.)

## Preguntas / contradicciones
Ninguna contradicción con el brain. Decisiones tomadas por defecto: orden de kicks `0,-1,+1,-2,+2`, sin kicks verticales, y retorno por identidad de referencia como señal de fallo.
