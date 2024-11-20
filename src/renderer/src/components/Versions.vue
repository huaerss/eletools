<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { useRouter } from 'vue-router'
import { store } from '../store/translate'

// 使用 store 中的状态替换本地的 ref
const { clipboardData, gptcontentvalue, shouldShow } = store

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
    onShouldShow: (callback: (res: string) => void) => void
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

const closeWindow = () => {
  window.closeAPI.closeWindow()
}
const handleGPTStreamChunk = (event: any, dataString: string) => {
  if (isclear) {
    accumulatedMarkdown = ''
    gptcontentvalue.value = ''
    isclear = false
  }

  // 累积接收到的 Markdown 内容
  const processedChunk = processRawContent(dataString)

  accumulatedMarkdown += processedChunk

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

const router = useRouter()

// 修改设置按钮的处理函数
const openSettings = () => {
  router.push('/settings')
}

onMounted(() => {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      window.closeAPI.closeWindow()
    }
  })

  window.electron.ipcRenderer.on('GPT-stream-chunk', handleGPTStreamChunk)
  window.electron.ipcRenderer.on('GPT-stream-end', handleGPTStreamEnd)

  // 使用 store 中的状态，不需要创建新的 ref
  let clipboardText = ''

  window.electronAPI.onShouldShow((res) => {
    shouldShow.value = res as '1' | '2'
    if (shouldShow.value === '1') {
      const translationPromise = window.electron.ipcRenderer.invoke('perform-request', {
        data: {
          text: clipboardText,
          target_lang: 'ZH'
        }
      })
      translationPromise
        .then((result) => {
          clipboardData.value = result.data
        })
        .catch((error) => {
          console.error('Translation error:', error)
          clipboardData.value = '翻译失败，请重试'
        })
    } else if (shouldShow.value === '2') {
      console.log('准备调用 GPT')
      const gptPromise = window.electron.ipcRenderer.invoke('GPT', {
        data: {
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                '必须使用中文回复我，不用需要特别多的内容可以说出主要内容就可以，优先考虑我问的是计算机内容，代码方面的问题,字数限制在150字以内'
            },
            { role: 'user', content: clipboardText }
          ]
        }
      })
      gptPromise.catch((error) => {
        console.error('GPT error:', error)
        gptcontentvalue.value = 'GPT 查询失败，请重试'
      })
    }
  })

  window.electronAPI.onClipboardDataReceived(async (res) => {
    clipboardText = res
    clipboardData.value = '翻译中...'
    gptcontentvalue.value = '查询中...'
  })

  // 添加对 shouldShow 的监听
  watch(shouldShow, (newValue) => {
    console.log('shouldShow 变化为:', newValue)
  })
})

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener()
  window.electron.ipcRenderer.removeListener('GPT-stream-chunk', handleGPTStreamChunk)
  window.electron.ipcRenderer.removeListener('GPT-stream-end', handleGPTStreamEnd)
})
</script>

<template>
  <div class="container">
    <div class="header" data-tauri-drag-region>
      <div class="drag-area"></div>
      <div class="settings-button" @click="openSettings">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
          />
        </svg>
      </div>
      <div class="close-button" @click="closeWindow">×</div>
    </div>

    <div class="content">
      <div v-if="shouldShow === '1'" class="text">{{ clipboardData }}</div>
      <div v-if="shouldShow === '2'" class="text" v-html="gptcontentvalue"></div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 500px;
  background: #1c1c1c;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 6px 10px;
  background: #2c2c2c;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.drag-area {
  flex: 1;
  height: 20px;
}

.settings-button,
.close-button {
  -webkit-app-region: no-drag;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  border-radius: 4px;
  transition: all 0.2s;
}

.settings-button:hover,
.close-button:hover {
  background: #404040;
}

.close-button {
  font-size: 18px;
}

.content {
  flex: 1;
  margin: 12px;
  overflow-y: auto;
  min-height: 80px;
}

.text {
  color: #ffffff;
  line-height: 1.6;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  letter-spacing: 0.2px;
}

:deep(pre) {
  background: #2c2c2c;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
}

:deep(code) {
  color: #fd8282;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
  font-size: 13px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #505050;
}
</style>
