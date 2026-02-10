/**
 * AI Tool Calling 协议定义
 *
 * 定义了所有可供 AI 调用的工具，以及 OpenAI 兼容的 tools 参数格式。
 * 同时提供 System Prompt，告知 AI 它拥有哪些能力。
 */

// ========== 工具定义 (OpenAI Function Calling 格式) ==========

export interface ToolFunction {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolDefinition {
  type: 'function'
  function: ToolFunction
}

/** 所有可用工具的定义 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_file',
      description:
        '在用户电脑上创建一个文件。只能在安全目录下创建（Desktop, Documents, Downloads）。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              '文件的完整绝对路径，例如 /Users/用户名/Desktop/note.txt。必须在 Desktop、Documents 或 Downloads 目录下。',
          },
          content: {
            type: 'string',
            description: '文件的内容',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        '读取用户电脑上的一个文件内容。只能读取安全目录下的文件（Desktop, Documents, Downloads）。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件的完整绝对路径',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description:
        '列出用户电脑上某个目录下的所有文件和文件夹名称。只能列出安全目录下的内容（Desktop, Documents, Downloads）。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '目录的完整绝对路径',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description:
        '删除用户电脑上的一个文件。只能删除安全目录下的文件（Desktop, Documents, Downloads），不能删除目录。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '要删除的文件的完整绝对路径',
          },
        },
        required: ['path'],
      },
    },
  },
]

// ========== System Prompt ==========

/**
 * 生成包含工具使用说明的 System Prompt
 * @param homeDir 用户主目录路径，用于让 AI 知道如何构建路径
 */
export function buildSystemPrompt(homeDir: string): string {
  return `你是一个智能桌面助手，运行在用户的电脑上。你可以通过工具调用来帮助用户操作文件。

## 你的能力
1. **创建文件**: 在用户的桌面(Desktop)、文档(Documents)或下载(Downloads)目录下创建文件。
2. **读取文件**: 读取上述目录下的文件内容，并对内容进行总结或分析。
3. **列出文件**: 查看上述目录下有哪些文件。
4. **删除文件**: 删除上述目录下的某个文件（仅限文件，不能删目录）。

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
- **删除文件**：当用户说"删掉/删除 桌面/文档/下载 上的 xxx"时，你必须调用 delete_file 工具，传入完整路径（如 ${homeDir}/Desktop/文件名），不要只回复文字而不执行。`
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
