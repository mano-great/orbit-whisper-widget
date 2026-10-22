import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AudioLines, ChevronUp, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeTextStream, subscribeVoiceState, type VoiceState } from "@/lib/island-bridge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Island — Desktop Assistant Widget" },
      { name: "description", content: "A translucent Dynamic Island style desktop widget with a live chat stream." },
      { property: "og:title", content: "Island — Desktop Assistant Widget" },
      { property: "og:description", content: "A translucent Dynamic Island style desktop widget with a live chat stream." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap" },
    ],
  }),
  component: Index,
});

type Msg = { id: number; role: "user" | "ai"; text: string };

const seed: Msg[] = [
  { id: 1, role: "user", text: "What's on my calendar today?" },
  { id: 2, role: "ai", text: "Two things: design review at 3 PM and a call with Priya at 5:30." },
  { id: 3, role: "user", text: "Remind me 10 minutes before each." },
  { id: 4, role: "ai", text: "Done. I'll nudge you at 2:50 and 5:20." },
];

const stateLabel: Record<VoiceState, string> = {
  idle: "Ready To Dive Into It?",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking",
};

function Avatar({ state }: { state: VoiceState }) {
  return (
    <div className="voice-avatar" data-state={state} aria-hidden="true">
      <span className="voice-aura" />
      <span className="voice-core" />
    </div>
  );
}

function Index() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [voiceMode, setVoiceMode] = useState(false);
  const [previewVoice, setPreviewVoice] = useState<VoiceState | null>(null);
  const activeVoice = previewVoice ?? voice;
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const streaming = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const offV = subscribeVoiceState((state) => {
      setVoice(state);
      setPreviewVoice(null);
    });
    const offT = subscribeTextStream(
      (t) =>
        setMsgs((m) => {
          if (streaming.current == null) {
            const id = Date.now();
            streaming.current = id;
            return [...m, { id, role: "ai", text: t }];
          }
          return m.map((x) => (x.id === streaming.current ? { ...x, text: x.text + t } : x));
        }),
      () => { streaming.current = null; },
    );
    return () => { offV(); offT(); };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <main className="flex min-h-screen justify-center px-3 pt-6">
      <div
        onClick={() => !open && setOpen(true)}
        className="island overflow-hidden text-foreground"
        style={{
          width: open ? 380 : 190,
          maxWidth: "100%",
          height: open ? 460 : 40,
          borderRadius: open ? 32 : 999,
          transition: `width .55s ${spring}, height .6s ${spring}, border-radius .5s ${spring}`,
          cursor: open ? "default" : "pointer",
        }}
      >
        <div className="flex h-10 items-center gap-3 px-3">
          <Avatar state={activeVoice} />
          <span className="flex-1 truncate text-xs font-medium text-muted-foreground">{stateLabel[activeVoice]}</span>
          {open && (
            <Button variant="ghost" size="icon"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="h-7 w-7 rounded-full text-muted-foreground"
              aria-label="Collapse"
              title="Collapse"
            >
              <ChevronUp />
            </Button>
          )}
        </div>

        <div
          className="flex h-[calc(100%-2.5rem)] flex-col"
          inert={!open}
          style={{ opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-12px)", transition: "opacity .35s ease .15s, transform .5s ease .1s" }}
        >
          {voiceMode ? (
            <div className="voice-stage flex min-h-0 flex-1 flex-col items-center justify-center gap-5" data-state={activeVoice}>
              <div className="voice-visual"><Avatar state={activeVoice} /></div>
              <p className="text-sm text-muted-foreground" aria-live="polite">{activeVoice === "idle" ? "Voice mode" : activeVoice === "listening" ? "You’re speaking" : activeVoice === "speaking" ? "Island is speaking" : "Thinking…"}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" aria-label="Preview your voice" title="Preview your voice" aria-pressed={previewVoice === "listening"} onClick={() => setPreviewVoice(previewVoice === "listening" ? null : "listening")}><Mic />Your voice</Button>
                <Button variant="ghost" size="sm" aria-label="Preview AI voice" title="Preview AI voice" aria-pressed={previewVoice === "speaking"} onClick={() => setPreviewVoice(previewVoice === "speaking" ? null : "speaking")}><Volume2 />AI voice</Button>
              </div>
            </div>
          ) : (
          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-3 pt-2 [scrollbar-width:none]">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "rounded-br-md bg-bubble-user" : "rounded-bl-md bg-bubble-ai"}`}>
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          )}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2"><AudioLines className="h-3.5 w-3.5" />Local voice stream</span>
            <Button variant={voiceMode ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-full" aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"} title={voiceMode ? "Turn off voice mode" : "Turn on voice mode"} aria-pressed={voiceMode} onClick={() => { setVoiceMode(!voiceMode); setPreviewVoice(null); }}>{voiceMode ? <MicOff /> : <Mic />}</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
