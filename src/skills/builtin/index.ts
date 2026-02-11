import type { Skill } from '@/skills/types'
import { createFileSkill } from './create_file'
import { readFileSkill } from './read_file'
import { listFilesSkill } from './list_files'
import { deleteFileSkill } from './delete_file'
import { deleteDirSkill } from './delete_dir'
import { setSystemThemeSkill } from './set_system_theme'
import { setBrightnessSkill } from './set_brightness'
import { startScreensaverSkill, openScreensaverSettingsSkill } from './screensaver'

/** 内置技能：文件操作 + 系统设置（外观、亮度、屏保） */
export const BUILTIN_SKILLS: Skill[] = [
  createFileSkill,
  readFileSkill,
  listFilesSkill,
  deleteFileSkill,
  deleteDirSkill,
  setSystemThemeSkill,
  setBrightnessSkill,
  startScreensaverSkill,
  openScreensaverSettingsSkill,
]
