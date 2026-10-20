import assert from "node:assert/strict";
import test from "node:test";
import { initialDemoState, resolveIncident, runDemoFlow, simulateIncident, toggleConnection } from "@/lib/demoFlow";

test("offline toggle switches to edge mode without changing the selected vessel", () => {
  const next = toggleConnection(initialDemoState);
  assert.equal(next.online, false);
  assert.equal(next.selectedBoat, "boat-2");
});

test("each incident selects the correct vessel and approval creates a local outcome", () => {
  const overheat = simulateIncident(initialDemoState, "engine-overheat");
  assert.equal(overheat.incident, "engine-overheat");
  assert.equal(overheat.selectedBoat, "boat-2");
  assert.equal(resolveIncident(overheat, "approved").outcome, "approved");

  const shallow = simulateIncident(initialDemoState, "low-keel");
  assert.equal(shallow.incident, "low-keel");
  assert.equal(shallow.selectedBoat, "boat-3");
});

test("run demo progresses through offline, incident, and approval states", () => {
  const steps = runDemoFlow();
  assert.deepEqual(steps.map((step) => [step.online, step.incident, step.outcome]), [
    [false, null, null],
    [false, "engine-overheat", null],
    [false, "engine-overheat", "approved"],
  ]);
});
