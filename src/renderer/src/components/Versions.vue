<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const isDraggable = ref(true)
const clipboardData = ref('左键选中需要翻译的文本,右键长按即可翻译')
const gptcontentvalue = ref('')
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

const changestatus = () => {
  if (isDraggable.value) {
    window.electron.ipcRenderer.send('changeModel', 'zhiding')
  } else {
    window.electron.ipcRenderer.send('changeModel', 'drag')
  }
}
document.addEventListener('mousedown', (e) => {
  console.log(e)
})

onMounted(() => {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      window.closeAPI.closeWindow()
    }
  })
  window.electronAPI.onClipboardDataReceived(async (res) => {
    clipboardData.value = '翻译中...' + res
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
    const gptcontent = await window.electron.ipcRenderer.invoke('GPT', {
      data: {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '你的回答只能总结,回答压缩答案,最大不超过79个中文字以内,并且所有回答尽量是中文混合一些术语英文,如果不知道我问的什么无法给出回答就返回我问你的东西'
          },
          { role: 'user', content: res }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    gptcontentvalue.value = gptcontent
  })
})
// 监听鼠标移入事件
document.addEventListener('mouseenter', () => {
  // 将css样式传递给主进程
  window.electron.ipcRenderer.send('mouse-enter', 'draggable')
})
window.electron.ipcRenderer.on('change-draggable-region', (_, status) => {
  if (status == 'none') {
    isDraggable.value = false
  } else {
    isDraggable.value = true
  }
})
// 监听鼠标移出事件
document.addEventListener('mouseleave', () => {
  window.electron.ipcRenderer.send('mouse-leave', '鼠标出')
})

onUnmounted(() => {
  window.electronAPI.removeClipboardDataListener()
})
</script>

<template>
  <div>
    <div class="draggable" :style="{ '-webkit-app-region': isDraggable ? 'drag' : 'no-drag' }">
      <div>
        <p>{{ clipboardData }}</p>
        <div
          v-if="gptcontentvalue"
          style="border-top: 1px solid brown; margin: 10px auto; width: 90%"
        ></div>
        <p>{{ gptcontentvalue }}</p>
      </div>
    </div>
    <div
      style="-webkit-app-region: no-drag; position: absolute; top: 0; right: 0"
      @click="changestatus"
    >
      <svg
        v-if="isDraggable"
        xmlns="http://www.w3.org/2000/svg"
        style="margin: 4px 10px 0 0; color: brown"
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M16.786 3.725a1.75 1.75 0 0 0-2.846.548L12.347 7.99A4.745 4.745 0 0 0 8.07 9.291l-1.71 1.71a.75.75 0 0 0 0 1.06l2.495 2.496l-5.385 5.386a.75.75 0 1 0 1.06 1.06l5.386-5.385l2.495 2.495a.75.75 0 0 0 1.061 0l1.71-1.71a4.745 4.745 0 0 0 1.302-4.277l3.716-1.592a1.75 1.75 0 0 0 .548-2.846zm-1.468 1.139a.25.25 0 0 1 .407-.078l3.963 3.962a.25.25 0 0 1-.079.407l-4.315 1.85a.75.75 0 0 0-.41.941a3.25 3.25 0 0 1-.763 3.396l-1.18 1.18l-4.99-4.99l1.18-1.18a3.25 3.25 0 0 1 3.396-.762a.75.75 0 0 0 .942-.41z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else
        style="margin: 4px 10px 0 0; color: crimson"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M18.825 16L15 12.175V4H9v2.175l-2-2V4q0-.825.588-1.413Q8.175 2 9 2h6q.825 0 1.413.587Q17 3.175 17 4v7.25L18.825 14Zm.95 6.6l-6.6-6.6H13v5l-1 1l-1-1v-5H5v-2l2-3V9.825l-5.6-5.6L2.8 2.8l18.375 18.4ZM7.5 14h3.675l-2.2-2.225ZM12 9.175ZM10.075 12.9Z"
        />
      </svg>
    </div>
  </div>
</template>

<style>
.draggable {
  margin-top: 12px;
  height: 200px;
  width: 500px;
  text-align: center;
}

p {
  font-size: 16px;
  color: #000;
  font-weight: 600;
}
</style>
