// Deterministic seed data for orders

const PRODUCTS = [
  { name: "Wireless Headphones Pro", sku: "WHP-001", price: 129.99 },
  { name: "Mechanical Keyboard TKL", sku: "MKT-042", price: 89.99 },
  { name: "USB-C Hub 7-in-1",        sku: "UCH-007", price: 49.99 },
  { name: "Ergonomic Mouse",         sku: "ERM-011", price: 64.99 },
  { name: '27" 4K Monitor',          sku: "MON-270", price: 399.99 },
  { name: "Laptop Stand Aluminium",  sku: "LSA-003", price: 39.99 },
  { name: "Webcam 1080p",            sku: "WCM-108", price: 74.99 },
  { name: "LED Desk Lamp",           sku: "LDL-021", price: 34.99 },
];

const STATUSES   = ["pending", "processing", "shipped", "delivered", "cancelled"];
const CARRIERS   = ["FedEx", "UPS", "DHL", "USPS", "BlueDart"];
const CITIES     = ["New York", "San Francisco", "Chicago", "Austin", "Seattle"];
const WAREHOUSES = ["Warehouse A – New Jersey", "Warehouse B – Dallas", "Warehouse C – Phoenix"];

// Simple seeded pseudo-random for stable data across restarts
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

function daysAgo(n)   { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function daysFromNow(n){ const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); }

export function generateOrder(id) {
  const rng         = seeded(id * 31337);
  const rand        = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick        = (arr) => arr[rand(0, arr.length - 1)];

  const statusIndex    = rand(0, STATUSES.length - 1);
  const status         = STATUSES[statusIndex];
  const product        = pick(PRODUCTS);
  const qty            = rand(1, 4);
  const carrier        = pick(CARRIERS);
  const createdDaysAgo = rand(1, 30);

  return {
    id:      `ORD-${String(id).padStart(4, "0")}`,
    status,
    customer: { name: `Customer #${id}`, email: `customer${id}@example.com` },
    item: {
      name:     product.name,
      sku:      product.sku,
      quantity: qty,
      price:    product.price,
      subtotal: parseFloat((product.price * qty).toFixed(2)),
    },
    shipping: {
      carrier,
      tracking_number: `${carrier.toUpperCase().slice(0, 2)}${rand(1e11, 9e11)}`,
      address: `${rand(100, 999)} Main St, ${pick(CITIES)}, US`,
      estimated_delivery: status === "delivered" ? null : daysFromNow(rand(1, 7)),
    },
    payment: {
      method: pick(["Visa •••• 4242", "Mastercard •••• 5555", "PayPal", "Apple Pay"]),
      total:  parseFloat((product.price * qty + 9.99).toFixed(2)),
      paid:   status !== "pending",
    },
    created_at: daysAgo(createdDaysAgo),
    updated_at: daysAgo(rand(0, createdDaysAgo)),
  };
}

export function getTrackingSteps(order) {
  const rng         = seeded(order.id.charCodeAt(4) * 999);
  const rand        = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick        = (arr) => arr[rand(0, arr.length - 1)];
  const statusIndex = STATUSES.indexOf(order.status);

  const steps = [
    { label: "Order Placed",      location: "Online",                          done: true },
    { label: "Payment Confirmed", location: "Payment Gateway",                 done: statusIndex >= 1 },
    { label: "Picked & Packed",   location: pick(WAREHOUSES),                  done: statusIndex >= 2 },
    { label: "Shipped",           location: `${order.shipping.carrier} Hub`,   done: statusIndex >= 2 },
    { label: "Out for Delivery",  location: pick(CITIES),                      done: statusIndex >= 3 },
    { label: "Delivered",         location: order.shipping.address,            done: statusIndex >= 3 },
  ];

  return steps.map((s, i) => ({
    ...s,
    active:    !s.done && (i === 0 || steps[i - 1].done),
    timestamp: s.done ? daysAgo(rand(0, 5)) : null,
  }));
}

// Pre-generate stable order set
export const ORDERS = {};
for (let i = 1001; i <= 1020; i++) {
  const o = generateOrder(i);
  ORDERS[o.id] = o;
}
