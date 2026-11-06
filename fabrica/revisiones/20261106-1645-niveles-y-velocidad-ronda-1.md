# 20261106-1645-niveles-y-velocidad · Ronda 1

## Resumen de revisores
- Seguridad: APROBADO, 0 hallazgos.
- UX: APROBADO, 3 menores.
- UI: APROBADO, 3 menores.
- Código: CAMBIOS, 1 importante y 3 menores.

## Hallazgos aceptados (críticos o importantes)
Ninguno.

## Hallazgos descartados o rebajados
- [importante, código] Falta prueba de un `advance` que cruza un nivel dentro del bucle. Se rebaja a menor. La spec pide en los criterios 5 y 6 probar 919/920 ms en nivel 2, nivel 1 sin cambios y el mínimo, y todo eso está cubierto. El caso cruzado no es un criterio. El revisor confirmó a mano que el código es correcto (game.ts:86-90 recalcula `gravityMs(current.level)` en cada iteración), así que no hay defecto, solo una prueba extra deseable. No bloquea.
- role="status" en #hud (UX y UI). Queda como menor. La spec lo exige en el criterio 9 y marca como opcional solo la escritura condicionada, que ya está hecha (solo se escribe si el texto cambió). Quitar el rol incumpliría el criterio. Mejorar el anuncio (por ejemplo, solo al bloquear una pieza) se trata en una tarea futura.

## Hallazgos menores pendientes
- Añadir prueba en tests/game.test.ts de un `advance` que cruce de nivel. Propuesta: estado `level 1, lines 9, board con hueco en la fila 19, I vertical, dropTimer 0`, `advance(s, 1920)`. Esperado: `y === 1`, `dropTimer === 0`, `level === 2`, `lines === 10`. Recomendable hacerla en una tarea próxima.
- tests/constants.test.ts:1-5: formato del import.
- tests/levels.test.ts:6 y 15: líneas de casos muy largas.
- tests/game.test.ts: la prueba "sin borrar líneas el nivel no cambia" parte de nivel 1. Mejor usar `level 2, lines 15`.
- role="status" ruidoso con la caída suave (puntos por celda). Valorar anunciar solo al bloquear.
- La velocidad mínima se alcanza en el nivel 13, no en el 12. Se puede ajustar la curva más adelante.
- Registrar "retraso de bloqueo" en fabrica/backlog.md, ya que desde el nivel 10 la ventana para deslizar una pieza apoyada es corta.
- style.css: el Nivel no queda exactamente centrado con `space-between` (opcional: grid de 3 columnas). La etiqueta de 12 px podría atenuarse (#bbb).

## Pendiente para el dueño
Verificación manual en navegador de los criterios 7 y 8: PC, celular vertical de 320-360 px y 280 px. Ningún agente la hizo.

## Veredicto final
APROBADO. No quedan hallazgos críticos ni importantes aceptados.
