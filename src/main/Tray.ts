import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
const path = require('path');


let tray: Tray;

export function createTray(mainWindow: BrowserWindow): void {
  const exitpath = path.join(__dirname, '../../resources/exit.png');
  const iconPath = path.join(__dirname, '../../resources/tray.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  let exitIcon = nativeImage.createFromPath(exitpath);
  exitIcon = exitIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    // {
    //   label: '显示应用',
    //   click: () => {
    //     if (mainWindow) {
    //       mainWindow.show();
    //     }
    //   }
    // },
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
