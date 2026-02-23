use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use lopdf::{Document, Object, ObjectId, Dictionary};
use crate::utils::error::AppError;
use crate::models::pdf::MergeConfig;

pub struct PdfMergerService;

impl PdfMergerService {
    /// Merge multiple PDF files into one
    pub fn merge(config: &MergeConfig) -> Result<String, AppError> {
        if config.files.is_empty() {
            return Err(AppError::ConfigError("No files to merge".to_string()));
        }

        if config.files.len() == 1 {
            let src = &config.files[0].path;
            fs::copy(src, &config.output_path)?;
            return Ok(config.output_path.clone());
        }

        // Load all documents
        let mut documents: Vec<Document> = Vec::new();
        for file_entry in &config.files {
            let path = &file_entry.path;
            if !Path::new(path).exists() {
                return Err(AppError::FileNotFound(path.clone()));
            }
            let doc = Document::load(path)
                .map_err(|e| AppError::PdfError(format!("Failed to load {}: {}", path, e)))?;
            documents.push(doc);
        }

        // Determine max PDF version across all documents
        let max_version = documents
            .iter()
            .map(|d| d.version.clone())
            .max()
            .unwrap_or_else(|| "1.5".to_string());

        let mut merged = Document::with_version(&max_version);
        let mut all_page_ids: Vec<ObjectId> = Vec::new();

        for (doc_idx, doc) in documents.iter().enumerate() {
            // Determine which pages to include
            let page_ids: Vec<ObjectId> = doc.page_iter().collect();
            let selected_pages: Vec<ObjectId> = if let Some(ref selected) = config.files[doc_idx].selected_pages {
                page_ids
                    .iter()
                    .enumerate()
                    .filter(|(i, _)| selected.contains(&(i + 1)))
                    .map(|(_, &id)| id)
                    .collect()
            } else {
                page_ids.clone()
            };

            if selected_pages.is_empty() {
                continue;
            }

            // Build a mapping from old object IDs to new ones.
            // We copy ALL objects from this document to avoid broken references.
            let mut id_map: BTreeMap<ObjectId, ObjectId> = BTreeMap::new();

            // First pass: assign new IDs for every object in the source document
            for &old_id in doc.objects.keys() {
                let new_id = merged.new_object_id();
                id_map.insert(old_id, new_id);
            }

            // Second pass: deep-copy every object, remapping all references
            for (&old_id, obj) in &doc.objects {
                let new_id = id_map[&old_id];
                let remapped_obj = Self::remap_object(obj, &id_map);
                merged.objects.insert(new_id, remapped_obj);
            }

            // Track which pages to include in the final Pages tree
            for &page_id in &selected_pages {
                if let Some(&new_page_id) = id_map.get(&page_id) {
                    all_page_ids.push(new_page_id);
                }
            }
        }

        if all_page_ids.is_empty() {
            return Err(AppError::PdfError("No pages to merge".to_string()));
        }

        // Build the Pages tree
        let pages_id = merged.new_object_id();
        let mut pages_dict = Dictionary::new();
        pages_dict.set("Type", Object::Name(b"Pages".to_vec()));
        let kids: Vec<Object> = all_page_ids
            .iter()
            .map(|&id| Object::Reference(id))
            .collect();
        pages_dict.set("Kids", Object::Array(kids));
        pages_dict.set("Count", Object::Integer(all_page_ids.len() as i64));
        merged.objects.insert(pages_id, Object::Dictionary(pages_dict));

        // Set Parent reference on each included page
        for &page_id in &all_page_ids {
            if let Ok(Object::Dictionary(ref mut dict)) = merged.get_object_mut(page_id) {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }

        // Build Catalog
        let catalog_id = merged.new_object_id();
        let mut catalog = Dictionary::new();
        catalog.set("Type", Object::Name(b"Catalog".to_vec()));
        catalog.set("Pages", Object::Reference(pages_id));
        merged.objects.insert(catalog_id, Object::Dictionary(catalog));

        merged.trailer.set("Root", Object::Reference(catalog_id));

        // Compress streams to reduce file size
        merged.compress();

        // Save
        merged.save(&config.output_path)
            .map_err(|e| AppError::PdfError(format!("Failed to save merged PDF: {}", e)))?;

        log::info!(
            "Successfully merged {} files ({} pages) into {}",
            config.files.len(),
            all_page_ids.len(),
            config.output_path
        );
        Ok(config.output_path.clone())
    }

    /// Recursively remap all ObjectId references in an Object
    fn remap_object(obj: &Object, id_map: &BTreeMap<ObjectId, ObjectId>) -> Object {
        match obj {
            Object::Reference(old_id) => {
                if let Some(&new_id) = id_map.get(old_id) {
                    Object::Reference(new_id)
                } else {
                    // Reference to an object not in our map; keep as-is
                    obj.clone()
                }
            }
            Object::Array(arr) => {
                let new_arr: Vec<Object> = arr
                    .iter()
                    .map(|item| Self::remap_object(item, id_map))
                    .collect();
                Object::Array(new_arr)
            }
            Object::Dictionary(dict) => {
                let mut new_dict = Dictionary::new();
                for (key, value) in dict.iter() {
                    new_dict.set(key.clone(), Self::remap_object(value, id_map));
                }
                Object::Dictionary(new_dict)
            }
            Object::Stream(stream) => {
                let mut new_dict = Dictionary::new();
                for (key, value) in stream.dict.iter() {
                    new_dict.set(key.clone(), Self::remap_object(value, id_map));
                }
                Object::Stream(lopdf::Stream::new(new_dict, stream.content.clone()))
            }
            // All other types (Boolean, Integer, Real, String, Name, Null) have no references
            _ => obj.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::pdf::PdfFileEntry;

    #[test]
    fn test_merge_config_validation() {
        let config = MergeConfig {
            files: vec![],
            output_path: "out.pdf".to_string(),
            keep_bookmarks: true,
            page_size: "original".to_string(),
        };
        let result = PdfMergerService::merge(&config);
        assert!(result.is_err());
    }

    #[test]
    fn test_merge_missing_file() {
        let config = MergeConfig {
            files: vec![
                PdfFileEntry { path: "/nonexistent/a.pdf".to_string(), selected_pages: None },
                PdfFileEntry { path: "/nonexistent/b.pdf".to_string(), selected_pages: None },
            ],
            output_path: "out.pdf".to_string(),
            keep_bookmarks: true,
            page_size: "original".to_string(),
        };
        let result = PdfMergerService::merge(&config);
        assert!(result.is_err());
    }

    #[test]
    fn test_remap_object_reference() {
        let mut id_map = BTreeMap::new();
        id_map.insert((1, 0), (100, 0));
        id_map.insert((2, 0), (200, 0));

        // Test reference remapping
        let obj = Object::Reference((1, 0));
        let remapped = PdfMergerService::remap_object(&obj, &id_map);
        assert_eq!(remapped, Object::Reference((100, 0)));

        // Test array with references
        let arr = Object::Array(vec![
            Object::Reference((1, 0)),
            Object::Reference((2, 0)),
            Object::Integer(42),
        ]);
        let remapped_arr = PdfMergerService::remap_object(&arr, &id_map);
        match remapped_arr {
            Object::Array(items) => {
                assert_eq!(items[0], Object::Reference((100, 0)));
                assert_eq!(items[1], Object::Reference((200, 0)));
                assert_eq!(items[2], Object::Integer(42));
            }
            _ => panic!("Expected array"),
        }
    }
}
