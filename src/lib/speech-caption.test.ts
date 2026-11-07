import { describe, expect, it } from "vitest";
import { speakingCaption, updateSpeechCaption } from "./speech-caption";

describe("AI speech caption", () => {
  it("shows incoming AI words as they stream while speaking", () => {
    let caption = updateSpeechCaption({ text: "", complete: true }, { type: "token", text: "Hello" });
    expect(speakingCaption("speaking", caption)).toBe("Hello");
    caption = updateSpeechCaption(caption, { type: "token", text: " there" });
    expect(speakingCaption("speaking", caption)).toBe("Hello there");
  });
  it("keeps completed text visible until speaking ends", () => {
    const caption = updateSpeechCaption({ text: "Hello there", complete: false }, { type: "done" });
    expect(speakingCaption("speaking", caption)).toBe("Hello there");
    expect(speakingCaption("idle", caption)).toBeNull();
    expect(speakingCaption("listening", caption)).toBeNull();
  });
  it("starts a fresh caption for the next reply", () => {
    expect(updateSpeechCaption({ text: "Old reply", complete: true }, { type: "token", text: "New reply" })).toEqual({ text: "New reply", complete: false });
  });
  it("does not invent text when only a voice trigger is received", () => {
    expect(speakingCaption("speaking", { text: "", complete: true })).toBeNull();
  });
});