import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


contextBridge.exposeInMainWorld('closeAPI', {
  closeWindow: () => ipcRenderer.send('close-window')
});

// Custom APIs for renderer
const api = {

}

contextBridge.exposeInMainWorld('electronAPI', {
  onClipboardDataReceived: (callback) => {
    ipcRenderer.on('receive-clipboard-data', (_, data) => callback(data));
  },
  removeClipboardDataListener: () => {
    ipcRenderer.removeAllListeners('receive-clipboard-data');
  },
});
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
}
