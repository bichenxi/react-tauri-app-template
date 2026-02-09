import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Bot, User, Settings, Plus, RotateCcw, Copy, Check } from 'lucide-react'
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

const aiRequest = createAIRequest()

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
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

  return (
    <div className={cn('group flex gap-4 py-6 px-4 hover:bg-white/30 transition-colors rounded-2xl relative', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/50 shadow-sm">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_4px_12px_rgba(255,144,0,0.3)]'
              : 'bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm'
          )}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[75%] min-w-0 flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {isUser ? (
          <div className="inline-block bg-gradient-to-br from-primary to-orange-500 text-white px-5 py-3.5 rounded-[20px] rounded-tr-sm text-[15px] leading-relaxed whitespace-pre-wrap shadow-[0_8px_24px_rgba(255,144,0,0.2)]">
            {message.content}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-xl px-5 py-4 rounded-[20px] rounded-tl-sm text-gray-800 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-white/60">
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
              className="h-7 w-7 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
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

    // 添加 AI 消息占位
    const aiMsgId = addMessage(convId, { role: 'assistant', content: '', loading: true })

    setIsStreaming(true)
    let fullContent = ''

    // 直接从 store 获取最新配置
    const latestConfig = useConfigStore.getState()
    const requestUrl = normalizeApiUrl(latestConfig.apiUrl)
    const requestModel = latestConfig.model
    const requestKey = latestConfig.apiKey

    await aiRequest.send({
      url: requestUrl,
      headers: {
        Authorization: `Bearer ${requestKey}`,
      },
      body: {
        model: requestModel,
        messages: [
          ...(activeConversation?.messages ?? [])
            .filter((m) => m.role !== 'system' && m.content && !m.content.startsWith('请求失败'))
            .map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ],
        stream: true,
      },
      onMessage: (chunk, done) => {
        if (done) {
          setMessageLoading(convId!, aiMsgId, false)
          setIsStreaming(false)
          return
        }
        fullContent += chunk
        updateMessage(convId!, aiMsgId, fullContent)
      },
      onError: (error) => {
        const time = new Date().toLocaleTimeString()
        const errorDetail = `请求失败 (${time}): ${error.message}\n\n当前配置:\n- 地址: ${requestUrl}\n- 模型: ${requestModel}`
        updateMessage(convId!, aiMsgId, errorDetail)
        setMessageLoading(convId!, aiMsgId, false)
        setIsStreaming(false)
      },
    })
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
      <div className="h-20 flex items-center px-8 bg-white/30 backdrop-blur-md shrink-0 sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate tracking-tight">
            {activeConversation?.title || '新对话'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", configReady ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300")}></span>
            <span className="text-xs text-gray-500 font-medium">{model || '未配置'}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="ml-4 rounded-xl hover:bg-white/50 text-gray-500"
        >
          <Settings size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-white/80 to-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl ring-1 ring-white/60">
              <Bot size={32} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              {configReady ? '开始新的对话' : '请先完成配置'}
            </h2>
            <p className="text-[15px] mt-3 text-gray-500 font-light">
              {configReady ? '探索 AI 的无限可能' : '配置 API 地址、密钥和模型后即可开始'}
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
              "bg-white/80 backdrop-blur-2xl border border-black/[0.08]",
              isFocused 
                ? "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] bg-white border-black/[0.15]" 
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
                  placeholder="有什么可以帮你的？"
                  className="min-h-[60px] max-h-[400px] py-4 flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[16px] leading-[1.6] placeholder:text-gray-400/60 resize-none font-normal tracking-tight selection:bg-primary/20 shadow-none focus:shadow-none"
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
                          ? "bg-black text-white shadow-lg hover:bg-black/80 hover:scale-105 active:scale-95" 
                          : "bg-black/[0.05] text-black/10"
                      )}
                    >
                      <ArrowUp size={20} strokeWidth={2.5} />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between px-6 pb-3 pt-1 border-t border-black/[0.03]">
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.04] transition-all active:scale-90"
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
                        className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-20 active:scale-90"
                      >
                        <RotateCcw size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black text-white border-none text-[11px] px-2 py-1">重置对话</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-2 py-0.5 rounded-full bg-black/[0.03] text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    {input.length} CHARS
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400/40 mt-4 text-center font-medium tracking-widest flex items-center justify-center gap-3 uppercase">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-black/[0.05]" />
            AI 内容仅供参考
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-black/[0.05]" />
          </p>
        </div>
      </div>
    </div>
  )
}
