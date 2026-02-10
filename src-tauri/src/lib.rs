pub mod commands;
pub mod models;
pub mod services;

use commands::file_cmd;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            file_cmd::get_home_dir,
            file_cmd::list_files,
            file_cmd::create_file,
            file_cmd::read_file,
            file_cmd::delete_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
