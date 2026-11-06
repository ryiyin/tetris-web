# Revisión 20261106-1635-lineas-y-puntaje · Ronda 1

## Resumen por revisor
- Seguridad: APROBADO · 0 críticos/importantes, 1 menor
- UX: APROBADO · 0 críticos/importantes, 2 menores
- UI: APROBADO · 0 críticos/importantes, 2 menores (revisión por lectura, sin ver la pantalla)
- Código: CAMBIOS · 1 importante, 5 menores

## Hallazgos aceptados
1. [importante] tests/scoring.test.ts:30-52 · El criterio 2 de la spec exige `clearLines` con 2, 3 y 4 filas "contiguas y no contiguas". Verificado en el archivo: el caso no contiguo existe solo para 2 filas (líneas 40-52). Faltan 3 y 4 filas no contiguas. Es un criterio de aceptación explícito, no un extra, por eso es importante.

## Hallazgos descartados
Ninguno entre los críticos/importantes.

## Hallazgos menores pendientes (no bloquean)
- scoring.ts:21 índice sin límites (cubierto por `?? 0`).
- style.css: canvas con width fijo y aspect-ratio puede deformarse con max-height en pantallas bajas (celular apaisado); fuera de alcance de la spec. Panel #hud con alto fijo en canvas muy estrecho.
- main.ts:33-34 sin separador de miles.
- index.html:11-12 añadir `role="status"` o `aria-live` al panel.
- tests/actions.test.ts y tests/game.test.ts: `boardWithGap` duplicado.
- brain/decisiones.md:52 frase original sin editar in situ.
- actions.ts softDrop repite la lógica de tick (aceptable, la spec pide moveDown explícito).
- scoring.ts:5 `LINE_POINTS` exportado sin uso externo.

## Pendiente para el dueño
Criterio 12 (verificación manual en navegador): panel visible, Alt+Flecha izquierda, ancho ~375 px. Ningún agente lo hizo.

## Veredicto final
DEVOLVER (1 hallazgo importante aceptado).
