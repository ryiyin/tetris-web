# Spec 20261106-1727-botones-tactiles (T13): Botones táctiles

## Objetivo
Añadir una botonera en pantalla (izquierda, derecha, rotar, bajar, caída dura, pausa/continuar y reiniciar) que permita jugar y reiniciar en celular, con repetición al mantener pulsado, sin scroll vertical en 360x640 y con avisos de pausa/fin de juego adaptados a táctil.

## Contexto del brain aplicado
- producto.md: "Celular: botones en pantalla y gestos". Gestos = T14 y diseño adaptable completo (horizontal, etc.) = T15: no entran.
- convenciones.md: `index.html` lleva "el canvas y los botones táctiles"; la entrada táctil va en `src/ui/` (nuevo `src/ui/touch.ts`); `src/game/` no se toca; la interfaz se prueba a mano, pero lo puro se prueba en `tests/`; nombres en inglés, comentarios y textos en español; sin dependencias nuevas.
- decisiones.md: "Controles táctiles: botones y gestos propios" (eventos pointer, sin librerías); T11 punto 3 (nota: Enter sobre un botón enfocado lo activaría; revisar foco) y punto 8 (T13 debe incluir un botón de reiniciar visible en fin de juego); T11 punto 5 (`#overlay`, `overlayText`); T10 (acciones ya ignoran estados no válidos); acciones en `src/game/actions.ts`.
- Sin contradicciones con el brain. No hay preguntas abiertas: las decisiones de abajo son las que se registran.

## Decisiones de diseño (se registran en brain/decisiones.md, ver Tareas)

### 1. Botonera y disposición
`<div id="controls" role="group" aria-label="Controles táctiles">` en `index.html`, DESPUÉS de `#board` (orden DOM: panel, tablero, controles). Siete `<button type="button" data-action="...">`, cuadrícula de 4 columnas x 2 filas (`grid-template-areas`), pensada para el pulgar en vertical:

```
fila 1:  [ ◀ left ] [ ▼ softDrop ] [ ▶ right ] [ ⟳ rotate ]
fila 2:  [ Pausa/Continuar pause ] [ Reiniciar restart ] [ Caída dura hardDrop (ocupa 2 columnas) ]
```
- `data-action` usa exactamente los valores de `KeyAction`.
- Cada botón: `aria-label` en español y texto visible equivalente (glifo `aria-hidden` + etiqueta corta cuando quepa). Nombres: "Izquierda", "Derecha", "Rotar", "Bajar", "Caída dura", "Pausa"/"Continuar", "Reiniciar".
- Tamaño: `min-height: 3rem` (48 px) y ancho de columna >= 48 px; `gap: 0.5rem`; padding del contenedor `0.5rem`. Altura total fija: `--controls-height: 7.5rem` (2 x 3rem + 0.5rem de gap + 2 x 0.5rem de padding).
- Contenedor: `width: min(100vw, 20rem)`, `align-self: center`. Contraste: fondo de botón `#2a2a3a`, texto `#fff`, borde `#555`; estado `:active` más claro; `:disabled` con `opacity: 0.4`.
- Estado de los botones según `GameStatus` (función pura `isActionEnabled`): `pause` deshabilitado en `'stopped'`; `restart` habilitado SOLO en `'stopped'`; los demás siempre habilitados (no se deshabilitan los de mover para no perder `pointerup` a mitad de una pulsación; las acciones ya ignoran `paused` y `stopped`). Se usa el atributo `disabled`. El botón de pausa alterna texto y `aria-label` entre "Pausa" (en `'playing'`) y "Continuar" (en `'paused'`) mediante `pauseButtonLabel(status)`. `main.ts` actualiza esto dentro de `onFrame`, solo si el valor cambió.

### 2. Cuándo se muestran
Por defecto `#controls` está oculto (`display: none`) y `--controls-height: 0px`. Se muestra con `@media (pointer: coarse), (hover: none)` (celulares, tabletas y emulación de celular en DevTools). En PC con ratón/teclado quedan ocultos: el espacio vertical es para el tablero y el teclado ya cubre todo. Un híbrido con puntero principal fino no verá la botonera (aceptado; uso personal). El JS siempre registra los listeners (inofensivo si están ocultos). La consulta se define UNA vez en JS como constante `TOUCH_QUERY = '(pointer: coarse), (hover: none)'` en `main.ts` con comentario de que debe coincidir con la del CSS.

### 3. Repetición al mantener pulsado
- Repiten solo `left`, `right` y `softDrop` (mismo criterio que `REPEATABLE` del teclado; no duplicar la lista: exportar `REPEATABLE` desde `keyboard.ts` o una función `isRepeatable(action)` y reutilizarla).
- Al `pointerdown`: se dispara la acción una vez de inmediato; si es repetible, `setTimeout` de `REPEAT_DELAY_MS = 170` y luego `setInterval` de `REPEAT_INTERVAL_MS = 60`.
- Se limpian SIEMPRE (timeout e interval) en `pointerup`, `pointercancel`, `pointerleave` del botón, `window` `blur` y `document` `visibilitychange` (oculto). También antes de iniciar una nueva repetición del mismo botón (nunca dos temporizadores por botón).
- Un repetidor por botón (permite mantener "izquierda" y tocar "rotar" a la vez). Se ignora un `pointerdown` de ratón con `button !== 0`.
- Rotar, caída dura, pausa y reiniciar no repiten.
- La lógica del repetidor es una función `createRepeater(fire, timers)` con `timers` inyectables (por defecto `setTimeout/clearTimeout/setInterval/clearInterval`), para probarla con `vi.useFakeTimers()` sin jsdom.

### 4 y 5. Eventos y efectos secundarios táctiles
- SOLO Pointer Events (`pointerdown`, `pointerup`, `pointercancel`, `pointerleave`). Ningún listener de `click`, `touchstart` ni `mousedown`: sin doble disparo.
- `pointerdown`: `event.preventDefault()` (evita foco por ratón/toque y eventos de ratón de compatibilidad). No se usa `setPointerCapture`.
- `contextmenu`: `preventDefault()` solo dentro de `#controls` (evita el menú de pulsación larga); el resto de la página no se toca. No se registran listeners en `document` para toques, así que no se capturan toques fuera de los botones.
- CSS de `#controls button`: `touch-action: none`, `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent`.

### 6. Función pura y contrato por estado
- `buttonAction(value: string | undefined): KeyAction | null` en `src/ui/touch.ts`, exportada: devuelve el `KeyAction` si `value` es uno de los siete valores válidos y `null` en cualquier otro caso (incluido `undefined`, vacío o con otra capitalización). Reutiliza `import type { KeyAction } from './keyboard'`. Se lee de `button.dataset.action`.
- `attachTouchControls(root: HTMLElement, onAction: (a: KeyAction) => void): void` en el mismo archivo: delega en los botones `[data-action]` de `root`.
- `main.ts` NO duplica el despacho: el `switch` actual se extrae a una función `dispatch(action: KeyAction)` y se pasa tanto a `attachKeyboard` como a `attachTouchControls`.
- Contrato: durante `'paused'` los botones de mover/rotar/bajar/caída dura no hacen nada (las acciones devuelven el mismo estado) y pausa reanuda; durante `'stopped'` solo reiniciar actúa (pausa está deshabilitada y la acción la ignora de todos modos); en `'playing'` reiniciar está deshabilitado y la acción devuelve el mismo estado.

### 7. Foco de teclado
Los botones llevan `tabindex="-1"` y solo escuchan pointer events (no `click`); `pointerdown` con `preventDefault` evita que tomen el foco. Así Enter/Espacio nunca activan un botón y solo actúa la acción de juego de `keyboard.ts`. Consecuencia aceptada: los botones no son alcanzables con Tab ni por activación sintética de lector de pantalla (el teclado ya ofrece todas las acciones); conservan nombre accesible para los lectores. Se anota en decisiones.

### 8. Accesibilidad
Nombre accesible en español en todos los botones, grupo con `aria-label`, orden DOM razonable (panel, tablero, controles), contraste alto (texto blanco sobre `#2a2a3a`). El cambio de texto de pausa/continuar no necesita `aria-live` extra (el aviso `#overlay` ya anuncia el estado).

### 9. Layout vertical sin scroll
- En `#app` se añade `--controls-height: 0px` y, dentro de la media táctil, `--controls-height: 7.5rem`.
- `canvas { max-height: calc(100dvh - var(--hud-height) - var(--controls-height)); }`: el canvas se reduce en lugar de empujar la botonera. Cálculo para 360x640: 640 - 48 - 120 = 472 px de alto, 236 px de ancho; no hay scroll vertical (verificar `document.documentElement.scrollHeight <= innerHeight`).
- `#controls` queda fuera de `#board`, por lo que `#overlay` (absoluto en `#board`) solo cubre el canvas.
- `body` mantiene `min-height: 100dvh`; si hiciera falta, usar `overflow: hidden` NO es aceptable (taparía contenido); se ajustan alturas.

### 10. Aviso `#overlay`
- Tamaño de texto basado en el tablero y no en la ventana. `container-type` en `#board` queda descartado: `#board` toma su tamaño del canvas y la contención de tamaño lo colapsaría. En su lugar, en `#app` una variable `--board-max-h: calc(100dvh - var(--hud-height) - var(--controls-height))` (usada también por el canvas) y `#overlay { font-size: clamp(0.625rem, min(8vw, calc(var(--board-max-h) * 0.04)), 2rem); }`. Así el texto sigue al ancho real del canvas (ancho = alto/2, tope 300 px).
- Horizontal (por ejemplo 640x360 con controles visibles): el canvas queda diminuto (~96 px de ancho) porque la botonera consume altura; el texto escala (>= 10 px) y no debe desbordar ni dejar el fondo sin cubrir. La disposición horizontal real (controles al lado del tablero) es de T15: aquí solo se comprueba que no hay desbordamiento del aviso ni scroll horizontal. Si en la verificación manual el aviso de 4 líneas no cabe, reducir el `padding` del overlay en esa condición; no rediseñar.
- Textos de `overlayText(status, record?, touch = false)` (tercer parámetro nuevo, retrocompatible; sigue puro):
  - `touch` falso (sin cambios): "Pausa\nP para continuar"; "Fin del juego\nEnter para reiniciar" (y variantes de récord).
  - `touch` verdadero: "Pausa\nToca Continuar"; "Fin del juego\nToca Reiniciar"; con récord: "Fin del juego\n¡Nuevo récord!\nToca Reiniciar" y "Fin del juego\nRécord: N\nToca Reiniciar".
  - `main.ts` calcula `touch = window.matchMedia?.(TOUCH_QUERY).matches ?? false` en cada frame (barato; sigue la emulación de DevTools al vuelo) y lo pasa a `overlayText`. `setText` ya evita escrituras repetidas.

## Alcance
- Incluye: `index.html` (botonera), `src/ui/touch.ts` (nuevo), `src/style.css`, `src/main.ts` (dispatch compartido, estado de botones, `touch`), `src/ui/overlay.ts` (parámetro `touch`), exportar `REPEATABLE`/`isRepeatable` en `src/ui/keyboard.ts`, tests, registro en `brain/decisiones.md`.
- No incluye: gestos sobre el canvas (T14), diseño adaptable completo y disposición horizontal (T15), retraso de bloqueo, sonidos/vibración, cambios en `src/game/`, cambios de comportamiento del teclado.

## Criterios de aceptación
1. `buttonAction` devuelve el `KeyAction` correcto para los 7 valores y `null` para `undefined`, `''`, `'Left'` y `'foo'` (prueba automática).
2. `isActionEnabled(action, status)`: `restart` solo true en `'stopped'`; `pause` false solo en `'stopped'`; el resto true en los tres estados (prueba automática). `pauseButtonLabel('playing') === 'Pausa'`, `('paused') === 'Continuar'`, `('stopped') === 'Pausa'`.
3. `createRepeater` con timers falsos: dispara 1 vez al iniciar; tras 170 ms dispara 1 vez más y luego cada 60 ms; tras `stop()` no dispara más; un `start` doble no crea dos temporizadores; para acciones no repetibles solo dispara 1 vez aunque pasen 5 s (prueba automática).
4. `overlayText` con `touch = true` devuelve los textos de arriba y con `touch` omitido/false los de siempre (pruebas existentes siguen en verde).
5. `attachTouchControls` con una raíz y botones falsos (sin jsdom): `pointerdown` llama `onAction` una vez y `preventDefault`; `pointerup`/`pointercancel`/`pointerleave` detienen la repetición; no se registra ningún listener `click`, `touchstart` ni `mousedown` (prueba automática con objetos falsos).
6. Manual (celular real o DevTools con emulación de celular 360x640): la botonera es visible bajo el canvas, no hay scroll vertical ni horizontal, cada botón >= 44 px, el canvas se reduce y el aviso solo cubre el canvas.
7. Manual: mantener "Izquierda"/"Derecha"/"Bajar" repite (tras ~170 ms, luego rápido); soltar, sacar el dedo del botón, cambiar de pestaña o bloquear pantalla detiene la pieza de inmediato; rotar, caída dura, pausa y reiniciar no repiten al mantener.
8. Manual: tocar Pausa muestra "Pausa / Toca Continuar" y el botón dice "Continuar"; tocar de nuevo reanuda. Al perder, "Fin del juego / Toca Reiniciar" y el botón Reiniciar queda habilitado (antes estaba deshabilitado); tocarlo inicia una partida nueva con el bucle funcionando y conserva el récord.
9. Manual: pulsación larga en un botón no abre menú contextual, doble toque no hace zoom ni selecciona texto, no hay resaltado azul; tocar fuera de los botones (p. ej. el fondo) no dispara acciones.
10. Manual en PC (ratón y teclado, sin emulación): la botonera no se ve, el canvas conserva su tamaño, el aviso dice "P para continuar"/"Enter para reiniciar"; Enter reinicia y Espacio hace caída dura sin activar ningún botón. Con emulación de celular en DevTools, la botonera aparece y los textos pasan a "Toca ...".
11. Manual horizontal (640x360 emulado): el aviso no se desborda del canvas y no hay scroll horizontal (la disposición completa es T15).
12. `npm test` y `npm run build` en verde.

## Tareas
1. `keyboard.ts`: exportar `isRepeatable(action)` (reutilizando `REPEATABLE`). Prueba: izquierda, derecha y bajar true; el resto false.
2. `overlay.ts`: añadir parámetro `touch` y textos táctiles. Pruebas en `tests/overlay.test.ts`.
3. `touch.ts`: `buttonAction`, `isActionEnabled`, `pauseButtonLabel` (puras) con `tests/touch.test.ts`.
4. `touch.ts`: `createRepeater` con timers inyectables y pruebas con `vi.useFakeTimers()`.
5. `touch.ts`: `attachTouchControls` (pointer events por botón, `contextmenu`, `window blur`, `visibilitychange`) y prueba con objetos falsos.
6. `index.html`: añadir `#controls` con los 7 botones (`type="button"`, `tabindex="-1"`, `data-action`, `aria-label`).
7. `style.css`: variables `--controls-height` y `--board-max-h`, media táctil, rejilla, estilos de botón, `canvas max-height`, `font-size` del overlay.
8. `main.ts`: extraer `dispatch`, conectar `attachTouchControls`, actualizar botón de pausa/reiniciar en `onFrame` (solo si cambió), pasar `touch` a `overlayText`.
9. Verificación manual (criterios 6 a 11) y `npm test` + `npm run build`.
10. Registrar en `brain/decisiones.md` la entrada "Botonera táctil (T13)": botones y rejilla, visibilidad por `(pointer: coarse), (hover: none)`, repetición 170/60 ms y limpieza, solo Pointer Events + `tabindex="-1"` + `preventDefault`, estados habilitados, textos del aviso (`touch`), variables CSS de altura y tamaño de fuente del aviso; actualizar la nota de T11 puntos 3 y 8 como resuelta, y la de `Controles táctiles` (gestos pendientes en T14).

## Pruebas requeridas
`npm test` (Vitest, sin jsdom): `tests/touch.test.ts` (buttonAction, isActionEnabled, pauseButtonLabel, createRepeater con timers falsos, attachTouchControls con objetos falsos), ampliar `tests/overlay.test.ts` y `tests/keyboard.test.ts` (`isRepeatable`). `npm run build` para el chequeo de tipos. Verificación manual de los criterios 6 a 11 en celular real y emulación de DevTools.

## Riesgo
medio: lógica nueva en varios archivos, nueva interfaz y cálculo de layout; sin datos, usuarios, dependencias ni cambios en la lógica del juego. Los puntos delicados son la limpieza de temporizadores y el layout en 360x640 y horizontal.
