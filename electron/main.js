/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Handle native directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset', // Modern macOS look
    backgroundColor: '#ffffff',
    title: 'Kiro',
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // In development, load from the Next.js dev server
  // In production, we would load the static build files
  const startUrl = isDev 
    ? 'http://localhost:3005' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  win.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
