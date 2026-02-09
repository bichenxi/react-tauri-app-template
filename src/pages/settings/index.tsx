import { useState, useMemo } from 'react'
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/stores/app'
import { useConfigStore, normalizeApiUrl, isConfigReady } from '@/stores/config'

/** 按 API 提供商分组的常用模型和 base URL */
const MODEL_PRESETS: Record<string, { label: string; baseUrl: string; models: string[] }> = {
  'dashscope.aliyuncs.com': {
    label: '阿里云 DashScope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext', 'qwen-vl-plus', 'qwen-vl-max'],
  },
  'api.openai.com': {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
  },
  'api.deepseek.com': {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  },
  'api.siliconflow.cn': {
    label: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
  },
}

/** 根据 API URL 推断可用模型列表 */
function getModelSuggestions(apiUrl: string): (typeof MODEL_PRESETS)[string] | null {
  for (const [domain, preset] of Object.entries(MODEL_PRESETS)) {
    if (apiUrl.includes(domain)) return preset
  }
  return null
}

/** 检测是否运行在 Tauri 环境中 */
const isTauri = () => !!(window as any).__TAURI_INTERNALS__

/** 获取适合当前环境的 fetch 函数 */
async function getFetch(): Promise<typeof globalThis.fetch> {
  if (isTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    return tauriFetch
  }
  return globalThis.fetch
}

/** 测试 API 连接 */
async function testConnection(apiUrl: string, apiKey: string, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const url = normalizeApiUrl(apiUrl)
    const httpFetch = await getFetch()

    console.log('[Test Connection]', { url, model, isTauri: isTauri() })

    const response = await httpFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        stream: false,
      }),
    })

    if (!response.ok) {
      let detail = ''
      try {
        const body = await response.text()
        const parsed = JSON.parse(body)
        detail = parsed.error?.message || parsed.message || body
      } catch {
        detail = response.statusText
      }
      return { ok: false, message: `HTTP ${response.status}: ${detail}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return { ok: true, message: `连接成功！模型回复: "${content.slice(0, 50)}"` }
  } catch (error: any) {
    const msg = error?.message || error?.toString?.() || '未知错误'
    return { ok: false, message: msg }
  }
}

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore()
  const { apiUrl, apiKey, model, setApiUrl, setApiKey, setModel } = useConfigStore()
  const navigate = useNavigate()
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const modelPreset = useMemo(() => getModelSuggestions(apiUrl), [apiUrl])
  const configOk = isConfigReady({ apiUrl, apiKey, model })

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection(apiUrl, apiKey, model)
    setTestResult(result)
    setTesting(false)
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
                onChange={(e) => { setApiUrl(e.target.value); setTestResult(null) }}
                placeholder="https://api.deepseek.com"
              />
              <p className="text-xs text-gray-400">
                填写 base URL 即可，会自动补全 /chat/completions
              </p>
              {/* 各提供商快捷填入 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.values(MODEL_PRESETS).map((preset) => (
                  <button
                    key={preset.baseUrl}
                    type="button"
                    onClick={() => { setApiUrl(preset.baseUrl); setTestResult(null) }}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                      apiUrl.includes(preset.baseUrl)
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'bg-white/50 border-gray-200 text-gray-400 hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
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
                placeholder={modelPreset?.models[0] || 'qwen-turbo'}
                list="model-suggestions"
              />
              {/* 原生 datalist 提供输入自动补全 */}
              <datalist id="model-suggestions">
                {(modelPreset?.models ?? ['qwen-turbo', 'gpt-4o', 'deepseek-chat']).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>

              {/* 快捷选择：显示推荐模型标签 */}
              {modelPreset && (
                <div className="pt-1">
                  <p className="text-xs text-gray-400 mb-2">
                    检测到 {modelPreset.label}，推荐模型：
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {modelPreset.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          model === m
                            ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                            : 'bg-white/50 border-gray-200 text-gray-500 hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!modelPreset && (
                <p className="text-xs text-gray-400">例如: gpt-4o, qwen-turbo, deepseek-chat 等</p>
              )}
            </div>

            {/* 测试连接 */}
            <div className="pt-2 space-y-3">
              <Button
                onClick={handleTest}
                disabled={!configOk || testing}
                variant="outline"
                className="w-full gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </Button>

              {testResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  testResult.ok
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                }`}>
                  {testResult.ok ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
                  <span className="break-all">{testResult.message}</span>
                </div>
              )}

              {configOk && !testResult && (
                <p className="text-xs text-gray-400 text-center">
                  实际请求地址: {normalizeApiUrl(apiUrl)}
                </p>
              )}
            </div>
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
