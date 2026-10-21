// Placeholder bridge to a local Python server.
// Python side (example): FastAPI/websockets on ws://localhost:8765
//   - /stream : sends {"type":"token","text":"..."} and {"type":"done"}
//   - /voice  : sends {"state":"idle"|"listening"|"thinking"|"speaking"}
export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export const BRIDGE = {
  streamUrl: "ws://localhost:8765/stream",
  voiceUrl: "ws://localhost:8765/voice",
};

function connect(url: string, onMsg: (d: any) => void) {
  let ws: WebSocket | null = null;
  let closed = false;
  let timer: ReturnType<typeof setTimeout>;
  const open = () => {
    try {
      ws = new WebSocket(url);
      ws.onmessage = (e) => {
        try { onMsg(JSON.parse(e.data)); } catch { onMsg({ type: "token", text: String(e.data) }); }
      };
      ws.onclose = () => { if (!closed) timer = setTimeout(open, 3000); };
      ws.onerror = () => ws?.close();
    } catch { timer = setTimeout(open, 3000); }
  };
  open();
  return () => { closed = true; clearTimeout(timer); ws?.close(); };
}

/** Live text stream endpoint. */
export function subscribeTextStream(onToken: (t: string) => void, onDone: () => void) {
  return connect(BRIDGE.streamUrl, (d) => {
    if (d.type === "done") onDone();
    else if (typeof d.text === "string") onToken(d.text);
  });
}

/** Voice state trigger endpoint. */
export function subscribeVoiceState(onState: (s: VoiceState) => void) {
  return connect(BRIDGE.voiceUrl, (d) => {
    if (d.state) onState(d.state as VoiceState);
  });
}
