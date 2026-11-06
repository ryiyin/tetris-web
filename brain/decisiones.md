# Decisiones

## 2026-11-06 - Lenguaje: TypeScript
Un solo lenguaje, con tipos que ayudan a aprender y a evitar errores en la lógica del juego.

## 2026-11-06 - Sin framework: HTML + CSS + Canvas 2D
Un Tetris no necesita React ni similares. Menos dependencias y menos que aprender.

## 2026-11-06 - Empaquetador: Vite
Estándar maduro, servidor local rápido y build estático para publicar.

## 2026-11-06 - Pruebas: Vitest
Se integra con Vite sin configuración extra. La lógica del juego es pura (sin DOM), por lo que se prueba entera.

## 2026-11-06 - Datos: solo localStorage
No hay cuentas ni servidor. El récord vive en el navegador. Si localStorage falla, el juego sigue sin récord.

## 2026-11-06 - Publicación: GitHub Pages con GitHub Actions
Gratis y automático al hacer push a main. Exige repo público en el plan GitHub Free. Aceptado porque no hay secretos (el usuario pidió --public). Alternativa: Cloudflare Pages si se quiere repo privado.

## 2026-11-06 - Controles táctiles: botones y gestos propios
Sin librerías. Se usan eventos pointer/touch con touch-action: none en el canvas.

## 2026-11-06 - Versiones fijadas: Vite 5, Vitest 2, TypeScript 5
Las últimas versiones (Vite 8, Vitest 5) exigen un Node más reciente que el instalado (v20.10) y Vitest no arrancaba (falta `styleText` en `node:util`). Se fijan las mayores compatibles con Node 20.10. Se puede subir de versión si se actualiza Node (>= 20.19).
