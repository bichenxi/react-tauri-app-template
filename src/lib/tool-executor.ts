/**
 * Tool Executor - 工具调用执行器
 *
 * 接收 AI 返回的工具调用指令，分发给对应的 Tauri 后端服务执行，
 * 并返回结构化结果。
 */

import { fileService } from '@/services/tauri/files'
import type { ParsedToolCall, ToolResult } from '@/lib/tools'

/**
 * 执行单个工具调用
 */
export async function executeTool(toolCall: ParsedToolCall): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall

  try {
    let result: string

    switch (name) {
      case 'create_file': {
        const path = args.path as string
        const content = args.content as string
        if (!path || content === undefined) {
          throw new Error('缺少参数: path 和 content 是必需的')
        }
        result = await fileService.createFile(path, content)
        break
      }

      case 'read_file': {
        const path = args.path as string
        if (!path) {
          throw new Error('缺少参数: path 是必需的')
        }
        const content = await fileService.readFile(path)
        // 如果文件内容很长，截取前 2000 个字符
        result = content.length > 2000
          ? content.slice(0, 2000) + '\n\n... (内容已截断，共 ' + content.length + ' 字符)'
          : content
        break
      }

      case 'list_files': {
        const path = args.path as string
        if (!path) {
          throw new Error('缺少参数: path 是必需的')
        }
        const files = await fileService.listFiles(path)
        result = files.length > 0
          ? `目录包含 ${files.length} 个项目:\n${files.join('\n')}`
          : '目录为空'
        break
      }

      case 'delete_file': {
        const path = args.path as string
        if (!path) {
          throw new Error('缺少参数: path 是必需的')
        }
        result = await fileService.deleteFile(path)
        break
      }

      default:
        throw new Error(`未知工具: ${name}`)
    }

    return {
      tool_call_id: id,
      name,
      success: true,
      result,
    }
  } catch (error) {
    return {
      tool_call_id: id,
      name,
      success: false,
      result: `执行失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 批量执行多个工具调用
 */
export async function executeTools(toolCalls: ParsedToolCall[]): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map(executeTool))
}
