/**
 * Seed examples — one document per collection
 * Run with: mongosh <db_name> seed_example.js
 */

// USER — usuario
db.users.insertOne({
  email: "juan@example.com",
  phone: "+52 55 1234 5678",
  name: "Juan Pérez",
  role: "usuario",
  address: {
    street: "Av. Insurgentes 123",
    city: "CDMX",
    state: "CDMX",
    zip: "06600",
    coords: { lat: 19.4284, lng: -99.1277 },
  },
  substitution_profile: [
    {
      original_sku: "417641000000000",
      preferred_substitutes: [
        { sku: "805749000000000", name: "Leche Toni Chocolate 200ml", times_accepted: 3, times_rejected: 0 }
      ],
      last_updated: new Date(),
    }
  ],
  purchase_patterns: [
    {
      sku: "417641000000000",
      name: "Leche Toni Frutilla 200ml",
      avg_quantity: 12,
      avg_days_between_orders: 14,
      last_ordered: new Date("2026-05-23"),
      next_predicted_order: new Date("2026-06-06"),
    }
  ],
  notification_prefs: {
    reorder_reminder: true,
    substitution_alert: true,
    order_tracking: true,
  },
  created_at: new Date(),
});

// USER — repartidor
db.users.insertOne({
  email: "carlos.r@empresa.com",
  phone: "+52 55 9876 5432",
  name: "Carlos Ramírez",
  role: "repartidor",
  cedis: "3012",
  vehicle: "moto",
  current_location: { lat: 19.43, lng: -99.13 },
  is_available: true,
  created_at: new Date(),
});

// PRODUCT
db.products.insertOne({
  sku: "417641000000000",
  name: "Leche Saborizada Toni Frutilla 200ml",
  category: "Lácteos",
  business_unit: "Bebidas",
  cedis: "3012",
  price: 18.5,
  stock: 4,
  low_stock_threshold: 10,
  is_available: true,
  substitutes: [
    { sku: "805749000000000", name: "Leche Toni Chocolate 200ml", similarity_score: 0.92 }
  ],
  depletion_prediction: {
    probability_out_of_stock: 0.87,
    estimated_days_remaining: 2,
    computed_at: new Date(),
  },
  created_at: new Date(),
  updated_at: new Date(),
});

// ORDER
db.orders.insertOne({
  id_pedido: "922188000000000000",
  customer_id: ObjectId("..."),      // replace with real user _id
  repartidor_id: null,               // not yet assigned
  cedis: "3012",
  status: "pendiente",
  items: [
    {
      sku: "417641000000000",
      name: "Leche Toni Frutilla 200ml",
      quantity_requested: 12,
      quantity_delivered: 0,
      unit_price: 18.5,
      status: "registrado",
      substitution: null,
    }
  ],
  subtotal: 222,
  total: 255.3,
  tracking: {
    ordered_at: new Date(),
    confirmed_at: null,
    assigned_at: null,
    picked_up_at: null,
    delivered_at: null,
  },
  delivery_address: {
    street: "Av. Insurgentes 123",
    city: "CDMX",
    coords: { lat: 19.4284, lng: -99.1277 },
  },
  delivery_notes: "",
  missing_items_reported: [],
  chatbot_session_id: null,
  created_at: new Date(),
  updated_at: new Date(),
});
