export interface Product {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  imagen_url?: string | null;
  emoji?: string;
  descripcion?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export type Cart = Record<string, number>; // sku → qty