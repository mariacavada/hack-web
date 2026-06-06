import type { Product } from "./types";

export const mockProducts: Product[] = [
  { sku: "1",  nombre: "Coca-Cola Original 600ml",  categoria: "Refrescos",  precio: 18, emoji: "🥤", descripcion: "La clásica de siempre" },
  { sku: "2",  nombre: "Sprite 600ml",               categoria: "Refrescos",  precio: 18, emoji: "💚" },
  { sku: "3",  nombre: "Fanta Naranja 600ml",        categoria: "Refrescos",  precio: 18, emoji: "🍊" },
  { sku: "4",  nombre: "Coca-Cola Sin Azúcar 600ml", categoria: "Refrescos",  precio: 19, emoji: "⚫" },
  { sku: "5",  nombre: "Agua Ciel 1L",               categoria: "Aguas",      precio: 12, emoji: "💧" },
  { sku: "6",  nombre: "Agua Ciel 500ml",            categoria: "Aguas",      precio: 9,  emoji: "💧" },
  { sku: "7",  nombre: "Powerade Mora Azul",         categoria: "Deportivas", precio: 25, emoji: "⚡" },
  { sku: "8",  nombre: "Powerade Naranja",           categoria: "Deportivas", precio: 25, emoji: "🔸" },
  { sku: "9",  nombre: "Fuze Tea Limón",             categoria: "Tés",        precio: 22, emoji: "🍋" },
  { sku: "10", nombre: "Fuze Tea Durazno",           categoria: "Tés",        precio: 22, emoji: "🍑" },
  { sku: "11", nombre: "Del Valle Mango 355ml",      categoria: "Jugos",      precio: 16, emoji: "🥭" },
  { sku: "12", nombre: "Del Valle Naranja 355ml",    categoria: "Jugos",      precio: 16, emoji: "🍊" },
];

export const CATEGORY_ICONS: Record<string, string> = {
  Todos:      "🏪",
  Refrescos:  "🥤",
  Aguas:      "💧",
  Deportivas: "⚡",
  Tés:        "🍵",
  Jugos:      "🧃",
};