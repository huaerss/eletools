// GPTWindow.ts
import { BrowserWindow } from 'electron';
import { join } from 'path';

let GPTWindow: BrowserWindow | null = null;

export function createGPTWindow(): void {
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

export { GPTWindow };
