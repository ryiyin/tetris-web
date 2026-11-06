# Revisión 20261106-1701-fin-de-juego-y-reinicio · Ronda 1

## Resumen de revisores
- Seguridad: APROBADO, 0 hallazgos que bloqueen.
- UX: APROBADO, 2 menores.
- UI: CAMBIOS, 1 importante (descartado/rebajado a menor) y 5 menores.
- Código: CAMBIOS, 1 importante y 2 menores.

## Hallazgos aceptados
1. [importante] tests/loop.test.ts · Falta una prueba que detecte quitar `running = true` en `apply` de src/ui/loop.ts (mutación comprobada por el revisor). Verificado en el código: sin esa línea, tras reiniciar `running` queda en false y cada `apply` posterior (p. ej. mover una pieza) pide otro `requestAnimationFrame`, con lo que hay dos bucles y la caída se acelera. Es justo el riesgo que señala el criterio 6 y que la spec marca como punto delicado. La prueba actual "apply con el bucle en marcha" solo usa un bucle que nunca se detuvo, así que no cubre este caso.

## Hallazgos descartados / rebajados
- [UI importante -> menor] Tamaño del texto del aviso ligado a `8vw` y no al canvas (src/style.css:77). Motivo: la tarea 8 de la spec ordena explícitamente "conservar ... tamaño de fuente" del aviso, que ya existía en `#pause`. El criterio 8 solo exige verificar vertical estrecho (360x640), donde el canvas mide 300 px y el texto cabe y queda legible (el propio revisor UI lo confirma). El caso de celular horizontal bajo es real pero ya existía antes de T11 y la interacción táctil se rediseña en T13. No bloquea; se anota como menor (coincide con el menor de UX).

## Hallazgos menores pendientes
- Texto del aviso en celular ("Enter", "P") sin salida hasta T13 (ya en backlog).
- Tamaño de fuente del aviso: ligarlo al canvas, p. ej. `clamp(1rem, min(7vw, 4.5dvh), 2.5rem)`, o título grande y segunda línea más pequeña. Evaluar en T13.
- `#overlay:empty` solo funciona si el nodo queda realmente vacío (`textContent = ""`); verificar en la prueba manual.
- `#app` conserva `position: relative` sin necesidad (inocuo).
- brain/decisiones.md:52 mantiene "ambas ponen dropTimer en 0 y no dan puntaje hasta T08"; añadir "(corregido en T08)".
- loop.ts:41-42: si el reinicio ocurre con un frame pendiente, `last` no se reinicia y el primer frame tiene delta de ~1 frame, no 0; sin efecto visible. Documentar el matiz.
- Verificación manual en navegador (criterios 7 y 8): no la hizo ningún agente; queda para el dueño.

## Veredicto final
DEVOLVER: queda un hallazgo importante aceptado (cobertura de pruebas del bucle).
