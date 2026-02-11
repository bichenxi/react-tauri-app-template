import type { Skill } from '@/skills/types'
import { invoke } from '@tauri-apps/api/core'

/** 启动屏保（macOS 启动屏保；Windows 锁屏） */
export const startScreensaverSkill: Skill = {
  id: 'builtin/start_screensaver',
  name: 'start_screensaver',
  description:
    '立即启动屏保。macOS 会打开屏保画面，Windows 会锁屏。当用户说「打开屏保」「启动屏保」「锁屏」等时使用。',
  parameters: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    await invoke('system_start_screensaver')
    return '已启动屏保。'
  },
}

/** 打开系统屏保/锁屏设置 */
export const openScreensaverSettingsSkill: Skill = {
  id: 'builtin/open_screensaver_settings',
  name: 'open_screensaver_settings',
  description:
    '打开系统的屏保或锁屏设置界面，让用户自行选择屏保样式等。当用户说「打开屏保设置」「屏保在哪里设置」等时使用。',
  parameters: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    await invoke('system_open_screensaver_settings')
    return '已打开屏保设置。'
  },
}
