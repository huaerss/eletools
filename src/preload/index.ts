import { contextBridge, clipboard, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");


async function performCopy() {
  await keyboard.pressKey(Key.LeftControl, Key.C);
  keyboard.releaseKey(Key.LeftControl, Key.C);

}
function handleRightClick() {
  performCopy()
  setTimeout(() => {
    const copiedText = clipboard.readText();
    ipcRenderer.send('clipboard', copiedText);
  }, 500);


}

contextBridge.exposeInMainWorld('electronAPI', {
  onClipboardDataReceived: (callback) => {
    ipcRenderer.on('receive-clipboard-data', (_, data) => callback(data));


  },
  removeClipboardDataListener: () => {
    ipcRenderer.removeAllListeners('receive-clipboard-data');
  },
});
// contextBridge.exposeInMainWorld('electronAPI', {
//   closeMainWindow: () => ipcRenderer.send('close-main-window')
// });




// let rightMouseDownTime = 0;
// let rightMouseTimer; // 用于存储定时器 ID


uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    //  并且按下的时间
    handleRightClick()
  }
});

// uIOhook.on('mouseup', (e) => {
//   if (e.button === 2) {
//     // 如果鼠标右键提起，清除定时器
//     clearTimeout(rightMouseTimer);
//     rightMouseTimer = null; // 重置定时器变量
//     const duration = Date.now() - rightMouseDownTime;
//     // 重置按下的时间
//     rightMouseDownTime = 0;
//   }
// });




uIOhook.start()
// Custom APIs for renderer
const api = {

}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api);


  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI

  // @ts-ignore (define in dts)
  window.electronAPI = api; // 如果没有启用上下文隔离
  // window.uIOhook = uIOhook
}
