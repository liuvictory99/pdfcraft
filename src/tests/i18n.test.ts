import { describe, it, expect } from 'vitest';
import i18n from '../locales/i18n';
import enUS from '../locales/en-US.json';
import zhCN from '../locales/zh-CN.json';

describe('i18n configuration', () => {
  it('has en-US and zh-CN resources loaded', () => {
    const enResource = i18n.getResourceBundle('en-US', 'translation');
    const zhResource = i18n.getResourceBundle('zh-CN', 'translation');
    expect(enResource).toBeDefined();
    expect(zhResource).toBeDefined();
  });

  it('en-US and zh-CN have the same top-level keys', () => {
    const enKeys = Object.keys(enUS).sort();
    const zhKeys = Object.keys(zhCN).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it('can switch language to zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    expect(i18n.language).toBe('zh-CN');
    expect(i18n.t('nav.merge')).toBe('PDF 合并');
  });

  it('can switch language to en-US', async () => {
    await i18n.changeLanguage('en-US');
    expect(i18n.language).toBe('en-US');
    expect(i18n.t('nav.merge')).toBe('PDF Merge');
  });

  it('merge section has all required keys in both languages', () => {
    const requiredKeys = [
      'merge.title',
      'merge.addFiles',
      'merge.clearAll',
      'merge.dropHint',
      'merge.mergePdf',
      'merge.keepBookmarks',
      'merge.pageSize',
    ];

    for (const key of requiredKeys) {
      i18n.changeLanguage('en-US');
      expect(i18n.t(key)).not.toBe(key);

      i18n.changeLanguage('zh-CN');
      expect(i18n.t(key)).not.toBe(key);
    }
  });

  it('convert section has all required keys in both languages', () => {
    const requiredKeys = [
      'convert.title',
      'convert.outputFormat',
      'convert.layoutMode',
      'convert.startConvert',
      'convert.ocrAuto',
      'convert.bookTitle',
    ];

    for (const key of requiredKeys) {
      i18n.changeLanguage('en-US');
      expect(i18n.t(key)).not.toBe(key);

      i18n.changeLanguage('zh-CN');
      expect(i18n.t(key)).not.toBe(key);
    }
  });
});
