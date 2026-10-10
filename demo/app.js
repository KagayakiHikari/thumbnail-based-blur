import { ThumbnailBlur, attachFrostedText } from '../src/thumbnail-blur.js';
import { locales, chooseLanguage } from './i18n.js';
const $ = id => document.getElementById(id);
const image = $('wallpaper'), material = new ThumbnailBlur();
let adapter, objectURL, running = false, phase = 0, lastTime = 0, frame = 0, generation = 0;
let savedLanguage;
try { savedLanguage = localStorage.getItem('thumbnail-blur-language'); } catch {}
let language = chooseLanguage(savedLanguage, navigator.language), statusKey = 'loading';
const t = key => locales[language][key];
function setStatus(key) { statusKey = key; $('status').textContent = t(key); }
function setLanguage(next) {
  const previousSample = t('sample');
  language = chooseLanguage(next);
  document.documentElement.lang = t('lang'); document.title = t('title');
  document.querySelector('meta[name="description"]').content = t('description');
  $('language').value = language;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  for (const element of document.querySelectorAll('[data-i18n-aria]')) element.setAttribute('aria-label', t(element.dataset.i18nAria));
  $('readme').href = t('readmePath');
  $('animate').textContent = t(running ? 'pause' : 'start'); setStatus(statusKey);
  if ($('text').value === previousSample || (!adapter && $('text').value === locales.zh.sample)) {
    adapter?.dispose(); adapter = null;
    $('text').value = t('sample'); $('glass-text').textContent = t('sample');
  } else { adapter?.dispose(); adapter = null; }
  try { localStorage.setItem('thumbnail-blur-language', language); } catch {}
  prepare();
}
$('language').addEventListener('change', () => setLanguage($('language').value));
const backgroundBounds = () => image.getBoundingClientRect();
function render() {
  if (!material.key) return;
  adapter?.render(); material.draw($('panel'), $('panel').getBoundingClientRect());
}
function prepare() {
  if (!image.complete || !image.naturalWidth) return;
  document.querySelector('.stage').style.minHeight = `${Math.max(430, $('moving').offsetHeight + 305)}px`;
  const start = performance.now(), buildsBefore = material.buildCount;
  material.prepare(image, backgroundBounds(), { maxSize: +$('size').value, blur: +$('blur').value, tint: [248,247,255,+$('tint').value / 100] });
  if (material.buildCount !== buildsBefore) $('duration').textContent = `${(performance.now() - start).toFixed(2)} ms`;
  $('dimensions').textContent = `${material.cache.width} × ${material.cache.height}`;
  $('builds').textContent = material.buildCount;
  setStatus(material.status === 'ready' ? 'ready' : 'fallback');
  if (!adapter) adapter = attachFrostedText($('glass-text'), material);
  render();
}
function tick(time) {
  if (!running) return;
  phase += Math.min(time - (lastTime || time), 50) / 1000; lastTime = time;
  $('moving').style.transform = `translateY(${Math.sin(phase) * 55}px)`;
  render(); frame = requestAnimationFrame(tick);
}
function stop() { running = false; cancelAnimationFrame(frame); $('animate').textContent = t('start'); $('animate').setAttribute('aria-pressed','false'); }
$('animate').addEventListener('click', () => {
  if (running) return stop();
  running = true; lastTime = 0; $('animate').textContent = t('pause'); $('animate').setAttribute('aria-pressed','true'); frame = requestAnimationFrame(tick);
});
for (const id of ['size','blur','tint']) $(id).addEventListener('input', () => {
  $(`${id}-value`).textContent = `${$(id).value}${id === 'tint' ? '%' : ' px'}`; prepare();
});
$('text').addEventListener('input', () => { adapter?.dispose(); adapter = null; $('glass-text').textContent = $('text').value || ' '; prepare(); });
$('upload').addEventListener('change', async () => {
  const file = $('upload').files[0]; if (!file) return;
  if (file.size > 20 * 1024 * 1024) { setStatus('tooLarge'); return; }
  const version = ++generation, url = URL.createObjectURL(file), candidate = new Image(); candidate.src = url;
  try {
    await candidate.decode();
    if (version !== generation) { URL.revokeObjectURL(url); return; }
    image.src = url; await image.decode();
    if (objectURL) URL.revokeObjectURL(objectURL); objectURL = url;
    material.invalidate(); prepare();
  } catch { URL.revokeObjectURL(url); setStatus('decodeFailed'); }
});
window.addEventListener('resize', prepare);
window.addEventListener('scroll', render, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
const motion = matchMedia('(prefers-reduced-motion: reduce)'); motion.addEventListener('change', () => { if (motion.matches) stop(); });
setLanguage(language);
try { await Promise.all([image.decode(), document.fonts.ready]); prepare(); }
catch { setStatus('loadFailed'); }
window.addEventListener('pagehide', () => { stop(); adapter?.dispose(); if (objectURL) URL.revokeObjectURL(objectURL); });
