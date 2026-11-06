# 20261106-1727-botones-tactiles · Ronda 2

## Resumen de revisores
- Seguridad: APROBADO, 0 hallazgos críticos/importantes.
- UX: CAMBIOS, 1 importante (margen de tolerancia en pointermove) y 4 menores.
- UI: APROBADO, 0 hallazgos (CSS/HTML sin cambios desde la ronda 1).
- Código: APROBADO, 3 menores. 205 pruebas en verde; mutaciones detectadas por las pruebas.

## Correcciones de la ronda 1
Las seis quedan resueltas según seguridad, UX y código (pointermove que detiene, 170/60 con prueba, matchMedia único, buttonAction, export de Timers, brain actualizado).

## Hallazgos aceptados
Ninguno crítico ni importante.

## Hallazgos descartados
- UX [importante] «pointermove sin margen de tolerancia»: se rebaja a menor. Motivos:
  1. El criterio 7 de la spec dice «sacar el dedo del botón» sin tolerancia; el rectángulo exacto es el comportamiento literal (y el mismo que da pointerleave).
  2. No es una regresión: antes de la corrección no se detenía en absoluto al salir; ahora sí.
  3. El efecto es recuperable (levantar y volver a pulsar) y no hay pérdida de datos ni fallo de seguridad.
  4. Es una conjetura sin prueba en dispositivo; el propio revisor la basa en razonamiento, no en medición.
  5. El margen propuesto (10 px) es mayor que la separación entre botones (8 px): un dedo que ya está sobre el botón vecino seguiría contando como «dentro» del anterior y la pieza seguiría moviéndose, lo que contradice el criterio 7. Un margen correcto exige calibrar con el dispositivo (p. ej. 2-4 px) y esa calibración pertenece a la verificación manual.
  Queda anotado como mejora para después de la prueba en celular real.

## Hallazgos menores pendientes (no bloquean)
- Margen de tolerancia en pointermove: decidir tras probar en celular (valor < 8 px); si se añade, constante exportada, pruebas en los límites y registro en brain/decisiones.md.
- Layout que cambia sin mover el dedo no reevalúa la posición.
- Multitáctil sobre el mismo botón: repetidor único por botón.
- Pruebas de pointermove sin borde exacto (inclusivo no fijado por prueba).
- createRepeater con tercer parámetro `repeatable` no está en la firma de la spec; interfaz `Repeater` exportada sin uso externo.
- getBoundingClientRect en cada pointermove (sin acción).

## Pendiente del dueño
Verificación manual en celular real (criterios 6 a 11), incluido iOS Safari y la sensación del borde del botón.

## Veredicto final
APROBADO
