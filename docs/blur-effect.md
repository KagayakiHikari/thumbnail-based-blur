# 通过缩略图方式实现模糊效果：技术说明

> 0.3.0: This document describes the original static pipeline. See [realtime changes](realtime.md) for the offline FPS edition. / 此文描述原静态流程，离线帧率版本请参阅[实时扩展](realtime.md)。

[English](blur-effect.en.md) · **中文**

本模块实现图像降采样、可分离盒式卷积、颜色变换、结果缓存和坐标重采样。输入为已解码图像、映射矩形和数值参数，输出为 Canvas 像素数据。核心计算与文字遮罩相互独立。

## 输入与映射

设源图尺寸为 Iw × Ih，映射尺寸为 W × H，最长边上限为 M。尺寸必须为有限正数。

```text
q = max(W / Iw, H / Ih)
dw = Iw × q; dh = Ih × q
x = (W - dw) × position.x; y = (H - dh) × position.y
s = min(1, M / max(W, H))
w = max(1, ceil(W × s)); h = max(1, ceil(H × s))
sx = w / W; sy = h / H
```

coverRect() 计算覆盖映射，position 的两个分量位于 [0,1]。Canvas drawImage() 执行降采样，实际横纵比例分别采用 sx、sy，避免取整误差。插值细节由浏览器决定。透明源图先合成到不透明底色 #111827。

## 卷积与边界

boxBlur() 接收长度为 4wh 的 RGBA 数组。半径 r 为 [0,512] 内的整数，轮数为 [1,10] 内的整数。浏览器模块固定三轮，半径为：

```text
r = blur == 0 ? 0 : max(1, round(blur × s × 0.58))
k = 2r + 1
e(i,n) = min(n-1, max(0,i))
S(x) = sum(C(e(x+j,w), y), j=-r..r)
S(x+1) = S(x) - C(e(x-r,w), y) + C(e(x+r+1,w), y)
H(x,y) = S(x) / k
```

每轮先水平平均，再按相同递推垂直平均。越界重复边缘像素。各方向结果写入 Uint8ClampedArray，产生字节舍入和钳制；RGB 分别计算，alpha 设为 255。三轮盒式卷积近似平滑核。0.58 是近似换算系数，不是高斯标准差的严格转换；结果不等价于精确高斯卷积或 CSS 模糊。

## 颜色变换

令输入通道为 C，饱和度为 a，亮度为 b，填充颜色为 T，填充比例为 t，增益为 g：

```text
L = 0.2126R + 0.7152G + 0.0722B
F(C) = clamp((L + a × (C - L)) × b, 0, 255)
O(C) = ((1-t) × F(C) + t × T(C)) × g
```

输出通过 Uint8ClampedArray 转换为字节，alpha 设为 255。直接使用编码通道值，未进行线性光转换，不能宣称与浏览器滤镜逐像素一致。

## 缓存状态

prepare() 的键包含源 URL、源图尺寸、映射宽高、完整处理参数和失效版本。命中时复用像素；映射原点更新但不参与键。invalidate() 增加版本并清空键，同 URL 内容变化时须主动调用。

读取成功后状态为 ready。读取失败时重置画布污染状态，以 tint 填充并设置 fallback；回退保留填充色 alpha。失败结果也会缓存，直到参数变化或主动失效。buildCount 统计构建次数，不表示帧率。

## 输出与遮罩

bounds 与 rect 使用同一视口坐标系。输出尺寸为 ceil(rect.width × dpr)、ceil(rect.height × dpr)。缓存原点为 (bounds.left-rect.left, bounds.top-rect.top) × dpr，绘制尺寸为映射尺寸乘 dpr。

每次输出先清空再绘制，超出映射边界的部分透明。可选 alpha 遮罩以 destination-in 合成。默认 DPR 上限为 2。输出阶段不重新卷积，也不编码图片数据。

attachFrostedText() 是独立的可选字形栅格化适配器，通过 DOM Range 获取字符位置并生成遮罩，不参与模糊算法。不保证复杂连字、组合字符和双向文字的完整塑形。

## 计算成本与限制

p 轮、w × h 像素和半径 r 的窗口初始化与遍历成本为 O(p × (wh + r(w+h)))。固定半径和轮数时近似 O(wh)。三个工作数组占 12wh 字节，另有输入、ImageData 和画布存储；总辅助空间为 O(wh)。

处理在主线程执行，没有 Worker 或 GPU 计算实现。缓存减少重复卷积，不能消除输出重采样和合成成本。跨域读取需要 CORS 许可。管线只处理显式图像输入，不采样浏览器合成场景。固定帧率、跨浏览器像素一致性和全部字体行为尚未验证。

模块结构见 [架构](architecture.md)，检查范围见 [验证](verification.md)，API 与运行方式见 [README](../README.zh.md)。
