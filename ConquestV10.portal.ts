// @ts-nocheck
// ConquestV10 - Soft-Influence Conquest Mode
// Works WITH AIBattlefieldBehavior, not against it
// Auto-generated bundle - DO NOT EDIT
// Generated: 2026-02-13T19:25:58.516Z


// Module: config/ConquestConfig.ts
namespace ConquestV8 {
    export const BUILD_ID = "2026-01-28-conquestv8-soft-influence";
    const deployedPlayerIds: Set<number> = new Set();
    const aiStatusByPlayerId: { [playerId: number]: boolean } = {};
    export const DEBUG_LOGS = true;  // ENABLED for debugging
    export const DEBUG_INTERVAL_SECONDS = 15.0;  // Throttle repeated messages (increased from 10s)
    export const DEBUG_AI_SPAWN = false;
    export const DEBUG_SKY_JETS = false;
    export const DEBUG_VEHICLE_UI = false;
    export const DEBUG_HOST_POPULATION_HUD = true;  // ON - show population on HUD
    export const USE_AUTOSPAWN_MODE = false;
    export const ENABLE_REPLACEMENT_SPAWN = true;
    export const REPLACEMENT_SPAWN_DELAY = 20.0;  // Seconds after death before replacement spawns (full bleedout window)
    export const MAX_REPLACEMENT_SPAWNS_PER_TICK = 2;  // Max replacements per tick (avoid quota)
    export const ERROR_LOG_THROTTLE_SECONDS = 2.0;
    const _lastDebugLogTimeByMessage: { [msg: string]: number } = {};
    const _lastDebugLogTimeByKey: { [key: string]: number } = {};
    export function log(msg: string): void {
        if (DEBUG_LOGS) {
            console.log(msg);
        }
    }
    export function logDebug(msg: string): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByMessage[msg];
        if (last === undefined || t - last >= DEBUG_INTERVAL_SECONDS) {
            _lastDebugLogTimeByMessage[msg] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }
    export function logDebugKey(key: string, msg: string, intervalSeconds: number = DEBUG_INTERVAL_SECONDS): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByKey[key];
        if (last === undefined || t - last >= intervalSeconds) {
            _lastDebugLogTimeByKey[key] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }
    export function logError(msg: string): void {
        console.log(`[ConquestV10][ERROR] ${msg}`);
    }
    export function safeCall(label: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            logError(`[safeCall:${label}] ${e}`);
        }
    }
    export const GAME_START_GRACE_PERIOD_SECONDS = 30;
    export const TICK_INTERVAL_SECONDS = 1.0;  // Must be 1.0 for proper sound tick timing
    export const OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS: number | null = 2700.0; // 45 minutes
    export const ENABLE_WIN_CONDITION_LOGS = true;
    export const TEAM_SIZE_TARGET = 18; // 18 scripted bots per team (quota limit)
    export const RESERVED_HUMAN_SLOTS_PER_TEAM = 0;
    export const BOTS_PER_SPAWN_BATCH = 4;          // Spawn 4 bots per tick during pre-round
    export const PRE_ROUND_SPAWN_INTERVAL = 0.5;     // Spawn every 0.5 seconds during pre-round
    export const AI_SPAWN_DELAY_SECONDS = 5.0;
    export const AI_QUOTA_COOLDOWN_SECONDS = 10.0;
    export const SQUAD_SIZE = 4;                    // Bots per squad
    export const MIN_SQUAD_SIZE_FOR_ORDERS = 2;     // Minimum size to receive orders
    export const MAX_SQUADS_PER_OBJECTIVE = 2;      // Max squads assigned per objective (2 allows 8+ squads across 7 objectives)
    export const FORCE_OBJECTIVE_DIVERSITY = true;
    export const DIRECTOR_REASSIGNMENT_INTERVAL = 15.0; // Seconds between reassignments
    export const SET_STARTING_TICKETS_ON_ROUND_START = true;
    export const STARTING_TICKETS = 1000;
    export const TICKET_LOSS_DEATH = 2;           // Infantry death costs 2 tickets
    export const TICKET_LOSS_REVIVE_REFUND = 2;   // Revive refunds the same amount
    export const TICKET_LOSS_VEHICLE_LIGHT = 5;   // Quads, jeeps, light transports
    export const TICKET_LOSS_VEHICLE_HEAVY = 10;  // Tanks, IFVs
    export const TICKET_LOSS_VEHICLE_AIR = 15;    // Jets, helicopters
    export const TICKET_LOSS_VEHICLE_DEFAULT = 5; // Unknown vehicle types
    export const TICKET_LOSS_OBJECTIVE_CAPTURED = 5;  // Set to 0 to disable, or 30 for significant impact
    export const RESERVED_HUMAN_SLOTS = RESERVED_HUMAN_SLOTS_PER_TEAM;  // Alias
    export const TICKET_LOSS_ON_DEATH = TICKET_LOSS_DEATH;              // Alias
    export const TICKET_REFUND_ON_REVIVE = TICKET_LOSS_REVIVE_REFUND;  // Alias
    export const TICKET_BLEED_PER_FLAG_ADVANTAGE = 0.5; // Tickets lost per flag advantage per tick
    export const SCORE_VEHICLE_LIGHT = 100;      // Quadbike, GolfCart, Flyer60, Marauder
    export const SCORE_VEHICLE_TRANSPORT = 200;  // RHIB, transport variants
    export const SCORE_VEHICLE_IFV = 250;        // Bradley, Vector, CV90
    export const SCORE_VEHICLE_AA = 400;         // Cheetah, Gepard
    export const SCORE_VEHICLE_TANK = 500;       // Abrams, Leopard
    export const SCORE_VEHICLE_HELI = 600;       // UH60, AH64, Eurocopter
    export const SCORE_VEHICLE_JET = 1000;       // F16, F22, JAS39, SU57
    export const SCORE_VEHICLE_DEFAULT = 100;    // Unknown vehicle types
    export const TOTAL_PLAYERS_TARGET = 64;
    export const ENABLE_AI_COMBAT_TARGETING = true;
    export const COMBAT_ENGAGEMENT_RANGE_METERS = 80.0;
    export const OBJECTIVE_RADIUS_METERS = 30.0;
    export const ENABLE_VEHICLE_SEEKING_SQUADS = false;  // ENABLED: Squads seek vehicles at HQ before objectives
    export const VEHICLE_SEEKING_SQUADS_PER_TEAM = 6;  // Increased from 4 (more vehicles)
    export const VEHICLE_SEEK_TIMEOUT_SECONDS = 15.0;  // Reduced from 30.0 - faster fallback to objectives
    export const AT_HQ_DISTANCE_METERS = 100.0;
    export const FULL_MAP_CONTROL_GRACE_SECONDS = 15.0;
    export const FULL_MAP_CONTROL_BLEED_MULTIPLIER = 3.0;
    export const ENABLE_AI_SKY_JETS = true;
    export const AI_SKY_JET_CHECK_INTERVAL_SECONDS = 8.0;
    export const AI_SKY_JET_SPAWN_COOLDOWN_SECONDS = 60.0;  // 60s cooldown to reduce Director state churn
    export const SKY_JET_BEHAVIOR_REFRESH_SECONDS = 3.0;    // Re-apply pilot behavior to prevent idle/bail
    export const MAX_SKY_JETS_PER_TEAM = 1;                 // Only 1 jet per team (2 total) to reduce AI teleport churn
    export const JET_PILOT_PICKUP_RADIUS_METERS = 400.0;    // Large radius to catch bots moving away from HQ
    export const ENABLE_ALL_JETS_AS_SKY_JETS = true;
    export const TEAM1_SKY_JET_SPAWNER_IDS = [232, 243];
    export const TEAM2_SKY_JET_SPAWNER_IDS = [233, 244];
    export function getSkyJetSpawnerIds(teamId: number): number[] {
        if (ENABLE_ALL_JETS_AS_SKY_JETS) {
            return teamId === 1 ? TEAM1_SKY_JET_SPAWNER_IDS : TEAM2_SKY_JET_SPAWNER_IDS;
        }
        return teamId === 1 ? [243] : [244];
    }
    export const ENABLE_VEHICLE_SEAT_FILLING = false;  // Disabled: fills all seats every tick, pins passengers in place
    export const VEHICLE_CHECK_INTERVAL_SECONDS = 5.0;  // Increased from 3.0 to reduce overhead
    export const VEHICLE_SEAT_FILL_RANGE_METERS = 25.0;
    export const ENABLE_SEAT_TELEPORT_ASSIST = false;
    export const SEAT_TELEPORT_MAX_DISTANCE_METERS = 150.0;
    export const SEAT_TELEPORT_OFFSET_METERS = 1.5;
    export const JET_PILOT_MAX_DISTANCE_METERS = 200.0;
    export const VEHICLE_DIRECTOR_START_DELAY_SECONDS = 10.0;
    export const ENABLE_VEHICLE_UNLOCK_ONCE = true;
    export const VEHICLE_UNLOCK_ONCE_DELAY_SECONDS = 30.0;
    export const ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR = true;
    export const ENABLE_GROUND_VEHICLE_INIT_SWEEP = true;
    export const GROUND_VEHICLE_INIT_INTERVAL_SECONDS = 30.0;
    export const ENABLE_SCRIPTED_GROUND_SPAWN = true;
    export const GROUND_SPAWN_DELAY_SECONDS = 10.0;
    export const ENABLE_SPAWNER_INIT_SWEEP = false;
    export const SPAWNER_INIT_INTERVAL_SECONDS = 30.0;
    export const SPAWNER_INIT_NEAR_DISTANCE_METERS = 80.0;
    export const ENABLE_VEHICLE_SEAT_DEBUG = false;
    export const VEHICLE_SEAT_DEBUG_INTERVAL_SECONDS = 5.0;
    export const ENABLE_HQ_JET_SEED_TELEPORT = true;  // Enabled: pick any bot for jet pilots since they all run to objectives
    export const PRESERVE_MAP_GROUND_AUTOSPAWN = true;
    export const ENABLE_GROUND_AUTOSPAWN_AFTER_DELAY = true;
    export const ENABLE_FORCE_HOST_SIDE = false;
    export const PREFERRED_STARTING_TEAM_ID: 0 | 1 | 2 = 0;
    export const PREFERRED_STARTING_FACTION: mod.Factions | null = null;
    let cachedTeam1Faction: mod.Factions | null = null;
    let cachedTeam2Faction: mod.Factions | null = null;
    let factionsCached = false;
    function detectAndCacheFactions(): void {
        if (factionsCached) return;
        factionsCached = true;
        try {
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);
            if (!team1 || !team2) {
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
                return;
            }
            const t1IsNato = mod.IsFaction(team1, mod.Factions.NATO);
            const t1IsPax = mod.IsFaction(team1, mod.Factions.PaxArmata);
            const t2IsNato = mod.IsFaction(team2, mod.Factions.NATO);
            const t2IsPax = mod.IsFaction(team2, mod.Factions.PaxArmata);
            if (t1IsNato && !t1IsPax) {
                cachedTeam1Faction = mod.Factions.NATO;
            } else if (t1IsPax && !t1IsNato) {
                cachedTeam1Faction = mod.Factions.PaxArmata;
            } else {
                cachedTeam1Faction = mod.Factions.NATO;
            }
            if (t2IsPax && !t2IsNato) {
                cachedTeam2Faction = mod.Factions.PaxArmata;
            } else if (t2IsNato && !t2IsPax) {
                cachedTeam2Faction = mod.Factions.NATO;
            } else {
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }
            if (cachedTeam1Faction === cachedTeam2Faction) {
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }
        } catch (_e) {
            cachedTeam1Faction = mod.Factions.NATO;
            cachedTeam2Faction = mod.Factions.PaxArmata;
        }
    }
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
        let desiredTeamId: number = 0;
        if (PREFERRED_STARTING_TEAM_ID === 1 || PREFERRED_STARTING_TEAM_ID === 2) {
            desiredTeamId = PREFERRED_STARTING_TEAM_ID;
        } else if (PREFERRED_STARTING_FACTION !== null) {
            const team1Faction = getTeamFaction(1);
            const team2Faction = getTeamFaction(2);
            if (team1Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 1;
            if (team2Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 2;
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
        try {
            if (!mod.IsPlayerValid(host)) return;
        } catch (_e) {
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
    export const ENABLE_SCRIPTED_AI_SPAWNING = true;
    export const SCRIPTED_AI_SPAWN_START_DELAY_SECONDS = 1.0;
    export const ENABLE_AI_ORDERS = true;
    export const DIRECTOR_INTERVAL_SECONDS = 2.5;
    export const BOT_MOVE_COMMAND_INTERVAL_SECONDS = 8.0;
    export const STOP_ORDERS_WHEN_IN_VEHICLE = true;
    export type Objective = { 
        id: string; 
        name: string; 
        objId: number; 
        x: number; 
        y: number; 
        z: number; 
        waypointPathId?: number;
        approachPoint?: { x: number; y: number; z: number };
        isRooftop?: boolean;
    };
    const GRANITE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -1104.93, y: 145.185, z: -24.5901, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -879.76, y: 176.987, z: 39.8464, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: -1041.81, y: 144.489, z: 161.46, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: -1044.36, y: 178.913, z: -128.505, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -1248.85, y: 127.857, z: 75.4271, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: -912.492, y: 142.426, z: 203.425, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -1079.37, y: 142.426, z: 407.619, waypointPathId: 807, isRooftop: false },
    ];
    const CAPSTONE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: 533.339, y: 144.579, z: 160.168, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: 377.991, y: 87.9316, z: 109.611, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 191.581, y: 89.9122, z: -121.593, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: 17.9395, y: 123.376, z: -183.508, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -224.563, y: 119.736, z: -106.128, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: 456.145, y: 88.003, z: 298.109, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -92.9837, y: 94.7251, z: -49.348, waypointPathId: 807, isRooftop: false },
    ];
    const PORTAL_SAND_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -83.3688, y: 74.0922, z: -115.04, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -22.5187, y: 113.229, z: -220.526, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: -20.2488, y: 73.3962, z: 71.0104, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: 143.217, y: 106.82, z: -48.4518, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -227.289, y: 56.7642, z: -15.0225, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: 109.069, y: 71.3332, z: 114.975, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -60.8087, y: 71.3332, z: 231.169, waypointPathId: 807, isRooftop: false },
    ];
    const EASTWOOD_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -153.652, y: 296.229, z: 95.4245, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -153.622, y: 284.625, z: -78.2236, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 608, x: 71.8797, y: 264.909, z: 5.77899, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 606, x: -284.281, y: 279.208, z: 10.7012, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: 195.164, y: 253.621, z: -154.116, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 604, x: 9.00656, y: 253.861, z: 86.9226, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -72.1564, y: 256.644, z: 153.608, waypointPathId: 807, isRooftop: false },
    ];
    export let OBJECTIVES: Objective[] = [];
    let mapConfigInitialized = false;
    let currentMapName = "Unknown";
    export function initializeMapConfig(): void {
        if (mapConfigInitialized) return;
        mapConfigInitialized = true;
        try {
            if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                OBJECTIVES = GRANITE_OBJECTIVES;
                currentMapName = "Granite_MainStreet";
                log(`[ConquestV10] Map detected: Granite Downtown - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                OBJECTIVES = CAPSTONE_OBJECTIVES;
                currentMapName = "Capstone";
                log(`[ConquestV10] Map detected: Capstone - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Sand)) {
                OBJECTIVES = PORTAL_SAND_OBJECTIVES;
                currentMapName = "Portal_Sand";
                log(`[ConquestV10] Map detected: Portal Sandbox - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                OBJECTIVES = EASTWOOD_OBJECTIVES;
                currentMapName = "Eastwood";
                log(`[ConquestV10] Map detected: Eastwood - ${OBJECTIVES.length} objectives loaded`);
            }
            else {
                OBJECTIVES = GRANITE_OBJECTIVES;
                currentMapName = "Unknown (fallback to Granite)";
                log(`[ConquestV10] Unknown map - falling back to Granite Downtown config`);
            }
        } catch (_e) {
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
    export function isRooftopObjective(letter: string): boolean {
        const obj = getObjectiveByLetter(letter);
        return obj?.isRooftop === true;
    }
    export function getApproachPoint(letter: string): { x: number; y: number; z: number } | null {
        const obj = getObjectiveByLetter(letter);
        return obj?.approachPoint ?? null;
    }
    export const TEAM1_AI_SPAWNER_IDS = [1092, 1091, 1090, 1093];
    export const TEAM2_AI_SPAWNER_IDS = [1002, 1003, 1004, 1005];
    export function createPos(x: number, y: number, z: number): mod.Vector {
        return mod.CreateVector(x, y, z);
    }
    export function textMessage(text: string): mod.Message {
        return mod.Message("{}", text);
    }
    export const CAPTURE_RADIUS_METERS = 40.0;
    export const CAPTURE_TIME_SECONDS = 10.0;  // Reduced from 15.0 for faster captures
    export const NEUTRALIZE_TIME_SECONDS = 10.0;  // Reduced from 7.5 for faster neutralization
    export const ENABLE_OBJECTIVE_ENTER_EXIT_SFX = true;
    export const ENABLE_CAPTURE_TICK_SFX = true;
    export const ENABLE_CAPTURE_TICK_LOOP_SFX = true;
    export const ENABLE_CAPTURE_LEADIN_SFX = false;
    export const ENABLE_CONTESTED_SFX = true;
    export const ENABLE_GAMEPLAY_HUD = true;
    export const ENABLE_SCOREBOARD = true;
    export const HUD_COLOR_MODE: "absolute" | "perspective" = "absolute";
    export const SCOREBOARD_UPDATE_INTERVAL_SECONDS = 2.0;
    export const SCOREBOARD_CAPTURES_LABEL = "C";
    export function markPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        try {
            const pid = mod.GetObjId(player);
            deployedPlayerIds.add(pid);
            logDebug(`[Deployed] Player ${pid} marked as deployed. Total deployed: ${deployedPlayerIds.size}`);
        } catch (_e) {
            logDebug(`[Deployed] Failed to mark player as deployed: ${_e}`);
        }
    }
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
            return false;
        }
        if (!deployedPlayerIds.has(pid)) {
            return aiStatusByPlayerId[pid] ?? false;
        }
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            aiStatusByPlayerId[pid] = isAI;
            return isAI;
        } catch (_e) {
            markPlayerUndeployed(player);
            return aiStatusByPlayerId[pid] ?? false;
        }
    }
    export function isAlive(player: mod.Player): boolean {
        if (!hasSoldier(player)) return false;
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
        } catch (_e) {
            try {
                markPlayerUndeployed(player);
            } catch (_e2) {
            }
            return false;
        }
    }
    export function hasSoldier(player: mod.Player): boolean {
        if (!player) return false;
        try {
            const pid = mod.GetObjId(player);
            return deployedPlayerIds.has(pid);
        } catch (_e) {
            return false;
        }
    }
    export function getPlayerTeamId(player: mod.Player): number {
        try {
            const playerTeam = mod.GetTeam(player);
            if (!playerTeam) return 0;
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);
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
    export function tryGetHostPlayer(): mod.Player | null {
        try {
            const all = mod.AllPlayers();
            const count = mod.CountOf(all);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && mod.GetObjId(p) === 0 && !isAISoldier(p)) {
                    return p;
                }
            }
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && !isAISoldier(p)) {
                    return p;
                }
            }
        } catch (_e) {
        }
        return null;
    }
    let GAME_TIME_SECONDS = 0;
    let LAST_RAW_ROUND_TIME: number | null = null;
    let ROUND_TIME_DIRECTION = 0; // 0 unknown, 1 increasing, -1 decreasing
    let FALLBACK_CLOCK_ACCUM = 0;
    const FALLBACK_ADVANCE_STEP = TICK_INTERVAL_SECONDS * 0.25;
    let LAST_FORCE_ADVANCE_RAW: number | null = null;
    export function resetGameClock(): void {
        GAME_TIME_SECONDS = 0;
        LAST_RAW_ROUND_TIME = null;
        ROUND_TIME_DIRECTION = 0;
        FALLBACK_CLOCK_ACCUM = 0;
        LAST_FORCE_ADVANCE_RAW = null;
    }
    function updateGameClock(forceAdvance: boolean): void {
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
        try {
            return mod.GetMatchTimeElapsed();
        } catch (_e) {
            return 0;
        }
    }
    export function getTickets(teamId: number): number {
        return Registry_GetTickets(teamId);
    }
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
}


// Module: modules/SafeSDKWrapper.ts
namespace ConquestV8 {
    export function isActivePlayer(player: mod.Player): boolean {
        if (!player) return false;
        try {
            if (!mod.IsPlayerValid(player)) return false;
        } catch (_e) {
            return false;
        }
        return safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
    }
    export function safeGetSoldierState<T>(
        player: mod.Player,
        stateKey: T,
        defaultValue: any = null
    ): any {
        if (!player) return defaultValue;
        if (!hasSoldier(player)) return defaultValue;
        try {
            const result = mod.GetSoldierState(player, stateKey as any);
            return result !== undefined ? result : defaultValue;
        } catch (_e) {
            return defaultValue;
        }
    }
    export function safeGetSoldierStateBool(
        player: mod.Player,
        stateKey: mod.SoldierStateBool
    ): boolean {
        return safeGetSoldierState(player, stateKey, false) === true;
    }
    export function safeGetSoldierStateVector(
        player: mod.Player,
        stateKey: mod.SoldierStateVector
    ): mod.Vector {
        const result = safeGetSoldierState(player, stateKey, null);
        return result ?? mod.CreateVector(0, 0, 0);
    }
    export function safeGetVehicleFromPlayer(player: mod.Player): mod.Vehicle | null {
        if (!player) return null;
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive)) {
            return null; // Dead/mandown players throw on GetVehicleFromPlayer
        }
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)) {
            return null;
        }
        try {
            const vehicle = mod.GetVehicleFromPlayer(player);
            return vehicle ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetPlayerFromVehicleSeat(
        vehicle: mod.Vehicle,
        seatNumber: number
    ): mod.Player | null {
        if (!vehicle) return null;
        try {
            if (!mod.IsVehicleSeatOccupied(vehicle, seatNumber)) {
                return null;
            }
            const player = mod.GetPlayerFromVehicleSeat(vehicle, seatNumber);
            return player ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetPlayerVehicleSeat(player: mod.Player): number {
        if (!player) return -1;
        try {
            const seat = mod.GetPlayerVehicleSeat(player);
            return typeof seat === "number" ? seat : -1;
        } catch (_e) {
            return -1;
        }
    }
    export function safeIsVehicleSeatOccupied(
        vehicle: mod.Vehicle,
        seatNumber: number
    ): boolean {
        if (!vehicle) return false;
        try {
            return mod.IsVehicleSeatOccupied(vehicle, seatNumber) === true;
        } catch (_e) {
            return false;
        }
    }
    export function safeForcePlayerToSeat(
        player: mod.Player,
        vehicle: mod.Vehicle,
        seatNumber: number
    ): boolean {
        if (!player || !vehicle) return false;
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive)) {
            return false; // Can't seat dead player
        }
        try {
            mod.ForcePlayerToSeat(player, vehicle, seatNumber);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeSpawnAIFromAISpawner(
        spawner: mod.Spawner,
        nameMessage: mod.Message,
        team: mod.Team
    ): boolean {
        if (!spawner || !team) return false;
        try {
            mod.SpawnAIFromAISpawner(spawner, nameMessage, team);
            return true; // Assume success if no exception
        } catch (_e) {
            return false;
        }
    }
    export function safeCompareVehicleName(
        vehicle: mod.Vehicle,
        vehicleType: mod.VehicleList
    ): boolean {
        if (!vehicle) return false;
        try {
            return mod.CompareVehicleName(vehicle, vehicleType) === true;
        } catch (_e) {
            return false;
        }
    }
    export function safeDealDamageToVehicle(
        vehicle: mod.Vehicle,
        damageAmount: number
    ): boolean {
        if (!vehicle || damageAmount <= 0) return false;
        try {
            mod.DealDamage(vehicle, damageAmount);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeDealDamageToPlayer(
        player: mod.Player,
        damageAmount: number
    ): boolean {
        if (!player || damageAmount <= 0) return false;
        try {
            mod.DealDamage(player, damageAmount);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeHasSoldier(player: mod.Player): boolean {
        if (!player) return false;
        try {
            const isAlive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
            return isAlive !== undefined;
        } catch (_e) {
            return false;
        }
    }
    export function safeAIMoveTo(
        player: mod.Player,
        position: mod.Vector
    ): boolean {
        if (!player || !position) return false;
        try {
            mod.AIValidatedMoveToBehavior(player, position);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeGetVehicleSpawner(spawnerId: number): mod.VehicleSpawner | null {
        if (spawnerId < 0) return null;
        try {
            const spawner = mod.GetVehicleSpawner(spawnerId);
            return spawner ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetSpawner(spawnerId: number): mod.Spawner | null {
        if (spawnerId < 0) return null;
        try {
            const spawner = mod.GetSpawner(spawnerId);
            return spawner ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetVehicleStateVector(
        vehicle: mod.Vehicle,
        stateKey: mod.VehicleStateVector
    ): mod.Vector | null {
        if (!vehicle) return null;
        try {
            return mod.GetVehicleState(vehicle, stateKey);
        } catch (_e) {
            return null;
        }
    }
}


// Module: modules/RegistryModule.ts
namespace ConquestV8 {
    export interface ObjectiveState {
        objId: number;
        index: number;
        teamId: number;          // 0=neutral, 1=team1, 2=team2
        letter: string;          // A, B, C, etc.
        captureProgress: number; // 0-100
        isContested: boolean;
    }
    let objectives: ObjectiveState[] = [];
    export function Registry_SetObjectives(newObjectives: ObjectiveState[]): void {
        objectives = newObjectives;
        log("[Registry] Registered " + objectives.length + " objectives");
    }
    export function Registry_GetObjectives(): ObjectiveState[] {
        return objectives;
    }
    export function Registry_GetObjective(index: number): ObjectiveState | null {
        return objectives[index] || null;
    }
    export function Registry_UpdateObjectiveOwnership(index: number, teamId: number): void {
        if (objectives[index]) {
            objectives[index].teamId = teamId;
        }
    }
    let ticketsTeam1 = STARTING_TICKETS;
    let ticketsTeam2 = STARTING_TICKETS;
    export function Registry_GetTickets(teamId: number): number {
        return teamId === 1 ? ticketsTeam1 : ticketsTeam2;
    }
    export function Registry_SetTickets(teamId: number, value: number): void {
        if (teamId === 1) {
            ticketsTeam1 = Math.max(0, value);
        } else {
            ticketsTeam2 = Math.max(0, value);
        }
    }
    export function Registry_DeductTickets(teamId: number, amount: number): void {
        const current = Registry_GetTickets(teamId);
        Registry_SetTickets(teamId, current - amount);
    }
    export interface Squad {
        id: number;
        teamId: number;
        members: mod.Player[];
        assignedObjectiveIndex: number;  // -1 = no assignment
    }
    let squads: Squad[] = [];
    export function Registry_SetSquads(newSquads: Squad[]): void {
        squads = newSquads;
    }
    export function Registry_GetSquads(teamId?: number): Squad[] {
        if (teamId !== undefined) {
            return squads.filter(s => s.teamId === teamId);
        }
        return squads;
    }
    export function Registry_GetSquad(squadId: number): Squad | null {
        return squads.find(s => s.id === squadId) || null;
    }
    export function Registry_UpdateSquadAssignment(squadId: number, objectiveIndex: number): void {
        const squad = Registry_GetSquad(squadId);
        if (squad) {
            squad.assignedObjectiveIndex = objectiveIndex;
        }
    }
    let aiCountTeam1 = 0;
    let aiCountTeam2 = 0;
    export function Registry_GetAICount(teamId: number): number {
        return teamId === 1 ? aiCountTeam1 : aiCountTeam2;
    }
    export function Registry_SetAICount(teamId: number, count: number): void {
        if (teamId === 1) {
            aiCountTeam1 = count;
        } else {
            aiCountTeam2 = count;
        }
    }
    export function Registry_IncrementAICount(teamId: number): void {
        if (teamId === 1) {
            aiCountTeam1++;
        } else {
            aiCountTeam2++;
        }
    }
    export function Registry_DecrementAICount(teamId: number): void {
        if (teamId === 1) {
            aiCountTeam1 = Math.max(0, aiCountTeam1 - 1);
        } else {
            aiCountTeam2 = Math.max(0, aiCountTeam2 - 1);
        }
    }
    export enum RoundState {
        PreRound,
        Active,
        Ending,
        Ended
    }
    let roundState = RoundState.PreRound;
    let roundStartTime = 0;
    let portalRoundNumber = 0;
    export function Registry_GetRoundState(): RoundState {
        return roundState;
    }
    export function Registry_SetRoundState(state: RoundState): void {
        roundState = state;
    }
    export function Registry_GetRoundStartTime(): number {
        return roundStartTime;
    }
    export function Registry_SetRoundStartTime(time: number): void {
        roundStartTime = time;
    }
    export function Registry_GetPortalRoundNumber(): number {
        return portalRoundNumber;
    }
    export function Registry_IncrementPortalRoundNumber(): number {
        portalRoundNumber++;
        log(`[Registry] Portal Round ${portalRoundNumber} starting`);
        return portalRoundNumber;
    }
    export function Registry_Reset(): void {
        objectives = [];
        ticketsTeam1 = STARTING_TICKETS;
        ticketsTeam2 = STARTING_TICKETS;
        squads = [];
        aiCountTeam1 = 0;
        aiCountTeam2 = 0;
        roundState = RoundState.PreRound;
        roundStartTime = 0;
        log("[Registry] All state reset");
    }
}


// Module: modules/SoundsModule.ts
namespace ConquestV8 {
    let initialized = false;
    let audioInitialized = false;
    let sfxCaptureStartedFriendly: mod.SFX | null = null;
    let sfxCaptureStartedEnemy: mod.SFX | null = null;
    let sfxCapturedFriendly: mod.SFX | null = null;
    let sfxNeutralize: mod.SFX | null = null;
    let sfxContested: mod.SFX | null = null;
    let sfxObjectiveEnter: mod.SFX | null = null;
    let sfxObjectiveExit: mod.SFX | null = null;
    let sfxTickFriendly: mod.SFX | null = null;
    let sfxTickEnemy: mod.SFX | null = null;
    let sfxVoModule: mod.SFX | null = null;
    let voModuleObjId = 0;
    let team1Handle: mod.Team | null = null;
    let team2Handle: mod.Team | null = null;
    const CAPTURE_SOUND_COOLDOWN = 3.0;
    const TICK_SOUND_INTERVAL = 1.0;  // Must be >= 1.0s for performance
    const lastCaptureStatusByObj: number[] = [];
    const lastCaptureSoundTimeByObj: number[] = [];
    const lastTickSoundTimeByObj: number[] = [];
    const lastCaptureProgressByObj: number[] = [];
    const neutralizePlayedByObj: boolean[] = [];
    const VO_FLAGS: mod.VoiceOverFlags[] = [];
    export function initSoundsModule(): void {
        initialized = true;
        audioInitialized = false;
        voModuleObjId = 0;
        team1Handle = mod.GetTeam(1);
        team2Handle = mod.GetTeam(2);
        VO_FLAGS.length = 0;
        VO_FLAGS.push(mod.VoiceOverFlags.Alpha);
        VO_FLAGS.push(mod.VoiceOverFlags.Bravo);
        VO_FLAGS.push(mod.VoiceOverFlags.Charlie);
        VO_FLAGS.push(mod.VoiceOverFlags.Delta);
        VO_FLAGS.push(mod.VoiceOverFlags.Echo);
        VO_FLAGS.push(mod.VoiceOverFlags.Foxtrot);
        VO_FLAGS.push(mod.VoiceOverFlags.Golf);
        const n = OBJECTIVES.length;
        lastCaptureStatusByObj.length = n;
        lastCaptureSoundTimeByObj.length = n;
        lastTickSoundTimeByObj.length = n;
        lastCaptureProgressByObj.length = n;
        neutralizePlayedByObj.length = n;
        for (let i = 0; i < n; i++) {
            lastCaptureStatusByObj[i] = 0;
            lastCaptureSoundTimeByObj[i] = -9999;
            lastTickSoundTimeByObj[i] = -9999;
            lastCaptureProgressByObj[i] = 0;
            neutralizePlayedByObj[i] = false;
        }
        log("[ConquestV10][Sounds] Initialized");
    }
    function ensureInit(): void {
        if (!initialized) initSoundsModule();
    }
    function spawnSfx(spawnId: number): mod.SFX | null {
        if (!spawnId) return null;
        try {
            const zero = mod.CreateVector(0, 0, 0);
            return mod.SpawnObject(spawnId, zero, zero, zero) as mod.SFX;
        } catch (_e) {
            return null;
        }
    }
    function initAudioHandles(): void {
        if (audioInitialized) return;
        safeCall("Sounds:SpawnHandles", () => {
            sfxCaptureStartedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByFriendly_OneShot2D
            );
            sfxCaptureStartedEnemy = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByEnemy_OneShot2D
            );
            sfxCapturedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnCapturedByFriendly_OneShot2D
            );
            sfxNeutralize = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureNeutralize_OneShot2D);
            sfxContested = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnContested_OneShot2D);
            sfxObjectiveEnter = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnEnter_OneShot2D);
            sfxObjectiveExit = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnExit_OneShot2D);
            sfxTickFriendly = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D);
            sfxTickEnemy = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D);
            sfxVoModule = spawnSfx(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D);
        });
        if (sfxVoModule) {
            safeCall("Sounds:VoContext", () => {
                voModuleObjId = mod.GetObjId(sfxVoModule as unknown as mod.Object);
                log(`[ConquestV10][Sounds] VO module spawned objId=${voModuleObjId}`);
            });
        } else {
            voModuleObjId = 0;
            log("[ConquestV10][Sounds] VO module spawn FAILED (no VO)");
        }
        audioInitialized = true;
    }
    function refreshAudioHandles(): void {
        ensureInit();
        if (!audioInitialized) initAudioHandles();
    }
    function getTeamId(team: mod.Team | null): number {
        if (!team) return 0;
        try {
            const id = mod.GetObjId(team);
            return id === 1 || id === 2 ? id : 0;
        } catch (_e) {
            return 0;
        }
    }
    function getObjectiveIndexByObjId(objId: number): number {
        const objectives = Registry_GetObjectives();
        for (let i = 0; i < objectives.length; i++) {
            if (objectives[i].objId === objId) return i;
        }
        return -1;
    }
    function getVoFlagForLetter(letter: string): mod.VoiceOverFlags | undefined {
        switch (letter) {
            case "A": return mod.VoiceOverFlags.Alpha;
            case "B": return mod.VoiceOverFlags.Bravo;
            case "C": return mod.VoiceOverFlags.Charlie;
            case "D": return mod.VoiceOverFlags.Delta;
            case "E": return mod.VoiceOverFlags.Echo;
            case "F": return mod.VoiceOverFlags.Foxtrot;
            case "G": return mod.VoiceOverFlags.Golf;
            default: return undefined;
        }
    }
    function getVoFlagForObjId(objId: number): mod.VoiceOverFlags | undefined {
        const objective = getObjectiveByObjId(objId);
        if (objective) {
            console.log(`[Sounds] getVoFlagForObjId: objId=${objId} -> letter=${objective.id} -> ${objective.name}`);
            return getVoFlagForLetter(objective.id);
        }
        console.log(`[Sounds] getVoFlagForObjId: objId=${objId} not found`);
        return undefined;
    }
    function playSoundOnPlayer(sfx: mod.SFX | null, player: mod.Player | null, volume: number): void {
        if (!sfx || !player) return;
        try {
            mod.PlaySound(sfx, volume, player);
        } catch (_e) {
        }
    }
    function playSoundToTeam(sfx: mod.SFX | null, team: mod.Team | null, volume: number): void {
        if (!sfx || !team) return;
        try {
            const targetTeamId = mod.GetObjId(team);
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                if (getPlayerTeamId(player) !== targetTeamId) continue;
                playSoundOnPlayer(sfx, player, volume);
            }
        } catch (_e) {
        }
    }
    function playSoundToAllPlayers(sfx: mod.SFX | null, volume: number): void {
        if (!sfx) return;
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                playSoundOnPlayer(sfx, player, volume);
            }
        } catch (_e) {
        }
    }
    function playVoToTeam(teamId: number, voEvent: mod.VoiceOverEvents2D, voFlag: mod.VoiceOverFlags): void {
        refreshAudioHandles();
        const team = teamId === 1 ? team1Handle : teamId === 2 ? team2Handle : null;
        if (!team) return;
        const voContext = voModuleObjId > 0 ? voModuleObjId : mod.GetObjId(team);
        try {
            mod.PlayVO(voContext, voEvent, voFlag, team);
        } catch (_e) {
        }
    }
    function playCaptureStartedSFX(capturingTeamId: number): void {
        refreshAudioHandles();
        const friendlyTeam = capturingTeamId === 1 ? team1Handle : team2Handle;
        const enemyTeam = capturingTeamId === 1 ? team2Handle : team1Handle;
        playSoundToTeam(sfxCaptureStartedFriendly, friendlyTeam, 1.0);
        playSoundToTeam(sfxCaptureStartedEnemy, enemyTeam, 1.0);
    }
    function playCaptureCompleteSFX(newOwnerTeamId: number, previousOwnerTeamId: number): void {
        refreshAudioHandles();
        const newOwnerTeam = newOwnerTeamId === 1 ? team1Handle : newOwnerTeamId === 2 ? team2Handle : null;
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (newOwnerTeam) playSoundToTeam(sfxCapturedFriendly, newOwnerTeam, 1.0);
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);
    }
    function playContestedSFX(): void {
        refreshAudioHandles();
        playSoundToAllPlayers(sfxContested, 0.9);
    }
    function playCapturedSound(teamId: number, objId: number, previousOwnerTeamId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;
        console.log(`[Sounds] playCapturedSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, losingTeam=${otherTeam}`);
        playCaptureCompleteSFX(teamId, previousOwnerTeamId);
        if (voFlag === undefined) return;
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voFlag);
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCaptured, voFlag);
    }
    function playContestedSound(_objectiveIndex: number): void {
        playContestedSFX();
    }
    function playCaptureStartSound(teamId: number, objId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;
        console.log(`[Sounds] playCaptureStartSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, enemyTeam=${otherTeam}`);
        playCaptureStartedSFX(teamId);
        if (voFlag === undefined) return;
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCapturing, voFlag);
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveTerritoryLost, voFlag);
    }
    function playNeutralizeSound(previousOwnerTeamId: number, objId: number): void {
        refreshAudioHandles();
        const voFlag = getVoFlagForObjId(objId);
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);
        if (voFlag === undefined) return;
        if (previousOwnerTeamId === 1 || previousOwnerTeamId === 2) {
            playVoToTeam(previousOwnerTeamId, mod.VoiceOverEvents2D.ObjectiveNeutralised, voFlag);
        }
    }
    function isContestedByPlayers(cp: mod.CapturePoint): boolean {
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(playersOnPoint);
            let seen1 = false;
            let seen2 = false;
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) seen1 = true;
                if (tid === 2) seen2 = true;
                if (seen1 && seen2) return true;
            }
        } catch (_e) {
        }
        return false;
    }
    export function Sounds_notifyCaptureStatus(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - (lastCaptureSoundTimeByObj[objectiveIndex] ?? -9999) < CAPTURE_SOUND_COOLDOWN) return;
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        const contested = isContestedByPlayers(cp);
        const prevStatus = lastCaptureStatusByObj[objectiveIndex] ?? 0;
        if (contested) {
            lastCaptureStatusByObj[objectiveIndex] = -1;
            playContestedSound(objectiveIndex);
            lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
            return;
        }
        if ((capturingTeamId === 1 || capturingTeamId === 2) && capturingTeamId !== ownerTeamId) {
            if (capturingTeamId === prevStatus) return;
            lastCaptureStatusByObj[objectiveIndex] = capturingTeamId;
            neutralizePlayedByObj[objectiveIndex] = false;
            playCaptureStartSound(capturingTeamId, objId);
            lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
        }
    }
    export function Sounds_notifyCaptureTick(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        if (isContestedByPlayers(cp)) return;
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) return;
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        let progress = 0;
        try {
            progress = mod.GetCaptureProgress(cp);
        } catch (_e) {
            return;
        }
        if (progress <= 0 || progress >= 1) return;
        if (ownerTeamId === 1 || ownerTeamId === 2) {
            const wasNeutralized = neutralizePlayedByObj[objectiveIndex] ?? false;
            if (!wasNeutralized && progress >= 0.5 && capturingTeamId !== ownerTeamId) {
                neutralizePlayedByObj[objectiveIndex] = true;
                playNeutralizeSound(ownerTeamId, objId);
            }
        }
        const timeNow = mod.GetMatchTimeElapsed();
        const lastTickTime = lastTickSoundTimeByObj[objectiveIndex] ?? -9999;
        if (timeNow - lastTickTime < TICK_SOUND_INTERVAL) return;
        lastTickSoundTimeByObj[objectiveIndex] = timeNow;
        lastCaptureProgressByObj[objectiveIndex] = progress;
        refreshAudioHandles();
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(playersOnPoint);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                if (!player) continue;
                const playerTeamId = getPlayerTeamId(player);
                if (playerTeamId === capturingTeamId) {
                    playSoundOnPlayer(sfxTickFriendly, player, 1.0);
                } else if (playerTeamId === 1 || playerTeamId === 2) {
                    playSoundOnPlayer(sfxTickEnemy, player, 1.0);
                }
            }
        } catch (_e) {
        }
    }
    export function Sounds_onCapturePointCaptured(cp: mod.CapturePoint, previousOwnerTeamId: number): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        if (ownerTeamId !== 1 && ownerTeamId !== 2) return;
        neutralizePlayedByObj[objectiveIndex] = false;
        playCapturedSound(ownerTeamId, objId, previousOwnerTeamId);
    }
    function playImmediateTickOnEnter(player: mod.Player, cp: mod.CapturePoint): void {
        if (!player || !cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        if (isContestedByPlayers(cp)) return;
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) return;
        let progress = 0;
        try {
            progress = mod.GetCaptureProgress(cp);
        } catch (_e) {
            return;
        }
        if (progress <= 0 || progress >= 1) return;
        const playerTeamId = getPlayerTeamId(player);
        const tickSfx = playerTeamId === capturingTeamId ? sfxTickFriendly : (playerTeamId === 1 || playerTeamId === 2 ? sfxTickEnemy : null);
        if (!tickSfx) return;
        const timeNow = mod.GetMatchTimeElapsed();
        lastTickSoundTimeByObj[objectiveIndex] = timeNow;
        lastCaptureProgressByObj[objectiveIndex] = progress;
        playSoundOnPlayer(tickSfx, player, 0.7);
    }
    export function Sounds_onPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveEnter, player, 0.6);
        playImmediateTickOnEnter(player, cp);
    }
    export function Sounds_onPlayerExitCapturePoint(player: mod.Player): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveExit, player, 0.6);
    }
    export function Sounds_playMatchStart(): void {
        ensureInit();
        refreshAudioHandles();
        playVoToTeam(1, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
        playVoToTeam(2, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
    }
}


// Module: modules/ObjectiveModule.ts
namespace ConquestV8 {
    const LETTER_MAP = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    let initialized = false;
    function getLetterFromCapturePoint(cp: mod.CapturePoint, fallbackIndex: number): string {
        const objId = mod.GetObjId(cp);
        const objective = OBJECTIVES.find(obj => obj.objId === objId);
        if (objective) {
            log("[Objective] Matched objId " + objId + " to letter '" + objective.id + "' from config");
            return objective.id;
        }
        const letter = LETTER_MAP[fallbackIndex] || ("CP" + fallbackIndex);
        log("[Objective] No config match for objId " + objId + ", using fallback '" + letter + "'");
        return letter;
    }
    export function Objective_Init(): void {
        if (initialized) return;
        const objectives: ObjectiveState[] = [];
        const allCapturePoints = mod.AllCapturePoints();
        const count = mod.CountOf(allCapturePoints);
        for (let i = 0; i < count; i++) {
            const cp = mod.ValueInArray(allCapturePoints, i) as mod.CapturePoint;
            const objId = mod.GetObjId(cp);
            const letter = getLetterFromCapturePoint(cp, i);
            objectives.push({
                objId,
                index: i,
                teamId: 0,  // Start neutral
                letter,
                captureProgress: 0,
                isContested: false
            });
            log("[Objective] Discovered " + letter + " (objId=" + objId + ", index=" + i + ")");
        }
        Registry_SetObjectives(objectives);
        initialized = true;
        log("[Objective] Initialized with " + count + " objectives");
    }
    export function Objective_OnCaptured(cp: mod.CapturePoint, newTeamId: number): void {
        const objId = mod.GetObjId(cp);
        const objectives = Registry_GetObjectives();
        const obj = objectives.find(o => o.objId === objId);
        if (obj) {
            const oldTeamId = obj.teamId;
            if (oldTeamId === newTeamId) return;
            Registry_UpdateObjectiveOwnership(obj.index, newTeamId);
            log("[Objective] " + obj.letter + " captured: team " + oldTeamId + " -> " + newTeamId);
            try {
                Sounds_onCapturePointCaptured(cp, oldTeamId);
            } catch (e) {
            }
        }
    }
    export function Objective_Tick(): void {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return;
        for (const obj of objectives) {
            try {
                const cp = mod.GetCapturePoint(obj.objId);
                if (!cp) continue;
                const owner = mod.GetCurrentOwnerTeam(cp);
                const ownerId = owner ? mod.GetObjId(owner) : 0;
                const normalizedOwner = ownerId === 1 || ownerId === 2 ? ownerId : 0;
                if (obj.teamId !== normalizedOwner) {
                    Registry_UpdateObjectiveOwnership(obj.index, normalizedOwner);
                }
            } catch (_e) {
            }
        }
    }
    export function Objective_GetOwnedCount(teamId: number): number {
        const objectives = Registry_GetObjectives();
        return objectives.filter(o => o.teamId === teamId).length;
    }
    export function Objective_GetNeutralCount(): number {
        const objectives = Registry_GetObjectives();
        return objectives.filter(o => o.teamId === 0).length;
    }
    export function Objective_Reset(): void {
        initialized = false;
        log("[Objective] Reset");
    }
}


// Module: modules/CapturePointModule.ts
namespace ConquestV8 {
    let initialized = false;
    export function CapturePoint_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[CapturePoint] Initialized");
    }
    export function CapturePoint_OnCaptured(cp: mod.CapturePoint): void {
        const ownerTeam = mod.GetCurrentOwnerTeam(cp);
        const capturingTeamId = mod.GetObjId(ownerTeam);
        const objId = mod.GetObjId(cp);
        const losingTeamId = capturingTeamId === 1 ? 2 : (capturingTeamId === 2 ? 1 : 0);
        Objective_OnCaptured(cp, capturingTeamId);
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            if (playersOnPoint) {
                const count = mod.CountOf(playersOnPoint);
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                    if (!p) continue;
                    try {
                        const pTeam = mod.GetTeam(p);
                        if (pTeam && mod.GetObjId(pTeam) === capturingTeamId) {
                            Scoreboard_recordCapture(p);
                        }
                    } catch (_e) {
                    }
                }
            }
        } catch (e) {
            logDebug(`[CapturePoint] Failed to award capture credit for obj ${objId}: ${e}`);
        }
    }
    export function CapturePoint_EnableAll(): void {
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            try {
                const cp = mod.GetCapturePoint(obj.objId);
                if (cp) {
                    mod.EnableCapturePointDeploying(cp, true);
                    mod.SetCapturePointCapturingTime(cp, CAPTURE_TIME_SECONDS);
                    mod.SetCapturePointNeutralizationTime(cp, NEUTRALIZE_TIME_SECONDS);
                    mod.SetMaxCaptureMultiplier(cp, 1.0);
                }
            } catch (e) {
                logError("[CapturePoint] Failed to enable " + obj.letter + ": " + e);
            }
        }
        log("[CapturePoint] All objectives enabled");
    }
    export function CapturePoint_Reset(): void {
        initialized = false;
        log("[CapturePoint] Reset");
    }
}


// Module: modules/Addbotnames.ts
namespace ConquestV8 {
    const BOT_NAME_POOL: string[] = [
        "Apex [bot]","Vector [bot]","Cipher [bot]","Echo [bot]","Delta [bot]","Bravo [bot]","Alpha [bot]","Omega [bot]",
        "Sentinel [bot]","Phantom [bot]","Havoc [bot]","Aurora [bot]","Nyx [bot]","Viper [bot]","Blaze [bot]","Specter [bot]",
        "Hydra [bot]","Falcon [bot]","Raptor [bot]","Nova [bot]","Atlas [bot]","Sable [bot]","Zephyr [bot]","Onyx [bot]",
        "Mirage [bot]","Javelin [bot]","Horizon [bot]","Tempest [bot]","Gladius [bot]","Striker [bot]","Thunder [bot]","Vanguard [bot]",
        "Trident [bot]","Peregrine [bot]","Ironclad [bot]","Rogue [bot]","Nomad [bot]","Quasar [bot]","Saber [bot]","Foxtrot [bot]",
        "Sierra [bot]","Talon [bot]","Valkyrie [bot]","Titan [bot]","Pioneer [bot]","Artemis [bot]","Helios [bot]","Hades [bot]",
        "Apollo [bot]","Erebus [bot]","Loki [bot]","Odin [bot]","Freya [bot]","Heimdall [bot]","Thor [bot]","Skadi [bot]",
        "Fenrir [bot]","Warden [bot]","Maverick [bot]","Ranger [bot]","Paladin [bot]","Reaper [bot]","Ghost [bot]","Raven [bot]",
        "Wolf [bot]","Bear [bot]","Lion [bot]","Tiger [bot]","Eagle [bot]","Hawk [bot]","Kestrel [bot]","Condor [bot]",
        "Orion [bot]","Pegasus [bot]","Draco [bot]","Lyra [bot]","Vega [bot]","Sirius [bot]","Polaris [bot]","Altair [bot]",
        "Comet [bot]","Meteor [bot]","Astro [bot]","Nebula [bot]","Cosmos [bot]","Quantum [bot]","Ion [bot]","Neon [bot]",
        "Pulse [bot]","Surge [bot]","Fury [bot]","Rift [bot]","Shade [bot]","Grit [bot]","Forge [bot]","Ember [bot]",
        "Stone [bot]","Steel [bot]","Copper [bot]","Cobalt [bot]","Silver [bot]","Gold [bot]","Obsidian [bot]","Granite [bot]",
        "Cinder [bot]","Frost [bot]","Blizzard [bot]","Monsoon [bot]","Cyclone [bot]","Quake [bot]","Aftershock [bot]","Tremor [bot]",
        "Tundra [bot]","Savanna [bot]","Canyon [bot]","Harbor [bot]","Outpost [bot]","Bastion [bot]","Citadel [bot]","Frontier [bot]",
        "Rook [bot]","Bishop [bot]","Knight [bot]","Ace [bot]","Dealer [bot]","Gambit [bot]","Charger [bot]","Rocket [bot]",
        "Riptide [bot]","Seabird [bot]","Voyager [bot]","Navigator [bot]","Trail [bot]","Pathfinder [bot]","Overwatch [bot]","Wildfire [bot]",
    ];
    let cursor = 0;
    export function initBotNames(): void {
        for (let i = BOT_NAME_POOL.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = BOT_NAME_POOL[i];
            BOT_NAME_POOL[i] = BOT_NAME_POOL[j];
            BOT_NAME_POOL[j] = tmp;
        }
        cursor = 0;
    }
    export function nextBotName(): string {
        if (BOT_NAME_POOL.length === 0) {
            return "Bot";
        }
        const name = BOT_NAME_POOL[cursor % BOT_NAME_POOL.length];
        cursor++;
        return `${name}`;
    }
}


// Module: modules/ObjectiveBiasModule.ts
namespace ConquestV8 {
    const BIAS_TICK_INTERVAL_SECONDS = 5.0;
    const DEFAULT_WEIGHT = 50;
    const MIN_WEIGHT = 10;
    const MAX_WEIGHT = 100;
    const OVERCROWDED_THRESHOLD = 6;   // More than 6 AI at one objective = overcrowded (lowered from 8)
    const UNDERDEFENDED_THRESHOLD = 2; // Fewer than 2 AI at owned objective = underdefended
    const WEIGHT_DECREASE_OVERCROWDED = 8;   // Increased from 3 to 8
    const WEIGHT_INCREASE_UNDERDEFENDED = 5; // Increased from 3 to 5
    const WEIGHT_BOOST_NEWLY_CAPTURED = 5;
    const WEIGHT_PENALTY_RECENTLY_LOST = 5;
    const WEIGHT_DECAY_RATE = 1; // Gradual return to default
    let initialized = false;
    let lastBiasTickTime = -9999;
    const objectiveWeights: Map<number, number> = new Map();
    const aiCountByObjective: Map<number, number> = new Map();
    const recentCaptures: Map<number, number> = new Map(); // objId -> captureTime
    const recentLosses: Map<number, number> = new Map();   // objId -> lossTime
    const CAPTURE_BOOST_DURATION_SECONDS = 30.0;
    export function ObjectiveBias_Init(): void {
        if (initialized) return;
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            objectiveWeights.set(obj.objId, DEFAULT_WEIGHT);
            aiCountByObjective.set(obj.objId, 0);
        }
        initialized = true;
        log("[ObjectiveBias] Initialized with " + objectives.length + " objectives at weight " + DEFAULT_WEIGHT);
    }
    export function ObjectiveBias_Tick(currentTime: number): void {
        if (!initialized) return;
        if (currentTime - lastBiasTickTime < BIAS_TICK_INTERVAL_SECONDS) return;
        lastBiasTickTime = currentTime;
        updateAICountsPerObjective();
        evaluateAndAdjustWeights(currentTime);
        if (DEBUG_LOGS) {
            logBiasSummary();
        }
    }
    function updateAICountsPerObjective(): void {
        for (const objId of aiCountByObjective.keys()) {
            aiCountByObjective.set(objId, 0);
        }
        const objectives = Registry_GetObjectives();
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                let isAI = false;
                try {
                    isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
                } catch (_e) {
                    continue;
                }
                if (!isAI) continue;
                let isAlive = false;
                try {
                    isAlive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
                } catch (_e) {
                    continue;
                }
                if (!isAlive) continue;
                let playerPos: mod.Vector;
                try {
                    playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                } catch (_e) {
                    continue;
                }
                const nearestObj = findNearestObjective(playerPos, objectives);
                if (nearestObj) {
                    const currentCount = aiCountByObjective.get(nearestObj.objId) ?? 0;
                    aiCountByObjective.set(nearestObj.objId, currentCount + 1);
                }
            }
        } catch (e) {
            logError("[ObjectiveBias] Failed to count AI: " + e);
        }
    }
    function findNearestObjective(playerPos: mod.Vector, objectives: ObjectiveState[]): ObjectiveState | null {
        const px = mod.XComponentOf(playerPos);
        const py = mod.YComponentOf(playerPos);
        const pz = mod.ZComponentOf(playerPos);
        let nearest: ObjectiveState | null = null;
        let nearestDistSq = OBJECTIVE_RADIUS_METERS * OBJECTIVE_RADIUS_METERS * 4; // 2x radius for detection
        for (const obj of objectives) {
            const configObj = getObjectiveByObjId(obj.objId);
            if (!configObj) continue;
            const dx = px - configObj.x;
            const dy = py - configObj.y;
            const dz = pz - configObj.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearest = obj;
            }
        }
        return nearest;
    }
    function evaluateAndAdjustWeights(currentTime: number): void {
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            let weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            if (aiCount > OVERCROWDED_THRESHOLD) {
                weight -= WEIGHT_DECREASE_OVERCROWDED;
                logDebugKey(`Bias:Overcrowded:${obj.objId}`, 
                    `[ObjectiveBias] ${obj.letter} overcrowded (${aiCount} AI), weight -${WEIGHT_DECREASE_OVERCROWDED}`, 10.0);
            }
            if (obj.teamId !== 0 && aiCount < UNDERDEFENDED_THRESHOLD) {
                weight += WEIGHT_INCREASE_UNDERDEFENDED;
                logDebugKey(`Bias:Underdefended:${obj.objId}`,
                    `[ObjectiveBias] ${obj.letter} underdefended (${aiCount} AI), weight +${WEIGHT_INCREASE_UNDERDEFENDED}`, 10.0);
            }
            if (obj.teamId === 0) {
                weight += 1;
            }
            const captureTime = recentCaptures.get(obj.objId);
            if (captureTime && currentTime - captureTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight += WEIGHT_BOOST_NEWLY_CAPTURED;
            } else if (captureTime) {
                recentCaptures.delete(obj.objId);
            }
            const lossTime = recentLosses.get(obj.objId);
            if (lossTime && currentTime - lossTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight -= WEIGHT_PENALTY_RECENTLY_LOST;
            } else if (lossTime) {
                recentLosses.delete(obj.objId);
            }
            if (weight > DEFAULT_WEIGHT) {
                weight -= WEIGHT_DECAY_RATE;
            } else if (weight < DEFAULT_WEIGHT) {
                weight += WEIGHT_DECAY_RATE;
            }
            weight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
            objectiveWeights.set(obj.objId, weight);
        }
    }
    export function ObjectiveBias_GetSuggestedObjective(teamId: number): ObjectiveState | null {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return null;
        const candidates: Array<{ obj: ObjectiveState; weight: number; aiCount: number }> = [];
        for (const obj of objectives) {
            const weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            if (aiCount > OVERCROWDED_THRESHOLD) continue;
            let priorityBonus = 0;
            if (obj.teamId === 0) {
                priorityBonus = 30; // Neutral - high priority
            } else if (obj.teamId !== teamId) {
                priorityBonus = 20; // Enemy-held - medium priority
            } else {
                priorityBonus = 0;  // Owned - lowest priority (unless underdefended)
                if (aiCount < UNDERDEFENDED_THRESHOLD) {
                    priorityBonus = 15; // Underdefended owned flag needs help
                }
            }
            candidates.push({
                obj,
                weight: weight + priorityBonus,
                aiCount
            });
        }
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.weight - a.weight);
        return candidates[0].obj;
    }
    export function ObjectiveBias_GetWeight(objId: number): number {
        return objectiveWeights.get(objId) ?? DEFAULT_WEIGHT;
    }
    export function ObjectiveBias_GetAICount(objId: number): number {
        return aiCountByObjective.get(objId) ?? 0;
    }
    function logBiasSummary(): void {
        const objectives = Registry_GetObjectives();
        const parts: string[] = [];
        for (const obj of objectives) {
            const weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            const owner = obj.teamId === 0 ? "N" : (obj.teamId === 1 ? "T1" : "T2");
            parts.push(`${obj.letter}:${weight}(${aiCount}AI,${owner})`);
        }
        logDebugKey("ObjectiveBias:Summary", `[ObjectiveBias] Weights: ${parts.join(" ")}`, 15.0);
    }
    export function ObjectiveBias_Reset(): void {
        initialized = false;
        lastBiasTickTime = -9999;
        objectiveWeights.clear();
        aiCountByObjective.clear();
        recentCaptures.clear();
        recentLosses.clear();
        log("[ObjectiveBias] Reset");
    }
}


// Module: modules/SpawnRecycleModule.ts
namespace ConquestV8 {
    const RECYCLE_ENABLED = true;   // ENABLED - we trigger respawn on dead bots
    const MAX_BOTS_PER_TEAM = 31;            // Target per team (62 total)
    const SPAWN_BATCH_SIZE = 4;              // Spawn 4 bots at a time
    const SPAWN_BATCH_INTERVAL = 2.0;        // Wait 2 seconds between batches
    const RECYCLE_DELAY_SECONDS = 1.0;       // Wait 1s after death before recycling (was 3s)
    const RECYCLE_BATCH_SIZE = 2;            // Recycle 2 dead bots per tick
    const PENDING_RECYCLE_TIMEOUT = 5.0;     // If pendingRecycle for 5s, retry DeployPlayer
    const SPAWN_PROTECTION_SECONDS = 3.0;    // Don't validate/recycle bots within 3s of spawn
    const ANTI_CLUSTER_COOLDOWN = 30.0;      // Don't spawn at same objective within 30s
    const OBJECTIVE_PRESSURE_WEIGHT = 2.0;   // Weight for objectives under enemy pressure
    const OBJECTIVE_CAPTURE_WEIGHT = 3.0;    // Weight for objectives being captured
    const OBJECTIVE_DEFENSE_WEIGHT = 1.5;    // Weight for owned objectives needing defense
    const RANDOMIZATION_FACTOR = 0.3;        // 30% randomization to prevent predictability
    const BEHAVIOR_MODE = 1;
    let currentMapType: 'capstone' | 'downtown' | 'metro' | 'unknown' = 'unknown';
    function detectMapBehaviorMode(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                currentMapType = 'capstone';
                log(`[SpawnRecycle] Map: Capstone`);
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                currentMapType = 'downtown';
                log(`[SpawnRecycle] Map: Downtown`);
            } else {
                currentMapType = 'unknown';
                log(`[SpawnRecycle] Map: Unknown`);
            }
        } catch (e) {
            currentMapType = 'unknown';
            log(`[SpawnRecycle] Map detection failed: ${e}`);
        }
        log(`[SpawnRecycle] Using Mode 1 (AIBattlefieldBehavior)`);
    }
    function safeApplyBehavior(player: mod.Player, behaviorFn: () => void, behaviorName: string): boolean {
        try {
            const botId = mod.GetObjId(player);
            if (!mod.IsPlayerValid(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} invalid player`);
                return false;
            }
            if (!hasSoldier(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} not deployed`);
                return false;
            }
            behaviorFn();
            return true;
        } catch (e) {
            log(`[SpawnRecycle] Safe behavior error (${behaviorName}): ${e}`);
            return false;
        }
    }
    function enableBotGadgets(player: mod.Player): void {
        try {
            mod.AIGadgetSettings(player, true, true, true);
        } catch (e) {
        }
    }
    interface ReplacementSpawnEntry {
        teamId: number;
        deathTime: number;
        originalBotId: number;  // For logging only
    }
    const replacementSpawnQueue: ReplacementSpawnEntry[] = [];
    export interface BotEntry {
        botId: number;                       // mod.GetObjId(player)
        player: mod.Player;                  // Reference to bot
        teamId: number;                      // 1 or 2
        assignedObjectiveIndex: number;      // Which objective they're biased toward
        spawnTime: number;                   // When they spawned
        lastDeathTime: number;               // When they died (0 = alive)
        isAlive: boolean;                    // Current state
        spawnCount: number;                  // How many times recycled
        pendingRecycle: boolean;             // DeployPlayer called, waiting for OnPlayerDeployed
        pendingRecycleTime: number;          // When DeployPlayer was called (for timeout)
        redeployTimeCalled: boolean;         // Has SetRedeployTime been called for current death?
        spawnerId: number;                   // Which spawner created this bot
        mandownTime: number;                 // When bot entered ManDown state (0 = not in ManDown)
    }
    const botRegistry: Map<number, BotEntry> = new Map();
    const objectiveLastSpawnTime: Map<number, number> = new Map();
    let initialSpawnRemaining: Map<number, number> = new Map();
    let lastInitialSpawnTime = 0;
    let initialSpawnPhase = false;
    let spawnPointRotationIndex = 0;
    let initialized = false;
    let lastSpawnTime = 0;
    let lastTickTime = 0;
    let spawnerRotationIndex = 0;
    let classRotationIndex = 0;
    function getPlayerTeamId(player: mod.Player): number {
        try {
            const team = mod.GetTeam(player);
            return team ? mod.GetObjId(team) : 0;
        } catch (e) {
            return 0;
        }
    }
    function registerBot(player: mod.Player, teamId: number, objectiveIndex: number, spawnerId: number = 0): void {
        const botId = mod.GetObjId(player);
        const entry: BotEntry = {
            botId,
            player,
            teamId,
            assignedObjectiveIndex: objectiveIndex,
            spawnTime: mod.GetMatchTimeElapsed(),
            lastDeathTime: 0,
            isAlive: true,
            spawnCount: 1,
            pendingRecycle: false,
            pendingRecycleTime: 0,
            redeployTimeCalled: false,
            spawnerId: spawnerId,
            mandownTime: 0,
        };
        botRegistry.set(botId, entry);
        log(`[SpawnRecycle] Registered bot ${botId} for team ${teamId} -> objective ${objectiveIndex} (spawner ${spawnerId})`);
    }
    function markBotDead(botId: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.isAlive = false;
            entry.lastDeathTime = mod.GetMatchTimeElapsed();
            log(`[SpawnRecycle] Bot ${botId} marked dead`);
        }
    }
    function updateBotAfterRecycle(botId: number, newPlayer: mod.Player, newObjectiveIndex: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.player = newPlayer;
            entry.assignedObjectiveIndex = newObjectiveIndex;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.isAlive = true;
            entry.spawnCount++;
            log(`[SpawnRecycle] Bot ${botId} recycled -> objective ${newObjectiveIndex} (spawn #${entry.spawnCount})`);
        }
    }
    function getAliveBotsForTeam(teamId: number): BotEntry[] {
        const alive: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive) {
                alive.push(entry);
            }
        }
        return alive;
    }
    function getDeadBotsForTeam(teamId: number): BotEntry[] {
        const dead: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && !entry.isAlive) {
                dead.push(entry);
            }
        }
        return dead;
    }
    function getTotalBotsForTeam(teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId) count++;
        }
        return count;
    }
    function calculateObjectiveWeight(objectiveIndex: number, teamId: number): number {
        const objectives = Registry_GetObjectives();
        const obj = objectives[objectiveIndex];
        if (!obj) return 0;
        const currentTime = mod.GetMatchTimeElapsed();
        const enemyTeamId = teamId === 1 ? 2 : 1;
        let weight = 1.0; // Base weight
        if (obj.teamId === 0) {
            weight += OBJECTIVE_CAPTURE_WEIGHT;
        } else if (obj.teamId === teamId) {
            weight += OBJECTIVE_DEFENSE_WEIGHT;
        } else {
            weight += OBJECTIVE_PRESSURE_WEIGHT;
        }
        if (obj.isContested) {
            weight += 2.0;
        }
        const botsAtObjective = countBotsAssignedToObjective(objectiveIndex, teamId);
        const avgBotsPerObjective = getAliveBotsForTeam(teamId).length / objectives.length;
        if (botsAtObjective > avgBotsPerObjective * 1.5) {
            weight *= 0.3;
        } else if (botsAtObjective < avgBotsPerObjective * 0.5) {
            weight *= 1.5;
        }
        const lastSpawn = objectiveLastSpawnTime.get(objectiveIndex) || 0;
        const timeSinceLastSpawn = currentTime - lastSpawn;
        if (timeSinceLastSpawn < ANTI_CLUSTER_COOLDOWN) {
            const cooldownFactor = timeSinceLastSpawn / ANTI_CLUSTER_COOLDOWN;
            weight *= cooldownFactor;
        }
        const randomOffset = (Math.random() - 0.5) * 2 * RANDOMIZATION_FACTOR;
        weight *= (1 + randomOffset);
        return Math.max(0.1, weight); // Minimum weight to ensure all objectives are possible
    }
    function countBotsAssignedToObjective(objectiveIndex: number, teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive && entry.assignedObjectiveIndex === objectiveIndex) {
                count++;
            }
        }
        return count;
    }
    function pickObjectiveForSpawn(teamId: number): number {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return 0;
        const ownedObjectives: number[] = [];
        const contestedObjectives: number[] = [];
        const neutralObjectives: number[] = [];
        const enemyObjectives: number[] = [];
        for (let i = 0; i < objectives.length; i++) {
            const obj = objectives[i];
            if (obj.teamId === teamId) {
                if (obj.isContested) {
                    contestedObjectives.push(i);
                } else {
                    ownedObjectives.push(i);
                }
            } else if (obj.teamId === 0) {
                neutralObjectives.push(i);
            } else {
                enemyObjectives.push(i);
            }
        }
        const weights: number[] = [];
        let totalWeight = 0;
        for (let i = 0; i < objectives.length; i++) {
            const weight = calculateObjectiveWeight(i, teamId);
            weights.push(weight);
            totalWeight += weight;
        }
        if (totalWeight <= 0) {
            log(`[SpawnRecycle] No objective weights - falling back to objective 0`);
            return 0;
        }
        let random = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        return 0;
    }
    function getSpawnPointIdForTeam(teamId: number): number {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnPointId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        return spawnPointId;
    }
    function getSpawnerForTeam(teamId: number): mod.Spawner | null {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnerId = spawnerIds[spawnerRotationIndex % spawnerIds.length];
        spawnerRotationIndex++;
        try {
            return mod.GetSpawner(spawnerId);
        } catch (e) {
            log(`[SpawnRecycle] Failed to get spawner ${spawnerId}: ${e}`);
            return null;
        }
    }
    function spawnBotForTeam(teamId: number, objectiveIndex: number): void {
        const spawner = getSpawnerForTeam(teamId);
        if (!spawner) {
            log(`[SpawnRecycle] No HQ spawner available for team ${teamId} - cannot spawn`);
            return;
        }
        try {
            const classes = [
                mod.SoldierClass.Assault,
                mod.SoldierClass.Engineer,
                mod.SoldierClass.Support,
                mod.SoldierClass.Recon,
            ];
            const soldierClass = classes[classRotationIndex % classes.length];
            classRotationIndex++;
            const team = mod.GetTeam(teamId);
            if (!team) {
                log(`[SpawnRecycle] Team ${teamId} not found`);
                return;
            }
            const name = nextBotName();
            const nameMsg = mod.Message(name);
            mod.SpawnAIFromAISpawner(spawner, soldierClass, nameMsg, team);
            objectiveLastSpawnTime.set(objectiveIndex, mod.GetMatchTimeElapsed());
            log(`[SpawnRecycle] Spawned bot for team ${teamId} at HQ, assigned to objective ${objectiveIndex}`);
        } catch (e) {
            const errorStr = String(e);
            if (errorStr.includes("OutOfAISpawnQuota")) {
                log(`[SpawnRecycle] AI quota reached - will retry later`);
            } else {
                log(`[SpawnRecycle] Spawn error: ${e}`);
            }
        }
    }
    export function SpawnRecycle_OnBotDied(player: mod.Player): void {
        if (!initialized) return;
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        if (!isAI) {
            return;
        }
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        if (ENABLE_REPLACEMENT_SPAWN) {
            replacementSpawnQueue.push({
                teamId: teamId,
                deathTime: currentTime,
                originalBotId: botId
            });
            log(`[SpawnRecycle] Bot ${botId} died (team ${teamId}) - queued REPLACEMENT spawn`);
            const entry = botRegistry.get(botId);
            if (entry) {
                entry.isAlive = false;
                entry.lastDeathTime = currentTime;
            }
            return;
        }
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.isAlive = false;
            entry.pendingRecycle = false;  // Clear pending flag if set
            entry.lastDeathTime = currentTime;
            if (RECYCLE_ENABLED) {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - queued for DeployPlayer recycle`);
            } else {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - spawner will handle respawn`);
            }
        } else {
            if (teamId > 0) {
                const newEntry: BotEntry = {
                    botId,
                    player,
                    teamId,
                    assignedObjectiveIndex: 0,
                    spawnTime: 0,
                    lastDeathTime: currentTime,
                    isAlive: false,
                    spawnCount: 0,
                    pendingRecycle: false,
                    pendingRecycleTime: 0,
                    redeployTimeCalled: false,
                    spawnerId: 0,
                    mandownTime: 0,
                };
                botRegistry.set(botId, newEntry);
                log(`[SpawnRecycle] Untracked bot ${botId} died (team ${teamId}) - registered and queued`);
            }
        }
    }
    export function SpawnRecycle_OnBotMandown(player: mod.Player): void {
        if (!initialized) return;
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        if (!isAI) {
            return;
        }
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.mandownTime = currentTime;
            log(`[SpawnRecycle] Bot ${botId} entered ManDown at ${currentTime.toFixed(1)}s`);
            if (entry.spawnerId > 0) {
                try {
                    const spawner = mod.GetSpawner(entry.spawnerId);
                    mod.AISetUnspawnOnDead(spawner, false);
                    log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false on spawner ${entry.spawnerId}`);
                } catch (e) {
                    log(`[SpawnRecycle] Bot ${botId} ManDown - spawner ${entry.spawnerId} error: ${e}`);
                }
            } else {
                const spawnerIds = entry.teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
                for (const spawnerId of spawnerIds) {
                    try {
                        const spawner = mod.GetSpawner(spawnerId);
                        mod.AISetUnspawnOnDead(spawner, false);
                    } catch (e) {
                    }
                }
                log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false to team ${entry.teamId} spawners`);
            }
        } else {
            log(`[SpawnRecycle] Untracked bot ${botId} entered ManDown`);
        }
    }
    function getObjectPos(obj: mod.Object): mod.Vector | null {
        try {
            return mod.GetObjectPosition(obj);
        } catch (_e) {
            return null;
        }
    }
    function getSpawnPositionForTeam(teamId: number): mod.Vector {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnerId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        try {
            const spawner = mod.GetSpawner(spawnerId);
            if (spawner) {
                const pos = getObjectPos(spawner as unknown as mod.Object);
                if (pos) return pos;
            }
        } catch (e) {}
        if (teamId === 1) {
            return mod.CreateVector(-1200, 150, 400); // Team 1 HQ approximate
        } else {
            return mod.CreateVector(-850, 150, -150); // Team 2 HQ approximate
        }
    }
    function applyBehaviorToBot(player: mod.Player, botId: number, objectiveIndex: number, currentTime: number): void {
        try {
            enableBotGadgets(player);
            safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
            log(`[SpawnRecycle] Bot ${botId} - AIBattlefieldBehavior applied`);
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - applyBehaviorToBot error: ${e}`);
        }
    }
    function startInitialSpawn(): void {
        log(`[SpawnRecycle] Starting batched initial spawn (${MAX_BOTS_PER_TEAM} per team, ${SPAWN_BATCH_SIZE} at a time)...`);
        initialSpawnPhase = true;
        lastInitialSpawnTime = 0; // Force immediate first batch
        for (let teamId = 1; teamId <= 2; teamId++) {
            const currentCount = getTotalBotsForTeam(teamId);
            const needed = MAX_BOTS_PER_TEAM - currentCount;
            initialSpawnRemaining.set(teamId, needed);
            log(`[SpawnRecycle] Team ${teamId} needs ${needed} bots`);
        }
    }
    function processInitialSpawnBatch(currentTime: number): void {
        if (!initialSpawnPhase) return;
        if (currentTime - lastInitialSpawnTime < SPAWN_BATCH_INTERVAL) return;
        let spawnedThisBatch = 0;
        let totalRemaining = 0;
        for (let teamId = 1; teamId <= 2; teamId++) {
            const remaining = initialSpawnRemaining.get(teamId) || 0;
            totalRemaining += remaining;
            if (remaining <= 0) continue;
            const toSpawn = Math.min(remaining, SPAWN_BATCH_SIZE);
            for (let i = 0; i < toSpawn; i++) {
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                spawnBotForTeam(teamId, objectiveIndex);
                spawnedThisBatch++;
            }
            initialSpawnRemaining.set(teamId, remaining - toSpawn);
            log(`[SpawnRecycle] Spawned ${toSpawn} bots for team ${teamId}, ${remaining - toSpawn} remaining`);
        }
        lastInitialSpawnTime = currentTime;
        if (totalRemaining - spawnedThisBatch <= 0) {
            initialSpawnPhase = false;
            const t1Count = getTotalBotsForTeam(1);
            const t2Count = getTotalBotsForTeam(2);
            log(`[SpawnRecycle] Initial spawn COMPLETE: Team1=${t1Count}, Team2=${t2Count}`);
        }
    }
    export function SpawnRecycle_OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
        if (!initialized) return;
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            if (!isAI) return; // Ignore human spawns
        } catch (e) {
            return;
        }
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const objectiveIndex = pickObjectiveForSpawn(teamId);
        const spawnerId = mod.GetObjId(spawner);
        let posStr = "unknown";
        try {
            const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            const x = Math.round(mod.XComponentOf(pos));
            const y = Math.round(mod.YComponentOf(pos));
            const z = Math.round(mod.ZComponentOf(pos));
            posStr = `(${x},${y},${z})`;
        } catch (e) {
            posStr = "pos_error";
        }
        let isRespawn = false;
        if (botRegistry.has(botId)) {
            isRespawn = true;
            const entry = botRegistry.get(botId)!;
            entry.isAlive = true;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.spawnCount++;
            entry.assignedObjectiveIndex = objectiveIndex;
            entry.pendingRecycle = false;  // Clear pending state
            entry.redeployTimeCalled = false;  // Reset for next death cycle
            entry.spawnerId = spawnerId;  // Track spawner for ManDown re-application
            entry.mandownTime = 0;  // Clear mandown state
            try {
                mod.AISetUnspawnOnDead(spawner, false);
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - re-applied AISetUnspawnOnDead=false`);
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - spawner config failed: ${e}`);
            }
            log(`[SpawnRecycle] Bot ${botId} spawned again (spawn #${entry.spawnCount}) at ${posStr} from spawner ${spawnerId}`);
        } else {
            registerBot(player, teamId, objectiveIndex, spawnerId);
            log(`[SpawnRecycle] New bot ${botId} registered at ${posStr} from spawner ${spawnerId}`);
        }
        const spawnType = isRespawn ? "RESPAWN" : "FIRST SPAWN";
        log(`[SpawnRecycle] Bot ${botId} - ${spawnType}: applying AIBattlefieldBehavior`);
        enableBotGadgets(player);
        try {
            safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
            log(`[SpawnRecycle] Bot ${botId} - AIBattlefieldBehavior applied`);
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - Behavior error: ${e}`);
        }
    }
    function getObjectivePosition(objectiveIndex: number): mod.Vector | null {
        try {
            const objectives = Registry_GetObjectives();
            if (objectiveIndex >= 0 && objectiveIndex < objectives.length) {
                const obj = objectives[objectiveIndex];
                if (obj && obj.objId) {
                    const capturePoint = mod.GetCapturePoint(obj.objId);
                    if (capturePoint) {
                        return mod.GetObjectPosition(capturePoint as unknown as mod.Object);
                    }
                }
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to get objective ${objectiveIndex} position: ${e}`);
        }
        return null;
    }
    function processReplacementSpawns(currentTime: number): void {
        if (!ENABLE_REPLACEMENT_SPAWN) return;
        if (replacementSpawnQueue.length === 0) return;
        let spawned = 0;
        const toRemove: number[] = [];
        for (let i = 0; i < replacementSpawnQueue.length && spawned < MAX_REPLACEMENT_SPAWNS_PER_TICK; i++) {
            const entry = replacementSpawnQueue[i];
            const timeSinceDeath = currentTime - entry.deathTime;
            if (timeSinceDeath < REPLACEMENT_SPAWN_DELAY) continue;
            const objectiveIndex = pickObjectiveForSpawn(entry.teamId);
            try {
                spawnBotForTeam(entry.teamId, objectiveIndex);
                log(`[SpawnRecycle] REPLACEMENT spawned for team ${entry.teamId} (replacing bot ${entry.originalBotId})`);
                spawned++;
                toRemove.push(i);
                if (botRegistry.has(entry.originalBotId)) {
                    botRegistry.delete(entry.originalBotId);
                    log(`[SpawnRecycle] Removed dead bot ${entry.originalBotId} from registry`);
                }
            } catch (e) {
                const errorStr = String(e);
                if (errorStr.includes("OutOfAISpawnQuota")) {
                    log(`[SpawnRecycle] REPLACEMENT spawn quota full - will retry`);
                } else {
                    log(`[SpawnRecycle] REPLACEMENT spawn error: ${e}`);
                    toRemove.push(i); // Remove failed entries
                }
            }
        }
        for (let i = toRemove.length - 1; i >= 0; i--) {
            replacementSpawnQueue.splice(toRemove[i], 1);
        }
        if (replacementSpawnQueue.length > 0) {
            log(`[SpawnRecycle] ${replacementSpawnQueue.length} replacements pending`);
        }
    }
    function validateRegistry(): void {
        const currentTime = mod.GetMatchTimeElapsed();
        for (const [botId, entry] of botRegistry.entries()) {
            try {
                const timeSinceSpawn = currentTime - entry.spawnTime;
                if (timeSinceSpawn < SPAWN_PROTECTION_SECONDS) {
                    continue;
                }
                if (!mod.IsPlayerValid(entry.player)) {
                    log("[SpawnRecycle] Bot " + botId + " IsPlayerValid=false (may be respawning)");
                    continue;
                }
                if (!entry.isAlive) continue;
                if (!hasSoldier(entry.player)) {
                    continue;
                }
                const isAlive = mod.GetSoldierState(entry.player, mod.SoldierStateBool.IsAlive);
                if (entry.isAlive && !isAlive) {
                    entry.isAlive = false;
                    entry.lastDeathTime = mod.GetMatchTimeElapsed();
                    log(`[SpawnRecycle] Bot ${botId} detected dead via validation - queued for recycle`);
                }
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} validateRegistry exception (may be spawning): ${e}`);
            }
        }
    }
    export function SpawnRecycle_Reset(): void {
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        lastValidateTime = 0;
        lastStatusTime = 0;
        initialized = false;
        startCalled = false; // Reset start guard
        log(`[SpawnRecycle] Reset complete`);
    }
    export function SpawnRecycle_Init(): void {
        if (initialized) return;
        detectMapBehaviorMode();
        initBotNames();
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        try {
            if (USE_AUTOSPAWN_MODE) {
                mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
                log(`[SpawnRecycle] SetSpawnMode(AutoSpawn) - bots will auto-respawn`);
            } else {
                mod.SetSpawnMode(mod.SpawnModes.Deploy);
                log(`[SpawnRecycle] SetSpawnMode(Deploy) - manual deploy screen`);
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to set spawn mode: ${e}`);
        }
        if (RECYCLE_ENABLED) {
            const allSpawnerIds = [...TEAM1_AI_SPAWNER_IDS, ...TEAM2_AI_SPAWNER_IDS];
            for (const spawnerId of allSpawnerIds) {
                try {
                    const spawner = mod.GetSpawner(spawnerId);
                    if (spawner) {
                        mod.AISetUnspawnOnDead(spawner, false);
                        log(`[SpawnRecycle] Spawner ${spawnerId}: AISetUnspawnOnDead=false`);
                    }
                } catch (e) {
                    log(`[SpawnRecycle] Failed to configure spawner ${spawnerId}: ${e}`);
                }
            }
            log(`[SpawnRecycle] Recycling ENABLED - SetRedeployTime will trigger respawn`);
        } else {
            log(`[SpawnRecycle] Portal natural respawn mode - spawner handles respawns`);
        }
        initialized = true;
    }
    let startCalled = false; // Prevent repeated calls to SpawnRecycle_Start
    export function SpawnRecycle_Start(): void {
        if (!initialized) {
            SpawnRecycle_Init();
        }
        if (startCalled) return;
        startCalled = true;
        startInitialSpawn();
    }
    let lastValidateTime = 0;
    const VALIDATE_INTERVAL = 3.0; // Validate registry every 3 seconds
    let lastStatusTime = 0;
    const STATUS_INTERVAL = 15.0; // Log status every 15 seconds
    let lastRecycleTime = 0;
    const RECYCLE_INTERVAL = 1.0; // Process dead bot recycling every 1 second
    export function SpawnRecycle_Tick(): void {
        if (!initialized) return;
        const currentTime = mod.GetMatchTimeElapsed();
        if (currentTime - lastTickTime < 0.5) return;
        lastTickTime = currentTime;
        if (initialSpawnPhase) {
            processInitialSpawnBatch(currentTime);
        }
        processReplacementSpawns(currentTime);
        if (currentTime - lastValidateTime >= VALIDATE_INTERVAL) {
            validateRegistry();
            lastValidateTime = currentTime;
        }
        if (currentTime - lastStatusTime >= STATUS_INTERVAL) {
            const t1Alive = getAliveBotsForTeam(1).length;
            const t2Alive = getAliveBotsForTeam(2).length;
            const t1Total = getTotalBotsForTeam(1);
            const t2Total = getTotalBotsForTeam(2);
            const t1Dead = t1Total - t1Alive;
            const t2Dead = t2Total - t2Alive;
            log(`[SpawnRecycle] STATUS (Mode ${BEHAVIOR_MODE}): T1=${t1Alive}/${t1Total} alive (${t1Dead} dead) | T2=${t2Alive}/${t2Total} alive (${t2Dead} dead)`);
            if (initialSpawnPhase) {
                const t1Remaining = initialSpawnRemaining.get(1) || 0;
                const t2Remaining = initialSpawnRemaining.get(2) || 0;
                log(`[SpawnRecycle] Initial spawn in progress: T1 needs ${t1Remaining}, T2 needs ${t2Remaining}`);
            }
            lastStatusTime = currentTime;
        }
    }
    export function SpawnRecycle_GetStats(): { team1Alive: number; team2Alive: number; team1Total: number; team2Total: number } {
        return {
            team1Alive: getAliveBotsForTeam(1).length,
            team2Alive: getAliveBotsForTeam(2).length,
            team1Total: getTotalBotsForTeam(1),
            team2Total: getTotalBotsForTeam(2),
        };
    }
    export function SpawnRecycle_OnPlayerDeployed(player: mod.Player): void {
        if (!initialized) return;
        if (!player) return;
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        log(`[SpawnRecycle] >>> OnPlayerDeployed fired for player ${botId}`);
        try {
            let isAI = false;
            try {
                isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            } catch (stateError) {
                log(`[SpawnRecycle] GetSoldierState threw for ${botId}: ${stateError}`);
                const entry = botRegistry.get(botId);
                if (entry) {
                    log(`[SpawnRecycle] Bot ${botId} is in registry, treating as AI`);
                    isAI = true;
                }
            }
            if (!isAI) {
                log(`[SpawnRecycle] Player ${botId} is not AI, skipping`);
                return;
            }
            const teamId = getPlayerTeamId(player);
            const entry = botRegistry.get(botId);
            if (entry) {
                log(`[SpawnRecycle] Bot ${botId} found in registry, isAlive=${entry.isAlive}, pendingRecycle=${entry.pendingRecycle}`);
                if (!entry.isAlive || entry.pendingRecycle) {
                    entry.isAlive = true;
                    entry.pendingRecycle = false;  // Clear pending flag
                    entry.pendingRecycleTime = 0;  // Clear timeout tracker
                    entry.redeployTimeCalled = false;  // Reset for next death cycle
                    entry.spawnTime = mod.GetMatchTimeElapsed();
                    entry.lastDeathTime = 0;  // Clear death time
                    entry.spawnCount++;
                    const objectiveIndex = pickObjectiveForSpawn(teamId);
                    entry.assignedObjectiveIndex = objectiveIndex;
                    log(`[SpawnRecycle] RECYCLED bot ${botId} (spawn #${entry.spawnCount}) - applying Mode ${BEHAVIOR_MODE}`);
                    const currentTime = mod.GetMatchTimeElapsed();
                    applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
                } else {
                    log(`[SpawnRecycle] Bot ${botId} already alive, skipping (handled by OnSpawnerSpawned)`);
                    return;
                }
            } else {
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                log(`[SpawnRecycle] STATIC bot ${botId} deployed (team ${teamId}) - applying Mode ${BEHAVIOR_MODE}`);
                const currentTime = mod.GetMatchTimeElapsed();
                applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
            }
        } catch (e) {
            log(`[SpawnRecycle] OnPlayerDeployed error for ${botId}: ${e}`);
        }
    }
}


// Module: modules/AILoadoutModule.ts
namespace ConquestV8 {
    export function equipAILoadout(bot: mod.Player): void {
        try {
            const soldierClass = getSoldierClass(bot);
            switch (soldierClass) {
                case "Assault":
                    equipAssaultLoadout(bot);
                    break;
                case "Engineer":
                    equipEngineerLoadout(bot);
                    break;
                case "Support":
                    equipSupportLoadout(bot);
                    break;
                case "Recon":
                    equipReconLoadout(bot);
                    break;
                default:
                    equipAssaultLoadout(bot); // Fallback
            }
            mod.AIGadgetSettings(bot, true, true, false);
            log(`[AILoadout] Equipped ${soldierClass} loadout for bot ${mod.GetObjId(bot)}`);
        } catch (e) {
            log(`[AILoadout] Failed to equip bot ${mod.GetObjId(bot)}: ${e}`);
        }
    }
    function getSoldierClass(bot: mod.Player): string {
        try {
            const roll = Math.random();
            if (roll < 0.30) return "Assault";
            if (roll < 0.55) return "Engineer";
            if (roll < 0.80) return "Support";
            return "Recon";
        } catch (e) {
            return "Assault";
        }
    }
    function equipAssaultLoadout(bot: mod.Player): void {
        const useSLM = Math.random() < 0.20;
        if (useSLM) {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Aim_Guided, mod.InventorySlots.GadgetOne);
        } else {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Unguided_Rocket, mod.InventorySlots.GadgetOne);
        }
        mod.AddEquipment(bot, mod.Gadgets.Class_Adrenaline_Injector, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    function equipEngineerLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Class_Repair_Tool, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Anti_Vehicle_Mine, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    function equipSupportLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Class_Supply_Bag, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Launcher_Air_Defense, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
    function equipReconLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Deployable_Deploy_Beacon, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Demolition_Charge, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
}


// Module: modules/DirectorModule.ts
namespace ConquestV8 {
    let initialized = false;
    let lastNudgeTime = 0;
    const lastNudgeByPlayerId: Map<number, number> = new Map();
    const lastPositionByPlayerId: Map<number, { x: number; y: number; z: number; time: number }> = new Map();
    const NUDGE_INTERVAL_SECONDS = 30.0;      // Only check every 30 seconds
    const IDLE_THRESHOLD_SECONDS = 20.0;      // Bot must be idle for 20s before nudge
    const IDLE_DISTANCE_THRESHOLD = 5.0;      // Bot must move less than 5m to be "idle"
    const MIN_NUDGE_INTERVAL_PER_BOT = 60.0;  // Don't nudge same bot more than once per minute
    const MAX_NUDGES_PER_TICK = 2;            // Maximum bots to nudge per tick (prevent spam)
    export function Director_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[Director V8] Initialized - soft-influence mode (nudge interval: " + NUDGE_INTERVAL_SECONDS + "s)");
    }
    export function Director_Tick(currentTime: number): void {
        if (currentTime - lastNudgeTime < NUDGE_INTERVAL_SECONDS) {
            return;
        }
        lastNudgeTime = currentTime;
        for (const teamId of [1, 2]) {
            processTeamNudges(teamId, currentTime);
        }
    }
    function processTeamNudges(teamId: number, currentTime: number): void {
        const suggestedObj = ObjectiveBias_GetSuggestedObjective(teamId);
        if (!suggestedObj) {
            logDebugKey(`Director:NoSuggestion:T${teamId}`, 
                `[Director V8] Team ${teamId}: No suggested objective from bias module`, 30.0);
            return;
        }
        const configObj = getObjectiveByObjId(suggestedObj.objId);
        if (!configObj) return;
        const idleBots = findIdleBots(teamId, currentTime);
        if (idleBots.length === 0) {
            logDebugKey(`Director:NoIdleBots:T${teamId}`,
                `[Director V8] Team ${teamId}: No idle bots detected`, 30.0);
            return;
        }
        logDebugKey(`Director:IdleBots:T${teamId}`,
            `[Director V8] Team ${teamId}: ${idleBots.length} idle bots, suggesting ${suggestedObj.letter}`, 15.0);
        let nudgeCount = 0;
        for (const bot of idleBots) {
            if (nudgeCount >= MAX_NUDGES_PER_TICK) break;
            const playerId = getPlayerId(bot);
            if (playerId < 0) continue;
            const lastNudge = lastNudgeByPlayerId.get(playerId) ?? 0;
            if (currentTime - lastNudge < MIN_NUDGE_INTERVAL_PER_BOT) continue;
            if (applyNudge(bot, configObj, currentTime)) {
                lastNudgeByPlayerId.set(playerId, currentTime);
                nudgeCount++;
            }
        }
        if (nudgeCount > 0) {
            log(`[Director V8] Team ${teamId}: Nudged ${nudgeCount} idle bots toward ${suggestedObj.letter}`);
        }
    }
    function findIdleBots(teamId: number, currentTime: number): mod.Player[] {
        const idleBots: mod.Player[] = [];
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                if (getPlayerTeamId(player) !== teamId) continue;
                if (!isAISoldier(player)) continue;
                if (!isAlive(player)) continue;
                if (isInVehicle(player)) continue;
                if (isPlayerIdle(player, currentTime)) {
                    idleBots.push(player);
                }
            }
        } catch (e) {
            logError("[Director V8] Error finding idle bots: " + e);
        }
        return idleBots;
    }
    function isPlayerIdle(player: mod.Player, currentTime: number): boolean {
        const playerId = getPlayerId(player);
        if (playerId < 0) return false;
        let currentPos: { x: number; y: number; z: number };
        try {
            const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            currentPos = {
                x: mod.XComponentOf(pos),
                y: mod.YComponentOf(pos),
                z: mod.ZComponentOf(pos)
            };
        } catch (_e) {
            return false;
        }
        const lastPos = lastPositionByPlayerId.get(playerId);
        if (!lastPos) {
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        const dx = currentPos.x - lastPos.x;
        const dy = currentPos.y - lastPos.y;
        const dz = currentPos.z - lastPos.z;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distanceMoved > IDLE_DISTANCE_THRESHOLD) {
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        const idleTime = currentTime - lastPos.time;
        if (idleTime >= IDLE_THRESHOLD_SECONDS) {
            return true;
        }
        return false;
    }
    function applyNudge(player: mod.Player, _targetObj: Objective, _currentTime: number): boolean {
        try {
            mod.AIBattlefieldBehavior(player);
            const playerId = getPlayerId(player);
            if (playerId >= 0) {
                lastPositionByPlayerId.delete(playerId);
            }
            return true;
        } catch (e) {
            logError("[Director V8] Failed to nudge bot: " + e);
            return false;
        }
    }
    function getPlayerId(player: mod.Player): number {
        try {
            return mod.GetObjId(player);
        } catch (_e) {
            return -1;
        }
    }
    function getPlayerTeamId(player: mod.Player): number {
        try {
            const team = mod.GetTeam(player);
            return mod.GetObjId(team);
        } catch (_e) {
            return 0;
        }
    }
    function isAISoldier(player: mod.Player): boolean {
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (_e) {
            return false;
        }
    }
    function isAlive(player: mod.Player): boolean {
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
        } catch (_e) {
            return false;
        }
    }
    function isInVehicle(player: mod.Player): boolean {
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle);
        } catch (_e) {
            return false;
        }
    }
    function getPlayerPosition(player: mod.Player): { x: number; y: number; z: number } | null {
        try {
            const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            return {
                x: mod.XComponentOf(pos),
                y: mod.YComponentOf(pos),
                z: mod.ZComponentOf(pos)
            };
        } catch (_e) {
            return null;
        }
    }
    function createPos(x: number, y: number, z: number): mod.Vector {
        return mod.CreateVector(x, y, z);
    }
    export function Director_Reset(): void {
        initialized = false;
        lastNudgeTime = 0;
        lastNudgeByPlayerId.clear();
        lastPositionByPlayerId.clear();
        log("[Director V8] Reset");
    }
}


// Module: modules/VehicleDirectorModule.ts
namespace ConquestV8 {
    let vehicleModuleInitialized = false;
    let vehicleSpawnersConfigured = false;
    let spawnerVerifyTime = -9999;
    function verifySpawnerSettings(): void {
        const t = now(true);
        if (t - spawnerVerifyTime < 10.0) return; // Check every 10 seconds
        spawnerVerifyTime = t;
        log("[ConquestV10][VehicleDirector] Verifying spawners exist...");
        let okCount = 0;
        let problemCount = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) {
                    log(`[ConquestV10][VehicleDirector] VERIFY: Spawner ${spawnerId} is null`);
                    problemCount++;
                } else {
                    okCount++;
                }
            } catch (e) {
                log(`[ConquestV10][VehicleDirector] VERIFY ERROR: Spawner ${spawnerId}: ${e}`);
                problemCount++;
            }
        }
        log(`[ConquestV10][VehicleDirector] Spawner verification: ${okCount} OK, ${problemCount} problems`);
    }
    let lastVehicleCheckTime = -9999;
    let lastSkyJetCheckTime = -9999;
    let unlockSweepDone = false;
    let lastGroundInitSweepTime = -9999;
    let lastSpawnerInitSweepTime = -9999;
    let groundSpawnerSpawnDone = false;
    const lastSkyJetSpawnAttemptByTeam: { [teamId: number]: number } = { 1: -9999, 2: -9999 };
    const nextSkyJetSpawnerIndex: { [teamId: number]: number } = { 1: 0, 2: 0 };
    const recentlyProcessedVehicles: Map<number, number> = new Map();
    const VEHICLE_COOLDOWN_SECONDS = 10.0;
    const lastSeatDebugByVehicleId: Map<number, number> = new Map();
    const vehicleTeamCacheByVehicleId: Map<number, number> = new Map();
    const lastJetBehaviorByPilotId: Map<number, number> = new Map();
    const jetPilotsWithBehavior: Set<number> = new Set();
    const GROUND_VEHICLE_SPAWNER_IDS = [
        202, 203, 204, 207, 208, 238, 242, 252, 253,
        209, 211, 215, 234, 239, 241, 247, 248, 249
    ];
    const TEAM1_GROUND_VEHICLE_SPAWNER_IDS = [202, 203, 204, 207, 208, 238, 242, 252, 253];
    const TEAM2_GROUND_VEHICLE_SPAWNER_IDS = [209, 211, 215, 234, 239, 241, 247, 248, 249];
    const SKY_JET_SPAWNER_IDS = [232, 243, 233, 244];
    const TEAM1_SKY_JET_SPAWNERS = [232, 243];  // F22, F16
    const TEAM2_SKY_JET_SPAWNERS = [233, 244];  // JAS39, SU57
    const ALL_VEHICLE_SPAWNER_IDS = [...GROUND_VEHICLE_SPAWNER_IDS, ...SKY_JET_SPAWNER_IDS];
    const vehicleSpawnerPositions: mod.Vector[] = [];
    const vehicleSpawnerPositionsByTeam: { pos: mod.Vector; teamId: number }[] = [];
    let vehicleSpawnerPositionsCached = false;
    const USE_MAP_ABANDONMENT_SETTINGS = true; // Set to false to override with script values
    const SCRIPT_ABANDON_TIME = 30.0;   // Only used if USE_MAP_ABANDONMENT_SETTINGS=false
    const SCRIPT_ABANDON_RADIUS = 50.0; // Only used if USE_MAP_ABANDONMENT_SETTINGS=false
    function configureVehicleSpawners(): void {
        if (vehicleSpawnersConfigured) return;
        vehicleSpawnersConfigured = true;
        log("[ConquestV10][VehicleDirector] Configuring vehicle spawner settings (preserving map abandonment)...");
        let successCount = 0;
        let failCount = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            safeCall(`ConfigureSpawner_${spawnerId}`, () => {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) {
                    log(`[ConquestV10][VehicleDirector] Spawner ${spawnerId} not found`);
                    failCount++;
                    return;
                }
                const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
                if (spawnerPos) {
                    vehicleSpawnerPositions.push(spawnerPos);
                    let teamId = 0;
                    if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 1;
                    else if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 2;
                    if (teamId) vehicleSpawnerPositionsByTeam.push({ pos: spawnerPos, teamId });
                }
                const isSkyJet = SKY_JET_SPAWNER_IDS.includes(spawnerId);
                if (isSkyJet) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                } else if (!PRESERVE_MAP_GROUND_AUTOSPAWN) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                }
                if (USE_MAP_ABANDONMENT_SETTINGS) {
                    if (isSkyJet) {
                        log(`[ConquestV10][VehicleDirector] Sky jet spawner ${spawnerId} - auto-spawn DISABLED, map abandonment preserved`);
                    } else if (PRESERVE_MAP_GROUND_AUTOSPAWN) {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn PRESERVED (map), map abandonment preserved`);
                    } else {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn DISABLED (script), map abandonment preserved`);
                    }
                } else {
                    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, SCRIPT_ABANDON_TIME);
                    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
                    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
                    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, SCRIPT_ABANDON_RADIUS);
                    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, SCRIPT_ABANDON_RADIUS);
                    log(`[ConquestV10][VehicleDirector] Spawner ${spawnerId} - script override: abandon=${SCRIPT_ABANDON_TIME}s, damage=true`);
                }
                successCount++;
            });
        }
        vehicleSpawnerPositionsCached = true;
        log(`[ConquestV10][VehicleDirector] Vehicle spawners configured: ${successCount} success, ${failCount} failed`);
    }
    function ensureVehicleSpawnerPositions(): void {
        if (vehicleSpawnerPositionsCached && vehicleSpawnerPositions.length > 0) return;
        vehicleSpawnerPositions.length = 0;
        vehicleSpawnerPositionsByTeam.length = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) continue;
                const pos = getObjectPos(spawner as unknown as mod.Object);
                if (pos) {
                    vehicleSpawnerPositions.push(pos);
                    let teamId = 0;
                    if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 1;
                    else if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 2;
                    if (teamId) vehicleSpawnerPositionsByTeam.push({ pos, teamId });
                }
            } catch (_e) {
            }
        }
        vehicleSpawnerPositionsCached = true;
    }
    function isNearAnyVehicleSpawner(position: mod.Vector, radiusMeters: number): boolean {
        for (const spawnerPos of vehicleSpawnerPositions) {
            if (distance3D(position, spawnerPos) <= radiusMeters) return true;
        }
        return false;
    }
    export function isPositionNearVehicleSpawner(position: mod.Vector, radiusMeters: number): boolean {
        ensureVehicleSpawnerPositions();
        return isNearAnyVehicleSpawner(position, radiusMeters);
    }
    export function getVehicleSpawnerPositions(): mod.Vector[] {
        ensureVehicleSpawnerPositions();
        return [...vehicleSpawnerPositions];
    }
    export function getVehicleSpawnerPositionsForTeam(teamId: number): mod.Vector[] {
        ensureVehicleSpawnerPositions();
        return vehicleSpawnerPositionsByTeam
            .filter((entry) => entry.teamId === teamId)
            .map((entry) => entry.pos);
    }
    export function initVehicleDirector(): void {
        vehicleModuleInitialized = true;
        vehicleSpawnersConfigured = false;
        lastVehicleCheckTime = -9999;
        lastSkyJetCheckTime = -9999;
        lastSkyJetSpawnAttemptByTeam[1] = -9999;
        lastSkyJetSpawnAttemptByTeam[2] = -9999;
        recentlyProcessedVehicles.clear();
        lastJetBehaviorByPilotId.clear();
        jetPilotsWithBehavior.clear();
        configureVehicleSpawners();
        log("[ConquestV10][VehicleDirector] Initialized (v2 - reduced spam + abandonment config)");
    }
    function shouldRefreshJetBehavior(pilotId: number, nowTime: number): boolean {
        const last = lastJetBehaviorByPilotId.get(pilotId) ?? -9999;
        return nowTime - last >= SKY_JET_BEHAVIOR_REFRESH_SECONDS;
    }
    function markJetBehaviorApplied(pilotId: number, nowTime: number): void {
        lastJetBehaviorByPilotId.set(pilotId, nowTime);
    }
    function cleanupJetBehaviorCache(): void {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            const count = mod.CountOf(allPlayers);
            const activeIds = new Set<number>();
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                try {
                    if (!hasSoldier(p)) continue;
                    if (!isAlive(p)) continue;
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (!inVehicle) continue;
                    activeIds.add(mod.GetObjId(p));
                } catch (_e) {
                }
            }
            for (const pid of lastJetBehaviorByPilotId.keys()) {
                if (!activeIds.has(pid)) {
                    lastJetBehaviorByPilotId.delete(pid);
                }
            }
        } catch (_e) {
        }
    }
    function getSkyJetVehicleTypeForSpawner(spawnerId: number): mod.VehicleList {
        switch (spawnerId) {
            case 232: return mod.VehicleList.F22;     // Team 1 F22
            case 243: return mod.VehicleList.F16;     // Team 1 F16
            case 233: return mod.VehicleList.JAS39;   // Team 2 JAS39
            case 244: return mod.VehicleList.SU57;    // Team 2 SU57
            default:  return mod.VehicleList.F16;     // Fallback
        }
    }
    function getSkyJetVehicleTypeForTeam(teamId: number): mod.VehicleList {
        return teamId === 1 ? mod.VehicleList.F16 : mod.VehicleList.SU57;
    }
    function getSkyJetSpawnerIdForTeam(teamId: number): number {
        const spawners = teamId === 1 ? TEAM1_SKY_JET_SPAWNERS : TEAM2_SKY_JET_SPAWNERS;
        const idx = nextSkyJetSpawnerIndex[teamId] || 0;
        const spawnerId = spawners[idx];
        nextSkyJetSpawnerIndex[teamId] = (idx + 1) % spawners.length;
        return spawnerId;
    }
    function getObjectPos(obj: mod.Object): mod.Vector | null {
        try {
            return mod.GetObjectPosition(obj);
        } catch (_e) {
            return null;
        }
    }
    function getHQPositionForTeam(teamId: number): mod.Vector | null {
        const aiSpawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        for (const spawnerId of aiSpawnerIds) {
            try {
                const spawner = mod.GetSpawner(spawnerId);
                if (spawner) {
                    const pos = getObjectPos(spawner as unknown as mod.Object);
                    if (pos) return pos;
                }
            } catch (_e) {
            }
        }
        return null;
    }
    function findNearestVehicleOfTypeNear(type: mod.VehicleList, near: mod.Vector, maxDist: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            let best: mod.Vehicle | null = null;
            let bestDist = 1e30;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) {
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const d = distance3D(vPos, near);
                if (d <= maxDist && d < bestDist) {
                    best = v;
                    bestDist = d;
                }
            }
            return best;
        } catch (_e) {
            return null;
        }
    }
    function countOccupiedVehiclesOfTypeForTeam(type: mod.VehicleList, teamId: number): number {
        let countOccupied = 0;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return 0;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) {
                    continue;
                }
                try {
                    if (!mod.IsVehicleOccupied(v)) continue;
                } catch (_e) {
                    continue;
                }
                    const vTeamId = getVehicleTeamIdSafe(v);
                    if (vTeamId === teamId) {
                        countOccupied++;
                    }
            }
        } catch (_e) {
        }
        return countOccupied;
    }
    function pickJetPilot(teamId: number, _spawnerPos: mod.Vector): mod.Player | null {
        const hqPos = getHQPositionForTeam(teamId);
        if (!hqPos) {
            if (DEBUG_SKY_JETS) {
                log(`[SkyJets] Could not get HQ position for team ${teamId}`);
            }
            return null;
        }
        const candidates = getNearbyBotsOnFoot(teamId, hqPos, JET_PILOT_PICKUP_RADIUS_METERS);
        if (candidates.length > 0) {
            if (DEBUG_SKY_JETS) {
                log(`[SkyJets] Found pilot near HQ for team ${teamId}`);
            }
            return candidates[0];
        }
        if (ENABLE_HQ_JET_SEED_TELEPORT) {
            const anyBot = pickAnyBotOnFoot(teamId);
            if (anyBot) {
                if (DEBUG_SKY_JETS) {
                    log(`[SkyJets] Using fallback: picked bot from anywhere for team ${teamId}`);
                }
                return anyBot;
            }
        }
        if (DEBUG_SKY_JETS) {
            log(`[SkyJets] No pilot candidates for team ${teamId} (HQ radius=${JET_PILOT_PICKUP_RADIUS_METERS}m, fallback=${ENABLE_HQ_JET_SEED_TELEPORT})`);
        }
        return null;
    }
    function findAnyAIOccupantInVehicle(vehicle: mod.Vehicle, teamId: number): mod.Player | null {
        try {
            const vId = mod.GetObjId(vehicle);
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (getPlayerTeamId(p) !== teamId) continue;
                if (!hasSoldier(p)) continue;
                if (!isAlive(p)) continue;  // Dead/ManDown players cause InvalidValue
                let inVehicle = false;
                try {
                    inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                } catch (_e) {
                    inVehicle = false;
                }
                if (!inVehicle) continue;
                try {
                    const pv = mod.GetVehicleFromPlayer(p);
                    if (!pv) continue;
                    if (mod.GetObjId(pv) !== vId) continue;
                    return p;
                } catch (_e) {
                }
            }
        } catch (_e) {
        }
        return null;
    }
    function applyJetPilotBehavior(pilot: mod.Player, teamId: number, spawnerId: number): void {
        const applyIfStillInVehicle = (): void => {
            if (!pilot) return;
            if (!hasSoldier(pilot)) return;
            if (!isAlive(pilot)) return;
            try {
                const v = mod.GetVehicleFromPlayer(pilot);
                if (!v) return;
            } catch (_e) {
                return;
            }
            if (DEBUG_SKY_JETS) {
                logDebugKey(
                    `SkyJets:Behavior:T${teamId}`,
                    `[ConquestV10][SkyJets] Apply behavior: team=${teamId} spawner=${spawnerId} pilotObjId=${mod.GetObjId(pilot)}`,
                    2.0
                );
            }
        };
        void (async () => {
            await mod.Wait(0.05);
            applyIfStillInVehicle();
            await mod.Wait(0.20);
            applyIfStillInVehicle();
            await mod.Wait(0.75);
            applyIfStillInVehicle();
        })();
    }
    function tickSkyJets(): void {
        if (!ENABLE_AI_SKY_JETS) return;
        const t = now(true);
        if (t - lastSkyJetCheckTime < AI_SKY_JET_CHECK_INTERVAL_SECONDS) return;
        lastSkyJetCheckTime = t;
        for (const teamId of [1, 2]) {
            const spawnerId = getSkyJetSpawnerIdForTeam(teamId);
            const spawner = mod.GetVehicleSpawner(spawnerId);
            if (!spawner) continue;
            const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
            if (!spawnerPos) continue;
            const type = getSkyJetVehicleTypeForSpawner(spawnerId);
            const existing = findNearestVehicleOfTypeNear(type, spawnerPos, 2500.0);
            if (existing) {
                const pilotInJet = findAnyAIOccupantInVehicle(existing, teamId);
                if (pilotInJet) {
                    const pilotId = mod.GetObjId(pilotInJet);
                    if (!jetPilotsWithBehavior.has(pilotId)) {
                        applyJetPilotBehavior(pilotInJet, teamId, spawnerId);
                        jetPilotsWithBehavior.add(pilotId);
                    }
                }
                let occupied = false;
                try {
                    occupied = mod.IsVehicleOccupied(existing);
                } catch (_e) {
                    occupied = true;
                }
                if (!occupied) {
                    const pilot = pickJetPilot(teamId, spawnerPos);
                    if (pilot) {
                        trySeatBotQuick(pilot, existing, -1);
                        trySeatBotQuick(pilot, existing, 0);
                        if (DEBUG_SKY_JETS) {
                            logDebugKey(
                                `SkyJets:SeatExisting:T${teamId}`,
                                `[ConquestV10][SkyJets] Seat existing jet: team=${teamId} spawner=${spawnerId} pilotObjId=${mod.GetObjId(pilot)}`,
                                2.0
                            );
                        }
                        const pilotId = mod.GetObjId(pilot);
                        if (!jetPilotsWithBehavior.has(pilotId)) {
                            applyJetPilotBehavior(pilot, teamId, spawnerId);
                            jetPilotsWithBehavior.add(pilotId);
                        }
                    }
                }
                continue;
            }
            if (countOccupiedVehiclesOfTypeForTeam(type, teamId) >= 1) {
                continue;
            }
            if (t - (lastSkyJetSpawnAttemptByTeam[teamId] ?? -9999) < AI_SKY_JET_SPAWN_COOLDOWN_SECONDS) {
                continue;
            }
            lastSkyJetSpawnAttemptByTeam[teamId] = t;
            const pilot = pickJetPilot(teamId, spawnerPos);
            if (!pilot) {
                if (DEBUG_SKY_JETS) {
                    logDebugKey(
                        `SkyJets:NoPilot:T${teamId}`,
                        `[ConquestV10][SkyJets] No pilot available for team=${teamId} spawner=${spawnerId}`,
                        4.0
                    );
                }
                continue;
            }
            if (DEBUG_SKY_JETS) {
                logDebugKey(
                    `SkyJets:SpawnAttempt:T${teamId}`,
                    `[ConquestV10][SkyJets] Spawn attempt: team=${teamId} spawner=${spawnerId} pilotObjId=${mod.GetObjId(pilot)}`,
                    2.0
                );
            }
            try {
                mod.ForceVehicleSpawnerSpawn(spawner);
            } catch (_e) {
                continue;
            }
            void (async () => {
                for (let attempt = 0; attempt < 6; attempt++) {
                    await mod.Wait(0.05);
                    const v = findNearestVehicleOfTypeNear(type, spawnerPos, 2500.0);
                    if (!v) continue;
                    trySeatBotQuick(pilot, v, -1);
                    trySeatBotQuick(pilot, v, 0);
                    if (DEBUG_SKY_JETS) {
                        logDebugKey(
                            `SkyJets:SeatNew:T${teamId}`,
                            `[ConquestV10][SkyJets] Seat new jet: team=${teamId} spawner=${spawnerId} attempt=${attempt + 1} pilotObjId=${mod.GetObjId(pilot)}`,
                            1.0
                        );
                    }
                    applyJetPilotBehavior(pilot, teamId, spawnerId);
                    break;
                }
            })();
        }
    }
    export function VehicleDirector_OnVehicleSpawned(vehicle: mod.Vehicle): void {
        if (!vehicle) return;
        if (!ENABLE_AI_SKY_JETS) return;
        let isJet = false;
        try {
            isJet =
                mod.CompareVehicleName(vehicle, mod.VehicleList.F22) ||
                mod.CompareVehicleName(vehicle, mod.VehicleList.F16) ||
                mod.CompareVehicleName(vehicle, mod.VehicleList.JAS39) ||
                mod.CompareVehicleName(vehicle, mod.VehicleList.SU57);
        } catch (_e) {
            isJet = false;
        }
        if (!isJet) return;
        const vPos = getVehiclePos(vehicle);
        if (!vPos) return;
        let closestSpawnerId = -1;
        let closestSpawnerPos: mod.Vector | null = null;
        let closestDist = 1e30;
        for (const spawnerId of SKY_JET_SPAWNER_IDS) {
            let spawner: mod.VehicleSpawner | null = null;
            try {
                spawner = mod.GetVehicleSpawner(spawnerId);
            } catch (_e) {
                spawner = null;
            }
            if (!spawner) continue;
            const pos = getObjectPos(spawner as unknown as mod.Object);
            if (!pos) continue;
            const dist = distance3D(vPos, pos);
            if (dist < closestDist) {
                closestDist = dist;
                closestSpawnerId = spawnerId;
                closestSpawnerPos = pos;
            }
        }
        if (!closestSpawnerPos || closestDist > 600.0) return;
        const teamId = getSpawnerTeamId(closestSpawnerId);
        if (teamId !== 1 && teamId !== 2) return;
        let pilot = pickJetPilot(teamId, closestSpawnerPos);
        if (!pilot && ENABLE_HQ_JET_SEED_TELEPORT) {
            pilot = pickAnyBotOnFoot(teamId);
        }
        if (!pilot) return;
        teleportBotNearPosition(pilot, vPos, "SkyJetSpawned");
        safeCall("SkyJets:SpawnedBehavior", () => mod.AIBattlefieldBehavior(pilot));
        void (async () => {
            for (let attempt = 0; attempt < 12; attempt++) {
                if (trySeatBot(pilot, vehicle, 0)) {
                    const pilotId = mod.GetObjId(pilot);
                    applyJetPilotBehavior(pilot, teamId, closestSpawnerId);
                    markJetBehaviorApplied(pilotId, now(true));
                    registerAircraftPilot(vehicle, pilot);
                    break;
                }
                await mod.Wait(0.1);
            }
        })();
    }
    function ensureVehicleInit(): void {
        if (!vehicleModuleInitialized) {
            initVehicleDirector();
        }
    }
    export function VehicleDirector_PreRoundTick(): void {
        ensureVehicleInit();
        safeCall("VehicleDirector:GroundSpawnerSpawn", () => runGroundSpawnerAutoSpawnOnce());
    }
    function getSoldierPos(p: mod.Player): mod.Vector | null {
        try {
            if (!isAlive(p)) return null;
            return mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
        } catch (_e) {
            return null;
        }
    }
    function pickAnyBotOnFoot(teamId: number): mod.Player | null {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return null;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                try {
                    const pTeam = mod.GetTeam(p);
                    if (!pTeam || mod.GetObjId(pTeam) !== teamId) continue;
                } catch (_e) {
                    continue;
                }
                if (!isAlive(p)) continue;
                const vehicle = getVehicleFromPlayerSafe(p);
                if (vehicle) continue;
                return p;
            }
        } catch (_e) {
        }
        return null;
    }
    function pickNearestBotOnFootToPosition(pos: mod.Vector, maxDistance: number = 150): mod.Player | null {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return null;
            let nearestBot: mod.Player | null = null;
            let nearestDist = maxDistance;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (!isAlive(p)) continue;
                const vehicle = getVehicleFromPlayerSafe(p);
                if (vehicle) continue; // skip bots already in vehicles
                try {
                    const soldierPos = mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
                    if (!soldierPos) continue;
                    const dx = mod.XComponentOf(pos) - mod.XComponentOf(soldierPos);
                    const dy = mod.YComponentOf(pos) - mod.YComponentOf(soldierPos);
                    const dz = mod.ZComponentOf(pos) - mod.ZComponentOf(soldierPos);
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestBot = p;
                    }
                } catch (_e) {
                    continue;
                }
            }
            return nearestBot;
        } catch (_e) {
        }
        return null;
    }
    function getVehiclePos(v: mod.Vehicle): mod.Vector | null {
        try {
            return mod.GetVehicleState(v, mod.VehicleStateVector.VehiclePosition);
        } catch (_e) {
            return null;
        }
    }
    function distance3D(a: mod.Vector, b: mod.Vector): number {
        const dx = mod.XComponentOf(a) - mod.XComponentOf(b);
        const dy = mod.YComponentOf(a) - mod.YComponentOf(b);
        const dz = mod.ZComponentOf(a) - mod.ZComponentOf(b);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    function getVehicleFromPlayerSafe(p: mod.Player): mod.Vehicle | null {
        if (!p) return null;
        if (!hasSoldier(p)) return null;
        if (!isAlive(p)) return null;  // Dead/ManDown players cause InvalidValue
        try {
            const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
            if (!inVehicle) return null;
        } catch (_e) {
            return null;
        }
        try {
            const v = mod.GetVehicleFromPlayer(p);
            return v ?? null;
        } catch (_e) {
            return null;
        }
    }
    function isAlive(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsAlive) === true;
        } catch (_e) {
            return false;
        }
    }
    function safeGetVehicleObjId(v: mod.Vehicle): number {
        try {
            return mod.GetObjId(v);
        } catch (_e) {
            return -1;
        }
    }
    function getVehicleTeamId(v: mod.Vehicle): number {
        const vId = safeGetVehicleObjId(v);
        if (vId <= 0) return 0;
        try {
            const team = mod.GetVehicleTeam(v);
            const tid = team ? mod.GetObjId(team) : 0;
            if (tid === 1 || tid === 2) {
                vehicleTeamCacheByVehicleId.set(vId, tid);
                return tid;
            }
            return 0;
        } catch (_e) {
            return 0;
        }
    }
    function getVehicleTeamIdSafe(v: mod.Vehicle): number {
        const vId = safeGetVehicleObjId(v);
        if (vId <= 0) return 0;
        try {
            const team = mod.GetVehicleTeam(v);
            const tid = team ? mod.GetObjId(team) : 0;
            if (tid === 1 || tid === 2) {
                vehicleTeamCacheByVehicleId.set(vId, tid);
            }
            return tid;
        } catch (_e) {
            return 0;
        }
    }
    function getNearbyBotsOnFoot(teamId: number, position: mod.Vector, maxDist: number): mod.Player[] {
        const result: mod.Player[] = [];
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return result;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (!hasSoldier(p)) continue; // Must have spawned soldier before vehicle check
                if (!isAlive(p)) continue;
                const pTeam = getPlayerTeamId(p);
                if (pTeam !== teamId) continue;
                try {
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (inVehicle) continue; // Already in a vehicle
                } catch (_e) {
                }
                const pPos = getSoldierPos(p);
                if (!pPos) continue;
                const dist = distance3D(pPos, position);
                if (dist <= maxDist) {
                    result.push(p);
                }
            }
        } catch (_e) {
        }
        return result;
    }
    function resolveTeamIdFromSpawner(position: mod.Vector | null, maxDistance: number): number {
        if (!position) return 0;
        let bestTeam = 0;
        let bestDist = 1e30;
        for (const entry of vehicleSpawnerPositionsByTeam) {
            const dist = distance3D(position, entry.pos);
            if (dist < bestDist) {
                bestDist = dist;
                bestTeam = entry.teamId;
            }
        }
        if (bestDist <= maxDistance) return bestTeam;
        return 0;
    }
    function trySeatBot(bot: mod.Player, vehicle: mod.Vehicle, seatIndex: number): boolean {
        const vId = safeGetVehicleObjId(vehicle);
        if (vId <= 0) return false;
        let seatOccupiedBefore = false;
        try {
            seatOccupiedBefore = mod.IsVehicleSeatOccupied(vehicle, seatIndex);
        } catch (_e) {
            seatOccupiedBefore = false;
        }
        maybeTeleportBotNearVehicle(bot, vehicle);
        const ok = safeForcePlayerToSeat(bot, vehicle, seatIndex);
        if (!ok) {
            logSeatDebug(vehicle, seatIndex, bot, false, "ForceFail", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, false));
            return false;
        }
        const seatedVehicle = safeGetVehicleFromPlayer(bot);
        if (!seatedVehicle) {
            const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
            logSeatDebug(vehicle, seatIndex, bot, false, "NoSeatedVehicle", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
            return false;
        }
        try {
            if (mod.GetObjId(seatedVehicle) !== mod.GetObjId(vehicle)) {
                const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
                logSeatDebug(vehicle, seatIndex, bot, false, "Mismatch", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
                return false;
            }
        } catch (_e) {
            const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
            logSeatDebug(vehicle, seatIndex, bot, false, "ObjIdError", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
            return false;
        }
        const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
        logSeatDebug(vehicle, seatIndex, bot, true, "Seated", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
        return true;
    }
    function trySeatBotQuick(bot: mod.Player, vehicle: mod.Vehicle, seatIndex: number): boolean {
        try {
            mod.ForcePlayerToSeat(bot, vehicle, seatIndex);
            return true;
        } catch (_e) {
            return false;
        }
    }
    function logSeatDebug(
        vehicle: mod.Vehicle,
        seatIndex: number,
        bot: mod.Player,
        ok: boolean,
        reason: string,
        detail: string = ""
    ): void {
        if (!ENABLE_VEHICLE_SEAT_DEBUG) return;
        let vId = -1;
        let bId = -1;
        try {
            vId = mod.GetObjId(vehicle);
        } catch (_e) {
        }
        if (vId <= 0) return;
        try {
            bId = mod.GetObjId(bot);
        } catch (_e) {
        }
        const t = mod.GetMatchTimeElapsed();
        const last = lastSeatDebugByVehicleId.get(vId) ?? -9999;
        if (t - last < VEHICLE_SEAT_DEBUG_INTERVAL_SECONDS) return;
        lastSeatDebugByVehicleId.set(vId, t);
        const extra = detail ? ` ${detail}` : "";
        console.log(`[VehicleSeatDebug] v=${vId} seat=${seatIndex} bot=${bId} ok=${ok} reason=${reason}${extra}`);
    }
    function safeIsVehicleSeatOccupied(vehicle: mod.Vehicle, seatIndex: number): boolean {
        try {
            return mod.IsVehicleSeatOccupied(vehicle, seatIndex);
        } catch (_e) {
            return false;
        }
    }
    function buildSeatDebugDetail(
        vehicle: mod.Vehicle,
        bot: mod.Player,
        seatIndex: number,
        seatOccupiedBefore: boolean,
        seatOccupiedAfter: boolean
    ): string {
        const vType = getVehicleTypeLabel(vehicle);
        const vTeam = getVehicleTeamIdSafe(vehicle);
        const bTeam = getPlayerTeamIdSafe(bot);
        const botAlive = isAlive(bot);
        const botInVehicle = isInVehicleSafe(bot);
        const dist = getDistanceBotToVehicle(bot, vehicle);
        return `type=${vType} vTeam=${vTeam} bTeam=${bTeam} seatOccBefore=${seatOccupiedBefore} seatOccAfter=${seatOccupiedAfter} botAlive=${botAlive} botInVeh=${botInVehicle} dist=${dist.toFixed(1)}`;
    }
    function getVehicleTypeLabel(v: mod.Vehicle): string {
        try {
            if (mod.CompareVehicleName(v, mod.VehicleList.Abrams) || mod.CompareVehicleName(v, mod.VehicleList.Leopard)) return "Tank";
            if (mod.CompareVehicleName(v, mod.VehicleList.Vector) || mod.CompareVehicleName(v, mod.VehicleList.CV90)) return "IFV";
            if (mod.CompareVehicleName(v, mod.VehicleList.Cheetah) || mod.CompareVehicleName(v, mod.VehicleList.Gepard)) return "AA";
            if (mod.CompareVehicleName(v, mod.VehicleList.Flyer60) || mod.CompareVehicleName(v, mod.VehicleList.Marauder)) return "Flyer";
            if (mod.CompareVehicleName(v, mod.VehicleList.UH60) || mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax)) return "UH60";
            if (mod.CompareVehicleName(v, mod.VehicleList.AH64) || mod.CompareVehicleName(v, mod.VehicleList.Eurocopter)) return "Heli";
            if (mod.CompareVehicleName(v, mod.VehicleList.F16) || mod.CompareVehicleName(v, mod.VehicleList.F22) || mod.CompareVehicleName(v, mod.VehicleList.JAS39) || mod.CompareVehicleName(v, mod.VehicleList.SU57)) return "Jet";
        } catch (_e) {
        }
        return "Other";
    }
    function getPlayerTeamIdSafe(p: mod.Player): number {
        try {
            const team = mod.GetTeam(p);
            return team ? mod.GetObjId(team) : 0;
        } catch (_e) {
            return 0;
        }
    }
    function isInVehicleSafe(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
        } catch (_e) {
            return false;
        }
    }
    function getDistanceBotToVehicle(bot: mod.Player, vehicle: mod.Vehicle): number {
        const bPos = getSoldierPos(bot);
        const vPos = getVehiclePos(vehicle);
        if (!bPos || !vPos) return 99999;
        return distance3D(bPos, vPos);
    }
    function maybeTeleportBotNearVehicle(bot: mod.Player, vehicle: mod.Vehicle): void {
        if (!ENABLE_SEAT_TELEPORT_ASSIST) return;
        const vPos = getVehiclePos(vehicle);
        const bPos = getSoldierPos(bot);
        if (!vPos || !bPos) return;
        const dist = distance3D(bPos, vPos);
        if (dist <= 8.0) return;
        if (dist > SEAT_TELEPORT_MAX_DISTANCE_METERS) return;
        const x = mod.XComponentOf(vPos) + SEAT_TELEPORT_OFFSET_METERS;
        const y = mod.YComponentOf(vPos);
        const z = mod.ZComponentOf(vPos) + SEAT_TELEPORT_OFFSET_METERS;
        const dst = createPos(x, y, z);
        safeCall("SeatTeleport", () => mod.Teleport(bot, dst, 0));
    }
    function teleportBotNearPosition(bot: mod.Player, pos: mod.Vector, context: string): void {
        if (!ENABLE_SEAT_TELEPORT_ASSIST) return;
        const x = mod.XComponentOf(pos) + SEAT_TELEPORT_OFFSET_METERS;
        const y = mod.YComponentOf(pos);
        const z = mod.ZComponentOf(pos) + SEAT_TELEPORT_OFFSET_METERS;
        const dst = createPos(x, y, z);
        safeCall(`SeatTeleport:${context}`, () => mod.Teleport(bot, dst, 0));
    }
    function findNearestVehicleNear(position: mod.Vector, maxDist: number): mod.Vehicle | null {
        let best: mod.Vehicle | null = null;
        let bestDist = maxDist;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const dist = distance3D(position, vPos);
                if (dist <= bestDist) {
                    bestDist = dist;
                    best = v;
                }
            }
        } catch (_e) {
        }
        return best;
    }
    function getSpawnerTeamId(spawnerId: number): number {
        if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) return 1;
        if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) return 2;
        if (TEAM1_SKY_JET_SPAWNERS.includes(spawnerId)) return 1;
        if (TEAM2_SKY_JET_SPAWNERS.includes(spawnerId)) return 2;
        return 0;
    }
    export function tickVehicleDirector(): void {
        ensureVehicleInit();
        if (mod.GetMatchTimeElapsed() < VEHICLE_DIRECTOR_START_DELAY_SECONDS) return;
        safeCall("VehicleDirector:GroundSeatSweep", () => tickGroundVehicleSeatSweep());
        safeCall("VehicleDirector:GroundSpawnerSpawn", () => runGroundSpawnerAutoSpawnOnce());
        safeCall("VehicleDirector:GroundInitSweep", () => tickGroundVehicleInitSweep());
        safeCall("VehicleDirector:SpawnerInitSweep", () => tickSpawnerInitSweep());
        safeCall("VehicleDirector:VerifySpawners", () => verifySpawnerSettings());
        safeCall("VehicleDirector:SkyJets", () => tickSkyJets());
        if (!ENABLE_VEHICLE_SEAT_FILLING) return;
        const t = now(true);
        if (t - lastVehicleCheckTime < VEHICLE_CHECK_INTERVAL_SECONDS) return;
        lastVehicleCheckTime = t;
        for (const [vId, lastTime] of recentlyProcessedVehicles.entries()) {
            if (t - lastTime > VEHICLE_COOLDOWN_SECONDS) {
                recentlyProcessedVehicles.delete(vId);
            }
        }
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                const vId = mod.GetObjId(v);
                if (recentlyProcessedVehicles.has(vId)) continue;
                let occupied = false;
                try {
                    occupied = mod.IsVehicleOccupied(v);
                } catch (_e) {
                    occupied = false;
                }
                if (!occupied) continue;
                const teamId = getVehicleTeamId(v);
                if (teamId !== 1 && teamId !== 2) continue;
                try {
                    const driver = mod.GetPlayerFromVehicleSeat(v, 0);
                    if (driver && !isAISoldier(driver)) {
                        continue;
                    }
                } catch (_e) {
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const nearbyBots = getNearbyBotsOnFoot(teamId, vPos, VEHICLE_SEAT_FILL_RANGE_METERS);
                if (nearbyBots.length === 0) continue;
                recentlyProcessedVehicles.set(vId, t);
                let seatedCount = 0;
                const maxSeatsToTry = Math.min(3, nearbyBots.length);
                for (let seat = 1; seat <= 3 && seatedCount < maxSeatsToTry; seat++) {
                    const bot = nearbyBots[seatedCount];
                    if (trySeatBot(bot, v, seat)) {
                        safeCall("VehicleDirector:GunnerSeat:Behavior", () => mod.AIBattlefieldBehavior(bot));
                        safeCall("VehicleDirector:GunnerSeat:EnableTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("VehicleDirector:GunnerSeat:EnableShooting", () => mod.AIEnableShooting(bot, true));
                        seatedCount++;
                        log(`[VehicleDirector] Seated bot in vehicle ${vId} seat ${seat}`);
                    }
                }
            }
        } catch (_e) {
        }
    }
    let lastGroundSweepTime = -9999;
    const GROUND_SWEEP_INTERVAL = 30.0; // seconds - matches vehicle respawn timer
    const GROUND_SWEEP_START_DELAY = 15.0; // wait for bots to spawn first
    const GROUND_SWEEP_MAX_PER_TICK = 3; // max vehicles per sweep to avoid lag
    function tickGroundVehicleSeatSweep(): void {
        if (!ENABLE_VEHICLE_UNLOCK_ONCE) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow < GROUND_SWEEP_START_DELAY) return;
        if (timeNow - lastGroundSweepTime < GROUND_SWEEP_INTERVAL) return;
        lastGroundSweepTime = timeNow;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            let occupiedGround = 0;
            let emptyGround = 0;
            let seatedThisSweep = 0;
            const emptyNames: string[] = [];
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                let isAircraft = false;
                try {
                    isAircraft =
                        mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                        mod.CompareVehicleName(v, mod.VehicleList.Eurocopter) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F22) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F16) ||
                        mod.CompareVehicleName(v, mod.VehicleList.JAS39) ||
                        mod.CompareVehicleName(v, mod.VehicleList.SU57);
                } catch (_e) {
                    isAircraft = true;
                }
                if (isAircraft) continue;
                let isOccupied = false;
                try {
                    isOccupied = mod.IsVehicleOccupied(v);
                } catch (_e) {
                    isOccupied = true;
                }
                if (isOccupied) {
                    occupiedGround++;
                    continue;
                }
                emptyGround++;
                let name = "?";
                try {
                    if (mod.CompareVehicleName(v, mod.VehicleList.Abrams)) name = "Abrams";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Leopard)) name = "Leopard";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.M2Bradley)) name = "M2Bradley";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.CV90)) name = "CV90";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Cheetah)) name = "Cheetah";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Gepard)) name = "Gepard";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Marauder)) name = "Marauder";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Marauder_Pax)) name = "Marauder_Pax";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Vector)) name = "Vector";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Flyer60)) name = "Flyer60";
                } catch (_e) {}
                let teamStr = "?";
                try {
                    const team = mod.GetVehicleTeam(v);
                    if (!team) teamStr = "null";
                    else if (team === mod.GetTeam(1)) teamStr = "T1";
                    else if (team === mod.GetTeam(2)) teamStr = "T2";
                    else teamStr = "neutral";
                } catch (_e) { teamStr = "err"; }
                if (seatedThisSweep >= GROUND_SWEEP_MAX_PER_TICK) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                const bot = pickNearestBotOnFootToPosition(vPos, 9999.0);
                if (!bot) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                try { mod.ForcePlayerToSeat(bot, v, -1); } catch (_e) {}
                try { mod.ForcePlayerToSeat(bot, v, 0); } catch (_e) {}
                safeCall("GroundSweep:Behavior", () => mod.AIBattlefieldBehavior(bot));
                safeCall("GroundSweep:Targeting", () => mod.AIEnableTargeting(bot, true));
                safeCall("GroundSweep:Shooting", () => mod.AIEnableShooting(bot, true));
                const isTank = (name === "Abrams" || name === "Leopard");
                if (isTank) {
                    try { mod.SetVehicleMaxHealthMultiplier(v, 0.7); } catch (_e) {}
                }
                seatedThisSweep++;
                log(`[VehicleDirector] Seated bot in ${name}(${teamStr})${isTank ? " [health=0.7x]" : ""}`);
            }
            if (emptyGround > 0 || seatedThisSweep > 0) {
                log(`[VehicleDirector] Status: ${occupiedGround} occupied, ${emptyGround} empty, ${seatedThisSweep} seated`);
                if (emptyNames.length > 0) {
                    log(`[VehicleDirector] Still empty: ${emptyNames.join(", ")}`);
                }
            }
        } catch (_e) {
        }
    }
    function tickGroundVehicleInitSweep(): void {
        if (!ENABLE_GROUND_VEHICLE_INIT_SWEEP) return;
        const t = now(true);
        if (t - lastGroundInitSweepTime < GROUND_VEHICLE_INIT_INTERVAL_SECONDS) return;
        lastGroundInitSweepTime = t;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                let isAircraft = false;
                try {
                    isAircraft =
                        mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                        mod.CompareVehicleName(v, mod.VehicleList.Eurocopter) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F22) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F16) ||
                        mod.CompareVehicleName(v, mod.VehicleList.JAS39) ||
                        mod.CompareVehicleName(v, mod.VehicleList.SU57);
                } catch (_e) {
                    isAircraft = true;
                }
                if (isAircraft) continue;
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                if (!isPositionNearVehicleSpawner(vPos, 60.0)) continue;
                const teamId = resolveTeamIdFromSpawner(vPos, 120.0);
                if (teamId !== 1 && teamId !== 2) continue;
                let driverOccupied = false;
                try {
                    driverOccupied = mod.IsVehicleSeatOccupied(v, 0);
                } catch (_e) {
                    driverOccupied = true;
                }
                if (driverOccupied) continue;
                const bot = pickAnyBotOnFoot(teamId);
                if (!bot) continue;
                teleportBotNearPosition(bot, vPos, "GroundInit");
                if (trySeatBot(bot, v, 0)) {
                    if (ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR) {
                        safeCall("VehicleDirector:InitBehavior", () => mod.AIBattlefieldBehavior(bot));
                        safeCall("VehicleDirector:InitTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("VehicleDirector:InitShooting", () => mod.AIEnableShooting(bot, true));
                    }
                    const vehicleCopy = v;
                    const botCopy = bot;
                    void (async () => {
                        await mod.Wait(0.25);
                        safeCall("VehicleDirector:InitExitPlayerVehicle", () => mod.ForcePlayerExitVehicle(botCopy, vehicleCopy));
                        safeCall("VehicleDirector:InitExitPlayer", () => mod.ForcePlayerExitVehicle(botCopy));
                        safeCall("VehicleDirector:InitExitVehicle", () => mod.ForcePlayerExitVehicle(vehicleCopy));
                    })();
                }
            }
        } catch (_e) {
        }
    }
    function tickSpawnerInitSweep(): void {
        if (!ENABLE_SPAWNER_INIT_SWEEP) return;
        const t = now(true);
        if (t - lastSpawnerInitSweepTime < SPAWNER_INIT_INTERVAL_SECONDS) return;
        lastSpawnerInitSweepTime = t;
        const tryInitSpawner = (spawnerId: number, isJet: boolean): void => {
            let spawner: mod.VehicleSpawner | null = null;
            try {
                spawner = mod.GetVehicleSpawner(spawnerId);
            } catch (_e) {
                spawner = null;
            }
            if (!spawner) return;
            const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
            if (!spawnerPos) return;
            const near = findNearestVehicleNear(spawnerPos, SPAWNER_INIT_NEAR_DISTANCE_METERS);
            if (!near) {
                safeCall(`SpawnerInit:Spawn:${spawnerId}`, () => mod.ForceVehicleSpawnerSpawn(spawner as mod.VehicleSpawner));
            }
            const vehicle = near ?? findNearestVehicleNear(spawnerPos, SPAWNER_INIT_NEAR_DISTANCE_METERS);
            if (!vehicle) return;
            const teamId = getSpawnerTeamId(spawnerId);
            if (teamId !== 1 && teamId !== 2) return;
            const bot = pickAnyBotOnFoot(teamId);
            if (!bot) return;
            teleportBotNearPosition(bot, spawnerPos, isJet ? "SpawnerJetInit" : "SpawnerGroundInit");
            if (trySeatBot(bot, vehicle, 0)) {
                if (ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR) {
                    safeCall("VehicleDirector:SpawnerInitBehavior", () => mod.AIBattlefieldBehavior(bot));
                    safeCall("VehicleDirector:SpawnerInitTargeting", () => mod.AIEnableTargeting(bot, true));
                    safeCall("VehicleDirector:SpawnerInitShooting", () => mod.AIEnableShooting(bot, true));
                }
                const vehicleCopy = vehicle;
                const botCopy = bot;
                void (async () => {
                    await mod.Wait(0.25);
                    safeCall("VehicleDirector:SpawnerInitExitPlayerVehicle", () => mod.ForcePlayerExitVehicle(botCopy, vehicleCopy));
                    safeCall("VehicleDirector:SpawnerInitExitPlayer", () => mod.ForcePlayerExitVehicle(botCopy));
                    safeCall("VehicleDirector:SpawnerInitExitVehicle", () => mod.ForcePlayerExitVehicle(vehicleCopy));
                })();
            }
        };
        for (const spawnerId of GROUND_VEHICLE_SPAWNER_IDS) {
            tryInitSpawner(spawnerId, false);
        }
    }
    function runGroundSpawnerAutoSpawnOnce(): void {
        if (!ENABLE_SCRIPTED_GROUND_SPAWN) return;
        if (groundSpawnerSpawnDone) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow < GROUND_SPAWN_DELAY_SECONDS) return;
        groundSpawnerSpawnDone = true;
        for (const spawnerId of GROUND_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) continue;
                if (ENABLE_GROUND_AUTOSPAWN_AFTER_DELAY) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, true);
                }
                mod.ForceVehicleSpawnerSpawn(spawner);
            } catch (_e) {
            }
        }
    }
    function isVehicleEmpty(vehicle: mod.Vehicle): boolean {
        try {
            return !mod.IsVehicleOccupied(vehicle);
        } catch (_e) {
            return false;
        }
    }
    export function forceDestroyEmptyVehicle(vehicleType: mod.VehicleList, label: string): boolean {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return false;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                let isRightType = false;
                try {
                    isRightType = mod.CompareVehicleName(vehicle, vehicleType);
                } catch (_e) {
                    continue;
                }
                if (!isRightType) continue;
                if (isVehicleEmpty(vehicle)) {
                    const vehicleId = mod.GetObjId(vehicle);
                    log(`[VehicleDirector] Force destroying empty ${label} (${vehicleId}) due to spawn UI failure`);
                    try {
                        mod.DealDamage(vehicle, 99999);
                        return true;
                    } catch (e) {
                        log(`[VehicleDirector] Failed to force destroy: ${e}`);
                    }
                }
            }
        } catch (_e) {}
        return false;
    }
}


// Module: modules/AircraftCombatModule.ts
namespace ConquestV8 {
    let globalMode: AircraftMode = "Balanced";
    let nextModeSwitch = 0;
    const MODE_SWITCH_INTERVAL = 90;
    let pilots: Map<number, mod.Player> = new Map();
    let gunners: Map<number, mod.Player> = new Map();
    type AircraftMode = "Cinematic" | "Balanced" | "Aggressive";
    function isAircraft(v: mod.Vehicle): boolean {
        try {
            return (
                mod.CompareVehicleName(v, (mod.VehicleList as any).UH60) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).AH64) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).Eurocopter) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).F22) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).F16) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).JAS39) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).SU57)
            );
        } catch {
            return false;
        }
    }
    export function initAircraftCombat(): void {
        pilots.clear();
        gunners.clear();
        globalMode = "Balanced";
        nextModeSwitch = mod.GetMatchTimeElapsed() + MODE_SWITCH_INTERVAL;
        console.log("[AircraftCombat] Initialized");
    }
    export function tickAircraftCombat(): void {
        const now = mod.GetMatchTimeElapsed();
        if (now >= nextModeSwitch) {
            updateMode();
            nextModeSwitch = now + MODE_SWITCH_INTERVAL;
        }
        const deadPilots: number[] = [];
        for (const [vid, pilot] of pilots) {
            try {
                if (!pilot) {
                    deadPilots.push(vid);
                    continue;
                }
                if (!isAliveCheck(pilot)) {
                    deadPilots.push(vid);
                    continue;
                }
                const inVehicle = mod.GetSoldierState(pilot, mod.SoldierStateBool.IsInVehicle);
                if (!inVehicle) {
                    deadPilots.push(vid);
                    continue;
                }
                if (globalMode === "Aggressive") {
                    mod.AIBattlefieldBehavior(pilot);
                } else {
                    mod.AIBattlefieldBehavior(pilot);
                }
            } catch {
                deadPilots.push(vid);
            }
        }
        deadPilots.forEach(vid => pilots.delete(vid));
        const deadGunners: number[] = [];
        for (const [vid, gunner] of gunners) {
            try {
                if (!gunner) {
                    deadGunners.push(vid);
                    continue;
                }
                if (!isAliveCheck(gunner)) {
                    deadGunners.push(vid);
                    continue;
                }
                const gunnerTeamId = getPlayerTeamId(gunner);
                if (gunnerTeamId === 0) continue; // Can't determine team
                const allPlayers = mod.AllPlayers();
                const count = mod.CountOf(allPlayers);
                let target: mod.Player | null = null;
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                    if (!p) continue;
                    if (!isAliveCheck(p)) continue;
                    const targetTeamId = getPlayerTeamId(p);
                    if (targetTeamId === gunnerTeamId || targetTeamId === 0) continue;
                    target = p;
                    break;
                }
                if (target) {
                    mod.AISetTarget(gunner, target);
                }
            } catch {
                deadGunners.push(vid);
            }
        }
        deadGunners.forEach(vid => gunners.delete(vid));
    }
    function updateMode(): void {
        let contested = 0;
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (cp) contested++;
            }
        } catch {
        }
        const t1 = getTickets(1);
        const t2 = getTickets(2);
        const delta = Math.abs(t1 - t2);
        if (contested > 2 || delta > 100) {
            globalMode = "Aggressive";
        } else {
            globalMode = "Balanced";
        }
    }
    export function registerAircraftPilot(v: mod.Vehicle, p: mod.Player): void {
        try {
            if (!isAircraft(v)) return;
            const vid = mod.GetObjId(v);
            pilots.set(vid, p);
        } catch {
        }
    }
    export function registerAircraftGunner(v: mod.Vehicle, g: mod.Player): void {
        try {
            if (!isAircraft(v)) return;
            const vid = mod.GetObjId(v);
            gunners.set(vid, g);
        } catch {
        }
    }
    function isAliveCheck(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsAlive) === true;
        } catch {
            return false;
        }
    }
}


// Module: modules/VehicleSpawnUIModuleParseUI.ts
namespace ConquestV8 {
    let vehicleUIParseInitialized = false;
    let vehicleUIParseCreated = false;
    const vehicleButtonsParseUI: Map<string, { 
        vehicleType: mod.VehicleList; 
        matchTypes: mod.VehicleList[];
        label: string;
        spawnerId: number;
        teamId: number;
    }> = new Map();
    const playerWidgetNamesParseUI: Map<number, string[]> = new Map();
    const playerUIVisibleParseUI: Set<number> = new Set();
    const suppressUIUntilByPlayerId: Map<number, number> = new Map();
    let lastButtonClickTimeParseUI = 0;
    const BUTTON_DEBOUNCE_SECONDS = 1.0;
    const TEAM1_HQ_SPAWN_POINTS = [1009, 1010, 1012, 1013];
    const TEAM2_HQ_SPAWN_POINTS = [1014, 1015, 1016, 1017];
    const UI_PANEL_X = 1880;  // Right side of screen
    const UI_PANEL_Y = 280;   // Below MANAGE SQUAD
    const BUTTON_SIZE = 70;   // Button size for 3x3 grid
    const BUTTON_GAP = 10;
    const ROW_HEIGHT = 85;    // Adjusted for grid layout
    const BUTTONS_PER_ROW = 3; // 3 columns for 3x3 grid
    type VehicleCategory = 'Ground' | 'Air';
    interface VehicleDef {
        type: mod.VehicleList;
        label: string;
        spawnerId: number;
        category: VehicleCategory;
        matchTypes?: mod.VehicleList[];
    }
    interface MapVehicleConfig {
        team1: VehicleDef[];
        team2: VehicleDef[];
    }
    const CAPSTONE_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 208, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 207, category: 'Ground' },
        ],
        team2: [
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 247, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
        ]
    };
    const EASTWOOD_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 208, category: 'Ground' },
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 253, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 248, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 234, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 249, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
        ]
    };
    const DOWNTOWN_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 202, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 207, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 208, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 209, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 215, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 247, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
        ]
    };
    let activeMapConfig: MapVehicleConfig = DOWNTOWN_CONFIG; // Default fallback
    let detectedMapName = 'Unknown';
    function getTeam1Vehicles(): VehicleDef[] {
        return activeMapConfig.team1;
    }
    function getTeam2Vehicles(): VehicleDef[] {
        return activeMapConfig.team2;
    }
    function detectMapAndLoadVehicleConfig(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                activeMapConfig = CAPSTONE_CONFIG;
                detectedMapName = 'Capstone';
            } else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                activeMapConfig = EASTWOOD_CONFIG;
                detectedMapName = 'Eastwood';
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                activeMapConfig = DOWNTOWN_CONFIG;
                detectedMapName = 'Downtown';
            } else {
                activeMapConfig = DOWNTOWN_CONFIG;
                detectedMapName = 'Unknown (using Downtown config)';
            }
            log(`[VehicleUIParseUI] Map detected: ${detectedMapName} - loaded ${activeMapConfig.team1.length + activeMapConfig.team2.length} vehicle configs`);
        } catch (e) {
            log(`[VehicleUIParseUI] Map detection failed: ${e} - using Downtown fallback`);
            activeMapConfig = DOWNTOWN_CONFIG;
            detectedMapName = 'Error (using Downtown config)';
        }
    }
    interface SpawnRequest {
        playerId: number;
        teamId: number;
        spawnerId: number;
        vehicleType: mod.VehicleList;
        matchTypes: mod.VehicleList[];
        label: string;
        time: number;
    }
    const pendingSpawnRequestsByPlayerId: Map<number, SpawnRequest> = new Map();
    const assignedSpawnedVehicleIdByPlayerId: Map<number, number> = new Map();
    const MAX_SPAWN_ASSIGN_SECONDS = 8.0;
    const jetCooldownByPlayerId: Map<number, number> = new Map();
    const JET_COOLDOWN_SECONDS = 40.0; // 40-second cooldown for jets specifically
    type VehicleStatus = 'available' | 'cooldown' | 'occupied' | 'destroyed';
    interface SpawnerStatus {
        spawnerId: number;
        status: VehicleStatus;
        cooldownStartTime: number;      // When the cooldown started
        cooldownDuration: number;       // Total cooldown duration
        vehicleObjId: number | null;    // Currently spawned vehicle ID (if any)
    }
    const spawnerStatusMap: Map<number, SpawnerStatus> = new Map();
    const SPAWNER_COOLDOWN_SECONDS = 30.0;
    let lastUIStatusUpdateTime = 0;
    const UI_STATUS_UPDATE_INTERVAL = 0.5; // Update every 0.5 seconds
    const JET_VEHICLE_TYPES: mod.VehicleList[] = [
        mod.VehicleList.F22,
        mod.VehicleList.F16,
        mod.VehicleList.JAS39,
        mod.VehicleList.SU57
    ];
    function isJetVehicle(vehicleType: mod.VehicleList): boolean {
        return JET_VEHICLE_TYPES.includes(vehicleType);
    }
    function getJetCooldownRemaining(playerId: number): number {
        const cooldownExpires = jetCooldownByPlayerId.get(playerId);
        if (!cooldownExpires) return 0;
        const remaining = cooldownExpires - mod.GetMatchTimeElapsed();
        return remaining > 0 ? remaining : 0;
    }
    function setJetCooldown(playerId: number): void {
        jetCooldownByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + JET_COOLDOWN_SECONDS);
        logDebug(`[VehicleUIParseUI] Set jet cooldown for player ${playerId}: ${JET_COOLDOWN_SECONDS}s`);
    }
    function initSpawnerStatusTracking(): void {
        spawnerStatusMap.clear();
        const allVehicles = [...getTeam1Vehicles(), ...getTeam2Vehicles()];
        for (const vehicle of allVehicles) {
            if (!spawnerStatusMap.has(vehicle.spawnerId)) {
                spawnerStatusMap.set(vehicle.spawnerId, {
                    spawnerId: vehicle.spawnerId,
                    status: 'available', // Assume available at start
                    cooldownStartTime: 0,
                    cooldownDuration: SPAWNER_COOLDOWN_SECONDS,
                    vehicleObjId: null
                });
            }
        }
        logDebug(`[VehicleUIParseUI] Initialized status tracking for ${spawnerStatusMap.size} spawners`);
    }
    function setSpawnerCooldown(spawnerId: number, duration: number = SPAWNER_COOLDOWN_SECONDS): void {
        const status = spawnerStatusMap.get(spawnerId);
        if (status) {
            status.status = 'cooldown';
            status.cooldownStartTime = mod.GetMatchTimeElapsed();
            status.cooldownDuration = duration;
            status.vehicleObjId = null;
            logDebug(`[VehicleUIParseUI] Spawner ${spawnerId} on cooldown for ${duration}s`);
        }
    }
    function getSpawnerCooldownProgress(spawnerId: number): number {
        const status = spawnerStatusMap.get(spawnerId);
        if (!status) return 1.0;
        if (status.status !== 'cooldown') return 1.0;
        const elapsed = mod.GetMatchTimeElapsed() - status.cooldownStartTime;
        const progress = Math.min(1.0, elapsed / status.cooldownDuration);
        return progress;
    }
    function isSpawnerAvailable(spawnerId: number): boolean {
        const status = spawnerStatusMap.get(spawnerId);
        if (!status) return true; // Unknown = assume available
        return status.status === 'available';
    }
    export function initVehicleSpawnUIParseUI(): void {
        detectMapAndLoadVehicleConfig();
        vehicleUIParseInitialized = true;
        vehicleUIParseCreated = false;
        vehicleButtonsParseUI.clear();
        playerWidgetNamesParseUI.clear();
        playerUIVisibleParseUI.clear();
        jetCooldownByPlayerId.clear(); // Reset cooldowns on init
        initSpawnerStatusTracking(); // Initialize availability tracking
        logDebug(`[VehicleUIParseUI] Module initialized for map: ${detectedMapName} (ParseUI test mode)`);
        createVehicleSpawnUIParseUI();
    }
    function ensureInitParseUI(): void {
        if (!vehicleUIParseInitialized) {
            initVehicleSpawnUIParseUI();
        }
    }
    export function createVehicleSpawnUIParseUI(): void {
        if (vehicleUIParseCreated) return; // Already created
        ensureInitParseUI();
        vehicleUIParseCreated = true;
        logDebug("[VehicleUIParseUI] UI system ready (ParseUI test mode)");
    }
    function setUIInputModeForPlayerParseUI(player: mod.Player, enabled: boolean): void {
        try {
            mod.EnableUIInputMode(enabled, player);
        } catch (_e) {
        }
    }
    function setPlayerUIVisibleParseUI(player: mod.Player, visible: boolean): void {
        const playerId = mod.GetObjId(player);
        const names = playerWidgetNamesParseUI.get(playerId);
        if (!names) return;
        for (const widgetName of names) {
            try {
                const widget = mod.FindUIWidgetWithName(widgetName);
                if (!widget) continue;
                mod.SetUIWidgetVisible(widget as mod.UIWidget, visible);
            } catch (_e) {
            }
        }
        if (visible) {
            playerUIVisibleParseUI.add(playerId);
        } else {
            playerUIVisibleParseUI.delete(playerId);
        }
    }
    function getWidgetPlayerIdFromName(widgetName: string): number | null {
        try {
            const match = /_P(\d+)$/.exec(widgetName);
            if (!match) return null;
            return parseInt(match[1], 10);
        } catch (_e) {
            return null;
        }
    }
    function parseUIButtonEvent(event: mod.UIButtonEvent): {
        name: string;
        raw: string;
        isClick: boolean;
        isHoverIn: boolean;
        isFocusIn: boolean;
    } {
        const raw = String(event);
        let name = "Unknown";
        let isClick = false;
        let isHoverIn = false;
        let isFocusIn = false;
        if (typeof (event as unknown) === "number") {
            switch (event) {
                case mod.UIButtonEvent.ButtonDown:
                    name = "ButtonDown";
                    isClick = true;
                    break;
                case mod.UIButtonEvent.ButtonUp:
                    name = "ButtonUp";
                    isClick = true;
                    break;
                case mod.UIButtonEvent.FocusIn:
                    name = "FocusIn";
                    isFocusIn = true;
                    break;
                case mod.UIButtonEvent.FocusOut:
                    name = "FocusOut";
                    break;
                case mod.UIButtonEvent.HoverIn:
                    name = "HoverIn";
                    isHoverIn = true;
                    break;
                case mod.UIButtonEvent.HoverOut:
                    name = "HoverOut";
                    break;
                default:
                    break;
            }
            return { name, raw, isClick, isHoverIn, isFocusIn };
        }
        if (raw.includes("ButtonDown")) {
            name = "ButtonDown";
            isClick = true;
        } else if (raw.includes("ButtonUp")) {
            name = "ButtonUp";
            isClick = true;
        } else if (raw.includes("FocusIn")) {
            name = "FocusIn";
            isFocusIn = true;
        } else if (raw.includes("FocusOut")) {
            name = "FocusOut";
        } else if (raw.includes("HoverIn")) {
            name = "HoverIn";
            isHoverIn = true;
        } else if (raw.includes("HoverOut")) {
            name = "HoverOut";
        }
        return { name, raw, isClick, isHoverIn, isFocusIn };
    }
    function ensurePlayerUIParseUI(player: mod.Player): void {
        if (!vehicleUIParseCreated) return;
        const playerId = mod.GetObjId(player);
        if (playerWidgetNamesParseUI.has(playerId)) {
            log("[VehicleUI] UI already exists for player " + playerId);
            return;
        }
        log("[VehicleUI] Creating vehicle spawn UI for player " + playerId);
        const teamId = getPlayerTeamId(player);
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();
        const names: string[] = [];
        playerWidgetNamesParseUI.set(playerId, names);
        try {
            const panelName = `ParseUIVehiclePanel_P${playerId}_T${teamId}`;
            names.push(panelName);
            const children: any[] = [];
            for (let i = 0; i < vehicles.length; i++) {
                const vehicle = vehicles[i];
                const row = Math.floor(i / BUTTONS_PER_ROW);
                const col = i % BUTTONS_PER_ROW;
                const btnX = col * (BUTTON_SIZE + BUTTON_GAP);
                const btnY = row * ROW_HEIGHT;
                const buttonName = `ParseUIBtn_${teamId}_${vehicle.spawnerId}_P${playerId}`;
                names.push(buttonName);
                children.push({
                    type: 'Button',
                    name: buttonName,
                    position: [btnX, btnY, 0],
                    size: [BUTTON_SIZE, BUTTON_SIZE, 0],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    buttonEnabled: true,
                    buttonColorBase: [0.0, 0.7, 0.9],    // Cyan blue (normal)
                    buttonColorHover: [0.5, 0.85, 1.0],  // Light blue (hover/pressed)
                    bgColor: [0.0, 0.3, 0.4],            // Dark cyan background
                    bgAlpha: 0.9
                });
                children.push({
                    type: 'Text',
                    name: `ParseUILabel_${buttonName}`,
                    position: [btnX, btnY + (BUTTON_SIZE / 2 - 10), 0],
                    size: [BUTTON_SIZE, 20, 0],
                    anchor: mod.UIAnchor.TopLeft,
                    textLabel: mod.Message("{}", vehicle.label),
                    textSize: 12,
                    textColor: [1.0, 1.0, 1.0],
                    textAlpha: 1.0,
                    bgColor: [0.0, 0.0, 0.0],
                    bgAlpha: 0.5,
                    textAnchor: mod.UIAnchor.Center
                });
                const matchTypes = vehicle.matchTypes ?? [vehicle.type];
                vehicleButtonsParseUI.set(buttonName, {
                    vehicleType: vehicle.type,
                    matchTypes,
                    label: vehicle.label,
                    spawnerId: vehicle.spawnerId,
                    teamId
                });
            }
            const container = ParseUI({
                type: 'Container',
                name: panelName,
                position: [UI_PANEL_X, UI_PANEL_Y, 0],
                size: [280, 280, 0], // 3x3 grid container
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                bgColor: [0.0, 0.0, 0.0],
                bgAlpha: 0.0, // Invisible container background
                playerId: player,
                children: children
            });
            if (container) {
                mod.SetUIWidgetDepth(container, mod.UIDepth.AboveGameUI);
            }
            for (const widgetName of names) {
                if (!widgetName.includes("ParseUIBtn_")) continue;
                try {
                    const widget = mod.FindUIWidgetWithName(widgetName);
                    if (!widget) continue;
                    mod.EnableUIButtonEvent(widget as mod.UIWidget, mod.UIButtonEvent.ButtonDown, true);
                    mod.EnableUIButtonEvent(widget as mod.UIWidget, mod.UIButtonEvent.ButtonUp, true);
                } catch (_e) {
                }
            }
            logDebug(`[VehicleUIParseUI] ParseUI panel created for player ${playerId}`);
        } catch (e) {
            logDebug(`[VehicleUIParseUI] Failed to create ParseUI for player ${playerId}: ${e}`);
        }
    }
    export function handleVehicleButtonPressParseUI(player: mod.Player, widget: mod.UIWidget, buttonEvent: mod.UIButtonEvent): boolean {
        ensureInitParseUI();
        if (!player || !widget) return false;
        const matchTime = mod.GetMatchTimeElapsed();
        logDebug(`[VehicleUIParseUI] BUTTON EVENT at matchTime=${matchTime.toFixed(1)}s`);
        try {
            const widgetName = mod.GetUIWidgetName(widget);
            const eventInfo = parseUIButtonEvent(buttonEvent);
            logDebug(`[VehicleUIParseUI] Button event=${eventInfo.name} raw=${eventInfo.raw} widget=${widgetName}`);
            const playerId = mod.GetObjId(player);
            const widgetPlayerId = getWidgetPlayerIdFromName(widgetName);
            if (widgetPlayerId !== null && widgetPlayerId !== playerId) {
                logDebug(`[VehicleUIParseUI] Widget player mismatch: widgetP=${widgetPlayerId} eventP=${playerId}`);
                return false;
            }
            const isVehicleButton = widgetName.includes("ParseUIBtn_");
            const isClickEvent = isVehicleButton;
            if (!isVehicleButton || !isClickEvent) {
                return false;
            }
            logDebug(`[VehicleUIParseUI] Processing button click=${eventInfo.name}`);
            if (!playerUIVisibleParseUI.has(playerId)) {
                logDebug(`[VehicleUIParseUI] UI not marked visible for player ${playerId} - continuing anyway`);
            }
            const currentTime = now(true);
            const timeSinceLastClick = currentTime - lastButtonClickTimeParseUI;
            if (timeSinceLastClick < BUTTON_DEBOUNCE_SECONDS) {
                logDebug(`[VehicleUIParseUI] DEBOUNCED`);
                return false;
            }
            lastButtonClickTimeParseUI = currentTime;
            const buttonInfo = vehicleButtonsParseUI.get(widgetName);
            if (!buttonInfo) {
                logDebug(`[VehicleUIParseUI] Button ${widgetName} not found in registry`);
                return false;
            }
            const teamId = getPlayerTeamId(player);
            logDebug(`[VehicleUIParseUI] Player ${playerId} clicked ${buttonInfo.label}`);
            if (buttonInfo.teamId !== teamId) {
                logDebug(`[VehicleUIParseUI] Team mismatch`);
                return false;
            }
            if (isJetVehicle(buttonInfo.vehicleType)) {
                const cooldownRemaining = getJetCooldownRemaining(playerId);
                if (cooldownRemaining > 0) {
                    logDebug(`[VehicleUIParseUI] Jet cooldown active for player ${playerId}: ${cooldownRemaining.toFixed(1)}s remaining`);
                    try {
                        mod.DisplayCustomNotificationMessage(
                            `Jet cooldown: ${Math.ceil(cooldownRemaining)}s`,
                            mod.CustomNotificationSlots.MessageText1,
                            3.0,
                            player
                        );
                    } catch (_e) {}
                    return false;
                }
            }
            if (!isPlayerOnDeployScreenParseUI(player)) {
                logDebug(`[VehicleUIParseUI] Ignoring button press - player not on deploy screen`);
                return false;
            }
            suppressUIUntilByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + 10.0);
            onPlayerDeployedHideVehicleUIParseUI(player);
            const spawner = getVehicleSpawnerById(buttonInfo.spawnerId);
            if (!spawner) {
                logDebug(`[VehicleUIParseUI] Spawner ${buttonInfo.spawnerId} not found`);
                return false;
            }
            const matchTypes = buttonInfo.matchTypes ?? [buttonInfo.vehicleType];
            pendingSpawnRequestsByPlayerId.set(playerId, {
                playerId,
                teamId,
                spawnerId: buttonInfo.spawnerId,
                vehicleType: buttonInfo.vehicleType,
                matchTypes,
                label: buttonInfo.label,
                time: mod.GetMatchTimeElapsed(),
            });
            const preSpawnVehicleIds = getAllVehicleIdsParseUI();
            try {
                try {
                    mod.SetVehicleSpawnerVehicleType(spawner, buttonInfo.vehicleType);
                } catch (_e) {
                }
                mod.ForceVehicleSpawnerSpawn(spawner);
                logDebug(`[VehicleUIParseUI] Vehicle spawn initiated`);
                setSpawnerCooldown(buttonInfo.spawnerId, SPAWNER_COOLDOWN_SECONDS);
                if (isJetVehicle(buttonInfo.vehicleType)) {
                    setJetCooldown(playerId);
                }
            } catch (e) {
                logDebug(`[VehicleUIParseUI] Vehicle spawn failed: ${e}`);
                return false;
            }
            try {
                mod.EnablePlayerDeploy(player, true);
                mod.SetRedeployTime(player, 0);
                mod.DeployPlayer(player);
                logDebug(`[VehicleUIParseUI] Player deployed`);
            } catch (e) {
                logDebug(`[VehicleUIParseUI] Deploy failed: ${e}`);
                return false;
            }
            const vehicleLabel = buttonInfo.label;
            const playerTeamIdForLookup = getPlayerTeamId(player);
            mod.Wait(0.5).then(() => {
                logDebug(`[VehicleUIParseUI] Seating player in ${vehicleLabel}`);
                const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
                if (assignedVehicleId !== undefined) {
                    const assignedVehicle = findVehicleByIdParseUI(assignedVehicleId);
                    if (assignedVehicle) {
                        logDebug(`[VehicleUIParseUI] Using assigned spawned ${vehicleLabel} vehicle ${assignedVehicleId}`);
                        assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                        attemptSeatPlayerInSpecificVehicleParseUI(player, assignedVehicle, assignedVehicleId, vehicleLabel, 0);
                        return;
                    }
                    assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                }
                const spawnedVehicle = findNewVehicleOfTypeParseUI(matchTypes, preSpawnVehicleIds, playerTeamIdForLookup);
                if (spawnedVehicle) {
                    const spawnedId = mod.GetObjId(spawnedVehicle);
                    logDebug(`[VehicleUIParseUI] Found newly spawned ${vehicleLabel} vehicle ${spawnedId}`);
                    attemptSeatPlayerInSpecificVehicleParseUI(player, spawnedVehicle, spawnedId, vehicleLabel, 0);
                    return;
                }
                seatPlayerInVehicleParseUI(player, matchTypes, vehicleLabel, 0, preSpawnVehicleIds);
            });
            return true;
        } catch (e) {
            logDebug("[VehicleUIParseUI] handleVehicleButtonPress error: " + e);
            return false;
        }
    }
    function swapAIOutOfPilotSeat(vehicle: mod.Vehicle, occupants: mod.Player[]): boolean {
        const vehicleId = mod.GetObjId(vehicle);
        logDebug(`[VehicleUIParseUI] swapAIOutOfPilotSeat: vehicleId=${vehicleId}, occupants=${occupants.length}`);
        let seatCount = 1;
        try {
            seatCount = mod.GetVehicleSeatCount(vehicle);
        } catch (_e) {
            seatCount = 1;
        }
        logDebug(`[VehicleUIParseUI] Vehicle has ${seatCount} seats`);
        if (seatCount <= 1) {
            logDebug(`[VehicleUIParseUI] Single-seat vehicle - must eject AI`);
            for (const occ of occupants) {
                try {
                    mod.ForcePlayerExitVehicle(occ);
                } catch (_e) {}
            }
            return true;
        }
        const emptySeats: number[] = [];
        for (let seatIdx = 1; seatIdx < seatCount; seatIdx++) {
            try {
                if (!mod.IsVehicleSeatOccupied(vehicle, seatIdx)) {
                    emptySeats.push(seatIdx);
                }
            } catch (_e) {
            }
        }
        logDebug(`[VehicleUIParseUI] Empty seats available: [${emptySeats.join(", ")}]`);
        const pilotOccupants: mod.Player[] = [];
        for (const occ of occupants) {
            try {
                const seatNum = mod.GetPlayerVehicleSeat(occ);
                if (seatNum === 0) {
                    pilotOccupants.push(occ);
                }
            } catch (_e) {
                pilotOccupants.push(occ);
            }
        }
        logDebug(`[VehicleUIParseUI] Pilots to relocate: ${pilotOccupants.length}`);
        for (const pilot of pilotOccupants) {
            const pilotId = mod.GetObjId(pilot);
            if (emptySeats.length > 0) {
                const targetSeat = emptySeats.shift()!; // Take first empty seat
                try {
                    mod.ForcePlayerToSeat(pilot, vehicle, targetSeat);
                    logDebug(`[VehicleUIParseUI] SWAPPED AI ${pilotId} from seat 0 to seat ${targetSeat}`);
                } catch (e) {
                    logDebug(`[VehicleUIParseUI] Failed to swap AI ${pilotId} to seat ${targetSeat}: ${e}`);
                    try {
                        mod.ForcePlayerExitVehicle(pilot);
                        logDebug(`[VehicleUIParseUI] Fallback: ejected AI ${pilotId}`);
                    } catch (_e2) {}
                }
            } else {
                logDebug(`[VehicleUIParseUI] No empty seats - ejecting AI ${pilotId}`);
                try {
                    mod.ForcePlayerExitVehicle(pilot);
                } catch (_e) {}
            }
        }
        return true;
    }
    function seatPlayerInVehicleParseUI(
        player: mod.Player,
        vehicleTypes: mod.VehicleList[],
        label: string,
        retryCount: number = 0,
        preSpawnVehicleIds?: Set<number>
    ): void {
        const playerId = mod.GetObjId(player);
        const playerTeamId = getPlayerTeamId(player);
        logDebug(`[VehicleUIParseUI] seatPlayerInVehicleParseUI: player=${playerId} team=${playerTeamId} retry=${retryCount} types=${vehicleTypes.length}`);
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) {
                if (retryCount < 10) {
                    mod.Wait(0.5).then(() => seatPlayerInVehicleParseUI(player, vehicleTypes, label, retryCount + 1));
                }
                return;
            }
            const count = mod.CountOf(allVehicles);
            let playerAlive = false;
            try {
                if (hasSoldier(player)) {
                    playerAlive = isAlive(player);
                }
            } catch (e) {}
            if (!playerAlive) {
                attemptSeatPlayerWhenAliveParseUI(player, vehicleTypes, label, 0);
                return;
            }
            const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
            if (assignedVehicleId !== undefined) {
                const assignedVehicle = findVehicleByIdParseUI(assignedVehicleId);
                if (assignedVehicle) {
                    logDebug(`[VehicleUIParseUI] Using assigned spawned ${label} vehicle ${assignedVehicleId}`);
                    assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                    attemptSeatPlayerInSpecificVehicleParseUI(player, assignedVehicle, assignedVehicleId, label, 0);
                    return;
                }
                assignedSpawnedVehicleIdByPlayerId.delete(playerId);
            }
            if (preSpawnVehicleIds) {
                const spawnedVehicle = findNewVehicleOfTypeParseUI(vehicleTypes, preSpawnVehicleIds, playerTeamId);
                if (spawnedVehicle) {
                    const spawnedId = mod.GetObjId(spawnedVehicle);
                    let occupied = true;
                    try {
                        occupied = mod.IsVehicleOccupied(spawnedVehicle);
                    } catch (_e) {
                        occupied = true;
                    }
                    if (!occupied) {
                        seatPlayerDirectlyParseUI(player, spawnedVehicle, label);
                        return;
                    }
                    const occupants: mod.Player[] = [];
                    let hasHumanOccupant = false;
                    try {
                        const allPlayers2 = mod.AllPlayers();
                        const pCount = mod.CountOf(allPlayers2);
                        for (let pIdx = 0; pIdx < pCount; pIdx++) {
                            const p = mod.ValueInArray(allPlayers2, pIdx) as mod.Player;
                            if (!p) continue;
                            const inVehicle = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsInVehicle);
                            if (!inVehicle) continue;
                            try {
                                const pv = safeGetVehicleFromPlayer(p);
                                if (!pv) continue;
                                if (mod.GetObjId(pv) !== spawnedId) continue;
                                occupants.push(p);
                                const isAI = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsAISoldier);
                                if (!isAI) {
                                    hasHumanOccupant = true;
                                }
                            } catch (_e) {
                            }
                        }
                    } catch (_e) {
                    }
                    if (!hasHumanOccupant && occupants.length > 0) {
                        logDebug(`[VehicleUIParseUI] Found newly spawned ${label} occupied by AI (${occupants.length}) - SWAPPING instead of ejecting`);
                        try {
                            swapAIOutOfPilotSeat(spawnedVehicle, occupants);
                            mod.Wait(0.35).then(() => {
                                attemptSeatPlayerInSpecificVehicleParseUI(player, spawnedVehicle, spawnedId, label, 0);
                            });
                            return;
                        } catch (e) {
                            logDebug(`[VehicleUIParseUI] Failed to swap AI occupants: ${e}`);
                        }
                    } else if (hasHumanOccupant) {
                        logDebug(`[VehicleUIParseUI] Newly spawned ${label} has human occupant - waiting for free seat`);
                    }
                }
            }
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                const vehicleObjId = mod.GetObjId(vehicle);
                let vehicleTeamId = 0;
                try {
                    const vTeam = mod.GetVehicleTeam(vehicle);
                    if (vTeam) vehicleTeamId = mod.GetObjId(vTeam);
                } catch (_e) {}
                if (vehicleTeamId !== 0 && vehicleTeamId !== playerTeamId) {
                    continue; // Skip enemy vehicles only
                }
                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (e) {
                    continue;
                }
                if (!isRightType) continue;
                let occupied = true;
                try {
                    occupied = mod.IsVehicleOccupied(vehicle);
                } catch (_e) {
                    occupied = true;
                }
                if (!occupied) {
                    if (!preSpawnVehicleIds || !preSpawnVehicleIds.has(vehicleObjId) || retryCount >= 3) {
                        if (preSpawnVehicleIds && preSpawnVehicleIds.has(vehicleObjId) && retryCount >= 3) {
                            logDebug(`[VehicleUIParseUI] Using existing empty ${label} vehicle ${vehicleObjId} (team=${vehicleTeamId}) after retries`);
                        }
                        seatPlayerDirectlyParseUI(player, vehicle, label);
                        return;
                    }
                    continue;
                }
            }
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                const vehicleObjId = mod.GetObjId(vehicle);
                let vehicleTeamId2 = 0;
                try {
                    const vTeam2 = mod.GetVehicleTeam(vehicle);
                    if (vTeam2) vehicleTeamId2 = mod.GetObjId(vTeam2);
                } catch (_e) {}
                if (vehicleTeamId2 !== 0 && vehicleTeamId2 !== playerTeamId) {
                    continue; // Skip enemy vehicles only
                }
                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (e) {
                    continue;
                }
                if (!isRightType) continue;
                let occupied = true;
                try {
                    occupied = mod.IsVehicleOccupied(vehicle);
                } catch (_e) {
                    occupied = true;
                }
                if (!occupied) continue;
                const occupants: mod.Player[] = [];
                let hasHumanOccupant = false;
                let hasEnemyOccupant = false;
                try {
                    const allPlayers2 = mod.AllPlayers();
                    const pCount = mod.CountOf(allPlayers2);
                    for (let pIdx = 0; pIdx < pCount; pIdx++) {
                        const p = mod.ValueInArray(allPlayers2, pIdx) as mod.Player;
                        if (!p) continue;
                        const inVehicle = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsInVehicle);
                        if (!inVehicle) continue;
                        try {
                            const pv = safeGetVehicleFromPlayer(p);
                            if (!pv) continue;
                            if (mod.GetObjId(pv) !== vehicleObjId) continue;
                            occupants.push(p);
                            const isAI = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsAISoldier);
                            if (!isAI) {
                                hasHumanOccupant = true;
                            }
                            const occTeamId = getPlayerTeamId(p);
                            if (occTeamId !== 0 && occTeamId !== playerTeamId) {
                                hasEnemyOccupant = true;
                            }
                        } catch (_e) {
                        }
                    }
                } catch (_e) {
                }
                if (hasHumanOccupant || hasEnemyOccupant) continue;
                if (occupants.length === 0) continue;
                logDebug(
                    `[VehicleUIParseUI] Found ${label} occupied by friendly AI (${occupants.length}) - SWAPPING and taking vehicle ${vehicleObjId}`
                );
                try {
                    swapAIOutOfPilotSeat(vehicle, occupants);
                    mod.Wait(0.35).then(() => {
                        attemptSeatPlayerInSpecificVehicleParseUI(player, vehicle, vehicleObjId, label, 0);
                    });
                    return;
                } catch (e) {
                    logDebug(`[VehicleUIParseUI] Failed to swap AI occupants: ${e}`);
                    continue;
                }
            }
            if (retryCount < 10) {
                if (retryCount === 0) {
                    let foundTypes: string[] = [];
                    for (let i = 0; i < Math.min(count, 15); i++) {
                        try {
                            const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                            if (v) {
                                const vId = mod.GetObjId(v);
                                const vType = debugVehicleType(v);
                                let occ = "?";
                                try { occ = mod.IsVehicleOccupied(v) ? "occ" : "empty"; } catch(_e) {}
                                foundTypes.push(`${vId}:${vType}:${occ}`);
                            }
                        } catch (_e) {}
                    }
                    logDebug(`[VehicleUIParseUI] Vehicles in world: ${foundTypes.join(", ")}`);
                }
                logDebug(`[VehicleUIParseUI] Vehicle ${label} not found yet, retrying... (${retryCount + 1}/10)`);
                mod.Wait(0.5).then(() => seatPlayerInVehicleParseUI(player, vehicleTypes, label, retryCount + 1, preSpawnVehicleIds));
                return;
            }
            logDebug(`[VehicleUIParseUI] Gave up seating player after retries`);
        } catch (e) {
            logDebug(`[VehicleUIParseUI] seatPlayerInVehicle error: ${e}`);
        }
    }
    function seatPlayerDirectlyParseUI(player: mod.Player, vehicle: mod.Vehicle, label: string): void {
        const playerId = mod.GetObjId(player);
        logDebug(`[VehicleUIParseUI] seatPlayerDirectly: player=${playerId}`);
        try {
            mod.ForcePlayerToSeat(player, vehicle, 0);
            logDebug(`[VehicleUIParseUI] SUCCESS - player seated in ${label}`);
            try {
                const isTank = mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams) ||
                               mod.CompareVehicleName(vehicle, mod.VehicleList.Leopard);
                if (isTank) {
                    mod.SetVehicleMaxHealthMultiplier(vehicle, 0.7);
                    logDebug(`[VehicleUIParseUI] Tank health set to 0.7x for ${label}`);
                }
            } catch (_e) {}
        } catch (e) {
            logDebug(`[VehicleUIParseUI] ForcePlayerToSeat error: ${e}`);
        }
    }
    function attemptSeatPlayerInSpecificVehicleParseUI(player: mod.Player, vehicle: mod.Vehicle, vehicleObjId: number, label: string, retryCount: number): void {
        const playerId = mod.GetObjId(player);
        const MAX_RETRIES = 10;
        let playerAlive = false;
        try {
            if (hasSoldier(player)) {
                playerAlive = isAlive(player);
            }
        } catch (e) {}
        logDebug(`[VehicleUIParseUI] attemptSeatPlayerInSpecificVehicle: player=${playerId}, vehicle=${vehicleObjId}, retry=${retryCount}/${MAX_RETRIES}, isAlive=${playerAlive}`);
        if (!playerAlive) {
            if (retryCount < MAX_RETRIES) {
                logDebug(`[VehicleUIParseUI] Player not alive yet - waiting (${retryCount + 1}/${MAX_RETRIES})...`);
                mod.Wait(0.5).then(() => {
                    attemptSeatPlayerInSpecificVehicleParseUI(player, vehicle, vehicleObjId, label, retryCount + 1);
                });
                return;
            } else {
                logDebug(`[VehicleUIParseUI] GAVE UP: Player ${playerId} still not alive after ${MAX_RETRIES} retries`);
                return;
            }
        }
        logDebug(`[VehicleUIParseUI] Player ${playerId} is alive - seating in vehicle ${vehicleObjId}`);
        seatPlayerDirectlyParseUI(player, vehicle, label);
    }
    function attemptSeatPlayerWhenAliveParseUI(player: mod.Player, vehicleTypes: mod.VehicleList[], label: string, retryCount: number): void {
        const playerId = mod.GetObjId(player);
        const MAX_RETRIES = 10;
        let playerAlive = false;
        try {
            if (hasSoldier(player)) {
                playerAlive = isAlive(player);
            }
        } catch (e) {}
        if (!playerAlive) {
            if (retryCount < MAX_RETRIES) {
                mod.Wait(0.5).then(() => {
                    attemptSeatPlayerWhenAliveParseUI(player, vehicleTypes, label, retryCount + 1);
                });
                return;
            } else {
                logDebug(`[VehicleUIParseUI] Gave up seating player after retries`);
                onPlayerDiedShowUIParseUI(player);
                return;
            }
        }
        seatPlayerInVehicleParseUI(player, vehicleTypes, label);
    }
    function getVehicleSpawnerById(spawnerId: number): mod.VehicleSpawner | null {
        try {
            return mod.GetVehicleSpawner(spawnerId);
        } catch (e) {
            return null;
        }
    }
    function getAllVehicleIdsParseUI(): Set<number> {
        const ids = new Set<number>();
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return ids;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    ids.add(mod.GetObjId(vehicle));
                } catch (_e) {
                }
            }
        } catch (_e) {
        }
        return ids;
    }
    function findVehicleByIdParseUI(vehicleId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    if (mod.GetObjId(vehicle) === vehicleId) {
                        return vehicle;
                    }
                } catch (_e) {
                }
            }
        } catch (_e) {
        }
        return null;
    }
    function matchesAnyVehicleTypeParseUI(vehicle: mod.Vehicle, vehicleTypes: mod.VehicleList[]): boolean {
        for (const vehicleType of vehicleTypes) {
            try {
                const matches = mod.CompareVehicleName(vehicle, vehicleType);
                if (matches) return true;
            } catch (_e) {
            }
        }
        return false;
    }
    function debugVehicleType(vehicle: mod.Vehicle): string {
        const typeNames: [mod.VehicleList, string][] = [
            [mod.VehicleList.Marauder, "Marauder"],
            [mod.VehicleList.Marauder_Pax, "Marauder_Pax"],
            [mod.VehicleList.Flyer60, "Flyer60"],
            [mod.VehicleList.Vector, "Vector"],
            [mod.VehicleList.AH64, "AH64"],
            [mod.VehicleList.Eurocopter, "Eurocopter"],
            [mod.VehicleList.UH60, "UH60"],
            [mod.VehicleList.UH60_Pax, "UH60_Pax"],
            [mod.VehicleList.F22, "F22"],
            [mod.VehicleList.F16, "F16"],
            [mod.VehicleList.JAS39, "JAS39"],
            [mod.VehicleList.SU57, "SU57"],
        ];
        let teamId = 0;
        try {
            const vTeam = mod.GetVehicleTeam(vehicle);
            if (vTeam) teamId = mod.GetObjId(vTeam);
        } catch (_e) {}
        for (const [vt, name] of typeNames) {
            try {
                if (mod.CompareVehicleName(vehicle, vt)) {
                    return `${name}(T${teamId})`;
                }
            } catch (_e) {}
        }
        return `unknown(T${teamId})`;
    }
    function findNewVehicleOfTypeParseUI(
        vehicleTypes: mod.VehicleList[],
        preSpawnVehicleIds: Set<number>,
        forTeamId?: number
    ): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                if (forTeamId !== undefined && forTeamId !== 0) {
                    let vehicleTeamId = 0;
                    try {
                        const vTeam = mod.GetVehicleTeam(vehicle);
                        if (vTeam) vehicleTeamId = mod.GetObjId(vTeam);
                    } catch (_e) {}
                    if (vehicleTeamId !== forTeamId) {
                        continue; // Skip non-team vehicles
                    }
                }
                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (_e) {
                    continue;
                }
                if (!isRightType) continue;
                const vehicleId = mod.GetObjId(vehicle);
                if (!preSpawnVehicleIds.has(vehicleId)) {
                    return vehicle;
                }
            }
        } catch (_e) {
        }
        return null;
    }
    export function vehicleUI_OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
        if (!eventVehicle) return;
        if (pendingSpawnRequestsByPlayerId.size > 0) {
            try {
                const vehicleId = mod.GetObjId(eventVehicle);
                logDebug(`[VehicleUIParseUI] OnVehicleSpawned event for vehicle ${vehicleId} (pending=${pendingSpawnRequestsByPlayerId.size})`);
            } catch (_e) {
            }
        }
        const now = mod.GetMatchTimeElapsed();
        for (const [pid, req] of pendingSpawnRequestsByPlayerId.entries()) {
            if (now - req.time > MAX_SPAWN_ASSIGN_SECONDS) {
                pendingSpawnRequestsByPlayerId.delete(pid);
            }
        }
        let vehicleTeamId = 0;
        try {
            const vTeam = mod.GetVehicleTeam(eventVehicle);
            vehicleTeamId = vTeam ? mod.GetObjId(vTeam) : 0;
        } catch (_e) {
            vehicleTeamId = 0;
        }
        for (const [pid, req] of pendingSpawnRequestsByPlayerId.entries()) {
            if (req.time + MAX_SPAWN_ASSIGN_SECONDS < now) continue;
            if (vehicleTeamId !== 0 && req.teamId !== 0 && vehicleTeamId !== req.teamId) continue;
            let isRightType = false;
            try {
                isRightType = matchesAnyVehicleTypeParseUI(eventVehicle, req.matchTypes ?? [req.vehicleType]);
            } catch (_e) {
                isRightType = false;
            }
            if (!isRightType) continue;
            try {
                const vehicleId = mod.GetObjId(eventVehicle);
                assignedSpawnedVehicleIdByPlayerId.set(pid, vehicleId);
                pendingSpawnRequestsByPlayerId.delete(pid);
                logDebug(`[VehicleUIParseUI] Matched spawned ${req.label} vehicle ${vehicleId} to player ${pid}`);
                return;
            } catch (_e) {
            }
        }
    }
    export function onPlayerDeployedHideVehicleUIParseUI(player: mod.Player): void {
        if (!player) return;
        if (isAISoldier(player)) return;
        if (!vehicleUIParseCreated) return;
        const playerId = mod.GetObjId(player);
        if (!playerWidgetNamesParseUI.has(playerId)) return;
        setPlayerUIVisibleParseUI(player, false);
        logDebug(`[VehicleUIParseUI] Hiding UI for player ${playerId}`);
    }
    function isPlayerOnDeployScreenParseUI(player: mod.Player): boolean {
        try {
            const playerId = mod.GetObjId(player);
            const now = mod.GetMatchTimeElapsed();
            const lastDeathTime = lastDeathTimeByPlayerId.get(playerId);
            if (lastDeathTime !== undefined && now - lastDeathTime < DEATHCAM_BLOCK_SECONDS) {
                return false; // Still in death cam
            }
            const hasEverDeployed = hasEverDeployedByPlayerId.has(playerId);
            const lastUndeployTime = lastUndeployTimeByPlayerId.get(playerId);
            const soldierExists = hasSoldier(player);
            if (soldierExists) {
                return false;
            }
            if (hasEverDeployed && lastUndeployTime === undefined) {
                return false;
            }
            const isAlive = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
            const isInVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
            const isManDown = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsManDown);
            if (isAlive || isInVehicle || isManDown) {
                return false;
            }
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function vehicleUI_OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        hasEverDeployedByPlayerId.add(playerId);
        lastUndeployTimeByPlayerId.delete(playerId);
        lastDeathTimeByPlayerId.delete(playerId);
        const pendingRequest = pendingSpawnRequestsByPlayerId.get(playerId);
        if (pendingRequest) {
            logDebug(`[VehicleUIParseUI] Player ${playerId} deployed with pending request for ${pendingRequest.label} - button handler will seat`);
        }
    }
    export function vehicleUI_OnPlayerUndeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastUndeployTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
    }
    let lastTickCheckParseUI = 0;
    const TICK_CHECK_INTERVAL = 0.25; // Check 4 times per second for responsiveness
    const knownHumanPlayers: Set<number> = new Set();
    const knownAIPlayers: Set<number> = new Set();  // Also cache AI to avoid re-checking
    const lastDeathTimeByPlayerId: Map<number, number> = new Map();
    const DEATHCAM_BLOCK_SECONDS = 3.0;
    const hasEverDeployedByPlayerId: Set<number> = new Set();
    const lastUndeployTimeByPlayerId: Map<number, number> = new Map();
    function isPlayerHumanCached(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        if (knownHumanPlayers.has(playerId)) return true;
        if (knownAIPlayers.has(playerId)) return false;
        try {
            const isAI = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAISoldier);
            if (isAI) {
                knownAIPlayers.add(playerId);  // Cache as AI
                return false;
            }
            knownHumanPlayers.add(playerId);
            return true;
        } catch (_e) {
            knownAIPlayers.add(playerId);  // Cache as AI on error
            return false;
        }
    }
    function updateVehicleStatusFromWorld(): void {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            const activeVehiclesByType: Set<number> = new Set();
            for (let i = 0; i < count; i++) {
                try {
                    const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                    if (!vehicle) continue;
                    const vId = mod.GetObjId(vehicle);
                    activeVehiclesByType.add(vId);
                } catch (_e) {
                    continue;
                }
            }
            for (const [spawnerId, status] of spawnerStatusMap) {
                if (status.status === 'cooldown') {
                    const progress = getSpawnerCooldownProgress(spawnerId);
                    if (progress >= 1.0) {
                        status.status = 'available';
                        logDebug(`[VehicleUIParseUI] Spawner ${spawnerId} cooldown complete - now available`);
                    }
                }
            }
        } catch (_e) {
        }
    }
    function updateButtonStatusForPlayer(playerId: number, teamId: number): void {
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();
        for (const vehicle of vehicles) {
            const buttonName = `ParseUIBtn_${teamId}_${vehicle.spawnerId}_P${playerId}`;
            try {
                const buttonWidget = mod.FindUIWidgetWithName(buttonName);
                if (!buttonWidget) continue;
                const status = spawnerStatusMap.get(vehicle.spawnerId);
                let buttonEnabled = true;
                let bgAlpha = 0.9; // Full opacity when available
                let bgColor: [number, number, number] = [0.0, 0.5, 0.6]; // Cyan = available
                if (isJetVehicle(vehicle.type)) {
                    const jetCooldownRemaining = getJetCooldownRemaining(playerId);
                    if (jetCooldownRemaining > 0) {
                        const progress = 1.0 - (jetCooldownRemaining / JET_COOLDOWN_SECONDS);
                        bgAlpha = 0.3 + (progress * 0.6); // Start dim, brighten as cooldown completes
                        buttonEnabled = false;
                        bgColor = [0.6, 0.4, 0.0]; // Orange tint for jet cooldown
                    }
                }
                if (status) {
                    if (status.status === 'cooldown') {
                        const progress = getSpawnerCooldownProgress(vehicle.spawnerId);
                        bgAlpha = 0.3 + (progress * 0.6); // Start dim, brighten as ready
                        buttonEnabled = false;
                        bgColor = [0.4, 0.1, 0.1]; // Red tint for spawner cooldown
                    } else if (status.status === 'occupied') {
                        bgAlpha = 0.4;
                        buttonEnabled = false;
                        bgColor = [0.3, 0.3, 0.3]; // Gray = occupied
                    } else if (status.status === 'destroyed') {
                        bgAlpha = 0.2;
                        buttonEnabled = false;
                        bgColor = [0.2, 0.0, 0.0]; // Dark red = destroyed
                    }
                }
                mod.SetUIWidgetBgAlpha(buttonWidget as mod.UIWidget, bgAlpha);
                mod.SetUIWidgetBgColor(buttonWidget as mod.UIWidget, mod.CreateVector(bgColor[0], bgColor[1], bgColor[2]));
                mod.SetUIButtonEnabled(buttonWidget as mod.UIWidget, buttonEnabled);
            } catch (_e) {
            }
        }
    }
    function tickVehicleStatusUI(): void {
        const now = mod.GetMatchTimeElapsed();
        if (now - lastUIStatusUpdateTime < UI_STATUS_UPDATE_INTERVAL) return;
        lastUIStatusUpdateTime = now;
        updateVehicleStatusFromWorld();
        for (const playerId of playerUIVisibleParseUI) {
            try {
                const allPlayers = mod.AllPlayers();
                const count = mod.CountOf(allPlayers);
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                    if (!p) continue;
                    if (mod.GetObjId(p) === playerId) {
                        const teamId = getPlayerTeamId(p);
                        updateButtonStatusForPlayer(playerId, teamId);
                        break;
                    }
                }
            } catch (_e) {
            }
        }
    }
    export function tickVehicleUIParseUI(): void {
        const now = mod.GetMatchTimeElapsed();
        if (now - lastTickCheckParseUI < TICK_CHECK_INTERVAL) return;
        lastTickCheckParseUI = now;
        tickVehicleStatusUI();
        if (!vehicleUIParseCreated) {
            createVehicleSpawnUIParseUI();
        }
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                const isHuman = isPlayerHumanCached(player);
                if (!isHuman) continue;
                const playerId = mod.GetObjId(player);
                const onDeployScreen = isPlayerOnDeployScreenParseUI(player);
                const soldierExists = hasSoldier(player);
                const suppressUntil = suppressUIUntilByPlayerId.get(playerId);
                if (suppressUntil !== undefined) {
                    if (now < suppressUntil) {
                        continue;
                    }
                    suppressUIUntilByPlayerId.delete(playerId);
                }
                const pendingRequest = pendingSpawnRequestsByPlayerId.get(playerId);
                if (pendingRequest) {
                    if (now - pendingRequest.time <= MAX_SPAWN_ASSIGN_SECONDS) {
                        continue;
                    }
                    pendingSpawnRequestsByPlayerId.delete(playerId);
                }
                const isVisible = playerUIVisibleParseUI.has(playerId);
                if (onDeployScreen && !isVisible) {
                    log(`[VehicleUI] Player ${playerId} on deploy screen - showing UI`);
                    ensurePlayerUIParseUI(player);
                    setPlayerUIVisibleParseUI(player, true);
                    lastDeathTimeByPlayerId.delete(playerId);
                } else if (!onDeployScreen && isVisible) {
                    logDebug(`[VehicleUI] Player ${playerId} deployed - hiding UI`);
                    onPlayerDeployedHideVehicleUIParseUI(player);
                }
            }
        } catch (e) {
            log(`[VehicleUI] Tick error: ${e}`);
        }
    }
    export function onPlayerDiedShowUIParseUI(player?: mod.Player): void {
        if (!vehicleUIParseCreated) return;
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastDeathTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
        onPlayerDeployedHideVehicleUIParseUI(player);
        logDebug(`[VehicleUIParseUI] Player died - waiting for deploy screen...`);
    }
    export function onPlayerDiedHideUIParseUI(player?: mod.Player): void {
        if (!vehicleUIParseCreated) return;
        if (!player) return;
        onPlayerDeployedHideVehicleUIParseUI(player);
    }
}


// Module: modules/ScoreboardModule.ts
namespace ConquestV8 {
    const SCORE_PER_KILL = 100;
    const SCORE_PER_CAPTURE = 250;
    const SCORE_PER_REVIVE = 150;
    const KILL_CREDIT_DEDUP_SECONDS = 0.05;
    let initialized = false;
    let ready = false;
    let lastSyncTime = -9999;
    let lastReconfigureTime = -9999;
    function getScoreboardHeaderLabels(): { team1: string; team2: string } {
        const team1Label = getTeamFactionLabel(1);
        const team2Label = getTeamFactionLabel(2);
        const t1Display = team1Label === "UNKNOWN" ? "NATO" : team1Label;
        const t2Display = team2Label === "UNKNOWN" ? "PAX" : team2Label;
        return {
            team1: `${t1Display} FORCES`,
            team2: `${t2Display} FORCES`
        };
    }
    function configureScoreboard(): boolean {
        if (!ENABLE_SCOREBOARD) return false;
        let configured = false;
        try {
            mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
            configured = true;
        } catch (_e) {
            logDebug("[ConquestV10][Scoreboard] Failed to set scoreboard type");
            configured = false;
        }
        if (!configured) return false;
        safeCall("Scoreboard:Header", () => {
            mod.SetScoreboardHeader(textMessage("NATO FORCES"), textMessage("PAX FORCES"));
        });
        safeCall("Scoreboard:Columns", () => {
            const capturesLabel = SCOREBOARD_CAPTURES_LABEL || "C";
            mod.SetScoreboardColumnNames(
                textMessage("S"),
                textMessage("K"),
                textMessage("D"),
                textMessage("R"),
                textMessage(capturesLabel)
            );
            mod.SetScoreboardColumnWidths(1.1, 0.6, 0.6, 0.6, 0.6);
            mod.SetScoreboardSorting(0, false);
            mod.SetGameModeTargetScore(99999);
        });
        return true;
    }
    export function Scoreboard_reconfigure(reason: string): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD) return;
        const ok = configureScoreboard();
        ready = ok;
        lastReconfigureTime = now(true);
        log(`[ConquestV10][Scoreboard] Reconfigure(${reason}) ready=${ready}`);
        safeCall("Scoreboard:ReconfigureSync", () => syncAllPlayers());
    }
    let sbPlayerIds: number[] = [];
    let sbPlayerScores: number[] = [];
    let sbPlayerKills: number[] = [];
    let sbPlayerDeaths: number[] = [];
    let sbPlayerRevives: number[] = [];
    let sbPlayerCaptures: number[] = [];
    let sbPlayerVehicleScore: number[] = [];  // Accumulated vehicle destruction points
    let sbPlayerLastKillCredit: number[] = [];
    let sbPlayerLastKillVictim: number[] = [];
    export function initScoreboardModule(): void {
        initialized = true;
        ready = false;
        lastSyncTime = -9999;
        sbPlayerIds = [];
        sbPlayerScores = [];
        sbPlayerKills = [];
        sbPlayerDeaths = [];
        sbPlayerRevives = [];
        sbPlayerCaptures = [];
        sbPlayerVehicleScore = [];
        sbPlayerLastKillCredit = [];
        sbPlayerLastKillVictim = [];
        if (!ENABLE_SCOREBOARD) return;
        ready = configureScoreboard();
        log(`[ConquestV10][Scoreboard] Initialized (V4 scoring) ready=${ready}`);
        safeCall("Scoreboard:InitialSync", () => syncAllPlayers());
    }
    function ensureInit(): void {
        if (!initialized) initScoreboardModule();
    }
    function requestScoreboardRefresh(): void {
        if (!ready) return;
        lastSyncTime = -9999;
    }
    function findIdxByPlayerId(playerId: number): number {
        return sbPlayerIds.indexOf(playerId);
    }
    function ensurePlayerEntry(player: mod.Player): number {
        const playerId = mod.GetObjId(player);
        let idx = findIdxByPlayerId(playerId);
        if (idx >= 0) return idx;
        sbPlayerIds.push(playerId);
        sbPlayerScores.push(0);
        sbPlayerKills.push(0);
        sbPlayerDeaths.push(0);
        sbPlayerRevives.push(0);
        sbPlayerCaptures.push(0);
        sbPlayerVehicleScore.push(0);
        sbPlayerLastKillCredit.push(-9999);
        sbPlayerLastKillVictim.push(-1);
        idx = sbPlayerIds.length - 1;
        return idx;
    }
    function recalcScore(idx: number): void {
        const score =
            sbPlayerKills[idx] * SCORE_PER_KILL +
            sbPlayerCaptures[idx] * SCORE_PER_CAPTURE +
            sbPlayerRevives[idx] * SCORE_PER_REVIVE +
            sbPlayerVehicleScore[idx];  // Vehicle kills already have varying point values
        sbPlayerScores[idx] = mod.Floor(score);
    }
    function pushPlayer(player: mod.Player, idx: number): void {
        if (!ready) return;
        mod.SetScoreboardPlayerValues(
            player,
            sbPlayerScores[idx],
            sbPlayerKills[idx],
            sbPlayerDeaths[idx],
            sbPlayerRevives[idx],
            sbPlayerCaptures[idx]
        );
    }
    let cachedHeaderTeam1: mod.Message | null = null;
    let cachedHeaderTeam2: mod.Message | null = null;
    let cachedHeaderTeam1Label: string | null = null;
    let cachedHeaderTeam2Label: string | null = null;
    function getCachedHeaders(): { team1: mod.Message; team2: mod.Message } {
        const labels = getScoreboardHeaderLabels();
        if (!cachedHeaderTeam1 || cachedHeaderTeam1Label !== labels.team1) {
            cachedHeaderTeam1 = textMessage(labels.team1);
            cachedHeaderTeam1Label = labels.team1;
        }
        if (!cachedHeaderTeam2 || cachedHeaderTeam2Label !== labels.team2) {
            cachedHeaderTeam2 = textMessage(labels.team2);
            cachedHeaderTeam2Label = labels.team2;
        }
        return { team1: cachedHeaderTeam1, team2: cachedHeaderTeam2 };
    }
    function pruneDisconnectedPlayers(): void {
        if (sbPlayerIds.length === 0) return;
        const allPlayers = mod.AllPlayers();
        const count = mod.CountOf(allPlayers);
        const activeIds = new Set<number>();
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(allPlayers, i) as mod.Player;
            if (p) activeIds.add(mod.GetObjId(p));
        }
        for (let i = sbPlayerIds.length - 1; i >= 0; i--) {
            if (!activeIds.has(sbPlayerIds[i])) {
                sbPlayerIds.splice(i, 1);
                sbPlayerScores.splice(i, 1);
                sbPlayerKills.splice(i, 1);
                sbPlayerDeaths.splice(i, 1);
                sbPlayerRevives.splice(i, 1);
                sbPlayerCaptures.splice(i, 1);
                sbPlayerVehicleScore.splice(i, 1);
                sbPlayerLastKillCredit.splice(i, 1);
                sbPlayerLastKillVictim.splice(i, 1);
            }
        }
    }
    function syncAllPlayers(): void {
        if (!ready) return;
        pruneDisconnectedPlayers();
        safeCall("Scoreboard:HeaderSync", () => {
            mod.SetScoreboardHeader(textMessage("NATO FORCES"), textMessage("PAX FORCES"));
        });
        const allPlayers = mod.AllPlayers();
        const count = mod.CountOf(allPlayers);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(allPlayers, i) as mod.Player;
            if (!p) continue;
            const idx = ensurePlayerEntry(p);
            pushPlayer(p, idx);
        }
        const t1 = mod.GetTeam(1);
        const t2 = mod.GetTeam(2);
        if (t1) mod.SetGameModeScore(t1, getTickets(1));
        if (t2) mod.SetGameModeScore(t2, getTickets(2));
        mod.SetScoreboardSorting(0, false);
    }
    export function tickScoreboard(): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        const t = now(true);
        if (t - lastReconfigureTime >= 60.0) {
            safeCall("Scoreboard:PeriodicReconfigure", () => Scoreboard_reconfigure("Periodic"));
        }
        if (t - lastSyncTime < SCOREBOARD_UPDATE_INTERVAL_SECONDS) return;
        lastSyncTime = t;
        safeCall("Scoreboard:Sync", () => syncAllPlayers());
    }
    export function Scoreboard_recordKill(killer: mod.Player, victim?: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!killer) return;
        const killerId = mod.GetObjId(killer);
        const idx = ensurePlayerEntry(killer);
        const nowTime = now(true);
        const lastTime = sbPlayerLastKillCredit[idx] ?? -9999;
        const lastVictim = sbPlayerLastKillVictim[idx] ?? -1;
        const victimId = victim ? mod.GetObjId(victim) : -1;
        if (nowTime - lastTime < KILL_CREDIT_DEDUP_SECONDS && lastVictim === victimId && victimId !== -1) {
            return;
        }
        sbPlayerLastKillCredit[idx] = nowTime;
        sbPlayerLastKillVictim[idx] = victimId;
        sbPlayerKills[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushK", () => pushPlayer(killer, idx));
    }
    export function Scoreboard_recordDeath(victim: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!victim) return;
        const idx = ensurePlayerEntry(victim);
        sbPlayerDeaths[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushD", () => pushPlayer(victim, idx));
    }
    export function Scoreboard_recordRevive(medic: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!medic) return;
        const idx = ensurePlayerEntry(medic);
        sbPlayerRevives[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushR", () => pushPlayer(medic, idx));
    }
    export function Scoreboard_recordCapture(player: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player) return;
        const idx = ensurePlayerEntry(player);
        sbPlayerCaptures[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushC", () => pushPlayer(player, idx));
    }
    export function Scoreboard_recordVehicleKill(killer: mod.Player, vehicle: mod.Vehicle): number {
        ensureInit();
        if (!killer || !vehicle) return 0;
        let points = SCORE_VEHICLE_DEFAULT;
        let category = "unknown";
        const lightVehicles = [
            mod.VehicleList.Quadbike,
            mod.VehicleList.GolfCart,
            mod.VehicleList.Flyer60,
            mod.VehicleList.Marauder
        ];
        const transportVehicles = [
            mod.VehicleList.RHIB,
            mod.VehicleList.Marauder_Pax
        ];
        const ifvVehicles = [
            mod.VehicleList.M2Bradley,
            mod.VehicleList.Vector,
            mod.VehicleList.CV90
        ];
        const aaVehicles = [
            mod.VehicleList.Cheetah,
            mod.VehicleList.Gepard
        ];
        const tankVehicles = [
            mod.VehicleList.Abrams,
            mod.VehicleList.Leopard
        ];
        const heliVehicles = [
            mod.VehicleList.UH60,
            mod.VehicleList.UH60_Pax,
            mod.VehicleList.AH64,
            mod.VehicleList.Eurocopter
        ];
        const jetVehicles = [
            mod.VehicleList.F16,
            mod.VehicleList.F22,
            mod.VehicleList.JAS39,
            mod.VehicleList.SU57
        ];
        for (const vType of lightVehicles) {
            try {
                if (mod.CompareVehicleName(vehicle, vType)) {
                    points = SCORE_VEHICLE_LIGHT;
                    category = "light";
                    break;
                }
            } catch (_e) {}
        }
        if (category === "unknown") {
            for (const vType of transportVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_TRANSPORT;
                        category = "transport";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of ifvVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_IFV;
                        category = "IFV";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of aaVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_AA;
                        category = "AA";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of tankVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_TANK;
                        category = "tank";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of heliVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_HELI;
                        category = "helicopter";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of jetVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_JET;
                        category = "jet";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (ENABLE_SCOREBOARD && ready) {
            const idx = ensurePlayerEntry(killer);
            sbPlayerVehicleScore[idx] += points;
            recalcScore(idx);
            safeCall("Scoreboard:PushV", () => pushPlayer(killer, idx));
        }
        log(`[Scoreboard] Vehicle kill: ${category} = ${points} pts for player ${mod.GetObjId(killer)}`);
        return points;
    }
    export function Scoreboard_ensurePlayer(player: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player) return;
        const idx = ensurePlayerEntry(player);
        safeCall("Scoreboard:PushEnsure", () => pushPlayer(player, idx));
    }
}


// Module: modules/TicketBleedModule.ts
namespace ConquestV8 {
    let initialized = false;
    export function Ticket_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[Ticket] Initialized (starting=" + STARTING_TICKETS + ")");
    }
    export function Ticket_OnPlayerDied(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            Registry_DeductTickets(teamId, TICKET_LOSS_ON_DEATH);
        } catch (e) {
        }
    }
    export function Ticket_OnPlayerRevived(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            const current = Registry_GetTickets(teamId);
            Registry_SetTickets(teamId, current + TICKET_REFUND_ON_REVIVE);
        } catch (e) {
        }
    }
    export function Ticket_Tick(): void {
        const team1Owned = Objective_GetOwnedCount(1);
        const team2Owned = Objective_GetOwnedCount(2);
        if (team1Owned > team2Owned) {
            const advantage = team1Owned - team2Owned;
            const bleed = advantage * TICKET_BLEED_PER_FLAG_ADVANTAGE;
            Registry_DeductTickets(2, bleed);
            log("[Ticket] Bleed: T1 owns " + team1Owned + ", T2 owns " + team2Owned + ", bleeding T2 -" + bleed);
        } else if (team2Owned > team1Owned) {
            const advantage = team2Owned - team1Owned;
            const bleed = advantage * TICKET_BLEED_PER_FLAG_ADVANTAGE;
            Registry_DeductTickets(1, bleed);
            log("[Ticket] Bleed: T1 owns " + team1Owned + ", T2 owns " + team2Owned + ", bleeding T1 -" + bleed);
        }
    }
    export function Ticket_CheckWinCondition(): number {
        const t1 = Registry_GetTickets(1);
        const t2 = Registry_GetTickets(2);
        if (t1 <= 0 && t2 <= 0) {
            return 0;  // Draw
        } else if (t1 <= 0) {
            return 2;  // Team 2 wins
        } else if (t2 <= 0) {
            return 1;  // Team 1 wins
        }
        return 0;  // No winner yet
    }
    export function Ticket_Reset(): void {
        initialized = false;
        Registry_SetTickets(1, STARTING_TICKETS);
        Registry_SetTickets(2, STARTING_TICKETS);
        log("[Ticket] Reset");
    }
}


// Module: modules/HudModuleParseUI.ts
namespace ConquestV8 {
    const HUD_TEXT_COLOR = mod.CreateVector(1, 1, 1);
    const TEAM1_COLOR = mod.CreateVector(0.443, 0.918, 0.996);  // Cyan #71EAFE (Team 1 NATO)
    const TEAM2_COLOR = mod.CreateVector(1.0, 0.529, 0.396);    // Orange #FF8765 (Team 2 PAX)
    const NEUTRAL_COLOR = mod.CreateVector(0.5, 0.5, 0.5);      // Dark Gray (transparent)
    const CONTESTED_COLOR = mod.CreateVector(0.95, 0.78, 0.2);  // Orange/Yellow (keep for contested)
    const TICKET_BAR_WIDTH = 300;
    const TICKET_BAR_HEIGHT = 8;
    const TICKET_BAR_Y = 20;
    const TICKET_TEXT_Y = 40;
    const TICKET_TEXT_SIZE = 32;
    const FLAG_INDICATOR_SIZE = 35;      // Match old HUD: 35x35
    const FLAG_INDICATOR_Y = 45;         // Match old HUD Y position
    const FLAG_SPACING = 50;             // Match old HUD spacing
    const FLAG_LETTER_SIZE = 18;         // Match old HUD text size
    const CAPTURE_TEXT_Y = 135;
    const CAPTURE_TEXT_SIZE = 14;
    const PROGRESS_BAR_Y = 90;           // Match old HUD status bar Y
    const PROGRESS_BAR_WIDTH = 40;       // Match old HUD status bar width
    const PROGRESS_BAR_HEIGHT = 4;       // Match old HUD status bar height
    const FLAG_COUNT_Y = 105;            // Move closer to status bars
    const FLAG_COUNT_SIZE = 14;
    const HUD_UPDATE_INTERVAL = 0.0167; // 60Hz (match game frame rate for smooth pulsing)
    const PULSE_SPEED = 12.56; // Radians per second (two full pulses per second)
    let hudActive = false;
    let pulsePhase = 0;
    let lastUpdateTime = 0;
    let sortedObjectives: ObjectiveState[] = []; // Cache sorted objectives for consistent display
    const flagIndexByObjId = new Map<number, number>();
    const flagLetterByObjId = new Map<number, string>();
    const DEFAULT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    interface FlagState {
        ownerId: number;        // 0=neutral, 1=NATO, 2=PAX
        capturing: boolean;     // Is being captured?
        contested: boolean;     // Multiple teams present?
        capturingTeam: number;  // Which team is capturing (0=none)
        progress: number;       // 0.0 to 1.0
    }
    const flagStates = new Map<number, FlagState>();
    const widgetCache = new Map<string, mod.UIWidget>();
    const messageCache = new Map<string, mod.Message>();
    function getCachedMessage(text: string | number): mod.Message {
        const key = String(text);
        if (!messageCache.has(key)) {
            messageCache.set(key, mod.Message("{}", text));
        }
        return messageCache.get(key)!;
    }
    function findWidget(name: string): mod.UIWidget | null {
        if (widgetCache.has(name)) return widgetCache.get(name)!;
        const w = mod.FindUIWidgetWithName(name);
        if (w) widgetCache.set(name, w);
        return w;
    }
    function safeCall(context: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
        }
    }
    export function initHudParseUI(): void {
        try {
            hudActive = false;
            pulsePhase = 0;
            lastUpdateTime = now(true);
            widgetCache.clear();
            flagStates.clear();
            sortedObjectives = Registry_GetObjectives();
            sortedObjectives.sort((a, b) => a.letter.localeCompare(b.letter));
            for (let i = 0; i < sortedObjectives.length; i++) {
                const objId = sortedObjectives[i].objId;
                const letter = sortedObjectives[i].letter; // Use actual letter from Registry
                flagIndexByObjId.set(objId, i);
                flagLetterByObjId.set(objId, letter);
                getCachedMessage(letter);
                getCachedMessage("CAPTURING");
                flagStates.set(objId, {
                    ownerId: 0,
                    capturing: false,
                    contested: false,
                    capturingTeam: 0,
                    progress: 0
                });
            }
            log(`[ConquestV10][HUDParseUI] Initialized with ${sortedObjectives.length} objectives`);
        } catch (e) {
            log(`[ConquestV10][HUDParseUI] Init error: ${e}`);
        }
    }
    export function startHudParseUI(): void {
        if (hudActive) return;
        hudActive = true;
        createHudWidgets();
        hudUpdateLoop();
        log(`[ConquestV10][HUDParseUI] Started`);
    }
    export function stopHudParseUI(): void {
        hudActive = false;
        log(`[ConquestV10][HUDParseUI] Stopped`);
    }
    function getLocalTeamIds(): { friendly: number; enemy: number } {
        const hostPlayer = tryGetHostPlayer();
        const friendly = hostPlayer ? getPlayerTeamId(hostPlayer) : 1;
        const enemy = friendly === 1 ? 2 : 1;
        return { friendly, enemy };
    }
    function createHudWidgets(): void {
        if (!ENABLE_GAMEPLAY_HUD) return;
        createTicketBars();
        createFlagIndicators();
        createFlagCountDisplay();
    }
    function createTicketBars(): void {
        const team1X = -400;
        mod.AddUIText(
            "Team1TicketBarBg",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bg = findWidget("Team1TicketBarBg");
        if (t1bg) {
            safeCall("T1BarBg", () => {
                mod.SetUIWidgetBgColor(t1bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t1bg, 0);
                mod.SetUIWidgetBgFill(t1bg, mod.UIBgFill.Solid);
            });
        }
        mod.AddUIText(
            "Team1TicketBar",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bar = findWidget("Team1TicketBar");
        if (t1bar) {
            safeCall("T1Bar", () => {
                mod.SetUIWidgetBgColor(t1bar, TEAM1_COLOR);
                mod.SetUIWidgetBgAlpha(t1bar, 0.9);
                mod.SetUIWidgetBgFill(t1bar, mod.UIBgFill.Solid);
            });
        }
        mod.AddUIText(
            "Team1Tickets",
            mod.CreateVector(team1X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t1txt = findWidget("Team1Tickets");
        if (t1txt) {
            safeCall("T1Txt", () => {
                mod.SetUITextColor(t1txt, TEAM1_COLOR);
                mod.SetUITextSize(t1txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t1txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t1txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t1txt, 0.6);
                mod.SetUIWidgetBgFill(t1txt, mod.UIBgFill.Solid);
            });
        }
        const team2X = 400;
        mod.AddUIText(
            "Team2TicketBarBg",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bg = findWidget("Team2TicketBarBg");
        if (t2bg) {
            safeCall("T2BarBg", () => {
                mod.SetUIWidgetBgColor(t2bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t2bg, 0);
                mod.SetUIWidgetBgFill(t2bg, mod.UIBgFill.Solid);
            });
        }
        mod.AddUIText(
            "Team2TicketBar",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bar = findWidget("Team2TicketBar");
        if (t2bar) {
            safeCall("T2Bar", () => {
                mod.SetUIWidgetBgColor(t2bar, TEAM2_COLOR);
                mod.SetUIWidgetBgAlpha(t2bar, 0.9);
                mod.SetUIWidgetBgFill(t2bar, mod.UIBgFill.Solid);
            });
        }
        mod.AddUIText(
            "Team2Tickets",
            mod.CreateVector(team2X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t2txt = findWidget("Team2Tickets");
        if (t2txt) {
            safeCall("T2Txt", () => {
                mod.SetUITextColor(t2txt, TEAM2_COLOR);
                mod.SetUITextSize(t2txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t2txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t2txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t2txt, 0.6);
                mod.SetUIWidgetBgFill(t2txt, mod.UIBgFill.Solid);
            });
        }
    }
    function createFlagIndicators(): void {
        const count = sortedObjectives.length;
        const totalWidth = (count - 1) * FLAG_SPACING;
        const startX = -totalWidth / 2;
        for (let i = 0; i < count; i++) {
            const objId = sortedObjectives[i].objId;
            const letter = sortedObjectives[i].letter; // Use actual letter from objective
            const xPos = startX + i * FLAG_SPACING;
            mod.AddUIText(
                `FlagShape_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const shape = findWidget(`FlagShape_${i}`);
            if (shape) {
                safeCall("FlagShape", () => {
                    mod.SetUIWidgetBgColor(shape, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(shape, 0.9); // Visible outline
                    mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThick); // OUTLINE not solid
                    mod.SetUIWidgetVisible(shape, true);
                });
            }
            mod.AddUIText(
                `FlagLetter_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", letter)
            );
            const letterWidget = findWidget(`FlagLetter_${i}`);
            if (letterWidget) {
                safeCall("FlagLetter", () => {
                    mod.SetUITextColor(letterWidget, NEUTRAL_COLOR); // Letter color changes with team
                    mod.SetUITextSize(letterWidget, FLAG_LETTER_SIZE);
                    mod.SetUITextAnchor(letterWidget, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(letterWidget, 0); // Transparent background
                    mod.SetUIWidgetBgFill(letterWidget, mod.UIBgFill.None);
                    mod.SetUIWidgetVisible(letterWidget, true);
                });
            }
            mod.AddUIText(
                `CapturingText_${i}`,
                mod.CreateVector(xPos, CAPTURE_TEXT_Y, 0),
                mod.CreateVector(100, 20, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const capText = findWidget(`CapturingText_${i}`);
            if (capText) {
                safeCall("CapText", () => {
                    mod.SetUITextColor(capText, HUD_TEXT_COLOR);
                    mod.SetUITextSize(capText, CAPTURE_TEXT_SIZE);
                    mod.SetUITextAnchor(capText, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(capText, 0);
                    mod.SetUIWidgetVisible(capText, false);
                });
            }
            mod.AddUIText(
                `ProgressBarBg_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbg = findWidget(`ProgressBarBg_${i}`);
            if (pbg) {
                safeCall("ProgressBg", () => {
                    mod.SetUIWidgetBgColor(pbg, mod.CreateVector(0.2, 0.2, 0.2));
                    mod.SetUIWidgetBgAlpha(pbg, 0); // Transparent background
                    mod.SetUIWidgetBgFill(pbg, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbg, false);
                });
            }
            mod.AddUIText(
                `ProgressBar_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(0, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbar = findWidget(`ProgressBar_${i}`);
            if (pbar) {
                safeCall("Progress", () => {
                    mod.SetUIWidgetBgColor(pbar, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(pbar, 0.9);
                    mod.SetUIWidgetBgFill(pbar, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbar, false);
                });
            }
        }
    }
    function createFlagCountDisplay(): void {
        mod.AddUIText(
            "FlagCountText",
            mod.CreateVector(0, FLAG_COUNT_Y, 0),
            mod.CreateVector(300, 25, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const fct = findWidget("FlagCountText");
        if (fct) {
            safeCall("FlagCount", () => {
                mod.SetUITextColor(fct, HUD_TEXT_COLOR);
                mod.SetUITextSize(fct, FLAG_COUNT_SIZE);
                mod.SetUITextAnchor(fct, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(fct, 0);
            });
        }
    }
    async function hudUpdateLoop(): Promise<void> {
        while (hudActive) {
            try {
                pulsePhase += 0.21;
                if (pulsePhase > Math.PI * 2) pulsePhase -= Math.PI * 2;
                updateTicketBars();
                updateFlagStates();
                updateFlagIndicators();
                updateFlagCount();
            } catch (e) {
            }
            await mod.Wait(HUD_UPDATE_INTERVAL);
        }
    }
    function updateTicketBars(): void {
        const { friendly, enemy } = getLocalTeamIds();
        const t1Tickets = getTickets(friendly);
        const t2Tickets = getTickets(enemy);
        const maxTickets = STARTING_TICKETS || 1;
        const t1Ratio = Math.max(0, Math.min(1, t1Tickets / maxTickets));
        const t2Ratio = Math.max(0, Math.min(1, t2Tickets / maxTickets));
        const t1bar = findWidget("Team1TicketBar");
        if (t1bar) {
            safeCall("T1BarWidth", () => {
                const width = Math.max(10, TICKET_BAR_WIDTH * t1Ratio);
                mod.SetUIWidgetSize(t1bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
        }
        const t2bar = findWidget("Team2TicketBar");
        if (t2bar) {
            safeCall("T2BarWidth", () => {
                const width = Math.max(10, TICKET_BAR_WIDTH * t2Ratio);
                mod.SetUIWidgetSize(t2bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
        }
        const t1txt = findWidget("Team1Tickets");
        if (t1txt) {
            safeCall("T1TxtSet", () => mod.SetUITextLabel(t1txt, mod.Message("{}", Math.floor(t1Tickets))));
        }
        const t2txt = findWidget("Team2Tickets");
        if (t2txt) {
            safeCall("T2TxtSet", () => mod.SetUITextLabel(t2txt, mod.Message("{}", Math.floor(t2Tickets))));
        }
    }
    function updateFlagStates(): void {
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (!cp) continue;
                const objId = mod.GetObjId(cp);
                const state = flagStates.get(objId);
                if (!state) continue;
                const ownerTeam = mod.GetCurrentOwnerTeam(cp);
                state.ownerId = ownerTeam ? mod.GetObjId(ownerTeam) : 0;
                const presence = getPresenceOnPoint(cp);
                state.contested = presence.team1 > 0 && presence.team2 > 0;
                const rawProgress = mod.GetCaptureProgress(cp);
                state.progress = Math.max(0, Math.min(1, rawProgress));
                let progressTeamId = 0;
                try {
                    const progressTeam = mod.GetOwnerProgressTeam(cp);
                    progressTeamId = progressTeam ? mod.GetObjId(progressTeam) : 0;
                } catch (_e) {
                    progressTeamId = 0;
                }
                state.capturingTeam = (progressTeamId === 1 || progressTeamId === 2)
                    ? progressTeamId
                    : determineCapturingTeam(state.ownerId, presence, state.contested);
                state.capturing = state.capturingTeam !== 0 && state.progress > 0 && state.progress < 1;
            }
        } catch (e) {
        }
    }
    function getPresenceOnPoint(cp: mod.CapturePoint): { team1: number; team2: number } {
        let team1 = 0;
        let team2 = 0;
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) team1++;
                else if (tid === 2) team2++;
            }
        } catch (e) {
        }
        return { team1, team2 };
    }
    function determineCapturingTeam(owner: number, presence: { team1: number; team2: number }, contested: boolean): number {
        if (contested) return 0;
        if (owner === 0) {
            if (presence.team1 > 0 && presence.team2 === 0) return 1;
            if (presence.team2 > 0 && presence.team1 === 0) return 2;
            return 0;
        }
        if (owner === 1 && presence.team2 > 0 && presence.team1 === 0) return 2;
        if (owner === 2 && presence.team1 > 0 && presence.team2 === 0) return 1;
        return 0;
    }
    function updateFlagIndicators(): void {
        for (let i = 0; i < sortedObjectives.length; i++) {
            const objId = sortedObjectives[i].objId;
            const state = flagStates.get(objId);
            if (!state) continue;
            updateFlagShape(i, state);
            updateFlagCapturingText(i, state);
            updateFlagProgressBar(i, state);
        }
    }
    function updateFlagShape(index: number, state: FlagState): void {
        const shape = findWidget(`FlagShape_${index}`);
        if (!shape) return;
        const { friendly: myTeamId } = getLocalTeamIds();
        let color: mod.Vector;
        let baseSize = FLAG_INDICATOR_SIZE; // All flags same size
        if (state.ownerId === myTeamId && state.ownerId !== 0) {
            color = TEAM1_COLOR;
        } else if (state.ownerId !== 0 && state.ownerId !== myTeamId) {
            color = TEAM2_COLOR;
        } else {
            color = NEUTRAL_COLOR;
        }
        let alpha = 0.85; // More opaque for better visibility
        let size = baseSize;
        if (state.contested || state.capturing) {
            const pulse = (Math.sin(pulsePhase) + 1) / 2; // Smoothly oscillates 0 to 1
            alpha = 0.0 + 1.0 * pulse; // Fade from invisible (0.0) to fully visible (1.0)
            if (state.contested) {
                color = CONTESTED_COLOR;
            } else if (state.capturing) {
                color = state.capturingTeam === myTeamId ? TEAM1_COLOR : TEAM2_COLOR;
            }
        }
        safeCall("ShapeUpdate", () => {
            mod.SetUIWidgetBgColor(shape, color);
            mod.SetUIWidgetBgAlpha(shape, alpha);
            mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThin); // THIN outline for cleaner look
            mod.SetUIWidgetSize(shape, mod.CreateVector(size, size, 0));
        });
        const letterWidget = findWidget(`FlagLetter_${index}`);
        if (letterWidget) {
            safeCall("LetterUpdate", () => {
                mod.SetUITextColor(letterWidget, color);
                mod.SetUITextAlpha(letterWidget, alpha); // Letter fades with shape
            });
        }
    }
    function updateFlagCapturingText(index: number, state: FlagState): void {
        const capText = findWidget(`CapturingText_${index}`);
        if (!capText) return;
        safeCall("CapTextUpdate", () => {
            mod.SetUIWidgetVisible(capText, false);
        });
    }
    function updateFlagProgressBar(index: number, state: FlagState): void {
        const pbg = findWidget(`ProgressBarBg_${index}`);
        const pbar = findWidget(`ProgressBar_${index}`);
        if (!pbg || !pbar) return;
        const { friendly: myTeamId } = getLocalTeamIds();
        const shouldShow = state.capturing || state.contested;
        safeCall("ProgressVis", () => {
            mod.SetUIWidgetVisible(pbg, shouldShow);
            mod.SetUIWidgetVisible(pbar, shouldShow);
            if (shouldShow) {
                const width = Math.max(2, PROGRESS_BAR_WIDTH * state.progress);
                mod.SetUIWidgetSize(pbar, mod.CreateVector(width, PROGRESS_BAR_HEIGHT, 0));
                let color = NEUTRAL_COLOR;
                if (state.contested) {
                    color = CONTESTED_COLOR;
                } else if (state.capturingTeam === myTeamId) {
                    color = TEAM1_COLOR;
                } else if (state.capturingTeam !== 0) {
                    color = TEAM2_COLOR;
                }
                mod.SetUIWidgetBgColor(pbar, color);
            }
        });
    }
    function updateFlagCount(): void {
    }
}


// Module: modules/WorldIconModule.ts
namespace ConquestV8 {
    const TEAM1_HQ_ICON_OBJID = 1502;
    const TEAM2_HQ_ICON_OBJID = 1503;
    const BLUE_COLOR = mod.CreateVector(0.443, 0.918, 0.996);   // NATO cyan #71EAFE
    const RED_COLOR = mod.CreateVector(1.0, 0.529, 0.396);      // PAX orange #FF8765
    let matchCount = 0;
    let team1Icon: mod.WorldIcon | null = null;
    let team2Icon: mod.WorldIcon | null = null;
    export function initWorldIconModule(): void {
        matchCount++;
        log(`[ConquestV10][WorldIcon] Initializing (match #${matchCount})`);
        safeCall("WorldIcon:GetTeam1", () => {
            team1Icon = mod.GetWorldIcon(TEAM1_HQ_ICON_OBJID);
        });
        safeCall("WorldIcon:GetTeam2", () => {
            team2Icon = mod.GetWorldIcon(TEAM2_HQ_ICON_OBJID);
        });
        if (!team1Icon || !team2Icon) {
            log(`[ConquestV10][WorldIcon] WARNING: Could not find HQ icons (T1=${team1Icon ? "OK" : "MISSING"}, T2=${team2Icon ? "OK" : "MISSING"})`);
            return;
        }
        const team1Faction = getTeamFaction(1);
        const team2Faction = getTeamFaction(2);
        const team1Color = team1Faction === mod.Factions.PaxArmata ? RED_COLOR : BLUE_COLOR;
        const team2Color = team2Faction === mod.Factions.PaxArmata ? RED_COLOR : BLUE_COLOR;
        safeCall("WorldIcon:Team1", () => {
            if (team1Icon) mod.SetWorldIconColor(team1Icon, team1Color);
        });
        safeCall("WorldIcon:Team2", () => {
            if (team2Icon) mod.SetWorldIconColor(team2Icon, team2Color);
        });
        log(`[ConquestV10][WorldIcon] Colors by faction (match #${matchCount}) - T1=${getTeamFactionLabel(1)}, T2=${getTeamFactionLabel(2)}`);
    }
}


// Module: main.script.ts
namespace ConquestV8 {
    let running = false;
    let runToken = 0;
    const QUOTA_AUTOEND_ENABLED = true;
    const QUOTA_CHECK_DELAY_SECONDS = 15.0;   // Wait for spawning to complete
    const QUOTA_THRESHOLD_PERCENT = 0.60;     // Auto-end if < 60% of target bots
    const TARGET_BOTS_PER_TEAM = 31;          // Expected full quota (sync with SpawnRecycle)
    let quotaCheckPerformed = false;          // Only check once per match
    export function OnGameModeStarted(): void {
        const currentPortalRound = Registry_IncrementPortalRoundNumber();
        quotaCheckPerformed = false;
        log("=".repeat(60));
        log(`Conquest V8 Starting - Build ${BUILD_ID}`);
        log(`Portal Round: ${currentPortalRound}`);
        log("Soft-Influence Mode: ObjectiveBiasModule + Gentle Director");
        if (QUOTA_AUTOEND_ENABLED) {
            log(`[QUOTA] Will check bot population after ${QUOTA_CHECK_DELAY_SECONDS}s`);
        }
        log("=".repeat(60));
        running = false;
        runToken++;
        Registry_Reset();
        Objective_Reset();
        CapturePoint_Reset();
        SpawnRecycle_Reset();  // TRUE RECYCLING - handles both initial spawns and recycling
        ObjectiveBias_Reset();
        Director_Reset();
        Ticket_Reset();
        resetFactionCache();
        Registry_SetRoundStartTime(mod.GetMatchTimeElapsed());
        Registry_SetRoundState(RoundState.PreRound);
        initializeMapConfig();
        Objective_Init();
        CapturePoint_Init();
        CapturePoint_EnableAll();
        SpawnRecycle_Init();  // Handles initial spawns AND recycling (replaces AISpawnModule)
        ObjectiveBias_Init();
        Director_Init();
        Ticket_Init();
        initHudParseUI();
        startHudParseUI();
        initScoreboardModule();
        initSoundsModule();
        initVehicleDirector();
        initAircraftCombat();
        initVehicleSpawnUIParseUI();
        initWorldIconModule();
        running = true;
        const token = runToken;
        tickLoop(token);
    }
    async function tickLoop(token: number): Promise<void> {
        while (running && token === runToken) {
            const currentTime = mod.GetMatchTimeElapsed();
            const roundState = Registry_GetRoundState();
            if (roundState === RoundState.PreRound) {
                safeCall("SpawnRecycle_Start", () => SpawnRecycle_Start());
                safeCall("SpawnRecycle_Tick", () => SpawnRecycle_Tick()); // Process spawn batches!
                safeCall("VehicleDirector:PreRound", () => VehicleDirector_PreRoundTick());
                const stats = SpawnRecycle_GetStats();
                if (stats.team1Alive > 0 && stats.team2Alive > 0) {
                    log("Pre-round spawn complete - starting match!");
                    log(`[SpawnRecycle] Initial bots: T1=${stats.team1Alive} T2=${stats.team2Alive}`);
                    Registry_SetRoundState(RoundState.Active);
                    log("Round started - TRUE RECYCLING active");
                }
            } else if (roundState === RoundState.Active) {
                safeCall("SpawnRecycle", () => SpawnRecycle_Tick());
                safeCall("Objective", () => Objective_Tick());
                safeCall("ObjectiveBias", () => ObjectiveBias_Tick(currentTime));
                safeCall("Director", () => Director_Tick(currentTime));
                safeCall("Ticket", () => Ticket_Tick());
                safeCall("Scoreboard", () => tickScoreboard());
                safeCall("VehicleDirector", () => tickVehicleDirector());
                safeCall("AircraftCombat", () => tickAircraftCombat());
                safeCall("VehicleSpawnUI", () => tickVehicleUIParseUI());
                safeCall("Sounds", () => {
                    const cps = mod.AllCapturePoints();
                    const count = mod.CountOf(cps);
                    for (let i = 0; i < count; i++) {
                        const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                        if (cp) {
                            Sounds_notifyCaptureStatus(cp);
                            Sounds_notifyCaptureTick(cp);
                        }
                    }
                });
                const winner = Ticket_CheckWinCondition();
                if (winner !== 0) {
                    endRound(winner);
                    break;
                }
                if (QUOTA_AUTOEND_ENABLED && !quotaCheckPerformed) {
                    const roundElapsed = currentTime - Registry_GetRoundStartTime();
                    if (roundElapsed >= QUOTA_CHECK_DELAY_SECONDS) {
                        quotaCheckPerformed = true; // Only check once
                        const stats = SpawnRecycle_GetStats();
                        const totalBots = stats.team1Total + stats.team2Total;
                        const expectedBots = TARGET_BOTS_PER_TEAM * 2;
                        const ratio = totalBots / expectedBots;
                        log(`[QUOTA] Bot check: ${totalBots}/${expectedBots} (${(ratio * 100).toFixed(0)}%)`);
                        if (ratio < QUOTA_THRESHOLD_PERCENT) {
                            log(`[QUOTA] Below threshold (${(QUOTA_THRESHOLD_PERCENT * 100).toFixed(0)}%) - auto-ending`);
                            log(`[QUOTA] Next round will have full AI quota - starting real match`);
                            const obj1 = Objective_GetOwnedCount(1);
                            const obj2 = Objective_GetOwnedCount(2);
                            const autoWinner = obj1 >= obj2 ? 1 : 2;
                            endRound(autoWinner);
                            break;
                        } else {
                            log(`[QUOTA] Full quota available - continuing match normally`);
                        }
                    }
                }
            }
            await mod.Wait(TICK_INTERVAL_SECONDS);
        }
    }
    function endRound(winningTeam: number): void {
        running = false;
        Registry_SetRoundState(RoundState.Ending);
        log("Round ended - Team " + winningTeam + " wins!");
        if (ENABLE_WIN_CONDITION_LOGS) {
            const t1 = getTickets(1);
            const t2 = getTickets(2);
            const o1 = Objective_GetOwnedCount(1);
            const o2 = Objective_GetOwnedCount(2);
            log(`[WinCondition] endRound winner=${winningTeam} t1=${t1} t2=${t2} o1=${o1} o2=${o2}`);
        }
        const team = mod.GetTeam(winningTeam);
        if (team) {
            mod.EndGameMode(team);
        }
    }
    function safeCall(label: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            logError(label + " tick failed: " + e);
        }
    }
    export function OnGameModeEnded(): void {
        running = false;
        log("Game mode ended");
        if (ENABLE_WIN_CONDITION_LOGS) {
            const t1 = getTickets(1);
            const t2 = getTickets(2);
            const o1 = Objective_GetOwnedCount(1);
            const o2 = Objective_GetOwnedCount(2);
            log(`[WinCondition] gameModeEnded t1=${t1} t2=${t2} o1=${o1} o2=${o2}`);
        }
    }
    export function OnPlayerJoinGame(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            log("Player connected to team " + teamId);
        } catch (e) {
        }
    }
    export function OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        const isAI = isAISoldier(player);
        const teamId = getPlayerTeamId(player);
        const playerId = mod.GetObjId(player);
        log(`[Deployed] ${isAI ? "AI" : "Human"} team=${teamId} id=${playerId}`);
        if (!isAI) {
            safeCall("MarkDeployed", () => markPlayerDeployed(player));
            safeCall("VehicleUI:Deployed", () => vehicleUI_OnPlayerDeployed(player));
            safeCall("SkipManDown", () => mod.SkipManDown(player, false));
            safeCall("VehicleUI:Hide", () => onPlayerDeployedHideVehicleUIParseUI(player));
            return;
        }
        safeCall("MarkDeployed", () => markPlayerDeployed(player));
        safeCall("VehicleUI:Deployed", () => vehicleUI_OnPlayerDeployed(player));
        safeCall("SkipManDown", () => mod.SkipManDown(player, false));
        safeCall("SpawnRecycle:OnPlayerDeployed", () => SpawnRecycle_OnPlayerDeployed(player));
        safeCall("AILoadout", () => equipAILoadout(player));
        safeCall("AIBattlefield", () => mod.AIBattlefieldBehavior(player));
    }
    export function OnPlayerUndeploy(player: mod.Player): void {
        if (!player) return;
        safeCall("MarkUndeployed", () => markPlayerUndeployed(player));
        safeCall("VehicleUI:Undeployed", () => vehicleUI_OnPlayerUndeployed(player));
    }
    export function OnPlayerUIButtonEvent(
        eventPlayer: mod.Player,
        eventUIWidget: mod.UIWidget,
        eventUIButtonEvent: mod.UIButtonEvent
    ): void {
        if (!eventPlayer || !eventUIWidget) return;
        safeCall("VehicleUI:ButtonPress", () => {
            handleVehicleButtonPressParseUI(eventPlayer, eventUIWidget, eventUIButtonEvent);
        });
    }
    export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
        if (!player || !spawner) return;
        safeCall("MarkDeployed", () => markPlayerDeployed(player));
        safeCall("SpawnRecycle:OnSpawnerSpawned", () => SpawnRecycle_OnSpawnerSpawned(player, spawner));
    }
    export function OnCapturePointCaptured(cp: mod.CapturePoint): void {
        CapturePoint_OnCaptured(cp);
    }
    export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerEnterCapturePoint(player, cp);
        } catch (e) {
        }
    }
    export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerExitCapturePoint(player);
        } catch (e) {
        }
    }
    export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
        SpawnRecycle_OnBotDied(player);
        Ticket_OnPlayerDied(player);
        Scoreboard_recordDeath(player);
        if (killer) {
            Scoreboard_recordKill(killer, player);
        }
        const isAI = isAISoldier(player);
        if (!isAI) {
            safeCall("VehicleUI:Death", () => onPlayerDiedShowUIParseUI(player));
        }
    }
    export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
        safeCall("SpawnRecycle:Mandown", () => SpawnRecycle_OnBotMandown(eventPlayer));
    }
    export function OnRevived(revived: mod.Player, reviver: mod.Player): void {
        Ticket_OnPlayerRevived(revived);
        Scoreboard_recordRevive(reviver);
    }
    export function OnVehicleSpawned(vehicle: mod.Vehicle): void {
        safeCall("VehicleUI:VehicleSpawned", () => vehicleUI_OnVehicleSpawned(vehicle));
        safeCall("VehicleDirector:OnVehicleSpawned", () => VehicleDirector_OnVehicleSpawned(vehicle));
    }
    export function OnVehicleDestroyed(vehicle: mod.Vehicle, destroyer: mod.Player, weapon: mod.WeaponUnlock): void {
        if (destroyer) {
            Scoreboard_recordVehicleKill(destroyer, vehicle);
        }
    }
}


// Global Portal Event Handlers
export function OnGameModeStarted(): void {
    console.log("[ConquestV10] OnGameModeStarted - Soft-Influence Mode");
    ConquestV8.OnGameModeStarted();
}

export function OnGameModeEnded(): void {
    console.log("[ConquestV10] OnGameModeEnded");
    ConquestV8.OnGameModeEnded();
}

export function OnPlayerJoinGame(player: mod.Player): void {
    ConquestV8.OnPlayerJoinGame(player);
}

export function OnPlayerDeployed(player: mod.Player): void {
    ConquestV8.OnPlayerDeployed(player);
}

export function OnPlayerUndeploy(player: mod.Player): void {
    ConquestV8.OnPlayerUndeploy(player);
}

export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
    ConquestV8.OnSpawnerSpawned(player, spawner);
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent): void {
    ConquestV8.OnPlayerUIButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
    ConquestV8.OnPlayerEnterCapturePoint(player, cp);
}

export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
    ConquestV8.OnPlayerExitCapturePoint(player, cp);
}

export function OnCapturePointCaptured(cp: mod.CapturePoint): void {
    ConquestV8.OnCapturePointCaptured(cp);
}

export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
    ConquestV8.OnPlayerDied(player, killer, deathType, weapon);
}

export function OnRevived(revived: mod.Player, reviver: mod.Player): void {
    ConquestV8.OnRevived(revived, reviver);
}

export function OnVehicleSpawned(vehicle: mod.Vehicle): void {
    ConquestV8.OnVehicleSpawned(vehicle);
}

export function OnVehicleDestroyed(vehicle: mod.Vehicle, destroyer: mod.Player, weapon: mod.WeaponUnlock): void {
    ConquestV8.OnVehicleDestroyed(vehicle, destroyer, weapon);
}

