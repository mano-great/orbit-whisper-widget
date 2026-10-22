import { useEffect, useRef } from "react";

/** One motion director: coordinated poses, then damped joints with secondary follow-through. */
export function usePuppetMotion(speaking: boolean, crying: boolean, hurt: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  const state = useRef({ speaking, crying, hurt });
  state.current = { speaking, crying, hurt };
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const names = ["body", "neck", "head", "ears", "arm-left", "arm-right"];
    const elements = names.map((name) => root.querySelector<HTMLElement>(`.puppet-${name}`));
    const elbows = Array.from(root.querySelectorAll<HTMLElement>(".puppet-elbow"));
    const hands = Array.from(root.querySelectorAll<HTMLElement>(".puppet-hand"));
    const legs = Array.from(root.querySelectorAll<HTMLElement>(".puppet-leg"));
    const knees = Array.from(root.querySelectorAll<HTMLElement>(".puppet-knee"));
    const feet = Array.from(root.querySelectorAll<HTMLElement>(".puppet-foot"));
    const eye = Array.from(root.querySelectorAll<HTMLElement>(".mascot-eye"));
    const mouth = root.querySelector<HTMLElement>(".mascot-mouth");
    const face = root.querySelector<HTMLElement>(".mascot-face");
    const brows = Array.from(root.querySelectorAll<HTMLElement>(".mascot-brow"));
    const button = root.closest<HTMLElement>(".mascot-button");
    const flight = root.closest<HTMLElement>(".mascot-flight");
    let frame = 0, previous = performance.now(), start = previous;
    let speechStart = previous, wasSpeaking = false;
    const current = new Map<string, number>();
    const smooth = (key: string, target: number, dt: number, speed = 14) => {
      const value = (current.get(key) ?? 0) + (target - (current.get(key) ?? 0)) * (1 - Math.exp(-speed * dt));
      current.set(key, value); return value;
    };
    const turn = (el: HTMLElement | null | undefined, key: string, target: number, dt: number, speed = 14) => {
      if (el) el.style.transform = `rotate(${smooth(key, target, dt, speed)}deg)`;
    };
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      const t = (now - start) / 1000;
      const s = state.current;
      if (s.speaking && !wasSpeaking) speechStart = now;
      wasSpeaking = s.speaking;
      const talk = (now - speechStart) / 1000;
      const hover = button?.matches(":hover") ?? false;
      const cycle = t % 14;
      const stretch = !s.speaking && !s.crying && cycle > 8 && cycle < 10 ? Math.sin((cycle - 8) / 2 * Math.PI) : 0;
      const peek = !s.speaking && !s.crying && cycle > 4 && cycle < 6 ? Math.sin((cycle - 4) / 2 * Math.PI) : 0;
      const breath = Math.sin(t * 2.3);
      const wave = s.speaking || hover;
      const hurtPulse = s.hurt && t < .7 ? Math.sin(t * 22) * Math.exp(-t * 5) : 0;
      const intro = Math.max(0, 1 - t / .8);
      const phase = flight?.dataset["phase"];
      const impact = phase === "impact";
      const running = Boolean(flight) && !impact;
      const sob = s.crying ? Math.sin(t * 15) : 0;
      const sway = s.crying ? sob * 2 : Math.sin(t * 1.6) * 4;
      const bounce = s.speaking ? -Math.abs(Math.sin(talk * 4.7)) * 3 : hover ? -Math.abs(Math.sin(t * 4)) * 2 : breath * .8;
      if (elements[0]) elements[0].style.transform = `translateY(${smooth("bounce", bounce + intro * 12 + (running ? -Math.abs(Math.sin(t * 14)) * 4 : 0), dt)}%) rotate(${smooth("sway", sway + hurtPulse * 12, dt)}deg) scale(${1 - intro * .12},${1 + stretch * .08 - Math.abs(sob) * .025})`;
      const gazeX = Number.parseFloat(button?.style.getPropertyValue("--head-x") ?? "0") || 0;
      const gazeY = Number.parseFloat(button?.style.getPropertyValue("--head-y") ?? "0") || 0;
      if (elements[1]) elements[1].style.transform = `rotate(${smooth("gaze", gazeX, dt, 10)}deg) translateY(${smooth("gaze-y", gazeY * .15, dt)}%)`;
      turn(elements[2], "head", -sway * .7 + peek * 14 + (s.speaking ? Math.sin(talk * 5) * 6 : 0) + hurtPulse * -38 + sob * 6, dt);
      turn(elements[3], "ears", -sway * 1.2 + stretch * -16 + hurtPulse * 35 + sob * 9, dt, 7);
      const left = impact ? 100 : s.crying ? 135 + Math.sin(t * 5) * 12 : stretch * 145 + (s.speaking ? 22 + Math.sin(talk * 3) * 15 : 8 - sway * 2) + hurtPulse * 50;
      const right = impact ? -100 : s.crying ? -25 + sob * 8 : wave ? -120 + Math.sin(t * 8) * 17 : -8 - sway * 2 - stretch * 145 - hurtPulse * 50;
      turn(elements[4], "arm-l", left, dt, 12); turn(elements[5], "arm-r", right, dt, 12);
      elbows.forEach((el, i) => turn(el, `elbow${i}`, impact ? 0 : s.crying && i === 0 ? 72 + Math.sin(t * 5) * 12 : wave && i === 1 ? -25 + Math.sin(t * 8 - .5) * 20 : (i ? -1 : 1) * (8 + stretch * 28), dt, 10));
      hands.forEach((el, i) => turn(el, `hand${i}`, wave && i === 1 ? Math.sin(t * 8 - 1) * 24 : sob * 10 + breath * 5, dt, 9));
      legs.forEach((el, i) => turn(el, `leg${i}`, running ? Math.sin(t * 14 + i * Math.PI) * 24 : (i ? -1 : 1) * (4 + stretch * 7) - sway * .6, dt));
      knees.forEach((el, i) => turn(el, `knee${i}`, running ? Math.max(0, Math.sin(t * 14 + i * Math.PI)) * -40 : Math.max(0, -breath) * 6, dt));
      feet.forEach((el, i) => turn(el, `foot${i}`, running ? Math.sin(t * 14 + i * Math.PI - .7) * 20 : sway * .5, dt, 10));
      const blink = t % 4.6;
      const blinkSize = blink > 4.35 ? Math.max(.08, Math.abs(blink - 4.475) / .125) : 1;
      eye.forEach((el) => { el.style.scale = `1 ${s.crying ? 1 : blinkSize}`; });
      if (face) face.style.transform = `translate(${smooth("face-x", gazeX * .3, dt)}%,${smooth("face-y", gazeY * -.2, dt)}%)`;
      if (mouth) {
        const syllable = s.speaking ? .4 + Math.abs(Math.sin(talk * 13) * Math.cos(talk * 5.4)) * 1.3 : s.crying ? 1 + sob * .15 : 1;
        mouth.style.transform = `scale(${s.speaking ? .8 + syllable * .2 : 1},${syllable})`;
      }
      brows.forEach((el, i) => { el.style.transform = `translateY(${s.crying ? -10 : wave ? -25 : hurtPulse * -50}%) rotate(${s.crying ? (i ? 20 : -20) : peek * (i ? -15 : 15)}deg)`; });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return ref;
}