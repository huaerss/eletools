// GPTWindow.ts
import { BrowserWindow, nativeTheme, screen } from 'electron';
import { join } from 'path';
const os = process.platform;

export let GPTWindow: BrowserWindow | null = null;

export function createGPTWindow(): void {
  let scaleFactor = screen.getPrimaryDisplay().scaleFactor;
  if (os === 'darwin') {
    scaleFactor = 1;
  }

  if (GPTWindow) {
    if (GPTWindow.isMinimized()) {
      GPTWindow.restore();
    }
    GPTWindow.show();
    GPTWindow.focus();
  } else {

    GPTWindow = new BrowserWindow({
      width: 1200 / scaleFactor,
      height: 800 / scaleFactor,
      autoHideMenuBar: true,
      show: false, // 初始化时不显示窗口
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: false,
        nodeIntegration: false,       // 禁用 Node.js 集成
      }
    });

    GPTWindow.loadURL('https://newapi.asia') // CNPRM
      .then(() => {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/115.0.0.0 Safari/537.36';
        GPTWindow?.webContents.setUserAgent(userAgent);
      })
      .catch(err => {
        console.error('加载 URL 失败:', err);
      });

    nativeTheme.themeSource = 'dark'; // 也可以设置为 'light' 或 'system'

    // 移除默认打开开发者工具的代码
    // GPTWindow.webContents.openDevTools && GPTWindow.webContents.openDevTools();

    // 添加按键监听以在按下 F12 时打开开发者工具
    GPTWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
        if (GPTWindow?.webContents.isDevToolsOpened()) {
          GPTWindow.webContents.closeDevTools();
        } else {
          GPTWindow?.webContents.openDevTools();
        }
        event.preventDefault();
      }
    });

    GPTWindow.once('ready-to-show', () => {
      GPTWindow?.setAlwaysOnTop(true);
      GPTWindow?.show();
      setTimeout(() => {
        if (GPTWindow) {
          GPTWindow.setAlwaysOnTop(false); // 取消顶层设置
        }
      }, 500);
    });

    GPTWindow.on('closed', () => {
      GPTWindow = null;
    });

  }
}
