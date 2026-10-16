import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales, chooseLanguage } from '../demo/i18n.js';

test('English and Chinese dictionaries match the ordered language selector and guide links', async () => {
  assert.deepEqual(Object.keys(locales), ['en', 'zh']);
  const expected = Object.keys(locales.en).sort();
  const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html, /<html lang="en">/);
  assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), ['en', 'zh']);
  assert.ok(html.includes(locales.en.sample));
  for (const locale of Object.values(locales)) {
    assert.deepEqual(Object.keys(locale).sort(),expected);
    for (const value of Object.values(locale)) assert.ok(typeof value === 'string' && value.trim());
    for (const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) assert.ok(Object.hasOwn(locale,match[1]),match[1]);
    await readFile(new URL('../'+locale.readmePath,import.meta.url));
  }
});
test('English is the default and valid saved choices are preserved', () => {
  assert.equal(chooseLanguage(), 'en');
  assert.equal(chooseLanguage(null), 'en');
  assert.equal(chooseLanguage('zh'), 'zh');
  assert.equal(chooseLanguage('en'), 'en');
  assert.equal(chooseLanguage('invalid'), 'en');
  assert.equal(chooseLanguage('constructor'), 'en');
});
