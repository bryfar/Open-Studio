const path = require('node:path');
const fs = require('node:fs/promises');
const http = require('node:http');
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const handler = require('serve-handler');

const isDev = !app.isPackaged;
const STORAGE_DIR_NAME = 'local-storage';
const STORAGE_FILE_NAME = 'kv-store.json';

function resolveDevWebEntry() {
  if (isDev) {
    return process.env.WEB_DEV_SERVER_URL || 'http://127.0.0.1:3000';
  }
  return '';
}

function getPackagedWebDir() {
  return path.join(process.resourcesPath, 'web-out');
}

async function startPackagedWebServer() {
  const publicDir = getPackagedWebDir();
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: publicDir,
      cleanUrls: false,
      rewrites: [{ source: '**', destination: '/index.html' }],
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

function getStorageFilePath() {
  return path.join(app.getPath('userData'), STORAGE_DIR_NAME, STORAGE_FILE_NAME);
}

async function ensureStorageFile() {
  const filePath = getStorageFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '{}', 'utf8');
  }
  return filePath;
}

async function readKvStore() {
  const filePath = await ensureStorageFile();
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeKvStore(nextState) {
  const filePath = await ensureStorageFile();
  await fs.writeFile(filePath, JSON.stringify(nextState), 'utf8');
}

async function saveBinaryToPath(defaultFileName, bytes, filters) {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('documents'), defaultFileName),
    filters: filters ?? [],
  });
  if (canceled || !filePath) {
    return { canceled: true };
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(bytes));
  return { canceled: false, filePath };
}

function registerIpcHandlers() {
  ipcMain.handle('desktop:storage:get', async (_event, key) => {
    const state = await readKvStore();
    return state[key];
  });

  ipcMain.handle('desktop:storage:set', async (_event, key, value) => {
    const state = await readKvStore();
    state[key] = value;
    await writeKvStore(state);
    return true;
  });

  ipcMain.handle('desktop:storage:del', async (_event, key) => {
    const state = await readKvStore();
    delete state[key];
    await writeKvStore(state);
    return true;
  });

  ipcMain.handle('desktop:file:save-bytes', async (_event, payload) => {
    return saveBinaryToPath(payload.defaultFileName, payload.bytes, payload.filters);
  });

  ipcMain.handle('desktop:file:save-text', async (_event, payload) => {
    const bytes = Buffer.from(payload.text, 'utf8');
    return saveBinaryToPath(payload.defaultFileName, bytes, payload.filters);
  });
}

async function createWindow() {
  const packagedServer = !isDev ? await startPackagedWebServer() : null;
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#0b0f17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = new Set(['media', 'display-capture', 'fullscreen']);
    callback(allowed.has(permission));
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isDev) return;
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  if (isDev) {
    void win.loadURL(resolveDevWebEntry());
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadURL(packagedServer.url);
    win.on('closed', () => {
      void packagedServer.close();
    });
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  void createWindow();

  if (!isDev) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
