pub mod commands;
pub mod models;
pub mod services;
pub mod utils;

use commands::{convert, file, merge};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            merge::get_pdf_info,
            merge::merge_pdfs,
            convert::convert_pdf_to_ebook,
            convert::cancel_conversion,
            convert::check_calibre_installed,
            file::get_app_config,
            file::update_app_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PDFCraft");
}
