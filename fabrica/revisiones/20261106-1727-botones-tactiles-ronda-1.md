# Revisión 20261106-1727-botones-tactiles, ronda 1

## Resumen de revisores
- Seguridad: APROBADO, 2 menores.
- UX: CAMBIOS, 1 importante y 5 menores.
- UI: APROBADO, 4 menores.
- Código: CAMBIOS, 1 importante y 5 menores.

## Hallazgos aceptados (bloquean)
1. [importante, UX] src/ui/touch.ts:93. En pantallas táctiles el navegador captura el puntero de forma implícita en el elemento del pointerdown. Según Pointer Events, mientras dura la captura no se emiten eventos de frontera (pointerleave/pointerout) hacia otros elementos, y pointerleave solo llega al soltar. Por eso arrastrar el dedo fuera de Izquierda, Derecha o Bajar no detiene la repetición, y el criterio 7 de la spec ("sacar el dedo del botón detiene la pieza") no se cumple. No se comprobó en un dispositivo, pero la regla está en el estándar. La spec descarta setPointerCapture, y esa decisión no cambia la captura implícita. El arreglo es barato y seguro: un pointermove por botón que llame a stop() si clientX/clientY queda fuera de getBoundingClientRect(). Se acepta. Pointerleave se mantiene como respaldo para el ratón.
2. [importante, Código] tests/touch.test.ts:52-65. Las pruebas usan las constantes, así que cambiar 170/60 por 160/80 pasa los 39 tests (mutación comprobada). El criterio 3 de la spec fija esos valores. Se acepta.

## Hallazgos descartados
- Ninguno de los críticos o importantes. Los hallazgos de seguridad son menores y no exigen cambios.

## Menores incluidos en la corrección (baratos y seguros)
- src/main.ts:99. Crear matchMedia una sola vez fuera de onFrame.
- src/main.ts:55. Usar buttonAction(button.dataset.action) en lugar del cast, y omitir el botón si devuelve null.
- src/ui/touch.ts:82. Quitar el export de Timers (opcional).

## Menores pendientes (no bloquean)
- Etiquetas de texto "Girar"/"Bajar" en lugar de glifos, y quitar ⤓. Afectan a HTML y CSS, y conviene decidirlo tras ver los glifos en el celular real.
- Texto "Toca Continuar" por "Toca el botón Continuar". Cambia textos fijados en la spec (criterio 8) y en pruebas; queda para el dueño tras la verificación manual.
- Multitáctil sobre el mismo botón: contar punteros por botón.
- Parar el repetidor si el botón se deshabilita o el estado cambia (hoy no ocurre).
- Click para lectores de pantalla (tabindex -1), ya registrado como aceptado.
- Estado :active poco contrastado (#44445a) y tamaño de glifos 0.8rem.
- Tope del tamaño de fuente del aviso (2rem) en monitores altos.
- Horizontal 640x360: tablero de 96 px, limitación aceptada hasta T15.
- Caída dura sin separación extra; sin reinicio táctil durante la partida (decisión de la spec).

## Pendiente de verificación manual (dueño)
Criterios 6 a 11 en un celular real, en especial: salir del botón con el dedo apoyado (criterio 7), renderizado de ⟳ y ⤓, layout 360x640 y :active en iOS.

## Veredicto final
DEVOLVER. Hay 2 hallazgos importantes aceptados.
