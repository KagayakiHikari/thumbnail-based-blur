import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ThumbnailBlur } from '../src/thumbnail-blur.js';

function fakeCanvas() {
  const calls = [];
  const c = { width:1, height:1, calls };
  const ctx = {
    fillRect() {}, putImageData() {}, clearRect() {}, setTransform() {},
    drawImage(...args) { calls.push(args); },
    getImageData() { return { width:c.width, height:c.height, data:new Uint8ClampedArray(c.width*c.height*4) }; }
  };
  c.getContext = () => ctx; return c;
}
globalThis.document = { createElement: fakeCanvas };
const image = { complete:true, naturalWidth:1600, naturalHeight:1000, src:'wallpaper.svg' };

test('DOMRect prototype coordinates survive prepare and moving origins reuse cache', () => {
  const rect = Object.create({left:10,top:20,width:400,height:800});
  const material = new ThumbnailBlur(); material.prepare(image,rect);
  assert.deepEqual(material.bounds,{left:10,top:20,width:400,height:800});
  const target=fakeCanvas(); material.draw(target,{left:50,top:60,width:100,height:30},null,1);
  assert.deepEqual(target.calls.at(-1).slice(1),[-40,-40,400,800]);
  material.prepare(image,{left:30,top:40,width:400,height:800}); assert.equal(material.buildCount,1);
  material.invalidate(); material.prepare(image,rect); assert.equal(material.buildCount,2);
});
test('failed pixel read is cached until explicit invalidation', () => {
  const material=new ThumbnailBlur(); const ctx=material.cache.getContext('2d');
  ctx.getImageData=()=>{throw new Error('SecurityError');};
  const rect={left:0,top:0,width:400,height:800};
  assert.equal(material.prepare(image,rect),'fallback');
  assert.equal(material.prepare(image,rect),'fallback'); assert.equal(material.buildCount,1);
  material.invalidate(); material.prepare(image,rect); assert.equal(material.buildCount,2);
});
