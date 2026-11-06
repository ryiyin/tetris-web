# Spec 20261106-1553-dibujar-el-tablero (T04)

## Objetivo
Dibujar en el canvas el tablero 10x20 y una pieza fija, con un color distinto por tipo de pieza, uniendo la lógica de `src/game/` con el dibujo de `src/ui/` desde `src/main.ts`.

## Contexto del brain aplicado
- convenciones.md, Estructura: el dibujo vive en `src/ui/`; `src/game/` no toca el DOM; `src/main.ts` une lógica e interfaz.
- convenciones.md, Estilo: TypeScript strict, funciones pequeñas, nombres en inglés, comentarios y textos en español.
- convenciones.md, Pruebas: el canvas se prueba a mano; toda tarea termina con `npm test` en verde (no se añaden pruebas de Vitest para el dibujo).
- decisiones.md, "Modelo de datos del tablero y la pieza": `Board` guarda `PieceType | null` por celda (sirve para colorear); `Piece` = `{type, rotation, x, y}`; `getPieceCells(piece)` devuelve celdas `[col, row]` en coordenadas del tablero; filas < 0 no se dibujan (quedan fuera del canvas).
- Sin dependencias nuevas.
- producto.md: sin temas visuales ni sombra de pieza (fuera del MVP); un solo esquema de colores fijo.

## Alcance
- Incluye:
  - `src/ui/render.ts` (nuevo) con:
    - `PIECE_COLORS: Record<PieceType, string>` (colores clásicos: I cian, O amarillo, T morado, S verde, Z rojo, J azul, L naranja).
    - `drawBoard(ctx, board, piece | null)`: limpia el canvas con el fondo, dibuja una cuadrícula tenue, las celdas ocupadas del tablero y las celdas de la pieza dada, cada una con el color de su tipo.
    - Función pequeña auxiliar `drawCell(ctx, col, row, color)` (relleno + borde/brillo sencillo para distinguir celdas). Omite filas < 0.
  - Uso de `CELL_SIZE` (decisión: SÍ se usa aquí): tamaño de celda en píxeles y tamaño interno del canvas = `BOARD_COLS * CELL_SIZE` x `BOARD_ROWS * CELL_SIZE` (300x600). `main.ts` asigna `canvas.width/height` desde esas constantes; se mantiene `width="300" height="600"` en index.html como valor inicial coherente.
  - `src/main.ts`: crea `createBoard()`, una pieza fija de ejemplo (p. ej. `{type:'T', rotation:0, x:3, y:0}`) y algunas celdas de demostración en el fondo con `placePiece` (una de cada tipo de pieza, para ver los 7 colores), y llama a `drawBoard`. La demostración es temporal y se reemplazará en T06.
  - `index.html`: `aria-label="Tablero de Tetris"` en el canvas (hallazgo de revisión).
  - `src/style.css`: `min-height: 100dvh` en lugar de `100vh` (hallazgo); el canvas se escala con CSS (`max-height: 100dvh; max-width: 100vw; aspect-ratio: 1/2; height: auto`) sin deformarse, para que quepa en pantalla de celular. El tamaño interno no cambia.
  - Registrar en `brain/decisiones.md`: paleta de colores por pieza y que `CELL_SIZE` define el tamaño interno del canvas.
- No incluye: movimiento, rotación, caída, bucle de juego, puntaje, panel lateral, pieza siguiente, sombra, botones, gestos, diseño responsivo completo (T15), ajuste a pantallas de alta densidad (devicePixelRatio).

## Criterios de aceptación
1. `src/ui/render.ts` exporta `PIECE_COLORS` con una entrada distinta para cada uno de los 7 tipos (el tipo `Record<PieceType, string>` lo exige al compilar) y `drawBoard`.
2. `src/game/` no se modifica salvo, si hace falta, nada; ningún archivo de `src/game/` importa de `src/ui/` ni usa DOM.
3. Con `npm run dev`, en http://localhost:5173/tetris-web/ se ve: fondo oscuro, cuadrícula 10x20 tenue, una pieza fija con su color y celdas de demostración en el tablero con los 7 colores distinguibles entre sí.
4. Las celdas caen en la posición correcta: columna = x*30, fila = y*30; una celda en la columna 9 / fila 19 queda pegada a la esquina inferior derecha sin cortarse.
5. El canvas tiene `aria-label="Tablero de Tetris"`.
6. `style.css` usa `100dvh` y no contiene `100vh` para la altura mínima del body; en una ventana estrecha/alta (o emulación de celular en DevTools) el canvas se reduce sin deformarse y se ve completo.
7. `npm test` y `npm run build` en verde (tsc sin errores).

## Tareas
1. Crear `src/ui/render.ts` con `PIECE_COLORS`, `drawCell` y `drawBoard` (probable con `npm run build`).
2. Ajustar `src/main.ts`: fijar tamaño del canvas con las constantes, armar tablero y pieza de demostración, llamar a `drawBoard`.
3. Añadir `aria-label` en `index.html`.
4. Actualizar `src/style.css` (`100dvh` y escalado del canvas).
5. Eliminar `src/ui/.gitkeep` si ya no hace falta.
6. Registrar la decisión en `brain/decisiones.md`.
7. Verificación manual (abajo) y `npm test` / `npm run build`.

## Pruebas requeridas
- `npm test`: todas las pruebas existentes de T03 siguen en verde.
- `npm run build`: compila sin errores de tipos.
- Verificación manual en PC (`npm run dev`):
  1. Abrir la URL local; confirmar fondo, cuadrícula y pieza fija con color.
  2. Confirmar que se ven los 7 colores de las celdas de demostración y que ninguno se confunde con otro.
  3. Revisar bordes: celdas en columnas 0 y 9 y fila 19 completas.
  4. Reducir la ventana o usar emulación de celular en DevTools: el canvas cabe sin barras de desplazamiento y mantiene la proporción 1:2.
  5. Inspeccionar el canvas y confirmar el `aria-label`.
- Verificación en celular real: opcional en esta tarea (obligatoria en T15/T16).

## Riesgo
Medio: lógica de dibujo nueva y cambios en varios archivos (render, main, html, css, brain), pero sin datos, usuarios ni dependencias, y fácil de revertir. Sin contradicciones con el brain ni preguntas pendientes.
