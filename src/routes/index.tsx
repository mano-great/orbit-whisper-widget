import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { AudioLines, ChevronUp, Upload, Grip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatComposer, FileChip, type Attachment, type ChatSubmission } from "@/components/chat-composer";
import { NotchMascot } from "@/components/notch-mascot";
import { useMicLevel } from "@/lib/use-mic-level";
import { subscribeTextStream, subscribeVoiceState, type VoiceState } from "@/lib/island-bridge";
import { speakingCaption, updateSpeechCaption } from "@/lib/speech-caption";
import { clampWidgetSize } from "@/lib/widget-size";

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

type Msg = { id: number; role: "user" | "ai"; text: string; attachments?: Attachment[] };

const seed: Msg[] = [
  { id: 1, role: "user", text: "What's on my calendar today?" },
  { id: 2, role: "ai", text: "Two things: design review at 3 PM and a call with Priya at 5:30." },
  { id: 3, role: "user", text: "Remind me 10 minutes before each." },
  { id: 4, role: "ai", text: "Done. I'll nudge you at 2:50 and 5:20." },
];

const stateLabel: Record<VoiceState, string> = {
  idle: "Ready to dive in",
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
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const fit = () => setSize((current) => current ? clampWidgetSize(current.width, current.height, window.innerWidth, window.innerHeight) : null);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const [dragging, setDragging] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [localSent, setLocalSent] = useState(false);
  const dragDepth = useRef(0);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [voiceMode, setVoiceMode] = useState(false);
  const [previewVoice, setPreviewVoice] = useState<VoiceState | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const mic = useMicLevel(voiceMode, islandRef);
  const activeVoice = previewVoice ?? (mic.talking && voice === "idle" ? "listening" : voice);
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const streaming = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [caption, dispatchCaption] = useReducer(updateSpeechCaption, { text: "", complete: true });
  const captionRef = useRef<HTMLSpanElement>(null);
  const spokenText = speakingCaption(activeVoice, caption);
  const headingText = spokenText ?? greeting ?? stateLabel[activeVoice];

  useEffect(() => {
    const element = captionRef.current;
    if (element) element.scrollLeft = spokenText ? element.scrollWidth : 0;
  }, [headingText, spokenText, open]);

  useEffect(() => {
    const offV = subscribeVoiceState((state) => {
      setVoice(state);
      setPreviewVoice(null);
      if (state === "thinking" || state === "listening") dispatchCaption({ type: "reset" });
    });
    const offT = subscribeTextStream(
      (t) => {
        dispatchCaption({ type: "token", text: t });
        const startsReply = streaming.current == null;
        const id = streaming.current ?? Date.now();
        streaming.current = id;
        setMsgs((m) => startsReply ? [...m, { id, role: "ai", text: t }] : m.map((x) => x.id === id ? { ...x, text: x.text + t } : x));
      },
      () => { streaming.current = null; dispatchCaption({ type: "done" }); },
    );
    return () => { offV(); offT(); };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, attachments]);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    setAttachments((current) => [...current, ...files.map((file) => ({ id: crypto.randomUUID(), file }))]);
    setOpen(true);
    setVoiceMode(false);
    setPreviewVoice(null);
  };
  const submit = ({ text, attachments: sentFiles }: ChatSubmission) => {
    setMsgs((current) => [...current, { id: Date.now(), role: "user", text, attachments: sentFiles }]);
    setAttachments([]);
    setVoiceMode(false);
    setPreviewVoice(null);
    setLocalSent(true);
  };

  return (
    <main className="flex min-h-screen justify-center px-3 pt-6">
      <div
        ref={islandRef}
        onClick={() => !open && setOpen(true)}
        onDragEnter={(event) => { if (!Array.from(event.dataTransfer.types).includes("Files")) return; event.preventDefault(); dragDepth.current += 1; setDragging(true); }}
        onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
        onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
        className="island island-ring widget-shell overflow-hidden text-foreground"
        data-open={open}
        data-resizing={resizing}
        style={size ? { "--expanded-width": `${size.width}px`, "--expanded-height": `${size.height}px` } as CSSProperties : undefined}
        data-dragging={dragging}
        aria-label="Island chat widget"
      >
        <span className="island-ring-frame" aria-hidden="true"><span className="island-ring-spin" /></span>
        <div className="flex h-10 shrink-0 items-center gap-2 px-3">
          <NotchMascot onGreeting={setGreeting} aiSpeaking={activeVoice === "speaking"} />
          <Button variant="ghost" className="widget-heading min-w-0 flex-1 justify-start px-0 text-xs font-medium text-muted-foreground" aria-label={open ? "Chat is expanded" : "Expand chat"} onClick={() => setOpen(true)}><span ref={captionRef} className="block min-w-0 overflow-hidden whitespace-nowrap" aria-live="polite" title={headingText}>{headingText}</span></Button>
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
          className="widget-content flex h-[calc(100%-2.5rem)] flex-col"
          inert={!open}
        >
          {voiceMode ? (
            <div className="voice-stage flex min-h-0 flex-1 flex-col items-center justify-center gap-5" data-state={activeVoice}>
              <div className="voice-visual"><Avatar state={activeVoice} /></div>
              <p className="text-sm text-muted-foreground" aria-live="polite">{mic.error ? mic.error : activeVoice === "idle" ? "Start talking…" : activeVoice === "thinking" ? "Thinking…" : "Live conversation"}</p>
              <Button variant="ghost" size="sm" aria-label="Preview live voice" title="Preview live voice" aria-pressed={previewVoice === "speaking"} onClick={() => setPreviewVoice(previewVoice === "speaking" ? null : "speaking")}><AudioLines />Live voice</Button>
            </div>
          ) : (
          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-3 pt-2 [scrollbar-width:none]">
            {msgs.map((m) => (
               <div key={m.id} className={`chat-message flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                 <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${m.role === "user" ? "rounded-br-md bg-bubble-user" : "rounded-bl-md bg-bubble-ai"}`}>
                   {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                   {m.attachments?.map((attachment) => <FileChip key={attachment.id} attachment={attachment} />)}
                 </div>
              </div>
            ))}
          </div>
          )}
          <ChatComposer attachments={attachments} onFiles={addFiles} onRemove={(id) => setAttachments((current) => current.filter((attachment) => attachment.id !== id))} onSubmit={submit} voiceMode={voiceMode} onVoiceToggle={() => { setVoiceMode(!voiceMode); setPreviewVoice(null); }} />
          <div className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-1 text-[10px] text-muted-foreground" role="status">
            <AudioLines className="h-3 w-3 shrink-0" /><span>{localSent ? "Added locally · AI sending not connected" : "Local voice stream"}</span>
          </div>
        </div>
        {dragging && <div className="file-drop-overlay" role="status"><Upload className="size-5" /><span>Drop files</span></div>}
        {open && <Button variant="ghost" size="icon" className="widget-resize-grip" aria-label="Resize expanded window" title="Resize expanded window" onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const rect = islandRef.current?.getBoundingClientRect();
            if (!rect) return;
            event.preventDefault(); event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeStart.current = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height };
            setResizing(true);
          }}
          onPointerMove={(event) => {
            const start = resizeStart.current;
            if (!start) return;
            setSize(clampWidgetSize(start.width + (event.clientX - start.x) * 2, start.height + event.clientY - start.y, window.innerWidth, window.innerHeight));
          }}
          onPointerUp={(event) => { resizeStart.current = null; setResizing(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onLostPointerCapture={() => { resizeStart.current = null; setResizing(false); }}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            const rect = islandRef.current?.getBoundingClientRect();
            if (!rect) return;
            const step = event.shiftKey ? 40 : 10;
            setSize(clampWidgetSize(rect.width + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), rect.height + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0), window.innerWidth, window.innerHeight));
          }}><Grip /></Button>}
      </div>
    </main>
  );
}
