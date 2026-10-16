import { ThumbnailBlur, attachFrostedText } from '../src/thumbnail-blur.js';
import { FrameSampler } from '../src/frame-sampler.js';
import { locales, chooseLanguage } from './i18n.js';
const $ = id => document.getElementById(id);
const image = $('wallpaper-source'), background = $('wallpaper'), material = new ThumbnailBlur();
const bg = background.getContext('2d');
let adapter, objectURL, running = false, phase = 0, lastTime = null, frame = null, generation = 0, disposed = false;
let sampleStart = null, sampleCount = 0, savedLanguage;
try { savedLanguage = localStorage.getItem('thumbnail-blur-realtime-language'); } catch {}
let language = chooseLanguage(savedLanguage), statusKey = 'loading';
const t = key => locales[language][key];
function setStatus(key) { statusKey = key; $('status').textContent = t(key); }
function resetRate() { sampleStart = null; sampleCount = 0; $('actual-fps').textContent = '—'; }
function setLanguage(next) {
  const previousSample = t('sample'); language = chooseLanguage(next);
  document.documentElement.lang = t('lang'); document.title = t('title');
  document.querySelector('meta[name="description"]').content = t('description');
  $('language').value = language;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  $('readme').href = t('readmePath'); $('animate').textContent = t(running ? 'pause' : 'start'); setStatus(statusKey);
  const useDefault = $('text').value === previousSample || (!adapter && Object.values(locales).some(locale => $('text').value === locale.sample));
  adapter?.dispose(); adapter = null;
  if (useDefault) { $('text').value = t('sample'); $('glass-text').textContent = t('sample'); }
  try { localStorage.setItem('thumbnail-blur-realtime-language', language); } catch {}
  prepare();
}
function paintBackground() {
  if (!image.complete || !image.naturalWidth) return;
  const bounds = background.getBoundingClientRect();
  // Keep the dynamic source bounded independently of the display's device pixel ratio.
  const scale = Math.min(1, 1920 / Math.max(bounds.width, bounds.height));
  const width = Math.max(1, Math.round(bounds.width * scale)), height = Math.max(1, Math.round(bounds.height * scale));
  if (background.width !== width) background.width = width;
  if (background.height !== height) background.height = height;
  const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight) * 1.2;
  const w = image.naturalWidth * cover, h = image.naturalHeight * cover;
  const x = (width - w) * (0.5 + Math.sin(phase * 0.7) * 0.45);
  const y = (height - h) * (0.5 + Math.cos(phase * 0.5) * 0.45);
  bg.fillStyle = '#111827'; bg.fillRect(0, 0, width, height);
  bg.drawImage(image, x, y, w, h);
}
function render() {
  if (!material.key) return;
  adapter?.render(); material.draw($('panel'), $('panel').getBoundingClientRect());
}
function prepare(force = false) {
  if (!image.complete || !image.naturalWidth || disposed) return;
  if (force) material.invalidate();
  document.querySelector('.stage').style.minHeight = `${Math.max(430, $('moving').offsetHeight + 305)}px`;
  const start = performance.now(), before = material.buildCount;
  material.prepare(background, background.getBoundingClientRect(), { maxSize: +$('size').value, blur: +$('blur').value, tint: [248,247,255,+$('tint').value / 100] });
  if (material.buildCount !== before) $('duration').textContent = `${(performance.now() - start).toFixed(2)} ms`;
  $('dimensions').textContent = `${material.cache.width} × ${material.cache.height}`;
  $('builds').textContent = material.buildCount;
  setStatus(material.status === 'ready' ? ($('sampling').checked ? 'ready' : 'frozen') : 'fallback');
  if (!adapter) adapter = attachFrostedText($('glass-text'), material);
  render();
}
const sampler = new FrameSampler(time => {
  if (!image.complete || !image.naturalWidth) return;
  prepare(true);
  if (material.status === 'fallback') {
    sampler.stop(); $('sampling').checked = false; resetRate(); return;
  }
  if (sampleStart === null) { sampleStart = time; sampleCount = 0; }
  else {
    sampleCount++;
    if (time - sampleStart >= 1000) {
      $('actual-fps').textContent = `${(sampleCount * 1000 / (time - sampleStart)).toFixed(1)} FPS`;
      sampleStart = time; sampleCount = 0;
    }
  }
}, { fps: 30, onError(error) {
  $('sampling').checked = false; resetRate(); setStatus('sampleFailed'); console.error(error);
} });
function schedule() {
  if (!disposed && !document.hidden && frame === null && (running || $('background-motion').checked)) frame = requestAnimationFrame(tick);
}
function tick(time) {
  frame = null;
  if (disposed || document.hidden) return;
  const elapsed = Math.min(time - (lastTime ?? time), 50) / 1000;
  lastTime = time;
  if ($('background-motion').checked) { phase += elapsed; paintBackground(); }
  if (running) {
    motionPhase += elapsed;
    $('moving').style.transform = `translateY(${Math.sin(motionPhase) * 55}px)`;
  }
  render(); schedule();
}
let motionPhase = 0;
function cancelMotionFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null; lastTime = null; }
function stop() { running = false; $('animate').textContent = t('start'); $('animate').setAttribute('aria-pressed','false'); }
$('animate').addEventListener('click', () => {
  if (running) stop();
  else { running = true; $('animate').textContent = t('pause'); $('animate').setAttribute('aria-pressed','true'); }
  cancelMotionFrame(); schedule();
});
$('sampling').addEventListener('change', () => {
  resetRate();
  if ($('sampling').checked) sampler.start();
  else { sampler.stop(); setStatus(material.status === 'fallback' ? 'fallback' : 'frozen'); }
});
$('fps').addEventListener('input', () => { sampler.setFPS(+$('fps').value); $('fps-value').textContent = `${$('fps').value} FPS`; resetRate(); });
$('background-motion').addEventListener('change', () => { cancelMotionFrame(); schedule(); });
$('language').addEventListener('change', () => setLanguage($('language').value));
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
    if (version !== generation || disposed) { URL.revokeObjectURL(url); return; }
    image.src = url; await image.decode();
    if (version !== generation || disposed) { URL.revokeObjectURL(url); return; }
    if (objectURL) URL.revokeObjectURL(objectURL); objectURL = url;
    paintBackground(); prepare(true);
  } catch { URL.revokeObjectURL(url); if (!disposed && version === generation) setStatus('decodeFailed'); }
});
window.addEventListener('resize', () => { paintBackground(); prepare(true); });
window.addEventListener('scroll', render, { passive: true });
document.addEventListener('visibilitychange', () => { cancelMotionFrame(); resetRate(); schedule(); });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
function reduceMotion() {
  if (motion.matches) { stop(); $('background-motion').checked = false; cancelMotionFrame(); }
}
motion.addEventListener('change', reduceMotion); reduceMotion();
setLanguage(language);
try {
  await Promise.all([image.decode(), document.fonts.ready]);
  if (!disposed) { paintBackground(); prepare(true); sampler.start(); schedule(); }
} catch { setStatus('loadFailed'); }
window.addEventListener('pagehide', () => {
  disposed = true; generation++; sampler.dispose(); cancelMotionFrame(); adapter?.dispose(); if (objectURL) URL.revokeObjectURL(objectURL);
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
