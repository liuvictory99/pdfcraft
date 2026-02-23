use tauri::command;
use crate::models::pdf::{MergeConfig, PdfInfo};
use crate::services::pdf_merger::PdfMergerService;
use crate::services::pdf_parser::PdfParserService;
use crate::utils::error::AppError;

/// Get PDF file info (page count, metadata, thumbnail)
#[command]
pub async fn get_pdf_info(path: String) -> Result<PdfInfo, AppError> {
    tokio::task::spawn_blocking(move || PdfParserService::get_info(&path))
        .await
        .map_err(|e| AppError::PdfError(format!("Task join error: {}", e)))?
}

/// Merge multiple PDF files into one
#[command]
pub async fn merge_pdfs(config: MergeConfig) -> Result<String, AppError> {
    tokio::task::spawn_blocking(move || PdfMergerService::merge(&config))
        .await
        .map_err(|e| AppError::PdfError(format!("Task join error: {}", e)))?
}
