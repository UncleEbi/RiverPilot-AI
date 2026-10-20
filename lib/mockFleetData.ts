export type BoatStatus = "normal" | "warning" | "critical" | "idle";
export type IncidentKind = "keel" | "overheat" | "blackout";

// Each sample is a complete, immutable-by-convention sensor snapshot. The final
// sample agrees with the vessel's current readings so a decision can cite it.
export type TelemetryPoint = {
  time: string;
  speed: number;
  temp: number;
  battery: number;
  rpm: number;
  fuelBurnRate: number; // litres/hour
  depthUnderKeel: number; // metres
  passengerLoad: number;
  loadPercent: number;
  fuelLitres: number;
  distanceToStrandedVessel?: number; // kilometres
};

export type Boat = {
  id: string;
  name: string;
  callsign: string;
  status: BoatStatus;
  x: number;
  y: number;
  speed: number; // knots
  heading: number;
  battery: number; // percent
  temperature: number; // °C
  route: string;
  nextWaypoint: string;
  rpm: number;
  fuelBurnRate: number; // litres/hour
  depthUnderKeel: number; // metres
  passengerLoad: number;
  capacity: number; // passengers
  loadPercent: number; // vessel load, percent
  fuelLitres: number;
  distanceToStrandedVessel?: number; // kilometres
  inCommsDeadZone?: boolean;
  fuelOptimal?: boolean;
  telemetry: TelemetryPoint[];
};

const samples = (boat: Omit<Boat, "telemetry">, history: Pick<TelemetryPoint, "time" | "speed" | "temp" | "battery" | "rpm" | "fuelBurnRate" | "depthUnderKeel" | "fuelLitres">[]): TelemetryPoint[] => [
  ...history.map((point) => ({
    ...point,
    passengerLoad: boat.passengerLoad,
    loadPercent: boat.loadPercent,
    ...(boat.distanceToStrandedVessel === undefined ? {} : { distanceToStrandedVessel: boat.distanceToStrandedVessel }),
  })),
  {
    time: "09:40", speed: boat.speed, temp: boat.temperature, battery: boat.battery,
    rpm: boat.rpm, fuelBurnRate: boat.fuelBurnRate, depthUnderKeel: boat.depthUnderKeel,
    passengerLoad: boat.passengerLoad, loadPercent: boat.loadPercent,
    fuelLitres: boat.fuelLitres,
    ...(boat.distanceToStrandedVessel === undefined ? {} : { distanceToStrandedVessel: boat.distanceToStrandedVessel }),
  },
];

const deltaExpress: Omit<Boat, "telemetry"> = {
  id: "rp-01", name: "Delta Express", callsign: "DE-01", status: "normal",
  x: 21, y: 58, speed: 8.8, heading: 42, battery: 85, temperature: 70,
  route: "Bonny River / Port Harcourt", nextWaypoint: "Okrika bend",
  rpm: 1850, fuelBurnRate: 22, depthUnderKeel: 2.4,
  passengerLoad: 17, capacity: 20, loadPercent: 85, fuelLitres: 128,
  fuelOptimal: true,
};

const creekRunner: Omit<Boat, "telemetry"> = {
  id: "rp-02", name: "Creek Runner", callsign: "CR-02", status: "warning",
  x: 52, y: 34, speed: 6.2, heading: 118, battery: 61, temperature: 98,
  route: "New Calabar Creek", nextWaypoint: "Choba jetty",
  rpm: 2100, fuelBurnRate: 27, depthUnderKeel: 1.7,
  passengerLoad: 8, capacity: 16, loadPercent: 50, fuelLitres: 76,
  inCommsDeadZone: true,
};

const nigerStar: Omit<Boat, "telemetry"> = {
  id: "rp-03", name: "Niger Star", callsign: "NS-03", status: "critical",
  x: 73, y: 66, speed: 0, heading: 302, battery: 74, temperature: 76,
  route: "Nun River / Yenagoa", nextWaypoint: "Swali sandbank",
  rpm: 0, fuelBurnRate: 0, depthUnderKeel: 0.2,
  passengerLoad: 14, capacity: 20, loadPercent: 70, fuelLitres: 64,
};

const swaliFerry: Omit<Boat, "telemetry"> = {
  id: "rp-04", name: "Swali Ferry", callsign: "SF-04", status: "idle",
  x: 68, y: 77, speed: 0, heading: 0, battery: 92, temperature: 42,
  route: "Swali dock / Nun River", nextWaypoint: "Niger Star",
  rpm: 0, fuelBurnRate: 0, depthUnderKeel: 2.8,
  passengerLoad: 0, capacity: 20, loadPercent: 0, fuelLitres: 90,
  distanceToStrandedVessel: 4.2,
};

export const initialFleet: Boat[] = [
  { ...deltaExpress, telemetry: samples(deltaExpress, [
    { time: "09:10", speed: 8.2, temp: 67, battery: 88, rpm: 1770, fuelBurnRate: 21, depthUnderKeel: 2.7, fuelLitres: 139 },
    { time: "09:20", speed: 8.6, temp: 69, battery: 87, rpm: 1810, fuelBurnRate: 22, depthUnderKeel: 2.6, fuelLitres: 135 },
    { time: "09:30", speed: 8.8, temp: 70, battery: 86, rpm: 1850, fuelBurnRate: 22, depthUnderKeel: 2.5, fuelLitres: 132 },
  ]) },
  { ...creekRunner, telemetry: samples(creekRunner, [
    { time: "09:10", speed: 7.2, temp: 78, battery: 66, rpm: 1850, fuelBurnRate: 23, depthUnderKeel: 2, fuelLitres: 89 },
    { time: "09:20", speed: 6.9, temp: 84, battery: 64, rpm: 1940, fuelBurnRate: 25, depthUnderKeel: 1.9, fuelLitres: 84 },
    { time: "09:30", speed: 6.6, temp: 91, battery: 62, rpm: 2030, fuelBurnRate: 26, depthUnderKeel: 1.8, fuelLitres: 80 },
  ]) },
  { ...nigerStar, telemetry: samples(nigerStar, [
    { time: "09:10", speed: 5.7, temp: 72, battery: 79, rpm: 1500, fuelBurnRate: 17, depthUnderKeel: 1.5, fuelLitres: 70 },
    { time: "09:20", speed: 4.1, temp: 74, battery: 77, rpm: 1170, fuelBurnRate: 13, depthUnderKeel: 0.9, fuelLitres: 67 },
    { time: "09:30", speed: 1.2, temp: 75, battery: 75, rpm: 420, fuelBurnRate: 5, depthUnderKeel: 0.4, fuelLitres: 65 },
  ]) },
  { ...swaliFerry, telemetry: samples(swaliFerry, [
    { time: "09:10", speed: 0, temp: 41, battery: 94, rpm: 0, fuelBurnRate: 0, depthUnderKeel: 2.8, fuelLitres: 90 },
    { time: "09:20", speed: 0, temp: 41, battery: 93, rpm: 0, fuelBurnRate: 0, depthUnderKeel: 2.8, fuelLitres: 90 },
    { time: "09:30", speed: 0, temp: 42, battery: 92, rpm: 0, fuelBurnRate: 0, depthUnderKeel: 2.8, fuelLitres: 90 },
  ]) },
];

export const incidentLabels: Record<IncidentKind, string> = {
  keel: "Sandbank / under-keel clearance",
  overheat: "Engine overheating",
  blackout: "Comms blackout / edge mode",
};
