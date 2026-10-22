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
    let angle = 0;
    let previousTime: number | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        ctx = new AudioContext();
        await ctx.resume();
        if (cancelled) return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        setError(null);
        target.current?.setAttribute("data-mic-active", "true");
        const tick = (time: number) => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += ((v - 128) / 128) ** 2;
          const rms = Math.min(1, Math.sqrt(sum / buf.length) * 6);
          smooth = smooth * 0.75 + rms * 0.25;
          target.current?.style.setProperty("--level", smooth.toFixed(3));
          // Integrate speed instead of changing animation duration: no jumps when speech changes.
          const elapsed = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.1);
          previousTime = time;
          angle = (angle + elapsed * (24 + smooth * 300)) % 360;
          target.current?.style.setProperty("--mic-angle", `${angle.toFixed(2)}deg`);
          const now = smooth > 0.12;
          if (now !== last) { last = now; setTalking(now); }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
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
      target.current?.style.removeProperty("--mic-angle");
      target.current?.removeAttribute("data-mic-active");
      setTalking(false);
    };
  }, [enabled, target]);

  return { talking, error };
}
