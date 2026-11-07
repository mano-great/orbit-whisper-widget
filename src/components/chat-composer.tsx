import { useRef, useState } from "react";
import { ArrowUp, FileText, Mic, MicOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Attachment = { id: string; file: File };
export type ChatSubmission = { text: string; attachments: Attachment[] };

export function FileChip({ attachment, onRemove }: { attachment: Attachment; onRemove?: () => void }) {
  return <div className="file-chip">
    <FileText className="size-4 shrink-0 text-primary" />
    <span className="min-w-0 flex-1"><span className="block truncate text-xs" title={attachment.file.name}>{attachment.file.name}</span><span className="block text-[10px] text-muted-foreground">{attachment.file.size < 1024 ? `${attachment.file.size} B` : `${Math.ceil(attachment.file.size / 1024)} KB`}</span></span>
    {onRemove && <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" aria-label={`Remove ${attachment.file.name}`} title="Remove file" onClick={onRemove}><X /></Button>}
  </div>;
}

export function ChatComposer({ attachments, onFiles, onRemove, onSubmit, voiceMode, onVoiceToggle }: {
  attachments: Attachment[];
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSubmit: (submission: ChatSubmission) => void;
  voiceMode: boolean;
  onVoiceToggle: () => void;
}) {
  const [text, setText] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSubmit({ text: trimmed, attachments });
    setText("");
  };
  return <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    {attachments.length > 0 && <div className="attachment-tray" aria-label="Pending attachments">{attachments.map((attachment) => <FileChip key={attachment.id} attachment={attachment} onRemove={() => onRemove(attachment.id)} />)}</div>}
    <input ref={picker} type="file" multiple className="hidden" aria-label="Choose files" onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <div className="composer-row">
      <Button type="button" variant="ghost" size="icon" className="composer-tool" aria-label="Add files" title="Add files" onClick={() => picker.current?.click()}><Plus /></Button>
      <textarea rows={1} className="composer-input" aria-label="Message" placeholder="Type here…" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} />
      <Button type="button" variant={voiceMode ? "secondary" : "ghost"} size="icon" className="composer-tool" aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"} title={voiceMode ? "Turn off voice mode" : "Turn on voice mode"} aria-pressed={voiceMode} onClick={onVoiceToggle}>{voiceMode ? <MicOff /> : <Mic />}</Button>
      <Button type="submit" size="icon" className="composer-send" aria-label="Send message" title="Send message" disabled={!text.trim() && attachments.length === 0}><ArrowUp /></Button>
    </div>
  </form>;
}