# Module architecture

> 0.3.0: This document describes the original static pipeline. See [realtime changes](realtime.md) for the offline FPS edition. / 此文描述原静态流程，离线帧率版本请参阅[实时扩展](realtime.md)。

**English** · [中文](architecture.md)

| Module | Responsibility |
| --- | --- |
| src/pixels.js | Cover mapping, RGBA sliding-window convolution, color transformation |
| src/thumbnail-blur.js | Input validation, cache keys and invalidation, Canvas output, optional mask adapter |
| demo/app.js | Parameter binding, image decoding, output scheduling |
| demo/i18n.js | Bilingual dictionary and language selection |
| scripts/ | Local HTTP server and static file build |
| tests/ | Independent convolution reference, cache states, translation consistency |

Data flow: decoded image → cover mapping and downsampling → three box passes → color transformation → cache → coordinate resampling → optional alpha mask.

Core modules do not depend on the demo. Callers manage resource readiness, output rectangles, and refresh scheduling. Pixel caches and glyph masks have independent states; a changed output position does not require rebuilding the blur cache.

See [technical specification](blur-effect.en.md) for formulas, boundaries, and complexity.
