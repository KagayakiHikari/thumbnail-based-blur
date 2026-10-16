import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameSampler } from '../src/frame-sampler.js';
function harness(fps = 30) {
  let id = 0; const pending = new Map(), samples = [], listeners = new Set();
  const visibility = { hidden: false, addEventListener(_, fn) { listeners.add(fn); }, removeEventListener(_, fn) { listeners.delete(fn); } };
  const sampler = new FrameSampler(time => samples.push(time), { fps, visibility,
    requestFrame(fn) { pending.set(++id, fn); return id; }, cancelFrame(key) { pending.delete(key); } });
  return { sampler, samples, pending, listeners, visibility,
    frame(time) { const batch = [...pending.values()]; pending.clear(); batch.forEach(fn => fn(time)); },
    hidden(value) { visibility.hidden = value; listeners.forEach(fn => fn()); } };
}
test('30 FPS sampler on a 60 Hz display skips alternate frames without duplicate loops', () => {
  const h = harness(); h.sampler.start(); h.sampler.start();
  for (let n = 0; n <= 60; n++) h.frame(n * 1000 / 60);
  assert.equal(h.samples.length, 31); assert.equal(h.pending.size, 1);
  h.sampler.stop(); h.frame(1100); assert.equal(h.samples.length, 31); assert.equal(h.pending.size, 0);
});
test('slow frames do not trigger catch-up bursts and FPS changes take effect', () => {
  const h = harness(); h.sampler.start(); h.frame(0); h.frame(5000);
  assert.deepEqual(h.samples, [0, 5000]);
  h.sampler.setFPS(10); h.frame(5010); h.frame(5060); h.frame(5110);
  assert.deepEqual(h.samples, [0, 5000, 5010, 5110]);
});
test('hidden pages cancel work, resume immediately, and disposal removes the listener', () => {
  const h = harness(); h.sampler.start(); h.frame(0); h.hidden(true);
  assert.equal(h.pending.size, 0); h.frame(1000); assert.equal(h.samples.length, 1);
  h.hidden(false); h.frame(2000); assert.deepEqual(h.samples, [0, 2000]);
  h.sampler.dispose(); assert.equal(h.pending.size, 0); assert.equal(h.listeners.size, 0);
  assert.throws(() => h.sampler.start(), /disposed/);
});
test('manual stop while hidden remains stopped on return; invalid FPS is rejected', () => {
  const h = harness(); h.sampler.start(); h.hidden(true); h.sampler.stop(); h.hidden(false);
  assert.equal(h.pending.size, 0);
  for (const fps of [0, -1, NaN, Infinity, 121, '30']) assert.throws(() => h.sampler.setFPS(fps), RangeError);
});
test('sampling failure stops the loop and reports the error', () => {
  let cb, received; const error = new Error('Read failed');
  const sampler = new FrameSampler(() => { throw error; }, { visibility: null, requestFrame(fn) { cb = fn; return 1; }, cancelFrame() {}, onError(err) { received = err; } });
  sampler.start(); cb(0); assert.equal(sampler.running, false); assert.equal(received, error);
});
