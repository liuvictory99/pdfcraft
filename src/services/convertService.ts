import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ConvertConfig, ConversionProgress } from '../types';

/**
 * Start PDF to e-book conversion
 */
export async function convertPdfToEbook(config: ConvertConfig): Promise<string> {
  return invoke<string>('convert_pdf_to_ebook', { config });
}

/**
 * Cancel an in-progress conversion
 */
export async function cancelConversion(taskId: string): Promise<void> {
  return invoke('cancel_conversion', { taskId });
}

/**
 * Listen for conversion progress events from the backend
 */
export async function onConversionProgress(
  callback: (progress: ConversionProgress) => void,
): Promise<UnlistenFn> {
  return listen<ConversionProgress>('conversion-progress', (event) => {
    callback(event.payload);
  });
}
