import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, chooseLanguage } from '../demo/i18n.js';

test('all three dictionaries have complete nonempty keys and cover HTML bindings', async () => {
  const expected = Object.keys(locales.zh).sort();
  const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
  for (const locale of Object.values(locales)) {
    assert.deepEqual(Object.keys(locale).sort(),expected);
    for (const value of Object.values(locale)) assert.ok(typeof value === 'string' && value.trim());
    for (const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) assert.ok(Object.hasOwn(locale,match[1]),match[1]);
    await readFile(new URL('../'+locale.readmePath,import.meta.url));
  }
});
test('language selection respects saved choice, regional languages and unsupported fallback', () => {
  assert.equal(chooseLanguage('ja','en-US'),'ja');
  assert.equal(chooseLanguage(null,'zh-TW'),'zh');
  assert.equal(chooseLanguage('invalid','ja-JP'),'ja');
  assert.equal(chooseLanguage(undefined,'fr-FR'),'en');
  assert.equal(chooseLanguage('constructor','en-US'),'en');
});
