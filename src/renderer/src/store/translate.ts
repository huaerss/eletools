import { ref } from 'vue'

export const useTranslateStore = () => {
  const clipboardData = ref('左键选中需要翻译的文本,右键长按即可翻译')
  const gptcontentvalue = ref('')
  const shouldShow = ref<'1' | '2' | null>(null)

  return {
    clipboardData,
    gptcontentvalue,
    shouldShow
  }
}

// 创建一个单例
export const store = useTranslateStore()
