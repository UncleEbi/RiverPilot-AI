"use client";

import { Flame, Radio, Waves } from "lucide-react";
import type { IncidentKind } from "@/lib/mockFleetData";

const items: { kind: IncidentKind; label: string; detail: string; icon: typeof Flame; color: string }[] = [
  { kind: "keel", label: "Shallow keel", detail: "Depth anomaly", icon: Waves, color: "text-amber-300" },
  { kind: "overheat", label: "Engine overheat", detail: "Thermal spike", icon: Flame, color: "text-rose-300" },
  { kind: "blackout", label: "Comms blackout", detail: "Drop heartbeat", icon: Radio, color: "text-violet-300" },
];

export default function IncidentSimulator({ onSimulate, lastIncident, blackout }: { onSimulate: (kind: IncidentKind) => void; lastIncident: string | null; blackout: boolean }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#0d141d]/80 p-4"><div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-400">Synthetic incident lab</p><p className="mt-1 text-xs text-slate-300">Inject sample changes to test local decisions.</p></div><span className="rounded bg-violet-400/10 px-2 py-1 font-mono text-[9px] text-violet-300">SANDBOX</span></div><div className="grid gap-2 sm:grid-cols-3">{items.map(({ kind, label, detail, icon: Icon, color }) => <button type="button" key={kind} onClick={() => onSimulate(kind)} className="group rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-left transition hover:border-slate-500 hover:bg-slate-900"><Icon size={17} className={`${color} mb-2`} /><p className="text-xs font-medium text-slate-100">{kind === "blackout" && blackout ? "Restore connection" : label}</p><p className="mt-1 text-[11px] text-slate-400">{kind === "blackout" ? (blackout ? "Turn manual blackout off" : "Force edge mode") : detail}</p></button>)}</div>{lastIncident && <p role="status" className="mt-3 border-t border-slate-800 pt-3 text-xs text-violet-300">Last injection: <span className="text-slate-200">{lastIncident}</span></p>}</section>;
}
