<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import MarkdownIt from 'markdown-it'

const clipboardData = ref('左键选中需要翻译的文本,右键长按即可翻译')
const gptcontentvalue = ref('')
const md = new MarkdownIt()

const processRawContent = (content: string): string => {
  // 替换 '\n' 为实际的换行符，同时处理其他可能的转义字符
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

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
      on: (channel: string, func: (...args: any[]) => void) => void
      removeListener: (channel: string, func: (...args: any[]) => void) => void
    }
  }
  closeAPI: {
    closeWindow: () => void
  }
}
let accumulatedMarkdown = ''

const handleGPTStreamChunk = (event: any, dataString: string) => {
  if (isclear) {
    accumulatedMarkdown = ''
    gptcontentvalue.value = ''
    isclear = false
  }

  // 累积接收到的 Markdown 内容
  const processedChunk = processRawContent(dataString)

  accumulatedMarkdown += processedChunk

  // 尝试渲染累积的 Markdown
  try {
    const renderedContent = md.render(accumulatedMarkdown)
    gptcontentvalue.value = renderedContent
  } catch (error) {
    // 如果渲染失败（可能是因为 Markdown 不完整），就显示原始文本
    console.error('Markdown rendering failed:', error)
    gptcontentvalue.value = accumulatedMarkdown
  }
}
const handleGPTStreamEnd = () => {
  isclear = true
  // 最终渲染
  gptcontentvalue.value = md.render(accumulatedMarkdown)
}

onMounted(() => {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      window.closeAPI.closeWindow()
    }
  })

  window.electron.ipcRenderer.on('GPT-stream-chunk', handleGPTStreamChunk)
  window.electron.ipcRenderer.on('GPT-stream-end', handleGPTStreamEnd)

  window.electronAPI.onClipboardDataReceived(async (res) => {
    clipboardData.value = '翻译中...'
    gptcontentvalue.value = '查询中...'

    // 同时发送翻译和GPT请求
    const translationPromise = window.electron.ipcRenderer.invoke('perform-request', {
      data: {
        text: res.toString(),
        target_lang: 'ZH'
      }
    })

    const gptPromise = window.electron.ipcRenderer.invoke('GPT', {
      data: {
        model: 'gpt-4o-2024-08-06',
        stream: true,
        messages: [
          {
            role: 'system',
            content: '必须使用中文回复我，可以压缩自己回答的内容不需要特别多的内容'
          },
          { role: 'user', content: res }
        ]
      }
    })

    // 处理翻译结果
    translationPromise
      .then((result) => {
        clipboardData.value = result.data
      })
      .catch((error) => {
        console.error('Translation error:', error)
        clipboardData.value = '翻译失败，请重试'
      })

    // GPT结果通过事件监听器处理，这里不需要额外处理
    gptPromise.catch((error) => {
      console.error('GPT error:', error)
      gptcontentvalue.value = 'GPT 查询失败，请重试'
    })
  })
})

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener()
  window.electron.ipcRenderer.removeListener('GPT-stream-chunk', handleGPTStreamChunk)
  window.electron.ipcRenderer.removeListener('GPT-stream-end', handleGPTStreamEnd)
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
  background-color: #282828;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 10px;
  height: 90vh;
  width: 90%;
  max-width: 900px;
  margin: auto;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  color: #ebdbb2;
  display: flex;
  flex-direction: column;
}

.translation-content {
  max-height: 20%;
  min-height: 60px;
  overflow-y: auto;
  margin-bottom: 10px;
  /* background-color: #282828; */
  border-radius: 12px;
  padding: 5px;
  /* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); */
}

.translation {
  font-size: 16px;
  color: #ebdbb2;
  line-height: 1.6;
  margin: 0;
}

.divider {
  height: 1px;
  background-color: #504945;
  margin: 5px 0;
  flex-shrink: 0;
}

.gpt-content {
  font-size: 16px;
  line-height: 1.6;
  flex-grow: 1;
  overflow-y: auto;
  background-color: #282828;
  /* border-radius: 12px; */
  padding: 5px;
  /* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); */
  margin-bottom: 10px;
}

.gpt-content :deep(pre) {
  background-color: #32302f;
  border: 1px solid #504945;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  margin: 12px 0;
}

.gpt-content :deep(code) {
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  background-color: #32302f;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 14px;
  color: #fbf1c7;
}

.gpt-content :deep(a) {
  color: #83a598;
  text-decoration: none;
}

.gpt-content :deep(a:hover) {
  text-decoration: underline;
}

.gpt-content :deep(p) {
  margin-bottom: 14px;
}

.gpt-content :deep(ul),
.gpt-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 14px;
}

.gpt-content :deep(h1),
.gpt-content :deep(h2),
.gpt-content :deep(h3),
.gpt-content :deep(h4),
.gpt-content :deep(h5),
.gpt-content :deep(h6) {
  color: #b8bb26;
  margin-top: 28px;
  margin-bottom: 14px;
}

/* 自定义滚动条 */
.card-container::-webkit-scrollbar,
.translation-content::-webkit-scrollbar,
.gpt-content::-webkit-scrollbar {
  width: 8px;
}

.card-container::-webkit-scrollbar-track,
.translation-content::-webkit-scrollbar-track,
.gpt-content::-webkit-scrollbar-track {
  background: #282828;
  border-radius: 4px;
}

.card-container::-webkit-scrollbar-thumb,
.translation-content::-webkit-scrollbar-thumb,
.gpt-content::-webkit-scrollbar-thumb {
  background: #504945;
  border-radius: 4px;
}

.card-container::-webkit-scrollbar-thumb:hover,
.translation-content::-webkit-scrollbar-thumb:hover,
.gpt-content::-webkit-scrollbar-thumb:hover {
  background: #665c54;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-container {
    width: 95%;
    padding: 16px;
    height: 95vh;
  }

  .translation,
  .gpt-content {
    font-size: 15px;
  }
}
</style>
