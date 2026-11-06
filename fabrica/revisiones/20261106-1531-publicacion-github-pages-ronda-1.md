# Revisión 20261106-1531-publicacion-github-pages · Ronda 1

## Resumen por revisor
- revisor-seguridad: APROBADO · 2 hallazgos menores (versiones atrasadas, actions fijadas por tag).
- revisor-ux: APROBADO · 0 hallazgos.
- revisor-ui: APROBADO · 0 hallazgos.
- revisor-codigo: CAMBIOS · 1 importante, 1 menor.

## Hallazgos aceptados
1. [importante] .github/workflows/deploy.yml líneas 21, 22, 29, 30, 42 · Las actions no usan las versiones mayores vigentes, que la spec exige ("Usar las versiones mayores vigentes de cada action"). Dos revisores (código y seguridad) coinciden, verificado con la API de GitHub. Vigentes: checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5.

## Hallazgos descartados
Ninguno.

## Hallazgos menores pendientes (no bloquean)
- Actions fijadas por tag y no por SHA: aceptable en proyecto personal con actions oficiales.
- Job build con permisos pages e id-token que no necesita (a nivel de workflow, como pide la spec).
- backlog.md y registro.md cambian T17 de "en PR" a "publicada": fuera del alcance de T02, coherente con el registro.
- actionlint no disponible; la verificación real es la manual tras el merge.
- Al subir versiones, mantener upload-pages-artifact y deploy-pages en la misma generación.

## Veredicto final
DEVOLVER. Queda un hallazgo importante aceptado. Repetir revisión en ronda 2.
