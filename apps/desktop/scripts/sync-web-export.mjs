import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, '..');
const webOut = path.resolve(desktopRoot, '..', 'web', 'out');
const dest = path.join(desktopRoot, 'build', 'web-export');

if (!fs.existsSync(webOut)) {
  console.error(
    `sync-web-export: missing web export at ${webOut}. Run the web desktop build first (npm --workspace @openstudio/web run build:desktop).`
  );
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(webOut, dest, { recursive: true });
console.log(`sync-web-export: copied ${webOut} -> ${dest}`);
