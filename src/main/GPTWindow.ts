// GPTWindow.ts
import { BrowserWindow, ipcMain, nativeTheme, screen } from 'electron';
import { join } from 'path';

export let GPTWindow: BrowserWindow | null = null;

export function createGPTWindow(): void {
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
  console.log('scaleFactor:', scaleFactor);
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
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    GPTWindow.loadURL('https://cnprm.com/');
    nativeTheme.themeSource = 'dark'; // 也可以设置为 'light' 或 'system'

    GPTWindow.once('ready-to-show', () => {
      GPTWindow?.setAlwaysOnTop(true);
      GPTWindow?.show();
      setTimeout(() => {
        if (GPTWindow) {
          GPTWindow.setAlwaysOnTop(false); // Cancel the top-most setting after a short delay
        }
      }, 500);
    });

    GPTWindow.on('closed', () => {
      GPTWindow = null;
    });

    // Setting up the listener for paste-clipboard
    // ipcMain.on('paste-clipboard', (event, arg) => {
    //   const copiedText = arg;
    //   const escapedText = escapeForJavaScript(copiedText);
    //   const script = `document.querySelector('#prompt-textarea').value = '${escapedText}';`;
    //   GPTWindow?.webContents.executeJavaScript(script).catch(err => {
    //     console.error("Script execution error:", err);
    //   });
    // });
  }
}

function escapeForJavaScript(str: string): string {
  return str.replace(/\\/g, '\\\\') // 转义反斜杠
    .replace(/'/g, "\\'")   // 转义单引号
    .replace(/"/g, '\\"')   // 转义双引号
    .replace(/\n/g, '\\n')  // 转义换行符
    .replace(/\r/g, '\\r')  // 转义回车符
    .replace(/\u2028/g, '\\u2028') // 转义行分隔符
    .replace(/\u2029/g, '\\u2029'); // 转义段落分隔符
}
