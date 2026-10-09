const { app, BrowserWindow, Tray, Menu, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Change this if you ever move to a custom domain
const APP_URL = 'https://app.quscer.com';

let mainWindow;
let tray;

// The sign-in is kept in the page's storage, which Electron writes to disk a little
// later. Write it now, so quitting (or Windows shutting down, or an update restarting
// the app) never loses a just-renewed sign-in and logs the person out.
function saveSignIn() {
  try {
    session.defaultSession.flushStorageData();
  } catch {
    // nothing to save yet
  }
}

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
    saveSignIn();
  });

  mainWindow.on('hide', saveSignIn);
  mainWindow.on('blur', saveSignIn);
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
  saveSignIn();
});

// Windows shutting down or signing out skips the normal quit.
app.on('ready', () => {
  const { powerMonitor } = require('electron');
  powerMonitor.on('shutdown', saveSignIn);
  powerMonitor.on('suspend', saveSignIn);
});

// Also every minute, in case the app is ended some other way (Task Manager, power cut).
setInterval(saveSignIn, 60 * 1000);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
