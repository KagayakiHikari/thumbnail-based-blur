import { coverRect, boxBlur, tintPixels } from './pixels.js';

const defaults = { maxSize: 256, blur: 20, saturation: 1.8, brightness: 1.04, boost: 1.1, tint: [248, 247, 255, 0.2], position: [0.5, 0.5] };
const canvas = () => document.createElement('canvas');
const context = c => { const ctx = c.getContext('2d'); if (!ctx) throw new Error('Canvas 2D is unavailable'); return ctx; };

/** One cached wallpaper per instance. Coordinates are CSS pixels in viewport space. */
export class ThumbnailBlur {
  constructor(options = {}) {
    this.options = { ...defaults, ...options };
    this.cache = canvas();
    this.key = '';
    this.revision = 0;
    this.buildCount = 0;
    this.status = 'empty';
  }

  invalidate() { this.revision++; this.key = ''; }

  /** Call after wallpaper/layout/options change. Never call blur inside a render loop. */
  prepare(image, bounds, options = {}) {
    this.options = { ...this.options, ...options };
    const o = this.options;
    if (!image.complete || !image.naturalWidth) throw new Error('Decode the image before preparing the cache');
    if (![bounds.width, bounds.height].every(n => Number.isFinite(n) && n > 0)) throw new RangeError('Invalid background bounds');
    if (!Number.isFinite(o.maxSize) || o.maxSize < 1 || o.maxSize > 1024 || !Number.isFinite(o.blur) || o.blur < 0 || o.blur > 512) throw new RangeError('Invalid thumbnail or blur size');
    if (![o.saturation, o.brightness, o.boost].every(n => Number.isFinite(n) && n >= 0 && n <= 10) || !Array.isArray(o.tint) || o.tint.length !== 4 || !o.tint.slice(0, 3).every(n => Number.isFinite(n) && n >= 0 && n <= 255) || !Number.isFinite(o.tint[3]) || o.tint[3] < 0 || o.tint[3] > 1 || !Array.isArray(o.position) || o.position.length !== 2 || !o.position.every(n => Number.isFinite(n) && n >= 0 && n <= 1)) throw new RangeError('Invalid material options');
    // DOMRect properties are prototype accessors, so object spread loses them.
    this.bounds = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    // Origin may change without regenerating the texture. Failed CORS reads are cached too.
    const key = JSON.stringify([image.currentSrc || image.src, image.naturalWidth, image.naturalHeight, bounds.width, bounds.height, o, this.revision]);
    if (key === this.key) return this.status;
    const scale = Math.min(1, o.maxSize / Math.max(bounds.width, bounds.height));
    this.cache.width = Math.max(1, Math.ceil(bounds.width * scale));
    this.cache.height = Math.max(1, Math.ceil(bounds.height * scale));
    this.scaleX = this.cache.width / bounds.width;
    this.scaleY = this.cache.height / bounds.height;
    const ctx = context(this.cache);
    const rect = coverRect(image.naturalWidth, image.naturalHeight, bounds.width, bounds.height, o.position);
    // Opaque backing makes transparent source images deterministic.
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, this.cache.width, this.cache.height);
    try {
      ctx.drawImage(image, rect.x * this.scaleX, rect.y * this.scaleY, rect.width * this.scaleX, rect.height * this.scaleY);
      const pixels = ctx.getImageData(0, 0, this.cache.width, this.cache.height);
      const radius = o.blur === 0 ? 0 : Math.max(1, Math.round(o.blur * scale * 0.58));
      pixels.data.set(tintPixels(boxBlur(pixels.data, pixels.width, pixels.height, radius), o));
      ctx.putImageData(pixels, 0, 0);
      this.status = 'ready';
    } catch (error) {
      // Reset dimensions to clear the tainted flag before drawing the fallback.
      this.cache.width = this.cache.width;
      const fallback = context(this.cache);
      fallback.fillStyle = `rgba(${o.tint.join(',')})`;
      fallback.fillRect(0, 0, this.cache.width, this.cache.height);
      this.status = 'fallback';
      this.lastError = error;
    }
    this.key = key; this.buildCount++;
    return this.status;
  }

  /** Draw a full material surface or clip it with an alpha mask. */
  draw(target, rect, mask = null, dpr = Math.min(devicePixelRatio || 1, 2)) {
    if (!this.key) throw new Error('Call prepare() first');
    if (![rect.width, rect.height, dpr].every(n => Number.isFinite(n) && n > 0)) throw new RangeError('Invalid output dimensions');
    const width = Math.max(1, Math.ceil(rect.width * dpr)), height = Math.max(1, Math.ceil(rect.height * dpr));
    if (target.width !== width) target.width = width;
    if (target.height !== height) target.height = height;
    const ctx = context(target);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    // Draw the whole cached image at its background origin; the target bounds clip it.
    // This avoids out-of-range crop rectangles and stale edge pixels.
    ctx.drawImage(this.cache, (this.bounds.left - rect.left) * dpr, (this.bounds.top - rect.top) * dpr, this.bounds.width * dpr, this.bounds.height * dpr);
    if (mask) { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0, width, height); }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/** Experimental glyph adapter. Keep native text until its canvas is complete. */
export function attachFrostedText(element, material) {
  if (element.childElementCount) throw new Error('Use a plain-text element');
  const original = element.textContent;
  const source = document.createElement('span'); source.textContent = original;
  const marker = document.createElement('span'); marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline'; marker.setAttribute('aria-hidden', 'true');
  source.prepend(marker);
  const output = canvas(); output.setAttribute('aria-hidden', 'true'); output.className = 'tb-output';
  const previousPosition = element.style.position;
  if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
  element.replaceChildren(source, output);
  let mask = canvas(), disposed = false, signature = '', sourceColor = source.style.color;
  function refresh() {
    if (disposed) return;
    source.style.color = sourceColor; output.style.visibility = 'hidden';
    const bounds = element.getBoundingClientRect(), style = getComputedStyle(source);
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    mask.width = Math.ceil(bounds.width * dpr); mask.height = Math.ceil(bounds.height * dpr);
    const ctx = context(mask); ctx.scale(dpr, dpr); ctx.fillStyle = 'white';
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.direction = style.direction;
    const baseline = marker.getBoundingClientRect().top - bounds.top;
    const range = document.createRange(); const node = source.lastChild;
    let offset = 0, firstTop;
    for (const char of original) {
      range.setStart(node, offset); offset += char.length; range.setEnd(node, offset);
      const rect = range.getBoundingClientRect();
      if (!char.trim()) continue;
      firstTop ??= rect.top;
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const row = Math.round((rect.top - firstTop) / lineHeight);
      ctx.fillText(char, rect.left - bounds.left, baseline + row * lineHeight);
    }
    signature = ''; render();
  }
  function render() {
    if (disposed || !mask.width || !material.key) return;
    const rect = element.getBoundingClientRect();
    const key = [rect.left, rect.top, rect.width, rect.height, material.key, material.bounds.left, material.bounds.top].join('|');
    if (key === signature) return;
    material.draw(output, rect, mask);
    source.style.color = 'transparent'; output.style.visibility = 'visible'; signature = key;
  }
  const observer = new ResizeObserver(refresh); observer.observe(element);
  document.fonts.addEventListener('loadingdone', refresh);
  refresh();
  return { render, refresh, dispose() {
    disposed = true; observer.disconnect(); document.fonts.removeEventListener('loadingdone', refresh);
    element.textContent = original; element.style.position = previousPosition;
  } };
}
