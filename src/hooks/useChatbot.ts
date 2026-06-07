import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const API = import.meta.env.VITE_API_URL ?? "https://hack-back.up.railway.app";
const SESSION_KEY = "or_chat_session";

function toChatMessage(msg: ChatApiMessage): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
  };
}

export function useChatbot() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY)
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const persistSession = useCallback((id: string) => {
    setSessionId(id);
    localStorage.setItem(SESSION_KEY, id);
  }, []);

  const loadSession = useCallback(async () => {
    if (!sessionId || !user?.token) return;

    const res = await fetch(`${API}/api/chatbot/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    if (!res.ok) {
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
      return;
    }

    const data = (await res.json()) as { messages: ChatApiMessage[] };
    setMessages(data.messages.map(toChatMessage));
  }, [sessionId, user?.token]);

  const sendMessage = useCallback(
    async (question: string, orderId?: string) => {
      if (!user?.token) throw new Error("No autenticado");

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const res = await fetch(`${API}/api/chatbot/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            question,
            session_id: sessionId,
            order_id: orderId,
          }),
        });

        if (!res.ok) throw new Error("La solicitud al asistente falló");

        const data = (await res.json()) as { answer: string; session_id: string };
        persistSession(data.session_id);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, user?.token, persistSession]
  );

  return { messages, setMessages, sessionId, loading, sendMessage, loadSession };
}
