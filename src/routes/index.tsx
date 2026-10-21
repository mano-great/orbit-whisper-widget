import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking",
};

function Avatar({ state }: { state: VoiceState }) {
  if (state === "speaking") {
    return (
      <div className="flex h-5 items-center gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-full w-[3px] rounded-full bg-primary animate-speak" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="relative grid h-5 w-5 place-items-center">
      <span className={`absolute inset-0 bg-primary/30 blur-md ${state === "idle" ? "animate-blob" : "animate-blob-fast"}`} />
      <span
        className={`relative h-3.5 w-3.5 ${state === "listening" ? "bg-accent animate-blob-fast" : state === "thinking" ? "bg-primary animate-blob-fast" : "bg-primary animate-blob"}`}
      />
    </div>
  );
}

function Index() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const streaming = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const offV = subscribeVoiceState(setVoice);
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
    <main className="flex min-h-screen justify-center pt-6">
      <div
        onClick={() => !open && setOpen(true)}
        className="island overflow-hidden text-foreground"
        style={{
          width: open ? 380 : 190,
          height: open ? 460 : 40,
          borderRadius: open ? 32 : 999,
          transition: `width .55s ${spring}, height .6s ${spring}, border-radius .5s ${spring}`,
          cursor: open ? "default" : "pointer",
        }}
      >
        <div className="flex h-10 items-center gap-3 px-3">
          <Avatar state={voice} />
          <span className="flex-1 truncate text-xs font-medium text-muted-foreground">{stateLabel[voice]}</span>
          {open && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="rounded-full px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Collapse"
            >
              ⌃
            </button>
          )}
        </div>

        <div
          className="flex h-[calc(100%-2.5rem)] flex-col"
          style={{ opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-12px)", transition: "opacity .35s ease .15s, transform .5s ease .1s" }}
        >
          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-3 pt-2 [scrollbar-width:none]">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "rounded-br-md bg-bubble-user" : "rounded-bl-md bg-bubble-ai"}`}>
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-3 text-center text-[11px] text-muted-foreground">
            Waiting for local server · ws://localhost:8765
          </div>
        </div>
      </div>
    </main>
  );
}
