# Realtime sampling / 实时采样

This 0.3.0 edition extends the original static architecture described in the other documents. / 本版在其余原版文档所述静态架构之上增加动态采样。

See [English guide](../README.md#offline-realtime-version) and [中文指南](../README.zh.md#实时采样与离线启动).

Dynamic source → rate-limited invalidation → downsample → box blur → color transform → cached texture → positional draw. Background updates and display drawing use separate animation callbacks. No per-frame DOM capture is performed.
