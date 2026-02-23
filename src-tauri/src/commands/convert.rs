use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{command, AppHandle};
use uuid::Uuid;

use crate::models::ebook::{ConvertConfig, OutputFormat};
use crate::services::epub_builder::EpubBuilderService;
use crate::services::format_converter::FormatConverterService;
use crate::services::pdf_parser::PdfParserService;
use crate::utils::error::AppError;
use crate::utils::progress::emit_progress;

// Global cancellation flag (simple implementation)
static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

/// Check if Calibre's ebook-convert is installed
#[command]
pub fn check_calibre_installed() -> bool {
    FormatConverterService::is_available()
}

/// Convert PDF to e-book format
#[command]
pub async fn convert_pdf_to_ebook(
    app: AppHandle,
    config: ConvertConfig,
) -> Result<String, AppError> {
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    let task_id = Uuid::new_v4().to_string();
    let tid = task_id.clone();

    let result = tokio::task::spawn_blocking(move || {
        // Stage 1 & 2: Extract text and analyze
        emit_progress(&app, &tid, 5, "extracting_text", "Extracting text...");
        
        let pages = PdfParserService::extract_all_text(&config.input_path)?;
        let total_chars: usize = pages.iter().map(|p| p.trim().len()).sum();
        let is_scanned = total_chars < 50;

        if CANCEL_FLAG.load(Ordering::SeqCst) {
            return Err(AppError::Cancelled);
        }

        if is_scanned && config.ocr.enabled {
            // OCR path: for scanned PDFs, we'd render pages to images and OCR them
            emit_progress(&app, &tid, 20, "ocr_processing", "Running OCR...");
            log::warn!("OCR processing requested but Tesseract sidecar integration is pending");
            // Placeholder: would update `pages` with OCR result here
        }

        if CANCEL_FLAG.load(Ordering::SeqCst) {
            return Err(AppError::Cancelled);
        }

        // Stage 3: Build chapters
        emit_progress(&app, &tid, 50, "building_structure", "Building document structure...");
        let chapters = EpubBuilderService::text_to_chapters(&pages);

        if CANCEL_FLAG.load(Ordering::SeqCst) {
            return Err(AppError::Cancelled);
        }

        // Stage 4: Generate output based on format
        match config.output_format {
            OutputFormat::Txt => {
                emit_progress(&app, &tid, 80, "writing_txt", "Writing TXT...");
                let all_text = pages.join("\n\n---\n\n");
                std::fs::write(&config.output_path, all_text)?;
                emit_progress(&app, &tid, 100, "done", "Conversion completed!");
                Ok(config.output_path)
            }
            OutputFormat::Md => {
                emit_progress(&app, &tid, 80, "writing_md", "Writing Markdown...");
                let mut md_content = String::new();
                md_content.push_str(&format!("# {}\n\n", config.metadata.title));
                if !config.metadata.author.is_empty() {
                    md_content.push_str(&format!("**Author:** {}\n\n", config.metadata.author));
                }
                for chapter in chapters {
                    md_content.push_str(&format!("## {}\n\n", chapter.title));
                    let cleaned = chapter.content
                        .replace("<p>", "")
                        .replace("</p>\n", "\n\n")
                        .replace("</p>", "\n\n")
                        .replace("&amp;", "&")
                        .replace("&lt;", "<")
                        .replace("&gt;", ">")
                        .replace("&quot;", "\"");
                    md_content.push_str(&cleaned);
                }
                std::fs::write(&config.output_path, md_content)?;
                emit_progress(&app, &tid, 100, "done", "Conversion completed!");
                Ok(config.output_path)
            }
            OutputFormat::Html => {
                emit_progress(&app, &tid, 80, "writing_html", "Writing HTML...");
                let html_content = format!(
                    "<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\"><title>{}</title></head><body>\n{}\n</body></html>",
                    config.metadata.title,
                    pages.iter().map(|p| format!("<p>{}</p>", p)).collect::<Vec<_>>().join("\n")
                );
                std::fs::write(&config.output_path, html_content)?;
                emit_progress(&app, &tid, 100, "done", "Conversion completed!");
                Ok(config.output_path)
            }
            _ => {
                // For EPUB and other formats (MOBI, AZW3, DOCX, FB2) that rely on EPUB
                emit_progress(&app, &tid, 65, "building_epub", "Building EPUB...");

                let epub_path = match config.output_format {
                    OutputFormat::Epub => config.output_path.clone(),
                    _ => {
                        let dir = std::env::temp_dir();
                        dir.join(format!("{}.epub", tid)).to_string_lossy().to_string()
                    }
                };

                let mut epub_config = config.clone();
                epub_config.output_path = epub_path.clone();
                EpubBuilderService::build_epub(&epub_config, chapters)?;

                if CANCEL_FLAG.load(Ordering::SeqCst) {
                    return Err(AppError::Cancelled);
                }

                if matches!(config.output_format, OutputFormat::Epub) {
                    emit_progress(&app, &tid, 100, "done", "Conversion completed!");
                    Ok(config.output_path)
                } else {
                    emit_progress(
                        &app,
                        &tid,
                        80,
                        "converting_format",
                        &format!("Converting to {}...", config.output_format),
                    );
                    let result = FormatConverterService::convert_epub_to_format(
                        &epub_path,
                        &config.output_path,
                        &config.output_format,
                    );
                    let _ = std::fs::remove_file(&epub_path);

                    match result {
                        Ok(path) => {
                            emit_progress(&app, &tid, 100, "done", "Conversion completed!");
                            Ok(path)
                        }
                        Err(e) => Err(e),
                    }
                }
            }
        }
    })
    .await
    .map_err(|e| AppError::ConversionError(format!("Task join error: {}", e)))?;

    result
}

/// Cancel an in-progress conversion
#[command]
pub async fn cancel_conversion(_task_id: String) -> Result<(), AppError> {
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    log::info!("Conversion cancellation requested");
    Ok(())
}
