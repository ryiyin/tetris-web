# Spec 20261106-1757-gestos-tactiles (T14): Gestos táctiles

## Objetivo
Permitir jugar en celular con gestos sobre el canvas: deslizar horizontal para mover la pieza, deslizar hacia abajo para bajarla, un deslizamiento rápido hacia abajo para caída dura y un toque para rotar, sin romper la botonera de T13 ni el teclado.

## Contexto del brain aplicado
- producto.md: "Celular: botones en pantalla y gestos (deslizar para mover, tocar para rotar)". Hold, sonidos y vibración están fuera.
- decisiones.md, "Controles táctiles: botones y gestos propios": sin librerías, eventos pointer, `touch-action: none` en el canvas. T13 dejó los gestos pendientes en T14.
- decisiones.md, "Botonera táctil (T13)": solo Pointer Events, un único `dispatch` en `main.ts` para teclado y botones, `TOUCH_QUERY`, aviso "Toca Continuar/Reiniciar". Los gestos reutilizan `dispatch`; no se duplica lógica de juego.
- decisiones.md, T10/T11: las acciones ya devuelven el mismo estado en `'paused'` y `'stopped'`, así que los gestos no necesitan comprobar el estado.
- convenciones.md: entrada táctil en `src/ui/`; `src/game/` no se toca; la parte pura se prueba con Vitest sin jsdom; los gestos reales se prueban a mano en PC (emulación) y en celular real; nombres en inglés, comentarios y textos en español; sin dependencias nuevas.
- Sin contradicciones con el brain. Sin preguntas abiertas; las decisiones de abajo se registran.
- Observación: `canvas { touch-action: none }` ya existe en `src/style.css`; en esta tarea se conserva y se verifica con una prueba, no se añade de nuevo.

## Decisiones de diseño (se registran en brain/decisiones.md)
1. Módulo nuevo `src/ui/gestures.ts` con dos partes:
   - `createGestureTracker(metrics)`: lógica PURA, sin DOM ni reloj (el tiempo entra como argumento). Interfaz: `start(x, y, t)`, `move(x, y)` -> `KeyAction[]`, `end(x, y, t)` -> `KeyAction[]`, `cancel()`. `metrics = { cellW, cellH }` en píxeles de pantalla.
   - `attachGestures(canvas, onAction, win?, doc?)`: pegamento con Pointer Events que usa el tracker.
2. Reglas del tracker (constantes exportadas):
   - `SLOP_PX = 10`: hasta ese desplazamiento total no hay deslizamiento (es un posible toque).
   - Al superar `SLOP_PX` se fija el eje dominante (`|dx| >= |dy|` -> horizontal, si no vertical) hasta soltar. Los desplazamientos del otro eje se ignoran (evita movimientos accidentales).
   - Horizontal: se mide desde un ancla; cada `cellW` completos hacia la derecha emite `'right'` y hacia la izquierda `'left'`, y el ancla avanza una celda por acción (un arrastre largo emite varias acciones; volver atrás en sentido contrario también cuenta).
   - Vertical hacia abajo: cada `cellH` completos emite `'softDrop'` (mismo mecanismo de ancla). Hacia arriba: nada.
   - Al soltar (`end`): si el eje fue vertical, el desplazamiento vertical total `dy >= FLICK_MIN_PX (60)`, la duración `<= FLICK_MAX_MS (300)` y `dy > 2 * |dx|`, emite `'hardDrop'` (deslizamiento rápido hacia abajo).
   - Toque: si en `end` nunca se superó `SLOP_PX` y la duración `<= TAP_MAX_MS (250)`, emite `'rotate'`. Una pulsación larga sin mover no hace nada.
   - `cancel()` (pointercancel, blur, ocultar pestaña) reinicia el estado sin emitir nada. `move`/`end` sin `start` previo devuelven `[]`.
3. Pegamento (`attachGestures`):
   - Escucha `pointerdown`, `pointermove`, `pointerup`, `pointercancel` en el canvas, `window` `blur`, `document` `visibilitychange` (oculto) y `contextmenu` (cancelado solo en el canvas, evita el menú de pulsación larga).
   - Solo `pointerType` `'touch'` y `'pen'`. El ratón se ignora (en PC se usa el teclado; un clic no debe rotar). La emulación de celular de DevTools genera `'touch'`.
   - Un solo puntero activo: se guarda su `pointerId` y se ignoran los demás (un segundo dedo no hace nada). Los eventos de otro `pointerId` no afectan al gesto.
   - `pointerdown`: `preventDefault()`, `setPointerCapture(pointerId)` dentro de `try/catch` (para que el arrastre siga si el dedo sale del canvas), `metrics` calculadas de `canvas.getBoundingClientRect()` (`cellW = width / BOARD_COLS`, `cellH = height / BOARD_ROWS`) y `start(clientX, clientY, event.timeStamp)`.
   - Cada acción devuelta se envía en orden a `onAction` (el `dispatch` de `main.ts`).
   - Solo Pointer Events: ningún `click`, `touchstart` ni `mousedown`.
   - Los gestos NO reanudan la pausa ni reinician (eso queda en los botones: "Toca Continuar" / "Toca Reiniciar"); en `'paused'` y `'stopped'` las acciones se ignoran solas.
4. CSS del canvas: se conserva `touch-action: none` y se añaden `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none` y `-webkit-tap-highlight-color: transparent`.
5. `#overlay` ya tiene `pointer-events: none`, así que los toques sobre el aviso llegan al canvas.
6. Textos del aviso y botonera: sin cambios. Los botones de T13 siguen siendo la vía alternativa (quien prefiera botones los usa; no se ocultan).

## Alcance
- Incluye: `src/ui/gestures.ts` (nuevo), conectar `attachGestures(canvas, dispatch)` en `src/main.ts`, estilos del canvas en `src/style.css`, `tests/gestures.test.ts` (nuevo), registro en `brain/decisiones.md` (entrada "Gestos táctiles (T14)" y actualizar la nota de "Controles táctiles" de que los gestos ya están hechos), marcar T14 en el backlog cuando se publique.
- No incluye: cambios en `src/game/`, vibración, sonidos, gestos con dos dedos, ajuste de sensibilidad por el usuario, repetición por temporizador (el arrastre ya genera varias acciones), disposición horizontal o adaptable (T15), gestos con ratón.

## Criterios de aceptación
Automáticos (`tests/gestures.test.ts`, sin jsdom, con objetos falsos):
1. Toque: `start` + `end` en el mismo punto en 100 ms devuelve `['rotate']`. Con 400 ms (pulsación larga) devuelve `[]`.
2. Movimiento menor a `SLOP_PX` (por ejemplo 5 px) y suelta en 100 ms devuelve `['rotate']` y `move` no emitió nada.
3. Con `cellW = 30`, mover 31 px a la derecha emite `['right']`; mover 95 px emite 3 `'right'` (acumulado entre varios `move`, sin repetir acciones en `move`s posteriores sin avance); mover luego 31 px a la izquierda emite `['left']`. Equivalente hacia la izquierda.
4. Un deslizamiento horizontal que luego también baja 100 px no emite `softDrop` (eje bloqueado), y `end` no emite `rotate` ni `hardDrop`.
5. Desliz hacia abajo lento: con `cellH = 30`, bajar 65 px emite 2 `'softDrop'`; `end` a los 800 ms no emite nada más. Hacia arriba no emite nada.
6. Flick: bajar 100 px en 150 ms con poco `dx` emite en `end` `['hardDrop']` (además de los `softDrop` de `move`). Bajar 100 px en 600 ms no emite `hardDrop`. Bajar 100 px en 150 ms pero con `dx = 60` (diagonal) no emite `hardDrop`.
7. `cancel()` tras `start` y `move` hace que `end` devuelva `[]`; `move`/`end` sin `start` devuelven `[]`.
8. `attachGestures` con canvas y objetos falsos: un `pointerdown` de tipo `'mouse'` no hace nada; uno `'touch'` llama `preventDefault`, `setPointerCapture` y, tras `pointerup` rápido, `onAction('rotate')` una vez; un segundo `pointerId` mientras hay uno activo se ignora; `pointercancel` no emite; `setPointerCapture` que lanza no rompe el flujo; no se registra ningún listener `click`, `touchstart` ni `mousedown`; `window` `blur` y `visibilitychange` oculto cancelan el gesto.
9. Prueba de CSS: `src/style.css` (leído con `node:fs`) contiene en la regla `canvas` la declaración `touch-action: none`.
10. `npm test` y `npm run build` en verde.

Manuales (PC con emulación de celular en DevTools 360x640 y celular real, anotar el modelo y navegador en el informe):
11. Un toque sobre el tablero rota la pieza una vez; no hay zoom por doble toque ni resaltado azul.
12. Arrastrar el dedo a la derecha/izquierda mueve la pieza una celda por cada ancho de celda recorrido, siguiendo al dedo; también si el dedo sale del canvas sin soltar.
13. Arrastrar hacia abajo baja la pieza (caída suave con puntos); un deslizamiento rápido hacia abajo hace caída dura.
14. Deslizar por el tablero NO hace scroll ni "tirar para recargar" de la página; pulsación larga no abre menú contextual.
15. Un segundo dedo apoyado mientras se arrastra no provoca acciones extra; la botonera sigue funcionando a la vez (por ejemplo, mantener "Izquierda" y tocar el tablero).
16. En pausa y en fin de juego, los gestos no hacen nada; los botones "Continuar"/"Reiniciar" siguen funcionando.
17. En PC con ratón (sin emulación), clic y arrastre sobre el canvas no hacen nada y el teclado sigue igual.
18. La sensibilidad es cómoda en el celular real (no mueve de más ni se pierde movimientos). Si no lo es, se ajustan las constantes y se anota en la decisión; no se rediseña.

## Tareas
1. `gestures.ts`: constantes y `createGestureTracker` con toque y `cancel`. Pruebas 1, 2, 7.
2. `gestures.ts`: movimiento horizontal con ancla y bloqueo de eje. Pruebas 3 y 4.
3. `gestures.ts`: vertical con `softDrop` y flick de `hardDrop`. Pruebas 5 y 6.
4. `gestures.ts`: `attachGestures` (tipo de puntero, un solo `pointerId`, captura, `contextmenu`, `blur`, `visibilitychange`). Prueba 8.
5. `style.css`: propiedades de selección y resaltado del canvas; prueba 9.
6. `main.ts`: `attachGestures(canvas, dispatch)` tras `attachTouchControls`.
7. Verificación manual (criterios 11 a 18) y `npm test` + `npm run build`.
8. Registrar en `brain/decisiones.md` "Gestos táctiles (T14)" (reglas, constantes, solo touch/pen, un puntero, sin reanudar pausa por gesto, resultado de la prueba en celular real y ajustes) y actualizar la nota de "Controles táctiles".

## Pruebas requeridas
`npm test` (Vitest) con `tests/gestures.test.ts` (tracker puro con tiempos explícitos, `attachGestures` con objetos falsos y comprobación de `touch-action: none` en el CSS). `npm run build` para el tipado. La prueba en celular real (criterios 11 a 18) es obligatoria según el backlog y no se puede automatizar: debe hacerla y reportarla la persona.

## Riesgo
medio: lógica nueva de interpretación de gestos y manejo de eventos táctiles en varios archivos; sin datos, usuarios, dependencias ni cambios en `src/game/`. El punto delicado es la sensibilidad y los conflictos con scroll/zoom del navegador, que solo se confirman en un celular real.
