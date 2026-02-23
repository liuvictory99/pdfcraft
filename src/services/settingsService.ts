import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from '../types';

/**
 * Get application configuration
 */
export async function getAppConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_app_config');
}

/**
 * Update application configuration
 */
export async function updateAppConfig(config: AppConfig): Promise<void> {
  return invoke('update_app_config', { config });
}
