use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub language: String,
    pub theme: String,
    pub last_output_path: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            language: "en-US".to_string(),
            theme: "system".to_string(),
            last_output_path: String::new(),
        }
    }
}
