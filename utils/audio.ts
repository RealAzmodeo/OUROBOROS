
type SfxType = 
  | 'ui_hover' 
  | 'ui_select' 
  | 'pickup_good' 
  | 'pickup_bad' 
  | 'pickup_coin'
  | 'explosion'
  | 'damage'
  | 'powerup'
  | 'sequence_match'
  | 'portal_enter'
  | 'game_over'
  | 'wall_crash'
  | 'shield_deflect';

export type MusicTrack = 'menu' | 'game' | 'gameover' | 'evasion' | 'none';

// Note Frequencies
const NOTES: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00,
  'X': 0 // Rest
};

interface TrackData {
  tempo: number;
  steps: number;
  bass: string[];
  lead: string[];
  pad: string[]; // Chords
}

const TRACKS: Record<MusicTrack, TrackData> = {
  menu: {
    tempo: 100,
    steps: 16,
    bass: ['D2','X','X','D2', 'X','X','A2','X',  'G2','X','X','G2', 'X','X','F2','X'],
    lead: ['X','X','A3','X',  'X','X','D4','X',  'X','X','C4','X',  'A3','G3','F3','E3'],
    pad:  ['D3','D3','D3','D3', 'G3','G3','G3','G3', 'Bb3','Bb3','Bb3','Bb3', 'A3','A3','A3','A3']
  },
  game: {
    tempo: 125,
    steps: 16,
    bass: ['D2','D2','D3','D2', 'F2','F2','F3','F2', 'G2','G2','G3','G2', 'Bb2','Bb2','A2','A2'],
    lead: ['D4','X','F4','X',  'A4','X','G4','X',  'D4','X','C4','X',  'D4','E4','F4','E4'],
    pad:  ['D3','X','X','X',  'F3','X','X','X',  'G3','X','X','X',  'Bb3','X','A3','X']
  },
  evasion: {
    tempo: 145, // Faster
    steps: 16,
    bass: ['C2','C2','C2','C2', 'Eb2','Eb2','Eb2','Eb2', 'F2','F2','F2','F2', 'Bb1','Bb1','Bb1','Bb1'],
    lead: ['C5','X','Eb5','X', 'G5','X','C6','X', 'Bb5','X','G5','X', 'Eb5','X','C5','X'],
    pad:  ['C3','X','X','X', 'Eb3','X','X','X', 'F3','X','X','X', 'Bb2','X','X','X']
  },
  gameover: {
    tempo: 60,
    steps: 8,
    bass: ['D2','X','Db2','X', 'C2','X','B1','X'],
    lead: ['A3','X','Ab3','X', 'G3','X','Gb3','X'],
    pad:  ['X']
  },
  none: { tempo: 120, steps: 1, bass: [], lead: [], pad: [] }
};

class AudioController {
  private ctx: AudioContext | null = null;
  private sfxBuffers: Record<string, AudioBuffer> = {};
  
  // SFX
  private sfxVolume: number = 0.5;
  private sfxMuted: boolean = false;

  // Music
  private musicVolume: number = 0.3;
  private currentTrack: MusicTrack = 'none';
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private schedulerTimer: number | null = null;
  private isPlayingMusic: boolean = false;

  private initialized: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedSfxVol = localStorage.getItem('neon_ouroboros_sfx_volume');
      const savedMusicVol = localStorage.getItem('neon_ouroboros_music_volume');
      const savedSfxMute = localStorage.getItem('neon_ouroboros_sfx_mute');
      
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
      if (savedSfxMute !== null) this.sfxMuted = savedSfxMute === 'true';
    } catch (e) {
      console.warn("Audio settings load failed", e);
    }
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new AudioContextClass();
      this.initialized = true;
      this.preRenderSfx(); // Generate buffers
      if (this.currentTrack !== 'none') {
        this.startScheduler();
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  // --- BUFFER GENERATION ---
  private async preRenderSfx() {
      if (!this.ctx) return;
      const types: SfxType[] = [
          'ui_hover', 'ui_select', 'pickup_good', 'pickup_bad', 'pickup_coin',
          'explosion', 'damage', 'powerup', 'sequence_match', 'portal_enter',
          'game_over', 'wall_crash', 'shield_deflect'
      ];

      for (const type of types) {
          const buffer = await this.renderBufferForType(type);
          if (buffer) this.sfxBuffers[type] = buffer;
      }
  }

  private renderBufferForType(type: SfxType): Promise<AudioBuffer> {
      // Create an offline context. Duration varies by sound, mostly short.
      const duration = 2.0; 
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
      
      const t = 0;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      
      // Volume scaling fixed at 1.0 here, adjusted during playback
      const vol = 1.0; 

      switch (type) {
        case 'ui_hover':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
            gain.gain.setValueAtTime(0.05 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.05);
            osc.start(t);
            osc.stop(t + 0.05);
            break;
        case 'ui_select':
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.setValueAtTime(880, t + 0.05);
            gain.gain.setValueAtTime(0.1 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;
        case 'pickup_good':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, t);
            osc.frequency.linearRampToValueAtTime(1000, t + 0.1);
            gain.gain.setValueAtTime(0.2 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            // Harmonics
            const osc2 = offlineCtx.createOscillator();
            const gain2 = offlineCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(offlineCtx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1000, t);
            osc2.frequency.linearRampToValueAtTime(2000, t + 0.1);
            gain2.gain.setValueAtTime(0.05 * vol, t);
            gain2.gain.linearRampToValueAtTime(0, t + 0.2);
            osc2.start(t);
            osc2.stop(t + 0.2);
            break;
        case 'pickup_bad':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.3);
            gain.gain.setValueAtTime(0.2 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        case 'pickup_coin':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.setValueAtTime(1800, t + 0.05);
            gain.gain.setValueAtTime(0.15 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        case 'damage':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
            gain.gain.setValueAtTime(0.3 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;
        case 'shield_deflect':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.05);
            gain.gain.setValueAtTime(0.3 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            break;
        case 'wall_crash':
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.15);
            gain.gain.setValueAtTime(0.4 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
            // Noise
            const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.2, sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const noise = offlineCtx.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseGain = offlineCtx.createGain();
            noiseGain.gain.setValueAtTime(0.3 * vol, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            noise.connect(noiseGain);
            noiseGain.connect(offlineCtx.destination);
            noise.start(t);
            break;
        case 'explosion':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(1, t + 0.5);
            gain.gain.setValueAtTime(0.4 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
            break;
        case 'powerup':
            const notes = [440, 554, 659, 880];
            notes.forEach((freq, i) => {
                const o = offlineCtx.createOscillator();
                const g = offlineCtx.createGain();
                o.connect(g);
                g.connect(offlineCtx.destination);
                o.type = 'square';
                const start = t + (i * 0.05);
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.1 * vol, start);
                g.gain.linearRampToValueAtTime(0, start + 0.1);
                o.start(start);
                o.stop(start + 0.1);
            });
            break;
        case 'sequence_match':
            [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
                const o = offlineCtx.createOscillator();
                const g = offlineCtx.createGain();
                o.connect(g);
                g.connect(offlineCtx.destination);
                o.type = 'triangle';
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.05 * vol, t);
                g.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
                o.start(t);
                o.stop(t + 0.8);
            });
            break;
        case 'portal_enter':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(800, t + 1);
            const vib = offlineCtx.createOscillator();
            vib.frequency.value = 10;
            const vibGain = offlineCtx.createGain();
            vibGain.gain.value = 20;
            vib.connect(vibGain);
            vibGain.connect(osc.frequency);
            vib.start(t);
            vib.stop(t+1);
            gain.gain.setValueAtTime(0.2 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 1);
            osc.start(t);
            osc.stop(t + 1);
            break;
        case 'game_over':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
            gain.gain.setValueAtTime(0.3 * vol, t);
            gain.gain.linearRampToValueAtTime(0, t + 1.5);
            osc.start(t);
            osc.stop(t + 1.5);
            break;
      }
      return offlineCtx.startRendering();
  }

  // --- VOLUME CONTROLS ---

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('neon_ouroboros_sfx_volume', this.sfxVolume.toString());
    if (this.sfxVolume > 0 && this.sfxMuted) this.setSfxMute(false);
  }

  public getSfxVolume(): number { return this.sfxVolume; }

  public setSfxMute(isMuted: boolean) {
      this.sfxMuted = isMuted;
      localStorage.setItem('neon_ouroboros_sfx_mute', isMuted.toString());
  }

  public isSfxMuted(): boolean { return this.sfxMuted; }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('neon_ouroboros_music_volume', this.musicVolume.toString());
  }

  public getMusicVolume(): number { return this.musicVolume; }

  // --- MUSIC ENGINE ---

  public playMusic(track: MusicTrack) {
      if (this.currentTrack === track) return;
      this.currentTrack = track;

      if (track === 'none') {
          this.stopScheduler();
          return;
      }

      if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
      }

      if (!this.isPlayingMusic) {
          this.currentStep = 0;
          if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.1;
          this.startScheduler();
      }
  }

  private startScheduler() {
      if (this.schedulerTimer) clearInterval(this.schedulerTimer);
      this.isPlayingMusic = true;
      this.schedulerTimer = window.setInterval(() => this.schedule(), 25);
  }

  private stopScheduler() {
      if (this.schedulerTimer) clearInterval(this.schedulerTimer);
      this.isPlayingMusic = false;
      this.schedulerTimer = null;
  }

  private schedule() {
      if (!this.ctx || this.currentTrack === 'none') return;
      const lookahead = 0.1; 
      while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
          this.playStep(this.nextNoteTime);
          this.advanceStep();
      }
  }

  private advanceStep() {
      const data = TRACKS[this.currentTrack];
      const secondsPerBeat = 60.0 / data.tempo;
      this.nextNoteTime += 0.25 * secondsPerBeat;
      this.currentStep = (this.currentStep + 1) % data.steps;
  }

  private playStep(time: number) {
      if (!this.ctx || this.musicVolume <= 0) return;
      const data = TRACKS[this.currentTrack];
      
      if (data.bass[this.currentStep]) {
          const freq = NOTES[data.bass[this.currentStep]];
          if (freq > 0) this.playSynthNote(time, freq, 'bass');
      }

      if (data.lead[this.currentStep]) {
        const freq = NOTES[data.lead[this.currentStep]];
        if (freq > 0) this.playSynthNote(time, freq, 'lead');
      }

      if (data.pad[this.currentStep]) {
        const freq = NOTES[data.pad[this.currentStep]];
        if (freq > 0) this.playSynthNote(time, freq, 'pad');
      }

      if (this.currentTrack === 'game' && this.currentStep % 4 === 0) {
           this.playDrum(time, this.currentStep % 8 === 0 ? 'kick' : 'snare');
      }
      if (this.currentTrack === 'evasion' && this.currentStep % 2 === 0) {
          this.playDrum(time, this.currentStep % 4 === 0 ? 'kick' : 'snare');
      }
  }

  private playSynthNote(time: number, freq: number, type: 'bass' | 'lead' | 'pad') {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      const vol = this.musicVolume;

      if (type === 'bass') {
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, time);
          filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
          gain.gain.setValueAtTime(0.4 * vol, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
          osc.start(time);
          osc.stop(time + 0.2);
      } else if (type === 'lead') {
          osc.type = 'square';
          osc.frequency.value = freq;
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq * 2, time);
          gain.gain.setValueAtTime(0.15 * vol, time);
          gain.gain.linearRampToValueAtTime(0, time + 0.15);
          osc.start(time);
          osc.stop(time + 0.15);
      } else if (type === 'pad') {
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.05 * vol, time);
          gain.gain.linearRampToValueAtTime(0.05 * vol, time + 0.2); 
          gain.gain.linearRampToValueAtTime(0, time + 0.4);
          osc.start(time);
          osc.stop(time + 0.4);
      }
  }

  private playDrum(time: number, type: 'kick' | 'snare') {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      const vol = this.musicVolume;

      if (type === 'kick') {
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
          gain.gain.setValueAtTime(0.5 * vol, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
          osc.start(time);
          osc.stop(time + 0.5);
      } else {
          const bufferSize = this.ctx.sampleRate * 0.1;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.value = 1000;
          noise.connect(noiseFilter);
          noiseFilter.connect(gain);
          gain.gain.setValueAtTime(0.3 * vol, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          noise.start(time);
      }
  }

  // --- SFX ---

  public play(type: SfxType) {
    if (!this.ctx || this.sfxMuted || this.sfxVolume <= 0) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const buffer = this.sfxBuffers[type];
    if (buffer) {
        // Use cached buffer
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = this.sfxVolume;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    } else {
        // Fallback or not loaded yet
        // console.warn(`SFX ${type} not loaded or generated yet.`);
    }
  }
}

export const audio = new AudioController();
