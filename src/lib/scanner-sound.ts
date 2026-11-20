// Synthesizes a realistic POS laser barcode scanner "Beep!" using the Web Audio API
// No external audio files required.

export function playScannerBeep(type: "success" | "error" = "success") {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Crisp supermarket scanner beep (2400Hz, 90ms)
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else {
      // Error double low tone (320Hz)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // Ignore audio context restrictions if user hasn't interacted yet
  }
}
