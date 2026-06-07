import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Radio } from "lucide-react";
import { useNavigate } from "react-router";
import { useProducts } from "./ProductsContext";
import { useCart } from "./CartContext";

const AGENT_ID = "agent_8101ktfn5na9eczr7c8c78r5r53y";

function TuliWidgetInner() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { cart, setQty } = useCart();
  const cartRef = useRef(cart);
  const productsRef = useRef(products);
  const [isOpen, setIsOpen] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const { startSession, endSession, status, isSpeaking, sendContextualUpdate } = useConversation({
    onConnect: () => setMicError(null),
    onError: (error) => setMicError(String(error)),
  });

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useConversationClientTool("addToCart", async (params: { sku?: string; quantity?: number }) => {
    const sku = params.sku?.toString().trim();
    const quantity = Math.max(1, params.quantity ?? 1);

    if (!sku) {
      return "No se proporcionó un SKU válido para el producto.";
    }

    const product = productsRef.current.find((p) => p.sku === sku);
    if (!product) {
      return `No encontré el producto con SKU ${sku}.`;
    }

    setQty(product.sku, quantity);
    return `Agregué ${quantity} unidad${quantity !== 1 ? "es" : ""} de ${product.nombre} al carrito.`;
  });

  useConversationClientTool("getCart", () => {
    const currentCart = cartRef.current;
    const items = Object.entries(currentCart)
      .map(([sku, qty]) => {
        const product = productsRef.current.find((p) => p.sku === sku);
        return product ? `${qty} × ${product.nombre}` : `${qty} × ${sku}`;
      })
      .join(", ");

    if (!items) {
      return "El carrito está vacío.";
    }

    return `El carrito contiene: ${items}.`;
  });

  useConversationClientTool("go_to_checkout", () => {
    navigate("/usuario/tienda/checkout");
    return "Llevándote al checkout.";
  });

  useEffect(() => {
    if (status !== "connected" || products.length === 0) return;
    const catalog = products
      .map((p) => `SKU ${p.sku}: ${p.nombre} | Categoría: ${p.categoria} | Precio: $${p.precio} MXN`)
      .join("\n");
    sendContextualUpdate(
      `Catálogo de productos disponibles (usa el SKU para identificar cada producto):\n${catalog}\n\nPuedes pedir: "Agrega 2 de SKU 123" o "Pon 1 ${products[0]?.nombre ?? 'producto'} en el carrito". Este asistente también puede usar la herramienta addToCart con parámetros { sku, quantity } y la herramienta getCart para confirmar el contenido del carrito.`
    );
  }, [status, products, sendContextualUpdate]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const handleStart = async () => {
    setMicError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      startSession({ agentId: AGENT_ID, connectionType: "webrtc" });
    } catch {
      setMicError("Necesitamos acceso al micrófono para hablar con Tuli.");
    }
  };

  const handleClose = async () => {
    if (isConnected) endSession();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-end font-sans antialiased">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-4 w-72 rounded-2xl border border-zinc-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5 bg-gradient-to-r from-red-600 to-red-500">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Radio size={16} />
                  {isConnected && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-xs font-semibold tracking-tight text-white">Tuli</h1>
                  <p className="text-[10px] text-red-100 font-medium uppercase tracking-wider">
                    Asistente de Voz
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </header>

            {/* Body */}
            <div className="p-5 flex flex-col items-center gap-4">
              {/* Animated orb */}
              <div className="relative flex h-20 w-20 items-center justify-center">
                {isConnected && (
                  <motion.div
                    animate={{ scale: isSpeaking ? [1, 1.25, 1] : [1, 1.08, 1] }}
                    transition={{ duration: isSpeaking ? 0.6 : 1.4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-red-100"
                  />
                )}
                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 ${
                    isConnected
                      ? isSpeaking
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-red-600 border-2 border-red-200"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {isConnected ? <Mic size={24} /> : <MicOff size={24} />}
                </div>
              </div>

              {/* Status text */}
              <p className="text-xs font-medium text-zinc-600 text-center">
                {isConnecting
                  ? "Conectando..."
                  : isConnected
                  ? isSpeaking
                    ? "Tuli está hablando..."
                    : "Tuli te escucha"
                  : "Toca para iniciar conversación de voz"}
              </p>

              {micError && (
                <p className="text-[11px] text-red-500 text-center bg-red-50 rounded-xl px-3 py-2 w-full">
                  {micError}
                </p>
              )}

              {/* Action button */}
              {!isConnected ? (
                <button
                  onClick={handleStart}
                  disabled={isConnecting}
                  className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Conectando..." : "Iniciar conversación"}
                </button>
              ) : (
                <button
                  onClick={() => endSession()}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-100"
                >
                  Terminar conversación
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-red-100 transition-colors ${
          isConnected ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
        } text-white`}
        aria-label="Abrir asistente de voz Tuli"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="mic" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Mic size={20} />
            </motion.div>
          )}
        </AnimatePresence>
        {isConnected && (
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </motion.button>
    </div>
  );
}

export default function TuliWidget() {
  return (
    <ConversationProvider>
      <TuliWidgetInner />
    </ConversationProvider>
  );
}
