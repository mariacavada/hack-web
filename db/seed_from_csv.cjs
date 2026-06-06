/**
 * Seed desde los CSVs del hackathon
 * Uso: node db/seed_from_csv.js
 * Requiere: npm install csv-parse (en la raíz o en db/)
 */

require("dotenv").config({ path: ".env" });
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "order_rescue";

if (!URI) {
  console.error("Falta MONGODB_URI en .env");
  process.exit(1);
}

function readCsv(filename) {
  const filePath = path.join(__dirname, "..", filename);
  const content = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, ""); // strip BOM
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function toNumber(val) {
  if (val === "" || val == null) return null;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? val : n;
}

async function seed() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Conectado a ${DB_NAME}`);

  // ── Orders ────────────────────────────────────────────────────────────────
  console.log("Cargando Orders.csv...");
  const ordersRaw = readCsv("Orders.csv");
  const orders = ordersRaw.map((row) => ({
    id_pedido: String(row.id_pedido),
    customer_id: String(row.customer_id),
    pais: row.pais,
    id_businessunit: toNumber(row.id_businessunit),
    business_unit: row.business_unit,
    cedis_id: String(row.cedis),
    fecha_pedido: row.fecha_pedido,
    fecha_entrega: row.fecha_entrega || null,
    status_final: (row.status_final || "pendiente").toLowerCase(),
    valor_pedido: toNumber(row.valor_pedido),
    subtotal: toNumber(row.SubTotal),
    total: toNumber(row.Total),
    created_at: new Date(),
  }));

  if (orders.length > 0) {
    await db.collection("orders").deleteMany({});
    await db.collection("orders").insertMany(orders);
    console.log(`  ✓ ${orders.length} orders insertadas`);
  }

  // ── OrderDetails ──────────────────────────────────────────────────────────
  console.log("Cargando OrderDetails.csv...");
  const detailsRaw = readCsv("OrderDetails.csv");
  const details = detailsRaw.map((row) => ({
    id_linea: String(row.id_linea),
    id_pedido: String(row.id_pedido),
    sku_solicitado: String(row.sku_solicitado),
    nombre_sku_solicitado: (row.nombre_sku_solicitado || "").trim(),
    quantity: toNumber(row.Quantity),
    status: (row.Status || "registrado").toLowerCase(),
  }));

  if (details.length > 0) {
    await db.collection("orderdetails").deleteMany({});
    await db.collection("orderdetails").insertMany(details);
    console.log(`  ✓ ${details.length} order details insertadas`);
  }

  // ── Resultados ────────────────────────────────────────────────────────────
  console.log("Cargando Resultados.csv...");
  const resultadosRaw = readCsv("Resultados.csv");
  const resultados = resultadosRaw.map((row) => ({
    id_businessunit: toNumber(row.id_businessunit),
    id_linea: String(row.id_linea),
    id_pedido: String(row.id_pedido),
    sku_solicitado: String(row.sku_solicitado),
    sku_solicitado_hash: String(row.sku_solicitado_hash || ""),
    nombre_sku_solicitado: (row.nombre_sku_solicitado || "").trim(),
    sku_solicitado_cambio: String(row.sku_solicitado_cambio || ""),
    sku_solicitado_cambio_hash: String(row.sku_solicitado_cambio_hash || ""),
    nombre_sku_solicitado_cambio: (row.nombre_sku_solicitado_cambio || "").trim(),
    notificado_al_cliente: false,
    respuesta_cliente: null,
    resultado: null,
    features_ml: {},
    created_at: new Date(),
  }));

  if (resultados.length > 0) {
    await db.collection("resultados").deleteMany({});
    await db.collection("resultados").insertMany(resultados);
    console.log(`  ✓ ${resultados.length} resultados insertados`);
  }

  // ── Índices ───────────────────────────────────────────────────────────────
  console.log("Creando índices...");
  await db.collection("orders").createIndex({ id_pedido: 1 });
  await db.collection("orders").createIndex({ customer_id: 1 });
  await db.collection("orders").createIndex({ cedis_id: 1, status_final: 1 });
  await db.collection("orderdetails").createIndex({ id_pedido: 1 });
  await db.collection("orderdetails").createIndex({ id_linea: 1 }, { sparse: true });
  await db.collection("resultados").createIndex({ id_pedido: 1 });
  await db.collection("resultados").createIndex({ id_linea: 1 });
  await db.collection("resultados").createIndex({ sku_solicitado: 1 });
  console.log("  ✓ Índices creados");

  await client.close();
  console.log("\nSeed completado.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
