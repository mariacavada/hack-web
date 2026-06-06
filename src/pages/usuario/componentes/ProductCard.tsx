import { useState } from "react";
import type { Product } from "../types";

interface Props {
  product: Product;
  qty: number;
  onAdd: (product: Product) => void;
  onRemove: (sku: string) => void;
}

export default function ProductCard({ product, qty, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    setAdding(true);
    onAdd(product);
    setTimeout(() => setAdding(false), 200);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Image area */}
      <div className="relative bg-gray-50 flex items-center justify-center h-32 text-5xl select-none">
        <span className="group-hover:scale-110 transition-transform duration-200 inline-block">
          {product.emoji ?? "🥤"}
        </span>
        {qty > 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
            {qty}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">
          {product.categoria}
        </span>
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 flex-1 mb-2">
          {product.nombre}
        </p>
        {product.descripcion && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">{product.descripcion}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-base font-extrabold text-gray-900">
            ${product.precio}
            <span className="text-xs font-normal text-gray-400 ml-0.5">MXN</span>
          </span>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className={`w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 active:scale-90 transition-all duration-150 text-xl font-light ${
                adding ? "scale-90" : "scale-100"
              }`}
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onRemove(product.sku)}
                className="w-7 h-7 rounded-full border-2 border-red-600 text-red-600 flex items-center justify-center text-base font-bold hover:bg-red-50 active:scale-90 transition-all duration-150"
              >
                −
              </button>
              <span className="text-sm font-bold text-gray-900 w-4 text-center">{qty}</span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-base font-bold hover:bg-red-700 active:scale-90 transition-all duration-150"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}