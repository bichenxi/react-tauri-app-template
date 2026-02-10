/**
 * 解析用户输入中的「删除文件」意图
 * 匹配：删掉/删除 + (桌面|文档|下载|文稿) + 上的? + 文件名
 * 返回完整绝对路径，若不匹配则返回 null
 */
export function parseDeleteFileIntent(
  userMessage: string,
  homeDir: string
): string | null {
  if (!homeDir) return null

  const trimmed = userMessage.trim()
  // 删掉、删除、移除、删了
  if (!/^(删掉|删除|移除|删了)/i.test(trimmed)) return null

  const dirMap: Record<string, string> = {
    桌面: 'Desktop',
    文档: 'Documents',
    文稿: 'Documents',
    下载: 'Downloads',
  }

  // 匹配：删掉桌面上的zuowen.txt / 删除 文档 上的 xxx（可有可无空格）
  const match = trimmed.match(
    /(?:删掉|删除|移除|删了)\s*(桌面|文档|文稿|下载)\s*上的?\s*([^\s，。！？]+)/i
  )
  if (match) {
    const dirName = match[1]
    const fileName = match[2].trim()
    if (!fileName) return null
    const dir = dirMap[dirName] || 'Desktop'
    return `${homeDir}/${dir}/${fileName}`
  }

  return null
}
