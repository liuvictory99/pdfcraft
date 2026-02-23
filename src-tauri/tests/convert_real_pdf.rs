use std::path::Path;

/// Integration test: convert a real PDF to EPUB
#[test]
fn test_convert_real_pdf_to_epub() {
    let input = "/Users/vickey99/Downloads/264-100122101-专栏课-石川-JavaScript进阶实战课（完结）/石川-JavaScript进阶实战课（完结）.pdf";
    if !Path::new(input).exists() {
        println!("Skipping: test PDF not found");
        return;
    }

    let meta = std::fs::metadata(input).unwrap();
    println!("Input: {} ({} bytes / {:.1} MB)", input, meta.len(), meta.len() as f64 / 1_048_576.0);

    // Step 1: Load document
    println!("Step 1: Loading document...");
    let start = std::time::Instant::now();
    let doc = lopdf::Document::load(input);
    match &doc {
        Ok(d) => {
            let pages = d.get_pages().len();
            println!("  Loaded OK: {} pages in {:?}", pages, start.elapsed());
        }
        Err(e) => {
            println!("  FAILED to load: {:?}", e);
            panic!("Cannot load PDF");
        }
    }
    let doc = doc.unwrap();
    let page_count = doc.get_pages().len();

    // Step 2: Test text extraction on first few pages
    println!("Step 2: Extracting text from first 3 pages...");
    for page_num in 1..=3.min(page_count) {
        let start = std::time::Instant::now();
        let text = doc.extract_text(&[page_num as u32]);
        match &text {
            Ok(t) => {
                println!("  Page {}: {} chars in {:?}", page_num, t.len(), start.elapsed());
                if t.len() > 0 {
                    let preview: String = t.chars().take(100).collect();
                    println!("    Preview: {:?}", preview);
                }
            }
            Err(e) => {
                println!("  Page {}: FAILED: {:?}", page_num, e);
            }
        }
    }

    // Step 3: Extract ALL text (this is what the converter does)
    println!("Step 3: Extracting all text ({} pages)...", page_count);
    let start = std::time::Instant::now();
    let result = pdfcraft_lib::services::pdf_parser::PdfParserService::extract_all_text(input);
    match &result {
        Ok(texts) => {
            let total_chars: usize = texts.iter().map(|t| t.len()).sum();
            let non_empty: usize = texts.iter().filter(|t| !t.trim().is_empty()).count();
            println!("  Extracted {} pages in {:?}", texts.len(), start.elapsed());
            println!("  Total chars: {}, Non-empty pages: {}/{}", total_chars, non_empty, texts.len());
        }
        Err(e) => {
            println!("  FAILED: {:?}", e);
            println!("  This is likely the root cause of the conversion failure!");
        }
    }

    // Step 4: Test is_scanned_pdf
    println!("Step 4: Checking if scanned...");
    let start = std::time::Instant::now();
    let is_scanned = pdfcraft_lib::services::pdf_parser::PdfParserService::is_scanned_pdf(input);
    match &is_scanned {
        Ok(v) => println!("  is_scanned: {} in {:?}", v, start.elapsed()),
        Err(e) => println!("  FAILED: {:?}", e),
    }

    // Step 5: If text extraction works, test chapter detection
    if let Ok(texts) = &result {
        println!("Step 5: Chapter detection...");
        let chapters = pdfcraft_lib::services::epub_builder::EpubBuilderService::text_to_chapters(texts);
        println!("  Detected {} chapters", chapters.len());
        for (i, ch) in chapters.iter().take(5).enumerate() {
            println!("  Chapter {}: title={:?}, content_len={}", i+1, ch.title, ch.content.len());
        }
    }

    // Step 6: Actually try to build EPUB
    if result.is_ok() {
        println!("Step 6: Building EPUB...");
        let output = "/tmp/pdfcraft_convert_test.epub";
        let config = pdfcraft_lib::models::ebook::ConvertConfig {
            input_path: input.to_string(),
            output_path: output.to_string(),
            output_format: pdfcraft_lib::models::ebook::OutputFormat::Epub,
            layout_mode: pdfcraft_lib::models::ebook::LayoutMode::Reflow,
            ocr: pdfcraft_lib::models::ebook::OcrConfig {
                enabled: false,
                languages: vec!["chi_sim".to_string()],
            },
            metadata: pdfcraft_lib::models::ebook::BookMetadata {
                title: "JavaScript进阶实战课".to_string(),
                author: "石川".to_string(),
                cover_path: None,
            },
            keep_images: true,
            detect_tables: false,
            font_size: "medium".to_string(),
        };

        let texts = result.unwrap();
        let chapters = pdfcraft_lib::services::epub_builder::EpubBuilderService::text_to_chapters(&texts);
        let start = std::time::Instant::now();
        let epub_result = pdfcraft_lib::services::epub_builder::EpubBuilderService::build_epub(&config, chapters);
        match &epub_result {
            Ok(path) => {
                let out_meta = std::fs::metadata(path).unwrap();
                println!("  EPUB created: {} ({} bytes) in {:?}", path, out_meta.len(), start.elapsed());
                let _ = std::fs::remove_file(output);
            }
            Err(e) => {
                println!("  EPUB build FAILED: {:?}", e);
            }
        }
    }

    println!("DONE");
}
