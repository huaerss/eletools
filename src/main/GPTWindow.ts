// GPTWindow.ts
import { BrowserWindow, nativeTheme, screen, app } from 'electron';
import { join } from 'path';
import { readFileSync } from 'fs'; // 引入 fs 模块
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
  }
  else {
    const url = getDynamicURL();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0';

    // 创建浏览器窗口
    GPTWindow = new BrowserWindow({
      width: 1200 / scaleFactor,
      height: 800 / scaleFactor,
      autoHideMenuBar: true,
      show: false, // 初始化时不显示窗口
      title: "GPT窗口",
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: false,
      },
    });
    GPTWindow.loadURL(url, {
      userAgent: userAgent,
      httpReferrer: 'https://ai.xeryx.top/',
    });


    nativeTheme.themeSource = 'dark'; // 也可以设置为 'light' 或 'system'

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
function getDynamicURL(): string {
  try {
    // 假设文件路径为当前目录的 config.json
    const appPath = app.getAppPath();
    const configPath = join(appPath, 'config.json');


    // 读取文件并解析 JSON 内容
    const data = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(data);
    console.log(config.LoadURL)

    // 返回配置文件中的 URL，如果没有则返回默认 URL
    return config.LoadURL || 'https://ai.xeryx.top/';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    // 发生错误时返回默认 URL
    return 'https://ai.xeryx.top/';
  }
}
