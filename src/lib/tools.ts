/**
 * AI Tool Calling 协议定义
 *
 * 工具列表来自技能注册表（内置 + 已安装），与 OpenAI 兼容的 tools 格式。
 */

import { getAllSkills } from '@/skills/registry'
import { skillToToolDefinition } from '@/skills/types'
import type { ToolDefinition } from '@/skills/types'

// ========== 工具定义（由技能注册表动态生成） ==========

/** 获取当前对 AI 开放的工具（全部内置工具） */
export function getAvailableTools(): ToolDefinition[] {
  return getAllSkills().map(skillToToolDefinition)
}

/** 兼容旧引用：等同于 getAvailableTools() 的首次结果 */
export const AVAILABLE_TOOLS: ToolDefinition[] = getAvailableTools()

// 兼容旧引用：若别处用了 tools.ToolFunction，从 types 导出
export type { ToolDefinition } from '@/skills/types'

// ========== System Prompt ==========

/**
 * 生成包含工具使用说明的 System Prompt
 * @param homeDir 用户主目录路径，用于让 AI 知道如何构建路径
 */
export function buildSystemPrompt(homeDir: string): string {
  const base = `你是一个智能桌面助手，运行在用户的电脑上。你可以通过工具调用来帮助用户操作文件，也可以切换系统外观、调节亮度、启动屏保等。

## 你的能力
1. **创建文件**: 在用户的桌面(Desktop)、文档(Documents)或下载(Downloads)目录下创建文件。
2. **读取文件**: 读取上述目录下的文件内容，并对内容进行总结或分析。
3. **列出文件**: 查看上述目录下有哪些文件。
4. **删除文件**: 删除上述目录下的某个文件（移至回收站）。
5. **删除文件夹**: 删除上述目录下的整个文件夹（整目录移至回收站，含内部所有文件）。
6. **系统外观**: 使用 set_system_theme 切换系统黑暗/浅色模式。用户说「切换暗色模式」「打开黑暗模式」「换成浅色」等时，请调用该工具，不要只说「请手动在系统设置中切换」。
7. **屏幕亮度**: 使用 set_brightness 调节屏幕亮度（0–100）。仅 Windows/Linux 支持；macOS 上会返回不支持，可礼貌说明。
8. **屏保**: 使用 start_screensaver 立即启动屏保（Windows 为锁屏）；使用 open_screensaver_settings 打开屏保设置。

## 重要规则
- 用户的主目录是: ${homeDir}
- 你只能操作以下安全目录:
  - ${homeDir}/Desktop (桌面)
  - ${homeDir}/Documents (文档)
  - ${homeDir}/Downloads (下载)
- 当用户说"桌面"时，对应 ${homeDir}/Desktop
- 当用户说"文档目录"或"文稿"时，对应 ${homeDir}/Documents
- 当用户说"下载目录"时，对应 ${homeDir}/Downloads
- 所有路径必须是完整的绝对路径。
- 如果用户没指定文件名后缀，创建文本文件时默认使用 .txt，Markdown 用 .md。
- 当你需要操作文件时，请使用工具调用。不要只是描述步骤，要实际执行。
- 执行完工具调用后，用简洁友好的语言告诉用户结果。
- **删除文件**：当用户说"删掉/删除 桌面/文档/下载 上的 xxx 文件"时，调用 delete_file，传入完整路径。
- **删除文件夹**：当用户说"删掉/删除 桌面/文档/下载 上的 xxx 文件夹"时，调用 delete_dir，传入完整路径（如 ${homeDir}/Desktop/文件夹名），不要只列出文件或说不能删文件夹。
- **创建多个文件**：当用户要求「生成 N 个/条 文件到某文件夹」时，你必须多次调用 create_file 工具（每个文件调用一次），不要只执行 list_files 就停止。创建路径如 ${homeDir}/Desktop/文件夹名/文件名 时，文件夹会自动被创建，无需先创建文件夹。
- **系统外观**：当用户要求切换暗色/浅色模式时，必须调用 set_system_theme 工具执行，不要只回复「请手动在系统设置中切换」。`
  return base
}

// ========== AI 响应中的 Tool Call 结构 ==========

export interface ToolCallChunk {
  index: number
  id?: string
  type?: string
  function?: {
    name?: string
    arguments?: string
  }
}

export interface ParsedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

/** 工具执行结果 */
export interface ToolResult {
  tool_call_id: string
  name: string
  success: boolean
  result: string
}
