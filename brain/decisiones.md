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
