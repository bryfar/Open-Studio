#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const FEATURE_ROOT = path.resolve(process.cwd(), 'src', 'features');
const FEATURE_TEMPLATE_DIRS = ['components', 'hooks', 'lib', 'services', 'store', 'types', 'pages'];

function printHelp() {
  console.log(`
Uso:
  npm run create:feature -- <nombre-feature>

Ejemplos:
  npm run create:feature -- auth
  npm run create:feature -- user-profile

Opciones:
  --force    Sobrescribe archivos base si ya existen
  --help     Muestra esta ayuda
`);
}

function toKebabCase(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const hasHelp = args.includes('--help') || args.includes('-h');
  const force = args.includes('--force');
  const nameArg = args.find((arg) => !arg.startsWith('--'));
  return { hasHelp, force, nameArg };
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFileSafe(filePath, content, force = false) {
  if (fs.existsSync(filePath) && !force) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function main() {
  const { hasHelp, force, nameArg } = parseArgs();

  if (hasHelp || !nameArg) {
    printHelp();
    process.exit(hasHelp ? 0 : 1);
  }

  const featureName = toKebabCase(nameArg);
  if (!featureName || !/^[a-z0-9-]+$/.test(featureName)) {
    console.error('Nombre de feature inválido. Usa letras, números y guiones.');
    process.exit(1);
  }

  ensureDir(FEATURE_ROOT);

  const featureDir = path.join(FEATURE_ROOT, featureName);
  const alreadyExists = fs.existsSync(featureDir);
  ensureDir(featureDir);

  for (const dir of FEATURE_TEMPLATE_DIRS) {
    const target = path.join(featureDir, dir);
    ensureDir(target);
    writeFileSafe(path.join(target, '.gitkeep'), '', force);
  }

  const indexContent = `// Public API de la feature "${featureName}"\nexport {};\n`;
  const readmeContent = `# ${featureName}\n\nFeature module scaffold.\n`;

  const wroteIndex = writeFileSafe(path.join(featureDir, 'index.ts'), indexContent, force);
  const wroteReadme = writeFileSafe(path.join(featureDir, 'README.md'), readmeContent, force);

  console.log(`Feature creada: src/features/${featureName}`);
  if (alreadyExists) {
    console.log('La carpeta ya existía, se completó con estructura faltante.');
  }
  if (!wroteIndex || !wroteReadme) {
    console.log('Algunos archivos base ya existían (usa --force para sobrescribir).');
  }
}

main();
