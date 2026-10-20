"use client";

import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TelemetryPoint } from "@/lib/mockFleetData";

export default function TelemetryChart({ data }: { data: TelemetryPoint[] }) {
  return <div className="h-48 w-full" role="img" aria-label={`Speed and fuel burn history: ${data.map((p) => `${p.time}: ${p.speed} knots, ${p.fuelBurnRate} litres per hour`).join("; ")}`}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 8, left: -25, bottom: 0 }}>
        <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="speed" tick={{ fill: "#22d3ee", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="fuel" orientation="right" tick={{ fill: "#fbbf24", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
        <Tooltip contentStyle={{ background: "#0d141d", border: "1px solid #243246", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#e2e8f0" }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line yAxisId="speed" type="monotone" dataKey="speed" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} name="Speed (kn)" />
        <Line yAxisId="fuel" type="monotone" dataKey="fuelBurnRate" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} name="Fuel burn (L/h)" />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
