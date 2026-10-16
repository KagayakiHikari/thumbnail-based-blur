/** Rate-limited refreshes. Missed frames are skipped; work never catches up in bursts. */
export class FrameSampler {
  constructor(sample, { fps = 30, requestFrame = callback => requestAnimationFrame(callback),
    cancelFrame = id => cancelAnimationFrame(id), visibility = globalThis.document, onError } = {}) {
    if (typeof sample !== 'function') throw new TypeError('sample must be a function');
    this.sample = sample; this.requestFrame = requestFrame; this.cancelFrame = cancelFrame;
    this.visibility = visibility; this.onError = onError; this.running = false; this.disposed = false;
    this.frame = null; this.last = null; this.setFPS(fps);
    this.tick = time => {
      this.frame = null;
      if (!this.running || this.visibility?.hidden) return;
      const interval = 1000 / this.fps;
      if (this.last === null || time - this.last >= interval - 0.01) {
        this.last = this.last === null ? time : time - ((time - this.last + 0.01) % interval);
        try { this.sample(time); } catch (error) {
          this.stop();
          if (this.onError) this.onError(error); else throw error;
          return;
        }
      }
      this.schedule();
    };
    this.visibilityChanged = () => {
      this.cancel(); this.last = null;
      if (this.running && !this.visibility?.hidden) this.schedule();
    };
    this.visibility?.addEventListener('visibilitychange', this.visibilityChanged);
  }
  setFPS(fps) {
    if (!Number.isFinite(fps) || fps < 1 || fps > 120) throw new RangeError('fps must be between 1 and 120');
    this.fps = fps; this.last = null;
  }
  schedule() {
    if (this.running && !this.visibility?.hidden && this.frame === null) this.frame = this.requestFrame(this.tick);
  }
  cancel() {
    if (this.frame !== null) this.cancelFrame(this.frame);
    this.frame = null;
  }
  start() {
    if (this.disposed) throw new Error('Sampler is disposed');
    if (this.running) return;
    this.running = true; this.last = null; this.schedule();
  }
  stop() { this.running = false; this.cancel(); this.last = null; }
  dispose() {
    this.stop(); this.disposed = true;
    this.visibility?.removeEventListener('visibilitychange', this.visibilityChanged);
  }
}
