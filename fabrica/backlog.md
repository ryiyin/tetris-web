# Backlog

Estados: pendiente, en curso, en PR, publicada.

| ID | Título | Descripción | Depende de | Estado |
|----|--------|-------------|------------|--------|
| T01 | Esqueleto del proyecto | Vite + TypeScript strict, estructura de carpetas según convenciones, scripts dev/build/preview/test, prueba de ejemplo en Vitest, `base: '/tetris-web/'` y canvas en blanco. `npm test` y `npm run build` en verde. | - | publicada |
| T02 | Publicación en GitHub Pages | Workflow `.github/workflows/deploy.yml` que instala, prueba, compila y despliega al hacer push a main. Se verifica abriendo la URL publicada. | T01 | publicada |
| T03 | Tablero y piezas | Lógica pura: tablero 10x20, 7 piezas con 4 rotaciones y colisión con bordes y celdas ocupadas. Con pruebas. | T01 | en PR |
| T04 | Dibujar el tablero | Tablero y una pieza fija dibujados en el canvas con colores por pieza. Prueba visual a mano. | T03 | pendiente |
| T05 | Movimiento y rotación | Lógica pura: mover izquierda/derecha, rotar con wall kick simple y caída de un paso. Con pruebas de bordes. | T03 | pendiente |
| T06 | Caída automática, bloqueo y bolsa de 7 | Bucle de juego con temporizador, bloqueo al tocar fondo o pila y bolsa aleatoria de 7. Con pruebas. | T04, T05 | pendiente |
| T07 | Teclado en PC | Flechas para mover y rotar, flecha abajo para caída suave, espacio para caída dura. | T06 | pendiente |
| T08 | Líneas y puntaje | Borrar 1 a 4 líneas y mostrar puntaje (100/300/500/800 por 1/2/3/4 líneas, por nivel, más 1 punto por celda en caída suave). Registrar en brain/decisiones.md. Con pruebas. | T06 | pendiente |
| T09 | Niveles y velocidad | El nivel sube cada 10 líneas y la caída se acelera. Se muestran nivel y líneas. Con pruebas. | T08 | pendiente |
| T10 | Pausa | Tecla P para pausar y reanudar, con aviso "Pausa" en pantalla. Con pruebas. | T06 | pendiente |
| T11 | Fin de juego y reinicio | Detecta que la pieza nueva no cabe, muestra "Fin del juego" y permite reiniciar. Con pruebas. | T08, T10 | pendiente |
| T12 | Récord en localStorage | Guarda y muestra el mejor puntaje. Si localStorage falla, el juego sigue sin récord. Con almacenamiento simulado. | T11 | pendiente |
| T13 | Botones táctiles | Izquierda, derecha, rotar, bajar, caída dura y pausa visibles en celular. | T11 | pendiente |
| T14 | Gestos táctiles | Deslizar para mover y tocar para rotar, con `touch-action: none` en el canvas. Prueba en celular real. | T13 | pendiente |
| T15 | Diseño adaptable | CSS responsivo para pantalla vertical, controles al alcance del pulgar. | T13 | pendiente |
| T16 | Pulido final y verificación | Revisar los criterios del MVP en PC y celular publicado y aviso legal discreto sobre el nombre. | T02, T12, T14, T15 | pendiente |
| T17 | Actualizar Vite, Vitest y TypeScript | Node ya es 20.19 o más (v26.13.0). Subir Vite, Vitest y TypeScript a las versiones actuales, correr `npm audit`, dejar `npm test` y `npm run build` en verde y actualizar la decisión "Versiones fijadas" en brain/decisiones.md. | T01 | publicada |
