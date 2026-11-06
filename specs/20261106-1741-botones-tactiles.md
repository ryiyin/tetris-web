# Spec 20261106-1741-botones-tactiles (T13 Botones táctiles)

## Objetivo
Añadir botones en pantalla (izquierda, derecha, rotar, bajar, caída dura, pausa y reiniciar) que ejecutan las mismas acciones que el teclado, para poder jugar en celular. El botón de reiniciar solo aparece en fin de juego.

## Contexto del brain aplicado
- producto.md: el MVP incluye "Celular: botones en pantalla"; los gestos son T14 y el CSS responsivo fino es T15 (fuera de esta tarea).
- decisiones.md "Controles táctiles": sin librerías, eventos pointer, sin dependencias nuevas.
- decisiones.md "Fin de juego y reinicio (T11)", puntos 3 y 8: T13 debe incluir un botón de reiniciar visible en fin de juego. Nota explícita: un Enter sobre un botón enfocado lo activaría; revisar el foco.
- decisiones.md "Acciones de teclado": la lógica ya existe en `src/game/actions.ts`; `loop.apply` aplica acciones. No se toca la lógica pura. Teclado repite izquierda, derecha y abajo por repetición del navegador; los botones no tienen eso, hace falta repetición propia.
- convenciones.md: UI en `src/ui/`, `index.html` con los botones, nombres en inglés, textos en español, la interfaz se prueba a mano, `npm test` en verde.

## Alcance
- Incluye:
  - `index.html`: bloque `<div id="controls">` bajo `#board` con 7 `<button type="button">` y `data-action` (`left`, `right`, `rotate`, `softDrop`, `hardDrop`, `pause`, `restart`) y `aria-label` en español. El de reiniciar lleva el atributo `hidden` inicialmente.
  - `src/ui/touch.ts`: `attachTouchControls(root, onAction, timers?)`. Reutiliza el tipo `KeyAction` de `keyboard.ts`. Escucha `pointerdown` (delegado en `root`, busca `closest('[data-action]')`) y llama `onAction` de inmediato. Para `left`, `right`, `softDrop` repite: tras 300 ms de espera, cada 100 ms (constantes `REPEAT_DELAY_MS`, `REPEAT_INTERVAL_MS`). Para en `pointerup`, `pointercancel`, `pointerleave` del botón y `blur` de la ventana. `rotate`, `hardDrop`, `pause`, `restart` no repiten. `setTimeout/clearTimeout/setInterval/clearInterval` inyectables para probar sin reloj real. `preventDefault` en `pointerdown` para evitar doble toque, selección y zoom.
  - `src/main.ts`: extraer el `switch` actual a una función `handleAction(action)` usada por teclado y por táctil. Mostrar/ocultar el botón de reiniciar según `status === 'stopped'` (escribir `hidden` solo si cambia). El texto del botón de pausa cambia a "Seguir" cuando `status === 'paused'` y vuelve a "Pausa" si no (solo si cambia).
  - `src/style.css`: estilos de `#controls` (cuadrícula de botones grandes, mínimo 44 px de alto/ancho de toque, `touch-action: manipulation`, `user-select: none`). Ajustar `canvas` `max-height` para restar también la altura de los controles (`--controls-height`) y que todo quepa en una pantalla vertical sin scroll.
  - Pruebas de `touch.ts` con objetivo y temporizadores falsos (sin jsdom), en `tests/touch.test.ts`.
  - Registrar en `brain/decisiones.md` la decisión "Botones táctiles (T13)".
- No incluye: gestos de deslizar/tocar en el canvas (T14); rediseño responsivo y ergonomía del pulgar (T15); cambiar la lógica en `src/game/`; ocultar los botones en PC (se dejan siempre visibles, es lo más simple); vibración o sonido; cambiar el texto del aviso "Enter para reiniciar" (ver Riesgo).

## Criterios de aceptación
1. Existen 7 botones en la página con `data-action` correctos y etiquetas accesibles en español.
2. Tocar izquierda, derecha, rotar, bajar y caída dura produce el mismo efecto que sus teclas (verificación manual).
3. Mantener pulsado izquierda, derecha o bajar repite el movimiento (primera repetición a los 300 ms, luego cada 100 ms) y se detiene al soltar, salir del botón, cancelar el toque o perder el foco la ventana (prueba automática + manual).
4. Rotar, caída dura, pausa y reinicio se disparan una sola vez por toque, sin repetición (prueba automática).
5. El botón de pausa pausa y reanuda; muestra "Seguir" mientras está en pausa. En pausa, los demás botones no alteran el juego (ya garantizado por `actions.ts`).
6. El botón de reiniciar está oculto mientras se juega o hay pausa, aparece en fin de juego y al tocarlo empieza una partida nueva conservando el récord; luego vuelve a ocultarse. Verificable sin teclado.
7. Con un botón enfocado, pulsar Enter o Espacio en teclado NO activa el botón además de la acción de teclado (no hay doble acción; sin `click` handlers).
8. Tocar un botón no hace zoom, no selecciona texto ni dispara doble acción en celular real.
9. En pantalla vertical de celular (por ejemplo 360x640) se ven a la vez HUD, tablero completo y los botones, sin scroll. El overlay sigue sin bloquear toques (`pointer-events: none`).
10. El teclado en PC sigue funcionando igual.
11. `npm test` y `npm run build` en verde.

## Tareas
1. Añadir `#controls` con los 7 botones a `index.html` (reiniciar con `hidden`).
2. Estilos de `#controls` y ajuste de `max-height` del canvas en `style.css`.
3. Crear `src/ui/touch.ts` con `attachTouchControls` (pointerdown inmediato, repetición con retraso e intervalo, parada en up/cancel/leave/blur, temporizadores inyectables).
4. Escribir `tests/touch.test.ts` (ver pruebas).
5. En `main.ts`, extraer `handleAction`, conectar teclado y `attachTouchControls(controlsEl, handleAction)`, y actualizar visibilidad del reinicio y texto de pausa desde `onFrame`. Lanzar error claro si faltan elementos, como el resto del archivo.
6. Registrar la decisión en `brain/decisiones.md` (pointer events con repetición propia, botones visibles siempre, reinicio solo en `stopped`, sin `click` por la regla del foco, reemplaza la nota "Táctil" de T11 punto 8).
7. Verificación manual en PC (ratón y teclado) y en celular real o emulación táctil de las herramientas del navegador.

## Pruebas requeridas
`npm test` y `npm run build` en verde. Nuevas pruebas en `tests/touch.test.ts`, con raíz falsa, `closest` simulado y temporizadores falsos:
- `pointerdown` en cada botón llama `onAction` con la acción correcta.
- `pointerdown` fuera de un `[data-action]` no hace nada.
- left/right/softDrop: tras `REPEAT_DELAY_MS` repite cada `REPEAT_INTERVAL_MS`; `pointerup`, `pointercancel` y `pointerleave` detienen la repetición.
- rotate/hardDrop/pause/restart: una sola llamada aunque pase el tiempo.
- Un segundo `pointerdown` sin soltar no deja temporizadores duplicados.
- `preventDefault` se llama en `pointerdown`.
Manual: criterios 2, 3, 5 a 10 en PC y en celular real (ver tabla en cada criterio).

## Riesgo
medio: nuevo archivo de UI, cambios en `index.html`, `main.ts` y `style.css`, y lógica de temporizadores. Sin dependencias, datos ni cambios en `src/game/`. Puntos a vigilar: (a) el aviso de fin de juego sigue diciendo "Enter para reiniciar", poco útil en celular pero no incorrecto con el botón visible; queda como mejora para T15/T16; (b) el layout compartido con T15, por lo que aquí solo se garantiza que quepa en vertical.
