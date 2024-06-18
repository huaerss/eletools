// GPTWindow.ts
import { BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

export let GPTWindow: BrowserWindow | null = null;

export function createGPTWindow(): void {
  if (GPTWindow) {
    if (GPTWindow.isMinimized()) GPTWindow.restore();
    GPTWindow.setAlwaysOnTop(true);
    GPTWindow.show();
    GPTWindow.focus();
    console.log('Window should be on top and focused');
  } else {
    GPTWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    GPTWindow.loadURL('https://new.oaifree.com/?temporary-chat=true');

    GPTWindow.once('ready-to-show', () => {
      GPTWindow?.show();
      GPTWindow?.setAlwaysOnTop(true);
      console.log('Window created and set to always on top');
    });

    GPTWindow.webContents.once('did-finish-load', () => {


      ipcMain.on('paste-clipboard', (event, arg) => {
        const copiedText = arg;
        const escapedText = escapeForJavaScript(copiedText);
        const script = `document.querySelector('#prompt-textarea').value = '${escapedText}';`;
        GPTWindow?.webContents.executeJavaScript(script).catch(err => {
          console.error("Script execution error:", err);
        });
      });
    });

    GPTWindow.on('closed', () => {
      GPTWindow = null;
      ipcMain.removeAllListeners('paste-clipboard'); // Clean up the listener
      console.log('Window closed and listeners cleaned up');
    });
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
