# Convenciones

## Estructura
- `index.html`: página única con el canvas y los botones táctiles.
- `src/game/`: lógica pura del juego, sin DOM (piezas, tablero, puntaje, niveles, estado). Todo se prueba aquí.
- `src/ui/`: dibujo en canvas, entrada de teclado y táctil, localStorage.
- `src/main.ts`: arranque que une la lógica con la interfaz.
- `src/style.css`: estilos y diseño adaptable.
- `tests/`: pruebas de Vitest (un archivo por módulo de `src/game/`).
- `.github/workflows/deploy.yml`: publicación en GitHub Pages.
- `vite.config.ts`: incluye `base: '/tetris-web/'`.
- `brain/`: documentación del proyecto.

## Estilo de código
- TypeScript con `strict: true`.
- Funciones pequeñas; la lógica del juego no toca el DOM ni localStorage.
- El estado del juego se trata como datos: una función recibe el estado y devuelve el nuevo.
- Nombres en inglés en el código; comentarios y textos de interfaz en español.
- Sin dependencias nuevas sin anotarlo en `brain/decisiones.md`.

## Pruebas
- Vitest sobre la lógica pura: rotación y colisiones en bordes, borrado de varias líneas, puntaje, subida de nivel, pausa, fin de juego.
- La interfaz (canvas y gestos) se prueba a mano en PC y en un celular real.
- Toda tarea termina con `npm test` en verde.

## Comandos
- Instalar dependencias: `npm install`
- Ejecutar pruebas: `npm test`
- Ejecutar en local: `npm run dev` (abre http://localhost:5173/tetris-web/)
- Compilar para producción: `npm run build`
- Ver el build en local: `npm run preview`

Scripts esperados en package.json: `dev` = `vite`, `build` = `tsc && vite build`, `preview` = `vite preview`, `test` = `vitest run`.

## Producción
- Se publica en GitHub Pages con GitHub Actions al hacer push a main (instala, prueba, compila y despliega).
- Configuración única: en GitHub, Settings > Pages > Source = "GitHub Actions". El repo debe ser público.
- Después de un push a main: revisar en la pestaña Actions que el flujo termine en verde y abrir `https://<usuario>.github.io/tetris-web/`.
- Si las pruebas fallan, no se publica.

## Secretos
- No hay variables de entorno ni secretos.
- Si en el futuro se añadieran, irían en `.env` (ya incluido en `.gitignore`), nunca en Git.
