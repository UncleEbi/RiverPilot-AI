export type DemoIncident = "engine-overheat" | "low-keel" | null;
export type DemoOutcome = "approved" | "dismissed" | null;

export type DemoState = {
  online: boolean;
  incident: DemoIncident;
  outcome: DemoOutcome;
  selectedBoat: string;
};

export const initialDemoState: DemoState = {
  online: true,
  incident: null,
  outcome: null,
  selectedBoat: "boat-2",
};

export function toggleConnection(state: DemoState): DemoState {
  return { ...state, online: !state.online };
}

export function simulateIncident(state: DemoState, incident: Exclude<DemoIncident, null>): DemoState {
  return {
    ...state,
    incident,
    outcome: null,
    selectedBoat: incident === "engine-overheat" ? "boat-2" : "boat-3",
  };
}

export function resolveIncident(state: DemoState, outcome: Exclude<DemoOutcome, null>): DemoState {
  return { ...state, outcome };
}

export function runDemoFlow(): DemoState[] {
  const offline = { ...initialDemoState, online: false };
  const incident = simulateIncident(offline, "engine-overheat");
  const approved = resolveIncident(incident, "approved");
  return [offline, incident, approved];
}
