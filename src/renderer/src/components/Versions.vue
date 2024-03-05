<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'

const clipboardData = ref('');

onMounted(() => {
  window.electronAPI.onClipboardDataReceived(async (res) => {
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
      console.log("翻译结果:", result);
      clipboardData.value = result.data;



    }

  });
});

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener();
});

</script>

<template>
  翻译结果: {{ clipboardData }}
</template>
