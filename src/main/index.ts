// main.ts
import { app, BrowserWindow, ipcMain, clipboard, shell } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { uIOhook } from 'uiohook-napi';
import { createGPTWindow, GPTWindow } from './GPTWindow'; // 导入 GPTWindow 模块
const { keyboard, Key } = require("@nut-tree/nut-js");

const axios = require('axios');

let mainWindow: BrowserWindow;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 100,
    show: false, // 先隐藏
    alwaysOnTop: true, // 置顶
    frame: false, // 无边框
    backgroundColor: '#FFFAE8', // 背景颜色
    autoHideMenuBar: true, // 隐藏菜单栏
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
    }
  });

  // mainWindow.webContents.openDevTools();

  ipcMain.on('close-window', () => {
    mainWindow?.close();
    GPTWindow?.close();
  });

  ipcMain.on('mouse-enter', () => {
    const [_, y] = mainWindow?.getPosition() || [];
    if (y === 0) {
      mainWindow?.setSize(500, 200);
    }
  });

  ipcMain.on('mouse-leave', () => {
    const [_, y] = mainWindow?.getPosition() || [];
    if (y === 0) {
      mainWindow?.setSize(500, 1);
    }
  });

  ipcMain.on('changeModel', (__, status) => {
    const [currentX, _] = mainWindow?.getPosition() || [];
    if (status === 'zhiding') {
      mainWindow?.setPosition(currentX, 0);
    } else {
      mainWindow?.setPosition(currentX, 1);
    }
  });

  ipcMain.handle('perform-request', async (_, arg) => {
    const francModule = await import('franc');

    console.log(arg.data);
    console.log(francModule.franc(arg.data.text));
    if (francModule.franc(arg.data.text) == 'cmn') {
      arg.data.target_lang = 'en';
    }

    const response = await axios.post('https://api.deeplx.org/0oWyL9jvBql-MRdzVMbT83CY-cej8rgAFwThk9F7xrw/translate', arg.data);
    return response.data;
  });

  ipcMain.handle('GPT', async (event, arg) => {
    try {
      const response = await axios.post('https://popai.zhucn.org/v1/chat/completions', arg.data, {
        headers: arg.headers,
        responseType: 'stream'
      });


      response.data.on('data', chunk => {
        const chunkAsString = chunk.toString();
        // 使用正则表达式匹配 content 字段的值
        const regex = /"content":\s*"([^"]*)"/g;
        let match;
        while ((match = regex.exec(chunkAsString)) !== null) {
          event.sender.send('GPT-stream-chunk', match[1]);

        }
      });

      response.data.on('end', () => {
        event.sender.send('GPT-stream-end');
      });
    } catch (error) {
      event.sender.send('GPT-stream-error', error);
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('move', () => {
    const [_, y] = mainWindow?.getPosition() || [];
    if (y === 0) {
      mainWindow.webContents.send('change-draggable-region', 'none');
      mainWindow.setSize(500, 10);
    } else {
      mainWindow.webContents.send('change-draggable-region', 'drag');
    }
  });

  mainWindow.setPosition(1200, 1);
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();
  electronApp.setAppUserModelId('gptele');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });




  uIOhook.start();
});
async function performCopy() {
  await keyboard.pressKey(Key.LeftControl, Key.C);
  keyboard.releaseKey(Key.LeftControl, Key.C);


}
function handleRightClick() {
  performCopy()
  setTimeout(() => {
    const copiedText = clipboard.readText();
    console.log(copiedText);
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
    if (rightMouseDownTimer) {
      clearTimeout(rightMouseDownTimer);
      rightMouseDownTimer = null;
    }
  }
});
uIOhook.on('keydown', (e) => {
  if (e.altKey && e.keycode === 83) { // 83 是 . 的 keycode
    if (GPTWindow && GPTWindow.isVisible()) {
      GPTWindow.minimize();
    } else {
      createGPTWindow();
      // const copiedText = clipboard.readText();
      // ipcMain.emit('paste-clipboard', null, copiedText);

    }
  }


});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
