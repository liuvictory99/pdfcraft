use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
pub struct ProgressPayload {
    pub task_id: String,
    pub percent: u32,
    pub stage: String,
    pub message: String,
}

/// Emit a progress event to the frontend
pub fn emit_progress(
    app: &AppHandle,
    task_id: &str,
    percent: u32,
    stage: &str,
    message: &str,
) {
    let payload = ProgressPayload {
        task_id: task_id.to_string(),
        percent,
        stage: stage.to_string(),
        message: message.to_string(),
    };
    let _ = app.emit("conversion-progress", payload);
}
