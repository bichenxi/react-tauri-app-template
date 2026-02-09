import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, Settings, PanelLeftClose, PanelLeft, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { useChatStore } from '@/stores/chat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { path: '/chat', label: '对话', icon: MessageSquare },
  { path: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { conversations, activeConversationId, setActiveConversation, createConversation, deleteConversation } = useChatStore()

  const handleNewChat = () => {
    const id = createConversation()
    setActiveConversation(id)
    navigate('/chat')
  }

  return (
    <aside
      className={cn(
        'h-screen flex flex-col transition-all duration-300 backdrop-blur-3xl z-50',
        sidebarCollapsed ? 'w-20' : 'w-72',
        'bg-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
      )}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-5 shrink-0">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            AI Nexus
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl hover:bg-white/60 hover:shadow-sm transition-all text-gray-400 hover:text-primary"
        >
          {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="mx-5 mb-2 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent" />

      {/* New Chat Button */}
      <div className="px-5 pb-4 shrink-0">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleNewChat}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 text-white hover:shadow-[0_8px_16px_-4px_rgba(255,144,0,0.5)] transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-white/80 backdrop-blur-xl border-none shadow-xl">新建对话</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            onClick={handleNewChat}
            className="w-full gap-2.5 h-11 rounded-xl bg-gradient-to-br from-primary to-orange-600 text-white border-none shadow-[0_4px_14px_0_rgba(255,144,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,144,0,0.23)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} />
            <span className="font-medium">新建对话</span>
          </Button>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group relative flex items-center rounded-xl cursor-pointer transition-all duration-200 overflow-hidden',
                conv.id === activeConversationId
                  ? 'bg-white/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-white/40 hover:text-gray-900',
                sidebarCollapsed ? 'justify-center p-2.5 mx-2' : 'px-4 py-3 mx-2'
              )}
              onClick={() => {
                setActiveConversation(conv.id)
                navigate('/chat')
              }}
            >
              {conv.id === activeConversationId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full shadow-[0_0_12px_rgba(255,144,0,0.8)]" />
              )}
              <MessageSquare size={18} className={cn("shrink-0 transition-colors", conv.id === activeConversationId ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3 text-[14px] truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all transform scale-90 hover:scale-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mx-5 my-2 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent" />

      {/* Bottom Nav */}
      <div className="p-3 space-y-1 shrink-0 pb-5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = item.icon

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-gray-400 hover:bg-white/60 hover:text-gray-600'
                    )}
                  >
                    <Icon size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white/80 backdrop-blur-xl border-none shadow-xl">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all duration-200 mx-1',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
