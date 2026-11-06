# Spec 20261106-1531-publicacion-github-pages (T02)

## Objetivo
Crear el workflow `.github/workflows/deploy.yml` que, al hacer push a main, instala dependencias, corre las pruebas, compila y despliega `dist/` a GitHub Pages. Si las pruebas o el build fallan, no se publica.

## Contexto del brain aplicado
- decisiones.md "Publicación: GitHub Pages con GitHub Actions": gratis, automático al push a main, repo público, sin secretos.
- decisiones.md "Versiones: Vite 8.3.6, Vitest 5.1.0, TypeScript 7.0.2": el workflow debe usar Node >= 22.12 (recomendado 24).
- convenciones.md "Producción": instala, prueba, compila y despliega; configuración única manual Settings > Pages > Source = "GitHub Actions"; si las pruebas fallan, no se publica.
- convenciones.md "Comandos": `npm install`, `npm test`, `npm run build`. Salida de Vite: `dist/`. `vite.config.ts` ya tiene `base: '/tetris-web/'`.
- convenciones.md "Secretos": no hay secretos; el workflow usa solo el `GITHUB_TOKEN` integrado con permisos mínimos.
- Nota: existe `package-lock.json`, así que en CI se usa `npm ci` (instalación reproducible). Es la forma de "instalar" en CI; no cambia los comandos del brain para uso local.

## Alcance
- Incluye:
  - Crear `.github/workflows/deploy.yml`, con:
    - Disparadores: `push` a `main` y `workflow_dispatch` (despliegue manual).
    - `permissions`: `contents: read`, `pages: write`, `id-token: write`.
    - `concurrency`: grupo `pages`, `cancel-in-progress: false`.
    - Job `build`: `actions/checkout`, `actions/setup-node` con `node-version: 24` y `cache: npm`, `npm ci`, `npm test`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` con `path: dist`.
    - Job `deploy`: `needs: build`, `environment: github-pages` con url `${{ steps.deployment.outputs.page_url }}`, paso `actions/deploy-pages` con `id: deployment`.
    - Usar las versiones mayores vigentes de cada action (fijadas por etiqueta mayor).
  - Añadir en brain/convenciones.md (sección Producción) una línea que indique que el workflow usa Node 24 y `npm ci`.
- No incluye:
  - Cambios en código del juego, `vite.config.ts` o `package.json`.
  - Dominio propio, previews por PR, Cloudflare Pages.
  - Configurar Settings > Pages (lo hace el dueño a mano una sola vez).

## Criterios de aceptación
1. El archivo `.github/workflows/deploy.yml` existe y es YAML válido (revisión de sintaxis, p. ej. al abrirlo o con un linter como actionlint si está disponible).
2. Solo se dispara con push a main (y manualmente); no hay disparador de ramas `tarea/*`.
3. El workflow usa Node 24 (>= 22.12) y ejecuta `npm ci`, `npm test` y `npm run build` en ese orden, antes de subir el artefacto; el deploy depende de `build`.
4. Los permisos son los mínimos listados; no se usan secretos propios.
5. `npm test` y `npm run build` siguen en verde en local.
6. Verificación manual posterior al merge a main (la hace el dueño):
   1. En GitHub, Settings > Pages > Source = "GitHub Actions" (repo público).
   2. Tras el push a main, en la pestaña Actions el flujo "Deploy" termina en verde (build y deploy).
   3. Abrir `https://<usuario>.github.io/tetris-web/` y comprobar que carga la página (canvas en blanco) sin errores 404 en la consola.
   4. Comprobación negativa opcional: una prueba fallida en main hace que el job `build` falle y no se ejecute `deploy`.

## Tareas
1. Crear `.github/workflows/deploy.yml` con el job `build` (checkout, setup-node 24 con caché npm, `npm ci`, `npm test`, `npm run build`, configure-pages, upload-pages-artifact de `dist`).
2. Añadir el job `deploy` con `environment: github-pages` y `actions/deploy-pages`.
3. Añadir `permissions` y `concurrency` a nivel de workflow.
4. Revisar la sintaxis YAML y ejecutar en local `npm ci`, `npm test` y `npm run build` para confirmar que los comandos del workflow funcionan y que `dist/` se genera.
5. Actualizar brain/convenciones.md (Producción) con la nota de Node 24 y `npm ci`.
6. Dejar indicado en la PR el paso manual del dueño (Settings > Pages) y la verificación de la URL.

## Pruebas requeridas
- `npm test` en verde (prueba de ejemplo existente) y `npm run build` en verde en local.
- No hay prueba automática posible del despliegue en la rama; la verificación real es la manual del criterio 6, tras el merge a main. Si hay `actionlint` disponible, usarlo sobre el workflow.

## Riesgo
medio. Es un archivo de CI/CD nuevo que publica en internet y otorga permisos de escritura a Pages, pero no hay secretos, datos ni cambios de código. Requiere un paso manual del dueño (Settings > Pages) y el repo público, ya aceptados en decisiones.md. No es alto: no hay dependencias nuevas ni decisión nueva del brain.
