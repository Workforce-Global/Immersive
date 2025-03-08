// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use]
mod epub_backend;
use epub_backend::{extract_metadata, get_cover_base64, check_storage_path, read_epub_content}; // Explicitly importing functions

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            extract_metadata,
            get_cover_base64,
            check_storage_path,
            read_epub_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
