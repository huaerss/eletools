import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { uIOhook, UiohookKey } from 'uiohook-napi'


let rightMouseDownTime: number

uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    // 记录当前时间戳
    rightMouseDownTime = Date.now();
  }
});

uIOhook.on('mouseup', (e) => {
  if (e.button === 2) {
    const duration = Date.now() - rightMouseDownTime;
    // 如果按下的时长超过500毫秒，则算作长按
    if (duration > 400) {
      // 获取选中的文本
      const selectedText = window.getSelection()!.toString();
      console.log('selectedText', selectedText);
    }
    // 清除记录的时间
    rightMouseDownTime = 0
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
