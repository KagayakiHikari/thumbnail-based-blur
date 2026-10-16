export const locales = {
  en: {
    lang: 'en', title: 'Thumbnail Blur Realtime', description: 'Image downsampling, convolution, and cached resampling demo', readmePath: './README.md',
    fps: 'Sampling rate', sampling: 'Refresh sampling', backgroundMotion: 'Animate background', actualFPS: 'Measured sampling rate', frozen: 'Sampling paused · Cached frame retained', sampleFailed: 'Sampling failed · Refresh stopped',
    language: 'Language', heading1: 'Downsample and convolve.', heading2: 'Refresh at your frame rate.', intro: 'Dynamic canvas → Rate-limited blur → Position-based rendering.',
    workspace: 'Material demo', cachedWallpaper: 'CACHED WALLPAPER', caption: 'Sample at the current position · Sliding-window box blur', liveBlur: 'Live CSS blur', cachedBlur: 'Cached blur',
    lab: 'Material lab', size: 'Thumbnail longest edge', blur: 'Blur strength', tint: 'Milky tint', text: 'Demo text', upload: 'Change background',
    dimensions: 'Cache dimensions', builds: 'Total builds', duration: 'Last build time',
    note: 'Each sample rebuilds the thumbnail blur. Target FPS is limited by display refresh and processing cost. The live CSS sample sits at a different position and illustrates texture, not pixel equivalence. Complex glyphs may differ from native text.',
    footer: 'Zero runtime dependencies · Browser Canvas · MIT License', readme: 'User guide ↗', sample: 'Light flows. Words stay clear.',
    start: 'Start moving', pause: 'Pause motion', loading: 'Preparing background…', ready: 'Rate-limited sampling active', fallback: 'Background read failed · Using tint fallback',
    tooLarge: 'Choose an image smaller than 20 MB', decodeFailed: 'Cannot decode this image. Try another one.', loadFailed: 'Background failed to load. Try changing it.'
  },
  zh: {
    lang: 'zh-CN', title: '缩略图实时刷新模糊', description: '图像降采样、卷积与缓存重采样演示', readmePath: './README.zh.md',
    fps: '采样帧率', sampling: '刷新采样', backgroundMotion: '背景动画', actualFPS: '实测采样帧率', frozen: '采样已暂停 · 保留缓存画面', sampleFailed: '采样失败 · 刷新已停止',
    language: '语言', heading1: '降采样与卷积，', heading2: '按帧率刷新采样。', intro: '动态画布 → 按帧率模糊 → 按位置绘制。',
    workspace: '材质演示', cachedWallpaper: '缓存壁纸', caption: '移动时按实际位置取色 · 滑动窗口盒式模糊', liveBlur: '实时 CSS 模糊', cachedBlur: '缓存模糊',
    lab: '材质实验室', size: '缩略图最长边', blur: '模糊强度', tint: '乳白填充', text: '演示文字', upload: '更换背景',
    dimensions: '缓存尺寸', builds: '累计生成', duration: '最近生成耗时',
    note: '每次采样都会重建缩略图模糊；实际帧率受屏幕刷新率和计算耗时限制。实时 CSS 样本位于另一个位置，只用于观察质感，不是像素等价对比。复杂字形可能与原生文字有差异。',
    footer: '零运行依赖 · 浏览器 Canvas · MIT License', readme: '使用说明 ↗', sample: '光影流过，文字依然清晰。',
    start: '开始移动', pause: '暂停移动', loading: '准备背景…', ready: '正在按目标帧率刷新采样', fallback: '背景读取失败 · 已使用填充色',
    tooLarge: '请选择小于 20 MB 的图片', decodeFailed: '图片无法解码，请换一张图片', loadFailed: '背景加载失败，请尝试更换背景'
  }
};

export function chooseLanguage(saved) {
  return Object.hasOwn(locales, saved) ? saved : 'en';
}
