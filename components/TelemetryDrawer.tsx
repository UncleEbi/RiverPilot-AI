"use client";

import { X } from "lucide-react";
import type { Boat, BoatStatus } from "@/lib/mockFleetData";
import TelemetryChart from "./TelemetryChart";

const statusStyle: Record<BoatStatus, string> = { normal: "text-cyan-300 bg-cyan-400/10", warning: "text-amber-300 bg-amber-400/10", critical: "text-rose-300 bg-rose-400/10", idle: "text-slate-300 bg-slate-400/10" };

export default function TelemetryDrawer({ boat, onClose }: { boat: Boat | null; onClose: () => void }) {
  if (!boat) return null;
  return <aside aria-label={`${boat.name} telemetry`} className="absolute inset-0 z-20 overflow-y-auto border-l border-slate-700 bg-[#0a111a]/98 p-4 shadow-2xl sm:left-auto sm:w-[min(100%,390px)] sm:p-5">
    <div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Simulated vessel telemetry</p><h2 className="mt-1 text-xl font-semibold text-white">{boat.name}</h2><p className="text-xs text-cyan-300">{boat.callsign} · {boat.route}</p></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-700 p-2 text-white hover:bg-slate-800" aria-label="Close telemetry"><X size={18} /></button></div>
    <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle[boat.status]}`}>{boat.status}</span>
    {boat.id === "rp-04" && boat.status !== "idle" && <p className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-xs text-cyan-200">Rescue dispatch underway · ETA 14 min · 14 seats reserved. Currently {boat.passengerLoad} passengers aboard.</p>}
    <div className="mt-4 grid grid-cols-2 gap-2">{[
      ["Speed", `${boat.speed} kn`], ["Heading", `${boat.heading}°`], ["RPM", `${boat.rpm}`], ["Engine temperature", `${boat.temperature}°C`],
      ["Fuel burn", `${boat.fuelBurnRate} L/h`], ["Fuel remaining", `${boat.fuelLitres} L`], ["Depth under keel", `${boat.depthUnderKeel} m`],
      ["Passenger load", `${boat.passengerLoad} / ${boat.capacity} (${boat.loadPercent}%)`], ["Battery", `${boat.battery}%`],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 font-mono text-sm text-slate-100">{value}</p></div>)}</div>
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/45 p-3"><p className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">Speed &amp; fuel burn · recorded sample times (UTC)</p><TelemetryChart data={boat.telemetry} /></div>
    <p className="mt-3 text-xs text-slate-300">Next waypoint: {boat.nextWaypoint}</p>
  </aside>;
}
