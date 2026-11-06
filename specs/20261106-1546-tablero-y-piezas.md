# Spec 20261106-1546-tablero-y-piezas (T03)

## Objetivo
Crear la lógica pura del tablero 10x20 y de las 7 piezas clásicas con sus 4 rotaciones, más la detección de colisión contra bordes y celdas ocupadas. Todo con pruebas en Vitest.

## Contexto del brain aplicado
- convenciones.md, Estructura: lógica en `src/game/` sin DOM; un archivo de pruebas por módulo en `tests/`.
- convenciones.md, Estilo: TypeScript `strict`, funciones pequeñas, estado como datos (función recibe estado y devuelve el nuevo, sin mutar), nombres en inglés, comentarios en español, sin dependencias nuevas.
- convenciones.md, Pruebas: rotación y colisiones en bordes se prueban; la tarea termina con `npm test` en verde (y `npm run build` por el `tsc`).
- producto.md: 7 piezas clásicas; sin hold ni sombra (fuera de alcance).
- Existente: `src/game/constants.ts` (BOARD_COLS=10, BOARD_ROWS=20, CELL_SIZE=30). Se reutiliza, no se duplica.
- Decisión nueva a registrar en brain/decisiones.md (regla 3 de CLAUDE.md): modelo de datos del tablero y de la pieza, y que las filas con y < 0 no colisionan (ver abajo).

## Alcance
- Incluye:
  - `src/game/pieces.ts`:
    - `type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'` y `PIECE_TYPES` (arreglo con los 7).
    - `type Rotation = 0 | 1 | 2 | 3` (0 = aparición, giro horario).
    - `type Cell = readonly [number, number]` como `[col, row]` relativo a la posición de la pieza.
    - `getCells(type, rotation): readonly Cell[]` devuelve las 4 celdas de la forma. Formas en matrices SRS estándar (I en 4x4, O en 2x2 o 4x4, resto 3x3); las 4 rotaciones se definen como tabla fija o se derivan girando la matriz 90° horaria (elegir una, la que sea más simple; resultado idéntico).
    - `rotate(rotation, direction: 1 | -1): Rotation` (módulo 4, para T05).
  - `src/game/board.ts`:
    - `type Board = readonly (readonly (PieceType | null)[])[]` (BOARD_ROWS filas de BOARD_COLS columnas; `null` = vacía; la celda guarda el tipo para que T04 coloree).
    - `type Piece = { readonly type: PieceType; readonly rotation: Rotation; readonly x: number; readonly y: number }` (x,y = esquina superior izquierda de la matriz de la pieza en coordenadas del tablero).
    - `createBoard(): Board` tablero vacío 10x20.
    - `getPieceCells(piece): Cell[]` celdas absolutas `[col, row]` de la pieza.
    - `collides(board, piece): boolean` verdadero si alguna celda está fuera de columnas 0..9, en fila >= 20, o sobre una celda ocupada. Una celda con fila < 0 (sobre el tablero) NO colisiona por sí sola (permite aparecer parcialmente arriba); sí colisiona si su columna está fuera de rango.
    - `placePiece(board, piece): Board` devuelve un tablero nuevo con las celdas de la pieza escritas (ignora celdas con fila < 0); no muta el original; no valida colisión (lo hace quien llama).
  - `tests/pieces.test.ts` y `tests/board.test.ts`.
  - Anotar en brain/decisiones.md la decisión de modelo de datos (fecha 2026-11-06).
- No incluye: mover, rotar con wall kick, caída, bloqueo, bolsa de 7, posición/pieza de aparición, borrado de líneas, puntaje, dibujo (T04–T11). `rotate` solo calcula el índice, no mueve la pieza.

## Criterios de aceptación
1. Cada una de las 7 piezas devuelve exactamente 4 celdas distintas para cada una de las 4 rotaciones.
2. Rotación 0 de cada pieza coincide con la forma SRS esperada (I horizontal, O cuadrado, T apuntando arriba, S, Z, J, L). Verificado con celdas explícitas en la prueba.
3. Rotar 4 veces horario vuelve a la forma inicial; la O es igual (misma forma normalizada) en sus 4 rotaciones.
4. `rotate` con 1 y -1 hace módulo 4 (3 + 1 = 0; 0 - 1 = 3).
5. `createBoard()` tiene 20 filas x 10 columnas, todas `null`, y dos llamadas devuelven objetos independientes.
6. `collides` es falso para una pieza dentro del tablero vacío (p. ej. cada pieza en rotación 0 en el centro).
7. `collides` es verdadero al salirse por la izquierda, por la derecha y por abajo (fila 20), probado para al menos una pieza en cada borde y con la I en vertical y horizontal.
8. `collides` es verdadero cuando una celda de la pieza se solapa con una celda ocupada, y falso si queda justo adyacente.
9. `collides` es falso con celdas en fila < 0 y columnas válidas; verdadero con fila < 0 y columna fuera de rango.
10. `placePiece` escribe el tipo de la pieza en sus 4 celdas, no modifica el tablero original (comparación con copia previa) y devuelve un tablero nuevo.
11. `npm test` y `npm run build` terminan en verde; `src/game/` no importa nada del DOM.

## Tareas
1. Crear `src/game/pieces.ts` con tipos, `PIECE_TYPES`, formas y `getCells`; prueba de criterios 1–3.
2. Añadir `rotate`; prueba del criterio 4.
3. Crear `src/game/board.ts` con `Board`, `Piece`, `createBoard`; prueba del criterio 5.
4. Añadir `getPieceCells` y `collides` (usando BOARD_COLS/BOARD_ROWS de constants); pruebas de criterios 6–9.
5. Añadir `placePiece`; prueba del criterio 10.
6. Registrar la decisión en brain/decisiones.md; correr `npm test` y `npm run build`.

## Pruebas requeridas
- `tests/pieces.test.ts` y `tests/board.test.ts` con Vitest (`npm test`), cubriendo los criterios 1–10.
- `npm run build` para validar `strict` en TypeScript.
- Sin pruebas manuales (no hay interfaz).

## Riesgo
bajo-medio, se clasifica como medio: lógica nueva en varios archivos, pero sin datos persistentes, usuarios, dependencias ni cambios de infraestructura. Los tipos `Board` y `Piece` condicionan tareas posteriores (T04–T06), por eso se registran en decisiones.md.
