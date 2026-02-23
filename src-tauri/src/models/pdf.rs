use serde::{Deserialize, Serialize};

/// PDF file entry for merge operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfFileEntry {
    pub path: String,
    pub selected_pages: Option<Vec<usize>>,
}

/// PDF document metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfInfo {
    pub page_count: usize,
    pub file_size: u64,
    pub title: Option<String>,
    pub author: Option<String>,
    pub thumbnail: String,
}

/// Merge configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeConfig {
    pub files: Vec<PdfFileEntry>,
    pub output_path: String,
    pub keep_bookmarks: bool,
    pub page_size: String,
}
