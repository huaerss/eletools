import { app, BrowserWindow, ipcMain, clipboard, shell, screen } from 'electron';
import { join } from 'path';
import fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { uIOhook } from 'uiohook-napi';
import { createGPTWindow, GPTWindow } from './GPTWindow';
import { createTray } from './Tray';
const { keyboard, Key } = require("@nut-tree/nut-js");
const axios = require('axios');
const os = process.platform;

let mainWindow: BrowserWindow;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 350,
    show: false, // 先隐藏
    alwaysOnTop: true, // 置顶
    frame: false, // 无边框
    // backgroundColor: '#00000000', // 背景透明
    transparent: true,
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
    // mainWindow?.close();
    // GPTWindow?.close();
    // 将mainwindow 隐藏
    mainWindow?.hide();
    GPTWindow?.hide()
  });


  const appPath = app.getAppPath()
  const configPath = join(appPath, 'config.json');
  const data = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(data);
  //   调用 翻译 事件处理程序
  ipcMain.handle('perform-request', async (_, arg) => {
    const francModule = await import('franc');
    if (francModule.franc(arg.data.text) == 'cmn') {
      arg.data.target_lang = 'en';
    }

    const response = await axios.post('https://api.deeplx.org/0oWyL9jvBql-MRdzVMbT83CY-cej8rgAFwThk9F7xrw/translate', arg.data);
    return response.data;
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
      response.data.on('error', (err) => {
        console.log('err', err)
      })
      response.data.on('data', chunk => {
        if (chunk) {
          const chunkAsString = chunk.toString().trim();
          const jsonStr = chunkAsString.replace(/^data: /, '');
          try {
            const data = JSON.parse(jsonStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              event.sender.send('GPT-stream-chunk', content);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      });
      response.data.on('end', () => {
        event.sender.send('GPT-stream-end');
      });
    } catch (error) {
      console.log('GPT-CATH', error.toString())
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
function handleRightClick() {
  performCopy()
  setTimeout(() => {
    const copiedText = clipboard.readText();
    mainWindow.webContents.send('receive-clipboard-data', copiedText);
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true);
  }, 500);
}
const currentPos = { x: 0, y: 0 };
let rightMouseDownTimer: any = null;
uIOhook.on('mousedown', (e) => {
  // 获取当前屏幕的缩放因子
  const display = screen.getDisplayNearestPoint({ x: e.x, y: e.y });
  let scaleFactor = display.scaleFactor;
  if (os === 'darwin') {
    scaleFactor = 1;
  }
  switch (e.button) {
    case 2: // 右键
      if (mainWindow) {
        rightMouseDownTimer = setTimeout(() => {
          // 获取所有显示器的信息
          const displays = screen.getAllDisplays();
          // 找到鼠标所在的显示器
          const currentDisplay = screen.getDisplayNearestPoint({ x: e.x, y: e.y });

          // 调整鼠标坐标以适应缩放因子
          const adjustedX = Math.round(e.x / scaleFactor);
          const adjustedY = Math.round(e.y / scaleFactor);

          // 计算窗口的预期位置
          let windowX = adjustedX - 280;
          let windowY = adjustedY - 160;

          // 获取窗口大小
          const [width, height] = mainWindow.getSize();

          // 确保窗口不会超出屏幕左边界
          windowX = Math.max(currentDisplay.bounds.x, windowX);

          // 确保窗口不会超出屏幕右边界
          windowX = Math.min(currentDisplay.bounds.x + currentDisplay.bounds.width - width, windowX);

          // 确保窗口不会超出屏幕上边界
          windowY = Math.max(currentDisplay.bounds.y, windowY);

          // 确保窗口不会超出屏幕下边界
          windowY = Math.min(currentDisplay.bounds.y + currentDisplay.bounds.height - height, windowY);

          handleRightClick();
          mainWindow.setPosition(windowX, windowY);
          currentPos.x = e.x;
          currentPos.y = e.y;
        }, 250);
      }
      break;
    // case 3: // 滚轮键

    //   if (mainWindow) {
    //     rightMouseDownTimer = setTimeout(() => {
    //       handleRightClick();
    //       mainWindow.setPosition(e.x - 280, e.y - 160);
    //       currentPos.x = e.x;
    //       currentPos.y = e.y;
    //     }, 250);
    //   }


  }
});
uIOhook.on('mousemove', (e) => {
  if (mainWindow && mainWindow.isVisible()) {
    //  如果鼠标移动的距离超过 300，隐藏窗口
    if (Math.abs(e.x - currentPos.x) > 400 || Math.abs(e.y - currentPos.y) > 400) {
      mainWindow.hide();
    }
  }
}
);

uIOhook.on('mouseup', (e) => {
  if (e.button === 2) {
    if (rightMouseDownTimer) {
      clearTimeout(rightMouseDownTimer);
      rightMouseDownTimer = null;
    }
  }
});
uIOhook.on('keydown', (e) => {
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
