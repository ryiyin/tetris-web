// Declaración mínima de node:fs para las pruebas (evita añadir @types/node).
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf-8'): string;
}
