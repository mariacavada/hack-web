/* global React, Icon, Logo, Avatar, ProductImg,
   ADMIN_KPIS, ADMIN_ORDERS, INVENTORY_RISK, SUB_INSIGHTS, DELIVERERS, ADMIN_USERS, WEEK_SUBS */
const { useState, useEffect } = React;

const ORDER_STATUS = {
  preparando: { cls: "badge--info", txt: "Preparando" },
  validando: { cls: "badge--warning", txt: "Validando" },
  ruta: { cls: "badge--brand", txt: "En ruta" },
  entregado: { cls: "badge--success", txt: "Entregado" },
};

function riskColor(pct) {
  if (pct >= 65) return "var(--brand)";
  if (pct >= 45) return "var(--warning)";
  return "var(--success)";
}

/* ============================ DASHBOARD / KPIs ============================ */
function AdminDashboard() {
  const max = Math.max(...WEEK_SUBS.map(w => w.v));
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Resumen ejecutivo</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 22 }}>Operación en tiempo real · 6 de junio, 2026</p>

      <div className="kpi-grid">
        {ADMIN_KPIS.map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi__label">{k.label}</div>
            <div className="kpi__val">{k.val}</div>
            <div className="kpi__delta" style={{ color: k.up ? "var(--success)" : "var(--brand)" }}>
              <Icon name="trend" size={14} style={{ display: "inline", verticalAlign: "-2px", transform: k.up ? "none" : "scaleY(-1)" }} /> {k.delta} vs. ayer
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Sustituciones por día</h3><span className="badge badge--neutral">Últimos 7 días</span></div>
          <div className="bars">
            {WEEK_SUBS.map(w => (
              <div key={w.d} className="bars__col">
                <span className="mono faint" style={{ fontSize: 12 }}>{w.v}</span>
                <div className="bars__bar" style={{ height: (w.v / max * 100) + "%", background: w.d === "Sáb" ? "var(--brand)" : "color-mix(in srgb, var(--brand) 55%, var(--surface-3))" }} />
                <span className="bars__lbl">{w.d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Salud de inventario</h3><Icon name="sparkle" size={18} style={{ color: "var(--brand)" }} /></div>
          <div className="col" style={{ gap: 14 }}>
            {INVENTORY_RISK.slice(0, 4).map(p => (
              <div key={p.name}>
                <div className="row row--between" style={{ marginBottom: 5 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</span><span className="mono" style={{ fontSize: 13, fontWeight: 700, color: riskColor(p.pct) }}>{p.pct}%</span></div>
                <div className="meter"><div className="meter__fill" style={{ width: p.pct + "%", background: riskColor(p.pct) }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ PEDIDOS ============================ */
function AdminOrders() {
  const [region, setRegion] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [sel, setSel] = useState(null);
  const regions = ["Todas", "Centro", "Norte", "Sur", "Oriente"];
  const statuses = ["Todos", "preparando", "validando", "ruta", "entregado"];
  const list = ADMIN_ORDERS.filter(o => (region === "Todas" || o.region === region) && (status === "Todos" || o.status === status));
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Gestión de pedidos</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>{list.length} pedidos · filtra y revisa el detalle</p>

      <div className="row wrap" style={{ gap: 8, marginBottom: 16 }}>
        <Icon name="filter" size={18} className="faint" />
        {regions.map(r => <button key={r} className="chip" aria-pressed={region === r} onClick={() => setRegion(r)}>{r}</button>)}
        <span style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />
        {statuses.map(s => <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>{s === "Todos" ? "Todos" : ORDER_STATUS[s].txt}</button>)}
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Región</th><th>Estado</th><th>Fecha</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id} onClick={() => setSel(o)}>
                <td><strong className="mono">{o.id}</strong>{o.risk && <span className="badge badge--brand" style={{ marginLeft: 8, fontSize: 10.5 }}>Riesgo</span>}</td>
                <td>{o.client}</td>
                <td className="muted">{o.region}</td>
                <td><span className={"badge " + ORDER_STATUS[o.status].cls}>{ORDER_STATUS[o.status].txt}</span></td>
                <td className="muted">{o.date}</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>${o.total.toLocaleString("es-MX")}</td>
                <td style={{ textAlign: "right" }}><Icon name="chevR" size={18} className="faint" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && (
        <React.Fragment>
          <div className="sheet-scrim" onClick={() => setSel(null)} style={{ position: "fixed" }} />
          <div className="pop-in" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, width: 460, maxWidth: "92vw", background: "var(--surface)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-lg)", padding: 24 }}>
            <div className="row row--between"><h2 className="h2">{sel.id}</h2><button className="btn btn--icon btn--ghost" onClick={() => setSel(null)} aria-label="Cerrar"><Icon name="x" size={20} /></button></div>
            <p className="muted" style={{ marginTop: 4 }}>{sel.client} · {sel.region}</p>
            <div className="row" style={{ gap: 8, margin: "12px 0" }}><span className={"badge " + ORDER_STATUS[sel.status].cls}>{ORDER_STATUS[sel.status].txt}</span>{sel.risk && <span className="badge badge--brand"><Icon name="alert" size={13} /> Riesgo de faltante</span>}</div>
            <div className="card card--flush" style={{ marginTop: 8 }}>
              {ADMIN_ORDERS.indexOf(sel) >= 0 && [["Refresco Cola 600 ml","×4"],["Agua Natural 1 L","×3"],["Jugo de Naranja 1 L","×2"]].map(([n,q]) => (
                <div key={n} className="lrow" style={{ padding: "12px 16px" }}><div className="grow"><strong style={{ fontSize: 14 }}>{n}</strong></div><span className="mono">{q}</span></div>
              ))}
            </div>
            <div className="row row--between" style={{ marginTop: 16 }}><span className="muted">Total</span><span className="mono h3">${sel.total.toLocaleString("es-MX")}</span></div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ============================ PREDICCIÓN INVENTARIO ============================ */
function AdminInventory() {
  const regions = ["Centro", "Norte", "Sur", "Oriente"];
  const cats = ["Refrescos", "Agua", "Jugos", "Energéticas"];
  // deterministic heat values
  const heat = (r, c) => ((r * 7 + c * 13 + 11) % 100);
  return (
    <div className="fade-in">
      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
        <h1 className="h1">Predicción de inventario</h1>
        <span className="badge badge--brand"><Icon name="sparkle" size={14} /> IA</span>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>Modelo predictivo de faltantes · actualizado hace 12 min</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Productos con riesgo de agotarse</h3></div>
          <div className="col" style={{ gap: 16 }}>
            {INVENTORY_RISK.map(p => (
              <div key={p.name} className="row" style={{ gap: 14 }}>
                <div className="grow">
                  <div className="row row--between" style={{ marginBottom: 5 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span><span className="badge badge--neutral" style={{ fontSize: 10.5 }}>{p.region}</span></div>
                  <div className="meter"><div className="meter__fill" style={{ width: p.pct + "%", background: riskColor(p.pct) }} /></div>
                </div>
                <div style={{ textAlign: "right", minWidth: 64 }}><div className="mono" style={{ fontWeight: 800, fontSize: 17, color: riskColor(p.pct) }}>{p.pct}%</div><div className="faint" style={{ fontSize: 11.5 }}>en ~{p.hours}h</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Mapa de calor por región</h3></div>
          <div className="heat" style={{ gridTemplateColumns: "90px repeat(" + cats.length + ", 1fr)" }}>
            <div></div>
            {cats.map(c => <div key={c} className="bars__lbl" style={{ textAlign: "center" }}>{c}</div>)}
            {regions.map((r, ri) => (
              <React.Fragment key={r}>
                <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" }}>{r}</div>
                {cats.map((c, ci) => {
                  const v = heat(ri, ci);
                  return <div key={c} className="heat__cell" style={{ background: `color-mix(in srgb, var(--brand) ${v}%, var(--surface-3))`, color: v > 55 ? "#fff" : "var(--text-muted)" }}>{v}</div>;
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="row" style={{ gap: 12, marginTop: 16, justifyContent: "center" }}>
            <span className="faint" style={{ fontSize: 12 }}>Menor riesgo</span>
            <div style={{ flex: 1, maxWidth: 140, height: 8, borderRadius: 99, background: "linear-gradient(90deg, var(--surface-3), var(--brand))" }} />
            <span className="faint" style={{ fontSize: 12 }}>Mayor riesgo</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16, background: "var(--brand-soft)", borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)" }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="lrow__icon" style={{ background: "var(--brand)", color: "#fff" }}><Icon name="sparkle" size={22} /></span>
          <div><strong style={{ color: "var(--brand-strong)" }}>Recomendación de la IA</strong><p style={{ margin: "3px 0 0", fontSize: 14, color: "var(--brand-strong)" }}>Reabastece <strong>Jugo de Naranja 1 L</strong> en CEDIS Centro antes de 6 h para evitar 18 sustituciones proyectadas hoy.</p></div>
        </div>
      </div>
    </div>
  );
}

/* ============================ SUSTITUCIONES ============================ */
function AdminSubs() {
  const s = SUB_INSIGHTS;
  const maxC = Math.max(...s.topSubstituted.map(t => t.count));
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Sustituciones</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>Aprendizaje del modelo · insights automáticos</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Productos más sustituidos</h3></div>
          <div className="col" style={{ gap: 14 }}>
            {s.topSubstituted.map(t => (
              <div key={t.name}>
                <div className="row row--between" style={{ marginBottom: 5 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span><span className="mono faint">{t.count}</span></div>
                <div className="meter"><div className="meter__fill" style={{ width: (t.count / maxC * 100) + "%" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Aceptación de sugerencias</h3></div>
          <div className="row" style={{ gap: 24, justifyContent: "center", padding: "10px 0" }}>
            <div style={{ position: "relative", width: 150, height: 150 }}>
              <svg width="150" height="150" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-3)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" strokeWidth="4" strokeDasharray={`${s.accepted} ${100 - s.accepted}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", flexDirection: "column" }}>
                <div className="h1" style={{ color: "var(--success)" }}>{s.accepted}%</div>
                <div className="faint" style={{ fontSize: 12 }}>aceptadas</div>
              </div>
            </div>
            <div className="col" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 8 }}><span className="dot" style={{ background: "var(--success)" }} /><span>Aceptadas <strong>{s.accepted}%</strong></span></div>
              <div className="row" style={{ gap: 8 }}><span className="dot" style={{ background: "var(--surface-3)" }} /><span>Rechazadas <strong>{s.rejected}%</strong></span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 16 }}>
        {[["Aprende preferencias","La IA construye un perfil por cliente con cada decisión.","sparkle"],["Detecta patrones","Identifica qué cambios funcionan por región y temporada.","trend"],["Mejora continua","Cada aceptación o rechazo reentrena las sugerencias.","refresh"]].map(([t,d,ic]) => (
          <div key={t} className="panel"><span className="lrow__icon" style={{ background: "var(--brand-soft)", color: "var(--brand)", marginBottom: 10 }}><Icon name={ic} size={22} /></span><strong style={{ display: "block", marginBottom: 4 }}>{t}</strong><span className="muted" style={{ fontSize: 13.5 }}>{d}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ============================ REPARTIDORES ============================ */
function AdminDeliverers() {
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Supervisión de repartidores</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>{DELIVERERS.length} repartidores activos · ubicación en vivo</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div className="map" style={{ height: 420 }}>
          <div className="map__road" style={{ left: "5%", top: "50%", width: "90%", height: 12, transform: "rotate(-5deg)" }} />
          <div className="map__road" style={{ left: "50%", top: "5%", width: 12, height: "90%" }} />
          <div className="map__road" style={{ left: "15%", top: "25%", width: "55%", height: 9, transform: "rotate(10deg)" }} />
          {DELIVERERS.map(d => (
            <div key={d.name} style={{ position: "absolute", left: d.x + "%", top: d.y + "%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <span style={{ width: 40, height: 40, borderRadius: 99, background: `oklch(0.62 0.14 ${d.hue})`, color: "#fff", display: "grid", placeItems: "center", boxShadow: "var(--sh-md)", border: "2px solid var(--surface)" }}><Icon name="truck" size={18} /></span>
              <span className="badge badge--neutral" style={{ fontSize: 10, marginTop: 4, display: "block" }}>{d.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <div className="col" style={{ gap: 12 }}>
          {DELIVERERS.map(d => (
            <div key={d.name} className="panel" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={d.name} hue={d.hue} size={44} />
              <div className="grow"><strong style={{ fontSize: 14.5 }}>{d.name}</strong><div className="muted" style={{ fontSize: 13 }}>{d.route} · {d.pending} pendientes</div></div>
              <div style={{ textAlign: "right" }}><div className="mono" style={{ fontWeight: 800, color: d.eff >= 95 ? "var(--success)" : "var(--warning)" }}>{d.eff}%</div><div className="faint" style={{ fontSize: 11 }}>eficiencia</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ USUARIOS ============================ */
function AdminUsers() {
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Gestión de usuarios</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>Clientes B2B · historial y preferencias</p>
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Región</th><th style={{ textAlign: "center" }}>Pedidos</th><th>Preferencia de sustitución</th><th></th></tr></thead>
          <tbody>
            {ADMIN_USERS.map(u => (
              <tr key={u.name}>
                <td><div className="row" style={{ gap: 10 }}><Avatar name={u.name} hue={u.hue} size={36} /><strong>{u.name}</strong></div></td>
                <td className="muted">{u.region}</td>
                <td className="mono" style={{ textAlign: "center", fontWeight: 700 }}>{u.orders}</td>
                <td><span className="badge badge--neutral">{u.subs}</span></td>
                <td style={{ textAlign: "right" }}><button className="btn btn--sm btn--ghost">Ver perfil</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ RECICLAJE ============================ */
function AdminRecycle() {
  const byRegion = [
    { d: "Centro", v: 1840 }, { d: "Norte", v: 1210 }, { d: "Sur", v: 1560 }, { d: "Oriente", v: 980 },
  ];
  const max = Math.max(...byRegion.map(r => r.v));
  const top = [
    { name: "Minisúper El Sol", env: 412, hue: 250 },
    { name: "Tienda Don Ramón", env: 386, hue: 20 },
    { name: "Abarrotes La Esquina", env: 274, hue: 150 },
    { name: "Tienda Lupita", env: 198, hue: 320 },
  ];
  return (
    <div className="fade-in">
      <h1 className="h1" style={{ marginBottom: 4 }}>Campaña de reciclaje</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>Impacto ambiental y participación de clientes</p>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[["5,590","Envases recuperados","recycle"],["689 kg","CO₂ evitado","leaf"],["142","Clientes activos","users"],["+18%","vs. mes anterior","trend"]].map(([v,l,ic]) => (
          <div key={l} className="kpi">
            <span className="lrow__icon" style={{ background: "var(--success-soft)", color: "var(--success)", width: 38, height: 38 }}><Icon name={ic} size={20} /></span>
            <div className="kpi__val" style={{ fontSize: 26 }}>{v}</div>
            <div className="kpi__label">{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Envases recuperados por región</h3><span className="badge badge--neutral">Este mes</span></div>
          <div className="bars">
            {byRegion.map(r => (
              <div key={r.d} className="bars__col">
                <span className="mono faint" style={{ fontSize: 12 }}>{r.v.toLocaleString("es-MX")}</span>
                <div className="bars__bar" style={{ height: (r.v / max * 100) + "%", background: "var(--success)" }} />
                <span className="bars__lbl">{r.d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel__head"><h3 className="h3">Top recicladores</h3><Icon name="award" size={18} style={{ color: "var(--warning)" }} /></div>
          <div className="col" style={{ gap: 12 }}>
            {top.map((t, i) => (
              <div key={t.name} className="row" style={{ gap: 12 }}>
                <span className="mono" style={{ fontWeight: 800, color: "var(--text-faint)", width: 18 }}>{i + 1}</span>
                <Avatar name={t.name} hue={t.hue} size={36} />
                <strong className="grow" style={{ fontSize: 14 }}>{t.name}</strong>
                <span className="mono" style={{ fontWeight: 700, color: "var(--success)" }}>{t.env}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ ADMIN SHELL ============================ */
function AdminApp() {
  const [view, setView] = useState("dashboard");
  const nav = [
    { id: "dashboard", label: "Resumen", icon: "grid" },
    { id: "orders", label: "Pedidos", icon: "list" },
    { id: "inventory", label: "Predicción IA", icon: "trend" },
    { id: "subs", label: "Analítica", icon: "refresh" },
    { id: "deliverers", label: "Repartidores", icon: "truck" },
    { id: "users", label: "Usuarios", icon: "users" },
    { id: "recycle", label: "Reciclaje", icon: "recycle" },
  ];
  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand"><Logo size={34} /> Order Rescue</div>
        {nav.map(n => (
          <button key={n.id} className="nav-item" aria-current={view === n.id} onClick={() => setView(n.id)}>
            <Icon name={n.icon} size={20} /> {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="nav-item" style={{ cursor: "default" }}><Avatar name="Admin Arca" hue={250} size={34} /> <div style={{ lineHeight: 1.2 }}><div style={{ fontSize: 13.5, color: "var(--text)" }}>Admin</div><div className="faint" style={{ fontSize: 11.5 }}>Centro de control</div></div></div>
      </aside>
      <main className="admin__main">
        <div className="admin__topbar">
          <div className="searchbar" style={{ width: 280 }}><Icon name="search" size={18} className="faint" /><input placeholder="Buscar pedido, cliente…" /></div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn--icon btn--ghost" aria-label="Notificaciones" style={{ position: "relative" }}><Icon name="bell" size={20} /><span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 99, background: "var(--brand)" }} /></button>
            <Avatar name="Admin Arca" hue={250} size={40} />
          </div>
        </div>
        {view === "dashboard" && <AdminDashboard />}
        {view === "orders" && <AdminOrders />}
        {view === "inventory" && <AdminInventory />}
        {view === "subs" && <AdminSubs />}
        {view === "deliverers" && <AdminDeliverers />}
        {view === "users" && <AdminUsers />}
        {view === "recycle" && <AdminRecycle />}
      </main>
    </div>
  );
}

Object.assign(window, { AdminApp });
