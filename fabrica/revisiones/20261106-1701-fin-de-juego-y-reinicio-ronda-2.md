# Revisión ronda 2 · 20261106-1701-fin-de-juego-y-reinicio

## Resumen por revisor
- Seguridad: APROBADO, 0 hallazgos.
- UX: APROBADO, 3 hallazgos menores.
- UI: APROBADO, 1 hallazgo menor (no releyó el diff; se basó en que 2d04e24 solo toca tests).
- Código: APROBADO, 0 hallazgos. Mutación M2 (quitar `running = true` en `apply`, src/ui/loop.ts) hace fallar exactamente una prueba, "tras reiniciar el bucle queda marcado en marcha: no hay bucles duplicados". La corrección de la ronda 1 queda verificada.

## Hallazgos aceptados (críticos/importantes)
Ninguno.

## Hallazgos descartados
Ninguno. La nota informativa de código (la prueba de "carrera" no detecta M2) no es defecto: cubre otra mutación y el criterio 6 queda cubierto por la prueba nueva.

## Hallazgos menores pendientes (no bloquean)
1. src/ui/overlay.ts:8 · En celular el aviso dice "Enter para reiniciar" y no hay forma táctil hasta T13. Asumido por la spec (decisión 8) y anotado en el backlog. Cerrar en T13.
2. src/ui/loop.ts:37-41 · Carrera casi inalcanzable: stopped -> playing entre dos frames deja `last` antiguo y el primer frame usa delta real. Opcional: `last = null` al salir de 'stopped' en `apply`.
3. CSS de #overlay · `clamp(1.5rem, 8vw, 2.5rem)` puede verse grande en celular horizontal. La spec manda conservar el tamaño; revisar en T13.
4. Verificación manual pendiente (criterios 7 y 8), para el dueño: en PC y en 360x640, "Enter para reiniciar" se parte en dos líneas sin cortar palabras, el velo cubre exactamente el canvas y mantener Enter reinicia una sola vez.

## Veredicto final
APROBADO. No quedan hallazgos críticos ni importantes. Pendiente solo la verificación manual del dueño.
