use crate::services::file_service;

/// 获取用户主目录路径
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    file_service::get_home_directory()
}

/// 列出目录下的文件
#[tauri::command]
pub fn list_files(path: String) -> Result<Vec<String>, String> {
    file_service::list_files_in_dir(&path)
}

/// 创建文件 (仅允许在安全目录下)
#[tauri::command]
pub fn create_file(path: String, content: String) -> Result<String, String> {
    file_service::create_file(&path, &content)
}

/// 读取文件内容 (仅允许在安全目录下)
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    file_service::read_file_content(&path)
}

/// 删除文件 (仅允许在安全目录下，且只能删文件不能删目录)
#[tauri::command]
pub fn delete_file(path: String) -> Result<String, String> {
    file_service::delete_file(&path)
}
