import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizontal, Bot, MessageCircle, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestions = [
  "¿Dónde está mi pedido?",
  "Consultar tiempo de entrega",
  "Estado de envío",
  "Hablar con soporte",
];

export default function AyudaWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente de pedidos. Puedo ayudarte a consultar el estado de tus entregas y resolver dudas. ¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const sendToGemini = async (message: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const lower = message.toLowerCase();

    if (lower.includes("pedido") || lower.includes("dónde") || lower.includes("donde")) {
      return "Con gusto te ayudo. ¿Podrías compartir tu número de pedido o el código de cliente B2B asociado a la entrega?";
    }
    if (lower.includes("soporte") || lower.includes("humano")) {
      return "Puedo ayudarte con información general. Si necesitas atención especializada, puedo derivarte con un supervisor de bodega.";
    }
    return "Entendido. Estoy listo para ayudarte con cualquier consulta relacionada con tus pedidos o estado de envío.";
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendToGemini(messageText);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ocurrió un error. Inténtalo nuevamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans antialiased text-zinc-900">
      
      {/* CHAT PANEL WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-4 flex h-[500px] w-[calc(100vw-2rem)] flex-col rounded-2xl border border-zinc-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] sm:w-[380px]"
          >
            {/* Minimal Header */}
            <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Bot size={16} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500" />
                </div>
                <div>
                  <h1 className="text-xs font-semibold tracking-tight">Asistente Operativo</h1>
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Soporte Logístico</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={16} />
              </button>
            </header>

            {/* Chat Messages Feed */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 shrink-0">
                          <Bot size={12} />
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                            isUser
                              ? "bg-zinc-950 text-zinc-50 font-medium rounded-tr-none"
                              : "bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <span className="px-0.5 text-[9px] font-medium text-zinc-400 uppercase tracking-wide">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Suggestions Chips */}
              {messages.length === 1 && !loading && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition-all hover:border-zinc-900 hover:text-zinc-900"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing Loader */}
              {loading && (
                <div className="flex items-center gap-2.5 justify-start">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2.5">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                        className="h-1 w-1 rounded-full bg-zinc-400"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>

            {/* Input Form Footer */}
            <footer className="border-t border-zinc-100 p-3 bg-white rounded-b-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center"
              >
                <input
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu consulta..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/30 py-2.5 pl-3.5 pr-10 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  disabled={!input.trim() || loading}
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-all hover:text-zinc-900 disabled:text-zinc-200"
                >
                  <SendHorizontal size={14} strokeWidth={2.5} />
                </button>
              </form>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSISTENT FLOATING TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg transition-all hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-100"
        aria-label="Abrir asistente de soporte"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}