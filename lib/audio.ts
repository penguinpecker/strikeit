// Tiny WebAudio juice — blips, win chime, lose thud. Lazily creates one AudioContext.

let ctx: AudioContext | null = null;
function ac(): AudioContext {
  return (ctx ||= new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
}

export function blip(freq: number, vol = 0.1) {
  try {
    const c = ac(),
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.16);
  } catch {
    /* audio blocked until first gesture */
  }
}

export function chime() {
  [660, 880, 1100].forEach((f, i) => setTimeout(() => blip(f, 0.12), i * 90));
}

export function thud() {
  try {
    const c = ac(),
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.4);
  } catch {
    /* noop */
  }
}

export function haptic(p: number | number[] = 15) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
}
