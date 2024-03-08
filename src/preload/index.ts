import { contextBridge, clipboard, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");

contextBridge.exposeInMainWorld('closeAPI', {
  closeWindow: () => ipcRenderer.send('close-window')
});
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





let rightMouseDownTimer: any = null;

uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    // 开始计时是否达到250ms
    rightMouseDownTimer = setTimeout(handleRightClick, 250);
  }
});

uIOhook.on('mouseup', (e) => {
  if (e.button === 2) {
    // 清除计时器
    if (rightMouseDownTimer) {
      clearTimeout(rightMouseDownTimer);
      rightMouseDownTimer = null;
    }
  }
});




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
