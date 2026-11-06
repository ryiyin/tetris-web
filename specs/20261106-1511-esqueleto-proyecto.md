# Spec 20261106-1511-esqueleto-proyecto (T01)

## Objetivo
Crear el esqueleto del proyecto (Vite + TypeScript strict + Vitest) con la estructura de carpetas del brain y una página con un canvas en blanco, de modo que `npm test` y `npm run build` terminen en verde.

## Contexto del brain aplicado
- decisiones.md: TypeScript, sin framework (HTML + CSS + Canvas 2D), Vite, Vitest.
- convenciones.md, Estructura: `index.html`, `src/game/`, `src/ui/`, `src/main.ts`, `src/style.css`, `tests/`, `vite.config.ts` con `base: '/tetris-web/'`.
- convenciones.md, Estilo: `strict: true`; nombres en inglés, comentarios y textos de interfaz en español; sin dependencias nuevas sin anotarlas en decisiones.md.
- convenciones.md, Comandos: scripts `dev`=`vite`, `build`=`tsc && vite build`, `preview`=`vite preview`, `test`=`vitest run`.
- Secretos: ninguno. `.gitignore` ya existe (verificar que cubra `node_modules`, `dist` y `.env`).
- Fuera de esta tarea: `.github/workflows/deploy.yml` (es T02).

## Alcance
- Incluye:
  - `package.json` con los 4 scripts exactos y devDependencies: `vite`, `typescript`, `vitest` (únicas dependencias; son las ya decididas en el brain, no requieren nueva decisión).
  - `tsconfig.json` con `strict: true`, `noEmit`, `moduleResolution: bundler`, `lib` con DOM, `include` de `src` y `tests` (y `vite.config.ts` si hace falta para `tsc`).
  - `vite.config.ts` con `base: '/tetris-web/'` (usar `defineConfig` de `vitest/config` o la forma que permita la sección `test` sin errores de tipos).
  - `index.html` con `<canvas id="game">` (ancho 300, alto 600, es decir 10x20 celdas de 30 px), `lang="es"`, título "Tetris Web", enlaces a `/src/main.ts` y `src/style.css`.
  - `src/main.ts`: obtiene el canvas, su contexto 2D y lo deja en blanco (fondo liso). Lanza un error claro en español si no hay canvas o contexto.
  - `src/style.css`: estilos mínimos (centrar el canvas, fondo oscuro, `touch-action: none` en el canvas).
  - Carpetas `src/game/` y `src/ui/` con un `.gitkeep` o un módulo mínimo. Se recomienda un módulo trivial en `src/game/` (p. ej. `src/game/constants.ts` con `BOARD_COLS = 10`, `BOARD_ROWS = 20`) para que la prueba de ejemplo sea útil.
  - `tests/constants.test.ts`: prueba de ejemplo en Vitest que verifica esas constantes.
  - `package-lock.json` generado por `npm install` y comiteado.
- No incluye: lógica de juego real, dibujo del tablero, controles, botones táctiles, workflow de despliegue, README extenso.

## Criterios de aceptación
1. `npm install` termina sin errores.
2. `npm test` pasa en verde con al menos 1 prueba.
3. `npm run build` pasa en verde y genera `dist/` con rutas que empiezan por `/tetris-web/`.
4. `package.json` tiene exactamente los scripts `dev`, `build`, `preview`, `test` con los valores del brain.
5. `tsconfig.json` tiene `strict: true`.
6. `vite.config.ts` contiene `base: '/tetris-web/'`.
7. Verificación manual: `npm run dev` y abrir http://localhost:5173/tetris-web/ muestra una página con un canvas en blanco de 300x600 sin errores en la consola.
8. Existen `src/game/`, `src/ui/`, `src/main.ts`, `src/style.css`, `tests/`, `index.html`.
9. `node_modules` y `dist` no están en git.

## Tareas
1. Verificar `.gitignore` (node_modules, dist, .env); añadir lo que falte.
2. Crear `package.json` con scripts y devDependencies; ejecutar `npm install`. Comprobar con `npm test` (aún sin pruebas puede fallar; seguir al paso 6).
3. Crear `tsconfig.json` strict y `vite.config.ts` con `base`.
4. Crear `index.html`, `src/style.css` y `src/main.ts` (canvas en blanco).
5. Crear `src/game/constants.ts` y la carpeta `src/ui/`.
6. Crear `tests/constants.test.ts`; correr `npm test`.
7. Correr `npm run build` y revisar `dist/index.html`.
8. Prueba manual con `npm run dev`.

## Pruebas requeridas
- Automática: `npm test` (Vitest) con la prueba de constantes.
- Automática: `npm run build` (incluye `tsc` strict) sin errores.
- Manual: criterio 7.

## Riesgo
medio. Es todo código nuevo en varios archivos y añade dependencias, pero son exactamente las decididas en el brain (Vite, TypeScript, Vitest), así que no hay decisión nueva ni datos sensibles. Si el implementador elige otras dependencias o una versión mayor con cambios de configuración, debe anotarlo en brain/decisiones.md.
