// audio.js — Sizzle Rush sound kit: every effect is synthesised with the
// Web Audio API, so the game ships no audio files and stays fully offline.
// Sounds start only after the first pointer or key interaction (autoplay rules).

export class SoundKit {
  constructor() {
    this.ctx = null;
    this.sizzleNode = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null, delay = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, gain = 0.1, freq = 1800, delay = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(this.ctx.destination);
    src.start(t0);
  }

  pickup() { this.tone(520, 0.07, 'triangle', 0.1, 760); }
  place() { this.tone(300, 0.06, 'triangle', 0.1, 210); }
  chop() { this.noise(0.05, 0.16, 900); this.tone(140, 0.05, 'square', 0.05, 90); }
  ding() { this.tone(880, 0.12, 'sine', 0.12); this.tone(1318, 0.2, 'sine', 0.1, null, 0.09); }
  coin() { this.tone(988, 0.08, 'square', 0.06); this.tone(1319, 0.16, 'square', 0.06, null, 0.07); }
  buzz() { this.tone(160, 0.22, 'sawtooth', 0.1, 110); }
  pop() { this.tone(660, 0.05, 'sine', 0.1, 990); }
  burn() { this.noise(0.3, 0.12, 500); this.tone(220, 0.3, 'sawtooth', 0.07, 70); }

  setSizzle(on) {
    if (!this.ctx) return;
    if (on && !this.sizzleNode) {
      const len = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.015;
      src.connect(filter).connect(amp).connect(this.ctx.destination);
      src.start();
      this.sizzleNode = { src, amp };
    } else if (!on && this.sizzleNode) {
      try { this.sizzleNode.src.stop(); } catch { /* already stopped */ }
      this.sizzleNode = null;
    }
  }
}
