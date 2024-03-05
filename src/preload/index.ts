import { contextBridge, clipboard, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");

async function performCopy() {
  await keyboard.pressKey(Key.LeftControl, Key.C);
  await keyboard.releaseKey(Key.LeftControl, Key.C);
}



let rightMouseDownTime = 0;
let rightMouseTimer; // 用于存储定时器 ID

uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    // 记录当前时间戳
    // rightMouseDownTime = Date.now();
    // // 如果之前已经有一个计时器，先清除它
    // if (rightMouseTimer) {
    //   clearTimeout(rightMouseTimer);
    // }
    performCopy().then(
      () => {
        console.log('全部cv操作执行完毕')
      }
    )
    setTimeout(() => {
      const copiedText = clipboard.readText();
       



    }, 500);

  }
});

uIOhook.on('mouseup', (e) => {
  if (e.button === 2) {
    // 如果鼠标右键提起，清除定时器
    clearTimeout(rightMouseTimer);
    rightMouseTimer = null; // 重置定时器变量
    const duration = Date.now() - rightMouseDownTime;
    // 重置按下的时间
    rightMouseDownTime = 0;
  }
});




uIOhook.start()
// Custom APIs for renderer
const api = {}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('uIOhook', uIOhook)


  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  window.uIOhook = uIOhook
}
