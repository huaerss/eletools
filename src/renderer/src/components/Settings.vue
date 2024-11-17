<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const translateShortcut = ref('Alt+1')
const gptShortcut = ref('Alt+2')

const isRecording = ref<'translate' | 'gpt' | null>(null)

const startRecording = (type: 'translate' | 'gpt') => {
  isRecording.value = type
  window.addEventListener('keydown', handleKeyPress)
}

const handleKeyPress = (e: KeyboardEvent) => {
  e.preventDefault()
  const modifiers: string[] = []
  if (e.ctrlKey) modifiers.push('Ctrl')
  if (e.altKey) modifiers.push('Alt')
  if (e.shiftKey) modifiers.push('Shift')
  if (e.metaKey) modifiers.push('Meta')

  let key = e.key
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    'Control': 'Ctrl',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→'
  }

  if (key in specialKeys) {
    key = specialKeys[key]
  }

  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
    const shortcut = [...modifiers, key].join('+')

    if (isRecording.value === 'translate') {
      translateShortcut.value = shortcut
    } else if (isRecording.value === 'gpt') {
      gptShortcut.value = shortcut
    }

    isRecording.value = null
    window.removeEventListener('keydown', handleKeyPress)

    window.electron.ipcRenderer.send('save-shortcuts', {
      translate: translateShortcut.value,
      gpt: gptShortcut.value
    })
  }
}

const isValidShortcut = (shortcut: string): boolean => {
  const parts = shortcut.split('+')
  return parts.length >= 2 &&
    ['Ctrl', 'Alt', 'Shift', 'Meta'].some(mod => parts.includes(mod))
}

onMounted(async () => {
  try {
    const shortcuts = await window.electron.ipcRenderer.invoke('get-shortcuts')
    if (shortcuts) {
      translateShortcut.value = shortcuts.translate || 'Alt+1'
      gptShortcut.value = shortcuts.gpt || 'Alt+2'
    }
  } catch (error) {
    console.error('获取快捷键设置失败:', error)
  }
})

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="back-button" @click="goBack">←</div>
      <span>快捷键设置</span>
    </div>

    <div class="content">
      <div class="shortcut-row">
        <span>翻译</span>
        <button
          :class="{ recording: isRecording === 'translate' }"
          @click="startRecording('translate')"
        >
          {{ isRecording === 'translate' ? '请按下快捷键...' : translateShortcut }}
        </button>
      </div>

      <div class="shortcut-row">
        <span>GPT</span>
        <button :class="{ recording: isRecording === 'gpt' }" @click="startRecording('gpt')">
          {{ isRecording === 'gpt' ? '请按下快捷键...' : gptShortcut }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 500px;
  min-height: 160px;
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-primary);
  color: var(--color-text);
  flex-shrink: 0;
}

.back-button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

.back-button:hover {
  background: var(--color-hover);
}

.content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: var(--color-background);
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  color: var(--color-text);
  background: var(--color-primary);
  border-radius: 6px;
}

.shortcut-row span {
  font-size: 14px;
}

button {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  min-width: 120px;
  transition: all 0.2s;
  font-size: 12px;
}

button:hover {
  background: var(--color-hover);
  border-color: var(--color-text);
}

button.recording {
  background: var(--color-warning);
  color: var(--color-background);
  border-color: var(--color-warning);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
</style>
