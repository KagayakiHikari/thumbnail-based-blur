export const locales = {
  en: {
    lang: 'en', title: 'Thumbnail-Based Blur', description: 'Image downsampling, convolution, and cached resampling demo', readmePath: './README.md',
    language: 'Language', heading1: 'Downsample and convolve.', heading2: 'Cache and resample.', intro: 'Image input → Pixel processing → Cached output.',
    workspace: 'Material demo', cachedWallpaper: 'CACHED WALLPAPER', caption: 'Sample at the current position · Sliding-window box blur', liveBlur: 'Live CSS blur', cachedBlur: 'Cached blur',
    lab: 'Material lab', size: 'Thumbnail longest edge', blur: 'Blur strength', tint: 'Milky tint', text: 'Demo text', upload: 'Change background',
    dimensions: 'Cache dimensions', builds: 'Total builds', duration: 'Last build time',
    note: 'An approximation for static wallpaper. The live CSS sample sits at a different position and illustrates texture, not pixel equivalence. Complex glyphs may differ from native text.',
    footer: 'Zero runtime dependencies · Browser Canvas · MIT License', readme: 'User guide ↗', sample: 'Light flows. Words stay clear.',
    start: 'Start moving', pause: 'Pause motion', loading: 'Preparing background…', ready: 'Cache ready · Reused during motion', fallback: 'Background read failed · Using tint fallback',
    tooLarge: 'Choose an image smaller than 20 MB', decodeFailed: 'Cannot decode this image. Try another one.', loadFailed: 'Background failed to load. Try changing it.'
  },
  zh: {
    lang: 'zh-CN', title: '通过缩略图方式实现模糊效果', description: '图像降采样、卷积与缓存重采样演示', readmePath: './README.zh.md',
    language: '语言', heading1: '降采样与卷积，', heading2: '缓存与重采样。', intro: '图像输入 → 像素处理 → 缓存输出。',
    workspace: '材质演示', cachedWallpaper: '缓存壁纸', caption: '移动时按实际位置取色 · 滑动窗口盒式模糊', liveBlur: '实时 CSS 模糊', cachedBlur: '缓存模糊',
    lab: '材质实验室', size: '缩略图最长边', blur: '模糊强度', tint: '乳白填充', text: '演示文字', upload: '更换背景',
    dimensions: '缓存尺寸', builds: '累计生成', duration: '最近生成耗时',
    note: '静态壁纸的近似材质。实时 CSS 样本位于另一个位置，只用于观察质感，不是像素等价对比。复杂字形可能与原生文字有差异。',
    footer: '零运行依赖 · 浏览器 Canvas · MIT License', readme: '使用说明 ↗', sample: '光影流过，文字依然清晰。',
    start: '开始移动', pause: '暂停移动', loading: '准备背景…', ready: '缓存已就绪 · 移动期间复用', fallback: '背景读取失败 · 已使用填充色',
    tooLarge: '请选择小于 20 MB 的图片', decodeFailed: '图片无法解码，请换一张图片', loadFailed: '背景加载失败，请尝试更换背景'
  }
};

export function chooseLanguage(saved) {
  return Object.hasOwn(locales, saved) ? saved : 'en';
}
