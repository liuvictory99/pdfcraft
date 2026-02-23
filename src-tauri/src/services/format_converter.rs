use std::process::Command;
use crate::models::ebook::OutputFormat;
use crate::utils::error::AppError;

pub struct FormatConverterService;

impl FormatConverterService {
    /// Convert EPUB to another format using Calibre's ebook-convert sidecar
    pub fn convert_epub_to_format(
        epub_path: &str,
        output_path: &str,
        format: &OutputFormat,
    ) -> Result<String, AppError> {
        // Check if ebook-convert is available
        let ebook_convert = Self::find_ebook_convert()?;

        log::info!(
            "Converting {} to {} format at {}",
            epub_path,
            format,
            output_path
        );

        let output = Command::new(&ebook_convert)
            .arg(epub_path)
            .arg(output_path)
            .output()
            .map_err(|e| {
                AppError::SidecarError(format!("Failed to run ebook-convert: {}", e))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::SidecarError(format!(
                "ebook-convert failed: {}",
                stderr
            )));
        }

        log::info!("Format conversion completed: {}", output_path);
        Ok(output_path.to_string())
    }

    /// Find the ebook-convert executable
    fn find_ebook_convert() -> Result<String, AppError> {
        // Try Windows Registry first if on Windows
        #[cfg(target_os = "windows")]
        {
            if let Some(path) = Self::find_in_windows_registry() {
                return Ok(path);
            }
        }

        // Check common locations
        let candidates = if cfg!(target_os = "macos") {
            vec![
                "/Applications/calibre.app/Contents/MacOS/ebook-convert",
                "/usr/local/bin/ebook-convert",
            ]
        } else if cfg!(target_os = "windows") {
            vec![
                r"C:\Program Files\Calibre2\ebook-convert.exe",
                r"C:\Program Files (x86)\Calibre2\ebook-convert.exe",
            ]
        } else {
            vec!["/usr/bin/ebook-convert", "/usr/local/bin/ebook-convert"]
        };

        for path in &candidates {
            if std::path::Path::new(path).exists() {
                return Ok(path.to_string());
            }
        }

        // Try PATH
        let which_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
        let output = Command::new(which_cmd)
            .arg("ebook-convert")
            .output();
            
        if let Ok(out) = output {
            if out.status.success() {
                // `where` might return multiple lines on Windows, take the first one
                let path = String::from_utf8_lossy(&out.stdout).lines().next().unwrap_or("").trim().to_string();
                if !path.is_empty() {
                    return Ok(path);
                }
            }
        }

        Err(AppError::SidecarError(
            "ebook-convert not found. Please install Calibre to enable MOBI/AZW3/DOCX/FB2 conversion."
                .to_string(),
        ))
    }

    #[cfg(target_os = "windows")]
    fn find_in_windows_registry() -> Option<String> {
        // Query the uninstall registry key for Calibre
        let keys_to_check = [
            r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\calibre",
            r"HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\calibre"
        ];

        for key in keys_to_check {
            let output = Command::new("reg")
                .args(&["query", key, "/v", "InstallLocation"])
                .output();

            if let Ok(out) = output {
                if out.status.success() {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    // Output format is typically: 
                    //     InstallLocation    REG_SZ    C:\Program Files\Calibre2\
                    for line in stdout.lines() {
                        if line.contains("InstallLocation") {
                            let parts: Vec<&str> = line.split("REG_SZ").collect();
                            if parts.len() == 2 {
                                let dir_path = parts[1].trim();
                                let exe_path = std::path::Path::new(dir_path).join("ebook-convert.exe");
                                if exe_path.exists() {
                                    return Some(exe_path.to_string_lossy().to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
        None
    }

    /// Check if Calibre ebook-convert is available on this system
    pub fn is_available() -> bool {
        Self::find_ebook_convert().is_ok()
    }
}
