"use client";

import { useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, Check, ChevronDown, Cloud, Cpu, Play, Radio, ShieldCheck, Waves, WifiOff, X, Zap } from "lucide-react";
import fleetData from "@/data/fleet-simulation.json";
import { initialDemoState, resolveIncident, simulateIncident as chooseIncident, toggleConnection, type DemoIncident, type DemoOutcome, type DemoState } from "@/lib/demoFlow";

type Incident = DemoIncident;
type Outcome = DemoOutcome;
type Boat = (typeof fleetData.boats)[number];

const statusStyles: Record<string, string> = {
  Normal: "text-cyan-200 border-cyan-400/30 bg-cyan-400/10",
  Warning: "text-amber-200 border-amber-400/30 bg-amber-400/10",
  Critical: "text-rose-200 border-rose-400/30 bg-rose-400/10",
  Idle: "text-slate-300 border-slate-600 bg-slate-700/30",
};

export default function Dashboard() {
  const [online, setOnline] = useState(true);
  const [incident, setIncident] = useState<Incident>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [selectedBoat, setSelectedBoat] = useState<string>("boat-2");
  const [demoRunning, setDemoRunning] = useState(false);
  const demoTimers = useRef<number[]>([]);

  const boats = useMemo(() => fleetData.boats.map((boat) => {
    if (boat.id === "boat-4" && outcome === "approved") return { ...boat, status: "Dispatching", speed: 9.4, x: 76, y: 70 };
    return boat;
  }), [outcome]);
  const activeBoat = boats.find((boat) => boat.id === selectedBoat) ?? boats[1];
  const showCard = incident !== null && outcome === null;

  const currentState = (): DemoState => ({ online, incident, outcome, selectedBoat });
  const applyState = (next: DemoState) => {
    setOnline(next.online);
    setIncident(next.incident);
    setOutcome(next.outcome);
    setSelectedBoat(next.selectedBoat);
  };

  const simulateIncident = (value: string) => {
    if (value !== "engine-overheat" && value !== "low-keel") {
      applyState({ ...currentState(), incident: null, outcome: null });
      return;
    }
    applyState(chooseIncident(currentState(), value));
  };

  const toggleOnline = () => applyState(toggleConnection(currentState()));

  const resolve = (nextOutcome: Exclude<Outcome, null>) => {
    applyState(resolveIncident(currentState(), nextOutcome));
  };

  const runDemo = () => {
    if (demoRunning) return;
    demoTimers.current.forEach((timer) => window.clearTimeout(timer));
    setDemoRunning(true);
    applyState({ ...initialDemoState, online: false });
    demoTimers.current = [
      window.setTimeout(() => applyState(chooseIncident({ ...initialDemoState, online: false }, "engine-overheat")), 700),
      window.setTimeout(() => applyState(resolveIncident({ ...initialDemoState, online: false, incident: "engine-overheat", selectedBoat: "boat-2" }, "approved")), 2200),
      window.setTimeout(() => setDemoRunning(false), 3200),
    ];
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_-10%,rgba(34,211,238,.14),transparent_42%)]" />
      <div className="relative mx-auto min-h-screen max-w-[1500px]">
        <header className="border-b border-slate-800/90 bg-[#0a1018]/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"><Waves size={21} /></div><div><div className="text-sm font-bold tracking-[.12em] text-white">RIVER<span className="text-cyan-400">PILOT</span> AI</div><p className="text-[10px] uppercase tracking-[.2em] text-slate-500">Fleet mission control · simulation</p></div></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={toggleOnline} aria-pressed={online} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${online ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20" : "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"}`}><span className="text-base leading-none">{online ? "●" : "○"}</span>{online ? "Online (Cloud)" : "Offline (Edge Cache)"}</button>
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300"><AlertTriangle size={14} className="text-amber-300" /><span className="hidden sm:inline">Simulate Incident</span><select aria-label="Simulate Incident" value={incident ?? ""} onChange={(event) => simulateIncident(event.target.value)} className="bg-transparent font-semibold text-white outline-none"><option value="" className="bg-slate-900">Choose…</option><option value="engine-overheat" className="bg-slate-900">Engine Overheat · Boat 2</option><option value="low-keel" className="bg-slate-900">Low Keel Clearance · Boat 3</option></select></label>
              <button type="button" onClick={runDemo} disabled={demoRunning} className="flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-400/20 disabled:cursor-wait disabled:opacity-60"><Play size={13} fill="currentColor" />{demoRunning ? "Running demo…" : "Run demo"}</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-slate-500"><span className={`flex items-center gap-2 ${online ? "text-cyan-300" : "text-amber-300"}`}>{online ? <Cloud size={13} /> : <WifiOff size={13} />}{online ? "Cloud route simulated" : "Edge Mode Active"}</span><span>Latency <strong className="text-slate-200">{online ? "820ms" : "12ms"}</strong></span><span>Tokens <strong className="text-slate-200">{online ? "$0.012" : "$0.000"}</strong></span><span className="flex items-center gap-1 text-emerald-300"><Radio size={12} /> Local state synced</span></div>
        </header>

        <div className="space-y-6 px-5 py-7 md:px-8">
          {!online && <div role="status" className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"><Zap size={17} /> Offline mode active — local rules continue triage with a simulated 12ms response and zero data egress.</div>}
          <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-cyan-400">Human × AI · edge-native demo</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Fleet mission control</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Pre-baked fleet intelligence for disconnected waters. Every recommendation is explainable, local, and operator-approved.</p></div><div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-right"><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">River sector</p><p className="mt-1 text-sm font-semibold text-white">{fleetData.river.name}</p><p className="text-xs text-slate-400">{fleetData.river.route}</p></div></section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.8fr)]">
            <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-base font-semibold text-white"><Activity size={17} className="text-cyan-400" /> Live river map</h2><p className="mt-1 text-xs text-slate-500">Select a vessel pin to inspect the simulated snapshot.</p></div><span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-[10px] text-slate-400">3 ACTIVE PINS · 1 HAZARD</span></div><RiverMap boats={boats} selectedBoat={selectedBoat} onSelect={setSelectedBoat} /></div>
            <div className="space-y-4"><StatusPanel online={online} activeBoat={activeBoat} /><TriageCard incident={incident} show={showCard} online={online} onApprove={() => resolve("approved")} onDismiss={() => resolve("dismissed")} /><Outcome incident={incident} outcome={outcome} /></div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3"><Stat label="Fleet tracked" value="04" detail="Pre-baked vessels" /><Stat label="Decision engine" value={online ? "CLOUD" : "EDGE"} detail={online ? "Simulated cloud path" : "Local rules · 12ms"} /><Stat label="Safety posture" value={outcome === "approved" ? "RESCUE" : incident ? "WATCH" : "READY"} detail="Human approval required" /></section>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 font-mono text-[10px] uppercase tracking-wider text-slate-600"><span>RiverPilot AI · local simulation</span><span className="flex items-center gap-2"><ShieldCheck size={12} className="text-cyan-400" /> No live vessel commands transmitted</span></footer>
        </div>
      </div>
    </main>
  );
}

function RiverMap({ boats, selectedBoat, onSelect }: { boats: Boat[]; selectedBoat: string; onSelect: (id: string) => void }) {
  const visible = boats.filter((boat) => ["boat-1", "boat-2", "boat-3"].includes(boat.id) || (boat.id === "boat-4" && boat.status === "Dispatching"));
  return <div className="scanline relative min-h-[430px] overflow-hidden rounded-2xl border border-slate-800 bg-[#08141c] shadow-cyan sm:min-h-[520px]"><div className="mission-grid absolute inset-0 opacity-70" /><svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M-6 72 C 15 50, 26 79, 42 56 S 72 22, 106 43" fill="none" stroke="#0d3440" strokeWidth="18" /><path d="M-6 72 C 15 50, 26 79, 42 56 S 72 22, 106 43" fill="none" stroke="#0b222b" strokeWidth="13" /><path d="M-6 72 C 15 50, 26 79, 42 56 S 72 22, 106 43" fill="none" stroke="#1e6470" strokeWidth=".45" strokeDasharray="2 1.5" /><path d="M18 88 Q40 70 48 54 T80 20" fill="none" stroke="#2dd4bf" strokeWidth=".35" strokeDasharray="1 1.5" /><circle cx={fleetData.river.sandbank.x} cy={fleetData.river.sandbank.y} r={fleetData.river.sandbank.radius} fill="#b88745" opacity=".22" stroke="#fbbf24" strokeWidth=".25" strokeDasharray="1 1" /></svg><div className="absolute left-5 top-5 flex items-center gap-2 text-xs font-semibold text-cyan-300"><Waves size={15} /> {fleetData.river.name}</div><div className="absolute left-[64%] top-[48%] rounded bg-slate-950/85 px-2 py-1 text-[10px] text-amber-200">Shallow sandbank<br /><span className="text-slate-500">0.6m clearance</span></div><div className="absolute bottom-5 left-5 rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 font-mono text-[10px] text-slate-500"><span className="text-cyan-300">BONNY CREEK</span> → SWALI REACH<br />Illustrative coordinates · local cache</div><div className="absolute bottom-5 right-5 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 text-[10px] text-slate-400">AIS SIMULATION · {visible.length} PINS</div>{visible.map((boat) => <button key={boat.id} type="button" onClick={() => onSelect(boat.id)} aria-label={`Select ${boat.name}`} aria-pressed={selectedBoat === boat.id} style={{ left: `${boat.x}%`, top: `${boat.y}%` }} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-slate-950/90 px-2 py-1.5 text-left shadow-lg transition hover:scale-105 ${selectedBoat === boat.id ? "border-cyan-300 ring-2 ring-cyan-400/20" : "border-slate-700"}`}><span className={`block text-[10px] font-bold ${boat.id === "boat-2" ? "text-amber-200" : boat.id === "boat-4" && boat.status === "Dispatching" ? "text-emerald-200" : boat.id === "boat-1" ? "text-cyan-200" : boat.id === "boat-3" ? "text-rose-200" : "text-slate-300"}`}>{boat.shortName} · {boat.name}</span><span className="block text-[10px] text-slate-400">{boat.status} · {boat.speed} kn</span></button>)}</div>;
}

function StatusPanel({ online, activeBoat }: { online: boolean; activeBoat: Boat }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#0d141d]/85 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-500">Selected vessel</p><h2 className="mt-1 text-xl font-semibold text-white">{activeBoat.name}</h2></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyles[activeBoat.status] ?? statusStyles.Idle}`}>{activeBoat.status}</span></div><div className="mt-5 grid grid-cols-2 gap-2">{[["Speed", `${activeBoat.speed} kn`], ["Load", `${activeBoat.load}%`], ["Engine", `${activeBoat.engineTemp ?? 72}°C`], ["Keel", `${activeBoat.depthUnderKeel ?? 2.4} m`], ["Data source", online ? "Cloud sim" : "Edge cache"]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 font-mono text-lg text-slate-100">{value}</p></div>)}</div><div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400"><Cpu size={15} className="text-cyan-400" /> Deterministic mock telemetry snapshot</div></section>;
}

function TriageCard({ incident, show, online, onApprove, onDismiss }: { incident: Exclude<Incident, null> | null; show: boolean; online: boolean; onApprove: () => void; onDismiss: () => void }) {
  if (!show || !incident) return <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-300"><ChevronDown size={16} className="text-slate-500" /> Triage queue ready</div><p className="mt-2 text-xs leading-relaxed text-slate-500">Choose <strong className="text-slate-300">Engine Overheat · Boat 2</strong> or <strong className="text-slate-300">Low Keel Clearance · Boat 3</strong> from the simulator above.</p></section>;
  const lowKeel = incident === "low-keel";
  const title = lowKeel ? "Low Keel Clearance · Boat 3" : "Engine Overheat · Boat 2";
  const confidence = lowKeel ? "91" : "88";
  const action = lowKeel ? "Stop Boat 3, reroute around the sandbank, dispatch Boat 4 (Swali Ferry) to check clearance." : "Throttle engine down by 30%, dispatch Boat 4 (Swali Ferry) for passenger transfer.";
  const trigger = lowKeel ? <>Boat 3 under-keel clearance is <strong className="text-amber-200">0.3m</strong> near the shallow sandbank at zero speed. Human approval is required.</> : <>Triggered by Boat 2 engine temperature at <strong className="text-amber-200">98°C</strong>, sustained load at 50%, and an active communications dead zone. Human approval is required.</>;
  return <section className="rounded-2xl border border-rose-400/30 bg-[#17131b] p-5 shadow-[0_0_34px_rgba(251,113,133,.08)]"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-rose-300"><AlertTriangle size={14} /> AI triage decision</div><h2 className="mt-2 text-lg font-semibold text-white">{title}</h2></div><span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-1 font-mono text-[10px] text-rose-200">URGENT</span></div><div className="mt-5 flex items-end justify-between border-b border-slate-800 pb-4"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p><p className="mt-1 font-mono text-3xl font-semibold text-white">{confidence}<span className="text-lg text-rose-300">%</span></p></div><div className="max-w-[210px] text-right text-xs text-slate-400">{online ? "Cloud path simulated · 820ms" : "Local rule engine · 12ms"}</div></div><div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="text-[10px] uppercase tracking-wider text-amber-300">Suggested action</p><p className="mt-2 text-sm leading-relaxed text-slate-100">{action}</p></div><p className="mt-3 text-xs leading-relaxed text-slate-400">{trigger}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onApprove} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"><Check size={15} /> Approve Dispatch</button><button type="button" onClick={onDismiss} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"><X size={15} /> Dismiss</button></div></section>;
}

function Outcome({ incident, outcome }: { incident: Incident; outcome: Outcome }) { if (!outcome) return null; const subject = incident === "low-keel" ? "clearance support" : "passenger transfer"; return <div role="status" className={`rounded-xl border p-4 text-sm ${outcome === "approved" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-slate-600 bg-slate-800/40 text-slate-300"}`}>{outcome === "approved" ? `Dispatch approved locally — Swali Ferry is underway for ${subject}.` : "Recommendation dismissed locally — no simulated dispatch was created."}</div>; }
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-slate-800 bg-[#0d141d]/80 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-mono text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-[10px] text-slate-600">{detail}</p></div>; }
