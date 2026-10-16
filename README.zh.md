# 通过缩略图方式实现模糊效果

[English](README.md) · **中文**

零运行依赖的浏览器图像处理模块。实现降采样、三轮可分离盒式卷积、颜色变换、缓存和坐标重采样。提供独立 ES 模块、可选 alpha 遮罩、双语参数演示、算法测试和静态构建。

**离线实时采样版：0.3.0。** 使用近似卷积和字节通道计算；不保证固定帧率或与 CSS `backdrop-filter` 像素等价。

文档与演示支持英文和中文，英语为默认语言，中文为第二语言。可在页面顶部切换，之后记住你的选择；切换语言时保留自定义文字和材质参数。

## 实时采样与离线启动

这是基于 0.2.0 独立复制的离线新项目。默认以 30 FPS 重新读取动态背景、降采样并执行模糊，演示滑块可调 1–60 FPS。取消“刷新采样”会保留最后一帧；背景动画和文字移动可独立开关。实测采样帧率每秒更新一次，目标值不代表设备一定能够达到。

安装 Node.js 22 或更新版本后，双击 `start-offline.cmd`，打开 http://127.0.0.1:4175 。无需 npm 安装、网络、密钥或外部资源。停止服务可在终端按 Ctrl+C。也可用 `npm run dev`（默认端口 4173）。

运行 `npm run build` 生成 `dist/`。该目录也包含本地服务器与启动脚本，复制到其他安装了 Node.js 的电脑即可离线运行。不能直接双击 HTML，因为浏览器需要通过 HTTP 加载 ES 模块。

`prepare(source, bounds, options)` 现在接受已解码图片、非空 Canvas、已有当前帧的视频。动态源每次刷新前必须调用 `invalidate()`。演示使用动态 Canvas，视频接入方式见下：

```js
import { ThumbnailBlur } from './src/thumbnail-blur.js';
import { FrameSampler } from './src/frame-sampler.js';
const video = document.querySelector('video');
const output = document.querySelector('canvas');
const material = new ThumbnailBlur({ maxSize: 256, blur: 20 });
const sampler = new FrameSampler(() => {
  if (video.readyState < 2) return;
  material.invalidate();
  material.prepare(video, video.getBoundingClientRect());
  material.draw(output, output.getBoundingClientRect());
}, { fps: 30, onError: console.error });
sampler.start();
// sampler.setFPS(15); // 核心支持 1–120 FPS
// sampler.stop();    // 保留缓存
// sampler.dispose(); // 卸载并移除监听器
```

刷新由 requestAnimationFrame 限速，错过的帧会跳过，不会排队补算。页面隐藏时暂停，回到前台恢复；手动停止后不会自动重启。采样和元素移动绘制互相独立。所有像素处理仍在主线程，实际帧率受屏幕刷新率和计算成本限制。不会自动截取 DOM、CSS 多层背景或网页视频；视频必须作为指定源传入，并满足同源或 CORS 读取条件。

## 演示

运行 `npm run dev`，打开 http://127.0.0.1:4173 。在线演示尚未启用 GitHub Pages；请以仓库 Pages 设置与 Actions 的实际发布结果为准。

## 运行

安装 Node.js 22 或更新版本，在项目目录执行：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:4173 。Windows PowerShell 若不允许运行 npm.ps1，将 `npm` 换为 `npm.cmd`。页面使用 ES 模块，需要通过 HTTP 访问，不能直接双击 HTML。

演示支持本地 PNG/JPEG/WebP 图片（小于 20 MB）、文字输入、模糊强度、缩略图尺寸、乳白填充和移动动画。上传图片仅在浏览器本地使用，不发送到服务器。自带 SVG 背景为本项目绘制，不包含私人图片或第三方素材。

```sh
npm run check
npm test
npm run build
```

`dist/` 是可部署的纯静态目录，使用相对路径，可放在 GitHub Pages 的仓库子路径。`npm run dev` 是本地开发服务器。

## 发布到 GitHub

GitHub 网页上传可能拒绝以点开头的文件。遇到 `This file is hidden` 时，先上传其余内容，再用 **Add file → Create new file** 按原路径补建 `.gitignore`、`.nojekyll` 和 `.github/workflows/pages.yml`；不要去掉名称前面的点。

初学者可直接用网页上传：解压源码 ZIP，在 GitHub 创建一个名为 `thumbnail-based-blur` 的公开空仓库，点击 **uploading an existing file**，将解压后的 `thumbnail-based-blur` 文件夹**里面**的文件与文件夹全部拖入（包括 `.github`），然后点击 **Commit changes**。不要上传 ZIP 文件，也不要多套一层外部文件夹。

1. 新建空仓库（推荐名称 `thumbnail-based-blur`），将本项目完整内容上传，保留 `.github/` 等隐藏目录，以 `main` 为默认分支。网页上传或 Git 推送都可以。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送到 `main` 或在 Actions 手动运行 **Test and deploy demo**。工作流先做语法检查、算法测试与静态构建，再部署到 Pages。Pull Request 只做验证。
4. 发布地址以工作流中 `github-pages` 环境显示的 URL 为准。

已有本地仓库时使用自己的远程 URL；新项目可执行：

```sh
git init -b main
git add .
git commit -m "Initial release: thumbnail blur demo"
# 将下面的占位地址替换成自己新建仓库的地址
git remote add origin https://github.com/YOUR_USERNAME/thumbnail-based-blur.git
git push -u origin main
```

GitHub 仓库发布和 npm 包发布是不同操作；当前 `package.json` 设置 `private: true`，防止误发布 npm。无需任何密钥、数据库或环境变量。

## 使用核心模块

将 `src/` 内所有模块一起复制到项目，保持相对路径：

```js
import { ThumbnailBlur } from './src/thumbnail-blur.js';

const image = document.querySelector('#wallpaper');
await image.decode();
const material = new ThumbnailBlur({ maxSize: 256, blur: 20 });
material.prepare(image, image.getBoundingClientRect());
const target = document.querySelector('canvas');
material.draw(target, target.getBoundingClientRect());
```

背景需使用 `object-fit: cover; object-position: center`，容器尺寸就是传给 `prepare()` 的 `bounds`。非居中背景通过 `position: [x, y]` 配置比例坐标，例如 `[0, 0]` 左上、`[1, 1]` 右下。所有 `bounds`、`rect` 坐标使用同一视口坐标系，直接传 `getBoundingClientRect()`；不要额外加滚动距离。

| API | 用途 |
| --- | --- |
| `new ThumbnailBlur(options)` | 每个实例保留一张缓存背景 |
| `prepare(image, bounds, options?)` | 背景已解码后生成或复用缓存；返回 `ready` / `fallback` |
| `draw(canvas, rect, mask?, dpr?)` | 依据实际矩形显示材质；可传 alpha 遮罩 |
| `invalidate()` | 同 URL 图片内容变化或输入资源更换时强制失效 |
| `cache`, `status`, `buildCount` | 查看缓存画布、状态和生成次数 |
| `attachFrostedText(element, material)` | 实验文字适配器；返回 `render / refresh / dispose` |

默认值：`maxSize:256`、`blur:20`、`saturation:1.8`、`brightness:1.04`、`tint:[248,247,255,0.2]`、`boost:1.1`、`position:[0.5,0.5]`。`blur:0` 会关闭盒式模糊，但仍保留降采样与材质处理。

文字适配器仅支持纯文本元素，需使用以下样式：

```css
.tb-output { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
```

```js
import { attachFrostedText } from './src/thumbnail-blur.js';
await document.fonts.ready;
const text = attachFrostedText(document.querySelector('.text'), material);
// 元素运动或背景材质改变后调用。动画时在应用的 requestAnimationFrame 中调用。
text.render();
// 字体 / 布局变化可主动重新生成字形；ResizeObserver 会处理尺寸变化。
text.refresh();
// 卸载时恢复原文并移除观察器。
text.dispose();
```

改文字前先 `dispose()` 再修改内容、重新 attach。调整背景尺寸或材质时先 `prepare()` 再 `render()`；背景 URL 内容变化时额外调用 `invalidate()`。元素运动只重采样已有材质；开启 FrameSampler 时按目标帧率重新计算模糊。库不自动持续测量整页。React 中可在 effect 里初始化，cleanup 中 `dispose()`，效果循环由组件管理。

## 边界

- 只读取指定图片、Canvas 或视频源，不会自动合成前景卡片、多层 CSS 背景或任意 CSS 变换。
- 三轮盒式模糊和颜色计算是近似算法；小尺寸采样会降低精细度，半径系数 `0.58` 是实验值。
- 非同源图片需服务器允许 CORS，并在设置 `src` **之前**设置 `image.crossOrigin = 'anonymous'`。读取失败时缓存填充色，调用 `invalidate()` 后可重试。
- 中文和常规拉丁文字可用于试验。逐字符 Canvas 栅格化无法准确保留复杂连字、阿拉伯文塑形、组合字符和所有 emoji；不作为完整排版引擎。原生 DOM 文本仍保留给辅助技术。
- 文字元素避免 padding、复杂子元素、RTL、多列排版与 CSS transform 缩放；推荐外层承载布局、内层承载文字。普通平移动画支持按实际位置重绘。
- 输出超出背景边界的部分为透明，不会保留旧像素。透明输入图片先合成到深色不透明底。
- 计算仍在主线程，没有 Worker/GPU 实现。未完成手机真机帧率和跨浏览器完整验证。

## 文档与许可

[算法与设计说明](docs/architecture.md) · [技术说明](docs/blur-effect.md) · [验证记录](docs/verification.md)

MIT License。该仓库包含自己绘制的演示背景，不包含第三方素材。
