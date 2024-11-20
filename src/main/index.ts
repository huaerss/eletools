import { app, BrowserWindow, ipcMain, clipboard, shell, screen } from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { uIOhook } from 'uiohook-napi';
import { createGPTWindow, GPTWindow } from './GPTWindow';
import { createTray } from './Tray';
const { keyboard, Key } = require("@nut-tree/nut-js");
const axios = require('axios');
const os = process.platform;
import config from './readConfig';

let mainWindow: BrowserWindow;
let settingsWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 350,
    show: false, // 先隐藏
    alwaysOnTop: true, // 置顶
    frame: false, // 无边框
    transparent: true,
    autoHideMenuBar: true, // 隐藏菜单栏
    webPreferences: {
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
    }
  });

  //  控制台
  // mainWindow.webContents.openDevTools();

  ipcMain.on('close-window', () => {
    mainWindow?.hide();
    GPTWindow?.hide()
  });


  //   调用 翻译 事件处理程序
  ipcMain.handle('perform-request', async (_, arg) => {

    try {
      const francModule = await import('franc');
      if (francModule.franc(arg.data.text) == 'cmn') {
        arg.data.target_lang = 'en';
      }

      const response = await axios.post('https://api.deeplx.org/0oWyL9jvBql-MRdzVMbT83CY-cej8rgAFwThk9F7xrw/translate', arg.data);
      return response.data;
    } catch (error) {
      console.error('翻译失败:', error);
      return error.data;
    }
  });

  ipcMain.handle('GPT', async (event, arg) => {
    try {
      const response = await axios.post(config.requestUrl, {
        ...arg.data,
        model: config.requestModel,
      }, {
        headers: {
          "authorization": config.requestToken
        },
        responseType: 'stream'
      });

      response.data.on('data', chunk => {
        if (chunk) {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.trim() === 'data: [DONE]') {
              event.sender.send('GPT-stream-end');
              return;
            }
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.replace(/^data: /, '').trim();
                const data = JSON.parse(jsonStr);
                if (data.choices?.[0]?.delta?.content) {
                  event.sender.send('GPT-stream-chunk', data.choices[0].delta.content);
                }
              } catch (error) {
                // 忽略解析错误，继续处理下一行
                continue;
              }
            }
          }
        }
      });

      response.data.on('error', (err) => {
        console.error('Stream error:', err);
        event.sender.send('GPT-stream-error', err.message);
      });
    } catch (error) {
      console.error('GPT-ERROR:', error.toString());
      event.sender.send('GPT-stream-error', error.data.message);
    }
  });

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
  createTray(mainWindow);
  electronApp.setAppUserModelId('gptele');// 设置应用图标

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });




  uIOhook.start();
});

async function performCopy() {
  // 检测当前是什么系统
  if (os == 'darwin') {
    await keyboard.pressKey(Key.LeftSuper, Key.C);
    keyboard.releaseKey(Key.LeftSuper, Key.C);
  } else {
    await keyboard.pressKey(Key.LeftControl, Key.C);
    keyboard.releaseKey(Key.LeftControl, Key.C);
  }
}
function handleRightClick(type: string) {
  performCopy()
  setTimeout(() => {
    const copiedText = clipboard.readText();
    mainWindow.webContents.send('receive-clipboard-data', copiedText);
    mainWindow.webContents.send('should-show', type);
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true);
  }, 500);
}

uIOhook.on('keydown', (e) => {
  // Alt + T 翻译
  if (e.altKey && e.keycode === 2) { // 20是T键的keycode
    if (mainWindow) {
      const mousePos = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint({ x: mousePos.x, y: mousePos.y });
      let scaleFactor = display.scaleFactor;
      if (os === 'darwin') {
        scaleFactor = 1;
      }

      // 调整鼠标坐标以适应缩放因子
      const adjustedX = Math.round(mousePos.x / scaleFactor);
      const adjustedY = Math.round(mousePos.y / scaleFactor);

      // 计算窗口的预期位置
      let windowX = adjustedX - 280;
      let windowY = adjustedY - 160;

      // 获取窗口大小
      const [width, height] = mainWindow.getSize();

      // 确保窗口不会超出屏幕边界
      windowX = Math.max(display.bounds.x, windowX);
      windowX = Math.min(display.bounds.x + display.bounds.width - width, windowX);
      windowY = Math.max(display.bounds.y, windowY);
      windowY = Math.min(display.bounds.y + display.bounds.height - height, windowY);

      handleRightClick('1');
      mainWindow.setPosition(windowX, windowY);
    }
  }

  // Alt + G GPT
  if (e.altKey && e.keycode === 3) { // 34是G键的keycode
    if (mainWindow) {
      const mousePos = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint({ x: mousePos.x, y: mousePos.y });
      let scaleFactor = display.scaleFactor;
      if (os === 'darwin') {
        scaleFactor = 1;
      }

      // 调整鼠标坐标以适应缩放因子
      const adjustedX = Math.round(mousePos.x / scaleFactor);
      const adjustedY = Math.round(mousePos.y / scaleFactor);

      // 计算窗口的预期位置
      let windowX = adjustedX - 280;
      let windowY = adjustedY - 160;

      // 获取窗口大小
      const [width, height] = mainWindow.getSize();

      // 确保窗口不会超出屏幕边界
      windowX = Math.max(display.bounds.x, windowX);
      windowX = Math.min(display.bounds.x + display.bounds.width - width, windowX);
      windowY = Math.max(display.bounds.y, windowY);
      windowY = Math.min(display.bounds.y + display.bounds.height - height, windowY);

      handleRightClick('2');
      mainWindow.setPosition(windowX, windowY);
    }
  }

  // 保留原有的 Alt+S 逻辑
  if (e.altKey && (e.keycode === 83 || e.keycode === 52)) {
    if (GPTWindow) {
      if (GPTWindow.isVisible()) {
        GPTWindow.minimize();
      } else {
        GPTWindow.show();
      }
    } else {
      createGPTWindow();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 保存快捷键设置
ipcMain.on('save-shortcuts', (_event, shortcuts) => {
  // try {
  //   store.set('shortcuts', shortcuts)
  // } catch (error) {
  //   console.error('保存快捷键设置失败:', error)
  // }
})

// 获取快捷键设置
ipcMain.handle('get-shortcuts', () => {
  // try {
  //   return store.get('shortcuts') || {
  //     translate: 'Alt+1',
  //     gpt: 'Alt+2'
  //   }
  // } catch (error) {
  //   console.error('获取快捷键设置失败:', error)
  //   return {
  //     translate: 'Alt+1',
  //     gpt: 'Alt+2'
  //   }
  // }
})
