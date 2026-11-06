# Revisión 20261106-1741-botones-tactiles · Ronda 1

## Resumen de revisores
- seguridad: APROBADO (0 críticos/importantes, 2 menores informativos)
- ui: CAMBIOS (1 importante, 3 menores)
- codigo: CAMBIOS (1 importante, 6 menores)
- ux: CAMBIOS (3 importantes, 3 menores)

## Hallazgos aceptados (bloquean)
1. src/ui/touch.ts:67 (codigo + ux) · pointerleave no llega en táctil por la captura implícita; arrastrar el dedo fuera de ◀/▶/▼ sigue repitiendo. Incumple criterio 3 de la spec. Corrección: guardar el botón activo en pointerdown; en pointermove de la raíz parar si el punto (clientX/clientY) queda fuera de su getBoundingClientRect(); mantener pointerleave como respaldo. Añadir prueba.
2. src/style.css:88-96 (ui) · repeat(3, 1fr) permite que el texto "Reiniciar" ensanche la columna y con ello #app/#hud a 360x640 (criterio 9). Corrección: repeat(3, minmax(0, 1fr)), min-width: 0 y padding reducido en botones, y fuente menor en botones de texto (o Reiniciar en toda la fila).
3. index.html:26 (ux) · "⤓" (U+2913) poco soportado en Android, sin texto visible. Corrección: texto visible corto ("Caer") o glifo común, manteniendo aria-label "Caída dura". Mismo criterio para ⟳ (usar ↻).

## Hallazgos descartados
- ux importante, touch.ts:54/64 (multitoque: otro botón o soltar otro dedo corta la repetición). Fuera del alcance: la spec define un único juego de temporizadores y exige que un segundo pointerdown no los duplique (prueba requerida). Soportar multitoque es ergonomía para T15. Se anota como menor.

## Menores pendientes (no bloquean)
- touch.ts:9 REPEATABLE duplicado de keyboard.ts; exportarlo y reutilizarlo.
- Parámetro `win` de attachTouchControls no está en la spec; anotarlo en decisiones.
- `as TouchTimers` en REAL_TIMERS; ACTIONS repite KeyAction.
- Multitoque (arriba), --controls-height ajustado a fuente agrandada, viewport landscape: T15.
- Botón Pausa visible sin efecto en fin de juego (ocultar o disabled).
- aria-label fijo "Pausar o seguir" mientras el texto cambia.
- Aviso "Enter para reiniciar": T15/T16 según spec.
- Pendiente verificación manual en celular real (criterios 2, 3, 5-10).

## Veredicto final
DEVOLVER (3 importantes aceptados).
