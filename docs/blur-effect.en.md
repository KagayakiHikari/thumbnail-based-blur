# Thumbnail-Based Blur: Technical Specification

[中文](blur-effect.md) · **English** · [日本語](blur-effect.ja.md)

This module implements downsampling, separable box convolution, color transformation, caching, and coordinate resampling. Inputs are a decoded image, a mapping rectangle, and numeric parameters. Output is Canvas pixel data. Core computation is independent of text masks.

## Input mapping

Let source dimensions be Iw × Ih, mapping dimensions W × H, and longest-edge limit M. Dimensions must be finite and positive.

```text
q = max(W / Iw, H / Ih)
dw = Iw × q; dh = Ih × q
x = (W - dw) × position.x; y = (H - dh) × position.y
s = min(1, M / max(W, H))
w = max(1, ceil(W × s)); h = max(1, ceil(H × s))
sx = w / W; sy = h / H
```

coverRect() computes the covering transform; both position components are in [0,1]. Canvas drawImage() downsamples using separate actual ratios sx and sy to account for rounding. Interpolation depends on the browser. Transparent input is composited onto the opaque color #111827.

## Convolution and boundaries

boxBlur() accepts an RGBA array of length 4wh, integer radius r in [0,512], and integer pass count in [1,10]. The browser module uses three passes:

```text
r = blur == 0 ? 0 : max(1, round(blur × s × 0.58))
k = 2r + 1
e(i,n) = min(n-1, max(0,i))
S(x) = sum(C(e(x+j,w), y), j=-r..r)
S(x+1) = S(x) - C(e(x-r,w), y) + C(e(x+r+1,w), y)
H(x,y) = S(x) / k
```

Each pass averages horizontally, then vertically with the equivalent recurrence. Out-of-range samples repeat edge pixels. Each axis writes to Uint8ClampedArray, introducing byte rounding and clamping. RGB channels are independent; alpha becomes 255. Three box passes approximate a smoothing kernel. The coefficient 0.58 is approximate, not an exact Gaussian standard deviation mapping; results are not exact Gaussian convolution or CSS blur.

## Color transformation

For channel C, saturation a, brightness b, tint color T, fraction t, and gain g:

```text
L = 0.2126R + 0.7152G + 0.0722B
F(C) = clamp((L + a × (C - L)) × b, 0, 255)
O(C) = ((1-t) × F(C) + t × T(C)) × g
```

Uint8ClampedArray converts output to bytes; alpha becomes 255. Calculations use encoded channel values without linear-light conversion. Pixel equivalence with browser filters is not claimed.

## Cache state

The prepare() key includes source URL, source dimensions, mapping dimensions, all processing parameters, and an invalidation revision. A hit reuses pixels. The mapping origin updates without changing the key. invalidate() increments the revision and clears the key; call it when content changes under the same URL.

Successful reads produce ready. Failed reads reset the tainted canvas, fill it with tint, and produce fallback, preserving tint alpha. Failed results are cached until parameters change or invalidation occurs. buildCount counts cache builds, not frames per second.

## Output and masks

bounds and rect share viewport coordinates. Output dimensions are ceil(rect.width × dpr) and ceil(rect.height × dpr). The cache origin is (bounds.left-rect.left, bounds.top-rect.top) × dpr; drawing dimensions are mapping dimensions multiplied by dpr.

Each output clears previous pixels before drawing. Areas beyond the mapping are transparent. An optional alpha mask uses destination-in. Default DPR is capped at 2. Output performs neither convolution nor image encoding.

attachFrostedText() is an independent optional glyph rasterization adapter. It obtains character positions with DOM Range and builds a mask, outside the blur algorithm. Complete shaping for complex ligatures, combining characters, and bidirectional text is not guaranteed.

## Cost and limitations

For p passes, w × h pixels, and radius r, window initialization and traversal cost O(p × (wh + r(w+h))). Fixed radius and pass count give approximately O(wh). Three working arrays occupy 12wh bytes, plus input, ImageData, and canvas storage. Total auxiliary space is O(wh).

Computation runs on the main thread without Worker or GPU computation. Caching reduces repeated convolution but does not remove output resampling and compositing. Cross-origin reads require CORS permission. The pipeline processes an explicit image rather than the browser's composed scene. Fixed frame rates, cross-browser pixel identity, and all font behavior have not been verified.

See [architecture](architecture.en.md), [validation](verification.en.md), and [README](../README.en.md) for structure, checks, and API usage.
