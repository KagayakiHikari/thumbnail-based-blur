import { cp, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url), output = new URL('dist/', root);
await rm(output, { recursive: true, force: true }); await mkdir(output, { recursive: true });
for (const path of ['index.html', 'demo', 'src', 'README.md', 'README.zh.md', 'LICENSE', 'docs', 'start-offline.cmd']) await cp(new URL(path, root), new URL(path, output), { recursive: true });
await cp(new URL('.nojekyll', root), new URL('.nojekyll', output));
await mkdir(new URL('scripts/', output), { recursive: true });
await cp(new URL('scripts/serve.mjs', root), new URL('scripts/serve.mjs', output));
console.log('Built offline site in dist/; run start-offline.cmd (Node.js required)');
