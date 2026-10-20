"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CloudOff, Compass, Cpu, Menu, Satellite, ShieldCheck, Ship, Wifi, X } from "lucide-react";
import FleetMap from "./FleetMap";
import TelemetryDrawer from "./TelemetryDrawer";
import DecisionCard, { type DecisionOutcome } from "./DecisionCard";
import IncidentSimulator from "./IncidentSimulator";
import { initialFleet, incidentLabels, type Boat, type IncidentKind, type TelemetryPoint } from "@/lib/mockFleetData";
import { inferenceRouter, routeIncident, type Decision } from "@/lib/inferenceRouter";

type Resolution = { outcome: DecisionOutcome; decision: Decision };
type SavedState = {
  version: 2;
  requestedOnline: boolean;
  fleet: Boat[];
  incidents: Decision[];
  resolutions: Record<string, Resolution>;
  lastIncident: string | null;
};
const STORAGE_KEY = "riverpilot-dashboard-v2";
const freshState = (): SavedState => ({ version: 2, requestedOnline: true, fleet: structuredClone(initialFleet), incidents: [], resolutions: {}, lastIncident: null });
const priorityOrder = { critical: 0, high: 1, watch: 2 };
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

// A persisted snapshot is untrusted input. Discard old or malformed schemas rather than
// rendering stale statuses, incomplete sensor points or incompatible decision objects.
function validPoint(value: unknown): value is TelemetryPoint {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.time === "string" && p.time.length > 0 &&
    ["speed", "temp", "battery", "rpm", "fuelBurnRate", "depthUnderKeel", "passengerLoad", "loadPercent", "fuelLitres"].every((key) => number(p[key])) &&
    (p.distanceToStrandedVessel === undefined || number(p.distanceToStrandedVessel));
}
function validBoat(value: unknown, id: string): value is Boat {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  const last = Array.isArray(b.telemetry) ? b.telemetry.at(-1) : null;
  return b.id === id && typeof b.name === "string" && typeof b.callsign === "string" &&
    typeof b.route === "string" && typeof b.nextWaypoint === "string" &&
    ["normal", "warning", "critical", "idle"].includes(String(b.status)) &&
    ["x", "y", "speed", "heading", "battery", "temperature", "rpm", "fuelBurnRate", "depthUnderKeel", "passengerLoad", "capacity", "loadPercent", "fuelLitres"].every((key) => number(b[key])) &&
    (b.distanceToStrandedVessel === undefined || number(b.distanceToStrandedVessel)) &&
    (b.inCommsDeadZone === undefined || typeof b.inCommsDeadZone === "boolean") &&
    (b.fuelOptimal === undefined || typeof b.fuelOptimal === "boolean") &&
    Array.isArray(b.telemetry) && b.telemetry.length > 0 && b.telemetry.every(validPoint) && validPoint(last) &&
    last.speed === b.speed && last.temp === b.temperature && last.battery === b.battery && last.rpm === b.rpm &&
    last.depthUnderKeel === b.depthUnderKeel && last.fuelBurnRate === b.fuelBurnRate &&
    last.passengerLoad === b.passengerLoad && last.loadPercent === b.loadPercent && last.fuelLitres === b.fuelLitres &&
    last.distanceToStrandedVessel === b.distanceToStrandedVessel;
}
function validDecision(value: unknown): value is Decision {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return ["id", "boatId", "title", "detail", "rationale", "action", "secondaryAction", "tradeoff"].every((key) => typeof d[key] === "string") &&
    ["critical", "high", "watch"].includes(String(d.priority)) &&
    ["dispatch", "throttle", "keel", "overheat"].includes(String(d.kind)) && number(d.confidence) &&
    Array.isArray(d.lineage) && d.lineage.length > 0 && d.lineage.every((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Record<string, unknown>;
      return typeof e.boatId === "string" && validPoint(e.point);
    });
}
function restore(value: unknown): SavedState | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  const fleet = s.fleet;
  if (s.version !== 2 || typeof s.requestedOnline !== "boolean" || !Array.isArray(s.fleet) ||
      s.fleet.length !== initialFleet.length || !initialFleet.every((boat, i) => Array.isArray(fleet) && validBoat(fleet[i], boat.id)) ||
      !Array.isArray(s.incidents) || !s.incidents.every((d: unknown) => validDecision(d) && ["keel", "overheat"].includes(d.kind)) ||
      !s.resolutions || typeof s.resolutions !== "object" || Array.isArray(s.resolutions) ||
      !Object.values(s.resolutions).every((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const r = entry as Record<string, unknown>;
        return ["approved", "dismissed", "signaled", "ignored", "acknowledged"].includes(String(r.outcome)) && validDecision(r.decision);
      }) || (s.lastIncident !== null && typeof s.lastIncident !== "string")) return null;
  return s as SavedState;
}

function changeReadings(boat: Boat, changes: Partial<Boat>, time: string): Boat {
  const updated = { ...boat, ...changes };
  const point: TelemetryPoint = {
    time, speed: updated.speed, temp: updated.temperature, battery: updated.battery,
    rpm: updated.rpm, fuelBurnRate: updated.fuelBurnRate, depthUnderKeel: updated.depthUnderKeel,
    passengerLoad: updated.passengerLoad, loadPercent: updated.loadPercent, fuelLitres: updated.fuelLitres,
    ...(updated.distanceToStrandedVessel === undefined ? {} : { distanceToStrandedVessel: updated.distanceToStrandedVessel }),
  };
  return { ...updated, telemetry: [...boat.telemetry, point] };
}
const sampleTime = () => new Date().toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false });

export default function Dashboard() {
  const [state, setState] = useState<SavedState>(freshState);
  const [hydrated, setHydrated] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const saved = stored ? restore(JSON.parse(stored)) : null;
      if (saved) setState(saved);
      else if (stored) localStorage.removeItem(STORAGE_KEY);
      // Remove the incompatible v1 snapshot (which had invalid status values and queue shape).
      localStorage.removeItem("riverpilot-dashboard-v1");
    } catch { setState(freshState()); }
    setHydrated(true);
    const updateConnection = () => setBrowserOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage disabled: demo remains usable in memory. */ }
  }, [state, hydrated]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A development bundle changes on every edit and must never be served from
      // an older offline cache left by a production preview on localhost.
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.filter((registration) => registration.scope === `${location.origin}/`).map((registration) => registration.unregister()))
      ).catch(() => undefined);
      return;
    }
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  const routed = useMemo(() => inferenceRouter(state.fleet, { requestedOnline: hydrated && browserOnline && state.requestedOnline }), [state.fleet, state.requestedOnline, browserOnline, hydrated]);
  const edge = routed.mode === "edge";
  const decisions = useMemo(() => {
    const generated = [...routed.decisions, ...state.incidents];
    // A manually injected incident is the same alert as the edge heuristic for that boat.
    const unique = generated.filter((decision, i) => !decision.id.startsWith("edge-") || !generated.slice(i + 1).some((other) => other.kind === decision.kind && other.boatId === decision.boatId && other.id.startsWith("incident-")));
    const ids = new Set(unique.map((decision) => decision.id));
    for (const [id, resolution] of Object.entries(state.resolutions)) if (!ids.has(id)) unique.push(resolution.decision);
    return unique.sort((a, b) => Number(Boolean(state.resolutions[a.id])) - Number(Boolean(state.resolutions[b.id])) || priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [routed.decisions, state.incidents, state.resolutions]);
  const pendingCount = decisions.filter((d) => !state.resolutions[d.id]).length;
  const selectedBoat = state.fleet.find((boat) => boat.id === selectedId) ?? null;

  const simulate = (kind: IncidentKind) => {
    setState((current) => {
      if (kind === "blackout") return { ...current, requestedOnline: !current.requestedOnline, lastIncident: `${incidentLabels[kind]} · ${current.requestedOnline ? "manual blackout on" : "manual blackout off"}` };
      const id = kind === "keel" ? "rp-01" : "rp-02";
      const updatedFleet = current.fleet.map((boat) => {
        if (boat.id !== id) return boat;
        return kind === "keel"
          ? changeReadings(boat, { depthUnderKeel: 0.3, speed: 2.1, rpm: 650, fuelBurnRate: 8, status: "critical", x: 27, y: 54, nextWaypoint: "Shallows — stop and assess" }, sampleTime())
          : changeReadings(boat, { temperature: Math.max(108, boat.temperature + 10), rpm: 2200, fuelBurnRate: 30, speed: 4.8, status: "critical" }, sampleTime());
      });
      const changedBoat = updatedFleet.find((boat) => boat.id === id)!;
      const decision = routeIncident(kind, changedBoat);
      return { ...current, fleet: updatedFleet, incidents: decision ? [decision, ...current.incidents] : current.incidents,
        lastIncident: `${incidentLabels[kind]} · ${changedBoat.name} · ${kind === "keel" ? `${changedBoat.depthUnderKeel} m clearance` : `${changedBoat.temperature}°C`}` };
    });
  };

  const resolve = (decision: Decision, outcome: DecisionOutcome) => {
    setState((current) => {
      if (current.resolutions[decision.id]) return current;
      const fleet = current.fleet.map((boat) => {
        if (decision.kind === "dispatch" && outcome === "approved" && boat.id === "rp-04")
          return changeReadings(boat, { status: "normal", x: 70, y: 72, heading: 335, speed: 9.6, rpm: 1780, fuelBurnRate: 24, fuelLitres: 82, route: "Rescue dispatch — 14 seats reserved", nextWaypoint: "Niger Star · 14 min ETA", distanceToStrandedVessel: 3.6 }, sampleTime());
        if (decision.kind === "throttle" && outcome === "signaled" && boat.id === "rp-01")
          return changeReadings(boat, { status: boat.status === "critical" ? "critical" : "normal", x: 24, y: 56, speed: Math.max(0, boat.speed - 3.5), rpm: 1450, fuelBurnRate: Math.round(boat.fuelBurnRate * 0.78 * 10) / 10, nextWaypoint: "Okrika bend · reduced throttle", fuelOptimal: true }, sampleTime());
        return boat;
      });
      return { ...current, fleet, resolutions: { ...current.resolutions, [decision.id]: { outcome, decision } } };
    });
  };

  const sync = !browserOnline ? "Local only · browser offline" : edge ? "Local only · manual blackout" : "Local only · browser online (no remote sync)";
  const cost = edge ? "$0.0000" : `$${(routed.tokenCost * 0.000002).toFixed(4)}`;
  const metrics = <><span>Mode: <strong className={edge ? "text-amber-300" : "text-cyan-300"}>{edge ? "Edge heuristics" : "Simulated cloud"}</strong></span><span>Scenario latency: <strong className="text-slate-100">{edge ? "~38 ms (local)" : `~${routed.simulatedCloudRoundtripMs} ms (cloud)`}</strong></span><span>Measured compute: <strong className="text-slate-100">{routed.latency.toFixed(2)} ms</strong></span><span>Est. USD token cost: <strong className="text-slate-100">{cost}</strong></span><span>Sync: <strong className="text-slate-100">{sync}</strong></span></>;

  return <div className="min-h-screen bg-[#070b12] text-slate-200 selection:bg-cyan-400/30">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(19,93,108,.13),transparent_42%)]" />
    <div className="relative mx-auto flex min-h-screen max-w-[1800px]">
      {mobileMenu && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileMenu(false)} aria-label="Close menu" />}
      <aside className={`${mobileMenu ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-60 flex-col border-r border-slate-800 bg-[#0a1018] px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[216px] lg:shrink-0`}>
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Compass className="text-cyan-400" size={24} /><div><div className="text-sm font-bold text-white">RIVER<span className="text-cyan-400">PILOT</span></div><div className="font-mono text-[9px] tracking-wider text-slate-500">NIGER DELTA · DEMO</div></div></div><button onClick={() => setMobileMenu(false)} className="rounded p-2 lg:hidden" aria-label="Close menu"><X size={18} /></button></div>
        <div className="mt-12 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">Mission control</div>
        <div className="mt-4 px-3 text-xs text-slate-400">Four vessels · {pendingCount} decisions awaiting review</div>
        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400"><ShieldCheck size={15} className="mb-2 text-cyan-400" />Scenario data and local heuristics. No commands transmitted.</div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-800/80 px-4 py-3 md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="rounded p-2 lg:hidden" aria-label="Open menu"><Menu size={20} /></button><span className="text-sm font-semibold text-white">Mission control · Niger Delta</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-400" aria-live="polite">{metrics}</div></header>
        <div className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 md:px-8">
          <div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-cyan-400">Fleet command / Niger Delta</p><h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">RiverPilot · Mission control</h1><p className="mt-2 text-sm text-slate-400">Simulated telemetry and local decision support for four river vessels.</p></div>
          {edge && <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"><CloudOff className="mr-2 inline" size={16} />Offline / edge mode: {sync}. Local heuristics remain available; no cloud request is made.</div>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
             <Metric label="Vessels monitored" value={String(state.fleet.length).padStart(2, "0")} detail={`${state.fleet.filter((b) => b.status === "critical").length} critical · ${state.fleet.filter((b) => b.status === "idle").length} idle`} />
            <Metric label="Decisions pending" value={String(pendingCount)} detail="Operator review required" />
            <Metric label="Inference mode" value={edge ? "EDGE" : "CLOUD*"} detail={edge ? "Local deterministic heuristics" : "*Simulated cloud; no API"} />
            <Metric label="Estimated token cost" value={cost} detail={`${routed.tokenCost} simulated tokens · USD estimate`} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="min-w-0 space-y-5"><div><h2 className="flex items-center gap-2 font-semibold text-white"><Satellite size={17} className="text-cyan-400" /> Niger Delta fleet map</h2><p className="mt-1 text-xs text-slate-400">Select a labeled vessel to inspect its readings. Map positions are illustrative.</p></div><div className="relative"><FleetMap fleet={state.fleet} selectedId={selectedId} onSelect={setSelectedId} /><TelemetryDrawer boat={selectedBoat} onClose={() => setSelectedId(null)} /></div><IncidentSimulator onSimulate={simulate} lastIncident={state.lastIncident} blackout={hydrated && !state.requestedOnline} /></div>
            <div className="min-w-0 space-y-5"><section className="rounded-2xl border border-slate-800 bg-[#0d141d]/80 p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Inference router</p><h2 className="mt-1 flex items-center gap-2 font-semibold text-white"><Cpu size={17} className="text-cyan-400" /> Intelligence status</h2>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex min-w-0 items-center gap-2">{edge ? <CloudOff size={18} className="shrink-0 text-amber-300" /> : <Wifi size={18} className="shrink-0 text-cyan-300" />}<div><p className="text-xs font-semibold text-white">{edge ? "Edge heuristics" : "Simulated cloud"}</p><p className="text-[10px] text-slate-400">{sync}</p></div></div><button type="button" role="switch" aria-checked={state.requestedOnline} aria-label="Request simulated cloud mode (manual blackout switch)" onClick={() => simulate("blackout")} className={`relative h-7 w-12 shrink-0 rounded-full ${state.requestedOnline ? "bg-cyan-500" : "bg-slate-600"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-slate-950 transition-all ${state.requestedOnline ? "left-6" : "left-1"}`} /></button></div>
              <div className="mt-3 grid gap-2 rounded-lg bg-slate-950/50 p-3 font-mono text-[11px] text-slate-300">{metrics}</div><p className="mt-3 text-[11px] text-slate-500">{routed.reason} Local compute is measured; roundtrip and token price are scenario estimates. No remote API or WebGPU is used.</p>
              <div className="mt-3 space-y-1 border-t border-slate-800 pt-3 text-[11px] text-slate-400"><p className="font-semibold text-slate-300">Diagnostics · latest samples</p>{routed.diagnostics.map((item) => <p key={item.boatId}><span className="text-slate-200">{item.name}:</span> {item.alerts.join(" · ")}</p>)}</div>
            </section><section className="rounded-2xl border border-slate-800 bg-[#0d141d]/80 p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Priority queue</p><h2 className="mt-1 flex items-center gap-2 font-semibold text-white"><Activity size={17} className="text-cyan-400" /> Decisions · {pendingCount} pending</h2><div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">{decisions.map((decision) => <DecisionCard key={decision.id} decision={state.resolutions[decision.id]?.decision ?? decision} outcome={state.resolutions[decision.id]?.outcome} onAction={(action) => resolve(decision, action)} />)}</div></section><div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.04] p-4 text-xs text-slate-300"><ShieldCheck size={16} className="mr-2 inline text-cyan-300" />Human-in-the-loop: all approvals, dismissals and captain signals are simulated local state changes. No commands are transmitted.</div></div>
          </div><footer className="border-t border-slate-800 pt-4 font-mono text-[10px] uppercase tracking-wider text-slate-500">RiverPilot AI · Niger Delta simulated demo</footer>
        </div>
      </main>
    </div>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-800 bg-[#0d141d]/80 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-mono text-2xl text-white">{value}</p><p className="mt-2 text-[11px] text-slate-500">{detail}</p></div>;
}
