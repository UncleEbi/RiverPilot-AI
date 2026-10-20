"use client";

import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { Decision, DecisionPriority } from "@/lib/inferenceRouter";

export type DecisionOutcome = "approved" | "dismissed" | "signaled" | "ignored" | "acknowledged";
const priorityStyle: Record<DecisionPriority, string> = { critical: "text-rose-300 bg-rose-400/10 border-rose-400/20", high: "text-amber-300 bg-amber-400/10 border-amber-400/20", watch: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" };
const outcomeLabels: Record<DecisionOutcome, string> = {
  approved: "Dispatch approved · Swali Ferry underway", dismissed: "Dispatch dismissed · Swali Ferry remains idle",
  signaled: "Captain signaled · simulated throttle adjusted", ignored: "Optimization ignored · speed unchanged",
  acknowledged: "Incident acknowledged · no command transmitted",
};

export default function DecisionCard({ decision, outcome, onAction }: { decision: Decision; outcome?: DecisionOutcome; onAction: (outcome: DecisionOutcome) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [primary, secondary]: [string, string] = decision.kind === "dispatch" ? ["Approve Dispatch", "Override / Dismiss"]
    : decision.kind === "throttle" ? ["Signal Captain", "Ignore"] : ["Acknowledge", "Dismiss"];
  const primaryOutcome: DecisionOutcome = decision.kind === "dispatch" ? "approved" : decision.kind === "throttle" ? "signaled" : "acknowledged";
  const secondaryOutcome: DecisionOutcome = decision.kind === "throttle" ? "ignored" : "dismissed";
  const panelId = `lineage-${decision.id}`;
  return <article className={`rounded-xl border p-4 ${outcome ? "border-emerald-400/20 bg-emerald-400/5" : "border-slate-800 bg-slate-900/50"}`}>
    <div className="flex items-start gap-2"><ShieldAlert size={17} className={decision.priority === "critical" ? "mt-1 shrink-0 text-rose-300" : "mt-1 shrink-0 text-amber-300"} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyle[decision.priority]}`}>{decision.priority} · priority {decision.kind === "dispatch" ? "1" : decision.kind === "throttle" ? "2" : "incident"}</span><span className="font-mono text-[10px] text-slate-400">{decision.confidence}% confidence</span></div><h3 className="mt-2 text-sm font-semibold text-white">{decision.title}</h3>{decision.kind === "throttle" && <p className="mt-1 text-xs text-amber-200">Tide / turn speed optimization</p>}<p className="mt-1 text-xs leading-relaxed text-slate-300">{decision.detail}</p><p className="mt-2 text-xs text-cyan-200">{decision.tradeoff}</p></div></div>
    {outcome && <p role="status" className="mt-3 rounded-lg bg-emerald-400/10 p-2 text-xs text-emerald-200">{outcome === "dismissed" && decision.kind !== "dispatch" ? "Incident dismissed · vessel readings unchanged" : outcomeLabels[outcome]}</p>}
    <div className="mt-3 flex flex-wrap items-center gap-2">{!outcome && <><button type="button" onClick={() => onAction(primaryOutcome)} className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/25">{primary}</button><button type="button" onClick={() => onAction(secondaryOutcome)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">{secondary}</button></>}
      <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 rounded px-2 py-2 text-xs text-slate-300 hover:text-cyan-200">{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Show Rationale / Data Lineage</button></div>
    {expanded && <div id={panelId} className="mt-3 space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300"><p><strong className="text-white">Rationale:</strong> {decision.rationale}</p><p><strong className="text-white">Tradeoff:</strong> {decision.tradeoff}</p><p className="text-[11px] text-slate-400">Exact sensor snapshots cited by this recommendation (not live values after an action):</p>
      {decision.lineage.map(({ boatId, point }, i) => <div key={`${boatId}-${point.time}-${i}`} className="rounded border border-slate-800 p-2 font-mono text-[10px] leading-relaxed"><p className="text-cyan-300">{boatId.toUpperCase()} · {point.time} UTC</p><p>Speed {point.speed} kn · Engine {point.temp}°C · Battery {point.battery}% · RPM {point.rpm}</p><p>Fuel burn {point.fuelBurnRate} L/h · Fuel remaining {point.fuelLitres} L · Depth under keel {point.depthUnderKeel} m</p><p>Passenger load {point.passengerLoad} · Vessel load {point.loadPercent}%{point.distanceToStrandedVessel !== undefined ? ` · Distance to stranded vessel ${point.distanceToStrandedVessel} km` : ""}</p></div>)}
    </div>}
  </article>;
}
