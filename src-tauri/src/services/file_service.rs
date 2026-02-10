use std::fs;
use std::path::{Path, PathBuf};

/// 获取用户主目录
pub fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Cannot determine home directory".to_string())
}

/// 安全目录白名单：只允许在这些目录下进行文件操作
fn get_safe_directories() -> Vec<PathBuf> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return vec![],
    };
    vec![
        home.join("Desktop"),
        home.join("Documents"),
        home.join("Downloads"),
        home.join("桌面"),     // 中文 macOS
        home.join("文稿"),     // 中文 macOS
        home.join("下载"),     // 中文 macOS
    ]
}

/// 校验路径是否在安全目录白名单内
fn validate_path_safety(path: &Path) -> Result<(), String> {
    let canonical = if path.exists() {
        path.canonicalize().map_err(|e| e.to_string())?
    } else {
        // 文件不存在时，校验其父目录
        let parent = path.parent().ok_or("Invalid file path")?;
        if !parent.exists() {
            return Err(format!("Parent directory does not exist: {}", parent.display()));
        }
        let canonical_parent = parent.canonicalize().map_err(|e| e.to_string())?;
        canonical_parent.join(path.file_name().ok_or("Invalid file name")?)
    };

    let safe_dirs = get_safe_directories();
    let is_safe = safe_dirs.iter().any(|safe_dir| {
        if let Ok(canonical_safe) = safe_dir.canonicalize() {
            canonical.starts_with(&canonical_safe)
        } else {
            // 安全目录可能不存在（比如中文macOS上的英文路径），跳过
            false
        }
    });

    if !is_safe {
        return Err(format!(
            "Access denied: path '{}' is outside of allowed directories (Desktop, Documents, Downloads)",
            path.display()
        ));
    }
    Ok(())
}

/// 列出目录下的文件
pub fn list_files_in_dir(path: &str) -> Result<Vec<String>, String> {
    let dir = Path::new(path);
    validate_path_safety(dir)?;

    if !dir.exists() {
        return Err("Directory not found".to_string());
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            if let Ok(name) = entry.file_name().into_string() {
                files.push(name);
            }
        }
    }
    Ok(files)
}

/// 创建/写入文件
pub fn create_file(path: &str, content: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    validate_path_safety(path_obj)?;

    // 确保父目录存在
    if let Some(parent) = path_obj.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(format!("File created successfully: {}", path))
}

/// 读取文件内容
pub fn read_file_content(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    validate_path_safety(path_obj)?;

    if !path_obj.exists() {
        return Err(format!("File not found: {}", path));
    }

    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

/// 删除文件（仅限安全目录下的文件，不允许删除目录）
pub fn delete_file(path: &str) -> Result<String, String> {
    let path_obj = Path::new(path);
    validate_path_safety(path_obj)?;

    if !path_obj.exists() {
        return Err(format!("File not found: {}", path));
    }

    if path_obj.is_dir() {
        return Err("Cannot delete directories; only files are allowed.".to_string());
    }

    fs::remove_file(path).map_err(|e| format!("Failed to delete file: {}", e))?;
    Ok(format!("File deleted successfully: {}", path))
}
