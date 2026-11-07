import type { VoiceState } from "./island-bridge";

export type SpeechCaption = { text: string; complete: boolean };
export function updateSpeechCaption(caption: SpeechCaption, action: { type: "token"; text: string } | { type: "done" } | { type: "reset" }): SpeechCaption {
  if (action.type === "reset") return { text: "", complete: true };
  if (action.type === "done") return { ...caption, complete: true };
  return { text: (caption.complete ? "" : caption.text) + action.text, complete: false };
}

export function speakingCaption(voice: VoiceState, caption: SpeechCaption): string | null {
  return voice === "speaking" && caption.text.trim() ? caption.text : null;
}