# Thumbnail Blur

[中文](README.md) · [English](README.en.md) · **日本語**

実行時の外部依存がないブラウザー向け画像処理モジュールです。縮小、3 回の分離可能なボックス畳み込み、色変換、キャッシュ、座標による再サンプリングを実装します。独立した ES モジュール、任意の alpha マスク、三言語パラメーターデモ、アルゴリズムテスト、静的ビルドを含みます。

**バージョン：0.2.0。** 近似畳み込みとバイトチャンネル計算を使用し、固定フレームレートや CSS `backdrop-filter` との画素単位の一致は保証しません。

デモは中国語・英語・日本語に対応しています。ページ上部で言語を切り替えられます。初回はブラウザーの言語を使い、以降は選択を保存します。入力した独自の文字と質感の設定は、言語を切り替えても保持されます。

## デモ

`npm run dev` を実行して http://127.0.0.1:4173 を開きます。オンラインデモの GitHub Pages は未設定です。リポジトリの Pages 設定と Actions の公開結果を確認してください。

## ローカルで実行

Node.js 22 以降をインストールし、プロジェクトのフォルダーで次を実行します。

```sh
npm ci
npm run dev
```

http://127.0.0.1:4173 を開きます。Windows PowerShell でスクリプト実行が制限される場合は、`npm` の代わりに `npm.cmd` を使ってください。ES モジュールを使用するため HTTP サーバーが必要です。HTML ファイルをダブルクリックしても動作しません。

20 MB 未満の PNG/JPEG/WebP を背景として選び、文字、ぼかしの強さ、縮小画像のサイズ、乳白色の濃さを変更できます。動きの開始と一時停止も可能です。選択した画像はブラウザー内だけで使用し、サーバーへ送信しません。同梱の SVG 壁紙は本プロジェクト用に作成したもので、個人の画像や第三者の素材は含みません。

```sh
npm run check
npm test
npm run build
```

`dist/` が公開用の静的サイトです。相対パスを使用しているため、GitHub Pages のリポジトリ配下でも動作します。`npm run dev` はローカル開発サーバーを起動します。

## GitHub で公開する：初心者向け

GitHub の Web アップロードはドットで始まるファイルを拒否する場合があります。`This file is hidden` が出たら残りを先にアップロードし、**Add file → Create new file** で `.gitignore`、`.nojekyll`、`.github/workflows/pages.yml` を元のパスで作成してください。先頭のドットは残します。

1. **ソース ZIP** を解凍します。
2. GitHub にログインし、**+ → New repository** を選びます。名前を `thumbnail-blur`、公開範囲を **Public** にして空のリポジトリを作成します。
3. **uploading an existing file** をクリックします。解凍した `thumbnail-blur` フォルダーを開き、その**中身**をすべてドラッグします。`.github` も含めてください。ZIP 自体や外側のフォルダーはアップロードしません。
4. **Commit changes** をクリックすると、ソースのアップロードが完了します。
5. デモを公開するには、**Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。
6. **Actions → Test and deploy demo → Run workflow** を開き、`main` を選択して実行します。その後は `main` への push でも自動実行されます。
7. 完了したら **Settings → Pages** またはワークフローの `github-pages` 環境で公開 URL を確認します。

ワークフローは構文チェック、テスト、ビルドに成功してから公開します。Pull Request では検証のみ実行します。GitHub リポジトリの公開と npm パッケージの公開は別の操作です。`package.json` の `private: true` により npm への誤公開を防ぎます。秘密情報、データベース、環境変数は不要です。

Git を使う場合は、次の仮 URL を自分の空リポジトリの URL に置き換えてください。

```sh
git init -b main
git add .
git commit -m "Initial release: thumbnail blur demo"
git remote add origin https://github.com/YOUR_USERNAME/thumbnail-blur.git
git push -u origin main
```

## コアモジュールを利用

`src/` の 2 ファイルを、相対パスを保ったままプロジェクトへコピーします。

```js
import { ThumbnailBlur } from './src/thumbnail-blur.js';

const image = document.querySelector('#wallpaper');
await image.decode();
const material = new ThumbnailBlur({ maxSize: 256, blur: 20 });
material.prepare(image, image.getBoundingClientRect());
const target = document.querySelector('canvas');
material.draw(target, target.getBoundingClientRect());
```

壁紙には `object-fit: cover; object-position: center` を使います。`prepare()` へ渡す範囲は背景コンテナーの範囲です。別の位置には `position: [x, y]` を指定します。`[0, 0]` は左上、`[1, 1]` は右下です。すべての矩形は `getBoundingClientRect()` と同じビューポート座標を使用してください。スクロール量を加算しません。

| API | 用途 |
| --- | --- |
| `new ThumbnailBlur(options)` | インスタンスごとに壁紙を 1 枚キャッシュ |
| `prepare(image, bounds, options?)` | デコード後に生成または再利用。`ready` / `fallback` を返す |
| `draw(canvas, rect, mask?, dpr?)` | 実際の矩形へ描画。アルファマスクも指定可能 |
| `invalidate()` | 同じ URL の画像内容やリソースが変わった際に強制更新 |
| `cache`, `status`, `buildCount` | キャッシュの Canvas、状態、生成回数を確認 |
| `attachFrostedText(element, material)` | 実験用の文字アダプター。`render / refresh / dispose` を返す |

初期値は `maxSize:256`、`blur:20`、`saturation:1.8`、`brightness:1.04`、`tint:[248,247,255,0.2]`、`boost:1.1`、`position:[0.5,0.5]` です。`blur:0` はボックスぼかしを無効にしますが、縮小と色処理は残ります。

文字アダプターにはプレーンテキストの要素と次の CSS を使用します。

```css
.tb-output { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
```

```js
import { attachFrostedText } from './src/thumbnail-blur.js';
await document.fonts.ready;
const text = attachFrostedText(document.querySelector('.text'), material);
text.render();  // 移動や質感の変更後。アニメーションループ内でも呼び出せます。
text.refresh(); // フォントやレイアウト変更時に字形を再生成します。
text.dispose(); // 通常の文字へ戻し、監視を解除します。
```

文字を変更する場合は古いアダプターを `dispose()` してから内容を置き換え、再度 attach します。背景サイズや質感を変更したら `prepare()`、`render()` の順に呼びます。同じ画像 URL の内容が変わった場合は `invalidate()` も必要です。移動中はキャッシュから再描画するだけで、ぼかしを繰り返しません。フレーム管理は利用側で行い、ライブラリはページ全体を常時測定しません。React では effect で初期化し、cleanup で `dispose()` します。

## 制約

- 指定した静止壁紙だけを取得します。前景のカード、動画、複数の CSS 背景、任意の CSS 変形は対象外です。
- 3 回のボックスぼかしと色処理は近似です。低解像度では細部が失われ、半径係数 `0.58` は実験値です。
- 外部画像にはサーバー側の CORS 許可が必要です。`src` を設定する**前に** `image.crossOrigin = 'anonymous'` を設定します。読み取り失敗時は塗り色をキャッシュし、`invalidate()` 後に再試行できます。
- 通常の中国語やラテン文字で試せますが、文字単位の Canvas 描画は、すべての合字、アラビア語の字形処理、結合文字、絵文字を正確には再現しません。支援技術向けの DOM テキストは保持します。
- 文字要素の padding、複雑な子要素、RTL、段組み、transform による拡大縮小を避けてください。配置には外側の要素を使います。平行移動は実際の位置に合わせて再描画できます。
- 背景範囲外は透明になります。透明な入力画像は、最初に暗い不透明な下地へ合成します。
- 処理はメインスレッドで行います。Worker や GPU 実装はありません。実機スマートフォンでの性能と、全ブラウザーの検証は未完了です。

## 文書とライセンス

[設計説明](docs/architecture.ja.md) · [検証記録](docs/verification.ja.md) · [技術仕様](docs/blur-effect.ja.md)

MIT License。オリジナルのデモ壁紙を含み、第三者の素材は含みません。
