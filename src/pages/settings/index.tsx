import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAppStore, type Theme } from '@/stores/app'

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore()
  const navigate = useNavigate()
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    setApiUrl(localStorage.getItem('ai-api-url') || 'https://api.openai.com/v1/chat/completions')
    setApiKey(localStorage.getItem('ai-api-key') || '')
    setModel(localStorage.getItem('ai-model') || 'gpt-3.5-turbo')
  }, [])

  const handleSave = () => {
    localStorage.setItem('ai-api-url', apiUrl)
    localStorage.setItem('ai-api-key', apiKey)
    localStorage.setItem('ai-model', model)
    toast.success('设置已保存')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-white/50 text-gray-500"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">设置</h1>
            <p className="text-sm text-gray-500 mt-1">管理应用配置和 AI 模型设置</p>
          </div>
        </div>

        <Separator />

        {/* AI 模型配置 */}
        <Card>
          <CardHeader>
            <CardTitle>AI 模型配置</CardTitle>
            <CardDescription>配置 OpenAI 兼容的 API 接口地址和密钥</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API 地址</label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
              <p className="text-xs text-gray-400">支持 OpenAI、Ollama、DeepSeek 等兼容 API</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">模型</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
              />
              <p className="text-xs text-gray-400">例如: gpt-4o, deepseek-chat, llama3 等</p>
            </div>

            <Button onClick={handleSave} className="gap-2">
              <Save size={16} />
              保存配置
            </Button>
          </CardContent>
        </Card>

        {/* 外观设置 */}
        <Card>
          <CardHeader>
            <CardTitle>外观</CardTitle>
            <CardDescription>自定义应用的显示效果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">深色模式</p>
                <p className="text-xs text-gray-400">切换亮色/深色主题</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 关于 */}
        <Card>
          <CardHeader>
            <CardTitle>关于</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>版本: 0.1.0</p>
              <p>技术栈: React 19 + Tauri 2 + UnoCSS + shadcn/ui</p>
              <p>状态管理: Zustand</p>
              <p>路由: React Router</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
