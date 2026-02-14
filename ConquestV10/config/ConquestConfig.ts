/**
 * ConquestConfig.ts - ConquestV8 (Soft-Influence Architecture)
 *
 * Goals:
 * - ES2020-first
 * - Use only APIs defined in code/mod/index.d.ts
 * - Work WITH AIBattlefieldBehavior, not against it
 * - ObjectiveBiasModule provides soft influence via weights
 * - Director only nudges truly idle/stuck bots
 */

namespace ConquestV8 {
    // Build tag
    export const BUILD_ID = "2026-01-28-conquestv8-soft-influence";

    // Deployment state tracking - avoids calling GetSoldierState on players without soldiers
    // which causes PlayerNotDeployed spam in PortalLog.txt
    const deployedPlayerIds: Set<number> = new Set();

    // Cache AI-vs-human classification by ObjId.
    // IMPORTANT: SoldierState queries can throw/spam when the player is not deployed.
    // We update this cache when the player is known-deployed (OnPlayerDeployed/OnSpawnerSpawned)
    // and use it as a fallback while the player is on the deploy screen / dead.
    const aiStatusByPlayerId: { [playerId: number]: boolean } = {};

    // Debug
    // IMPORTANT: Portal QuickJS has a low memory ceiling.
    // Verbose console logging (especially frequent sounds/AI ticks) can contribute to JsOutOfMemory.
    // Keep this OFF by default; turn on temporarily when debugging.
    export const DEBUG_LOGS = true;  // ENABLED for debugging
    export const DEBUG_INTERVAL_SECONDS = 15.0;  // Throttle repeated messages (increased from 10s)

    // Opt-in debug areas (keep OFF unless actively debugging)
    export const DEBUG_AI_SPAWN = false;
    export const DEBUG_SKY_JETS = false;
    export const DEBUG_VEHICLE_UI = false;

    // Host-only HUD line showing real humans/bots totals per team.
    // Useful to prove whether the match is actually filling to 64 (32v32) regardless of server browser counts.
    export const DEBUG_HOST_POPULATION_HUD = true;  // ON - show population on HUD

    // ============================================================
    // SPAWN MODE TOGGLE
    // ============================================================
    // true  = AutoSpawn mode - bots respawn automatically via SetRedeployTime
    // false = Deploy mode - manual deploy screen (bots won't auto-respawn)
    export const USE_AUTOSPAWN_MODE = false;

    // ============================================================
    // REPLACEMENT SPAWN TOGGLE
    // ============================================================
    // When a bot dies, spawn a NEW replacement bot instead of recycling
    // true  = Spawn new bots when old ones die (ignores dead bodies)
    // false = Try to recycle same bot entity via AutoSpawn/SetRedeployTime
    export const ENABLE_REPLACEMENT_SPAWN = true;
    export const REPLACEMENT_SPAWN_DELAY = 20.0;  // Seconds after death before replacement spawns (full bleedout window)
    export const MAX_REPLACEMENT_SPAWNS_PER_TICK = 2;  // Max replacements per tick (avoid quota)

    // Error log throttling (still logs at least once per unique message)
    // Rationale: Portal often prints large exception blocks; repeating our own error lines
    // on top of that can contribute to log volume and memory pressure.
    export const ERROR_LOG_THROTTLE_SECONDS = 2.0;
    const _lastDebugLogTimeByMessage: { [msg: string]: number } = {};
    const _lastDebugLogTimeByKey: { [key: string]: number } = {};

    export function log(msg: string): void {
        if (DEBUG_LOGS) {
            console.log(msg);
        }
    }

    /**
     * Debug logging with throttling to prevent spam.
     * Use this for informational/diagnostic messages.
     */
    export function logDebug(msg: string): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByMessage[msg];
        if (last === undefined || t - last >= DEBUG_INTERVAL_SECONDS) {
            _lastDebugLogTimeByMessage[msg] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }

    /**
     * Debug logging throttled by a stable key rather than the full message.
     * Use this when the message contains IDs/values that would defeat per-message throttling.
     */
    export function logDebugKey(key: string, msg: string, intervalSeconds: number = DEBUG_INTERVAL_SECONDS): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByKey[key];
        if (last === undefined || t - last >= intervalSeconds) {
            _lastDebugLogTimeByKey[key] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }

    /**
     * Error logging - use for actual errors only.
     * Always logs (no throttling) since real errors should always be visible.
     */
    export function logError(msg: string): void {
        console.log(`[ConquestV10][ERROR] ${msg}`);
    }

    /**
     * Safe wrapper for Portal API calls that may throw.
     * Logs the error with context label and continues.
     */
    export function safeCall(label: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            logError(`[safeCall:${label}] ${e}`);
        }
    }

    // Timing
    export const GAME_START_GRACE_PERIOD_SECONDS = 30;
    export const TICK_INTERVAL_SECONDS = 1.0;  // Must be 1.0 for proper sound tick timing

    // Round time limit control
    // Portal/hosted servers can end the round externally when the experience time limit expires,
    // even if our custom ticket system still has tickets remaining.
    // Set this to a large value to ensure the round ends via tickets (preferred).
    // Set to null to leave the experience time limit unchanged.
    export const OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS: number | null = 2700.0; // 45 minutes

    // Win condition diagnostics
    export const ENABLE_WIN_CONDITION_LOGS = true;

    // Player targets
    // This is the per-team population target for SCRIPTED bots.
    // Portal quota limits scripted bots to ~18 per team. Use Static bots to fill to 32.
    export const TEAM_SIZE_TARGET = 18; // 18 scripted bots per team (quota limit)

    // If non-zero, reserves slots for late-joining humans by reducing bot fill.
    // For strict 1:1 replacement (bots only fill empty human slots), keep this at 0.
    export const RESERVED_HUMAN_SLOTS_PER_TEAM = 0;

    // =========================================================================
    // V7 Module Constants - AI Spawning, Squads, Director
    // =========================================================================
    // Pre-round spawn settings
    export const BOTS_PER_SPAWN_BATCH = 4;          // Spawn 4 bots per tick during pre-round
    export const PRE_ROUND_SPAWN_INTERVAL = 0.5;     // Spawn every 0.5 seconds during pre-round
    
    // AI Spawn delay after round start (allows humans to join first)
    export const AI_SPAWN_DELAY_SECONDS = 5.0;
    
    // Cooldown after quota exceeded errors
    export const AI_QUOTA_COOLDOWN_SECONDS = 10.0;
    
    // Squad configuration
    export const SQUAD_SIZE = 4;                    // Bots per squad
    export const MIN_SQUAD_SIZE_FOR_ORDERS = 2;     // Minimum size to receive orders
    
    // Director anti-clustering
    export const MAX_SQUADS_PER_OBJECTIVE = 2;      // Max squads assigned per objective (2 allows 8+ squads across 7 objectives)
    // When true, use round-robin objective assignment to avoid clustering on closest flags
    export const FORCE_OBJECTIVE_DIVERSITY = true;
    export const DIRECTOR_REASSIGNMENT_INTERVAL = 15.0; // Seconds between reassignments

    // =========================================================================
    // Tickets Configuration - 1000 tickets, scaled for ~35-40 minute rounds
    // =========================================================================
    export const SET_STARTING_TICKETS_ON_ROUND_START = true;
    export const STARTING_TICKETS = 1000;

    // Ticket loss values (scaled for faster pacing with 1000 tickets)
    export const TICKET_LOSS_DEATH = 2;           // Infantry death costs 2 tickets
    export const TICKET_LOSS_REVIVE_REFUND = 2;   // Revive refunds the same amount
    
    // Vehicle destruction ticket costs
    export const TICKET_LOSS_VEHICLE_LIGHT = 5;   // Quads, jeeps, light transports
    export const TICKET_LOSS_VEHICLE_HEAVY = 10;  // Tanks, IFVs
    export const TICKET_LOSS_VEHICLE_AIR = 15;    // Jets, helicopters
    export const TICKET_LOSS_VEHICLE_DEFAULT = 5; // Unknown vehicle types
    
    // Objective capture ticket loss (losing team loses tickets when a flag is captured)
    export const TICKET_LOSS_OBJECTIVE_CAPTURED = 5;  // Set to 0 to disable, or 30 for significant impact

    // Ticket system aliases for V7 modules (must come AFTER the actual constants)
    export const RESERVED_HUMAN_SLOTS = RESERVED_HUMAN_SLOTS_PER_TEAM;  // Alias
    export const TICKET_LOSS_ON_DEATH = TICKET_LOSS_DEATH;              // Alias
    export const TICKET_REFUND_ON_REVIVE = TICKET_LOSS_REVIVE_REFUND;  // Alias
    export const TICKET_BLEED_PER_FLAG_ADVANTAGE = 0.5; // Tickets lost per flag advantage per tick

    // =========================================================================
    // Scoreboard Points - Vehicle Destruction
    // =========================================================================
    export const SCORE_VEHICLE_LIGHT = 100;      // Quadbike, GolfCart, Flyer60, Marauder
    export const SCORE_VEHICLE_TRANSPORT = 200;  // RHIB, transport variants
    export const SCORE_VEHICLE_IFV = 250;        // Bradley, Vector, CV90
    export const SCORE_VEHICLE_AA = 400;         // Cheetah, Gepard
    export const SCORE_VEHICLE_TANK = 500;       // Abrams, Leopard
    export const SCORE_VEHICLE_HELI = 600;       // UH60, AH64, Eurocopter
    export const SCORE_VEHICLE_JET = 1000;       // F16, F22, JAS39, SU57
    export const SCORE_VEHICLE_DEFAULT = 100;    // Unknown vehicle types

    // Total population target (64 total = 32v32)
    export const TOTAL_PLAYERS_TARGET = 64;

   
    // AI Combat Targeting
    // Bots will engage enemies within engagement range using AISetTarget
    export const ENABLE_AI_COMBAT_TARGETING = true;
    export const COMBAT_ENGAGEMENT_RANGE_METERS = 80.0;

    // Objective radius for "on-point" detection and defense behavior
    export const OBJECTIVE_RADIUS_METERS = 30.0;

    // Vehicle-seeking squad behavior (for static AI bots)
    // When enabled, designated squads will spawn at HQ and attempt to grab vehicles
    // instead of pushing objectives immediately. Other squads go to objectives normally.
    // This creates a vehicle presence while infantry pushes from forward spawns.
    export const ENABLE_VEHICLE_SEEKING_SQUADS = false;  // ENABLED: Squads seek vehicles at HQ before objectives
    // How many squads per team should prioritize vehicle acquisition at HQ
    export const VEHICLE_SEEKING_SQUADS_PER_TEAM = 6;  // Increased from 4 (more vehicles)
    // Max time (seconds) for vehicle-seeking squad to stay at HQ before giving up and going to objective
    export const VEHICLE_SEEK_TIMEOUT_SECONDS = 15.0;  // Reduced from 30.0 - faster fallback to objectives
    // Distance threshold to consider bot "at HQ" for vehicle requests
    export const AT_HQ_DISTANCE_METERS = 100.0;

    // Full map control behavior
    // Conquest rule: owning all flags should create strong pressure, but still allow the losing team
    // a brief window to recapture and stop the bleed (push/pull gameplay).
    export const FULL_MAP_CONTROL_GRACE_SECONDS = 15.0;
    export const FULL_MAP_CONTROL_BLEED_MULTIPLIER = 3.0;

    // AI Sky Jets (spawners 243/244)
    // Goal: keep sky jets active for both teams without allowing one team to stack extra jets.
    export const ENABLE_AI_SKY_JETS = true;
    export const AI_SKY_JET_CHECK_INTERVAL_SECONDS = 8.0;
    export const AI_SKY_JET_SPAWN_COOLDOWN_SECONDS = 60.0;  // 60s cooldown to reduce Director state churn
    export const SKY_JET_BEHAVIOR_REFRESH_SECONDS = 3.0;    // Re-apply pilot behavior to prevent idle/bail
    export const MAX_SKY_JETS_PER_TEAM = 1;                 // Only 1 jet per team (2 total) to reduce AI teleport churn
    
    // Jet pilot pickup radius - only pick pilots from near HQ/spawner area
    // This prevents AI being teleported from objectives mid-battle, which destabilizes the Director
    // Now uses ground-level HQ position (AI spawner) instead of sky jet spawner position
    export const JET_PILOT_PICKUP_RADIUS_METERS = 400.0;    // Large radius to catch bots moving away from HQ

    // All Jets as Sky Jets Mode (Downtown Map)
    // When enabled, treats ALL jet spawners as sky jets for aggressive air superiority gameplay
    export const ENABLE_ALL_JETS_AS_SKY_JETS = true;
    // Team 1 & Team 2 sky jet spawner IDs (Downtown map - 2 jets per team = 4 total)
    // Team 1: F22 (232), F16 (243)
    // Team 2: JAS39 (233), SU57 (244)
    export const TEAM1_SKY_JET_SPAWNER_IDS = [232, 243];
    export const TEAM2_SKY_JET_SPAWNER_IDS = [233, 244];

    /**
     * Get sky jet spawner IDs based on map variant.
     * Returns all jet spawners for the specified team.
     */
    export function getSkyJetSpawnerIds(teamId: number): number[] {
        if (ENABLE_ALL_JETS_AS_SKY_JETS) {
            return teamId === 1 ? TEAM1_SKY_JET_SPAWNER_IDS : TEAM2_SKY_JET_SPAWNER_IDS;
        }
        // Default fallback (hardcoded for Capstone - single jet per team)
        return teamId === 1 ? [243] : [244];
    }

    // Vehicle Seat Filling
    // Automatically fill empty gunner/passenger seats with nearby bots
    // NOTE: GetPlayerFromVehicleSeat causes InvalidValue errors in SDK logs
    // that cannot be suppressed (SDK logs before throwing). Expect some log spam.
    export const ENABLE_VEHICLE_SEAT_FILLING = false;  // Disabled: fills all seats every tick, pins passengers in place
    export const VEHICLE_CHECK_INTERVAL_SECONDS = 5.0;  // Increased from 3.0 to reduce overhead
    export const VEHICLE_SEAT_FILL_RANGE_METERS = 25.0;
    // Seat-assist options (teleport only used at spawners to initialize vehicles)
    export const ENABLE_SEAT_TELEPORT_ASSIST = false;
    export const SEAT_TELEPORT_MAX_DISTANCE_METERS = 150.0;
    export const SEAT_TELEPORT_OFFSET_METERS = 1.5;

    // Sky jet pilot selection (avoid seating bots from across the map)
    export const JET_PILOT_MAX_DISTANCE_METERS = 200.0;
    // Delay auto-seating at round start to allow vehicles to initialize
    export const VEHICLE_DIRECTOR_START_DELAY_SECONDS = 10.0;
    // One-time unlock sweep to initialize vehicles (mimics enter/exit without player)
    export const ENABLE_VEHICLE_UNLOCK_ONCE = true;
    export const VEHICLE_UNLOCK_ONCE_DELAY_SECONDS = 30.0;
    // Apply AI behavior to newly seated ground vehicle drivers during unlock sweep
    export const ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR = true;
    // Periodically initialize ground vehicle seats at HQ (seat + exit) to ensure seats wake up
    export const ENABLE_GROUND_VEHICLE_INIT_SWEEP = true;
    export const GROUND_VEHICLE_INIT_INTERVAL_SECONDS = 30.0;
    // Scripted ground vehicle spawn (use when map auto-spawn is disabled)
    export const ENABLE_SCRIPTED_GROUND_SPAWN = true;
    export const GROUND_SPAWN_DELAY_SECONDS = 10.0;
    // Force spawner-based vehicle initialization (respawn + seat) if empty at HQ
    export const ENABLE_SPAWNER_INIT_SWEEP = false;
    export const SPAWNER_INIT_INTERVAL_SECONDS = 30.0;
    export const SPAWNER_INIT_NEAR_DISTANCE_METERS = 80.0;
    // Vehicle seat debug (throttled). Set true to trace seat attempts.
    export const ENABLE_VEHICLE_SEAT_DEBUG = false;
    export const VEHICLE_SEAT_DEBUG_INTERVAL_SECONDS = 5.0;
    // Allow sky jet pilot seeding from anywhere (teleport to spawner)
    export const ENABLE_HQ_JET_SEED_TELEPORT = true;  // Enabled: pick any bot for jet pilots since they all run to objectives

    // Vehicle spawner behavior
    // When true, preserve map defaults for ground vehicle auto-spawn (only force-disable sky jets).
    // ENABLED: Let Eastwood map auto-spawn vehicles so AI can use them naturally
    export const PRESERVE_MAP_GROUND_AUTOSPAWN = true;
    // If map ground auto-spawn is disabled, re-enable it after the delayed scripted spawn
    // so abandoned vehicles respawn normally.
    export const ENABLE_GROUND_AUTOSPAWN_AFTER_DELAY = true;

    // Team / faction selection
    // Portal experience settings determine which faction each Team uses.
    // Script cannot set factions, but it CAN move the host player onto the team that uses a given faction.
    // Set one of these to choose which side you spawn on at match start.
    // NOTE: Disabled by default for hosted-server reliability and to avoid fighting Portal's own team assignment.
    export const ENABLE_FORCE_HOST_SIDE = false;
    // - PREFERRED_STARTING_TEAM_ID: hard-pins to Team 1 or Team 2
    // - PREFERRED_STARTING_FACTION: pins to the team currently using NATO or PaxArmata
    // If both are set, TEAM_ID wins.
    export const PREFERRED_STARTING_TEAM_ID: 0 | 1 | 2 = 0;
    // Flip this between mod.Factions.PaxArmata and mod.Factions.NATO
    export const PREFERRED_STARTING_FACTION: mod.Factions | null = null;

    // Cache faction detection results (computed once at init)
    let cachedTeam1Faction: mod.Factions | null = null;
    let cachedTeam2Faction: mod.Factions | null = null;
    let factionsCached = false;

    /**
     * Detect and cache team factions.
     * Uses IsFaction API but falls back to convention (Team1=NATO, Team2=PAX) 
     * when API returns ambiguous results (e.g., both teams report same faction).
     */
    function detectAndCacheFactions(): void {
        if (factionsCached) return;
        factionsCached = true;

        try {
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);

            if (!team1 || !team2) {
                // Fallback to convention
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
                return;
            }

            // Check what the API reports for each team
            const t1IsNato = mod.IsFaction(team1, mod.Factions.NATO);
            const t1IsPax = mod.IsFaction(team1, mod.Factions.PaxArmata);
            const t2IsNato = mod.IsFaction(team2, mod.Factions.NATO);
            const t2IsPax = mod.IsFaction(team2, mod.Factions.PaxArmata);

            // Determine Team 1 faction
            if (t1IsNato && !t1IsPax) {
                cachedTeam1Faction = mod.Factions.NATO;
            } else if (t1IsPax && !t1IsNato) {
                cachedTeam1Faction = mod.Factions.PaxArmata;
            } else {
                // Ambiguous - use convention
                cachedTeam1Faction = mod.Factions.NATO;
            }

            // Determine Team 2 faction
            if (t2IsPax && !t2IsNato) {
                cachedTeam2Faction = mod.Factions.PaxArmata;
            } else if (t2IsNato && !t2IsPax) {
                cachedTeam2Faction = mod.Factions.NATO;
            } else {
                // Ambiguous - use convention
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }

            // If both ended up with the same faction, the API is unreliable - use convention
            if (cachedTeam1Faction === cachedTeam2Faction) {
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }
        } catch (_e) {
            // Fallback to convention
            cachedTeam1Faction = mod.Factions.NATO;
            cachedTeam2Faction = mod.Factions.PaxArmata;
        }
    }

    /**
     * Reset cached faction detection (use at round start to handle side swaps).
     */
    export function resetFactionCache(): void {
        cachedTeam1Faction = null;
        cachedTeam2Faction = null;
        factionsCached = false;
    }

    export function getTeamFaction(teamId: number): mod.Factions | null {
        detectAndCacheFactions();
        if (teamId === 1) return cachedTeam1Faction;
        if (teamId === 2) return cachedTeam2Faction;
        return null;
    }

    export function factionLabel(f: mod.Factions | null): string {
        if (f === mod.Factions.NATO) return "NATO";
        if (f === mod.Factions.PaxArmata) return "PAX";
        return "UNKNOWN";
    }

    export function getTeamFactionLabel(teamId: number): string {
        return factionLabel(getTeamFaction(teamId));
    }

    export function getPreferredTeamId(): number {
        // Resolve desired team id based on config (team id wins over faction).
        // Returns 0 when no preference is configured.
        let desiredTeamId: number = 0;
        if (PREFERRED_STARTING_TEAM_ID === 1 || PREFERRED_STARTING_TEAM_ID === 2) {
            desiredTeamId = PREFERRED_STARTING_TEAM_ID;
        } else if (PREFERRED_STARTING_FACTION !== null) {
            const team1Faction = getTeamFaction(1);
            const team2Faction = getTeamFaction(2);
            if (team1Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 1;
            if (team2Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 2;

            // Fallback: if we can't detect team factions yet, assume the common mapping.
            if (!desiredTeamId) {
                desiredTeamId = PREFERRED_STARTING_FACTION === mod.Factions.PaxArmata ? 2 : 1;
            }
        }
        return desiredTeamId;
    }

    export function tryForceHostToPreferredSide(): void {
        if (!ENABLE_FORCE_HOST_SIDE) return;
        const host = tryGetHostPlayer();
        if (!host) return;

        // Host can be switched even before they're fully alive/deployed.
        // Avoid gating on IsAlive() here; that makes the "start as PAX" test unreliable.
        try {
            if (!mod.IsPlayerValid(host)) return;
        } catch (_e) {
            // ignore
        }

        const desiredTeamId = getPreferredTeamId();

        if (desiredTeamId !== 1 && desiredTeamId !== 2) return;

        const currentTeamId = getPlayerTeamId(host);
        if (currentTeamId === desiredTeamId) return;

        const desiredTeam = mod.GetTeam(desiredTeamId);
        if (!desiredTeam) return;

        log(
            `[ConquestV10] Forcing host to Team ${desiredTeamId} (${getTeamFactionLabel(desiredTeamId)}) from Team ${currentTeamId} (${getTeamFactionLabel(currentTeamId)}) prefFaction=${factionLabel(
                PREFERRED_STARTING_FACTION
            )}`
        );
        safeCall("TeamSetup:SetTeam", () => mod.SetTeam(host, desiredTeam));
    }

    // Scripted AI Spawning
    // When enabled, spawns bots in Round 1 so you can test immediately.
    // When disabled, relies on Portal static bots (spawn in Round 2 only).
    export const ENABLE_SCRIPTED_AI_SPAWNING = true;
    // Spawn scripted bots immediately (set to 0 to start before Portal's static bots)
    // Previously was 30.0 which allowed static bots to spawn first
    export const SCRIPTED_AI_SPAWN_START_DELAY_SECONDS = 1.0;

    // Orders / movement - same as working ConquestV5 (Capstone)
    export const ENABLE_AI_ORDERS = true;
    export const DIRECTOR_INTERVAL_SECONDS = 2.5;
    export const BOT_MOVE_COMMAND_INTERVAL_SECONDS = 8.0;
    // If true, do not issue AI movement/behavior orders to bots in vehicles
    export const STOP_ORDERS_WHEN_IN_VEHICLE = true;

    // Map data - supports multiple maps
    export type Objective = { 
        id: string; 
        name: string; 
        objId: number; 
        x: number; 
        y: number; 
        z: number; 
        waypointPathId?: number;
        // Rooftop objectives need a ground-level approach point where bots can walk to
        // before using elevator/zipline (AI can't pathfind directly to high elevations)
        approachPoint?: { x: number; y: number; z: number };
        isRooftop?: boolean;
    };

    /**
     * GRANITE_OBJECTIVES - Downtown Map (MP_Granite_MainStreet_Custom_Portal)
     * 
     * IMPORTANT: The map has mismatched ObjIds from Godot export.
     * These values match the ACTUAL map ObjIds, not the logical sequence.
     * 
     * Map ObjId Layout (actual):
     * A=601, B=602, C=608, D=606, E=605, F=604, G=607
     * 
     * WAYPOINT PATHS FIXED (2026-01-15):
     * F waypoint was 807, changed to 806
     * G waypoint was 808, changed to 807
     * Both F and G were sharing same curve - created separate curve for G
     * 
     * All objectives are ground-level with working waypoint paths.
     * Coordinates extracted from spatial JSON CapturePoint positions.
     */
    const GRANITE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -1104.93, y: 145.185, z: -24.5901, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -879.76, y: 176.987, z: 39.8464, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: -1041.81, y: 144.489, z: 161.46, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: -1044.36, y: 178.913, z: -128.505, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -1248.85, y: 127.857, z: 75.4271, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: -912.492, y: 142.426, z: 203.425, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -1079.37, y: 142.426, z: 407.619, waypointPathId: 807, isRooftop: false },
    ];

    /**
     * CAPSTONE_OBJECTIVES - Capstone Map (MP_Capstone_Custom_Conquest_5)
     * 
     * All objectives are ground-level.
     * Coordinates extracted from spatial JSON CapturePoint positions.
     * AI can pathfind directly to all objectives.
     */
    const CAPSTONE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: 533.339, y: 144.579, z: 160.168, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: 377.991, y: 87.9316, z: 109.611, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 191.581, y: 89.9122, z: -121.593, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: 17.9395, y: 123.376, z: -183.508, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -224.563, y: 119.736, z: -106.128, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: 456.145, y: 88.003, z: 298.109, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -92.9837, y: 94.7251, z: -49.348, waypointPathId: 807, isRooftop: false },
    ];

    /**
     * PORTAL_SAND_OBJECTIVES - Portal Sandbox Map (MP_Portal_Sand_Custom)
     * 
     * Map ObjId Layout (from Godot scene):
     * A=601, B=602, C=608, D=606, E=605, F=604, G=607
     * 
     * All objectives are ground-level with working waypoint paths.
     * Coordinates extracted from Godot scene transform positions.
     */
    const PORTAL_SAND_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -83.3688, y: 74.0922, z: -115.04, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -22.5187, y: 113.229, z: -220.526, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: -20.2488, y: 73.3962, z: 71.0104, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: 143.217, y: 106.82, z: -48.4518, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -227.289, y: 56.7642, z: -15.0225, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: 109.069, y: 71.3332, z: 114.975, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -60.8087, y: 71.3332, z: 231.169, waypointPathId: 807, isRooftop: false },
    ];

    /**
     * EASTWOOD_OBJECTIVES - Eastwood Map (MP_Eastwood)
     * 
     * Map ObjId Layout (from spatial JSON):
     * A=601, B=602, C=608, D=606, E=605, F=604, G=607
     * 
     * All objectives are ground-level with working waypoint paths.
     * Coordinates extracted from MP_Eastwood_custom.spatial.json.
     */
    const EASTWOOD_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -153.652, y: 296.229, z: 95.4245, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -153.622, y: 284.625, z: -78.2236, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: 71.8797, y: 264.909, z: 5.77899, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: -284.281, y: 279.208, z: 10.7012, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: 195.164, y: 253.621, z: -154.116, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: 9.00656, y: 253.861, z: 86.9226, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -72.1564, y: 256.644, z: 153.608, waypointPathId: 807, isRooftop: false },
    ];

    /**
     * OBJECTIVES - Active map objectives (initialized at runtime)
     * 
     * Call initializeMapConfig() early in OnGameModeStarted to populate this array
     * with the correct map's objective data.
     */
    export let OBJECTIVES: Objective[] = [];

    /**
     * Map detection and initialization
     * 
     * Detects which map is currently loaded and initializes OBJECTIVES array
     * with the correct coordinate set. Call this early in OnGameModeStarted.
     */
    let mapConfigInitialized = false;
    let currentMapName = "Unknown";

    export function initializeMapConfig(): void {
        if (mapConfigInitialized) return;
        mapConfigInitialized = true;

        try {
            // Check for Granite Downtown
            if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                OBJECTIVES = GRANITE_OBJECTIVES;
                currentMapName = "Granite_MainStreet";
                log(`[ConquestV10] Map detected: Granite Downtown - ${OBJECTIVES.length} objectives loaded`);
            }
            // Check for Capstone
            else if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                OBJECTIVES = CAPSTONE_OBJECTIVES;
                currentMapName = "Capstone";
                log(`[ConquestV10] Map detected: Capstone - ${OBJECTIVES.length} objectives loaded`);
            }
            // Check for Portal Sandbox
            else if (mod.IsCurrentMap(mod.Maps.Sand)) {
                OBJECTIVES = PORTAL_SAND_OBJECTIVES;
                currentMapName = "Portal_Sand";
                log(`[ConquestV10] Map detected: Portal Sandbox - ${OBJECTIVES.length} objectives loaded`);
            }
            // Check for Eastwood
            else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                OBJECTIVES = EASTWOOD_OBJECTIVES;
                currentMapName = "Eastwood";
                log(`[ConquestV10] Map detected: Eastwood - ${OBJECTIVES.length} objectives loaded`);
            }
            // Fallback to Granite if map doesn't match
            else {
                OBJECTIVES = GRANITE_OBJECTIVES;
                currentMapName = "Unknown (fallback to Granite)";
                log(`[ConquestV10] Unknown map - falling back to Granite Downtown config`);
            }
        } catch (_e) {
            // Fallback to Granite on error
            OBJECTIVES = GRANITE_OBJECTIVES;
            currentMapName = "Error (fallback to Granite)";
            logError(`[ConquestV10] Failed to detect map - falling back to Granite Downtown config`);
        }
    }

    export function getCurrentMapName(): string {
        return currentMapName;
    }

    export function getObjectiveByLetter(letter: string): Objective | null {
        return OBJECTIVES.find((o) => o.id === letter) ?? null;
    }

    export function getObjectiveByObjId(objId: number): Objective | null {
        return OBJECTIVES.find((o) => o.objId === objId) ?? null;
    }

    /** Check if objective is on a rooftop (needs special AI routing) */
    export function isRooftopObjective(letter: string): boolean {
        const obj = getObjectiveByLetter(letter);
        return obj?.isRooftop === true;
    }

    /** Get approach point for rooftop objectives, or null for ground-level */
    export function getApproachPoint(letter: string): { x: number; y: number; z: number } | null {
        const obj = getObjectiveByLetter(letter);
        return obj?.approachPoint ?? null;
    }

    // Spawner IDs
    // Map: MP_Granite_MainStreet_Custom_Portal (Downtown - verified from Godot scene 2026-01-07)
    // Team 1: 1092/1091/1090/1093
    // Team 2: 1002/1003/1004/1005
    export const TEAM1_AI_SPAWNER_IDS = [1092, 1091, 1090, 1093];
    export const TEAM2_AI_SPAWNER_IDS = [1002, 1003, 1004, 1005];

    // Utility
    export function createPos(x: number, y: number, z: number): mod.Vector {
        return mod.CreateVector(x, y, z);
    }

    // Portal message helper:
    // In BF6 Portal, passing raw strings can resolve as <UNKNOWN STRING>.
    // Using the Message() format-string overload keeps this literal without requiring a strings.json.
    export function textMessage(text: string): mod.Message {
        return mod.Message("{}", text);
    }

    // Gameplay tuning - AGGRESSIVE MODE
    export const CAPTURE_RADIUS_METERS = 40.0;
    export const CAPTURE_TIME_SECONDS = 10.0;  // Reduced from 15.0 for faster captures
    export const NEUTRALIZE_TIME_SECONDS = 10.0;  // Reduced from 7.5 for faster neutralization

    // Capture/Objective audio toggles
    export const ENABLE_OBJECTIVE_ENTER_EXIT_SFX = true;
    export const ENABLE_CAPTURE_TICK_SFX = true;
    export const ENABLE_CAPTURE_TICK_LOOP_SFX = true;
    export const ENABLE_CAPTURE_LEADIN_SFX = false;
    export const ENABLE_CONTESTED_SFX = true;

    // UI
    export const ENABLE_GAMEPLAY_HUD = true;
    export const ENABLE_SCOREBOARD = true;
    // HUD color mode: 
    // - "absolute" = Team 1 always blue, Team 2 always red (CURRENT IMPLEMENTATION)
    // - "perspective" = your team = blue (friendly), enemy team = red (NOT IMPLEMENTED)
    export const HUD_COLOR_MODE: "absolute" | "perspective" = "absolute";
    export const SCOREBOARD_UPDATE_INTERVAL_SECONDS = 2.0;
    // Captures column label: keep ASCII (Portal editor can reject unicode in script source).
    export const SCOREBOARD_CAPTURES_LABEL = "C";

    /**
     * Track that a player has been deployed.
     * Call this from OnPlayerDeployed and OnSpawnerSpawned.
     */
    export function markPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        try {
            const pid = mod.GetObjId(player);
            deployedPlayerIds.add(pid);

            // IMPORTANT: Do NOT call GetSoldierState here.
            // Some runtimes can fire deployment-related events before SoldierState is available,
            // and even a caught exception can spam PortalLog with PlayerNotDeployed.

            logDebug(`[Deployed] Player ${pid} marked as deployed. Total deployed: ${deployedPlayerIds.size}`);
        } catch (_e) {
            logDebug(`[Deployed] Failed to mark player as deployed: ${_e}`);
        }
    }

    /**
     * Track that a player is no longer deployed.
     * Call this from OnPlayerUndeploy.
     */
    export function markPlayerUndeployed(player: mod.Player): void {
        if (!player) return;
        try {
            const pid = mod.GetObjId(player);
            if (pid < 0) return;  // Invalid player reference - skip silently
            const wasDeployed = deployedPlayerIds.has(pid);
            deployedPlayerIds.delete(pid);
            logDebug(`[Undeployed] Player ${pid} marked as undeployed (was=${wasDeployed}). Total deployed: ${deployedPlayerIds.size}`);
        } catch (_e) {
            logDebug(`[Undeployed] Failed to mark player as undeployed: ${_e}`);
        }
    }

    export function isAISoldier(player: mod.Player): boolean {
        if (!player) return false;

        let pid = -1;
        try {
            pid = mod.GetObjId(player);
        } catch (_e) {
            // If we can't even read an ObjId, assume human.
            return false;
        }

        // Avoid SoldierState calls for undeployed players to prevent PlayerNotDeployed spam.
        if (!deployedPlayerIds.has(pid)) {
            return aiStatusByPlayerId[pid] ?? false;
        }

        // Deployed: SoldierState should be safe.
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            aiStatusByPlayerId[pid] = isAI;
            return isAI;
        } catch (_e) {
            // If SoldierState throws, treat as undeployed to prevent repeated exception spam.
            markPlayerUndeployed(player);
            return aiStatusByPlayerId[pid] ?? false;
        }
    }

    export function isAlive(player: mod.Player): boolean {
        // Avoid SoldierState calls for undeployed players to prevent PlayerNotDeployed spam.
        if (!hasSoldier(player)) return false;
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
        } catch (_e) {
            // SoldierState unavailable; treat as undeployed to stop repeated exceptions.
            try {
                markPlayerUndeployed(player);
            } catch (_e2) {
                // ignore errors during undeployed marking
            }
            return false;
        }
    }

    /**
     * Check if a player has a spawned soldier (not on deploy screen).
     * Uses event-based tracking instead of GetSoldierState to avoid spam.
     * 
     * CRITICAL: This uses deployedPlayerIds tracking, NOT GetSoldierState.
     * Prevents "PlayerNotDeployed" spam in PortalLog.txt
     */
    export function hasSoldier(player: mod.Player): boolean {
        if (!player) return false;
        try {
            const pid = mod.GetObjId(player);
            return deployedPlayerIds.has(pid);
        } catch (_e) {
            return false;
        }
    }

    /**
     * Get the team ID (1 or 2) for a player.
     * Compares the player's Team object against mod.GetTeam(1) and mod.GetTeam(2).
     */
    export function getPlayerTeamId(player: mod.Player): number {
        try {
            const playerTeam = mod.GetTeam(player);
            if (!playerTeam) return 0;
            
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);
            
            // Compare by ObjId since mod.Team objects may not be === equal
            const playerTeamObjId = mod.GetObjId(playerTeam);
            if (team1 && mod.GetObjId(team1) === playerTeamObjId) return 1;
            if (team2 && mod.GetObjId(team2) === playerTeamObjId) return 2;
            
            return 0;
        } catch (_e) {
            return 0;
        }
    }

    export function distance(a: mod.Vector, b: mod.Vector): number {
        const dx = mod.XComponentOf(a) - mod.XComponentOf(b);
        const dy = mod.YComponentOf(a) - mod.YComponentOf(b);
        const dz = mod.ZComponentOf(a) - mod.ZComponentOf(b);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // "Host" heuristic: ObjId==0 often corresponds to the local/host player.
    export function tryGetHostPlayer(): mod.Player | null {
        try {
            const all = mod.AllPlayers();
            const count = mod.CountOf(all);

            // First choice: ObjId==0 AND human.
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && mod.GetObjId(p) === 0 && !isAISoldier(p)) {
                    return p;
                }
            }

            // Fallback: first human player.
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && !isAISoldier(p)) {
                    return p;
                }
            }
        } catch (_e) {
            // ignore
        }
        return null;
    }

    // Monotonic-ish clock
    let GAME_TIME_SECONDS = 0;
    // IMPORTANT: mod.GetRoundTime() can legitimately be 0 at round start.
    // Using 0 as a sentinel breaks all time-based logic (spawns/bleed/etc.).
    let LAST_RAW_ROUND_TIME: number | null = null;
    let ROUND_TIME_DIRECTION = 0; // 0 unknown, 1 increasing, -1 decreasing
    let FALLBACK_CLOCK_ACCUM = 0;
    const FALLBACK_ADVANCE_STEP = TICK_INTERVAL_SECONDS * 0.25;

    // Guard: multiple now(true) calls within the same engine tick can otherwise advance fallback time too quickly.
    // We allow forceAdvance to apply at most once per RoundTime sample.
    let LAST_FORCE_ADVANCE_RAW: number | null = null;

    export function resetGameClock(): void {
        GAME_TIME_SECONDS = 0;
        LAST_RAW_ROUND_TIME = null;
        ROUND_TIME_DIRECTION = 0;
        FALLBACK_CLOCK_ACCUM = 0;
        LAST_FORCE_ADVANCE_RAW = null;
    }

    function updateGameClock(forceAdvance: boolean): void {
        // GetRoundTime() can be 0 or behave inconsistently across experiences.
        // GetMatchTimeElapsed() is a more reliable monotonic-ish source.
        const raw = mod.GetMatchTimeElapsed();

        if (forceAdvance) {
            if (LAST_FORCE_ADVANCE_RAW !== null && raw === LAST_FORCE_ADVANCE_RAW) {
                forceAdvance = false;
            } else {
                LAST_FORCE_ADVANCE_RAW = raw;
            }
        }
        if (LAST_RAW_ROUND_TIME === null) {
            LAST_RAW_ROUND_TIME = raw;
            if (forceAdvance && GAME_TIME_SECONDS === 0) {
                FALLBACK_CLOCK_ACCUM += FALLBACK_ADVANCE_STEP;
                if (FALLBACK_CLOCK_ACCUM >= TICK_INTERVAL_SECONDS) {
                    GAME_TIME_SECONDS += TICK_INTERVAL_SECONDS;
                    FALLBACK_CLOCK_ACCUM -= TICK_INTERVAL_SECONDS;
                }
            }
            return;
        }

        const delta = raw - LAST_RAW_ROUND_TIME;
        if (ROUND_TIME_DIRECTION === 0) {
            if (delta > 0) {
                ROUND_TIME_DIRECTION = 1;
            } else if (delta < 0) {
                ROUND_TIME_DIRECTION = -1;
            }
        }

        let adjusted = 0;
        if (ROUND_TIME_DIRECTION === -1) {
            adjusted = LAST_RAW_ROUND_TIME - raw;
        } else {
            adjusted = raw - LAST_RAW_ROUND_TIME;
        }

        if (adjusted < 0) {
            adjusted = -adjusted;
        }

        if (adjusted > 0) {
            GAME_TIME_SECONDS += adjusted;
            FALLBACK_CLOCK_ACCUM = 0;
        } else if (forceAdvance) {
            FALLBACK_CLOCK_ACCUM += FALLBACK_ADVANCE_STEP;
            if (FALLBACK_CLOCK_ACCUM >= TICK_INTERVAL_SECONDS) {
                GAME_TIME_SECONDS += TICK_INTERVAL_SECONDS;
                FALLBACK_CLOCK_ACCUM -= TICK_INTERVAL_SECONDS;
            }
        }

        LAST_RAW_ROUND_TIME = raw;
    }

    export function now(_forceAdvance?: boolean): number {
        // Use the engine-provided match clock.
        // The previous custom accumulator could drift badly and cause runaway tick logic (spam/OOM).
        try {
            return mod.GetMatchTimeElapsed();
        } catch (_e) {
            return 0;
        }
    }

    // =========================================================================
    // V7 Helper Functions for Module Compatibility
    // =========================================================================
    
    /**
     * Get tickets for a team (forward to Registry after it's initialized).
     * Used by modules that need ticket access.
     */
    export function getTickets(teamId: number): number {
        // Forward to Registry which holds the actual ticket state
        return Registry_GetTickets(teamId);
    }

    // =========================================================================
    // ParseUI - Full implementation from modlib
    // =========================================================================

    type UIVector = mod.Vector | number[];

    interface UIParams {
        name: string;
        type: string;
        position: any;
        size: any;
        anchor: mod.UIAnchor;
        parent: mod.UIWidget;
        visible: boolean;
        textLabel: string;
        textColor: UIVector;
        textAlpha: number;
        textSize: number;
        textAnchor: mod.UIAnchor;
        padding: number;
        bgColor: UIVector;
        bgAlpha: number;
        bgFill: mod.UIBgFill;
        imageType: mod.UIImageType;
        imageColor: UIVector;
        imageAlpha: number;
        teamId?: mod.Team;
        playerId?: mod.Player;
        children?: any[];
        buttonEnabled: boolean;
        buttonColorBase: UIVector;
        buttonAlphaBase: number;
        buttonColorDisabled: UIVector;
        buttonAlphaDisabled: number;
        buttonColorPressed: UIVector;
        buttonAlphaPressed: number;
        buttonColorHover: UIVector;
        buttonAlphaHover: number;
        buttonColorFocused: UIVector;
        buttonAlphaFocused: number;
    }

    function __asModVector(param: number[] | mod.Vector) {
        if (Array.isArray(param)) return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
        else return param;
    }

    function __asModMessage(param: string | mod.Message) {
        if (typeof param === 'string') return mod.Message(param);
        return param;
    }

    function __fillInDefaultArgs(params: UIParams) {
        if (!params.hasOwnProperty('name')) params.name = '';
        if (!params.hasOwnProperty('position')) params.position = mod.CreateVector(0, 0, 0);
        if (!params.hasOwnProperty('size')) params.size = mod.CreateVector(100, 100, 0);
        if (!params.hasOwnProperty('anchor')) params.anchor = mod.UIAnchor.TopLeft;
        if (!params.hasOwnProperty('parent')) params.parent = mod.GetUIRoot();
        if (!params.hasOwnProperty('visible')) params.visible = true;
        if (!params.hasOwnProperty('padding')) params.padding = params.type == 'Container' ? 0 : 8;
        if (!params.hasOwnProperty('bgColor')) params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
        if (!params.hasOwnProperty('bgAlpha')) params.bgAlpha = 0.5;
        if (!params.hasOwnProperty('bgFill')) params.bgFill = mod.UIBgFill.Solid;
    }

    function __setNameAndGetWidget(uniqueName: any, params: any) {
        const widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
        mod.SetUIWidgetName(widget, params.name);
        return widget;
    }

    const __cUniqueName = '----uniquename----';

    function __addUIContainer(params: UIParams) {
        __fillInDefaultArgs(params);
        const restrict = params.teamId ?? params.playerId;
        // Note: playerId can be a mod.Player object - check for undefined/null only
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIContainer(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                restrict
            );
        } else {
            mod.AddUIContainer(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill
            );
        }
        const widget = __setNameAndGetWidget(__cUniqueName, params);
        if (params.children) {
            params.children.forEach((childParams: any) => {
                childParams.parent = widget;
                __addUIWidget(childParams);
            });
        }
        return widget;
    }

    function __fillInDefaultTextArgs(params: UIParams) {
        if (!params.hasOwnProperty('textLabel')) params.textLabel = '';
        if (!params.hasOwnProperty('textSize')) params.textSize = 0;
        if (!params.hasOwnProperty('textColor')) params.textColor = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('textAlpha')) params.textAlpha = 1;
        if (!params.hasOwnProperty('textAnchor')) params.textAnchor = mod.UIAnchor.CenterLeft;
    }

    function __addUIText(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultTextArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIText(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                __asModMessage(params.textLabel),
                params.textSize,
                __asModVector(params.textColor),
                params.textAlpha,
                params.textAnchor,
                restrict
            );
        } else {
            mod.AddUIText(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                __asModMessage(params.textLabel),
                params.textSize,
                __asModVector(params.textColor),
                params.textAlpha,
                params.textAnchor
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }

    function __fillInDefaultImageArgs(params: any) {
        if (!params.hasOwnProperty('imageType')) params.imageType = mod.UIImageType.None;
        if (!params.hasOwnProperty('imageColor')) params.imageColor = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('imageAlpha')) params.imageAlpha = 1;
    }

    function __addUIImage(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultImageArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIImage(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.imageType,
                __asModVector(params.imageColor),
                params.imageAlpha,
                restrict
            );
        } else {
            mod.AddUIImage(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.imageType,
                __asModVector(params.imageColor),
                params.imageAlpha
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }

    function __fillInDefaultButtonArgs(params: any) {
        if (!params.hasOwnProperty('buttonEnabled')) params.buttonEnabled = true;
        if (!params.hasOwnProperty('buttonColorBase')) params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
        if (!params.hasOwnProperty('buttonAlphaBase')) params.buttonAlphaBase = 1;
        if (!params.hasOwnProperty('buttonColorDisabled')) params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
        if (!params.hasOwnProperty('buttonAlphaDisabled')) params.buttonAlphaDisabled = 0.5;
        if (!params.hasOwnProperty('buttonColorPressed')) params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
        if (!params.hasOwnProperty('buttonAlphaPressed')) params.buttonAlphaPressed = 1;
        if (!params.hasOwnProperty('buttonColorHover')) params.buttonColorHover = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('buttonAlphaHover')) params.buttonAlphaHover = 1;
        if (!params.hasOwnProperty('buttonColorFocused')) params.buttonColorFocused = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('buttonAlphaFocused')) params.buttonAlphaFocused = 1;
    }

    function __addUIButton(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultButtonArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIButton(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.buttonEnabled,
                __asModVector(params.buttonColorBase),
                params.buttonAlphaBase,
                __asModVector(params.buttonColorDisabled),
                params.buttonAlphaDisabled,
                __asModVector(params.buttonColorPressed),
                params.buttonAlphaPressed,
                __asModVector(params.buttonColorHover),
                params.buttonAlphaHover,
                __asModVector(params.buttonColorFocused),
                params.buttonAlphaFocused,
                restrict
            );
        } else {
            mod.AddUIButton(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.buttonEnabled,
                __asModVector(params.buttonColorBase),
                params.buttonAlphaBase,
                __asModVector(params.buttonColorDisabled),
                params.buttonAlphaDisabled,
                __asModVector(params.buttonColorPressed),
                params.buttonAlphaPressed,
                __asModVector(params.buttonColorHover),
                params.buttonAlphaHover,
                __asModVector(params.buttonColorFocused),
                params.buttonAlphaFocused
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }

    function __addUIWidget(params: UIParams) {
        if (params == null) return undefined;
        if (params.type == 'Container') return __addUIContainer(params);
        else if (params.type == 'Text') return __addUIText(params);
        else if (params.type == 'Image') return __addUIImage(params);
        else if (params.type == 'Button') return __addUIButton(params);
        return undefined;
    }

    export function ParseUI(...params: any[]): mod.UIWidget | undefined {
        let widget: mod.UIWidget | undefined;
        for (let a = 0; a < params.length; a++) {
            widget = __addUIWidget(params[a] as UIParams);
        }
        return widget;
    }

    /**
     * HUD functions - placeholder exports for compatibility
     * These will be overridden by HudModuleParseUI when it loads
     */
    // HUD functions removed - using HudModuleParseUI instead
}

