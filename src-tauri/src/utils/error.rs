use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("PDF error: {0}")]
    PdfError(String),

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Conversion error: {0}")]
    ConversionError(String),

    #[error("OCR error: {0}")]
    OcrError(String),

    #[error("Invalid configuration: {0}")]
    ConfigError(String),

    #[error("Sidecar error: {0}")]
    SidecarError(String),

    #[error("Cancelled by user")]
    Cancelled,
}

impl From<lopdf::Error> for AppError {
    fn from(err: lopdf::Error) -> Self {
        AppError::PdfError(err.to_string())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
