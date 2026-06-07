import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ChatOrderContextValue {
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
}

const ChatOrderContext = createContext<ChatOrderContextValue | null>(null);

export function ChatOrderProvider({ children }: { children: ReactNode }) {
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(null);

  const setActiveOrderId = useCallback((id: string | null) => {
    setActiveOrderIdState(id);
  }, []);

  return (
    <ChatOrderContext.Provider value={{ activeOrderId, setActiveOrderId }}>
      {children}
    </ChatOrderContext.Provider>
  );
}

export function useChatOrder() {
  const ctx = useContext(ChatOrderContext);
  if (!ctx) throw new Error("useChatOrder must be used inside <ChatOrderProvider>");
  return ctx;
}
