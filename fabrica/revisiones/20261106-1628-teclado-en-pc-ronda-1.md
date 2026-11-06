# 20261106-1628-teclado-en-pc · Ronda 1

## Resumen de revisores
| Revisor | Veredicto | Hallazgos |
|---|---|---|
| Seguridad | APROBADO | 1 menor |
| UX | APROBADO | 4 menores |
| UI | APROBADO | 2 menores |
| Código | APROBADO | 4 menores |

Ningún hallazgo crítico ni importante.

## Hallazgos aceptados (críticos/importantes)
Ninguno.

## Hallazgos descartados
Ninguno descartado. Todos son menores y se anotan abajo.

## Decisión sobre Ctrl/Alt/Meta en keyboard.ts
Seguridad y UX coinciden: keydown hace preventDefault con modificadores y bloquea atajos como Alt+← o Ctrl+flechas. Se mantiene como menor porque ambos revisores lo clasificaron así, no hay riesgo de seguridad (no hay inputs ni botones) y no rompe ningún criterio de la spec. Es una corrección de una línea (`if (event.ctrlKey || event.altKey || event.metaKey) return;` al inicio del listener); se recomienda aplicarla en la siguiente tarea que toque keyboard.ts, o antes de publicar.

## Menores pendientes
- keyboard.ts:27-31 · ignorar eventos con Ctrl/Alt/Meta (y, si se añaden controles, targets INPUT/TEXTAREA/SELECT/BUTTON/contentEditable).
- Fin de juego sin aviso visual; el bucle se detiene y una acción posterior no redibuja (T11: reiniciar bucle o forzar dibujo).
- Rotación imposible sin señal al jugador (limitación del wall kick simple de T05).
- Mantener ↓ puede encadenar bloqueos en cascada (revisar en T09 o ajuste).
- tests/actions.test.ts:10-11 · unir imports de `../src/game/board`.
- tests/actions.test.ts ~60-72 · fixture de "no puede rotar" parte de un estado inválido; usar tablero con hueco exacto.
- actions.ts:9-14 · type guard en isActive para quitar los `as Piece` (opcional).
- actions.ts:37 · dropToBottom podría recibir el tablero en vez del estado (opcional).

## Pendiente del dueño
Criterio 9 (verificación manual en navegador PC): no la hizo ningún agente.

## Veredicto final
APROBADO
