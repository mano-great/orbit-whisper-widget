import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./chat-composer";

const defaults = { attachments: [], onFiles: vi.fn(), onRemove: vi.fn(), onSubmit: vi.fn(), voiceMode: false, onVoiceToggle: vi.fn() };

describe("chat composer", () => {
  it("accepts a PDF and any other file together", () => {
    const onFiles = vi.fn();
    render(<ChatComposer {...defaults} onFiles={onFiles} />);
    const files = [new File(["pdf"], "notes.pdf", { type: "application/pdf" }), new File(["data"], "archive.zip", { type: "application/zip" })];
    fireEvent.change(screen.getByLabelText("Choose files"), { target: { files } });
    expect(onFiles).toHaveBeenCalledWith(files);
  });
  it("submits typed text with the actual attached file", () => {
    const onSubmit = vi.fn();
    const attachments = [{ id: "pdf", file: new File(["pdf"], "notes.pdf") }];
    render(<ChatComposer {...defaults} attachments={attachments} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "  Read this PDF  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith({ text: "Read this PDF", attachments });
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });
  it("allows file-only messages", () => {
    const onSubmit = vi.fn();
    const attachments = [{ id: "pdf", file: new File(["pdf"], "notes.pdf") }];
    render(<ChatComposer {...defaults} attachments={attachments} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit).toHaveBeenCalledWith({ text: "", attachments });
  });
  it("removes a selected file by its identity", () => {
    const onRemove = vi.fn();
    render(<ChatComposer {...defaults} attachments={[{ id: "pdf", file: new File(["pdf"], "notes.pdf") }]} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove notes.pdf" }));
    expect(onRemove).toHaveBeenCalledWith("pdf");
  });
  it("does not submit an empty message", () => {
    const onSubmit = vi.fn();
    render(<ChatComposer {...defaults} onSubmit={onSubmit} />);
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});