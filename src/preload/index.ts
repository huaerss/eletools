import { contextBridge, clipboard, ipcRenderer,contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { uIOhook } from 'uiohook-napi'
const { keyboard, Key } = require("@nut-tree/nut-js");


async function performCopy() {
  await keyboard.pressKey(Key.LeftControl, Key.C);
  await keyboard.releaseKey(Key.LeftControl, Key.C);
}
function handleRightClick() {
  performCopy();
  setTimeout(() => {
    const copiedText = clipboard.readText();

    console.log('右键按下');

  }, 500);
}




// let rightMouseDownTime = 0;
// let rightMouseTimer; // 用于存储定时器 ID


uIOhook.on('mousedown', (e) => {
  if (e.button === 2) {
    handleRightClick()



    // const data = {
    //   text: [copiedText],
    // };

    // axios.post('https://translates.me/v2/translate', data, {
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })
    //   .then(response => {
    //     console.log("翻译后的内容:", response.data.data); // 输出翻译的结果
    //   })
    //   .catch(error => {
    //     console.error('An error occurred:', error);
    //   });




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
    contextBridge.exposeInMainWorld('electronAPI', api);
    contextBridge.exposeInMainWorld('uIOhook', uIOhook)


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
