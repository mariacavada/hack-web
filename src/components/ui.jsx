/* global React */
const { useState, useEffect, useRef } = React;

/* ============================================================
   ICONS — simple stroke icons (24x24, currentColor)
   ============================================================ */
const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  box: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-5-6.7",
  cart: "M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  chat: "M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3ZM5 11a7 7 0 0 0 14 0M12 18v3",
  recycle: "M7 19h10M9 4l3 5 3-5M5.5 15 8 11M18.5 15 16 11M4 12l-1 4 4 1M20 12l1 4-4 1",
  leaf: "M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16ZM4 21c4-7 8-9 12-10",
  pin: "M12 21s7-5.7 7-12a7 7 0 1 0-14 0c0 6.3 7 12 7 12ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  check: "M5 13l4 4 10-11",
  checkCircle: "M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  x: "M6 6l12 12M18 6 6 18",
  xCircle: "M15 9l-6 6M9 9l6 6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  chevR: "M9 6l6 6-6 6",
  chevL: "M15 6l-6 6 6 6",
  chevD: "M6 9l6 6 6-6",
  alert: "M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z",
  menu: "M3 6h18M3 12h18M3 18h18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4 4l2 2M18 18l2 2M1 12h3M20 12h3M4 20l2-2M18 6l2-2",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
  trend: "M3 17l6-6 4 4 7-8M21 7h-5M21 7v5",
  layers: "M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z",
  camera: "M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  phone: "M21 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z",
  heart: "M19.5 5a5 5 0 0 0-7 0L12 5.5 11.5 5a5 5 0 0 0-7 7l7.5 7.5L19.5 12a5 5 0 0 0 0-7Z",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.2 13.8 7 22l5-3 5 3-1.2-8.2",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  send: "M22 2 11 13M22 2 15 22l-4-9-9-4 20-7Z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14",
  refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 3v5h-5",
  package: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8M16.5 5.5l-9 5",
  zap: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  navigation: "M3 11l19-9-9 19-2-8-8-2Z",
  battery: "M2 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM20 10v4",
  wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  signal: "M2 20h.01M7 20v-4M12 20v-9M17 20V7",
  flag: "M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v9s-1 1-4 1-5-2-8-2-4 1-4 1",
  thumbsUp: "M7 11v9H3v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 6h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 16.7 21H7",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  calendar: "M3 9h18M7 3v4M17 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

function Icon({ name, size = 22, stroke = 2, fill = "none", className = "", style }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} className={className}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: "0 0 auto", ...style }} aria-hidden="true">
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ============================================================
   LOGO — original Order Rescue mark (rescue ring + box)
   ============================================================ */
function Logo({ size = 30, light = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: size * 0.3,
      background: "linear-gradient(145deg, var(--brand), var(--brand-strong))",
      boxShadow: "0 4px 12px rgba(225,36,42,.35)", flex: "0 0 auto" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.4" fill="#fff" stroke="none" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </svg>
    </span>
  );
}

/* ============================================================
   SHARED PRIMITIVES
   ============================================================ */
function Avatar({ name, hue = 8, size = 44 }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36,
      background: `oklch(0.62 0.14 ${hue})` }}>{initials}</span>
  );
}

function StatusBar({ dark }) {
  return (
    <div className="phone__statusbar">
      <span>9:41</span>
      <div className="dots">
        <Icon name="signal" size={15} stroke={2.4} />
        <Icon name="wifi" size={15} stroke={2.4} />
        <Icon name="battery" size={17} stroke={2} />
      </div>
    </div>
  );
}

function PhoneFrame({ children, tabbar }) {
  return (
    <div className="phone">
      <div className="phone__notch" />
      <StatusBar />
      <div className="phone__screen">{children}</div>
      {tabbar}
      <div className="phone__home" />
    </div>
  );
}

/* product image placeholder */
function ProductImg({ label, size = 64, radius = 12 }) {
  return <div className="ph" style={{ width: size, height: size, borderRadius: radius, lineHeight: 1.15, padding: 4 }}>{label}</div>;
}

/* bottom sheet */
function Sheet({ children, onClose }) {
  return (
    <React.Fragment>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__handle" />
        {children}
      </div>
    </React.Fragment>
  );
}

/* generic toast */
function Toast({ icon = "checkCircle", children }) {
  return <div className="toast"><Icon name={icon} size={20} /><span>{children}</span></div>;
}

/* expose */
Object.assign(window, { Icon, Logo, Avatar, StatusBar, PhoneFrame, ProductImg, Sheet, Toast });
