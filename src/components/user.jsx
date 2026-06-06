/* global React, Icon, Logo, Avatar, PhoneFrame, ProductImg, Sheet, Toast,
   CATEGORIES, PRODUCTS, ACTIVE_ORDER, SUBSTITUTIONS, ORDER_HISTORY, TRACK_EVENTS */
const { useState, useEffect, useRef } = React;

const STOCK_BADGE = {
  alta: { cls: "badge--success", txt: "Disponible" },
  media: { cls: "badge--warning", txt: "Pocas piezas" },
  baja: { cls: "badge--brand", txt: "Casi agotado" },
};

const ORDER_STATUS_U = {
  recibido: { txt: "Pedido recibido", cls: "badge--info" },
  preparando: { txt: "Preparando", cls: "badge--info" },
  validando: { txt: "Validando inventario", cls: "badge--warning" },
  ruta: { txt: "En ruta", cls: "badge--brand" },
  entregado: { txt: "Entregado", cls: "badge--success" },
};

/* ============================ HOME (mínimo) ============================ */
function UserDashboard({ go, decision, openSub }) {
  return (
    <div className="scr fade-in">
      <div className="row row--between">
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>Buen día,</p>
          <h1 className="h1">Don Ramón</h1>
        </div>
        <button className="btn btn--icon btn--ghost" aria-label="Notificaciones"><Icon name="bell" size={22} /></button>
      </div>

      {/* estado del pedido + próxima entrega */}
      <button className="card card--pad" onClick={() => go("seguimiento")}
        style={{ background: "var(--brand)", color: "#fff", border: "none", textAlign: "left", cursor: "pointer", width: "100%", display: "block" }}>
        <div className="row row--between">
          <span className="badge" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}>
            <span className="dot pulse" style={{ background: "#fff" }} /> Pedido {ACTIVE_ORDER.id}
          </span>
          <Icon name="truck" size={26} />
        </div>
        <h2 className="h2" style={{ color: "#fff", marginTop: 14, fontSize: 23 }}>Tu pedido está en camino</h2>
        <div className="row" style={{ gap: 8, marginTop: 12, color: "rgba(255,255,255,.95)" }}>
          <Icon name="clock" size={18} />
          <span style={{ fontSize: 15 }}>Llega <strong>hoy, 2:00 – 4:00 p. m.</strong></span>
        </div>
        <div className="row" style={{ gap: 6, marginTop: 16 }}>
          {[0,1,2,3,4].map(i => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i <= 2 ? "#fff" : "rgba(255,255,255,.35)" }} />
          ))}
        </div>
      </button>

      {/* alerta de sustitución */}
      {!decision ? (
        <button className="card card--pad pop-in" onClick={openSub}
          style={{ textAlign: "left", cursor: "pointer", borderColor: "var(--brand)", borderWidth: 2, background: "var(--brand-soft)", display: "block", width: "100%" }}>
          <div className="row">
            <span className="lrow__icon" style={{ background: "var(--brand)", color: "#fff" }}><Icon name="alert" size={24} /></span>
            <div className="grow">
              <h3 className="h3" style={{ color: "var(--brand-strong)" }}>Un producto podría agotarse</h3>
              <p className="muted" style={{ margin: "3px 0 0", fontSize: 14.5 }}>Toca para decidir qué hacer. Es rápido.</p>
            </div>
            <Icon name="chevR" size={22} />
          </div>
        </button>
      ) : (
        <div className="card card--pad fade-in" style={{ borderColor: "var(--success)", display: "flex", gap: 14, alignItems: "center" }}>
          <span className="lrow__icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="checkCircle" size={24} /></span>
          <div className="grow">
            <h3 className="h3">Listo, ya quedó</h3>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: 14.5 }}>{decision.label}</p>
          </div>
        </div>
      )}

      {/* botón nuevo pedido */}
      <button className="btn btn--brand btn--block btn--lg" onClick={() => go("catalogo")}>
        <Icon name="plus" size={22} /> Hacer un nuevo pedido
      </button>

      {/* productos frecuentes */}
      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>Lo que más pides</h3>
        <div className="row" style={{ overflowX: "auto", paddingBottom: 4 }}>
          {["p1","p5","p11","p8"].map(id => {
            const p = PRODUCTS.find(x => x.id === id);
            return (
              <button key={id} className="card card--pad" onClick={() => go("catalogo")} style={{ minWidth: 132, flex: "0 0 auto", textAlign: "left", cursor: "pointer" }}>
                <ProductImg label={p.img} size={56} />
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8, lineHeight: 1.25 }}>{p.name}</div>
                <div className="muted mono" style={{ fontSize: 13, marginTop: 2 }}>${p.price}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ PEDIDOS (lista) ============================ */
function UserOrders({ go, decision }) {
  return (
    <div className="scr fade-in">
      <div className="row row--between">
        <h1 className="h1">Mis pedidos</h1>
        <button className="btn btn--brand btn--sm" onClick={() => go("catalogo")}><Icon name="plus" size={18} /> Nuevo</button>
      </div>

      {/* pedido activo */}
      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>En curso</h3>
        <button className="card card--pad" onClick={() => go("seguimiento")} style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", borderColor: "var(--brand)", borderWidth: 2 }}>
          <span className="lrow__icon" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name="truck" size={24} /></span>
          <div className="grow">
            <div className="row" style={{ gap: 8 }}><strong style={{ fontSize: 15.5 }}>{ACTIVE_ORDER.id}</strong><span className={"badge " + ORDER_STATUS_U[ACTIVE_ORDER.status].cls} style={{ fontSize: 11 }}>{ORDER_STATUS_U[ACTIVE_ORDER.status].txt}</span></div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{ACTIVE_ORDER.items.length} productos · llega hoy</div>
          </div>
          <Icon name="chevR" size={22} className="faint" />
        </button>
      </div>

      {/* historial */}
      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>Anteriores</h3>
        <div className="card card--flush">
          {ORDER_HISTORY.map(o => (
            <button key={o.id} className="lrow" style={{ width: "100%", background: "none", border: "none", borderTop: ORDER_HISTORY.indexOf(o) ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left" }}>
              <span className="lrow__icon" style={{ background: "var(--surface-3)" }}><Icon name="package" size={22} /></span>
              <div className="grow">
                <strong>{o.id}</strong>
                <div className="muted" style={{ fontSize: 13.5 }}>{o.date} · {o.items} productos{o.subs > 0 ? ` · ${o.subs} sustituc.` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontWeight: 700 }}>${o.total.toLocaleString("es-MX")}</div>
                <span className="badge badge--success" style={{ fontSize: 10.5, marginTop: 3 }}>Entregado</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn--ghost btn--block" onClick={() => go("catalogo")}>Repetir un pedido anterior</button>
    </div>
  );
}

/* ============================ SUSTITUCIÓN (sheet) ============================ */
function SubSheet({ onClose, onDecide }) {
  const risk = ACTIVE_ORDER.items.find(i => i.atRisk);
  const [picked, setPicked] = useState(SUBSTITUTIONS[0].id);
  const [mode, setMode] = useState("accept");
  return (
    <Sheet onClose={onClose}>
      <div className="row" style={{ gap: 10, marginBottom: 6 }}>
        <span className="badge badge--brand"><Icon name="sparkle" size={14} /> Sugerencia con IA</span>
      </div>
      <h2 className="h2">Este producto podría agotarse</h2>
      <p className="lead" style={{ marginTop: 6, fontSize: 15 }}>No cambiamos nada sin preguntarte. Tú decides. 🙂</p>

      <div className="card card--pad" style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
        <ProductImg label={risk.img} size={58} />
        <div className="grow">
          <strong style={{ fontSize: 15 }}>{risk.name}</strong>
          <div className="muted" style={{ fontSize: 14 }}>{risk.qty} × {risk.unit}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="h2" style={{ color: "var(--brand)" }}>{risk.riskPct}%</div>
          <div className="faint" style={{ fontSize: 12 }}>de faltante</div>
        </div>
      </div>

      <div className="row" style={{ margin: "16px 0 12px" }}>
        <div className="seg grow" style={{ display: "flex" }}>
          <button className="seg__btn grow" aria-pressed={mode === "accept"} onClick={() => setMode("accept")}>Aceptar sugerida</button>
          <button className="seg__btn grow" aria-pressed={mode === "choose"} onClick={() => setMode("choose")}>Elegir otra</button>
        </div>
      </div>

      {(mode === "accept" ? SUBSTITUTIONS.slice(0,1) : SUBSTITUTIONS).map(s => (
        <button key={s.id} onClick={() => setPicked(s.id)} className="card card--pad"
          style={{ width: "100%", textAlign: "left", marginBottom: 10, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
            borderColor: picked === s.id ? "var(--brand)" : "var(--border)", borderWidth: 2 }}>
          <ProductImg label={s.img} size={54} />
          <div className="grow">
            <div className="row" style={{ gap: 8 }}>
              <strong style={{ fontSize: 15 }}>{s.name}</strong>
              {s.best && <span className="badge badge--success" style={{ fontSize: 11 }}>Mejor opción</span>}
            </div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{s.reason}</div>
            <div className="row" style={{ gap: 8, marginTop: 7 }}>
              <div className="meter" style={{ flex: 1, maxWidth: 120 }}><div className="meter__fill" style={{ width: s.match + "%", background: "var(--success)" }} /></div>
              <span className="mono faint" style={{ fontSize: 12 }}>{s.match}% afín</span>
            </div>
          </div>
          <span style={{ width: 24, height: 24, borderRadius: 99, border: "2px solid " + (picked === s.id ? "var(--brand)" : "var(--border-strong)"), display: "grid", placeItems: "center", flex: "0 0 auto" }}>
            {picked === s.id && <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--brand)" }} />}
          </span>
        </button>
      ))}

      <div className="col" style={{ marginTop: 6, gap: 10 }}>
        <button className="btn btn--brand btn--block btn--lg" onClick={() => {
          const s = SUBSTITUTIONS.find(x => x.id === picked);
          onDecide({ type: "accept", label: `Cambiamos Jugo de Naranja por ${s.name}.` });
        }}>
          <Icon name="check" size={20} /> Aceptar esta sustitución
        </button>
        <button className="btn btn--ghost btn--block" onClick={() => onDecide({ type: "none", label: "Dejamos el producto original. Si falta, te reembolsamos." })}>
          No sustituir, mejor reembólsame
        </button>
      </div>
    </Sheet>
  );
}

/* ============================ CATÁLOGO / NUEVO PEDIDO ============================ */
function UserOrder({ back, cart, setCart, onConfirm }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const list = PRODUCTS.filter(p =>
    (cat === "all" || p.cat === cat) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase())));
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((a, [id, n]) => a + n * PRODUCTS.find(p => p.id === id).price, 0);
  const add = (id) => setCart({ ...cart, [id]: (cart[id] || 0) + 1 });
  const sub = (id) => { const n = (cart[id] || 0) - 1; const c = { ...cart }; if (n <= 0) delete c[id]; else c[id] = n; setCart(c); };

  return (
    <div className="scr fade-in" style={{ paddingBottom: count ? 96 : 28 }}>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--icon btn--ghost" onClick={back} aria-label="Volver"><Icon name="chevL" size={22} /></button>
        <h1 className="h1" style={{ fontSize: 24 }}>Nuevo pedido</h1>
      </div>
      <div className="searchbar">
        <Icon name="search" size={20} className="faint" />
        <input placeholder="Buscar producto…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="row" style={{ overflowX: "auto", paddingBottom: 4 }}>
        <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>Todos</button>
        {CATEGORIES.map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>
      <div className="col" style={{ gap: 12 }}>
        {list.map(p => {
          const sb = STOCK_BADGE[p.stock];
          const n = cart[p.id] || 0;
          return (
            <div key={p.id} className="card card--pad" style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <ProductImg label={p.img} size={64} />
              <div className="grow">
                <strong style={{ fontSize: 15.5, lineHeight: 1.25, display: "block" }}>{p.name}</strong>
                <div className="muted" style={{ fontSize: 13.5 }}>{p.unit}</div>
                <div className="row" style={{ gap: 8, marginTop: 6 }}>
                  <span className="mono" style={{ fontWeight: 800, fontSize: 16 }}>${p.price}</span>
                  <span className={"badge " + sb.cls} style={{ fontSize: 11 }}>{sb.txt}</span>
                </div>
              </div>
              {n === 0 ? (
                <button className="btn btn--icon btn--brand" aria-label="Agregar" onClick={() => add(p.id)}><Icon name="plus" size={22} /></button>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn--icon btn--ghost" onClick={() => sub(p.id)} aria-label="Quitar"><Icon name="minus" size={20} /></button>
                  <strong className="mono" style={{ minWidth: 18, textAlign: "center" }}>{n}</strong>
                  <button className="btn btn--icon btn--brand" onClick={() => add(p.id)} aria-label="Agregar"><Icon name="plus" size={20} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {count > 0 && (
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, zIndex: 20 }}>
          <button className="btn btn--brand btn--block btn--lg pop-in" onClick={onConfirm}>
            <Icon name="cart" size={20} /> Confirmar · {count} {count === 1 ? "producto" : "productos"} · <span className="mono">${total}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================ SEGUIMIENTO ============================ */
function UserTracking({ decision }) {
  const [pos, setPos] = useState({ x: 30, y: 78 });
  useEffect(() => {
    const path = [{ x: 30, y: 78 }, { x: 44, y: 60 }, { x: 38, y: 42 }, { x: 58, y: 34 }];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % path.length; setPos(path[i]); }, 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="scr fade-in">
      <h1 className="h1">Seguimiento</h1>
      <span className="badge badge--info" style={{ alignSelf: "flex-start" }}><Icon name="package" size={14} /> Pedido {ACTIVE_ORDER.id}</span>

      <div className="map" style={{ height: 200 }}>
        <div className="map__road" style={{ left: "10%", top: "55%", width: "80%", height: 10, transform: "rotate(-8deg)" }} />
        <div className="map__road" style={{ left: "40%", top: "10%", width: 10, height: "80%" }} />
        <div className="map__road" style={{ left: "15%", top: "30%", width: "55%", height: 8, transform: "rotate(6deg)" }} />
        <div className="map__truck" style={{ left: pos.x + "%", top: pos.y + "%" }}><Icon name="truck" size={20} /></div>
        <div className="map__pin" style={{ left: "58%", top: "34%" }}><Icon name="pin" size={30} fill="var(--brand)" stroke="#fff" /></div>
      </div>
      <div className="card card--pad row" style={{ gap: 14 }}>
        <Avatar name="Carlos Méndez" hue={20} size={48} />
        <div className="grow">
          <strong>Carlos Méndez</strong>
          <div className="muted" style={{ fontSize: 14 }}>Tu repartidor · ⭐ 4.9</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="h3" style={{ color: "var(--brand)" }}>~35 min</div>
          <div className="faint" style={{ fontSize: 12 }}>para llegar</div>
        </div>
      </div>

      <div className="card card--pad">
        <h3 className="h3" style={{ marginBottom: 16 }}>Estado del pedido</h3>
        <div className="steps">
          {TRACK_EVENTS.map((e, i) => (
            <div key={i} className={"step " + (e.state === "done" ? "step--done" : e.state === "active" ? "step--active" : "")}>
              <div className="step__rail">
                <span className="step__bullet"><Icon name={e.state === "todo" ? e.icon : "check"} size={16} stroke={2.6} /></span>
                {i < TRACK_EVENTS.length - 1 && <span className="step__line" />}
              </div>
              <div className="step__body">
                <div className="step__title">{e.t}</div>
                <div className="step__time">{e.time}</div>
                {e.note && !decision && <div className="badge badge--brand" style={{ marginTop: 6, fontSize: 11.5, whiteSpace: "normal", textAlign: "left", lineHeight: 1.3 }}>{e.note}</div>}
                {e.note && decision && <div className="badge badge--success" style={{ marginTop: 6, fontSize: 11.5 }}>Resuelto contigo ✓</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { UserDashboard, UserOrders, SubSheet, UserOrder, UserTracking, STOCK_BADGE, ORDER_STATUS_U });
