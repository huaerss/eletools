<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'

const clipboardData = ref('左键选中需要翻译的文本,右键短长按即可复制');
declare const window: {
  electronAPI: {
    onClipboardDataReceived: (callback: (res: string) => void) => void;
    removeClipboardDataListener: () => void;
  };
  electron: {
    ipcRenderer: {
      invoke: (channel: string, data: any) => Promise<any>;
    };
  };
  closeAPI: {
    closeWindow: () => void;
  };
};


onMounted(() => {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      window.closeAPI.closeWindow();
    }
  });
  window.electronAPI.onClipboardDataReceived(async (res) => {
    clipboardData.value = '翻译中...'
    if (typeof (res) === 'string') {
      const result = await window.electron.ipcRenderer.invoke('perform-request', {
        data: {
          text: [res],
          "target_lang": "ZH"
        },
        Headers: {
          "Content-Type": "application/json"
        }
      });
      clipboardData.value = result.data;

    }

  });
});

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener();
});

</script>

<template>
  <div class="draggable">
    <p>{{ clipboardData }}</p>
  </div>
</template>

<style>
:root {
  height: 100;
  width: 500;
}

.draggable {
  -webkit-app-region: drag;
  height: 200px;
  width: 500px;
  text-align: center;
}
</style>
