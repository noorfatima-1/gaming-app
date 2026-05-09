let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playChord(
  freqs: number[],
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.1
) {
  freqs.forEach((f) => playTone(f, duration, type, volume));
}

export const sounds = {
  // Player guesses correctly — happy ascending chime
  correctGuess: () => {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 100);
    setTimeout(() => playTone(784, 0.3, "sine", 0.12), 200);
  },

  // Timer tick — short click (last 5 seconds)
  tick: () => {
    playTone(800, 0.05, "square", 0.06);
  },

  // New turn starts — notification ding
  turnStart: () => {
    playTone(880, 0.1, "sine", 0.1);
    setTimeout(() => playTone(1100, 0.2, "sine", 0.1), 120);
  },

  // Word chosen — confirm sound
  wordChosen: () => {
    playTone(600, 0.1, "sine", 0.1);
    setTimeout(() => playTone(800, 0.15, "sine", 0.1), 80);
  },

  // Turn ends — descending tone
  turnEnd: () => {
    playTone(600, 0.15, "sine", 0.1);
    setTimeout(() => playTone(400, 0.3, "sine", 0.1), 150);
  },

  // Game over — fanfare
  gameOver: () => {
    playChord([523, 659, 784], 0.3, "sine", 0.08);
    setTimeout(() => playChord([587, 740, 880], 0.3, "sine", 0.08), 300);
    setTimeout(() => playChord([659, 831, 1047], 0.5, "sine", 0.08), 600);
  },

  // Player joins — soft pop
  playerJoin: () => {
    playTone(500, 0.08, "sine", 0.08);
    setTimeout(() => playTone(700, 0.12, "sine", 0.08), 60);
  },

  // Player leaves — soft drop
  playerLeave: () => {
    playTone(500, 0.08, "sine", 0.06);
    setTimeout(() => playTone(350, 0.12, "sine", 0.06), 60);
  },

  // Your turn to draw — exciting
  yourTurn: () => {
    playTone(523, 0.1, "triangle", 0.12);
    setTimeout(() => playTone(659, 0.1, "triangle", 0.12), 100);
    setTimeout(() => playTone(784, 0.1, "triangle", 0.12), 200);
    setTimeout(() => playTone(1047, 0.3, "triangle", 0.12), 300);
  },

  // Error — low buzz
  error: () => {
    playTone(200, 0.2, "sawtooth", 0.06);
  },
};
