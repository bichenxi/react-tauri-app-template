//! 系统级电脑设置：黑暗模式、亮度、屏保等（按平台实现）

use std::process::Command;

/// 设置系统外观为黑暗/浅色模式
#[tauri::command]
pub fn system_set_theme_dark(dark: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // 使用 AppleScript 即时切换，无需重启
        let script = if dark {
            r#"tell application "System Events" to tell appearance preferences to set dark mode to true"#
        } else {
            r#"tell application "System Events" to tell appearance preferences to set dark mode to false"#
        };
        let out = Command::new("osascript")
            .args(["-e", script])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("AppleScript 执行失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        let value = if dark { "0" } else { "1" };
        let ps = format!(
            r#"Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' -Name 'AppsUseLightTheme' -Value {} -Type DWord -Force; Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' -Name 'SystemUsesLightTheme' -Value {} -Type DWord -Force"#,
            value, value
        );
        let out = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &ps])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("PowerShell 执行失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = dark;
        Err("当前系统不支持在此切换黑暗/浅色模式".to_string())
    }
}

/// 获取系统当前是否为黑暗模式
#[tauri::command]
pub fn system_get_theme_dark() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("defaults")
            .args(["read", "-g", "AppleInterfaceStyle"])
            .output()
            .map_err(|e| e.to_string())?;
        Ok(out.status.success() && String::from_utf8_lossy(&out.stdout).trim() == "Dark")
    }

    #[cfg(target_os = "windows")]
    {
        let out = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "try { (Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name AppsUseLightTheme -ErrorAction Stop).AppsUseLightTheme } catch { 1 }",
            ])
            .output()
            .map_err(|e| e.to_string())?;
        let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
        Ok(s == "0")
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("当前系统不支持".to_string())
    }
}

/// 设置屏幕亮度（0–100）。Windows/Linux 支持；macOS 多数机型不支持，会返回错误。
#[tauri::command]
pub fn system_set_brightness(percent: u8) -> Result<(), String> {
    let p = percent.min(100) as f32 / 100.0;

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        use brightness::blocking::BrightnessDevice;
        let devices = brightness::blocking::brightness_devices().map_err(|e| e.to_string())?;
        for mut dev in devices {
            if let Err(e) = dev.set(p) {
                return Err(e.to_string());
            }
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    {
        let _ = p;
        Err("macOS 暂不支持在此调节亮度，请使用系统设置或键盘快捷键".to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        let _ = p;
        Err("当前系统不支持调节亮度".to_string())
    }
}

/// 获取当前屏幕亮度 0–100。Windows/Linux 支持。
#[tauri::command]
pub fn system_get_brightness() -> Result<f32, String> {
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        use brightness::blocking::BrightnessDevice;
        let devices = brightness::blocking::brightness_devices().map_err(|e| e.to_string())?;
        let mut first: Option<f32> = None;
        for dev in devices {
            let v = dev.get().map_err(|e| e.to_string())?;
            if first.is_none() {
                first = Some(v);
            }
        }
        Ok(first.unwrap_or(0.5) * 100.0)
    }

    #[cfg(target_os = "macos")]
    {
        Err("macOS 暂不支持读取亮度".to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("当前系统不支持".to_string())
    }
}

/// 立即启动屏保（macOS 启动屏保；Windows 锁屏）
#[tauri::command]
pub fn system_start_screensaver() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("open")
            .args(["-a", "Screen Saver Engine"])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("启动屏保失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        let out = Command::new("rundll32.exe")
            .args(["user32.dll,LockWorkStation"])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("锁屏失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("当前系统不支持".to_string())
    }
}

/// 打开系统屏保/锁屏设置
#[tauri::command]
pub fn system_open_screensaver_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("open")
            .args(["/System/Library/PreferencePanes/DesktopScreenEffectsPref.prefPane"])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("打开设置失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        let out = Command::new("rundll32.exe")
            .args(["desk.cpl,InstallScreenSaver"])
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("打开屏保设置失败: {}", stderr));
        }
        Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("当前系统不支持".to_string())
    }
}
