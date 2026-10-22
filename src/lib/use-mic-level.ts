import { useEffect, useState, type RefObject } from "react";

/** Streams microphone loudness (0–1) into the CSS var --level on `target` while enabled. */
export function useMicLevel(enabled: boolean, target: RefObject<HTMLElement | null>) {
  const [talking, setTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let cancelled = false;
    let smooth = 0;
    let last = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        setError(null);
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += ((v - 128) / 128) ** 2;
          const rms = Math.min(1, Math.sqrt(sum / buf.length) * 6);
          smooth = smooth * 0.75 + rms * 0.25;
          target.current?.style.setProperty("--level", smooth.toFixed(3));
          const now = smooth > 0.12;
          if (now !== last) { last = now; setTalking(now); }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError("Microphone access was blocked");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
      target.current?.style.setProperty("--level", "0");
      setTalking(false);
    };
  }, [enabled, target]);

  return { talking, error };
}
