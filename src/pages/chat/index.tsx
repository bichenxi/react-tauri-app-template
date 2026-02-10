import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Bot, User, Settings, Plus, RotateCcw, Copy, Check, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { useChatStore, type Message } from '@/stores/chat'
import { useConfigStore, normalizeApiUrl, isConfigReady } from '@/stores/config'
import { createAIRequest } from '@/lib/ai-stream'
import { cn } from '@/lib/utils'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AVAILABLE_TOOLS, buildSystemPrompt } from '@/lib/tools'
import { parseDeleteFileIntent } from '@/lib/delete-intent'
import { executeTools } from '@/lib/tool-executor'
import { fileService } from '@/services/tauri/files'

const aiRequest = createAIRequest()

// ========== 消息气泡组件 ==========

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // 工具执行结果：显示为紧凑的系统消息
  if (isTool) {
    return (
      <div className="flex items-start gap-3 py-3 px-4">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Wrench size={14} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
            工具执行: {message.tool_name || '未知'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-4 py-2.5 ring-1 ring-amber-200/50 dark:ring-amber-800/30">
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{message.content}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('group flex gap-4 py-6 px-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors rounded-2xl relative', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/50 dark:ring-white/10 shadow-sm">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_4px_12px_rgba(255,144,0,0.3)]'
              : 'bg-white/80 dark:bg-white/10 text-gray-600 dark:text-gray-400 shadow-sm backdrop-blur-sm'
          )}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[75%] min-w-0 flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {isUser ? (
          <div className="inline-block bg-gradient-to-br from-primary to-orange-500 text-white px-5 py-3.5 rounded-[20px] rounded-tr-sm text-[15px] leading-relaxed whitespace-pre-wrap shadow-[0_8_24px_rgba(255,144,0,0.2)]">
            {message.content}
          </div>
        ) : (
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-xl px-5 py-4 rounded-[20px] rounded-tl-sm text-gray-800 dark:text-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-white/60 dark:ring-white/10">
            {message.loading && !message.content ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        )}
        
        {!message.loading && message.content && (
          <div className={cn(
            "mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "mr-2" : "ml-2"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== 主页面组件 ==========

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [homeDir, setHomeDir] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()
  const { apiUrl, apiKey, model } = useConfigStore()

  const {
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    setMessageLoading,
    getActiveConversation,
    setActiveConversation,
    clearMessages,
  } = useChatStore()

  const activeConversation = getActiveConversation()
  const messages = activeConversation?.messages ?? []

  const { ref: scrollRef } = useAutoScroll<HTMLDivElement>([messages])

  // 获取用户主目录
  useEffect(() => {
    fileService.getHomeDir().then(setHomeDir).catch(console.error)
  }, [])

  // 自动聚焦输入框
  useEffect(() => {
    textareaRef.current?.focus()
  }, [activeConversationId])

  const handleNewChat = () => {
    const id = createConversation()
    setActiveConversation(id)
    setInput('')
  }

  const handleClearChat = () => {
    if (activeConversationId) {
      clearMessages(activeConversationId)
    }
  }

  const configReady = isConfigReady({ apiUrl, apiKey, model })

  /**
   * 构建发给 API 的消息列表
   * 包含 system prompt、历史消息（含 tool 角色消息）
   */
  const buildApiMessages = (
    existingMessages: Message[],
    newUserContent?: string
  ) => {
    const systemMessage = homeDir
      ? { role: 'system' as const, content: buildSystemPrompt(homeDir) }
      : null

    const history = existingMessages
      .filter((m) => {
        // 带 tool_calls 的 assistant 和 tool 消息必须保留，否则 API 会报错
        if (m.role === 'tool') return true
        if (m.role === 'assistant' && m.tool_calls?.length) return true
        // 其余消息：有内容且非错误提示
        return !!(m.content && !m.content.startsWith('请求失败'))
      })
      .map((m) => {
        const base: Record<string, unknown> = {
          role: m.role,
          content: m.content ?? (m.role === 'assistant' && m.tool_calls?.length ? null : ''),
        }
        // assistant 消息如果有 tool_calls，必须附带，否则下一句 tool 会报错
        if (m.role === 'assistant' && m.tool_calls?.length) {
          base.tool_calls = m.tool_calls
          if (base.content === '' || base.content === undefined) base.content = null
        }
        // tool 角色消息必须带 tool_call_id
        if (m.role === 'tool' && m.tool_call_id) {
          base.tool_call_id = m.tool_call_id
        }
        return base
      })

    const msgs = []
    if (systemMessage) msgs.push(systemMessage)
    msgs.push(...history)
    if (newUserContent) msgs.push({ role: 'user', content: newUserContent })
    return msgs
  }

  /**
   * 核心：发送一轮 AI 请求
   * 返回值: { hasToolCalls: boolean } 用于判断是否需要继续循环
   */
  const sendOneRound = async (
    convId: string,
    messagesForApi: Record<string, unknown>[],
  ): Promise<{ hasToolCalls: boolean }> => {
    // 添加 AI 消息占位
    const aiMsgId = addMessage(convId, { role: 'assistant', content: '', loading: true })

    const latestConfig = useConfigStore.getState()
    const requestUrl = normalizeApiUrl(latestConfig.apiUrl)
    const requestModel = latestConfig.model
    const requestKey = latestConfig.apiKey

    let fullContent = ''

    return new Promise<{ hasToolCalls: boolean }>((resolve) => {
      aiRequest.send({
        url: requestUrl,
        headers: {
          Authorization: `Bearer ${requestKey}`,
        },
        body: {
          model: requestModel,
          messages: messagesForApi,
          stream: true,
        },
        tools: AVAILABLE_TOOLS,
        onMessage: (chunk, done) => {
          if (done) {
            setMessageLoading(convId, aiMsgId, false)
            resolve({ hasToolCalls: false })
            return
          }
          fullContent += chunk
          updateMessage(convId, aiMsgId, fullContent)
        },
        onToolCalls: async (toolCalls) => {
          // 更新 assistant 消息，显示"正在执行..."，并存储 tool_calls 数据
          const toolCallsData = toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }))

          // 更新 AI 消息：附带 tool_calls 元数据
          const store = useChatStore.getState()
          store.conversations.forEach((c) => {
            if (c.id === convId) {
              c.messages.forEach((m) => {
                if (m.id === aiMsgId) {
                  m.tool_calls = toolCallsData
                  m.loading = false
                  if (!m.content) {
                    m.content = toolCalls
                      .map((tc) => `🔧 调用工具: ${tc.name}`)
                      .join('\n')
                  }
                }
              })
            }
          })
          // 手动触发状态更新
          useChatStore.setState({ conversations: [...store.conversations] })

          // 执行工具调用
          const results = await executeTools(toolCalls)

          // 将每个工具结果作为 tool 角色消息添加到对话中
          for (const result of results) {
            addMessage(convId, {
              role: 'tool',
              content: result.result,
              tool_call_id: result.tool_call_id,
              tool_name: result.name,
            })
          }

          resolve({ hasToolCalls: true })
        },
        onError: (error) => {
          const time = new Date().toLocaleTimeString()
          const errorDetail = `请求失败 (${time}): ${error.message}\n\n当前配置:\n- 地址: ${requestUrl}\n- 模型: ${requestModel}`
          updateMessage(convId, aiMsgId, errorDetail)
          setMessageLoading(convId, aiMsgId, false)
          resolve({ hasToolCalls: false })
        },
      })
    })
  }

  /**
   * 完整的发送流程：支持多轮工具调用循环
   */
  const handleSend = async () => {
    const content = input.trim()
    if (!content || isStreaming) return

    if (!configReady) {
      navigate('/settings')
      return
    }

    // 确保有活跃的对话
    let convId = activeConversationId
    if (!convId) {
      convId = createConversation(content.slice(0, 30))
    }

    // 添加用户消息
    addMessage(convId, { role: 'user', content })
    setInput('')
    setIsStreaming(true)

    try {
      // 删除意图兜底：用户明确说「删掉桌面上的 xxx」时直接执行删除，不依赖 AI 是否调用工具
      const deletePath = homeDir ? parseDeleteFileIntent(content, homeDir) : null
      if (deletePath) {
        try {
          const result = await fileService.deleteFile(deletePath)
          addMessage(convId, { role: 'assistant', content: `已删除文件。\n\n${result}` })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          addMessage(convId, { role: 'assistant', content: `删除失败：${msg}` })
        }
        setIsStreaming(false)
        return
      }

      // 构建初始 API 消息
      const currentConv = useChatStore.getState().conversations.find((c) => c.id === convId)
      let apiMessages = buildApiMessages(
        currentConv?.messages.slice(0, -1) ?? [], // 排除刚添加的用户消息（因为下面会手动加）
        content,
      )

      // 工具调用循环：最多 5 轮，防止无限循环
      let round = 0
      const MAX_ROUNDS = 5
      while (round < MAX_ROUNDS) {
        round++
        const { hasToolCalls } = await sendOneRound(convId, apiMessages)

        if (!hasToolCalls) break // AI 没有调用工具，直接结束

        // AI 调用了工具，结果已经添加到对话中
        // 重新构建消息列表（包含工具结果），发起下一轮
        const updatedConv = useChatStore.getState().conversations.find((c) => c.id === convId)
        apiMessages = buildApiMessages(updatedConv?.messages ?? [])
      }
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = () => {
    aiRequest.cancel()
    setIsStreaming(false)
  }

  return (
    <div className="h-full flex flex-col relative z-0">
      {/* Header */}
      <div className="h-20 flex items-center px-8 bg-white/30 dark:bg-black/30 backdrop-blur-md shrink-0 sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate tracking-tight">
            {activeConversation?.title || '新对话'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", configReady ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300")}></span>
            <span className="text-xs text-gray-500 font-medium">{model || '未配置'}</span>
            {homeDir && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-400 font-medium">🔧 工具已启用</span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="ml-4 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
        >
          <Settings size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-20">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl ring-1 ring-white/60 dark:ring-white/10">
              <Bot size={32} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
              {configReady ? '开始新的对话' : '请先完成配置'}
            </h2>
            <p className="text-[15px] mt-3 text-gray-500 dark:text-gray-400 font-light">
              {configReady
                ? '试试说："在桌面上建一个叫 todo 的笔记" 或 "帮我看看桌面上有什么文件"'
                : '配置 API 地址、密钥和模型后即可开始'}
            </p>
            {!configReady && (
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="mt-6 gap-2 rounded-xl"
              >
                <Settings size={16} />
                前往设置
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-8 space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 bg-transparent px-6 pb-8 pt-2">
        <div className="max-w-4xl mx-auto">
          <div 
            className={cn(
              "relative group rounded-[28px] transition-all duration-500",
              "bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10",
              isFocused 
                ? "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] bg-white dark:bg-white/10 border-black/[0.15] dark:border-white/20" 
                : "shadow-[0_4px_24px_-1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)]"
            )}
          >
            <div className="flex flex-col">
              <div className="relative flex items-end p-2 pl-6">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="试试说: 在桌面上建一个笔记、帮我看看文档目录有什么文件..."
                  className="min-h-[60px] max-h-[400px] py-4 flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[16px] leading-[1.6] placeholder:text-gray-400/60 dark:placeholder:text-gray-500/60 resize-none font-normal tracking-tight selection:bg-primary/20 shadow-none focus:shadow-none dark:text-gray-100"
                  rows={1}
                />
                
                <div className="flex items-center gap-2 pb-2.5 pr-3">
                  {isStreaming ? (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleStop}
                      className="h-10 w-10 rounded-full shadow-lg shadow-red-500/10 hover:opacity-90 transition-all active:scale-95"
                    >
                      <Square size={14} fill="currentColor" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={cn(
                        "h-10 w-10 rounded-full transition-all duration-300",
                        input.trim() 
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-lg hover:bg-black/80 dark:hover:bg-white/80 hover:scale-105 active:scale-95" 
                          : "bg-black/[0.05] dark:bg-white/[0.05] text-black/10 dark:text-white/10"
                      )}
                    >
                      <ArrowUp size={20} strokeWidth={2.5} />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between px-6 pb-3 pt-1 border-t border-black/[0.03] dark:border-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        className="h-7 w-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all active:scale-90"
                      >
                        <Plus size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black text-white border-none text-[11px] px-2 py-1">新建对话</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearChat}
                        disabled={messages.length === 0}
                        className="h-7 w-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-20 active:scale-90"
                      >
                        <RotateCcw size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black text-white border-none text-[11px] px-2 py-1">重置对话</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-2 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.03] text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    {input.length} CHARS
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400/40 dark:text-gray-500/40 mt-4 text-center font-medium tracking-widest flex items-center justify-center gap-3 uppercase">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-black/[0.05] dark:to-white/[0.05]" />
            AI 内容仅供参考 · 文件操作限于桌面/文档/下载目录
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-black/[0.05] dark:to-white/[0.05]" />
          </p>
        </div>
      </div>
    </div>
  )
}
