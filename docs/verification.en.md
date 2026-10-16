# Validation scope

**English** · [中文](verification.md)

Syntax checks, nine automated tests, and a static build. Tests cover an independent naive-convolution reference, edge radii, cover mapping, constant colors and tint endpoints, rejected parameters, DOMRect prototype coordinates, cache hits and invalidation, read-failure fallback, translation keys, and document paths.

```sh
npm run check
npm test
npm run build
```

Cache tests use controlled Canvas substitutes and do not replace real CORS integration testing. Physical-device frame rates, cross-browser pixel identity, and complex text shaping have not been fully verified.
