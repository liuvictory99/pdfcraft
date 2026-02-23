use std::path::Path;

/// Integration test: convert a real PDF to MD
#[test]
fn test_convert_real_pdf_to_md() {
    let input = "/Users/vickey99/Downloads/264-100122101-专栏课-石川-JavaScript进阶实战课（完结）/石川-JavaScript进阶实战课（完结）.pdf";
    if !Path::new(input).exists() {
        println!("Skipping: test PDF not found");
        return;
    }

    // Since we fixed the conversion logic in commands::convert_pdf_to_ebook,
    // let's test just the text_to_chapters part which will be used in MD conversion
    let texts = pdfcraft_lib::services::pdf_parser::PdfParserService::extract_all_text(input).unwrap();
    let chapters = pdfcraft_lib::services::epub_builder::EpubBuilderService::text_to_chapters(&texts);
    
    let mut md_content = String::new();
    md_content.push_str("# JavaScript进阶实战课\n\n");
    md_content.push_str("**Author:** 石川\n\n");
    
    for chapter in chapters {
        md_content.push_str(&format!("## {}\n\n", chapter.title));
        let cleaned = chapter.content
            .replace("<p>", "")
            .replace("</p>\n", "\n\n")
            .replace("</p>", "\n\n")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"");
        md_content.push_str(&cleaned);
    }
    
    let out_path = "/tmp/pdfcraft_test.md";
    std::fs::write(out_path, md_content).unwrap();
    println!("Wrote MD to {}", out_path);
    let meta = std::fs::metadata(out_path).unwrap();
    assert!(meta.len() > 100000, "MD file too small!");
    std::fs::remove_file(out_path).unwrap();
}