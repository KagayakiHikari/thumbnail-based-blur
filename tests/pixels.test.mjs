import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boxBlur, coverRect, tintPixels } from '../src/pixels.js';

function reference(input, width, height, radius, passes) {
  let data = new Uint8ClampedArray(input);
  for (let pass = 0; pass < passes; pass++) for (const horizontal of [true, false]) {
    const next = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let delta = -radius; delta <= radius; delta++) {
          const sx = Math.max(0, Math.min(width - 1, x + (horizontal ? delta : 0)));
          const sy = Math.max(0, Math.min(height - 1, y + (horizontal ? 0 : delta)));
          sum += data[(sy * width + sx) * 4 + c];
        }
        next[(y * width + x) * 4 + c] = sum / (radius * 2 + 1);
      }
      next[(y * width + x) * 4 + 3] = 255;
    }
    data = next;
  }
  return data;
}
test('sliding windows match independent naive reference including oversize radii', () => {
  for (const [w,h] of [[1,1],[1,5],[5,1],[3,7],[8,4]]) for (const r of [0,1,2,9]) {
    const input = Uint8ClampedArray.from({ length:w*h*4 }, (_,i) => (i*73+19)%256), original = input.slice();
    assert.deepEqual(boxBlur(input,w,h,r),reference(input,w,h,r,3));
    assert.deepEqual(input, original);
  }
});
test('uniform opaque color remains uniform through blur', () => {
  const input = new Uint8ClampedArray(16*4); for (let i=0;i<input.length;i+=4) input.set([70,120,200,255],i);
  assert.deepEqual(boxBlur(input,4,4,5),input);
});
test('cover maps landscape to portrait and supports edge positioning', () => {
  assert.deepEqual(coverRect(1600,1000,400,800),{x:-440,y:0,width:1280,height:800});
  assert.equal(coverRect(1600,1000,400,800,[0,0]).x,0);
  const rect=coverRect(1000,1600,800,400); assert.equal(rect.y,-440);
});
test('invalid input fails explicitly', () => {
  assert.throws(()=>coverRect(0,1,2,2),RangeError);
  assert.throws(()=>boxBlur(new Uint8ClampedArray(4),2,2,1),RangeError);
  assert.throws(()=>boxBlur(new Uint8ClampedArray(4),1,1,-1),RangeError);
});
test('tint endpoint and identity preserve expected color ordering', () => {
  const input=new Uint8ClampedArray([10,100,200,255]);
  assert.deepEqual(tintPixels(input.slice(),{saturation:1,brightness:1,tint:[0,0,0,0],boost:1}),input);
  assert.deepEqual(tintPixels(input.slice(),{tint:[248,247,255,1],boost:1}),new Uint8ClampedArray([248,247,255,255]));
});
