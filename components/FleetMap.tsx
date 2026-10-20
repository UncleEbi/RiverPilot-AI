"use client";

import { Layers, Waves } from "lucide-react";
import { useState } from "react";
import type { Boat, BoatStatus } from "@/lib/mockFleetData";

const statusColor: Record<BoatStatus, string> = { normal: "#22d3ee", warning: "#fbbf24", critical: "#fb7185", idle: "#94a3b8" };
const statusText: Record<BoatStatus, string> = { normal: "text-cyan-300", warning: "text-amber-300", critical: "text-rose-300", idle: "text-slate-300" };

export default function FleetMap({ fleet, selectedId, onSelect }: { fleet: Boat[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [showRoute, setShowRoute] = useState(true);
  const dispatched = fleet.find((boat) => boat.id === "rp-04")?.status !== "idle";
  return <section className="scanline relative min-h-[440px] overflow-hidden rounded-2xl border border-slate-800 bg-[#09131c] sm:min-h-[490px]" aria-label="Illustrative Niger Delta fleet map">
    <div className="absolute inset-0 mission-grid opacity-70" />
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-6 66 Q16 50 32 58 T66 68 Q83 82 106 54 M44 -5 Q48 18 53 33 T74 67" fill="none" stroke="#103e4b" strokeWidth="12" opacity=".8" />
      <path d="M-6 66 Q16 50 32 58 T66 68 Q83 82 106 54 M44 -5 Q48 18 53 33 T74 67" fill="none" stroke="#0d2933" strokeWidth="9" />
      {showRoute && <><path d="M18 59 Q42 36 52 34 T73 66" fill="none" stroke="#34d399" strokeWidth=".6" strokeDasharray="2 1" /><path d="M68 77 Q70 70 73 66" fill="none" stroke="#22d3ee" strokeWidth=".7" strokeDasharray="1.5 1" /></>}
      <path d="M68 62 Q74 57 81 62 L85 67 Q78 70 73 67Z" fill="#b99763" opacity=".45" />
    </svg>
    <div className="map-hud absolute left-4 top-4 flex items-center gap-2 text-xs font-semibold text-cyan-300"><Waves size={15} /> Niger Delta · Nun / Bonny / New Calabar</div>
    <button type="button" aria-pressed={showRoute} onClick={() => setShowRoute((value) => !value)} className="absolute right-4 top-12 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/85 px-2 py-1.5 text-[11px] text-slate-200 sm:top-4"><Layers size={13} /> Routes {showRoute ? "on" : "off"}</button>
    <span className="pointer-events-none absolute left-[70%] top-[60%] rounded bg-slate-950/85 px-1 text-[10px] text-amber-200">Swali sandbank</span>
    <span className="pointer-events-none absolute left-[31%] top-[42%] rounded bg-slate-950/85 px-1 text-[10px] text-amber-200">Shallows</span>
    <span className="pointer-events-none absolute left-[58%] top-[86%] rounded bg-slate-950/85 px-1 text-[10px] text-slate-300">Swali docks</span>
    {showRoute && <span className="pointer-events-none absolute left-[27%] top-[21%] rounded bg-slate-950/85 px-1 text-[10px] text-emerald-300">Bonny / Okrika route</span>}
    {fleet.map((boat) => <button key={boat.id} type="button" onClick={() => onSelect(boat.id)} aria-label={`Inspect ${boat.name}, ${boat.status}${boat.id === "rp-04" && dispatched ? ", rescue dispatch underway" : ""}`} aria-pressed={selectedId === boat.id} style={{ left: `${boat.x}%`, top: `${boat.y}%` }} className={`absolute z-10 flex min-h-10 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-lg border bg-slate-950/90 px-1.5 py-1 text-left shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${selectedId === boat.id ? "border-cyan-300" : "border-slate-700"}`}>
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: statusColor[boat.status] }} />
      <span className="max-w-[100px] text-[10px] leading-tight sm:max-w-none"><span className={`block font-semibold ${statusText[boat.status]}`}>{boat.name}</span><span className="block text-slate-300">{boat.id === "rp-04" && dispatched ? "DISPATCH UNDERWAY" : boat.status} · {boat.speed} kn · {boat.fuelBurnRate} L/h</span></span>
    </button>)}
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950/90 p-2 text-[10px] text-slate-300"><span>● <span className="text-cyan-300">Normal</span> · <span className="text-amber-300">Warning</span> · <span className="text-rose-300">Critical</span> · <span className="text-slate-300">Idle</span></span><span>SIMULATED AIS · {fleet.length} vessels{dispatched ? " · Swali rescue underway" : ""}</span></div>
  </section>;
}
