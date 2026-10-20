import type { Boat, IncidentKind, TelemetryPoint } from "./mockFleetData";

export type DecisionPriority = "critical" | "high" | "watch";
export type DecisionKind = "dispatch" | "throttle" | "keel" | "overheat";
export type TelemetryLineage = {
  boatId: string;
  point: TelemetryPoint; // Actual sample, including its original time and all readings.
};
export type Decision = {
  id: string;
  priority: DecisionPriority;
  boatId: string;
  title: string;
  detail: string;
  rationale: string;
  action: string;
  secondaryAction: string;
  confidence: number; // percent
  lineage: TelemetryLineage[];
  tradeoff: string;
  kind: DecisionKind;
};

const latest = (boat: Boat): TelemetryPoint | undefined => boat.telemetry.at(-1);
const lineage = (boat: Boat): TelemetryLineage[] => {
  const point = latest(boat);
  return point ? [{ boatId: boat.id, point }] : [];
};

/** Stable across server and client rendering; the initial queue contains exactly two cards. */
export const baselineDecisions = (fleet: Boat[]): Decision[] => {
  const stranded = fleet.find((boat) => boat.name === "Niger Star");
  const rescue = fleet.find((boat) => boat.name === "Swali Ferry");
  const express = fleet.find((boat) => boat.name === "Delta Express");
  const decisions: Decision[] = [];

  if (stranded && rescue) {
    const passengers = latest(stranded)?.passengerLoad ?? stranded.passengerLoad;
    const distance = latest(rescue)?.distanceToStrandedVessel ?? rescue.distanceToStrandedVessel;
    decisions.push({
      id: "baseline-dispatch-niger-star", kind: "dispatch", priority: "critical",
      boatId: stranded.id, title: "Stranded Passengers on Niger Star",
      detail: `Niger Star is grounded on a sandbank with ${passengers} passengers. Dispatch Swali Ferry from ${distance ?? 4.2} km away; ETA 14 min.`,
      rationale: `Swali Ferry is idle at 0% load with ${rescue.capacity} passenger places; Niger Star has ${passengers} aboard and ${latest(stranded)?.depthUnderKeel ?? stranded.depthUnderKeel} m under-keel clearance.`,
      action: "Dispatch Swali Ferry", secondaryAction: "Notify Niger Star crew",
      confidence: 92, lineage: [...lineage(stranded), ...lineage(rescue)],
      tradeoff: "Uses +8 L fuel to reduce passenger delay by 45 min.",
    });
  }

  if (express) {
    const load = latest(express)?.loadPercent ?? express.loadPercent;
    decisions.push({
      id: "baseline-throttle-delta-express", kind: "throttle", priority: "high",
      boatId: express.id, title: "Approving Throttle Drop for Delta Express",
      detail: `Delta Express is at ${load}% load and the river current turns in 18 min. Slowing by 3.5 knots saves 22% fuel with only a 6-minute port arrival delta.`,
      rationale: `Current speed is ${latest(express)?.speed ?? express.speed} knots with ${latest(express)?.fuelBurnRate ?? express.fuelBurnRate} L/h fuel burn; easing throttle ahead of Okrika bend preserves the fuel-optimal route.`,
      action: "Signal Captain", secondaryAction: "Ignore",
      confidence: 84, lineage: lineage(express),
      tradeoff: "Saves 22% fuel with a +6 min arrival-time delta.",
    });
  }
  return decisions;
};

let incidentSequence = 0;

/** A blackout only changes routing mode; it cannot manufacture a decision card. */
export function routeIncident(kind: "blackout", boat: Boat): null;
export function routeIncident(kind: "keel" | "overheat", boat: Boat): Decision;
export function routeIncident(kind: IncidentKind, boat: Boat): Decision | null;
export function routeIncident(kind: IncidentKind, boat: Boat): Decision | null {
  if (kind === "blackout") return null;
  return makeIncidentDecision(kind, boat, `incident-${kind}-${boat.id}-${++incidentSequence}`);
}

const makeIncidentDecision = (kind: "keel" | "overheat", boat: Boat, id: string): Decision => {
  const point = latest(boat);
  if (kind === "keel") {
    const depth = point?.depthUnderKeel ?? boat.depthUnderKeel;
    const speed = point?.speed ?? boat.speed;
    return {
      id, kind, priority: "critical", boatId: boat.id,
      title: `Protect ${boat.name} from shallow water`,
      detail: `${depth} m clearance under keel at ${speed} knots. Stop and reassess the sandbank approach.`,
      rationale: `The most recent ${point?.time ?? "available"} telemetry reports ${depth} m under-keel clearance. Reducing speed and checking the depth prevents further grounding.`,
      action: "Stop and assess keel", secondaryAction: "Request shallow-water escort",
      confidence: depth <= 0.5 ? 94 : 81, lineage: lineage(boat),
      tradeoff: "Stopping adds time but avoids hull and passenger risk.",
    };
  }
  const temp = point?.temp ?? boat.temperature;
  const previous = boat.telemetry.at(-2);
  const rise = previous ? Math.round((temp - previous.temp) * 10) / 10 : 0;
  return {
    id, kind, priority: temp >= 95 ? "critical" : "high", boatId: boat.id,
    title: `Cool ${boat.name}'s engine`,
    detail: `Engine temperature ${temp}°C${boat.inCommsDeadZone ? " in a communications dead zone" : ""}; reduce load now.`,
    rationale: `Temperature changed ${rise >= 0 ? "+" : ""}${rise}°C since ${previous?.time ?? "the previous sample"}; most recent RPM ${point?.rpm ?? boat.rpm} and fuel burn ${point?.fuelBurnRate ?? boat.fuelBurnRate} L/h.`,
    action: "Throttle back", secondaryAction: "Alert maintenance crew",
    confidence: temp >= 95 ? 91 : 87,
    lineage: [
      ...(previous ? [{ boatId: boat.id, point: previous }] : []),
      ...lineage(boat),
    ],
    tradeoff: "Lower speed increases ETA but reduces thermal shutdown risk.",
  };
};

export type RouterMode = "cloud-simulated" | "edge";
export type BoatDiagnostic = {
  boatId: string;
  name: string;
  status: Boat["status"];
  temperature: number;
  rpm: number;
  fuelBurnRate: number;
  depthUnderKeel: number;
  passengerLoad: number;
  capacity: number;
  loadPercent: number;
  fuelLitres: number;
  distanceToStrandedVessel?: number;
  inCommsDeadZone: boolean;
  alerts: string[];
  evidence: TelemetryLineage[];
};
export type InferenceResult = {
  mode: RouterMode;
  diagnostics: BoatDiagnostic[];
  decisions: Decision[];
  latency: number; // Measured local compute time in ms; never includes a simulated network delay.
  simulatedCloudRoundtripMs: number | null; // Scenario estimate, NOT observed latency.
  tokenCost: number; // Estimated simulated cloud tokens; edge heuristics consume zero.
  reason: string;
};
export type InferenceRouterOptions = {
  requestedOnline: boolean;
  latencyBudgetMs?: number;
};

const CLOUD_ROUNDTRIP_ESTIMATE_MS = 820;
const clock = (): number => typeof performance !== "undefined" ? performance.now() : 0;

const diagnose = (boat: Boat): BoatDiagnostic => {
  const reading = latest(boat);
  const temperature = reading?.temp ?? boat.temperature;
  const depth = reading?.depthUnderKeel ?? boat.depthUnderKeel;
  const passengers = reading?.passengerLoad ?? boat.passengerLoad;
  const alerts: string[] = [];
  if (depth <= 0.5) alerts.push(`Under-keel clearance ${depth} m: grounding risk`);
  if (temperature >= 90) alerts.push(`Engine temperature ${temperature}°C: thermal risk`);
  if (boat.inCommsDeadZone) alerts.push("Communications dead zone: retain local autonomy");
  if (boat.status === "critical" && passengers > 0) alerts.push(`${passengers} passengers need assistance`);
  if (boat.status === "idle") alerts.push("Idle vessel available for dispatch");
  if (alerts.length === 0) alerts.push("Readings within operating range");
  return {
    boatId: boat.id, name: boat.name, status: boat.status,
    temperature, rpm: reading?.rpm ?? boat.rpm,
    fuelBurnRate: reading?.fuelBurnRate ?? boat.fuelBurnRate,
    depthUnderKeel: depth, passengerLoad: passengers, capacity: boat.capacity,
    loadPercent: reading?.loadPercent ?? boat.loadPercent,
    fuelLitres: reading?.fuelLitres ?? boat.fuelLitres,
    distanceToStrandedVessel: reading?.distanceToStrandedVessel ?? boat.distanceToStrandedVessel,
    inCommsDeadZone: Boolean(boat.inCommsDeadZone), alerts, evidence: lineage(boat),
  };
};

/**
 * Synchronous, deterministic mock routing: NO fetch, API call, timer or model.
 * `navigator.onLine` is a browser hint; on the server or in a blackout use edge.
 * The cloud path is explicitly a SIMULATION with a fixed roundtrip estimate.
 */
export function inferenceRouter(fleet: Boat[], requestedOnline: boolean, latencyBudgetMs?: number): InferenceResult;
export function inferenceRouter(fleet: Boat[], options: InferenceRouterOptions): InferenceResult;
export function inferenceRouter(
  fleet: Boat[], onlineOrOptions: boolean | InferenceRouterOptions,
  latencyBudgetMs = Number.POSITIVE_INFINITY,
): InferenceResult {
  const started = clock();
  const requestedOnline = typeof onlineOrOptions === "boolean" ? onlineOrOptions : onlineOrOptions.requestedOnline;
  const budget = typeof onlineOrOptions === "boolean" ? latencyBudgetMs : onlineOrOptions.latencyBudgetMs ?? Number.POSITIVE_INFINITY;
  const browserOnline = typeof navigator !== "undefined" && navigator.onLine;
  const canSimulateCloud = requestedOnline && browserOnline && budget >= CLOUD_ROUNDTRIP_ESTIMATE_MS;
  const mode: RouterMode = canSimulateCloud ? "cloud-simulated" : "edge";
  const diagnostics = fleet.map(diagnose);
  const decisions = baselineDecisions(fleet);

  // The local fallback responds to recent samples without token cost or network.
  // These additional alerts are generated only in edge mode, not in the baseline.
  if (mode === "edge") {
    for (const boat of fleet) {
      const point = latest(boat);
      if ((point?.depthUnderKeel ?? boat.depthUnderKeel) <= 0.5) {
        decisions.push(makeIncidentDecision("keel", boat, `edge-keel-${boat.id}`));
      }
      if ((point?.temp ?? boat.temperature) >= 95) {
        decisions.push(makeIncidentDecision("overheat", boat, `edge-overheat-${boat.id}`));
      }
    }
  }

  return {
    mode, diagnostics, decisions,
    latency: Math.max(0, clock() - started),
    simulatedCloudRoundtripMs: canSimulateCloud ? CLOUD_ROUNDTRIP_ESTIMATE_MS : null,
    tokenCost: canSimulateCloud ? 6000 : 0,
    reason: !requestedOnline ? "Cloud disabled by operator; local heuristics active."
      : !browserOnline ? "Browser offline or unavailable; local heuristics active."
      : !canSimulateCloud ? `Latency budget below ${CLOUD_ROUNDTRIP_ESTIMATE_MS} ms simulated cloud estimate; local heuristics active.`
      : "Cloud API SIMULATION only; deterministic diagnostics, no network request.",
  };
}
