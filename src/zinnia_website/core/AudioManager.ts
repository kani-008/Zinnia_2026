/**
 * Procedural Web Audio Synthesizer for 2045 AI Symposium / Lusion Experience
 * Zero external audio assets needed — 100% synthesized in real time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!muted) {
      this.startAmbientDrone();
    } else {
      this.stopAmbientDrone();
    }
  }

  private startAmbientDrone() {
    if (!this.ctx || this.isMuted) return;

    try {
      if (this.droneGain) {
        this.droneGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.5);
        return;
      }

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.droneGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 2);
      this.droneGain.connect(this.ctx.destination);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.droneFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.droneFilter.connect(this.droneGain);

      // Deep synthetic machine hum
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);
      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc1.start();

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sawtooth';
      this.droneOsc2.frequency.setValueAtTime(84.5, this.ctx.currentTime);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      this.droneOsc2.connect(osc2Gain);
      osc2Gain.connect(this.droneFilter);
      this.droneOsc2.start();

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(50, this.ctx.currentTime);
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);
      this.lfo.start();
    } catch (e) {
      console.warn('Audio drone start failed:', e);
    }
  }

  private stopAmbientDrone() {
    if (!this.ctx || !this.droneGain) return;
    try {
      this.droneGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime);
      this.droneGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  }

  // TVA Temporal Monitor blip / branch tick
  public playTimelineTick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) { }
  }

  // Temporal Glitch & Timeline Shatter
  public playGlitchShatter() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Noise buffer glitch burst
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(300, now + 0.35);
      filter.Q.setValueAtTime(8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // Deep sub boom
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.6);
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.7);
    } catch (e) { }
  }

  // Holographic Data Marker hover
  public playMarkerHover() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) { }
  }

  // Camera chamber transition whoosh
  public playChamberTransition(speed: number = 1) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(800, now + 0.2);
      filter.frequency.linearRampToValueAtTime(150, now + 0.4);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);

      gain.gain.setValueAtTime(0.02 * speed, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) { }
  }

  // Machine Full Unlock Chime
  public playMachineUnlock() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [261.63, 329.63, 392.0, 523.25, 659.25].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.75);
      });
    } catch (e) { }
  }
  // Node engage / selection click sound
  public playNodeEngage() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(1440, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) { }
  }
}

export const audioManager = new SoundEngine();
