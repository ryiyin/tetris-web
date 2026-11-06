# Decisiones

## 2026-11-06 - Lenguaje: TypeScript
Un solo lenguaje, con tipos que ayudan a aprender y a evitar errores en la lógica del juego.

## 2026-11-06 - Sin framework: HTML + CSS + Canvas 2D
Un Tetris no necesita React ni similares. Menos dependencias y menos que aprender.

## 2026-11-06 - Empaquetador: Vite
Estándar maduro, servidor local rápido y build estático para publicar.

## 2026-11-06 - Pruebas: Vitest
Se integra con Vite sin configuración extra. La lógica del juego es pura (sin DOM), por lo que se prueba entera.

## 2026-11-06 - Datos: solo localStorage
No hay cuentas ni servidor. El récord vive en el navegador. Si localStorage falla, el juego sigue sin récord.

## 2026-11-06 - Publicación: GitHub Pages con GitHub Actions
Gratis y automático al hacer push a main. Exige repo público en el plan GitHub Free. Aceptado porque no hay secretos (el usuario pidió --public). Alternativa: Cloudflare Pages si se quiere repo privado.

## 2026-11-06 - Controles táctiles: botones y gestos propios
Sin librerías. Se usan eventos pointer/touch con touch-action: none en el canvas.

## 2026-11-06 - Versiones fijadas: Vite 5, Vitest 2, TypeScript 5 (REEMPLAZADA por la decisión de Vite 8 / Vitest 5 / TypeScript 7, más abajo)
Las últimas versiones (Vite 8, Vitest 5) exigen un Node más reciente que el instalado (v20.10) y Vitest no arrancaba (falta `styleText` en `node:util`). Se fijan las mayores compatibles con Node 20.10. Se puede subir de versión si se actualiza Node (>= 20.19).

## 2026-11-06 - Versiones: Vite 8.3.6, Vitest 5.1.0, TypeScript 7.0.2
Con Node v26.13.0 instalado se suben a las últimas estables (reemplaza la decisión de Vite 5, Vitest 2, TypeScript 5). Node mínimo requerido: >= 22.12 (Vitest 5 exige ^22.12 || ^24 || >=26; Vite 8 exige ^20.19 || >=22.12). `npm audit`: antes 6 vulnerabilidades (1 alta, 2 críticas); después 0. `npm test` y `npm run build` en verde sin cambios en vite.config.ts ni tsconfig.json. Nota para T02: el workflow de GitHub Actions debe usar Node >= 22.12 (recomendado 24).

## 2026-11-06 - Modelo de datos del tablero y la pieza
`Board` es una matriz inmutable de 20 filas x 10 columnas (`readonly (readonly (PieceType | null)[])[]`); `null` es celda vacía y la celda guarda el tipo de pieza para que la interfaz la coloree. `Piece` es `{ type, rotation, x, y }` con x,y = esquina superior izquierda de la matriz SRS de la pieza en coordenadas del tablero; las celdas son `[col, row]`. Las formas se guardan en rotación 0 (I en 4x4, O en 2x2, resto 3x3) y las demás rotaciones se derivan girando 90° horario. Todas las funciones devuelven datos nuevos sin mutar (coherente con el estilo del brain).

## 2026-11-06 - Las filas con y < 0 no colisionan
En `collides`, una celda sobre el tablero (fila < 0) no cuenta como colisión si su columna es válida, para permitir que las piezas aparezcan parcialmente arriba. Sí colisiona si la columna está fuera de 0..9, o si la fila es >= 20. `placePiece` ignora las celdas con fila < 0 y no valida colisión (lo hace quien llama).

## 2026-11-06 - Paleta de colores por pieza y CELL_SIZE
Colores clásicos fijos en `PIECE_COLORS` (`src/ui/render.ts`): I cian `#00e5ff`, O amarillo `#ffd600`, T morado `#aa00ff`, S verde `#00c853`, Z rojo `#ff1744`, J azul `#2962ff`, L naranja `#ff9100`. Fondo `#0b0b14` y cuadrícula blanca al 8 %. Un solo esquema (sin temas). `CELL_SIZE` (30 px) define el tamaño interno del canvas: `BOARD_COLS * CELL_SIZE` x `BOARD_ROWS * CELL_SIZE` (300x600), asignado desde `main.ts`; el tamaño visible se escala con CSS manteniendo la proporción 1:2.

## 2026-11-06 - Wall kick simple y contrato de movimiento
Al rotar (`rotatePiece`, `src/game/movement.ts`) se prueban desplazamientos horizontales `0, -1, +1, -2, +2` (constante `WALL_KICKS`) sin tablas SRS ni kicks verticales; se usa el primero que no colisione. Contrato de `moveLeft`/`moveRight`/`moveDown`/`rotatePiece`, todas `(board, piece) => Piece`: si el movimiento es posible devuelven una `Piece` nueva; si no, la MISMA referencia recibida (T06 detecta el fallo con `result === piece`). Nunca mutan ni lanzan error por movimiento imposible. Solo usan `collides`, sin reglas propias para filas negativas.

## 2026-11-06 - Bolsa de 7 y tiempo inyectados
La bolsa usa Fisher-Yates con azar inyectado (`Random = () => number`, `src/game/bag.ts`). El tiempo entra como `deltaMs` en `advance`; el reloj real (`performance`/`requestAnimationFrame`) y `Math.random` solo se usan en `src/ui/loop.ts` y `src/main.ts`. Así la lógica es determinista y se prueba sin reloj ni azar reales.

## 2026-11-06 - Aparición, bloqueo inmediato y gravedad fija
La pieza aparece en `y: 0`, con x = 4 (O) o x = 3 (resto). Se bloquea al instante (sin lock delay) cuando `moveDown` devuelve la misma referencia. Gravedad fija `GRAVITY_MS = 1000` (`src/game/constants.ts`) hasta que T09 la haga depender del nivel.

## 2026-11-06 - Estado 'stopped' cuando la pieza nueva no cabe
Si la pieza nueva colisiona al aparecer: `status: 'stopped'`, `piece: null`, el tablero conserva la última pieza y el bucle de UI deja de pedir frames. Es un adelanto mínimo; T11 lo completó (ver "Fin de juego y reinicio (T11)").

## 2026-11-06 - Acciones de teclado: archivo `actions.ts`, repetición y caída dura
Las acciones del jugador (`shiftLeft`, `shiftRight`, `rotateCurrent`, `softDrop`, `hardDrop`) viven en `src/game/actions.ts` como lógica pura; devuelven el MISMO estado si no hay cambio o si el juego no está en `'playing'`. Teclas (`src/ui/keyboard.ts`): flechas izquierda/derecha mueven, arriba rota (horario), abajo caída suave, espacio caída dura; `preventDefault` solo en esas teclas (7 desde T11: flechas, Espacio, P y Enter; ver "Fin de juego y reinicio (T11)"). Se repiten al mantener pulsado (repetición del navegador, sin temporizador propio) izquierda, derecha y abajo; arriba y espacio ignoran `event.repeat`. La caída suave equivale a un `tick` (si no puede bajar, bloquea al instante) y la caída dura baja con `moveDown` repetido, bloquea y llama a `spawnNext`; ambas ponen `dropTimer` en 0 y no dan puntaje hasta T08. `startLoop` devuelve `{ apply }` para aplicar acciones al estado que vive en el bucle; se dibuja en el siguiente frame.

## 2026-11-06 - Líneas y puntaje (T08)
- Fórmula: al bloquear se suma `LINE_POINTS[líneas] * level` con `LINE_POINTS = [0, 100, 300, 500, 800]` (`src/game/scoring.ts`). La caída suave da 1 punto por celda que baja por acción del jugador (`SOFT_DROP_POINTS_PER_CELL`), sin multiplicar por nivel; si no puede bajar y bloquea, no suma ese punto.
- La caída dura NO puntúa por celda (solo suma las líneas que borre al bloquear): la tarea original solo menciona la caída suave y es lo más simple. La caída automática por gravedad tampoco puntúa.
- Punto único de bloqueo: `lockPiece(state, piece, random)` en `game.ts` (`placePiece` -> `clearLines` -> suma `lines` y `score` -> `spawnNext`). Lo usan `tick`, `softDrop` y `hardDrop`. `clearLines` devuelve la misma referencia del tablero si no hay líneas completas.
- `GameState` tiene `score`, `lines` y `level`. `level` es fijo en `INITIAL_LEVEL = 1` hasta T09, que solo tendrá que actualizarlo.
- Pantalla: panel HTML (`#hud`, "Puntaje" y "Líneas") encima del canvas, actualizado en cada frame desde `onFrame` en `main.ts`; no se dibuja en el canvas ni se toca `render.ts`. El nivel no se muestra hasta T09.
- Corrige la frase "no dan puntaje hasta T08" de la decisión de acciones de teclado: desde T08 la caída suave puntúa (+1 por celda) y ambas acciones suman las líneas que borren.
- Teclado: un `keydown` con Ctrl, Alt o Meta activo se ignora (sin `preventDefault`), para no romper atajos del navegador como Alt+Flecha izquierda. Prueba en `tests/keyboard.test.ts` con un objetivo falso (sin jsdom).

## 2026-11-06 - Niveles y velocidad (T09)
- Fórmula del nivel: `level = INITIAL_LEVEL + floor(lines / LINES_PER_LEVEL)` con `LINES_PER_LEVEL = 10` (0-9 líneas = nivel 1, 10-19 = nivel 2...), sobre las líneas TOTALES (`levelForLines`, `src/game/levels.ts`). Sin tope de nivel.
- Recálculo: solo en `lockPiece`, tras sumar `lines`. El puntaje de esa jugada usa el nivel ANTERIOR al bloqueo; el nivel nuevo aplica desde la siguiente pieza (convención clásica).
- Curva de velocidad: `gravityMs(level) = max(MIN_GRAVITY_MS, GRAVITY_MS - (level - 1) * GRAVITY_STEP_MS)` con `GRAVITY_MS = 1000`, `GRAVITY_STEP_MS = 80`, `MIN_GRAVITY_MS = 100`. Nivel 1 = 1000 ms, 2 = 920, 5 = 680, 10 = 280, 11 = 200, 12 = 120, 13 en adelante = 100 ms. `advance` usa `gravityMs(current.level)` en cada iteración.
- Reemplaza "gravedad fija" de la decisión de aparición y "el nivel no se muestra hasta T09" de la decisión de líneas y puntaje: el panel `#hud` (con `role="status"`) muestra Puntaje, Nivel y Líneas en columnas etiqueta/valor, y `main.ts` escribe `textContent` solo si el valor cambió.
- Sin separador de miles (depende de la configuración regional).

## 2026-11-06 - Pausa (T10)
- Modelo de estado: `GameStatus = 'playing' | 'paused' | 'stopped'`. `'paused'` es reanudable; `'stopped'` sigue siendo final (T11). La pausa NO reutiliza `stopped` (precisa la decisión "Estado 'stopped'": el bucle se detiene solo con `stopped`, no con la pausa).
- `togglePause(state)` en `src/game/actions.ts`: `playing -> paused`, `paused -> playing`, `stopped -> mismo estado`. Solo cambia `status` (conserva `dropTimer`, pieza, tablero y puntaje). `advance`, `tick` y las demás acciones ya devuelven el mismo estado si `status !== 'playing'`, lo que cubre la pausa sin cambios.
- Bucle: sigue pidiendo frames mientras `status !== 'stopped'`. En pausa redibuja y actualiza `last`, así la pausa no cuenta como tiempo y al reanudar no hay caída brusca.
- Teclado: `p`/`P` -> `'pause'` (usa `event.key`); no es repetible, `event.repeat` se ignora; Ctrl/Alt/Meta se ignoran como siempre.
- Aviso (REEMPLAZADO en T11 por `#overlay`; ver "Fin de juego y reinicio (T11)"): elemento HTML `<div id="pause" role="status">` (siempre en el DOM, vacío), no canvas. `main.ts` escribe `textContent` "Pausa" si está pausado y `''` si no, solo cuando cambia. CSS: velo absoluto sobre el área del canvas (`top: var(--hud-height)`), `rgba(0,0,0,0.7)`, texto blanco, `pointer-events: none`, `#pause:empty { background: none }`. El nodo se deja siempre renderizado (sin `display: none`) para que el lector de pantalla anuncie "Pausa" al aparecer el texto; vacío no deja nada visible y `pointer-events: none` evita que cubra los toques. El tablero queda visible bajo el velo.
- La tecla P también llama `preventDefault` (ver corrección en "Acciones de teclado": son 6 teclas, no 5; desde T11 son 7 con Enter).

## 2026-11-06 - Fin de juego y reinicio (T11)
1. Status: se MANTIENE `'stopped'` como fin de juego (no se renombra ni se añade otro): ya estaba registrado y usado por bucle, acciones y pruebas.
2. Reinicio: `restartGame(state, random)` (`src/game/actions.ts`), pura. En `'stopped'` devuelve `createGame(random)` (tablero vacío, bolsa nueva, score 0, lines 0, level 1, dropTimer 0, 'playing'); en `'playing'` o `'paused'` devuelve la MISMA referencia (no se reinicia a mitad de partida, para evitar pérdidas accidentales).
3. Tecla: Enter -> `'restart'`. No Espacio (mantenerlo pulsado al perder reiniciaría sin querer). No es repetible (`event.repeat` se ignora, pero sí `preventDefault`); Ctrl/Alt/Meta se ignoran. Son 7 teclas con `preventDefault`. Nota para T13: un Enter sobre un botón enfocado lo activaría; revisar el foco.
4. En fin de juego, P, flechas y Espacio no hacen nada (ya devolvían el mismo estado si `status !== 'playing'`); solo se añadieron pruebas.
5. Aviso: REEMPLAZA el nodo `#pause` por un único `#overlay` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`, siempre en el DOM, vacío sin aviso) dentro de `#board` (contenedor relativo del tamaño del canvas). Textos de `overlayText(status)` (`src/ui/overlay.ts`, puro): paused = "Pausa
P para continuar", stopped = "Fin del juego
Enter para reiniciar", playing = "". CSS con `white-space: pre-line`, texto centrado y `inset: 0`. `main.ts` escribe con `setText` solo si cambió.
6. Bucle: `startLoop` tiene un indicador `running`. El frame pide otro frame si `status !== 'stopped'`; si no, `running = false`. `apply` reanuda (`running = true`, `last = null`, un `requestAnimationFrame`) solo si estaba detenido y el nuevo estado no es `'stopped'`: sin bucles duplicados y con delta 0 en el primer frame. El listener de teclado se registra una sola vez.
7. HUD sin cambios: conserva los valores finales al terminar y muestra 0/1/0 en el primer frame de la partida nueva.
8. Táctil: sin Enter en celular no hay reinicio hasta T13 (que debe incluir un botón de reiniciar visible en fin de juego). Mientras tanto, recargar la página.
