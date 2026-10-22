import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MascotPuppet } from "@/components/mascot-puppet";
import { GREETING, nextPoke } from "@/lib/mascot-reactions";

export function NotchMascot({ onGreeting, aiSpeaking = false }: { onGreeting: (text: string | null) => void; aiSpeaking?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);
  const count = useRef(0);
  const [recoil, setRecoil] = useState(0);
  const [crying, setCrying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [flight, setFlight] = useState<{ x: number; y: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const later = (fn: () => void, delay: number) => { timers.current.push(setTimeout(fn, delay)); };

  useEffect(() => {
    const look = (event: PointerEvent) => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.x - rect.width / 2) / 240));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.y - rect.height / 2) / 240));
      buttonRef.current?.style.setProperty("--gaze-x", `${x * 22}%`);
      buttonRef.current?.style.setProperty("--gaze-y", `${y * 18}%`);
      buttonRef.current?.style.setProperty("--head-x", `${x * 9}deg`);
      buttonRef.current?.style.setProperty("--head-y", `${y * -7}deg`);
    };
    // Browsers permit audible speech after a user gesture, not reliably on page load.
    const greet = () => {
      setSpeaking(true);
      onGreeting("Ready");
      let finished = false;
      const finish = () => { if (finished) return; finished = true; setSpeaking(false); onGreeting(null); };
      if ("speechSynthesis" in window) {
        const speech = new SpeechSynthesisUtterance(GREETING);
        utterance.current = speech;
        speech.rate = 0.9;
        speech.onboundary = (event) => {
          if (event.name === "word") {
            const end = GREETING.indexOf(" ", event.charIndex);
            onGreeting(GREETING.slice(0, end < 0 ? GREETING.length : end));
          }
        };
        speech.onend = finish;
        // Keep the visual greeting when the browser has no available voice.
        speech.onerror = () => {};
        window.speechSynthesis.speak(speech);
      }
      // Boundary events aren't supported by every installed system voice.
      later(() => { if (!finished) onGreeting("Ready to"); }, 450);
      later(() => { if (!finished) onGreeting("Ready to dive"); }, 800);
      later(() => { if (!finished) onGreeting(GREETING); }, 1100);
      later(finish, 2400);
    };
    window.addEventListener("pointermove", look);
    window.addEventListener("pointerdown", greet, { once: true });
    return () => {
      window.removeEventListener("pointermove", look);
      window.removeEventListener("pointerdown", greet);
      timers.current.forEach(clearTimeout);
      if (utterance.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [onGreeting]);

  useEffect(() => {
    const element = flightRef.current;
    if (!flight || !element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dx = window.innerWidth / 2 - flight.x - 24;
    const dy = Math.min(window.innerHeight * 0.4, 320) - flight.y;
    const scale = Math.min(8, (window.innerWidth - 32) / 48, window.innerHeight / 90);
    const motion = element.animate(reduced ? [
      { opacity: 0 }, { opacity: 1 }, { opacity: 0 },
    ] : [
      { transform: "translate(0, 0) scale(1)", offset: 0 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.3)`, offset: 0.2 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale * 1.12}, ${scale * 0.8})`, offset: 0.54 },
      { transform: `translate(${dx}px, ${Math.min(dy + 160, window.innerHeight - flight.y - 90)}px) rotate(24deg) scale(${scale * 0.55})`, offset: 0.72 },
      { transform: "translate(0, 0) rotate(0) scale(1)", offset: 1 },
    ], { duration: reduced ? 1000 : 4300, easing: "ease-in-out", fill: "forwards" });
    motion.onfinish = () => {
      setFlight(null);
      later(() => { setCrying(false); count.current = 0; }, 2200);
    };
    let frame = 0;
    const pose = () => {
      const progress = Number(motion.currentTime ?? 0) / (reduced ? 1000 : 4300);
      element.dataset["phase"] = progress < .5 ? "approach" : progress < .59 ? "impact" : progress < .75 ? "fall" : "return";
      if (motion.playState === "running") frame = requestAnimationFrame(pose);
    };
    frame = requestAnimationFrame(pose);
    return () => { cancelAnimationFrame(frame); motion.cancel(); };
  }, [flight]);

  const poke = () => {
    if (crying) return;
    const next = nextPoke(count.current);
    count.current = next.clicks;
    setSpeaking(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (next.cries) {
      setCrying(true);
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setFlight({ x: rect.x - 4, y: rect.y - 4 });
    } else setRecoil((value) => value + 1);
  };

  return <>
    <Button ref={buttonRef} variant="ghost" size="icon" className="mascot-button" aria-label="Poke character" title="Poke character" onClick={(event) => { event.stopPropagation(); poke(); }} data-flying={Boolean(flight)}>
      <span key={recoil} className={recoil > 0 ? "mascot-recoil" : "mascot-rest"}>
        <MascotPuppet crying={crying} speaking={speaking || aiSpeaking} />
      </span>
    </Button>
    {flight && createPortal(<div ref={flightRef} className="mascot-flight" role="status" aria-label="Character crying, bumping the screen, and returning" style={{ left: flight.x, top: flight.y }}><MascotPuppet crying speaking={false} /></div>, document.body)}
  </>;
}