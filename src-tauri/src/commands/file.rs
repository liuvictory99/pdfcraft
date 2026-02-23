use tauri::command;
use crate::models::config::AppConfig;
use crate::utils::error::AppError;

/// Get application configuration
#[command]
pub async fn get_app_config() -> Result<AppConfig, AppError> {
    // In a full implementation, this would read from a persistent store
    // (e.g., tauri-plugin-store or a local JSON file)
    Ok(AppConfig::default())
}

/// Update application configuration
#[command]
pub async fn update_app_config(config: AppConfig) -> Result<(), AppError> {
    log::info!(
        "Config updated: language={}, theme={}",
        config.language,
        config.theme
    );
    // In a full implementation, persist to disk
    Ok(())
}
