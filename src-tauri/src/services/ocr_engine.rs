use std::process::Command;
use crate::utils::error::AppError;

pub struct OcrEngine;

impl OcrEngine {
    /// Run OCR on a single image file using Tesseract
    pub fn recognize_image(
        image_path: &str,
        output_path: &str,
        languages: &[String],
    ) -> Result<String, AppError> {
        let tesseract = Self::find_tesseract()?;
        let lang_str = if languages.is_empty() {
            "eng".to_string()
        } else {
            languages.join("+")
        };

        let output = Command::new(&tesseract)
            .arg(image_path)
            .arg(output_path) // Tesseract auto-appends .txt
            .arg("-l")
            .arg(&lang_str)
            .output()
            .map_err(|e| AppError::OcrError(format!("Failed to run Tesseract: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::OcrError(format!("Tesseract failed: {}", stderr)));
        }

        // Read the output text file
        let txt_path = format!("{}.txt", output_path);
        let text = std::fs::read_to_string(&txt_path).unwrap_or_default();

        // Clean up temp file
        let _ = std::fs::remove_file(&txt_path);

        Ok(text)
    }

    /// Find Tesseract executable
    fn find_tesseract() -> Result<String, AppError> {
        let candidates = if cfg!(target_os = "macos") {
            vec![
                "/opt/homebrew/bin/tesseract",
                "/usr/local/bin/tesseract",
            ]
        } else if cfg!(target_os = "windows") {
            vec![
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            ]
        } else {
            vec!["/usr/bin/tesseract", "/usr/local/bin/tesseract"]
        };

        for path in &candidates {
            if std::path::Path::new(path).exists() {
                return Ok(path.to_string());
            }
        }

        // Try PATH
        let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
        if let Ok(output) = Command::new(which_cmd).arg("tesseract").output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(path);
                }
            }
        }

        Err(AppError::OcrError(
            "Tesseract not found. Please install Tesseract OCR for scanned PDF support.".to_string(),
        ))
    }

    /// Check if Tesseract is available
    pub fn is_available() -> bool {
        Self::find_tesseract().is_ok()
    }
}
