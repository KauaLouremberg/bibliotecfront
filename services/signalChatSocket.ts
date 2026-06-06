import { SECURE_ACCESS_KEY, WS_URL } from '@/constants/config';
import { getSecureItem } from '@/utils/secureStorage';

export type ChatSocketMessage = {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
};

type MessageHandler = (message: ChatSocketMessage) => void;
type StatusHandler = (connected: boolean) => void;

export class SignalChatSocket {
  private socket: WebSocket | null = null;
  private threadId: number | null = null;
  private onMessage: MessageHandler | null = null;
  private onStatus: StatusHandler | null = null;
  private shouldReconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  setHandlers(onMessage: MessageHandler, onStatus: StatusHandler) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
  }

  async connect(threadId: number) {
    this.shouldReconnect = true;
    this.threadId = threadId;
    await this.open();
  }

  private async open() {
    if (this.threadId === null) return;
    const token = await getSecureItem(SECURE_ACCESS_KEY);
    if (!token) {
      this.onStatus?.(false);
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    const url = `${WS_URL}/ws/chats/${this.threadId}/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.onStatus?.(true);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type?: string;
          message?: ChatSocketMessage;
        };
        if (payload.type === 'message' && payload.message) {
          this.onMessage?.(payload.message);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    socket.onclose = () => {
      this.onStatus?.(false);
      if (this.shouldReconnect && this.threadId !== null) {
        this.reconnectTimer = setTimeout(() => {
          void this.open();
        }, 1500);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  send(body: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify({ body }));
    return true;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.threadId = null;
    this.onStatus?.(false);
  }
}
