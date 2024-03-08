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

      const gptcontent = await window.electron.ipcRenderer.invoke('GPT', {
        data: {
          "api_key": 'api_pjtb7Y7LdJgUAnkXRBMR',
          "messages": [
            {
              "role": "user",
              "message": `我问你所有问题你都需要中文回复我并且不需要输出你理解的代码,相关问题也要进行回答并可以回答我里面的表达是什么意思,你不需要回复我好的,你只需要回复我问的问题,那我的问题是:${res}`,
              "codeContexts": []
            }
          ],
          "chat_model": "GPT4 Turbo"
        },
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzJkTTN5Q3BlVFlKejBGZXVNWlZQUDdGTlppdCIsImV4cCI6MTcwOTgwNTE5NH0.VI-Fyx8nyArSZX5SSjnxolWIxn2ZSFF2jRdDW4548YI`,
          'Content-Type': 'application/json'
        }
      });
      gptcontentvalue.value = gptcontent

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
    <div v-if="gptcontentvalue" style="border-top:  1px solid crimson;margin-top: 10px;">
      <h3 style="font-size: 10px;">GPT4.0 Turbo:</h3>
      <p>{{ gptcontentvalue }}</p>
    </div>


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
