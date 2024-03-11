<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const clipboardData = ref('左键选中需要翻译的文本,右键短长按即可复制');
const gptcontentvalue = ref('')
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
    gptcontentvalue.value = "查询中..."
    // 翻译接口
    const result = await window.electron.ipcRenderer.invoke('perform-request', {
      data: {
        text: res,
        "target_lang": "ZH"
      },
    });
    clipboardData.value = result.data;
    // GPT接口
    const gptcontent = await window.electron.ipcRenderer.invoke('GPT', {
      data: {
        model: "gpt-4",
        messages: [
          { role: "system", content: "你的回答只能总结,回答压缩答案,最大不超过80字中文字以内,并且所有回答尽量是中文混合一些术语英文" },
          { role: "user", content: res }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(gptcontent)
    gptcontentvalue.value = gptcontent



  });
});

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener();
});

</script>

<template>
  <div class="draggable">

    <p>{{ clipboardData }}</p>
    <div v-if="gptcontentvalue" style="border-top:  1px solid crimson;margin-top: 10px;">
      <h3 style="font-size: 10px;">GPT4.0:</h3>
      <p>{{ gptcontentvalue }}</p>
    </div>


  </div>
</template>

<style>
.draggable {
  -webkit-app-region: drag;
  height: 200px;
  width: 500px;
  text-align: center;
}
</style>
