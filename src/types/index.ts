export interface PdfFileEntry {
  id: string;
  name: string;
  path: string;
  pageCount: number;
  fileSize: number;
  thumbnail?: string;
  selectedPages?: number[];
}

export interface PdfInfo {
  pageCount: number;
  fileSize: number;
  title?: string;
  author?: string;
  thumbnail: string;
}

export interface MergeConfig {
  files: Array<{
    path: string;
    selectedPages?: number[];
  }>;
  outputPath: string;
  keepBookmarks: boolean;
  pageSize: 'original' | 'a4' | 'letter';
}

export type OutputFormat = 'epub' | 'mobi' | 'azw3' | 'docx' | 'txt' | 'fb2' | 'html' | 'md';
export type LayoutMode = 'reflow' | 'fixed';

export interface BookMetadata {
  title: string;
  author: string;
  coverPath?: string;
}

export interface OcrConfig {
  enabled: boolean;
  languages: string[];
}

export interface ConvertConfig {
  inputPath: string;
  outputPath: string;
  outputFormat: OutputFormat;
  layoutMode: LayoutMode;
  ocr: OcrConfig;
  metadata: BookMetadata;
  keepImages: boolean;
  detectTables: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface ConversionProgress {
  taskId: string;
  percent: number;
  stage: string;
  message: string;
}

export interface AppConfig {
  language: 'zh-CN' | 'en-US';
  theme: 'system' | 'light' | 'dark';
  lastOutputPath: string;
}

export type PageView = 'merge' | 'convert' | 'settings';
