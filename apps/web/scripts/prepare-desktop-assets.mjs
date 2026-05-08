import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const publicFfmpegDir = path.join(root, 'public', 'ffmpeg');

const files = [
  {
    from: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js',
    to: path.join(publicFfmpegDir, 'ffmpeg-core.js'),
  },
  {
    from: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm',
    to: path.join(publicFfmpegDir, 'ffmpeg-core.wasm'),
  },
  {
    from: 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js',
    to: path.join(publicFfmpegDir, 'ffmpeg-core.worker.js'),
  },
  {
    from: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js',
    to: path.join(publicFfmpegDir, 'worker.js'),
  },
];

async function main() {
  await fs.mkdir(publicFfmpegDir, { recursive: true });
  for (const file of files) {
    const response = await fetch(file.from);
    if (!response.ok) {
      throw new Error(`No se pudo descargar ${file.from}. Status: ${response.status}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(file.to, data);
  }
  process.stdout.write('Desktop FFmpeg assets copied to public/ffmpeg.\n');
}

main().catch((error) => {
  process.stderr.write(`Failed to copy desktop assets: ${String(error)}\n`);
  process.exit(1);
});
