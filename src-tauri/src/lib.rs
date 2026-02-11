pub mod commands;
pub mod models;
pub mod services;

use commands::{file_cmd, system_cmd};

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
            file_cmd::delete_file,
            file_cmd::delete_dir,
            system_cmd::system_set_theme_dark,
            system_cmd::system_get_theme_dark,
            system_cmd::system_set_brightness,
            system_cmd::system_get_brightness,
            system_cmd::system_start_screensaver,
            system_cmd::system_open_screensaver_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
