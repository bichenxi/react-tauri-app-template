/**
 * AI SSE 流式请求工具
 * 支持 OpenAI 兼容的 SSE 协议
 */

export interface StreamOptions {
  url: string
  body: Record<string, unknown>
  headers?: Record<string, string>
  onMessage: (content: string, done: boolean) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

/**
 * 发送 SSE 流式请求 (OpenAI 兼容协议)
 */
export async function fetchSSE({
  url,
  body,
  headers = {},
  onMessage,
  onError,
  signal,
}: StreamOptions) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onMessage('', true)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') {
          if (trimmed === 'data: [DONE]') {
            onMessage('', true)
          }
          continue
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            const content = data.choices?.[0]?.delta?.content ?? ''
            if (content) {
              onMessage(content, false)
            }
          } catch {
            // 非 JSON 数据，作为纯文本处理
            onMessage(trimmed.slice(6), false)
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') return
    onError?.(error as Error)
  }
}

/**
 * 创建一个可取消的 AI 请求
 */
export function createAIRequest() {
  let controller: AbortController | null = null

  return {
    send: (options: Omit<StreamOptions, 'signal'>) => {
      controller?.abort()
      controller = new AbortController()
      return fetchSSE({ ...options, signal: controller.signal })
    },
    cancel: () => {
      controller?.abort()
      controller = null
    },
  }
}
