export type AudioCue = 'select' | 'move' | 'attack' | 'guard' | 'turn' | 'reward' | 'victory' | 'defeat';

let audioContext: AudioContext | null = null;

const cueFrequency: Record<AudioCue, number> = {
  select: 240,
  move: 180,
  attack: 96,
  guard: 150,
  turn: 120,
  reward: 360,
  victory: 420,
  defeat: 80,
};

export const playCue = (cue: AudioCue, muted: boolean): void => {
  if (muted || typeof window === 'undefined') {
    return;
  }

  try {
    audioContext ??= new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = cue === 'attack' || cue === 'defeat' ? 'sawtooth' : 'triangle';
    oscillator.frequency.value = cueFrequency[cue];
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  } catch {
    // Browsers may block audio until a user gesture; gameplay must continue silently.
  }
};
