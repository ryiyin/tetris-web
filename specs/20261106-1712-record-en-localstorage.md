# Spec 20261106-1712-record-en-localstorage (T12): Récord en localStorage

## Objetivo
Guardar el mejor puntaje en localStorage al terminar la partida, mostrarlo desde el arranque en el panel y avisar "¡Nuevo récord!" en el fin de juego. Si localStorage falla o no existe, el juego sigue normal, sin récord y sin errores.

## Contexto del brain aplicado
- producto.md: "Récord en localStorage (solo en ese navegador)"; sin cuentas ni servidor.
- decisiones.md "Datos: solo localStorage": si falla, el juego sigue sin récord.
- convenciones.md: `src/game/` no toca DOM ni localStorage; localStorage va en `src/ui/`. Pruebas en `tests/` con almacenamiento simulado (objeto inyectado, sin jsdom). Nombres en inglés; comentarios y textos en español. Sin dependencias nuevas. Se termina con `npm test` en verde.
- T11: `#overlay` (`role="status"`, siempre en el DOM) con `overlayText(status)`; el bucle se detiene en `'stopped'`, así que `onFrame` ve el estado `'stopped'` una sola vez por partida (ver "Fin de juego y reinicio (T11)").
- T09: `main.ts` usa `setText`, que escribe solo si cambió.
- No hay contradicciones con el brain. Nota: el módulo de UI se llama `recordStorage.ts` (no `record.ts`) para no confundirlo con `src/game/record.ts`.

## Decisiones de diseño (registrar en brain/decisiones.md)
1. Lógica pura en `src/game/record.ts`: `isNewRecord(best: number, score: number): boolean` = `score > best && score > 0`. 0 puntos NUNCA es récord. (`best` 0 significa "sin récord".)
2. Almacenamiento en `src/ui/recordStorage.ts`, con el almacenamiento INYECTADO:
   - `export const RECORD_KEY = 'tetris-web:record'`
   - `export type RecordStorage = Pick<Storage, 'getItem' | 'setItem'>`
   - `loadRecord(storage: RecordStorage | null): number`: devuelve 0 si no hay almacenamiento, no hay clave, el valor no cumple `/^\d+$/` o no es `Number.isSafeInteger`, o si algo lanza excepción (try/catch de TODO el cuerpo). Nunca lanza.
   - `saveRecord(storage: RecordStorage | null, score: number): boolean`: no escribe si `score` no es entero >= 0 seguro o si no hay almacenamiento; escribe `String(score)`; devuelve `true` si escribió, `false` si no o si lanzó (cuota llena, modo privado). Nunca lanza.
   - `getLocalStorage(): RecordStorage | null`: devuelve `globalThis.localStorage` dentro de try/catch (acceder a `window.localStorage` ya puede lanzar `SecurityError`); `null` si lanza o es `undefined`.
   - Convención: 0 = "sin récord" (ausente, inválido o con fallo). No se distingue entre "sin récord" y "sin almacenamiento": ambos se muestran igual.
3. Cuándo se guarda: SOLO al terminar la partida (primer `onFrame` con `status === 'stopped'`), si `isNewRecord(best, score)`. Nunca por frame. No se guarda a mitad de partida: si el jugador recarga a medio juego, esa partida no cuenta (simple y documentado). Como tras actualizar `best = score` la condición deja de cumplirse, no hay escrituras repetidas aunque `onFrame` se llamara otra vez.
4. El récord se lee UNA vez al arrancar (`let best = loadRecord(getLocalStorage())` en `main.ts`) y se mantiene en memoria; reiniciar con Enter lo conserva (no se vuelve a leer ni se borra). Si guardar falla, igual se mantiene en memoria durante la sesión.
5. Panel: cuarto elemento en `#hud`, orden Puntaje, Récord, Nivel, Líneas. Cabe en 300 px: cada columna es etiqueta pequeña (0.75rem) + valor (1rem), 4 columnas con valores como 123456 / 123456 / 15 / 140 suman ~230 px de ~292 útiles; `.stat` ya tiene `min-width: 0`. Altura fija 3rem sin cambios (una sola fila). Se muestra "—" si `best === 0`, si no el número (sin separador de miles). Id `record`.
6. Aviso: `overlayText(status, record?)` con segundo parámetro opcional `{ best: number; isNew: boolean }` (las llamadas existentes siguen válidas). Solo afecta a `'stopped'`:
   - `isNew` → `"Fin del juego\n¡Nuevo récord!\nEnter para reiniciar"`
   - no `isNew` y `best > 0` → `"Fin del juego\nRécord: N\nEnter para reiniciar"`
   - sin récord → texto actual `"Fin del juego\nEnter para reiniciar"`.
   `paused` y `playing` no cambian. El aviso usa el `role="status"` existente. En `main.ts` una variable `newRecord` se pone en `true` al guardar el récord y vuelve a `false` en cualquier frame con `status !== 'stopped'`.

## Alcance
- Incluye: `src/game/record.ts`, `src/ui/recordStorage.ts`, cambios en `overlay.ts`, `main.ts`, `index.html`, `src/style.css` (solo si hace falta), pruebas, registro en `brain/decisiones.md`.
- No incluye: botones táctiles ni gestos (T13), récord en vivo durante la partida, tabla de récords, borrar récord, sincronización entre pestañas (evento `storage`), separador de miles, cambios en `src/game/game.ts` ni en el bucle.

## Criterios de aceptación
1. `isNewRecord(0, 0)` es false; `isNewRecord(0, 10)` true; `isNewRecord(100, 100)` false; `isNewRecord(100, 101)` true; `isNewRecord(100, 50)` false.
2. `loadRecord` devuelve el entero guardado; devuelve 0 con `null` de almacenamiento, clave ausente, `"abc"`, `""`, `"-5"`, `"1.5"`, `"1e3"`, `"NaN"`, `"99999999999999999999"`; devuelve 0 (sin lanzar) si `getItem` lanza.
3. `saveRecord` escribe `"1200"` bajo `'tetris-web:record'` y devuelve true; devuelve false sin lanzar si `setItem` lanza; no escribe con `null`, negativos, decimales, `NaN` o `Infinity`.
4. `getLocalStorage` devuelve `null` si acceder a `localStorage` lanza (probado con `vi.stubGlobal`/getter que lanza) y devuelve el objeto si existe.
5. `overlayText('stopped', ...)` devuelve los tres textos de arriba; `overlayText('stopped')` sin segundo parámetro, `'paused'` y `'playing'` conservan su salida actual (las pruebas de T11 siguen en verde).
6. Manual (`npm run dev`): al abrir por primera vez el panel muestra "Récord —". Perder con puntaje > 0 muestra "¡Nuevo récord!" y el panel pasa a ese puntaje; recargar la página lo conserva. Perder con puntaje menor muestra "Récord: N" y no cambia el panel. Enter reinicia y el récord sigue visible.
7. Manual: con `localStorage.setItem('tetris-web:record','basura')` el panel muestra "—" y el juego funciona. Con el sitio con almacenamiento bloqueado (Chrome: bloquear cookies y datos de sitios) el juego arranca y se juega, sin errores en consola; el récord vive solo en la sesión.
8. Manual: en pantalla vertical de celular (~360 px de ancho) con valores grandes el panel no desborda ni cambia de altura.
9. `npm test` y `npm run build` en verde.

## Tareas
1. Crear `src/game/record.ts` con `isNewRecord` y `tests/record.test.ts` (criterio 1).
2. Crear `src/ui/recordStorage.ts` (`RECORD_KEY`, `RecordStorage`, `loadRecord`, `saveRecord`, `getLocalStorage`) y `tests/recordStorage.test.ts` con almacenamiento simulado (objeto con `getItem`/`setItem` sobre un `Map`; variantes que lanzan; sin jsdom). Criterios 2 a 4.
3. Extender `overlayText` con el parámetro opcional y ampliar `tests/overlay.test.ts` (criterio 5).
4. `index.html`: añadir `<div class="stat">Récord <span id="record">—</span></div>` entre Puntaje y Nivel. Comprobar CSS (ajustar `gap`/`font-size` solo si algo desborda).
5. `main.ts`: obtener `recordEl` (con el mismo error si falta), `best`, `newRecord`; en `onFrame`: si `status === 'stopped'` y `isNewRecord(best, s.score)` → `best = s.score; saveRecord(storage, best); newRecord = true`; si `status !== 'stopped'` → `newRecord = false`; escribir con `setText` el récord (`best === 0 ? '—' : best`) y `overlayText(s.status, { best, isNew: newRecord })`.
6. Registrar en `brain/decisiones.md` una entrada "Récord en localStorage (T12)" con: módulos, clave `tetris-web:record`, 0 = sin récord, 0 puntos no es récord, guardado solo al terminar (recargar a medio juego no cuenta), tolerancia a fallos (lectura/escritura/acceso devuelven sin récord y nunca lanzan), orden del panel y textos del aviso. Mencionar en `fabrica/` lo que corresponda según el flujo habitual.
7. Verificación manual (criterios 6 a 8) y `npm test` + `npm run build`.

## Pruebas requeridas
`npm test` (Vitest): `tests/record.test.ts`, `tests/recordStorage.test.ts`, `tests/overlay.test.ts` ampliado. Incluir una prueba que verifique que `saveRecord` no llama a `setItem` cuando el puntaje es inválido, y que `loadRecord` no lanza si `getItem` lanza. La integración en `main.ts` y el panel se verifican a mano (criterios 6 a 8), como indica el brain para la interfaz.

## Riesgo
medio: lógica nueva y varios archivos, pero aislada, sin dependencias nuevas, sin datos personales ni migraciones (un solo valor numérico local, ya previsto por el brain). Punto de atención: que ninguna ruta pueda lanzar excepción hacia `main.ts` (incluido el acceso a `localStorage`).
