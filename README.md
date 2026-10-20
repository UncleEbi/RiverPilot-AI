# RiverPilot AI

A responsive Niger Delta fleet **simulation** built with Next.js App Router, TypeScript, Tailwind CSS and Recharts. The four vessels are Delta Express, Creek Runner, Niger Star and Swali Ferry. Telemetry, recommendations, dispatch outcomes, and the cloud route are simulated; no real AIS, cloud API, WebGPU inference or captain command is used.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Check with `npm run typecheck` and `npm run build`; serve a build using `npm start`.

## Demo flow

1. Select each labeled vessel on the map to view RPM, temperature, fuel burn, depth under keel, passenger load, and the speed/fuel chart.
2. Read the two priority cards: Niger Star emergency dispatch (Swali Ferry 4.2 km away, 14 min ETA, +8 L / −45 min) and Delta Express tide/turn speed optimization. Expand **Show Rationale / Data Lineage** for the actual cited sensor samples.
3. **Approve Dispatch** moves Swali Ferry onto the rescue route and changes its readings; **Override / Dismiss** leaves it idle. **Signal Captain** changes Delta Express speed/fuel readings locally; **Ignore** leaves them unchanged. No command is transmitted.
4. Inject shallow-keel or engine-overheat scenarios. The latest boat readings and generated incident evidence update together. The blackout control toggles local edge mode; turning it off restores simulated cloud mode only if the browser reports online. Browser online/offline events also control mode.
5. Refresh to check the versioned localStorage snapshot. Incompatible legacy or invalid snapshots reset to the four-vessel baseline.

The status bar and inference panel show **measured local compute time**, a **scenario latency** (~38 ms local / ~820 ms cloud), **estimated USD token cost** ($0 edge / $0.012 cloud), and browser/manual connection state. These latency/cost figures are demo estimates, not measured network traffic. The estimated token price uses a demo rate of $0.000002/token; edge heuristics use zero tokens. A service worker caches the app shell and its static assets for repeat offline visits; the first visit needs network access. Use a production build (`npm run build && npm start`) for reliable offline testing.
