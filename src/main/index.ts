import { app, shell, BrowserWindow, ipcMain, clipboard } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");
const axios = require('axios');
app.on('ready', createWindow);
let mainWindow; // 全局变量
let GPTWindow; // 新窗口全局变量


function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 100,
    show: false, // 先隐藏
    alwaysOnTop: true, // 置顶
    frame: false, // 无边框
    // transparent: true,

    backgroundColor: '#FFFAE8',
    // resizable: false,
    autoHideMenuBar: true, // 隐藏菜单栏

    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
    }
  })

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
    const response = await axios.post('https://api.deeplx.org/0oWyL9jvBql-MRdzVMbT83CY-cej8rgAFwThk9F7xrw/translate', arg.data,
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


  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
function createGPTWindow() {
  if (GPTWindow) {
    if (GPTWindow.isMinimized()) GPTWindow.restore(); // 如果窗口被最小化则恢复
    GPTWindow.setAlwaysOnTop(true);  // 将窗口置顶
    GPTWindow.show();  // 显示窗口
    GPTWindow.focus();  // 聚焦窗口
    GPTWindow.setAlwaysOnTop(false);  // 取消置顶以恢复默认行为
  } else {
    GPTWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      autoHideMenuBar: true, // 隐藏菜单栏
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
      }
    });

    GPTWindow.loadURL('https://new.oaifree.com/?temporary-chat=true');

    GPTWindow.on('closed', () => {
      GPTWindow = null;
    });
  }
}


uIOhook.on('keydown', (e) => {
  if (e.altKey && e.keycode === 83) { // 83 是 . 的 keycode
    if (GPTWindow) {
      if (GPTWindow.isVisible()) {
        GPTWindow.minimize();
      } else {
        createGPTWindow();
      }
    } else {
      createGPTWindow();
    }
  }
});



app.whenReady().then(() => {
  electronApp.setAppUserModelId('gptele')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test.
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
    mainWindow.webContents.send('receive-clipboard-data', copiedText);
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


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

