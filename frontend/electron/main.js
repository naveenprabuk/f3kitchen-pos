const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let backend;

// Packaged app: start the bundled Spring Boot jar (needs Java 17+ installed). In dev, run the backend yourself.
function startBackend() {
  const jar = path.join(process.resourcesPath, 'backend.jar');
  if (app.isPackaged && fs.existsSync(jar)) {
    const db = path.join(app.getPath('userData'), 'f3kitchen');
    backend = spawn('java', ['-jar', jar, `--spring.datasource.url=jdbc:h2:file:${db}`], { stdio: 'ignore' });
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366, height: 850, backgroundColor: '#1b1b1b', autoHideMenuBar: true, title: 'F3 Kitchen',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  if (process.env.ELECTRON_DEV) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}

// Receipt printing: set SILENT=true in src/receipt.js to skip the dialog and use the default (thermal) printer.
ipcMain.handle('print-html', (_e, html, silent) => new Promise((resolve) => {
  const w = new BrowserWindow({ show: false });
  w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  w.webContents.on('did-finish-load', () =>
    w.webContents.print({ silent, printBackground: true }, (ok, err) => { w.close(); resolve({ ok, err }); }));
}));

app.whenReady().then(() => { startBackend(); createWindow(); });
app.on('before-quit', () => backend && backend.kill());
app.on('window-all-closed', () => app.quit());
