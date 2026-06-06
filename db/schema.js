/**
 * MongoDB Schema — Order Rescue Hackathon
 * Roles: usuario, admin, repartidor
 * LLM: Gemini | Host: Vultr | DB: MongoDB
 */

// ─── USERS ──────────────────────────────────────────────────────────────────
// Covers all roles. role: "usuario" | "admin" | "repartidor"
const userSchema = {
  _id: ObjectId,
  email: String,           // unique
  phone: String,
  name: String,
  role: String,            // "usuario" | "admin" | "repartidor"
  created_at: Date,

  // === USUARIO-specific ===
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    coords: { lat: Number, lng: Number },
  },
  // Substitution profile: learned from past orders
  substitution_profile: [
    {
      original_sku: String,
      preferred_substitutes: [
        { sku: String, name: String, times_accepted: Number, times_rejected: Number }
      ],
      last_updated: Date,
    }
  ], 
  // Purchase patterns for reorder predictions
  purchase_patterns: [
    {
      sku: String,
      name: String,
      avg_quantity: Number,
      avg_days_between_orders: Number,
      last_ordered: Date,
      next_predicted_order: Date,   // computed by Gemini model
    }
  ],
  notification_prefs: {
    reorder_reminder: Boolean,       // "es momento de pedir otra vez"
    substitution_alert: Boolean,
    order_tracking: Boolean,
  },

  // === REPARTIDOR-specific ===
  vehicle: String,
  cedis: String,                     // distribution center assigned
  current_location: { lat: Number, lng: Number },
  is_available: Boolean,
};


// ─── PRODUCTS ───────────────────────────────────────────────────────────────
const productSchema = {
  _id: ObjectId,
  sku: String,             // unique, from CSV
  name: String,
  category: String,        // e.g. "Bebidas", "Lácteos"
  business_unit: String,
  cedis: String,           // which distribution center holds it
  price: Number,
  stock: Number,
  low_stock_threshold: Number,   // admin alert trigger
  is_available: Boolean,

  // Substitution suggestions (used when product unavailable)
  substitutes: [
    { sku: String, name: String, similarity_score: Number }
  ],

  // For admin: stock depletion probability (updated by Gemini)
  depletion_prediction: {
    probability_out_of_stock: Number,   // 0–1
    estimated_days_remaining: Number,
    computed_at: Date,
  },

  created_at: Date,
  updated_at: Date,
};


// ─── ORDERS ─────────────────────────────────────────────────────────────────
// Tracks full lifecycle: pedido → asignado → en camino → entregado/incompleto
const orderSchema = {
  _id: ObjectId,
  id_pedido: String,           // original ID from CSV
  customer_id: ObjectId,       // ref: users
  repartidor_id: ObjectId,     // ref: users (assigned delivery person)
  cedis: String,

  status: String,
  // "pendiente" | "confirmado" | "asignado" | "en_camino"
  // | "entregado" | "incompleto" | "cancelado"

  items: [
    {
      sku: String,
      name: String,
      quantity_requested: Number,
      quantity_delivered: Number,
      unit_price: Number,
      status: String,          // "entregado" | "faltante" | "sustituido" | "registrado"

      // If substituted
      substitution: {
        original_sku: String,
        original_name: String,
        substitute_sku: String,
        substitute_name: String,
        accepted_by_user: Boolean,   // null = pending, true/false after delivery
        suggested_by: String,        // "gemini" | "manual"
      },
    }
  ],

  subtotal: Number,
  total: Number,

  // Timestamps for tracking (like Amazon)
  tracking: {
    ordered_at: Date,
    confirmed_at: Date,
    assigned_at: Date,
    picked_up_at: Date,
    delivered_at: Date,
  },

  // Delivery location snapshot
  delivery_address: {
    street: String,
    city: String,
    coords: { lat: Number, lng: Number },
  },

  // Repartidor notes
  delivery_notes: String,
  missing_items_reported: [String],   // skus reported missing

  // Chatbot conversation linked to this order
  chatbot_session_id: ObjectId,       // ref: chatbot_sessions

  created_at: Date,
  updated_at: Date,
};


// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
const notificationSchema = {
  _id: ObjectId,
  user_id: ObjectId,       // ref: users
  type: String,
  // "product_unavailable" | "reorder_reminder" | "substitution_suggestion"
  // | "order_status" | "low_stock" | "depletion_alert"

  title: String,
  body: String,
  metadata: Object,        // flexible payload (order_id, sku, etc.)
  read: Boolean,
  sent_at: Date,
  channel: String,         // "push" | "sms" | "in_app" | "elevenlabs_call"
};


// ─── SUBSTITUTION LOGS ───────────────────────────────────────────────────────
// Granular log — Gemini model learns from this
const substitutionLogSchema = {
  _id: ObjectId,
  order_id: ObjectId,
  customer_id: ObjectId,
  original_sku: String,
  original_name: String,
  substitute_sku: String,
  substitute_name: String,
  suggested_by: String,        // "gemini" | "repartidor" | "admin"
  accepted_by_user: Boolean,
  reason_unavailable: String,  // "sin_stock" | "dañado" | "otro"
  logged_at: Date,
};


// ─── CHATBOT SESSIONS ────────────────────────────────────────────────────────
const chatbotSessionSchema = {
  _id: ObjectId,
  user_id: ObjectId,
  order_id: ObjectId,         // null if general inquiry
  messages: [
    {
      role: String,           // "user" | "assistant"
      content: String,
      timestamp: Date,
    }
  ],
  context: Object,            // current order state, product availability, etc.
  started_at: Date,
  ended_at: Date,
};


// ─── DELIVERY ROUTES ─────────────────────────────────────────────────────────
// Extra extra: optimal route per repartidor per day
const routeSchema = {
  _id: ObjectId,
  repartidor_id: ObjectId,
  date: Date,
  orders: [
    {
      order_id: ObjectId,
      stop_number: Number,
      address: { street: String, coords: { lat: Number, lng: Number } },
      estimated_arrival: Date,
      actual_arrival: Date,
      status: String,          // "pendiente" | "en_camino" | "completado"
    }
  ],
  total_distance_km: Number,
  optimized_at: Date,         // when Gemini/routing algo last ran
};


// ─── RECYCLING CAMPAIGNS ─────────────────────────────────────────────────────
// Extra extra extra
const recyclingCampaignSchema = {
  _id: ObjectId,
  title: String,
  description: String,
  start_date: Date,
  end_date: Date,
  eligible_skus: [String],    // which product packages qualify
  reward_points_per_unit: Number,
  participants: [
    { user_id: ObjectId, units_returned: Number, points_earned: Number }
  ],
  created_by: ObjectId,       // admin user
};


// ─── INDEXES ─────────────────────────────────────────────────────────────────
// Run these after creating collections:

/*
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ "purchase_patterns.next_predicted_order": 1 });

db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ cedis: 1, is_available: 1 });
db.products.createIndex({ stock: 1 });

db.orders.createIndex({ customer_id: 1, created_at: -1 });
db.orders.createIndex({ repartidor_id: 1, status: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ "tracking.ordered_at": -1 });

db.notifications.createIndex({ user_id: 1, read: 1, sent_at: -1 });

db.substitution_logs.createIndex({ customer_id: 1 });
db.substitution_logs.createIndex({ original_sku: 1, accepted_by_user: 1 });

db.routes.createIndex({ repartidor_id: 1, date: 1 });
*/
