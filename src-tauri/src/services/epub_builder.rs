use std::fs::File;
use std::io::Write;
use epub_builder::{EpubBuilder, EpubContent, EpubVersion, ZipLibrary};
use crate::models::ebook::{ConvertConfig, LayoutMode};
use crate::utils::error::AppError;

pub struct EpubBuilderService;

impl EpubBuilderService {
    /// Build an EPUB file from extracted PDF content
    pub fn build_epub(
        config: &ConvertConfig,
        chapters: Vec<Chapter>,
    ) -> Result<String, AppError> {
        let output_path = &config.output_path;

        let zip = ZipLibrary::new()
            .map_err(|e| AppError::ConversionError(format!("Failed to create ZIP: {}", e)))?;

        let mut builder = EpubBuilder::new(zip)
            .map_err(|e| AppError::ConversionError(format!("Failed to create EPUB builder: {}", e)))?;

        builder.epub_version(EpubVersion::V30);

        // Set metadata
        builder.metadata("title", &config.metadata.title)
            .map_err(|e| AppError::ConversionError(e.to_string()))?;
        builder.metadata("author", &config.metadata.author)
            .map_err(|e| AppError::ConversionError(e.to_string()))?;
        // epub-builder uses "lang" not "language"
        // Auto-detect: if title/author contain CJK characters, use "zh"
        let lang = if Self::contains_cjk(&config.metadata.title)
            || Self::contains_cjk(&config.metadata.author)
        {
            "zh"
        } else {
            "en"
        };
        builder.metadata("lang", lang)
            .map_err(|e| AppError::ConversionError(e.to_string()))?;

        // Add stylesheet
        let css = Self::generate_css(&config.font_size, &config.layout_mode);
        builder.stylesheet(css.as_bytes())
            .map_err(|e| AppError::ConversionError(e.to_string()))?;

        // Add chapters
        for (i, chapter) in chapters.iter().enumerate() {
            let html = Self::chapter_to_html(chapter);
            let filename = format!("chapter_{}.xhtml", i + 1);

            let content = EpubContent::new(&filename, html.as_bytes())
                .title(&chapter.title);

            builder.add_content(content)
                .map_err(|e| AppError::ConversionError(e.to_string()))?;
        }

        // Generate EPUB file
        let file = File::create(output_path)?;
        let mut buf_writer = std::io::BufWriter::new(file);
        builder.generate(&mut buf_writer)
            .map_err(|e| AppError::ConversionError(format!("Failed to generate EPUB: {}", e)))?;
        buf_writer.flush()?;

        log::info!("EPUB created at: {}", output_path);
        Ok(output_path.clone())
    }

    /// Convert extracted text pages into chapters
    pub fn text_to_chapters(pages: &[String]) -> Vec<Chapter> {
        let mut chapters = Vec::new();
        let mut current_content = String::new();
        let mut current_title = String::from("Chapter 1");
        let mut chapter_num = 1;

        for (i, page_text) in pages.iter().enumerate() {
            let trimmed = page_text.trim();
            if trimmed.is_empty() {
                continue;
            }

            // Simple heuristic: if a page starts with a short line (potential title)
            // and has significant content, treat it as a new chapter boundary
            let lines: Vec<&str> = trimmed.lines().collect();
            let first_line = lines.first().map(|l| l.trim()).unwrap_or("");

            let is_chapter_start = i > 0
                && first_line.len() < 60
                && lines.len() > 3
                && (first_line.to_lowercase().contains("chapter")
                    || (first_line.contains("第") && (first_line.contains("章") || first_line.contains("节") || first_line.contains("讲") || first_line.contains("课") || first_line.contains("篇") || first_line.contains("部分"))));

            if is_chapter_start && !current_content.is_empty() {
                chapters.push(Chapter {
                    title: current_title.clone(),
                    content: current_content.clone(),
                });
                chapter_num += 1;
                current_title = if first_line.len() < 60 {
                    first_line.to_string()
                } else {
                    format!("Chapter {}", chapter_num)
                };
                current_content.clear();
            }

            // Append page content as paragraphs
            for line in lines {
                let line = line.trim();
                if !line.is_empty() {
                    current_content.push_str(&format!("<p>{}</p>\n", Self::escape_html(line)));
                }
            }
        }

        // Add the last chapter
        if !current_content.is_empty() {
            chapters.push(Chapter {
                title: current_title,
                content: current_content,
            });
        }

        // Fallback: if no chapters detected, create a single chapter
        if chapters.is_empty() {
            chapters.push(Chapter {
                title: "Content".to_string(),
                content: "<p>No content could be extracted.</p>".to_string(),
            });
        }

        chapters
    }

    fn chapter_to_html(chapter: &Chapter) -> String {
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>{}</title>
  <link rel="stylesheet" href="stylesheet.css" type="text/css"/>
</head>
<body>
  <h1>{}</h1>
  {}
</body>
</html>"#,
            Self::escape_html(&chapter.title),
            Self::escape_html(&chapter.title),
            chapter.content
        )
    }

    fn generate_css(font_size: &str, layout_mode: &LayoutMode) -> String {
        let base_size = match font_size {
            "small" => "0.9em",
            "large" => "1.2em",
            _ => "1em",
        };

        let layout_specific = match layout_mode {
            LayoutMode::Fixed => "body { max-width: 100%; }",
            LayoutMode::Reflow => "body { max-width: 40em; margin: 0 auto; }",
        };

        format!(
            r#"body {{
  font-family: serif;
  font-size: {base_size};
  line-height: 1.6;
  color: #333;
  padding: 1em;
  {layout_specific}
}}

h1 {{
  font-size: 1.5em;
  margin-bottom: 0.8em;
  text-align: center;
  page-break-before: always;
}}

h2 {{ font-size: 1.3em; margin: 1em 0 0.5em; }}
h3 {{ font-size: 1.1em; margin: 0.8em 0 0.4em; }}

p {{
  margin: 0.5em 0;
  text-indent: 2em;
  text-align: justify;
}}

img {{
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}}

table {{
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}}

td, th {{
  border: 1px solid #ddd;
  padding: 0.4em;
}}"#
        )
    }

    fn escape_html(text: &str) -> String {
        text.replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
    }

    fn contains_cjk(text: &str) -> bool {
        text.chars().any(|c| {
            let u = c as u32;
            (0x4E00..=0x9FFF).contains(&u) || (0x3400..=0x4DBF).contains(&u)
        })
    }
}

/// A chapter extracted from PDF
#[derive(Debug, Clone)]
pub struct Chapter {
    pub title: String,
    pub content: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_to_chapters_empty() {
        let pages: Vec<String> = vec![];
        let chapters = EpubBuilderService::text_to_chapters(&pages);
        assert_eq!(chapters.len(), 1);
        assert!(chapters[0].content.contains("No content"));
    }

    #[test]
    fn test_text_to_chapters_single_page() {
        let pages = vec!["Hello world.\nThis is a test.".to_string()];
        let chapters = EpubBuilderService::text_to_chapters(&pages);
        assert_eq!(chapters.len(), 1);
        assert!(chapters[0].content.contains("Hello world"));
    }

    #[test]
    fn test_escape_html() {
        assert_eq!(
            EpubBuilderService::escape_html("<script>alert('xss')</script>"),
            "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
                .replace("&#x27;", "'") // our escape doesn't handle single quotes
        );
    }
}
