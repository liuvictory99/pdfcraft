import { invoke } from '@tauri-apps/api/core';
import type { PdfInfo, MergeConfig } from '../types';

/**
 * Get PDF file information (page count, metadata, thumbnail)
 */
export async function getPdfInfo(path: string): Promise<PdfInfo> {
  return invoke<PdfInfo>('get_pdf_info', { path });
}

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfs(config: MergeConfig): Promise<string> {
  return invoke<string>('merge_pdfs', { config });
}
