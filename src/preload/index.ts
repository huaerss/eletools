import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


contextBridge.exposeInMainWorld('closeAPI', {
  closeWindow: () => ipcRenderer.send('close-window')
});


const api = {

}

contextBridge.exposeInMainWorld('electronAPI', {
  onClipboardDataReceived: (callback) => {
    ipcRenderer.on('receive-clipboard-data', (_, data) => callback(data));
  },
  removeClipboardDataListener: () => {
    ipcRenderer.removeAllListeners('receive-clipboard-data');
  },
  onShouldShow: (callback) => {
    ipcRenderer.on('should-show', (_, data) => callback(data));
  }
});


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

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      ipcRenderer.send(channel, data)
    },
    invoke: (channel: string, data?: any) => {
      return ipcRenderer.invoke(channel, data)
    }
  }
})
