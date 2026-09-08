const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Change this if you ever move to a custom domain
const APP_URL = 'https://quscer-frontend.vercel.app';

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Closing the window minimizes to tray instead of quitting,
  // so a POS till stays "open" like a real terminal app
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Quscer OS', click: () => mainWindow.show() },
    { label: 'Check for updates', click: () => autoUpdater.checkForUpdatesAndNotify() },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Quscer OS');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Silently checks GitHub Releases for a newer version and
  // installs it in the background the next time the app restarts
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
