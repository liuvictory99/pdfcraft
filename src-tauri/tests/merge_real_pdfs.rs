use std::path::Path;

/// Integration test: merge real PDF files and verify output
#[test]
fn test_merge_real_pdfs() {
    let dir = "/Users/vickey99/Downloads/264-100122101-专栏课-石川-JavaScript进阶实战课（完结）";
    if !Path::new(dir).exists() {
        println!("Skipping: test PDF directory not found");
        return;
    }

    // Pick first 3 PDFs
    let mut pdf_files: Vec<String> = std::fs::read_dir(dir)
        .unwrap()
        .filter_map(|e| {
            let e = e.ok()?;
            let p = e.path();
            if p.extension().map(|x| x == "pdf").unwrap_or(false) {
                Some(p.to_string_lossy().to_string())
            } else {
                None
            }
        })
        .collect();
    pdf_files.sort();
    let pdf_files = &pdf_files[..3.min(pdf_files.len())];

    println!("Merging {} files:", pdf_files.len());
    for f in pdf_files {
        let size = std::fs::metadata(f).unwrap().len();
        println!("  {} ({} bytes)", f, size);
    }

    let output = "/tmp/pdfcraft_merge_test_output.pdf";
    let config = pdfcraft_lib::models::pdf::MergeConfig {
        files: pdf_files
            .iter()
            .map(|p| pdfcraft_lib::models::pdf::PdfFileEntry {
                path: p.clone(),
                selected_pages: None,
            })
            .collect(),
        output_path: output.to_string(),
        keep_bookmarks: true,
        page_size: "original".to_string(),
    };

    let result = pdfcraft_lib::services::pdf_merger::PdfMergerService::merge(&config);
    assert!(result.is_ok(), "Merge failed: {:?}", result.err());

    // Verify output exists and has reasonable size
    let out_meta = std::fs::metadata(output).expect("Output file should exist");
    println!("Output: {} ({} bytes)", output, out_meta.len());

    // Sum input sizes
    let input_total: u64 = pdf_files.iter().map(|f| std::fs::metadata(f).unwrap().len()).sum();
    println!("Input total: {} bytes", input_total);

    // Output should be at least 25% of input total (compression may reduce size)
    assert!(
        out_meta.len() > input_total / 4,
        "Output file too small: {} bytes vs {} bytes input. Likely missing content.",
        out_meta.len(),
        input_total
    );

    // Verify it's a valid PDF by loading it with lopdf
    let doc = lopdf::Document::load(output).expect("Output should be a valid PDF");
    let page_count = doc.get_pages().len();
    println!("Output page count: {}", page_count);
    assert!(page_count > 0, "Output PDF has 0 pages");

    // Count pages in each input
    let mut expected_pages = 0;
    for f in pdf_files {
        let d = lopdf::Document::load(f).unwrap();
        expected_pages += d.get_pages().len();
    }
    println!("Expected page count: {}", expected_pages);
    assert_eq!(page_count, expected_pages, "Page count mismatch");

    // Cleanup
    let _ = std::fs::remove_file(output);
    println!("PASS: Merge produced valid PDF with correct page count");
}
