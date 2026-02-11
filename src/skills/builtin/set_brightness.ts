import type { Skill } from '@/skills/types'
import { invoke } from '@tauri-apps/api/core'

/** 调节屏幕亮度（Windows/Linux 支持；macOS 可能不支持） */
export const setBrightnessSkill: Skill = {
  id: 'builtin/set_brightness',
  name: 'set_brightness',
  description:
    '设置屏幕亮度百分比。当用户说「调亮一点」「调暗」「亮度调到 50」等时使用。仅 Windows/Linux 支持；macOS 上会返回错误提示。',
  parameters: {
    type: 'object',
    properties: {
      percent: {
        type: 'number',
        description: '亮度百分比，0–100 的整数',
      },
    },
    required: ['percent'],
  },
  handler: async (args) => {
    const percent = Math.min(100, Math.max(0, Number(args.percent)))
    if (Number.isNaN(percent)) throw new Error('亮度必须是 0–100 的数字')
    await invoke('system_set_brightness', { percent: Math.round(percent) })
    return `已将屏幕亮度设置为 ${Math.round(percent)}%。`
  },
}
