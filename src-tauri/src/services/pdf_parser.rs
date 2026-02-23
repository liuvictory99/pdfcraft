use std::fs;
use std::path::Path;
use lopdf::Document;
use crate::models::pdf::PdfInfo;
use crate::utils::error::AppError;

pub struct PdfParserService;

impl PdfParserService {
    /// Get PDF file information
    pub fn get_info(path: &str) -> Result<PdfInfo, AppError> {
        if !Path::new(path).exists() {
            return Err(AppError::FileNotFound(path.to_string()));
        }

        let metadata = fs::metadata(path)?;
        let file_size = metadata.len();

        let doc = Document::load(path)
            .map_err(|e| AppError::PdfError(format!("Failed to load PDF: {}", e)))?;

        let page_count = doc.get_pages().len();

        // Extract metadata from PDF info dictionary
        let title = Self::extract_info_field(&doc, b"Title");
        let author = Self::extract_info_field(&doc, b"Author");

        // Generate a simple placeholder thumbnail (base64 encoded)
        let thumbnail = Self::generate_placeholder_thumbnail(page_count);

        Ok(PdfInfo {
            page_count,
            file_size,
            title,
            author,
            thumbnail,
        })
    }

    /// Extract text content from a specific page
    pub fn extract_page_text(path: &str, page_num: usize) -> Result<String, AppError> {
        let doc = Document::load(path)
            .map_err(|e| AppError::PdfError(format!("Failed to load PDF: {}", e)))?;

        let pages: Vec<lopdf::ObjectId> = doc.page_iter().collect();
        if page_num == 0 || page_num > pages.len() {
            return Err(AppError::PdfError(format!(
                "Page {} out of range (1-{})", page_num, pages.len()
            )));
        }

        let page_id = pages[page_num - 1];
        let text = doc.extract_text(&[page_id.0 as u32])
            .unwrap_or_default();

        Ok(text)
    }

    /// Extract all text from a PDF
    pub fn extract_all_text(path: &str) -> Result<Vec<String>, AppError> {
        let doc = Document::load(path)
            .map_err(|e| AppError::PdfError(format!("Failed to load PDF: {}", e)))?;

        let pages: Vec<lopdf::ObjectId> = doc.page_iter().collect();
        let mut texts = Vec::new();

        for (i, _page_id) in pages.iter().enumerate() {
            let page_num = (i + 1) as u32;
            let text = doc.extract_text(&[page_num]).unwrap_or_default();
            texts.push(text);
        }

        Ok(texts)
    }

    /// Check if a PDF is likely a scanned document (no extractable text)
    pub fn is_scanned_pdf(path: &str) -> Result<bool, AppError> {
        let doc = Document::load(path)
            .map_err(|e| AppError::PdfError(format!("Failed to load PDF: {}", e)))?;

        let pages: Vec<lopdf::ObjectId> = doc.page_iter().collect();
        let pages_to_check = std::cmp::min(5, pages.len());
        let mut total_chars = 0;

        for i in 0..pages_to_check {
            let page_num = (i + 1) as u32;
            let text = doc.extract_text(&[page_num]).unwrap_or_default();
            total_chars += text.trim().len();
        }
        
        // If very little text is extractable in the first 5 pages, likely a scanned doc
        Ok(total_chars < 50)
    }

    fn extract_info_field(doc: &Document, key: &[u8]) -> Option<String> {
        if let Ok(info_ref) = doc.trailer.get(b"Info") {
            if let Ok(info_id) = info_ref.as_reference() {
                if let Ok(lopdf::Object::Dictionary(ref info_dict)) = doc.get_object(info_id) {
                    if let Ok(val) = info_dict.get(key) {
                        return match val {
                            lopdf::Object::String(bytes, _) => {
                                Some(String::from_utf8_lossy(bytes).to_string())
                            }
                            _ => None,
                        };
                    }
                }
            }
        }
        None
    }

    fn generate_placeholder_thumbnail(_page_count: usize) -> String {
        // Return a minimal 1x1 transparent PNG as base64 placeholder
        // In production, use pdfium-render for real thumbnails
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_info_missing_file() {
        let result = PdfParserService::get_info("/nonexistent/test.pdf");
        assert!(result.is_err());
    }
}
