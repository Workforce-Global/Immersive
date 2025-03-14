// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use]
mod epub_backend;
use epub_backend::{extract_metadata, get_cover_base64, check_storage_path, read_epub_content}; // Explicitly importing functions

use tauri::{Manager, Window}; // ✅ Import Manager for get_window

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window: Window = app.get_window("main").unwrap(); // ✅ Now it works!
            window.set_resizable(true).unwrap();  // ✅ Ensure the window can be resized
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            extract_metadata,
            get_cover_base64,
            check_storage_path,
            read_epub_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
