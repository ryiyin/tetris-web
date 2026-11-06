# Spec 20261106-1522-actualizar-vite-vitest-typescript (T17)

## Objetivo
Subir Vite, Vitest y TypeScript a las últimas versiones estables, ahora que Node es v26.13.0, sin romper `npm test` ni `npm run build`, y dejar el brain al día.

## Contexto del brain aplicado
- decisiones.md, "Versiones fijadas: Vite 5, Vitest 2, TypeScript 5": se fijaron por Node 20.10; su propia nota dice que se puede subir al actualizar Node (>= 20.19). Esta tarea reemplaza esa decisión.
- convenciones.md: TypeScript `strict: true`; scripts esperados `dev`, `build` = `tsc && vite build`, `preview`, `test` = `vitest run`; `base: '/tetris-web/'` en vite.config.ts; sin dependencias nuevas sin anotarlas (aquí no se añade ninguna, solo se suben las existentes); toda tarea termina con `npm test` en verde.
- Sin contradicciones con el brain.

## Alcance
- Incluye: subir `vite`, `vitest` y `typescript` en package.json y package-lock.json a la última versión estable (consultar con `npm view <paquete> version`); correr `npm audit` y registrar el resultado; ajustar vite.config.ts y tsconfig.json solo si las nuevas versiones lo exigen (cambios mínimos, manteniendo `strict: true` y `base`); actualizar la decisión en brain/decisiones.md (nueva entrada fechada, indicando versiones resultantes y que Node requerido es el de las nuevas versiones; marcar la anterior como reemplazada); añadir en convenciones.md la versión mínima de Node solo si las nuevas versiones la exigen.
- No incluye: añadir dependencias nuevas, tocar lógica del juego, crear workflow de GitHub Actions (T02; anotar allí que debe usar un Node compatible con las nuevas versiones, y avisar en el informe), usar `npm audit fix --force` sin revisar.

## Criterios de aceptación
1. package.json declara las últimas versiones mayores estables de vite, vitest y typescript (coinciden con `npm view`), y `npm ls vite vitest typescript` no muestra errores ni versiones duplicadas incompatibles.
2. `npm install` termina sin errores.
3. `npm test` termina en verde (la prueba existente tests/constants.test.ts pasa).
4. `npm run build` termina en verde (`tsc` sin errores y `vite build` genera dist/ con rutas que empiezan por `/tetris-web/`).
5. `npm run dev` arranca y responde en http://localhost:5173/tetris-web/ (verificación manual: abre la URL, se ve el canvas en blanco sin errores en consola).
6. `npm audit` se ejecuta; no quedan vulnerabilidades altas ni críticas. Si quedan, se documentan en la decisión con motivo.
7. brain/decisiones.md tiene la decisión de versiones actualizada con fecha 2026-11-06, versiones exactas y motivo; ya no dice "Vite 5, Vitest 2, TypeScript 5" como vigente.
8. Solo cambian package.json, package-lock.json, brain/ y, si es imprescindible, vite.config.ts/tsconfig.json.

## Tareas
1. Anotar versiones actuales (`npm ls`) y el resultado inicial de `npm audit`.
2. Consultar las últimas versiones con `npm view vite version`, `npm view vitest version`, `npm view typescript version`; revisar sus peer dependencies y requisitos de Node (`engines`) contra Node v26.13.0.
3. Actualizar con `npm install -D vite@latest vitest@latest typescript@latest`. Probar con `npm test`.
4. Ejecutar `npm run build`; corregir errores de tipos o configuración con el cambio mínimo (por ejemplo, opciones obsoletas en tsconfig.json o importar `defineConfig` desde `vitest/config` si cambia).
5. Probar `npm run dev` y `npm run preview` a mano.
6. Ejecutar `npm audit`; resolver con las actualizaciones normales; documentar lo que quede.
7. Actualizar brain/decisiones.md (y convenciones.md si aplica la versión mínima de Node). Actualizar fabrica/backlog.md según el flujo de la fábrica.

## Pruebas requeridas
- `npm test` en verde.
- `npm run build` en verde.
- `npm audit` ejecutado y su salida anotada.
- Verificación manual de `npm run dev` descrita en el criterio 5.

## Riesgo
medio. Son dependencias de desarrollo con saltos de varias versiones mayores (posibles cambios de configuración) pero el código es mínimo y hay pruebas y build que lo validan. Cambiar una decisión del brain normalmente es riesgo alto; aquí la propia decisión preveía esta subida, por lo que se deja en medio. Si el revisor prefiere el criterio estricto, tratarlo como alto.
