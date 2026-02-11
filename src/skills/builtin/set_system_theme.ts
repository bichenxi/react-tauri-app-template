import type { Skill } from '@/skills/types'
import { invoke } from '@tauri-apps/api/core'

/** 切换系统黑暗/浅色模式（macOS、Windows 支持） */
export const setSystemThemeSkill: Skill = {
  id: 'builtin/set_system_theme',
  name: 'set_system_theme',
  description:
    '切换系统外观为黑暗模式或浅色模式。当用户说「切换暗色模式」「打开黑暗模式」「换成浅色」等时使用。',
  parameters: {
    type: 'object',
    properties: {
      dark: {
        type: 'boolean',
        description: 'true 为黑暗模式，false 为浅色模式',
      },
    },
    required: ['dark'],
  },
  handler: async (args) => {
    const dark = args.dark as boolean
    await invoke('system_set_theme_dark', { dark })
    return dark ? '已切换到黑暗模式。' : '已切换到浅色模式。'
  },
}
