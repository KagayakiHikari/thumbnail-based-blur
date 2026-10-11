# 验证范围

**中文** · [English](verification.en.md)

语法检查、9 项自动测试和静态构建。测试覆盖独立朴素卷积对照、边缘半径、cover 映射、恒色与混色端点、参数拒绝、DOMRect 原型坐标、缓存命中与失效、读取失败回退、三语键与文档路径。

```sh
npm run check
npm test
npm run build
```

自动测试使用受控 Canvas 替身验证缓存逻辑；不能替代真实 CORS 服务测试。手机真机帧率、跨浏览器像素一致性和复杂文字塑形尚未完整验证。
