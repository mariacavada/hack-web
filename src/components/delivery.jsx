/* global React, Icon, Logo, Avatar, PhoneFrame, ProductImg, Sheet, Toast,
   DELIVERY_STOPS, DELIVERY_PROFILE, ACTIVE_ORDER */
const { useState, useEffect, useRef } = React;

const DEL_STATUS = {
  pendiente: { cls: "badge--warning", txt: "Pendiente" },
  entregado: { cls: "badge--success", txt: "Entregado" },
};

const INCIDENTS = [
  { id: "OR-4772", client: "Abarrotes Mary", type: "Producto dañado", time: "11:24 a. m.", state: "resuelto" },
  { id: "OR-4690", client: "Tienda El Roble", type: "Cliente ausente", time: "Ayer, 5:10 p. m.", state: "enviado" },
];

/* ============================ INICIO ============================ */
function DelDashboard({ go, started, setStarted, toast }) {
  const pending = DELIVERY_STOPS.filter(s => s.status === "pendiente");
  const done = DELIVERY_STOPS.filter(s => s.status === "entregado");
  const next = pending[0];
  return (
    <div className="scr fade-in">
      <div className="row row--between">
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>Buenos días,</p>
          <h1 className="h1">Carlos 🚚</h1>
        </div>
        <Avatar name="Carlos Méndez" hue={20} size={50} />
      </div>

      <div className="grid-3">
        {[[pending.length,"Pendientes"],[done.length,"Hechas"],["Centro","Ruta"]].map(([v,l]) => (
          <div key={l} className="card card--pad" style={{ textAlign: "center", padding: 14 }}>
            <div className="h2" style={{ color: "var(--brand)", fontSize: l === "Ruta" ? 17 : 24 }}>{v}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>{l}</div>
          </div>
        ))}
      </div>

      {!started ? (
        <button className="btn btn--brand btn--block btn--lg" onClick={() => { setStarted(true); toast("¡Ruta iniciada! Compartiendo tu ubicación. 📍"); }}>
          <Icon name="navigation" size={22} /> Iniciar ruta
        </button>
      ) : (
        <div className="card card--pad row" style={{ gap: 12, borderColor: "var(--success)" }}>
          <span className="dot pulse" style={{ background: "var(--success)" }} />
          <strong style={{ color: "var(--success)" }}>Ruta en curso · GPS activo</strong>
          <button className="btn btn--sm btn--ghost" style={{ marginLeft: "auto" }} onClick={() => go("ruta")}>Ver mapa</button>
        </div>
      )}

      {next && (
        <div>
          <div className="row row--between" style={{ marginBottom: 10 }}><h3 className="h3">Próxima parada</h3><button className="btn btn--sm btn--ghost" onClick={() => go("pedidos")}>Ver todas</button></div>
          <button className="card card--pad" onClick={() => go("detalle", next)} style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", borderColor: "var(--brand)", borderWidth: 2 }}>
            <span className="lrow__icon" style={{ background: "var(--brand)", color: "#fff", fontWeight: 800 }}>1</span>
            <div className="grow">
              <div className="row" style={{ gap: 8 }}><strong style={{ fontSize: 15.5 }}>{next.client}</strong>{next.subs > 0 && <span className="badge badge--brand" style={{ fontSize: 10.5 }}>{next.subs} sustituc.</span>}</div>
              <div className="muted" style={{ fontSize: 13.5 }}>{next.addr}</div>
              <div className="faint" style={{ fontSize: 13, marginTop: 3 }}>{next.items} productos · {next.eta}</div>
            </div>
            <Icon name="chevR" size={22} className="faint" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================ PEDIDOS (lista de entregas) ============================ */
function DelOrders({ go }) {
  return (
    <div className="scr fade-in">
      <h1 className="h1">Entregas de hoy</h1>
      <div className="col" style={{ gap: 12 }}>
        {DELIVERY_STOPS.map((s, i) => {
          const st = DEL_STATUS[s.status];
          return (
            <button key={s.id} className="card card--pad" onClick={() => go("detalle", s)}
              style={{ textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", opacity: s.status === "entregado" ? .6 : 1 }}>
              <span className="lrow__icon" style={{ background: s.status === "entregado" ? "var(--success-soft)" : "var(--brand-soft)", color: s.status === "entregado" ? "var(--success)" : "var(--brand)", fontWeight: 800 }}>
                {s.status === "entregado" ? <Icon name="check" size={22} stroke={2.6} /> : i + 1}
              </span>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}><strong style={{ fontSize: 15.5 }}>{s.client}</strong>{s.subs > 0 && <span className="badge badge--brand" style={{ fontSize: 10.5 }}>{s.subs} sustituc.</span>}</div>
                <div className="muted" style={{ fontSize: 13.5 }}>{s.addr}</div>
                <div className="faint" style={{ fontSize: 13, marginTop: 3 }}>{s.items} productos · {s.eta}</div>
              </div>
              <span className={"badge " + st.cls}>{st.txt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ DETALLE PEDIDO ============================ */
function DelDetail({ stop, back, go }) {
  const items = ACTIVE_ORDER.items;
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--icon btn--ghost" onClick={back} aria-label="Volver"><Icon name="chevL" size={22} /></button>
        <h1 className="h1" style={{ fontSize: 22 }}>{stop.id}</h1>
      </div>

      <div className="card card--pad col" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={stop.client} hue={20} size={46} />
          <div className="grow"><strong style={{ fontSize: 16 }}>{stop.client}</strong><div className="muted" style={{ fontSize: 13.5 }}>{stop.addr}</div></div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn--outline grow"><Icon name="navigation" size={18} /> Navegar</button>
          <button className="btn btn--ghost grow"><Icon name="phone" size={18} /> Llamar</button>
        </div>
      </div>

      {stop.subs > 0 && (
        <div className="card card--pad row" style={{ gap: 12, background: "var(--brand-soft)", borderColor: "var(--brand)" }}>
          <Icon name="sparkle" size={22} style={{ color: "var(--brand)" }} />
          <div className="grow"><strong style={{ color: "var(--brand-strong)" }}>1 sustitución aprobada</strong><div style={{ fontSize: 13.5, color: "var(--brand-strong)" }}>El cliente aceptó Néctar Durazno en lugar de Jugo de Naranja.</div></div>
        </div>
      )}

      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>Productos a entregar</h3>
        <div className="card card--flush">
          {items.map((it, i) => (
            <div key={i} className="lrow">
              <ProductImg label={it.atRisk ? "DURAZNO" : it.img} size={48} radius={11} />
              <div className="grow">
                <strong style={{ fontSize: 14.5 }}>{it.atRisk ? "Néctar Durazno 1 L" : it.name}</strong>
                {it.atRisk && <div><span className="badge badge--brand" style={{ fontSize: 10.5, marginTop: 3 }}>Sustitución</span></div>}
              </div>
              <strong className="mono">×{it.qty}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card card--pad">
        <div className="label" style={{ marginBottom: 4 }}>Notas del cliente</div>
        <p style={{ margin: 0, fontSize: 14.5 }}>“Tocar el timbre dos veces. Recibe en la entrada lateral.”</p>
      </div>

      <div className="col" style={{ gap: 10 }}>
        <button className="btn btn--brand btn--block btn--lg" onClick={() => go("confirm", stop)}><Icon name="checkCircle" size={20} /> Confirmar entrega</button>
        <button className="btn btn--ghost btn--block" onClick={() => go("problema", stop)}><Icon name="alert" size={18} /> Reportar incidencia</button>
      </div>
    </div>
  );
}

/* ============================ CONFIRMACIÓN ENTREGA ============================ */
function DelConfirm({ stop, back, onDone }) {
  const [mode, setMode] = useState("completa");
  const [reason, setReason] = useState("faltante");
  const [photo, setPhoto] = useState(false);
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--icon btn--ghost" onClick={back} aria-label="Volver"><Icon name="chevL" size={22} /></button>
        <h1 className="h1" style={{ fontSize: 22 }}>Confirmar entrega</h1>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>{stop.client} · {stop.id}</p>

      <div className="seg" style={{ display: "flex" }}>
        <button className="seg__btn grow" aria-pressed={mode === "completa"} onClick={() => setMode("completa")}>Completa</button>
        <button className="seg__btn grow" aria-pressed={mode === "incompleta"} onClick={() => setMode("incompleta")}>Incompleta</button>
      </div>

      {mode === "incompleta" && (
        <div className="card card--pad col fade-in" style={{ gap: 10 }}>
          <div className="label">¿Qué ocurrió?</div>
          {[["faltante","Producto faltante"],["dañado","Producto dañado"],["sustitucion","Sustitución realizada"]].map(([id,l]) => (
            <button key={id} className="row" onClick={() => setReason(id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0" }}>
              <span style={{ width: 24, height: 24, borderRadius: 99, border: "2px solid " + (reason === id ? "var(--brand)" : "var(--border-strong)"), display: "grid", placeItems: "center", flex: "0 0 auto" }}>{reason === id && <span style={{ width: 12, height: 12, borderRadius: 99, background: "var(--brand)" }} />}</span>
              <span style={{ fontSize: 15 }}>{l}</span>
            </button>
          ))}
        </div>
      )}

      <button className="card card--pad" onClick={() => setPhoto(!photo)} style={{ cursor: "pointer", textAlign: "center", borderStyle: "dashed", borderWidth: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 24, color: photo ? "var(--success)" : "var(--text-muted)" }}>
        <Icon name={photo ? "checkCircle" : "camera"} size={34} />
        <strong>{photo ? "Foto adjuntada ✓" : "Enviar evidencia fotográfica"}</strong>
        {!photo && <span className="faint" style={{ fontSize: 13 }}>Toca para tomar una foto</span>}
      </button>

      <button className="btn btn--brand btn--block btn--lg" onClick={onDone}><Icon name="check" size={20} /> Finalizar entrega</button>
    </div>
  );
}

/* ============================ PROBLEMA / INCIDENCIA ============================ */
function DelProblem({ stop, back, onDone }) {
  const [sel, setSel] = useState(null);
  const opts = [
    { id: "faltante", t: "Producto faltante", icon: "package" },
    { id: "incorrecto", t: "Producto incorrecto", icon: "xCircle" },
    { id: "ausente", t: "Cliente ausente", icon: "user" },
  ];
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--icon btn--ghost" onClick={back} aria-label="Volver"><Icon name="chevL" size={22} /></button>
        <h1 className="h1" style={{ fontSize: 22 }}>Reportar incidencia</h1>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>{stop ? `${stop.client} · ${stop.id} · ` : ""}Se avisará al administrador al instante.</p>
      <div className="col" style={{ gap: 12 }}>
        {opts.map(o => (
          <button key={o.id} className="card card--pad row" onClick={() => setSel(o.id)} style={{ gap: 14, cursor: "pointer", borderColor: sel === o.id ? "var(--brand)" : "var(--border)", borderWidth: 2 }}>
            <span className="lrow__icon" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name={o.icon} size={22} /></span>
            <strong className="grow" style={{ textAlign: "left" }}>{o.t}</strong>
            {sel === o.id && <Icon name="checkCircle" size={22} style={{ color: "var(--brand)" }} />}
          </button>
        ))}
      </div>
      <button className="btn btn--brand btn--block btn--lg" disabled={!sel} style={!sel ? { opacity: .5 } : {}} onClick={onDone}>
        <Icon name="send" size={18} /> Enviar reporte
      </button>
    </div>
  );
}

/* ============================ INCIDENCIAS (lista) ============================ */
function DelIncidents({ go }) {
  const STATE = { resuelto: { cls: "badge--success", txt: "Resuelto" }, enviado: { cls: "badge--warning", txt: "Enviado" } };
  return (
    <div className="scr fade-in">
      <h1 className="h1">Incidencias</h1>
      <button className="btn btn--brand btn--block btn--lg" onClick={() => go("problema", null)}>
        <Icon name="alert" size={20} /> Reportar incidencia
      </button>
      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>Reportes recientes</h3>
        {INCIDENTS.length === 0 ? (
          <div className="card card--pad" style={{ textAlign: "center", color: "var(--text-muted)" }}>Sin incidencias hoy 🎉</div>
        ) : (
          <div className="card card--flush">
            {INCIDENTS.map((inc, i) => (
              <div key={inc.id} className="lrow" style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                <span className="lrow__icon" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name="alert" size={20} /></span>
                <div className="grow"><strong style={{ fontSize: 14.5 }}>{inc.type}</strong><div className="muted" style={{ fontSize: 13 }}>{inc.client} · {inc.id} · {inc.time}</div></div>
                <span className={"badge " + STATE[inc.state].cls}>{STATE[inc.state].txt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ RUTA / MAPA ============================ */
function DelMap() {
  const [pos, setPos] = useState(0);
  const path = [{ x: 22, y: 80 }, { x: 40, y: 64 }, { x: 34, y: 44 }, { x: 56, y: 36 }, { x: 72, y: 22 }];
  useEffect(() => { const t = setInterval(() => setPos(p => (p + 1) % path.length), 1500); return () => clearInterval(t); }, []);
  const cur = path[pos];
  return (
    <div className="scr fade-in">
      <h1 className="h1">Ruta inteligente</h1>
      <p className="lead" style={{ fontSize: 15, marginTop: -6 }}>Optimizada por distancia, tráfico y prioridad. 🧭</p>
      <div className="map" style={{ height: 280 }}>
        <div className="map__road" style={{ left: "5%", top: "60%", width: "90%", height: 12, transform: "rotate(-10deg)" }} />
        <div className="map__road" style={{ left: "45%", top: "5%", width: 12, height: "90%" }} />
        <div className="map__road" style={{ left: "10%", top: "30%", width: "60%", height: 9, transform: "rotate(8deg)" }} />
        {path.map((p, i) => (
          <div key={i} className="map__pin" style={{ left: p.x + "%", top: (p.y - 4) + "%" }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: i < pos ? "var(--success)" : "var(--surface)", border: "2px solid " + (i < pos ? "var(--success)" : "var(--brand)"), color: i < pos ? "#fff" : "var(--brand)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, transform: "translateY(100%)" }}>{i + 1}</span>
          </div>
        ))}
        <div className="map__truck" style={{ left: cur.x + "%", top: cur.y + "%" }}><Icon name="truck" size={20} /></div>
      </div>
      <div className="card card--pad row" style={{ gap: 14 }}>
        <span className="lrow__icon" style={{ background: "var(--info-soft)", color: "var(--info)" }}><Icon name="navigation" size={22} /></span>
        <div className="grow"><strong>Siguiente parada</strong><div className="muted" style={{ fontSize: 14 }}>{DELIVERY_STOPS[pos % 2].client}</div></div>
        <div style={{ textAlign: "right" }}><div className="h3" style={{ color: "var(--brand)" }}>1.2 km</div><div className="faint" style={{ fontSize: 12 }}>~6 min</div></div>
      </div>
      <div className="grid-2">
        <div className="card card--pad" style={{ textAlign: "center" }}><div className="h2" style={{ color: "var(--success)" }}>18 km</div><div className="muted" style={{ fontSize: 13 }}>ruta total</div></div>
        <div className="card card--pad" style={{ textAlign: "center" }}><div className="h2" style={{ color: "var(--success)" }}>−23%</div><div className="muted" style={{ fontSize: 13 }}>vs. ruta normal</div></div>
      </div>
    </div>
  );
}

/* ============================ PERFIL ============================ */
function DelProfile() {
  const p = DELIVERY_PROFILE;
  return (
    <div className="scr fade-in">
      <div className="col" style={{ alignItems: "center", textAlign: "center", gap: 10, paddingTop: 10 }}>
        <Avatar name={p.name} hue={p.hue} size={84} />
        <div><h1 className="h1" style={{ fontSize: 24 }}>{p.name}</h1><p className="muted" style={{ margin: 0 }}>{p.route}</p></div>
        <span className="badge badge--success"><Icon name="star" size={14} fill="currentColor" /> {p.rating} de calificación</span>
      </div>
      <div className="grid-2">
        <div className="card card--pad" style={{ textAlign: "center" }}><div className="h1" style={{ color: "var(--brand)" }}>{p.delivered.toLocaleString("es-MX")}</div><div className="muted" style={{ fontSize: 13.5 }}>entregas realizadas</div></div>
        <div className="card card--pad" style={{ textAlign: "center" }}><div className="h1" style={{ color: "var(--brand)" }}>{p.avgTime}</div><div className="muted" style={{ fontSize: 13.5 }}>tiempo promedio</div></div>
      </div>
      <div className="card card--flush">
        {[["navigation","Mis rutas"],["award","Logros y bonos"],["settings","Configuración"],["logout","Cerrar sesión"]].map(([ic,t]) => (
          <div key={t} className="lrow"><span className="lrow__icon" style={{ background: "var(--surface-3)" }}><Icon name={ic} size={20} /></span><strong className="grow">{t}</strong><Icon name="chevR" size={20} className="faint" /></div>
        ))}
      </div>
    </div>
  );
}

/* ============================ DELIVERY APP SHELL ============================ */
function DeliveryApp() {
  const [stack, setStack] = useState([{ screen: "inicio" }]);
  const [tab, setTab] = useState("inicio");
  const [started, setStarted] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(null), 2600); };

  const top = stack[stack.length - 1];
  const go = (screen, stop) => setStack(s => [...s, { screen, stop }]);
  const back = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const resetTo = (t) => { setTab(t); setStack([{ screen: t }]); };

  const tabs = [
    { id: "inicio", label: "Inicio", icon: "home" },
    { id: "pedidos", label: "Pedidos", icon: "box" },
    { id: "ruta", label: "Ruta", icon: "map" },
    { id: "incidencias", label: "Incidencias", icon: "alert" },
    { id: "perfil", label: "Perfil", icon: "user" },
  ];
  const tabbar = (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className="tabbar__item" aria-current={tab === t.id && stack.length === 1} onClick={() => resetTo(t.id)}>
          <Icon name={t.icon} size={23} stroke={tab === t.id ? 2.4 : 2} /><span style={{ fontSize: 10.5 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );

  let content;
  if (top.screen === "inicio") content = <DelDashboard go={go} started={started} setStarted={setStarted} toast={toast} />;
  else if (top.screen === "pedidos") content = <DelOrders go={go} />;
  else if (top.screen === "ruta") content = <DelMap />;
  else if (top.screen === "incidencias") content = <DelIncidents go={go} />;
  else if (top.screen === "perfil") content = <DelProfile />;
  else if (top.screen === "detalle") content = <DelDetail stop={top.stop} back={back} go={go} />;
  else if (top.screen === "confirm") content = <DelConfirm stop={top.stop} back={back} onDone={() => { resetTo("pedidos"); toast("¡Entrega confirmada! Buen trabajo. ✅"); }} />;
  else if (top.screen === "problema") content = <DelProblem stop={top.stop} back={back} onDone={() => { resetTo("incidencias"); toast("Reporte enviado al administrador. 📨"); }} />;

  return (
    <PhoneFrame tabbar={tabbar}>
      {content}
      {toastMsg && <Toast>{toastMsg}</Toast>}
    </PhoneFrame>
  );
}

Object.assign(window, { DeliveryApp });
