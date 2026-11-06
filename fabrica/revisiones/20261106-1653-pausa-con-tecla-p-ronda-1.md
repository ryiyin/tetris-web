# Revisión 20261106-1653-pausa-con-tecla-p - Ronda 1

## Resumen de revisores
- Seguridad: APROBADO, 0 críticos/importantes, 1 menor.
- UX: CAMBIOS, 1 importante, 2 menores.
- UI: APROBADO, 3 menores.
- Código: CAMBIOS, 2 importantes, 2 menores.

## Hallazgos aceptados (bloquean)
1. [importante, UX] src/style.css · `#pause:empty { display: none }` saca del árbol de accesibilidad el nodo `role="status"` mientras está vacío. El texto aparece en el mismo instante en que el nodo se hace visible, y muchos lectores de pantalla no anuncian eso. La spec (punto 5) descarta `hidden` justo por esa razón ("mostrar/ocultar un nodo se anuncia peor"), y `display:none` tiene el mismo efecto, así que la spec se contradice a sí misma. Se acepta. La corrección (nodo siempre renderizado, quitar solo el velo visual con `#pause:empty { background: none; }`) es compatible con la spec: cumple su razón declarada, el nodo sigue siempre en el DOM y vacío, y `pointer-events: none` ya evita que tape nada. Al cambiar el CSS hay que corregir la entrada "Pausa (T10)" de decisiones.md, que repite `display: none`.
2. [importante, Código] tests/actions.test.ts:240-244 · La prueba del criterio 4 descarta el resultado de `advance(p, 30_000, random)` y reanuda `p`, así que no encadena el tiempo pasado en pausa. Se verificó en el archivo. Se acepta.
3. [importante, Código] brain/decisiones.md · La entrada de acciones de teclado dice "`preventDefault` solo en esas 5 teclas", pero ahora P también lo llama (6 teclas) y la entrada T10 no lo registra. Se verificó. El CLAUDE.md obliga a registrar las decisiones nuevas. Se acepta.

## Hallazgos descartados
- Ninguno de los importantes. Los dos importantes de código y el de UX son distintos y los tres son válidos. El `:empty` que UX marca importante y código menor se resuelve como importante, porque contradice la razón que da el propio brain.

## Menores pendientes (no bloquean)
- Seguridad: en pausa el bucle sigue pidiendo frames (gasto leve de CPU). Está documentado como decisión.
- UX/UI: el aviso no indica cómo reanudar ("P para seguir"). La spec no lo pide.
- UX: no hay pausa en celular. Es T13, fuera de alcance.
- UI: añadir `text-align: center` a `#pause`.
- UI: valorar `aria-live="polite"` en `#pause`.
- Código: fabrica/registro.md y backlog.md cambian el estado de T09 en esta rama. Revisar que sea intencional.

## Pendiente del dueño
- Verificación manual en navegador (criterios 7 y 8), que ningún agente hizo. Conviene probar con un lector de pantalla si se puede.

## Veredicto final
DEVOLVER (3 hallazgos importantes aceptados).
