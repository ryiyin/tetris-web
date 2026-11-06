// Decide con reglas fijas si una tarea va directo a main o necesita PR con aprobación humana.
// Sirve para cualquier proyecto de la fábrica. Ajustes por proyecto en fabrica/config.json.
// Uso: node fabrica/decidir.mjs <ID>
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const id = process.argv[2];
if (!id) {
  console.error('Uso: node fabrica/decidir.mjs <ID>');
  process.exit(2);
}

const rama = `tarea/${id}`;
const ejecutar = (comando) =>
  execSync(comando, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const lineasDe = (texto) => texto.split(/\r?\n/).filter(Boolean);

for (const referencia of ['main', rama]) {
  try {
    ejecutar(`git rev-parse --verify --quiet ${referencia}`);
  } catch {
    console.error(`No existe la rama ${referencia}. Revisa el ID de la tarea.`);
    process.exit(2);
  }
}

// Configuración del proyecto (opcional)
const config = { limiteLineas: 200, rutasSensiblesExtra: [] };
try {
  Object.assign(config, JSON.parse(fs.readFileSync('fabrica/config.json', 'utf8').replace(/^﻿/, '')));
} catch {
  // Sin config: se usan los valores por defecto.
}

// Archivos que siempre requieren revisión humana
const RUTAS_SENSIBLES = [
  /^brain\//, // reglas y decisiones del proyecto
  /^CLAUDE\.md$/,
  /^\.claude\//, // agentes y comandos
  /^\.github\//, // automatizaciones
  /^fabrica\/decidir\.mjs$/, // este script
  /^fabrica\/config\.json$/,
  /(^|\/)\.env/, // secretos
  /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/, // dependencias JS
  /(^|\/)(requirements[^/]*\.txt|pyproject\.toml|poetry\.lock|Pipfile(\.lock)?)$/, // Python
  /(^|\/)(pubspec\.(yaml|lock)|build\.gradle(\.kts)?|Podfile(\.lock)?)$/, // móvil
  /(^|\/)(Dockerfile|docker-compose[^/]*\.ya?ml|vercel\.json|netlify\.toml|render\.yaml)$/, // despliegue
  /(^|\/)migrations?\//, // cambios de base de datos
  /(^|\/)(schema\.prisma|schema\.sql)$/,
  ...config.rutasSensiblesExtra.map((patron) => new RegExp(patron)),
];

// Patrones que parecen secretos dentro de las líneas agregadas
const PATRONES_SECRETOS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}/, // Stripe y similares
  /\bAKIA[0-9A-Z]{16}\b/, // AWS
  /\bghp_[A-Za-z0-9]{30,}/, // GitHub
  /\bAIza[0-9A-Za-z_-]{30,}/, // Google
  /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/, // token de bot de Telegram
  /(password|passwd|contrase(ñ|n)a|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
];

const motivos = [];

// 1. Archivos borrados o sensibles
for (const cambio of lineasDe(ejecutar(`git diff --name-status main...${rama}`))) {
  const partes = cambio.split('\t');
  const estado = partes[0];
  const ruta = partes[partes.length - 1];
  if (estado.startsWith('D')) motivos.push(`Borra un archivo: ${ruta}`);
  if (RUTAS_SENSIBLES.some((patron) => patron.test(ruta))) {
    motivos.push(`Modifica un archivo sensible: ${ruta}`);
  }
}

// 2. Tamaño del cambio
let totalLineas = 0;
for (const fila of lineasDe(ejecutar(`git diff --numstat main...${rama}`))) {
  const [agregadas, borradas] = fila.split('\t');
  totalLineas += (Number(agregadas) || 0) + (Number(borradas) || 0);
}
if (totalLineas > config.limiteLineas) {
  motivos.push(`Cambio grande: ${totalLineas} líneas (límite ${config.limiteLineas})`);
}

// 3. Posibles secretos en las líneas agregadas
// Solo se informa el archivo, nunca el valor, para no copiar el secreto a los informes.
const archivosConSecretos = new Set();
let archivoActual = '';
for (const linea of lineasDe(ejecutar(`git diff -U0 main...${rama}`))) {
  if (linea.startsWith('+++ ')) {
    archivoActual = linea.replace(/^\+\+\+ (b\/)?/, '');
  } else if (linea.startsWith('+') && PATRONES_SECRETOS.some((patron) => patron.test(linea))) {
    archivosConSecretos.add(archivoActual);
  }
}
for (const archivo of archivosConSecretos) {
  motivos.push(`Posible secreto en el código: ${archivo}`);
}

// 4. Riesgo declarado en la spec
let riesgo = 'desconocido';
try {
  const spec = ejecutar(`git show ${rama}:specs/${id}.md`);
  const coincidencia = spec.match(/##\s*Riesgo[\s\S]*?\b(bajo|medio|alto)\b/i);
  if (coincidencia) riesgo = coincidencia[1].toLowerCase();
} catch {
  motivos.push('No se encontró la spec en la rama');
}
if (riesgo !== 'bajo') motivos.push(`Riesgo de la spec: ${riesgo}`);

// Resultado
const destino = motivos.length === 0 ? 'MAIN' : 'PR';
console.log(`DESTINO: ${destino}`);
console.log(`Riesgo de la spec: ${riesgo}`);
console.log(`Líneas cambiadas: ${totalLineas}`);
if (motivos.length > 0) {
  console.log('Motivos:');
  for (const motivo of motivos) console.log(`- ${motivo}`);
}
