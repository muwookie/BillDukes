# ConquestV10 — 32v32 Conquest for BF6 Portal

A full-featured Conquest mode for Battlefield 6 Portal with scripted AI bots, ticket bleed, custom scoreboard, vehicle spawning, and Conquest-style VO.

---

## Quick Start

### Portal Server Settings

| Setting | Value |
|---|---|
| **Game Mode** | Custom |
| **Map** | Capstone, Downtown, Sand, or Eastwood |
| **Team 1 Humans** | 1 |
| **Team 1 AI** | 1 Static Bot |
| **Team 2 Humans** | 0 |
| **Team 2 AI** | 1 Static Bot |
| **Rounds** | 2 |

> **Why 1 static bot per team?** The mod spawns 31 scripted bots per team on top of this. The static bot seeds Portal's AI quota system so the scripted bots can spawn. You end up with **32v32** (1 human + 31 scripted on your team, 32 AI on the enemy team).

### How to Install

1. Copy the contents of `dist/ConquestV10.portal.ts`
2. Open the **Portal Rules Editor** in BF6
3. Paste the entire script into the editor
4. Save and launch your server with the settings above

---

## Supported Maps

| Map | Internal Name | Flags | Vehicles |
|---|---|---|---|
| **Capstone** | MP_Capstone_Custom_Conquest_5 | 7 (A–G) | Full roster (tanks, IFVs, AA, helis, jets) |
| **Downtown** | MP_Granite_MainStreet_Custom_Portal | 7 (A–G) | Light vehicles only (tanks cause AI clustering) |
| **Sand** | MP_Portal_Sand_Custom | 7 (A–G) | Per-map config |
| **Eastwood** | MP_Eastwood | 7 (A–G) | Auto-spawn vehicles |

The mod auto-detects the map and loads the correct objective coordinates and vehicle configuration.

---

## How It Works

- **Round 1:** The mod spawns 31 scripted bots per team in batches of 4. A quota check runs after 15 seconds — if the EA backend didn't allocate enough AI slots, Round 1 auto-ends so Round 2 gets the full quota.
- **Round 2:** Full 32v32 gameplay with ticket bleed, captures, vehicles, and scoreboard.
- **AI Behavior:** All bots use `AIBattlefieldBehavior` — Portal's native AI handles movement, objective selection, and combat. The mod does not micromanage AI.

---

## Key Settings

All settings are in the source code. The main ones you might want to change:

### Disable Scripted Bots

In `modules/SpawnRecycleModule.ts`, change:

```typescript
const MAX_BOTS_PER_TEAM = 31;  // ← Set to 0 to disable scripted bots
```

And in `main.script.ts`, match it:

```typescript
const TARGET_BOTS_PER_TEAM = 31;  // ← Set to 0 to match
```

### Disable Quota Auto-End (Round 1 Fast-End)

In `main.script.ts`:

```typescript
const QUOTA_AUTOEND_ENABLED = true;  // ← Set to false to disable
```

When enabled, Round 1 auto-ends after ~15 seconds if bot population is below 60% of target. This ensures Round 2 always has full quota.

### Tickets

In `config/ConquestConfig.ts`:

```typescript
export const STARTING_TICKETS = 1000;              // Tickets per team
export const TICKET_LOSS_DEATH = 2;                // Cost per infantry death
export const TICKET_LOSS_REVIVE_REFUND = 2;        // Refund on revive
export const TICKET_BLEED_PER_FLAG_ADVANTAGE = 0.5; // Bleed per extra flag held
export const TICKET_LOSS_OBJECTIVE_CAPTURED = 5;   // Lost when enemy captures a flag
```

### Vehicle Ticket Costs

```typescript
export const TICKET_LOSS_VEHICLE_LIGHT = 5;   // Quads, jeeps
export const TICKET_LOSS_VEHICLE_HEAVY = 10;  // Tanks, IFVs
export const TICKET_LOSS_VEHICLE_AIR = 15;    // Jets, helis
```

### Round Time Limit

```typescript
export const OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS = 2700.0;  // 45 minutes
```

### Scoreboard Scoring

In `modules/ScoreboardModule.ts`:

```typescript
const SCORE_PER_KILL = 100;
const SCORE_PER_CAPTURE = 250;
const SCORE_PER_REVIVE = 150;
```

Vehicle destruction scores (in `config/ConquestConfig.ts`):

| Vehicle Type | Score |
|---|---|
| Light (quad, golf cart) | 100 |
| Transport (RHIB) | 200 |
| IFV (Bradley, CV90) | 250 |
| AA (Cheetah, Gepard) | 400 |
| Tank (Abrams, Leopard) | 500 |
| Helicopter (AH64, UH60) | 600 |
| Jet (F16, F22, SU57) | 1000 |

### Capture Speed

```typescript
export const CAPTURE_TIME_SECONDS = 10.0;      // Time to capture a neutral flag
export const NEUTRALIZE_TIME_SECONDS = 10.0;    // Time to neutralize an enemy flag
```

### Bot Respawn / Recycling

In `modules/SpawnRecycleModule.ts`:

```typescript
const RECYCLE_ENABLED = true;           // Respawn dead bots (set false to disable)
const RECYCLE_DELAY_SECONDS = 1.0;      // Delay after death before respawn
const SPAWN_PROTECTION_SECONDS = 3.0;   // Invulnerability window after spawn
```

---

## Rebuilding from Source

If you modify any source files, rebuild the bundle:

```powershell
npm install
npx tsc -p .
node .\scripts\bundle-conquestv10.js
```

The output is `dist/ConquestV10.portal.ts` — paste this into the Portal Rules Editor.

---

## Module Overview

| Module | Purpose |
|---|---|
| `AISpawnModule` / `SpawnRecycleModule` | Spawns and respawns scripted AI bots |
| `TicketBleedModule` | Ticket system — death costs, revive refunds, flag bleed |
| `CapturePointModule` | Detects flag captures/losses, awards capture credit |
| `ScoreboardModule` | Custom 2-team scoreboard (Score, Kills, Deaths, Revives, Captures) |
| `HudModuleParseUI` | Objective HUD and team ticket display |
| `SoundsModule` | Conquest VO ("We're taking Alpha!", "Losing Bravo!") |
| `VehicleDirectorModule` | Vehicle management and unlock behavior |
| `VehicleSpawnUIModuleParseUI` | Per-map vehicle spawn UI for players |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Round 1 ends instantly | That's the quota auto-end system. Set `QUOTA_AUTOEND_ENABLED = false` to disable, or just let Round 2 run (it gets the full AI quota). |
| Not enough bots | Make sure Portal team settings have at least 1 static bot per team. Check logs for `[QUOTA]` messages. |
| Bots cluster on one flag | On Downtown, disable heavy vehicles. The mod already handles this per-map. |
| No vehicles spawning | Check `VehicleSpawnUIModuleParseUI` config for your map. Eastwood uses auto-spawn. |
| Scoreboard not showing | `ENABLE_SCOREBOARD` must be `true` in `config/ConquestConfig.ts` (default: true). |

---

## Credits

ConquestV10 by **BillDukes** — Built for Battlefield 6 Portal.
