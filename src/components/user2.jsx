/* global React, Icon, Logo, Avatar, PhoneFrame, ProductImg, Sheet, Toast,
   PRODUCTS, ORDER_HISTORY, RECYCLE,
   UserDashboard, UserOrders, SubSheet, UserOrder, UserTracking */
const { useState, useEffect, useRef } = React;

/* ============================ PERFIL ============================ */
function UserProfile({ go, bigText, setBigText, highContrast, setHighContrast }) {
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 14 }}>
        <Avatar name="Don Ramón" hue={20} size={60} />
        <div className="grow">
          <h1 className="h1" style={{ fontSize: 23 }}>Don Ramón</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>Tienda Don Ramón · Centro</p>
        </div>
        <button className="btn btn--icon btn--ghost" aria-label="Editar"><Icon name="edit" size={20} /></button>
      </div>

      {/* accesibilidad */}
      <div className="card card--flush">
        <div className="lrow" style={{ paddingBottom: 6 }}><Icon name="eye" size={20} className="faint" /><h3 className="h3">Accesibilidad</h3></div>
        <button className="lrow" onClick={() => setBigText(!bigText)} style={{ width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}>
          <span className="lrow__icon" style={{ background: "var(--info-soft)", color: "var(--info)" }}><Icon name="search" size={22} /></span>
          <div className="grow"><strong>Texto más grande</strong><div className="muted" style={{ fontSize: 13.5 }}>Letra y botones más grandes</div></div>
          <Toggle on={bigText} />
        </button>
        <button className="lrow" onClick={() => setHighContrast(!highContrast)} style={{ width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}>
          <span className="lrow__icon" style={{ background: "var(--surface-3)" }}><Icon name="layers" size={22} /></span>
          <div className="grow"><strong>Alto contraste</strong><div className="muted" style={{ fontSize: 13.5 }}>Colores y bordes más marcados</div></div>
          <Toggle on={highContrast} />
        </button>
      </div>

      {/* menú */}
      <div className="card card--flush">
        <button className="lrow" onClick={() => go("reciclaje")} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span className="lrow__icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name="recycle" size={22} /></span>
          <div className="grow"><strong>Reciclaje y recompensas</strong><div className="muted" style={{ fontSize: 13.5 }}>{RECYCLE.points.toLocaleString("es-MX")} puntos verdes</div></div>
          <Icon name="chevR" size={20} className="faint" />
        </button>
        <div className="lrow"><span className="lrow__icon" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name="refresh" size={20} /></span><div className="grow"><strong>Sustituciones que aceptas</strong><div className="muted" style={{ fontSize: 13.5 }}>Néctar Durazno · nunca el agua</div></div><Icon name="chevR" size={20} className="faint" /></div>
        <div className="lrow"><span className="lrow__icon" style={{ background: "var(--surface-3)" }}><Icon name="pin" size={20} /></span><div className="grow"><strong>Mi dirección</strong><div className="muted" style={{ fontSize: 13.5 }}>Av. Hidalgo 245, Centro</div></div><Icon name="chevR" size={20} className="faint" /></div>
        <div className="lrow"><span className="lrow__icon" style={{ background: "var(--surface-3)" }}><Icon name="logout" size={20} /></span><strong className="grow">Cerrar sesión</strong></div>
      </div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span style={{ width: 52, height: 31, borderRadius: 99, background: on ? "var(--brand)" : "var(--border-strong)", display: "flex", alignItems: "center", padding: 3, transition: "background .2s", flex: "0 0 auto" }}>
      <span style={{ width: 25, height: 25, borderRadius: 99, background: "#fff", transform: on ? "translateX(21px)" : "none", transition: "transform .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
    </span>
  );
}

/* ============================ RECICLAJE (pushed) ============================ */
function UserRecycle({ back, toast }) {
  const r = RECYCLE;
  const pct = Math.round((r.points / r.nextReward) * 100);
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--icon btn--ghost" onClick={back} aria-label="Volver"><Icon name="chevL" size={22} /></button>
        <h1 className="h1" style={{ fontSize: 24 }}>Reciclaje</h1>
      </div>

      <div className="card card--pad" style={{ background: "var(--success)", color: "#fff", border: "none" }}>
        <div className="row row--between"><span style={{ fontSize: 15, opacity: .95 }}>Tus puntos verdes</span><Icon name="leaf" size={24} /></div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-.02em", margin: "6px 0" }}>{r.points.toLocaleString("es-MX")}</div>
        <div className="meter" style={{ background: "rgba(255,255,255,.3)" }}><div className="meter__fill" style={{ width: pct + "%", background: "#fff" }} /></div>
        <div style={{ fontSize: 13.5, marginTop: 8, opacity: .95 }}>{(r.nextReward - r.points).toLocaleString("es-MX")} puntos para tu próxima recompensa</div>
      </div>

      <button className="btn btn--brand btn--block btn--lg" onClick={() => toast("¡Registramos tus envases! +20 puntos 🎉")}>
        <Icon name="recycle" size={22} /> Registrar envases retornados
      </button>

      <div className="grid-2">
        <div className="card card--pad" style={{ textAlign: "center" }}>
          <div className="h1" style={{ color: "var(--success)" }}>{r.envases}</div>
          <div className="muted" style={{ fontSize: 13.5 }}>envases recuperados</div>
        </div>
        <div className="card card--pad" style={{ textAlign: "center" }}>
          <div className="h1" style={{ color: "var(--success)" }}>{r.co2}</div>
          <div className="muted" style={{ fontSize: 13.5 }}>kg de CO₂ evitado</div>
        </div>
      </div>

      <div>
        <h3 className="h3" style={{ marginBottom: 12 }}>Tus insignias</h3>
        <div className="row" style={{ gap: 14, overflowX: "auto", paddingBottom: 4 }}>
          {r.badges.map(b => (
            <div key={b.name} className={"insignia" + (b.got ? "" : " insignia--locked")} style={{ minWidth: 72 }}>
              <span className="insignia__medal" style={b.got ? { background: "var(--warning)" } : {}}><Icon name={b.icon} size={26} /></span>
              <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.2 }}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="h3" style={{ marginBottom: 10 }}>Canjea recompensas</h3>
        <div className="col" style={{ gap: 10 }}>
          {r.rewards.map(rw => {
            const can = r.points >= rw.cost;
            return (
              <div key={rw.name} className="card card--pad row" style={{ gap: 14 }}>
                <span className="lrow__icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}><Icon name={rw.icon} size={22} /></span>
                <div className="grow"><strong>{rw.name}</strong><div className="muted mono" style={{ fontSize: 13.5 }}>{rw.cost} puntos</div></div>
                <button className={"btn btn--sm " + (can ? "btn--outline" : "btn--ghost")} disabled={!can}
                  onClick={() => toast(`¡Canjeaste: ${rw.name}! 🎁`)} style={!can ? { opacity: .5 } : {}}>Canjear</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================ AYUDA (IA + voz) ============================ */
const BOT_SCRIPT = [
  { q: "¿Dónde está mi pedido?", a: "Tu pedido OR-4821 está validando inventario. Carlos llega hoy entre 2 y 4 p. m. 🚚" },
  { q: "¿Qué me conviene pedir?", a: "Por tus compras, te conviene reabastecer Refresco Cola 600 ml y Agua Natural 1 L. ¿Los agrego? 🛒" },
  { q: "¿Por qué cambian mis productos?", a: "Solo proponemos un cambio cuando algo podría agotarse. Nunca lo hacemos sin tu permiso. 🙂" },
  { q: "¿Cómo gano puntos verdes?", a: "Devuelve tus envases al repartidor y ganas 20 puntos por caja. ¡Ya llevas 1,240! 🌱" },
];

function UserHelp({ openVoice }) {
  const [msgs, setMsgs] = useState([{ from: "bot", t: "¡Hola, Don Ramón! Soy tu asistente. Pregúntame lo que necesites." }]);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs]);
  const ask = (item) => {
    setMsgs(m => [...m, { from: "me", t: item.q }]);
    setTimeout(() => setMsgs(m => [...m, { from: "bot", t: item.a }]), 600);
  };
  const used = msgs.filter(m => m.from === "me").map(m => m.t);
  const remaining = BOT_SCRIPT.filter(b => !used.includes(b.q));
  return (
    <div className="scr fade-in">
      <div className="row" style={{ gap: 10 }}>
        <Logo size={36} />
        <div><h1 className="h1" style={{ fontSize: 22 }}>Ayuda</h1><div className="faint" style={{ fontSize: 12.5 }}>Asistente IA · responde al instante</div></div>
      </div>

      {/* botón de voz visible */}
      <button className="btn btn--brand btn--block btn--lg" onClick={openVoice}>
        <Icon name="mic" size={22} /> Hablar con Order Rescue
      </button>

      {/* chat */}
      <div className="card card--pad col" style={{ gap: 12 }}>
        <div ref={scroller} className="col" style={{ gap: 10, height: 260, overflowY: "auto", justifyContent: "flex-end" }}>
          {msgs.map((m, i) => <div key={i} className={"chat-msg " + (m.from === "bot" ? "chat-msg--bot" : "chat-msg--me")}>{m.t}</div>)}
        </div>
        <div className="col" style={{ gap: 8 }}>
          {remaining.slice(0, 3).map(b => <button key={b.q} className="chip" style={{ textAlign: "left", whiteSpace: "normal" }} onClick={() => ask(b)}>{b.q}</button>)}
        </div>
        <div className="searchbar">
          <input placeholder="Escribe tu pregunta…" readOnly />
          <button className="btn btn--icon btn--brand" style={{ width: 38, height: 38 }} aria-label="Enviar"><Icon name="send" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

/* ============================ VOZ ============================ */
function VoiceOverlay({ onClose }) {
  const [phase, setPhase] = useState(0);
  const lines = [
    "Escuchando…",
    "“¿Dónde está mi pedido?”",
    "Tu pedido llega hoy entre 2 y 4 de la tarde. Carlos va en camino.",
  ];
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="voicewrap">
      <button className="btn btn--icon" onClick={onClose} aria-label="Cerrar" style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,.2)", color: "#fff" }}><Icon name="x" size={22} /></button>
      <div className="voice-orb"><Icon name="mic" size={54} /></div>
      <div>
        <h2 className="h2" style={{ color: "#fff", fontSize: 22 }}>Hablando con Order Rescue</h2>
        <p style={{ fontSize: 18, marginTop: 14, maxWidth: 280, lineHeight: 1.5 }}>{lines[phase]}</p>
      </div>
      {phase === 2 && <button className="btn fade-in" style={{ background: "#fff", color: "var(--brand-strong)" }} onClick={onClose}>Listo, gracias</button>}
    </div>
  );
}

/* ============================ USER APP SHELL ============================ */
function UserApp() {
  const [tab, setTab] = useState("inicio");
  const [stack, setStack] = useState([]); // pushed screens over the tab
  const [cart, setCart] = useState({});
  const [decision, setDecision] = useState(null);
  const [showSub, setShowSub] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [bigText, setBigText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(null), 2600); };
  const push = (s) => setStack(st => [...st, s]);
  const back = () => setStack(st => st.slice(0, -1));
  // go() handles both tab targets and pushed screens
  const go = (t) => {
    if (t === "catalogo" || t === "reciclaje") { push(t); return; }
    setStack([]); setTab(t);
  };

  const tabs = [
    { id: "inicio", label: "Inicio", icon: "home" },
    { id: "pedidos", label: "Pedidos", icon: "box" },
    { id: "seguimiento", label: "Seguir", icon: "truck" },
    { id: "ayuda", label: "Ayuda", icon: "chat" },
    { id: "perfil", label: "Perfil", icon: "user" },
  ];
  const tabbar = (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className="tabbar__item" aria-current={tab === t.id && stack.length === 0} onClick={() => go(t.id)}>
          <Icon name={t.icon} size={24} stroke={tab === t.id ? 2.4 : 2} /><span>{t.label}</span>
        </button>
      ))}
    </div>
  );

  let content;
  const pushed = stack[stack.length - 1];
  if (pushed === "catalogo") content = <UserOrder back={back} cart={cart} setCart={setCart} onConfirm={() => { setCart({}); setStack([]); setTab("pedidos"); toast("¡Pedido confirmado! Te avisamos cuando salga. 🚚"); }} />;
  else if (pushed === "reciclaje") content = <UserRecycle back={back} toast={toast} />;
  else if (tab === "inicio") content = <UserDashboard go={go} decision={decision} openSub={() => setShowSub(true)} />;
  else if (tab === "pedidos") content = <UserOrders go={go} decision={decision} />;
  else if (tab === "seguimiento") content = <UserTracking decision={decision} />;
  else if (tab === "ayuda") content = <UserHelp openVoice={() => setShowVoice(true)} />;
  else if (tab === "perfil") content = <UserProfile go={go} bigText={bigText} setBigText={setBigText} highContrast={highContrast} setHighContrast={setHighContrast} />;

  const a11y = (bigText ? " a11y-big" : "") + (highContrast ? " a11y-contrast" : "");

  return (
    <PhoneFrame tabbar={tabbar}>
      <div className={"a11y-root" + a11y}>
        {content}
      </div>
      {showSub && <SubSheet onClose={() => setShowSub(false)} onDecide={(d) => { setDecision(d); setShowSub(false); toast("¡Guardado! Tu decisión nos ayuda a mejorar. ✅"); }} />}
      {showVoice && <VoiceOverlay onClose={() => setShowVoice(false)} />}
      {toastMsg && <Toast>{toastMsg}</Toast>}
    </PhoneFrame>
  );
}

Object.assign(window, { UserApp, UserProfile, Toggle, UserRecycle, UserHelp, VoiceOverlay });
