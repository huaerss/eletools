import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
const axios = require('axios');
app.on('ready', createWindow);

function createWindow(): void {
  // Create the browser window.
  let mainWindow = new BrowserWindow({
    width: 500,
    height: 100,
    show: false,
    alwaysOnTop: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),

    }
  })
  ipcMain.on('clipboard', (_, copiedText) => {
    mainWindow.webContents.send('receive-clipboard-data', copiedText);
  });
  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  ipcMain.handle('perform-request', async (_, arg) => {
    const response = await axios.post('https://api.deeplx.org/translate', arg.data,
      arg.Headers);
    return response.data;
  });
  ipcMain.handle('GPT', async (_, arg) => {
    try {
      const response = await axios.post('https://api.double.bot/api/v1/chat', arg.data, {
        headers: arg.headers // Change to lowercase
      });
      return response.data; // Return only the data property
    } catch (error) {
      // console.error('Error in GPT IPC:', error);
      throw error;
    }
  });

  mainWindow.on('ready-to-show', () => {
    // 打开开发者工具
    // mainWindow.webContents.openDevTools()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))



  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
