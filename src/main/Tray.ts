import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
const path = require('path');


let tray: Tray;

export function createTray(mainWindow: BrowserWindow): void {
  const exitpath = path.join(__dirname, '../../resources/exit.png');
  const iconPath = path.join(__dirname, '../../resources/tray.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  let exitIcon = nativeImage.createFromPath(exitpath);
  exitIcon = exitIcon.resize({ width: 16, height: 16 });
  if (process.platform === 'darwin') {
    // 对 macOS 系统进行图标大小调整
    trayIcon = trayIcon.resize({ width: 22, height: 22 });
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([

    {
      label: '退出',
      icon: exitIcon,
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('eleTools');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}
