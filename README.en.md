# Thumbnail-Based Blur

[中文](README.md) · **English**

A browser image-processing module with zero runtime dependencies. Implements downsampling, three separable box-convolution passes, color transformation, caching, and coordinate resampling. Includes standalone ES modules, optional alpha masks, a trilingual parameter demo, algorithm tests, and a static build.

**Version: 0.2.0.** Uses approximate convolution and byte-channel calculations; fixed frame rates and pixel equivalence with CSS `backdrop-filter` are not guaranteed.

Documentation is available in Chinese and English. The demo supports Chinese, English, and Japanese; the Japanese interface links to the English guide. Use the language selector at the top. The first visit follows your browser language; subsequent visits remember your selection. Switching languages preserves custom demo text and material settings.

## Demo

Run `npm run dev` and open http://127.0.0.1:4173 . GitHub Pages has not been enabled for the online demo; check the repository Pages settings and Actions deployment results.

## Run locally

Install Node.js 22 or newer, open a terminal in the project folder, and run:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173 . In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is blocked. The demo uses ES modules and must be served over HTTP; double-clicking the HTML file will not work.

You can change the wallpaper with a local PNG/JPEG/WebP image smaller than 20 MB, edit the text, adjust blur strength, thumbnail size, and milky tint, and start or pause motion. Selected images stay in your browser and are not sent to a server. The bundled SVG wallpaper was drawn for this project; no private images or third-party assets are included.

```sh
npm run check
npm test
npm run build
```

`dist/` contains the deployable static site. Relative paths support deployment under a GitHub Pages repository subpath. `npm run dev` starts a local development server.

## Publish to GitHub — beginner-friendly

GitHub web uploads may reject dotfiles. If you see `This file is hidden`, upload the other contents, then use **Add file → Create new file** to recreate `.gitignore`, `.nojekyll`, and `.github/workflows/pages.yml` at their original paths. Keep the leading dots.

1. Extract the **source ZIP**.
2. Sign in to GitHub. Select **+ → New repository**, name it `thumbnail-based-blur`, choose **Public**, and create an empty repository.
3. Click **uploading an existing file**. Open the extracted `thumbnail-based-blur` folder and drag its **contents** into GitHub, including `.github`. Do not upload the ZIP or add an extra outer folder.
4. Click **Commit changes**. Your source code is now on GitHub.
5. For a live demo, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
6. Open **Actions → Test and deploy demo → Run workflow**, select `main`, and run it. Future pushes to `main` also trigger deployment.
7. When the workflow completes, find the live URL in **Settings → Pages** or the workflow's `github-pages` environment.

The workflow checks syntax, runs tests, and builds before deploying. Pull requests run checks only. GitHub repository publication and npm package publication are separate operations; `private: true` in `package.json` prevents accidental npm publishing. No secrets, database, or environment variables are required.

If you prefer Git, replace the placeholder URL below with your own empty repository's URL:

```sh
git init -b main
git add .
git commit -m "Initial release: thumbnail blur demo"
git remote add origin https://github.com/YOUR_USERNAME/thumbnail-based-blur.git
git push -u origin main
```

## Use the core modules

Copy both files in `src/` into your project, preserving their relative paths:

```js
import { ThumbnailBlur } from './src/thumbnail-blur.js';

const image = document.querySelector('#wallpaper');
await image.decode();
const material = new ThumbnailBlur({ maxSize: 256, blur: 20 });
material.prepare(image, image.getBoundingClientRect());
const target = document.querySelector('canvas');
material.draw(target, target.getBoundingClientRect());
```

Use `object-fit: cover; object-position: center` for the wallpaper. Pass its container bounds to `prepare()`. For another position, set `position: [x, y]`: `[0, 0]` is top-left and `[1, 1]` is bottom-right. All rectangles must use the same viewport coordinate system, such as `getBoundingClientRect()`; do not add scroll offsets.

| API | Purpose |
| --- | --- |
| `new ThumbnailBlur(options)` | One wallpaper cache per instance |
| `prepare(image, bounds, options?)` | Build or reuse the cache after image decoding; returns `ready` or `fallback` |
| `draw(canvas, rect, mask?, dpr?)` | Draw material at the actual rectangle, optionally using an alpha mask |
| `invalidate()` | Force a rebuild when image content or resources change |
| `cache`, `status`, `buildCount` | Inspect the cache canvas, state, and build count |
| `attachFrostedText(element, material)` | Experimental text adapter returning `render`, `refresh`, and `dispose` |

Defaults: `maxSize:256`, `blur:20`, `saturation:1.8`, `brightness:1.04`, `tint:[248,247,255,0.2]`, `boost:1.1`, `position:[0.5,0.5]`. `blur:0` disables box blur but still applies downsampling and color processing.

For the text adapter, use a plain-text element and this CSS:

```css
.tb-output { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
```

```js
import { attachFrostedText } from './src/thumbnail-blur.js';
await document.fonts.ready;
const text = attachFrostedText(document.querySelector('.text'), material);
text.render();  // Call after motion or a material change, including from your animation loop.
text.refresh(); // Rebuild glyphs after font or layout changes.
text.dispose(); // Restore native text and remove observers on cleanup.
```

To change text, dispose the old adapter, replace the text, then attach again. After changing wallpaper dimensions or material options, call `prepare()` then `render()`. Call `invalidate()` when content changes at the same image URL. Motion resamples cached material without blurring again. Your application manages animation frames; the library does not continuously measure the page. In React, create the adapter in an effect and call `dispose()` during cleanup.

## Limitations

- Samples the specified static wallpaper, not foreground cards, video, multiple CSS backgrounds, or arbitrary CSS transforms.
- Three-pass box blur and color processing are approximations. Low resolution loses detail; radius coefficient `0.58` is experimental.
- Remote images require server CORS permission. Set `image.crossOrigin = 'anonymous'` **before** `src`. Failed reads use a cached tint fallback; `invalidate()` allows retrying.
- Ordinary Chinese and Latin text can be explored. Per-character Canvas drawing cannot reproduce all ligatures, Arabic shaping, combining characters, or emoji. Native DOM text remains accessible to assistive technology.
- Avoid padding, complex children, RTL text, multicolumn layout, and transform scaling on the text element. Use an outer layout wrapper. Translation motion can be redrawn at the actual position.
- Areas outside the wallpaper become transparent. Transparent source images are first composited over a dark opaque backing.
- Computation remains on the main thread; no Worker or GPU implementation. Phone hardware performance and a full cross-browser matrix have not been validated.

## Documentation and license

[Architecture](docs/architecture.en.md) · [Verification](docs/verification.en.md) · [Blur effect](docs/blur-effect.en.md)

MIT License. Includes an original demo wallpaper; third-party assets are excluded.
