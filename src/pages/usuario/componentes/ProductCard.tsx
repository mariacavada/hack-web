import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "../types";

interface Props {
  product: Product;
  qty: number;
  onAdd: (product: Product) => void;
  onRemove: (sku: string) => void;
  onSetQty?: (sku: string, qty: number) => void;
}

export default function ProductCard({ product, qty, onAdd, onRemove, onSetQty }: Props) {
  const [adding, setAdding]     = useState(false);
  const [inputVal, setInputVal] = useState(String(qty));

  // Keep local input in sync when parent qty changes
  useEffect(() => { setInputVal(String(qty)); }, [qty]);

  const handleAdd = () => {
    setAdding(true);
    onAdd(product);
    setTimeout(() => setAdding(false), 180);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digit characters
    if (/^\d*$/.test(e.target.value)) setInputVal(e.target.value);
  };

  const commitInput = () => {
    const n = parseInt(inputVal, 10);
    if (!n || n < 1 || !isFinite(n)) {
      setInputVal(String(qty)); // reset to valid current value
      return;
    }
    const capped = Math.min(n, 999);
    setInputVal(String(capped));
    if (capped !== qty) onSetQty?.(product.sku, capped);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-[box-shadow,border-color] duration-200 flex flex-col overflow-hidden"
    >
      {/* Image / emoji area */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center h-32 select-none overflow-hidden">
        {product.imagen_url ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <motion.span
            className="text-5xl"
            whileHover={{ scale: 1.14, rotate: -3 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          >
            {product.emoji ?? "🥤"}
          </motion.span>
        )}

        <AnimatePresence>
          {qty > 0 && (
            <motion.span
              key="qty"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md tabular-nums"
            >
              {qty}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 leading-none">
          {product.categoria}
        </p>
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 flex-1 mb-2.5">
          {product.nombre}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          {/* Price */}
          <div className="leading-none">
            <span className="text-base font-extrabold text-gray-900 tabular-nums">${product.precio}</span>
            <span className="text-[10px] font-semibold text-gray-400 ml-0.5">MXN</span>
          </div>

          {/* Quantity control */}
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleAdd}
              className={`w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 active:bg-red-800 transition-colors text-xl font-light leading-none shrink-0 ${adding ? "scale-90" : "scale-100"}`}
            >
              +
            </motion.button>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={() => onRemove(product.sku)}
                className="w-7 h-7 rounded-full border-2 border-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold hover:border-red-300 hover:text-red-600 transition-colors"
              >
                −
              </motion.button>

              <input
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={handleInputChange}
                onBlur={commitInput}
                onKeyDown={e => e.key === 'Enter' && commitInput()}
                className="w-8 text-sm font-bold text-gray-900 text-center tabular-nums bg-transparent border-b-2 border-gray-200 focus:border-red-500 focus:outline-none transition-colors"
                aria-label="Cantidad"
              />

              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={handleAdd}
                className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold hover:bg-red-700 transition-colors"
              >
                +
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
