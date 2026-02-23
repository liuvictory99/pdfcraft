use serde::{Deserialize, Serialize};

/// Output format for e-book conversion
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Epub,
    Mobi,
    Azw3,
    Docx,
    Txt,
    Fb2,
    Html,
    Md,
}

impl std::fmt::Display for OutputFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputFormat::Epub => write!(f, "epub"),
            OutputFormat::Mobi => write!(f, "mobi"),
            OutputFormat::Azw3 => write!(f, "azw3"),
            OutputFormat::Docx => write!(f, "docx"),
            OutputFormat::Txt => write!(f, "txt"),
            OutputFormat::Fb2 => write!(f, "fb2"),
            OutputFormat::Html => write!(f, "html"),
            OutputFormat::Md => write!(f, "md"),
        }
    }
}

/// Layout mode for e-book conversion
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LayoutMode {
    Reflow,
    Fixed,
}

/// Book metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookMetadata {
    pub title: String,
    pub author: String,
    pub cover_path: Option<String>,
}

/// OCR configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrConfig {
    pub enabled: bool,
    pub languages: Vec<String>,
}

/// Conversion configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertConfig {
    pub input_path: String,
    pub output_path: String,
    pub output_format: OutputFormat,
    pub layout_mode: LayoutMode,
    pub ocr: OcrConfig,
    pub metadata: BookMetadata,
    pub keep_images: bool,
    pub detect_tables: bool,
    pub font_size: String,
}

/// Progress payload sent to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionProgress {
    pub task_id: String,
    pub percent: u32,
    pub stage: String,
    pub message: String,
}
