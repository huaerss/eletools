<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const clipboardData = ref('左键选中需要翻译的文本,右键长按即可翻译')
const gptcontentvalue = ref('')

let isclear = true
declare const window: {
  electronAPI: {
    onClipboardDataReceived: (callback: (res: string) => void) => void
    removeClipboardDataListener: () => void
  }
  electron: {
    ipcRenderer: {
      invoke: (channel: string, data: any) => Promise<any>
      send: (channel: string, data: any) => void
      on: (channel: string, data: any) => void
    }
  }
  closeAPI: {
    closeWindow: () => void
  }
}

window.electron.ipcRenderer.on('GPT-stream-chunk', (event, dataString) => {
  if (isclear) {
    gptcontentvalue.value = ''
    isclear = false
  }
  gptcontentvalue.value += dataString
})
window.electron.ipcRenderer.on('GPT-stream-end', () => {
  isclear = true
})
onMounted(() => {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      window.closeAPI.closeWindow()
    }
  })
  window.electronAPI.onClipboardDataReceived(async (res) => {
    clipboardData.value = '翻译中...'
    gptcontentvalue.value = '查询中...'
    // 翻译接口
    const result = await window.electron.ipcRenderer.invoke('perform-request', {
      data: {
        text: res,

        target_lang: 'ZH'
      }
    })
    clipboardData.value = result.data
    // GPT接口
    window.electron.ipcRenderer.invoke('GPT', {
      data: {
        model: 'gpt-4o',
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              '给我返回纯文本格式,不要给我返回换行符将换行符号换成空格,如果我给你发送代码你只需要解释是什么意思不需要再次返回代码的内容给我,并且所有回答尽量是中文,不需要给我返回参考链接,直接给我你总结的内容即可'
          },
          { role: 'user', content: res }
        ]
      }
    })
    // gptcontentvalue.value = gptcontent
  })
})

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener()
})
</script>

<template>
  <div class="content-container">
    <div class="content">
      <p>{{ clipboardData }}</p>
      <div v-if="gptcontentvalue" class="divider"></div>
      <p v-html="gptcontentvalue"></p>
    </div>
  </div>
</template>

<style>
.content-container {
  height: 100vh; /* 固定高度 */
  overflow-y: scroll; /* 超出部分显示滚动条 */
}

.content {
  text-align: center;
  padding: 10px;
}

.divider {
  border-top: 1px solid brown;
  margin: 10px auto;
  width: 90%;
}

body {
  background-color: rgba(255, 255, 255); /* 背景半透明 */
  margin: 0;
  padding: 0;
}

p {
  font-size: 16px;
  color: #000;
  font-weight: 600;
}
</style>
