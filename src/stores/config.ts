import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ConfigState {
  apiUrl: string
  apiKey: string
  model: string
  setApiUrl: (url: string) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
}

/**
 * 规范化 API URL：
 * 支持用户输入 base URL 或完整 endpoint，统一返回完整的 chat completions 地址
 * 例如:
 *   https://api.openai.com/v1  →  https://api.openai.com/v1/chat/completions
 *   https://api.openai.com/v1/chat/completions  →  不变
 *   https://dashscope.aliyuncs.com/compatible-mode/v1  →  https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
 */
export function normalizeApiUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, '')
  if (!u.endsWith('/chat/completions')) {
    u += '/chat/completions'
  }
  return u
}

/** 检查 AI 配置是否已完成 */
export function isConfigReady(state: { apiUrl: string; apiKey: string; model: string }) {
  return !!(state.apiUrl.trim() && state.apiKey.trim() && state.model.trim())
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      apiUrl: '',
      apiKey: '',
      model: '',
      setApiUrl: (apiUrl) => set({ apiUrl }),
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
    }),
    {
      name: 'ai-config',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
