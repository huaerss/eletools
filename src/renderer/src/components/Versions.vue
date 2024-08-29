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
  console.log('bbb', dataString)

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
              '内容可以压缩,如果优先考虑问你的是不是关于编程的问题,不需要回复我这个问题,直接回复我你的问题就可以了'
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
  <div class="card-container">
    <div class="translation-content">
      <p class="translation">{{ clipboardData }}</p>
    </div>
    <div v-if="gptcontentvalue" class="divider"></div>
    <div class="gpt-content" v-html="gptcontentvalue"></div>
  </div>
</template>
<style scoped>
.card-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
    'Helvetica Neue', sans-serif;
}

.translation-content {
  margin-bottom: 12px;
}

.translation {
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.4;
  margin: 0;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 12px 0;
}

.gpt-content {
  font-size: 14px;
  color: #34495e;
  line-height: 1.5;
}

/* 自定义滚动条 */
.card-container::-webkit-scrollbar {
  width: 6px;
}

.card-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.card-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.card-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
