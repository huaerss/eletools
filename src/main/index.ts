import { app, shell, BrowserWindow, ipcMain, clipboard, ipcRenderer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");
const axios = require('axios');
app.on('ready', createWindow);
let mainWindow; // 全局变量

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 100,
    show: false,
    alwaysOnTop: true,
    frame: false,
    // transparent: true,

    backgroundColor: '#FFFAE8',
    // resizable: false,
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
  ipcMain.on('mouse-enter', () => {
    const [_, y] = mainWindow.getPosition();
    if (y == 0) {
      mainWindow.setSize(500, 200);
    }
  });
  ipcMain.on('mouse-leave', () => {
    const [_, y] = mainWindow.getPosition();
    if (y == 0) {
      mainWindow.setSize(500, 1);
    }
  });

  ipcMain.on('changeModel', (__, status) => {
    const [currentX, _] = mainWindow.getPosition();
    if (status == 'zhiding') {
      mainWindow.setPosition(currentX, 0);

    } else {
      mainWindow.setPosition(currentX, 1);
      // mainWindow.setSize(globalwith, globalheight);
    }

  })

  ipcMain.handle('perform-request', async (_, arg) => {
    const response = await axios.post('https://api.deeplx.org/translate', arg.data,
      arg.Headers);
    return response.data;
  });
  ipcMain.handle('GPT', async (event, arg) => {
    try {
      const response = await axios.post('https://demo.gyhtop.top:7177/v1/chat/completions', arg.data, {
        headers: arg.headers,
      });
      return response.data.choices[0].message.content;

    } catch (error) {
      event.sender.send('GPT-stream-error', error);
    }
  });

  mainWindow.on('ready-to-show', () => {
    // 打开开发者工具
    // mainWindow.webContents.openDevTools()
    mainWindow.show()
  })


  mainWindow.on('move', () => {
    const [_, y] = mainWindow.getPosition();
    if (y == 0) {
      mainWindow.webContents.send('change-draggable-region', 'none');
      console.log('none');
      mainWindow.setSize(500, 10);
    } else {
      mainWindow.webContents.send('change-draggable-region', 'drag');
    }

  })
  mainWindow.setPosition(1200, 1);
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

async function performCopy() {
  await keyboard.pressKey(Key.LeftControl, Key.C);
  keyboard.releaseKey(Key.LeftControl, Key.C);


}
function handleRightClick() {
  console.log('right click');
  performCopy()
  setTimeout(() => {
    const copiedText = clipboard.readText();
    console.log(copiedText);
    mainWindow.webContents.send('clipboard', copiedText);
  }, 500);
}

let rightMouseDownTimer: any = null;
uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    rightMouseDownTimer = setTimeout(handleRightClick, 250);
  }
});

uIOhook.on('mouseup', (e) => {
  if (e.button === 2) {

    // 清除计时器
    if (rightMouseDownTimer) {
      clearTimeout(rightMouseDownTimer);
      rightMouseDownTimer = null;
    }
  }
});




uIOhook.start()

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

