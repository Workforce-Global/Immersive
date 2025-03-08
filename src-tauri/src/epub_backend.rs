use epub::doc::EpubDoc;
use serde::Serialize;
use std::fs::{self, File};
use std::io::{Write};
use std::path::{PathBuf};
use tauri::{AppHandle};
use base64::engine::general_purpose::STANDARD;
use base64::Engine;


#[derive(Serialize)]
pub struct EpubMetadata {
    pub title: String,
    pub author: String,
    pub cover: Option<String>,
}

#[tauri::command]
pub fn extract_metadata(app_handle: AppHandle, file_path: String) -> Result<EpubMetadata, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let mut doc = EpubDoc::new(&file_path).map_err(|e| format!("Failed to open EPUB file: {:?}", e))?;

    let title = doc
        .mdata("title")
        .unwrap_or_else(|| "Unknown Title".to_string());
    let author = doc
        .mdata("creator")
        .unwrap_or_else(|| "Unknown Author".to_string());

    // Extract cover image if available
    let cover_base64 = match doc.get_cover() {
        Some((cover_data, _)) => {
            // Use AppHandle to get app data dir properly
            let app_data_path = app_handle.path_resolver().app_data_dir()
                .ok_or("Failed to get app data dir")?
                .join("books");

            // Ensure books directory exists
            if !app_data_path.exists() {
                fs::create_dir_all(&app_data_path).map_err(|e| format!("Failed to create books directory: {:?}", e))?;
            }

            // Generate a unique cover filename based on the book ID
            let book_id = path.file_stem()
                .and_then(|os_str| os_str.to_str())
                .unwrap_or("unknown_cover")
                .to_string();
            let cover_file_path = app_data_path.join(format!("{}.cover.jpg", book_id));

            // Save cover image to file
            match File::create(&cover_file_path) {
                Ok(mut file) => {
                    if let Err(e) = file.write_all(&cover_data) {
                        eprintln!("Failed to write cover image: {:?}", e);
                        None
                    } else {
                        // Convert image to Base64 for direct frontend display
                        Some(format!("data:image/jpeg;base64,{}", STANDARD.encode(cover_data)))
                    }
                }
                Err(e) => {
                    eprintln!("Failed to create cover file: {:?}", e);
                    None
                }
            }
        }
        None => None,
    };

    Ok(EpubMetadata {
        title,
        author,
        cover: cover_base64,
    })
}

#[tauri::command]
pub fn get_cover_base64(file_path: String) -> Result<String, String> {
    use std::fs;

    let path = PathBuf::from(file_path);
    if !path.exists() {
        return Err(format!("Cover image not found at path: {:?}", path));
    }

    match fs::read(&path) {
        Ok(image_bytes) => {
            let base64_string = format!(
                "data:image/jpeg;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(image_bytes)
            );
            Ok(base64_string)
        }
        Err(e) => Err(format!("Failed to read cover image: {:?}", e)),
    }
}



#[tauri::command]
pub fn check_storage_path(handle: AppHandle) -> Result<String, String> {
    let app_data_path = handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data dir")?; // Handle None case properly

    let storage_path: PathBuf = app_data_path.join("books");

    println!("Resolved Storage Path: {:?}", storage_path); // Debugging

    if !storage_path.exists() {
        return Err(format!(
            "Path does not exist: {:?}",
            storage_path.to_string_lossy()
        ));
    }

    Ok(storage_path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn read_epub_content(file_path: String) -> Result<Vec<u8>, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    fs::read(&path)
        .map_err(|e| format!("Failed to read EPUB content: {:?}", e))
}