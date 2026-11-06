# Tetris Web

## Qué es
Tetris clásico que corre en el navegador, en PC y en celular. Uso personal y para aprender; sin cuentas, sin servidor, récord en localStorage. Stack: TypeScript + Vite + Vitest + Canvas 2D, publicado en GitHub Pages.

## Reglas para todos los agentes
1. Antes de cualquier tarea, lee brain/decisiones.md y brain/convenciones.md.
2. Nunca trabajes directo en la rama main. Cada tarea va en su propia rama tarea/<ID>.
3. Si tomas una decisión nueva de arquitectura o estilo, regístrala en brain/decisiones.md.
4. Si algo contradice el brain, detente y avisa.
5. Nunca escribas claves, contraseñas ni tokens en el repositorio. Van en .env.
6. Los comandos para instalar, probar y ejecutar están en brain/convenciones.md, sección "## Comandos".

## Mapa del brain
- brain/producto.md → para quién es, qué hace el MVP y qué queda fuera
- brain/decisiones.md → decisiones tomadas, con fecha y motivo
- brain/convenciones.md → estructura, estilo, pruebas, comandos, producción y secretos

## Fábrica
- fabrica/backlog.md → tareas planificadas y su estado
- fabrica/registro.md → historial de tareas procesadas
- fabrica/revisiones/ → informes de revisión y decisiones Main/PR
- specs/ → especificación de cada tarea
