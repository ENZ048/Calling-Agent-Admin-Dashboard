import { create } from "zustand";
import { WS_URL } from './config';

export type LiveCallEvent =
  | { type: "call_started"; payload: any }
  | { type: "call_updated"; payload: any }
  | { type: "call_ended"; payload: any }
  | { type: "system_status"; payload: any };

type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface WebSocketState {
  status: WebSocketStatus;
  lastEventAt?: number;
  connect: () => void;
  disconnect: () => void;
}

let socket: WebSocket | null = null;

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: "disconnected",
  lastEventAt: undefined,
  connect: () => {
    if (typeof window === "undefined") return;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    set({ status: "connecting" });

    try {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => set({ status: "connected" });
      socket.onclose = () => set({ status: "disconnected" });
      socket.onerror = () => set({ status: "error" });
      socket.onmessage = (event: MessageEvent) => {
        set({ lastEventAt: Date.now() });
        // Dashboard pages can subscribe to the native WebSocket directly if needed.
        // We keep this minimal and just expose connection status for now.
        try {
          JSON.parse(event.data);
        } catch {
          // ignore malformed event for now
        }
      };
    } catch {
      set({ status: "error" });
    }
  },
  disconnect: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    set({ status: "disconnected" });
  },
}));


