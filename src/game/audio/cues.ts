export type AudioCue =
  | 'select'
  | 'menuConfirm'
  | 'move'
  | 'attack'
  | 'hit'
  | 'guard'
  | 'turnStart'
  | 'dawnWarning'
  | 'reward'
  | 'victory'
  | 'defeat';

let audioContext: AudioContext | null = null;

interface CueVoice {
  frequency: number;
  delay: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const cueVoices: Record<AudioCue, CueVoice[]> = {
  select: [{ frequency: 260, delay: 0, duration: 0.08, type: 'triangle', gain: 0.032 }],
  menuConfirm: [
    { frequency: 220, delay: 0, duration: 0.08, type: 'triangle', gain: 0.03 },
    { frequency: 330, delay: 0.055, duration: 0.12, type: 'sine', gain: 0.034 },
  ],
  move: [
    { frequency: 164, delay: 0, duration: 0.09, type: 'triangle', gain: 0.026 },
    { frequency: 220, delay: 0.055, duration: 0.09, type: 'triangle', gain: 0.024 },
    { frequency: 246, delay: 0.11, duration: 0.09, type: 'triangle', gain: 0.022 },
  ],
  attack: [
    { frequency: 132, delay: 0, duration: 0.08, type: 'sawtooth', gain: 0.038 },
    { frequency: 88, delay: 0.045, duration: 0.11, type: 'square', gain: 0.026 },
  ],
  hit: [{ frequency: 74, delay: 0, duration: 0.12, type: 'sawtooth', gain: 0.04 }],
  guard: [
    { frequency: 146, delay: 0, duration: 0.11, type: 'triangle', gain: 0.03 },
    { frequency: 196, delay: 0.035, duration: 0.13, type: 'sine', gain: 0.026 },
  ],
  turnStart: [
    { frequency: 116, delay: 0, duration: 0.1, type: 'triangle', gain: 0.024 },
    { frequency: 174, delay: 0.075, duration: 0.12, type: 'triangle', gain: 0.026 },
  ],
  dawnWarning: [
    { frequency: 98, delay: 0, duration: 0.16, type: 'sawtooth', gain: 0.036 },
    { frequency: 147, delay: 0.09, duration: 0.18, type: 'sawtooth', gain: 0.032 },
  ],
  reward: [
    { frequency: 294, delay: 0, duration: 0.11, type: 'sine', gain: 0.03 },
    { frequency: 392, delay: 0.07, duration: 0.15, type: 'triangle', gain: 0.034 },
    { frequency: 523, delay: 0.14, duration: 0.18, type: 'sine', gain: 0.026 },
  ],
  victory: [
    { frequency: 262, delay: 0, duration: 0.16, type: 'triangle', gain: 0.032 },
    { frequency: 392, delay: 0.1, duration: 0.2, type: 'sine', gain: 0.036 },
    { frequency: 523, delay: 0.2, duration: 0.24, type: 'sine', gain: 0.028 },
  ],
  defeat: [
    { frequency: 110, delay: 0, duration: 0.18, type: 'sawtooth', gain: 0.038 },
    { frequency: 82, delay: 0.12, duration: 0.24, type: 'sawtooth', gain: 0.032 },
  ],
};

export const audioCueCatalog = Object.keys(cueVoices) as AudioCue[];

export const playCue = (cue: AudioCue, muted: boolean): void => {
  if (muted || typeof window === 'undefined') {
    return;
  }

  try {
    audioContext ??= new window.AudioContext();
    void audioContext.resume();

    for (const voice of cueVoices[cue]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + voice.delay;
      const end = start + voice.duration;

      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, voice.frequency * 0.86), end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(voice.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    }
  } catch {
    // Browsers may block audio until a user gesture; gameplay must continue silently.
  }
};
