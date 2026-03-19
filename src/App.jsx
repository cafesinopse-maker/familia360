import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "firebase/auth";

// ─── SUBSTITUA COM SUAS CREDENCIAIS DO FIREBASE ─────────────────────────────
const firebaseConfig = {
  apiKey:            "COLE_AQUI_SUA_apiKey",
  authDomain:        "COLE_AQUI_SEU_authDomain",
  projectId:         "COLE_AQUI_SEU_projectId",
  storageBucket:     "COLE_AQUI_SEU_storageBucket",
  messagingSenderId: "COLE_AQUI_SEU_messagingSenderId",
  appId:             "COLE_AQUI_SEU_appId",
};
// ─────────────────────────────────────────────────────────────────────────────

const firebaseApp = initializeApp(firebaseConfig);
const db   = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// ── Constantes ───────────────────────────────────────────────────────────────
const MEMBERS = {
  evandro: { label: "Evandro", color: "#7F77DD", light: "#EEEDFE", dark: "#26215C" },
  jussara: { label: "Jussara", color: "#D85A30", light: "#FAECE7", dark: "#4A1B0C" },
  ambos:   { label: "Ambos",   color: "#1D9E75", light: "#E1F5EE", dark: "#04342C" },
};

const GATS = {
  Alimentação: { icon: "🍽️", color: "#E8593C", bg: "#FAECE7" },
  Transporte:  { icon: "🚗", color: "#BA7517", bg: "#FAEEDA" },
  Saúde:       { icon: "💊", color: "#1D9E75", bg: "#E1F5EE" },
  Lazer:       { icon: "🎉", color: "#7F77DD", bg: "#EEEDFE" },
  Compras:     { icon: "🛍️", color: "#2563EB", bg: "#EFF6FF" },
  Beleza:      { icon: "💄", color: "#D4537E", bg: "#FBEAF0" },
  Pet:         { icon: "🐾", color: "#378ADD", bg: "#E6F1FB" },
  Educação:    { icon: "📚", color: "#185FA5", bg: "#E6F1FB" },
  Casa:        { icon: "🏠", color: "#639922", bg: "#EAF3DE" },
  Outros:      { icon: "💼", color: "#888780", bg: "#F1EFE8" },
};

const FIXCOL = {
  Moradia: "#2563EB", Condomínio: "#7F77DD", Energia: "#EF9F27",
  Água: "#378ADD", Internet: "#1D9E75", Telefone: "#639922",
  Cartão: "#E8593C", Escola: "#185FA5", Saúde: "#D4537E",
  Seguro: "#888780", Streaming: "#D85A30", Outros: "#B4B2A9",
};

const PRIO = { alta: "#E24B4A", media: "#EF9F27", baixa: "#639922" };
const KANBAN_COLS = [
  { id: "todo",       label: "A Fazer",      color: "#888780", bg: "#F1EFE8" },
  { id: "doing",      label: "Em andamento", color: "#2563EB", bg: "#EFF6FF" },
  { id: "done",       label: "Concluído",    color: "#1D9E75", bg: "#E1F5EE" },
];
const ET = {
  Consulta:    { c: "#E8593C", bg: "#FAECE7" },
  Compromisso: { c: "#2563EB", bg: "#EFF6FF" },
  Evento:      { c: "#7F77DD", bg: "#EEEDFE" },
  Lazer:       { c: "#1D9E75", bg: "#E1F5EE" },
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(v) { return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function fmtS(v) { return v >= 1000 ? "R$" + (v/1000).toFixed(1) + "k" : "R$" + Math.round(v); }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

// ── Hooks Firebase ────────────────────────────────────────────────────────────
function useCollection(col) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const q = query(collection(db, col), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [col]);
  return data;
}

async function add(col, data) {
  return addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
}
async function upd(col, id, data) { return updateDoc(doc(db, col, id), data); }
async function del(col, id) { return deleteDoc(doc(db, col, id)); }

// ── Componentes UI ────────────────────────────────────────────────────────────

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 mt-5">{children}</h2>;
}

function MemberChip({ resp }) {
  const m = MEMBERS[resp] || MEMBERS.ambos;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: m.light, color: m.dark }}>{m.label}</span>
  );
}

function Btn({ children, onClick, variant = "primary", className = "", type = "button" }) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger:  "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    ghost:   "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };
  return (
    <button type={type} onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>}
      <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>}
      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" {...props}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 130 }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  if (!total) return (
    <div className="flex items-center justify-center rounded-full border-8 border-gray-100"
      style={{ width: size, height: size }}>
      <span className="text-xs text-gray-400">Sem dados</span>
    </div>
  );
  const r = 44, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(s => {
    const pct = s.value / total;
    const dash = Math.max(0, pct * circ - 1.5);
    const arc = { color: s.color, dash, space: circ - dash, offset };
    offset += pct;
    return arc;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#F0EDE8" strokeWidth="14" />
      {arcs.map((a, i) => (
        <circle key={i} cx="55" cy="55" r={r} fill="none"
          stroke={a.color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${a.dash.toFixed(2)} ${a.space.toFixed(2)}`}
          strokeDashoffset={(-a.offset * circ).toFixed(2)}
          style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px" }} />
      ))}
      <text x="55" y="51" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2C2A26">
        {fmtS(total)}
      </text>
      <text x="55" y="65" textAnchor="middle" fontSize="9" fill="#888">total</text>
    </svg>
  );
}

function DonutLegend({ segments, total }) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      {segments.map((s, i) => {
        const pct = total ? Math.round((s.value / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs font-semibold flex-1 truncate">{s.icon ? s.icon + " " : ""}{s.label}</span>
            <span className="text-xs font-bold" style={{ color: s.color }}>{fmtS(s.value)}</span>
            <span className="text-xs text-gray-400">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [mode,  setMode]  = useState("login"); // login | register
  const [err,   setErr]   = useState("");
  const [load,  setLoad]  = useState(false);

  async function handle() {
    setErr(""); setLoad(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, pass);
      else                  await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      setErr(e.code === "auth/wrong-password"      ? "Senha incorreta."
           : e.code === "auth/user-not-found"      ? "E-mail não cadastrado."
           : e.code === "auth/email-already-in-use"? "E-mail já cadastrado."
           : "Erro: " + e.message);
    }
    setLoad(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏠</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Família 360</h1>
          <p className="text-sm text-gray-500 mt-1">Evandro & Jussara</p>
        </div>
        <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
        <Input label="Senha"  type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
        {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
        <Btn onClick={handle} className="w-full mb-3" variant="primary">
          {load ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Btn>
        <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setErr(""); }}
          className="text-xs text-blue-600 w-full text-center">
          {mode === "login" ? "Primeira vez? Criar conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ bills, expenses, events, tasks, onAdd }) {
  const t = today();
  const todayEvs  = events.filter(e => e.date === t);
  const activeTks = tasks.filter(t => t.col === "doing");
  const monthPfx  = t.slice(0, 7);
  const monthExp  = expenses.filter(e => (e.date||"").startsWith(monthPfx));
  const pendBills = bills.filter(b => !b.paid);

  const mons = ["janeiro","fevereiro","março","abril","maio","junho",
                "julho","agosto","setembro","outubro","novembro","dezembro"];
  const days = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const now  = new Date();
  const dateLabel = `${days[now.getDay()]}, ${now.getDate()} de ${mons[now.getMonth()]}`;

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-12 pb-6">
        <p className="text-blue-200 text-sm">{dateLabel}</p>
        <h1 className="text-xl font-extrabold mt-1">Olá, Evandro e Jussara! 👋</h1>
      </div>
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3 mb-1">
          {[
            { label: "Contas fixas",   value: fmtS(bills.reduce((a,b)=>a+Number(b.value||0),0)), bg: "#E1F5EE", color: "#04342C", icon: "📋" },
            { label: "Gastos do mês",  value: fmtS(monthExp.reduce((a,b)=>a+Number(b.value||0),0)), bg: "#FAECE7", color: "#4A1B0C", icon: "☕" },
            { label: "Eventos hoje",   value: String(todayEvs.length),  bg: "#EFF6FF", color: "#1E3A8A", icon: "📅" },
            { label: "Em andamento",   value: String(activeTks.length), bg: "#FAEEDA", color: "#854F0B", icon: "📋" },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-3" style={{ background: c.bg, color: c.color }}>
              <div className="text-lg">{c.icon}</div>
              <div className="text-xl font-extrabold mt-1">{c.value}</div>
              <div className="text-xs font-semibold opacity-70">{c.label}</div>
            </div>
          ))}
        </div>

        {pendBills.length > 0 && <>
          <SectionTitle>💳 Contas pendentes</SectionTitle>
          {pendBills.slice(0, 3).map(b => (
            <Card key={b.id}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: MEMBERS[b.resp]?.color || "#888" }} />
                <div className="flex-1">
                  <p className="text-sm font-bold">{b.name}</p>
                  <p className="text-xs text-gray-500">{fmt(b.value)} · dia {b.day} · {MEMBERS[b.resp]?.label}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700">Pendente</span>
              </div>
            </Card>
          ))}
        </>}

        {todayEvs.length > 0 && <>
          <SectionTitle>📅 Hoje</SectionTitle>
          {todayEvs.map(e => {
            const et = ET[e.type] || ET.Compromisso;
            return (
              <Card key={e.id}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: et.c }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.time}{e.location ? ` · ${e.location}` : ""}</p>
                  </div>
                  <MemberChip resp={e.resp} />
                </div>
              </Card>
            );
          })}
        </>}

        {activeTks.length > 0 && <>
          <SectionTitle>⚡ Em andamento</SectionTitle>
          {activeTks.slice(0,3).map(t => (
            <Card key={t.id}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIO[t.priority] || "#888" }} />
                <p className="text-sm font-semibold flex-1">{t.name}</p>
                <MemberChip resp={t.resp} />
              </div>
            </Card>
          ))}
        </>}

        <SectionTitle>⚡ Ações rápidas</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "💳 Nova conta",  action: "bill"    },
            { label: "☕ Novo gasto",  action: "expense"  },
            { label: "📅 Novo evento", action: "event"    },
            { label: "✅ Nova tarefa", action: "task"     },
          ].map(q => (
            <button key={q.action} onClick={() => onAdd(q.action)}
              className="bg-blue-600 text-white rounded-2xl py-3 text-sm font-bold hover:bg-blue-700 transition">
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FINANÇAS ──────────────────────────────────────────────────────────────────
function FinancasScreen({ bills, expenses }) {
  const [tab,    setTab]    = useState("fixas");
  const [filter, setFilter] = useState("Todos");
  const [modal,  setModal]  = useState(null); // null | {type, data}

  const monthPfx = today().slice(0, 7);
  const mg = expenses.filter(e => (e.date||"").startsWith(monthPfx));
  const filt = filter === "Todos" ? mg : mg.filter(e => e.cat === filter);

  const evT  = filt.filter(e=>e.resp==="evandro").reduce((a,b)=>a+Number(b.value||0),0)
             + filt.filter(e=>e.resp==="ambos").reduce((a,b)=>a+Number(b.value||0)/2,0);
  const juT  = filt.filter(e=>e.resp==="jussara").reduce((a,b)=>a+Number(b.value||0),0)
             + filt.filter(e=>e.resp==="ambos").reduce((a,b)=>a+Number(b.value||0)/2,0);
  const evF  = bills.filter(b=>b.resp==="evandro").reduce((a,b)=>a+Number(b.value||0),0)
             + bills.filter(b=>b.resp==="ambos").reduce((a,b)=>a+Number(b.value||0)/2,0);
  const juF  = bills.filter(b=>b.resp==="jussara").reduce((a,b)=>a+Number(b.value||0),0)
             + bills.filter(b=>b.resp==="ambos").reduce((a,b)=>a+Number(b.value||0)/2,0);

  // Donut fixas por categoria
  const byFixCat = {};
  bills.forEach(b => { byFixCat[b.category] = (byFixCat[b.category]||0) + Number(b.value||0); });
  const fixSegs = Object.entries(byFixCat).sort((a,b)=>b[1]-a[1])
    .map(([c,v]) => ({ label: c, value: v, color: FIXCOL[c] || "#888" }));

  // Donut gastos por categoria
  const byGatCat = {};
  mg.forEach(e => { byGatCat[e.cat] = (byGatCat[e.cat]||0) + Number(e.value||0); });
  const gatSegs = Object.entries(byGatCat).sort((a,b)=>b[1]-a[1])
    .map(([c,v]) => ({ label: c, value: v, color: GATS[c]?.color||"#888", icon: GATS[c]?.icon||"" }));

  // Group gastos by date
  const grp = {};
  filt.forEach(e => { if(!grp[e.date]) grp[e.date]=[]; grp[e.date].push(e); });
  const sortedDays = Object.keys(grp).sort((a,b)=>b.localeCompare(a));

  async function saveBill(data) {
    if (data.id) await upd("bills", data.id, data);
    else         await add("bills", data);
    setModal(null);
  }
  async function saveExpense(data) {
    if (data.id) await upd("expenses", data.id, data);
    else         await add("expenses", data);
    setModal(null);
  }

  return (
    <div className="pb-20">
      {/* tabs */}
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-extrabold mb-3">💰 Finanças</h1>
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {[["fixas","📋 Contas Fixas"],["diario","☕ Gastos do Dia"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab===k?"bg-gray-900 text-white":"text-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {tab === "fixas" ? <>
          {/* Resumo fixas */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label:"Evandro", value:fmt(evF), bg:"#EEEDFE", color:"#26215C" },
              { label:"Jussara", value:fmt(juF), bg:"#FAECE7", color:"#4A1B0C" },
              { label:"Total",   value:fmt(bills.reduce((a,b)=>a+Number(b.value||0),0)), bg:"#E1F5EE", color:"#04342C" },
            ].map((c,i)=>(
              <div key={i} className="rounded-xl p-2 text-center" style={{background:c.bg,color:c.color}}>
                <div className="text-xs font-bold opacity-70">{c.label}</div>
                <div className="text-sm font-extrabold">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Donut fixas */}
          {fixSegs.length > 0 && (
            <Card>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">🍩 Por categoria</p>
              <div className="flex items-center gap-4">
                <DonutChart segments={fixSegs} />
                <DonutLegend segments={fixSegs} total={bills.reduce((a,b)=>a+Number(b.value||0),0)} />
              </div>
            </Card>
          )}

          {/* Lista contas */}
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>Contas do mês</SectionTitle>
            <button onClick={()=>setModal({type:"bill",data:{}})}
              className="text-blue-600 text-sm font-bold">+ Adicionar</button>
          </div>
          {bills.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhuma conta ainda.</p>}
          {bills.map(b=>(
            <Card key={b.id}>
              <div className="flex items-center gap-3">
                <button onClick={()=>upd("bills",b.id,{paid:!b.paid})}
                  className="text-xl">{b.paid?"✅":"⭕"}</button>
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{background:MEMBERS[b.resp]?.color||"#888"}}/>
                <div className="flex-1 cursor-pointer" onClick={()=>setModal({type:"bill",data:b})}>
                  <p className={`text-sm font-bold ${b.paid?"line-through text-gray-400":""}`}>{b.name}</p>
                  <p className="text-xs text-gray-500">{b.category} · dia {b.day} · {MEMBERS[b.resp]?.label}</p>
                </div>
                <p className={`text-sm font-extrabold ${b.paid?"text-green-600":"text-gray-900"}`}>{fmt(b.value)}</p>
              </div>
            </Card>
          ))}

        </> : <>
          {/* Resumo diário */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label:"Evandro", value:fmt(evT), bg:"#EEEDFE", color:"#26215C" },
              { label:"Jussara", value:fmt(juT), bg:"#FAECE7", color:"#4A1B0C" },
            ].map((c,i)=>(
              <div key={i} className="rounded-xl p-3" style={{background:c.bg,color:c.color}}>
                <div className="text-xs font-bold opacity-70">{c.label}</div>
                <div className="text-lg font-extrabold">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Donut gastos */}
          {gatSegs.length > 0 && (
            <Card>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">🍩 Onde o dinheiro foi</p>
              <div className="flex items-center gap-4">
                <DonutChart segments={gatSegs} />
                <DonutLegend segments={gatSegs} total={mg.reduce((a,b)=>a+Number(b.value||0),0)} />
              </div>
            </Card>
          )}

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {["Todos",...Object.keys(GATS).filter(c=>mg.some(e=>e.cat===c))].map(c=>(
              <button key={c} onClick={()=>setFilter(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filter===c?"bg-blue-600 text-white":"bg-white text-gray-700 border border-gray-200"}`}>
                {c==="Todos"?"🗂️ Todos":(GATS[c]?.icon||"")+" "+c}
              </button>
            ))}
          </div>

          {/* Bar breakdown */}
          {gatSegs.length > 0 && (
            <Card>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Por categoria</p>
              {gatSegs.map((s,i)=>(
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-base w-6">{s.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{s.label}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width:`${Math.round((s.value/gatSegs[0].value)*100)}%`,
                        background:s.color}}/>
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{color:s.color}}>{fmt(s.value)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Add btn */}
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>Lançamentos</SectionTitle>
            <button onClick={()=>setModal({type:"expense",data:{}})}
              className="text-blue-600 text-sm font-bold">+ Adicionar</button>
          </div>

          {/* Lista agrupada */}
          {sortedDays.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum gasto este mês.</p>}
          {sortedDays.map(date=>{
            const d = new Date(date+"T12:00");
            const dl = d.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"short"});
            const dt = grp[date].reduce((a,b)=>a+Number(b.value||0),0);
            return (
              <div key={date}>
                <div className="flex justify-between items-center px-1 mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">{dl}</span>
                  <span className="text-xs font-bold text-gray-500">{fmt(dt)}</span>
                </div>
                {grp[date].map(e=>{
                  const gc = GATS[e.cat]||GATS.Outros;
                  return (
                    <Card key={e.id}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setModal({type:"expense",data:e})}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{background:gc.bg}}>{gc.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{e.name}</p>
                          <p className="text-xs text-gray-500">{e.cat}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold">{fmt(e.value)}</p>
                          <MemberChip resp={e.resp} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </>}
      </div>

      {/* Modals */}
      {modal?.type === "bill"    && <BillModal    data={modal.data} onSave={saveBill}    onClose={()=>setModal(null)} />}
      {modal?.type === "expense" && <ExpenseModal data={modal.data} onSave={saveExpense} onClose={()=>setModal(null)} />}
    </div>
  );
}

// ── AGENDA ────────────────────────────────────────────────────────────────────
function AgendaScreen({ events }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selDay,setSelDay]= useState(now.getDate());
  const [modal, setModal] = useState(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayD = now.getDate(), todayM = now.getMonth(), todayY = now.getFullYear();

  function dayStr(d) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  const selStr = dayStr(selDay);
  const dayEvents = events.filter(e => e.date === selStr);

  async function saveEvent(data) {
    if (data.id) await upd("events", data.id, data);
    else         await add("events", data);
    setModal(null);
  }

  return (
    <div className="pb-20">
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-extrabold mb-1">📅 Agenda</h1>
        <div className="flex items-center gap-3">
          <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1)}}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">‹</button>
          <span className="font-bold flex-1 text-center">{MONTHS[month]} {year}</span>
          <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1)}}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">›</button>
        </div>
      </div>
      <div className="px-4 mt-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["D","S","T","Q","Q","S","S"].map((d,i)=>(
            <div key={i} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const d = i+1;
            const ds = dayStr(d);
            const hasEv = events.some(e=>e.date===ds);
            const isToday = d===todayD && month===todayM && year===todayY;
            const isSel   = d===selDay;
            const evResps = [...new Set(events.filter(e=>e.date===ds).map(e=>e.resp))];
            return (
              <div key={d} onClick={()=>setSelDay(d)}
                className={`rounded-lg min-h-12 flex flex-col items-center pt-1.5 cursor-pointer border-2 transition ${
                  isSel?"border-blue-600 bg-blue-50":isToday?"border-red-400 bg-white":"border-transparent bg-white"}`}>
                <span className={`text-xs font-bold ${isToday?"text-red-500":isSel?"text-blue-600":""}`}>{d}</span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {evResps.map(r=>(
                    <div key={r} className="w-1.5 h-1.5 rounded-full"
                      style={{background:MEMBERS[r]?.color||"#888"}}/>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4">
          {Object.entries(MEMBERS).map(([k,m])=>(
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{background:m.color}}/>
              <span className="text-xs font-semibold text-gray-600">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Dia {selDay}</SectionTitle>
          <button onClick={()=>setModal({data:{date:selStr}})} className="text-blue-600 text-sm font-bold">+ Evento</button>
        </div>
        {dayEvents.length===0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum evento neste dia.</p>}
        {dayEvents.sort((a,b)=>a.time>b.time?1:-1).map(e=>{
          const et = ET[e.type]||ET.Compromisso;
          return (
            <Card key={e.id}>
              <div className="flex gap-3 cursor-pointer" onClick={()=>setModal({data:e})}>
                <div className="text-center min-w-10">
                  <p className="text-xs font-bold">{e.time}</p>
                  <div className="w-1 h-8 rounded-full mx-auto mt-1" style={{background:et.c}}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{e.name}</p>
                  {e.location && <p className="text-xs text-gray-500">📍 {e.location}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{background:et.bg,color:et.c}}>{e.type}</span>
                    <MemberChip resp={e.resp}/>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {modal && <EventModal data={modal.data} onSave={saveEvent} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ── TAREFAS (KANBAN) ──────────────────────────────────────────────────────────
function TarefasScreen({ tasks }) {
  const [modal, setModal] = useState(null);
  const [drag,  setDrag]  = useState(null);

  async function saveTask(data) {
    if (data.id) await upd("tasks", data.id, data);
    else         await add("tasks", data);
    setModal(null);
  }

  function onDrop(colId) {
    if (drag) upd("tasks", drag, { col: colId });
    setDrag(null);
  }

  return (
    <div className="pb-20">
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">📋 Tarefas</h1>
          <button onClick={()=>setModal({data:{}})} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">+ Nova</button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Arraste os cartões entre as colunas</p>
      </div>
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {KANBAN_COLS.map(col=>{
            const colTasks = tasks.filter(t=>t.col===col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-gray-100 min-h-48 flex flex-col"
                style={{background:col.bg}}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>onDrop(col.id)}>
                <div className="px-2 py-2 border-b border-white/60">
                  <span className="text-xs font-extrabold uppercase" style={{color:col.color}}>{col.label}</span>
                  <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/70" style={{color:col.color}}>{colTasks.length}</span>
                </div>
                <div className="p-1.5 flex-1">
                  {colTasks.map(t=>(
                    <div key={t.id} draggable
                      onDragStart={()=>setDrag(t.id)}
                      onDragEnd={()=>setDrag(null)}
                      onClick={()=>setModal({data:t})}
                      className={`bg-white rounded-xl p-2.5 mb-2 border border-gray-100 cursor-grab shadow-sm hover:shadow-md transition ${drag===t.id?"opacity-40":""}`}>
                      <div className="flex items-start gap-1.5">
                        <div className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{background:PRIO[t.priority]||"#888"}}/>
                        <p className="text-xs font-semibold leading-tight flex-1">{t.name}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {t.due && <span className="text-xs text-gray-400">{t.due.slice(5).replace("-","/")}</span>}
                        <MemberChip resp={t.resp}/>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setModal({data:{col:col.id}})}
                  className="mx-2 mb-2 py-1.5 border-2 border-dashed border-white/60 rounded-xl text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-400 transition">
                  + Adicionar
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {modal && <TaskModal data={modal.data} onSave={saveTask} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ── FAMÍLIA ───────────────────────────────────────────────────────────────────
function FamiliaScreen({ bills, expenses, events, tasks, user, onLogout }) {
  const monthPfx = today().slice(0,7);

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-12 pb-6">
        <h1 className="text-xl font-extrabold">👫 Família</h1>
        <p className="text-blue-200 text-sm mt-1">{user?.email}</p>
      </div>
      <div className="px-4 mt-4">
        <SectionTitle>Perfis</SectionTitle>
        {Object.entries(MEMBERS).map(([k,m])=>{
          const mBills = bills.filter(b=>b.resp===k).reduce((a,b)=>a+Number(b.value||0),0)
                       + bills.filter(b=>b.resp==="ambos").reduce((a,b)=>a+Number(b.value||0)/2,0);
          const mExp   = expenses.filter(e=>(e.date||"").startsWith(monthPfx)&&(e.resp===k||e.resp==="ambos"))
                         .reduce((a,b)=>a+Number(b.value||0),0);
          const mEvs   = events.filter(e=>e.resp===k).length;
          const mTks   = tasks.filter(t=>t.resp===k&&t.col!=="done").length;
          return (
            <Card key={k}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-extrabold"
                  style={{background:m.light,color:m.dark}}>{m.label[0]}</div>
                <div>
                  <p className="font-extrabold text-base">{m.label}</p>
                  <div className="w-3 h-3 rounded-full mt-0.5" style={{background:m.color}}/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {label:"Eventos",  value:mEvs},
                  {label:"Tarefas",  value:mTks},
                  {label:"Gastos",   value:"R$"+Math.round(mExp+mBills)},
                ].map((s,i)=>(
                  <div key={i} className="rounded-xl p-2 text-center bg-gray-50">
                    <p className="text-base font-extrabold">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        <SectionTitle>Configurações</SectionTitle>
        <button onClick={onLogout}
          className="w-full py-3 rounded-2xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition">
          🚪 Sair da conta
        </button>
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function BillModal({ data, onSave, onClose }) {
  const [f, setF] = useState({ name:"", value:"", day:"", category:"Moradia", resp:"ambos", paid:false, ...data });
  const isEdit = !!f.id;
  return (
    <Modal title={isEdit?"Editar conta":"Nova conta fixa"} onClose={onClose}>
      <Input label="Nome" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Ex: Aluguel, Energia..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor (R$)" type="number" value={f.value} onChange={e=>setF(p=>({...p,value:e.target.value}))} placeholder="0,00" />
        <Input label="Dia vencimento" type="number" min="1" max="31" value={f.day} onChange={e=>setF(p=>({...p,day:e.target.value}))} placeholder="1-31" />
      </div>
      <Select label="Categoria" value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}
        options={Object.keys(FIXCOL)} />
      <Select label="Responsável" value={f.resp} onChange={e=>setF(p=>({...p,resp:e.target.value}))}
        options={Object.entries(MEMBERS).map(([v,m])=>({value:v,label:m.label}))} />
      <div className="flex gap-2 mt-2">
        {isEdit && <Btn variant="danger" onClick={async()=>{await del("bills",f.id);onClose();}}>🗑 Excluir</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)} className="flex-1">Salvar</Btn>
      </div>
    </Modal>
  );
}

function ExpenseModal({ data, onSave, onClose }) {
  const [f, setF] = useState({ name:"", value:"", date:today(), cat:"Alimentação", resp:"evandro", ...data });
  const isEdit = !!f.id;
  return (
    <Modal title={isEdit?"Editar gasto":"Novo gasto diário"} onClose={onClose}>
      <Input label="Descrição" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Ex: Café, Uber, Farmácia..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor (R$)" type="number" step="0.01" value={f.value} onChange={e=>setF(p=>({...p,value:e.target.value}))} />
        <Input label="Data" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Categoria</label>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(GATS).map(([k,g])=>(
            <button key={k} type="button" onClick={()=>setF(p=>({...p,cat:k}))}
              className={`flex flex-col items-center p-2 rounded-xl text-xs font-bold border-2 transition ${f.cat===k?"border-blue-600 bg-blue-50":"border-gray-100 bg-gray-50"}`}>
              <span className="text-lg">{g.icon}</span>{k}
            </button>
          ))}
        </div>
      </div>
      <Select label="Quem gastou" value={f.resp} onChange={e=>setF(p=>({...p,resp:e.target.value}))}
        options={Object.entries(MEMBERS).map(([v,m])=>({value:v,label:m.label}))} />
      <div className="flex gap-2 mt-2">
        {isEdit && <Btn variant="danger" onClick={async()=>{await del("expenses",f.id);onClose();}}>🗑 Excluir</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)} className="flex-1">Salvar</Btn>
      </div>
    </Modal>
  );
}

function EventModal({ data, onSave, onClose }) {
  const [f, setF] = useState({ name:"", date:today(), time:"09:00", location:"", type:"Compromisso", resp:"ambos", ...data });
  const isEdit = !!f.id;
  return (
    <Modal title={isEdit?"Editar evento":"Novo evento"} onClose={onClose}>
      <Input label="Nome do evento" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Ex: Consulta médica..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Data" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} />
        <Input label="Hora" type="time" value={f.time} onChange={e=>setF(p=>({...p,time:e.target.value}))} />
      </div>
      <Input label="Local (opcional)" value={f.location} onChange={e=>setF(p=>({...p,location:e.target.value}))} placeholder="Ex: Hospital, Online..." />
      <Select label="Tipo" value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value}))}
        options={Object.keys(ET)} />
      <Select label="Quem participa" value={f.resp} onChange={e=>setF(p=>({...p,resp:e.target.value}))}
        options={Object.entries(MEMBERS).map(([v,m])=>({value:v,label:m.label}))} />
      <div className="flex gap-2 mt-2">
        {isEdit && <Btn variant="danger" onClick={async()=>{await del("events",f.id);onClose();}}>🗑 Excluir</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)} className="flex-1">Salvar</Btn>
      </div>
    </Modal>
  );
}

function TaskModal({ data, onSave, onClose }) {
  const [f, setF] = useState({ name:"", priority:"media", due:"", col:"todo", resp:"ambos", ...data });
  const isEdit = !!f.id;
  return (
    <Modal title={isEdit?"Editar tarefa":"Nova tarefa"} onClose={onClose}>
      <Input label="Tarefa" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="Ex: Pagar conta, Marcar dentista..." />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Prioridade" value={f.priority} onChange={e=>setF(p=>({...p,priority:e.target.value}))}
          options={[{value:"alta",label:"🔴 Alta"},{value:"media",label:"🟡 Média"},{value:"baixa",label:"🟢 Baixa"}]} />
        <Input label="Prazo" type="date" value={f.due} onChange={e=>setF(p=>({...p,due:e.target.value}))} />
      </div>
      <Select label="Coluna" value={f.col} onChange={e=>setF(p=>({...p,col:e.target.value}))}
        options={KANBAN_COLS.map(c=>({value:c.id,label:c.label}))} />
      <Select label="Responsável" value={f.resp} onChange={e=>setF(p=>({...p,resp:e.target.value}))}
        options={Object.entries(MEMBERS).map(([v,m])=>({value:v,label:m.label}))} />
      <div className="flex gap-2 mt-2">
        {isEdit && <Btn variant="danger" onClick={async()=>{await del("tasks",f.id);onClose();}}>🗑 Excluir</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>onSave(f)} className="flex-1">Salvar</Btn>
      </div>
    </Modal>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const tabs = [
    { id:"home",    icon:"🏠", label:"Início"   },
    { id:"finance", icon:"💰", label:"Finanças"  },
    { id:"agenda",  icon:"📅", label:"Agenda"    },
    { id:"tasks",   icon:"📋", label:"Tarefas"   },
    { id:"family",  icon:"👫", label:"Família"   },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40 max-w-lg mx-auto">
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)}
          className={`flex-1 flex flex-col items-center py-2 transition ${active===t.id?"text-blue-600":"text-gray-400"}`}>
          <span className={`text-xl transition-transform ${active===t.id?"scale-110":""}`}>{t.icon}</span>
          <span className={`text-xs font-bold mt-0.5 ${active===t.id?"text-blue-600":"text-gray-400"}`}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,   setUser]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [tab,    setTab]    = useState("home");
  const [addModal,setAddModal] = useState(null);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }), []);

  const bills    = useCollection("bills");
  const expenses = useCollection("expenses");
  const events   = useCollection("events");
  const tasks    = useCollection("tasks");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <div className="text-white text-center">
        <div className="text-6xl mb-4">🏠</div>
        <p className="text-xl font-bold">Família 360</p>
      </div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser}/>;

  function handleAddModal(type) {
    setAddModal(type);
    if (type === "bill")    setTab("finance");
    if (type === "expense") setTab("finance");
    if (type === "event")   setTab("agenda");
    if (type === "task")    setTab("tasks");
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {tab === "home"    && <HomeScreen    bills={bills} expenses={expenses} events={events} tasks={tasks} onAdd={handleAddModal}/>}
      {tab === "finance" && <FinancasScreen bills={bills} expenses={expenses}/>}
      {tab === "agenda"  && <AgendaScreen  events={events}/>}
      {tab === "tasks"   && <TarefasScreen tasks={tasks}/>}
      {tab === "family"  && <FamiliaScreen bills={bills} expenses={expenses} events={events} tasks={tasks} user={user} onLogout={()=>signOut(auth)}/>}
      <BottomNav active={tab} onChange={setTab}/>
    </div>
  );
}
