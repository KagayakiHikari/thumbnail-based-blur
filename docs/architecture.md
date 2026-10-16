# 模块架构

[English](architecture.en.md) · **中文**

| 模块 | 职责 |
| --- | --- |
| src/pixels.js | cover 映射、RGBA 滑动窗口卷积、颜色变换 |
| src/thumbnail-blur.js | 输入验证、缓存键与失效、Canvas 输出、可选遮罩适配 |
| demo/app.js | 参数绑定、图像解码、调度输出 |
| demo/i18n.js | 双语词典与语言选择 |
| scripts/ | 本地 HTTP 服务与静态文件构建 |
| tests/ | 独立参考卷积、缓存状态、双语一致性检查 |

数据流：已解码图像 → cover 映射与降采样 → 三轮盒式卷积 → 颜色变换 → 缓存 → 坐标重采样 → 可选 alpha 遮罩。

核心模块不依赖演示页面。调用方负责资源就绪、输出矩形与刷新调度。缓存状态和字形遮罩状态独立，输出位置改变不要求重建模糊缓存。

公式、边界和复杂度见 [技术说明](blur-effect.md)。
