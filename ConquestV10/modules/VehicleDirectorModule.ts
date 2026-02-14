/// <reference path="../config/ConquestConfig.ts" />

/**
 * VehicleDirectorModule - Enhanced AI Vehicle Management (v2 - Reduced Error Spam)
 * 
 * IMPORTANT: GetPlayerFromVehicleSeat throws InvalidValue on many vehicle types
 * even for valid empty seats. This causes massive error spam in the logs.
 * 
 * This version uses a safer approach:
 * - Only check seat 0 (driver) to see if vehicle is in use
 * - Try ForcePlayerToSeat without pre-checking seat occupancy
 * - ForcePlayerToSeat will fail silently if seat is occupied
 */

namespace ConquestV8 {
    let vehicleModuleInitialized = false;
    let vehicleSpawnersConfigured = false;
    let spawnerVerifyTime = -9999;

    /**
     * Periodically verify spawner settings are maintained
     */
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

    // Cache of vehicles we've already tried to fill recently (avoid spamming same vehicle)
    const recentlyProcessedVehicles: Map<number, number> = new Map();
    const VEHICLE_COOLDOWN_SECONDS = 10.0;
    const lastSeatDebugByVehicleId: Map<number, number> = new Map();
    const vehicleTeamCacheByVehicleId: Map<number, number> = new Map();

    // Track jet pilot behavior refresh times to avoid idling/bailing
    const lastJetBehaviorByPilotId: Map<number, number> = new Map();
    // ConquestV6-style one-time behavior application per pilot
    const jetPilotsWithBehavior: Set<number> = new Set();

    // Vehicle spawner IDs from the map (Eastwood)
    // GROUND VEHICLES (safe to auto-spawn - don't fall from sky)
    // Team 1: Flyer(202), AH64(203), Leopard(204), Flyer(207), Gepard(208), UH60(238), AH64(242), M2Bradley(252), Marauder(253)
    // Team 2: Abrams(209), Eurocopter(211), Vector(215), Cheetah(234), UH60_Pax(239), Eurocopter(241), Vector(247), CV90(248), Marauder_Pax(249)
    // NOTE: All 4 jets (232, 233, 243, 244) are sky jets
    const GROUND_VEHICLE_SPAWNER_IDS = [
        // Team 1 (ground + helis that can hover)
        202, 203, 204, 207, 208, 238, 242, 252, 253,
        // Team 2 (ground + helis that can hover)
        209, 211, 215, 234, 239, 241, 247, 248, 249
    ];

    const TEAM1_GROUND_VEHICLE_SPAWNER_IDS = [202, 203, 204, 207, 208, 238, 242, 252, 253];
    const TEAM2_GROUND_VEHICLE_SPAWNER_IDS = [209, 211, 215, 234, 239, 241, 247, 248, 249];

    // SKY JET SPAWNERS - DO NOT auto-spawn (jets fall without pilots!)
    // Downtown: ALL 4 jets are sky jets (no runways)
    // Team 1: F22(232), F16(243)  Team 2: JAS39(233), SU57(244)
    const SKY_JET_SPAWNER_IDS = [232, 243, 233, 244];
    const TEAM1_SKY_JET_SPAWNERS = [232, 243];  // F22, F16
    const TEAM2_SKY_JET_SPAWNERS = [233, 244];  // JAS39, SU57

    // All vehicle spawners (for abandonment settings)
    const ALL_VEHICLE_SPAWNER_IDS = [...GROUND_VEHICLE_SPAWNER_IDS, ...SKY_JET_SPAWNER_IDS];

    // Cache vehicle spawner positions for pathfinding
    const vehicleSpawnerPositions: mod.Vector[] = [];
    const vehicleSpawnerPositionsByTeam: { pos: mod.Vector; teamId: number }[] = [];
    let vehicleSpawnerPositionsCached = false;

    // Vehicle spawner base settings - USE MAP DEFAULTS (don't override)
    // Map has: P_TimeUntilAbandon=20, P_ApplyDamageToAbandonVehicle=true, P_AbandonVehiclesOutOfCombatArea=true
    // This allows vehicles abandoned at objectives to be damaged and eventually respawn
    const USE_MAP_ABANDONMENT_SETTINGS = true; // Set to false to override with script values
    const SCRIPT_ABANDON_TIME = 30.0;   // Only used if USE_MAP_ABANDONMENT_SETTINGS=false
    const SCRIPT_ABANDON_RADIUS = 50.0; // Only used if USE_MAP_ABANDONMENT_SETTINGS=false

    /**
     * Configure vehicle spawner settings.
     * 
     * IMPORTANT: The map already has good abandonment settings:
     * - P_TimeUntilAbandon: 20 seconds
     * - P_ApplyDamageToAbandonVehicle: true (damages abandoned vehicles)
     * - P_AbandonVehiclesOutOfCombatArea: true (respawns vehicles taken out of bounds)
     * - P_KeepAliveAbandonRadius: 50m (keeps vehicles near spawner alive)
     * 
     * We ONLY modify:
     * - AutoSpawn: Disable for sky jets (they fall without pilots)
     * - Everything else: Leave as map default
     */
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

                // Cache the spawner position for HQ-exemption checks
                const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
                if (spawnerPos) {
                    vehicleSpawnerPositions.push(spawnerPos);
                    let teamId = 0;
                    if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 1;
                    else if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 2;
                    if (teamId) vehicleSpawnerPositionsByTeam.push({ pos: spawnerPos, teamId });
                }

                // Sky jets need special handling - disable auto-spawn (they fall without pilots)
                const isSkyJet = SKY_JET_SPAWNER_IDS.includes(spawnerId);
                if (isSkyJet) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                } else if (!PRESERVE_MAP_GROUND_AUTOSPAWN) {
                    // When not preserving map defaults, disable ground auto-spawn
                    // so scripted spawning can control timing.
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                }

                if (USE_MAP_ABANDONMENT_SETTINGS) {
                    // PRESERVE MAP DEFAULTS - don't override abandonment settings
                    // This lets the map's 20-second abandon timer work properly
                    // Abandoned vehicles at objectives will be damaged and respawn at HQ
                    if (isSkyJet) {
                        log(`[ConquestV10][VehicleDirector] Sky jet spawner ${spawnerId} - auto-spawn DISABLED, map abandonment preserved`);
                    } else if (PRESERVE_MAP_GROUND_AUTOSPAWN) {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn PRESERVED (map), map abandonment preserved`);
                    } else {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn DISABLED (script), map abandonment preserved`);
                    }
                } else {
                    // Override with script values (for testing)
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

        // Fallback: if configureVehicleSpawners didn't populate positions (e.g. called before map ready),
        // try to populate them now.
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
                // ignore
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

    /**
     * Public API: Check if a position is near any vehicle spawner (for AI behavior)
     */
    export function isPositionNearVehicleSpawner(position: mod.Vector, radiusMeters: number): boolean {
        ensureVehicleSpawnerPositions();
        return isNearAnyVehicleSpawner(position, radiusMeters);
    }

    /**
     * Public API: Get all vehicle spawner positions (for AI pathfinding)
     */
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

        // Configure spawner settings immediately
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
                    // ignore
                }
            }
            for (const pid of lastJetBehaviorByPilotId.keys()) {
                if (!activeIds.has(pid)) {
                    lastJetBehaviorByPilotId.delete(pid);
                }
            }
        } catch (_e) {
            // ignore
        }
    }

    function getSkyJetVehicleTypeForSpawner(spawnerId: number): mod.VehicleList {
        // Map spawner IDs to vehicle types for Downtown
        switch (spawnerId) {
            case 232: return mod.VehicleList.F22;     // Team 1 F22
            case 243: return mod.VehicleList.F16;     // Team 1 F16
            case 233: return mod.VehicleList.JAS39;   // Team 2 JAS39
            case 244: return mod.VehicleList.SU57;    // Team 2 SU57
            default:  return mod.VehicleList.F16;     // Fallback
        }
    }

    function getSkyJetVehicleTypeForTeam(teamId: number): mod.VehicleList {
        // Legacy function - returns one type per team (used for counting)
        return teamId === 1 ? mod.VehicleList.F16 : mod.VehicleList.SU57;
    }

    // Returns the NEXT spawner to use for this team (alternates between spawners)
    function getSkyJetSpawnerIdForTeam(teamId: number): number {
        const spawners = teamId === 1 ? TEAM1_SKY_JET_SPAWNERS : TEAM2_SKY_JET_SPAWNERS;
        const idx = nextSkyJetSpawnerIndex[teamId] || 0;
        // Get current spawner, then advance index for next call
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

    /**
     * Get the HQ (AI spawner) position for a team.
     * This is where bots actually spawn - ground level, NOT sky jet spawner position.
     * Used for jet pilot selection so we look near where bots are, not in the sky.
     */
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
                // Try next spawner
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
                // Only count as "active" if occupied by someone on that team.
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
            // ignore
        }
        return countOccupied;
    }

    function pickJetPilot(teamId: number, _spawnerPos: mod.Vector): mod.Player | null {
        // Use HQ (AI spawner) position instead of sky jet spawner position.
        // Sky jets spawn at high altitude, but bots spawn at ground-level HQ.
        // Looking near the sky spawner would never find candidates!
        const hqPos = getHQPositionForTeam(teamId);
        if (!hqPos) {
            if (DEBUG_SKY_JETS) {
                log(`[SkyJets] Could not get HQ position for team ${teamId}`);
            }
            return null;
        }
        
        // First try: pick pilots from near HQ
        const candidates = getNearbyBotsOnFoot(teamId, hqPos, JET_PILOT_PICKUP_RADIUS_METERS);
        if (candidates.length > 0) {
            if (DEBUG_SKY_JETS) {
                log(`[SkyJets] Found pilot near HQ for team ${teamId}`);
            }
            return candidates[0];
        }
        
        // Fallback: if enabled, pick any bot on foot from anywhere on the map
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
        // Avoid GetPlayerFromVehicleSeat (spams PortalLog on many vehicle types).
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
                    // ignore
                }
            }
        } catch (_e) {
            // ignore
        }
        return null;
    }

    function applyJetPilotBehavior(pilot: mod.Player, teamId: number, spawnerId: number): void {
        // Minimal requested behavior:
        // apply AIBattlefieldBehavior to the seated pilot.
        // Timing matters: re-apply shortly after seating so it "sticks".
        const applyIfStillInVehicle = (): void => {
            // MUST check soldier validity before GetVehicleFromPlayer to avoid InvalidValue errors
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
                // Throttle by team so we don't flood logs.
                logDebugKey(
                    `SkyJets:Behavior:T${teamId}`,
                    `[ConquestV10][SkyJets] Apply behavior: team=${teamId} spawner=${spawnerId} pilotObjId=${mod.GetObjId(pilot)}`,
                    2.0
                );
            }
            // DISABLED: Behavior application is killing pilots. Investigate before re-enabling.
            // safeCall("SkyJets:AIBattlefieldBehavior", () => mod.AIBattlefieldBehavior(pilot));
        };

        // Apply shortly after seating attempts (seat can take a tick to "stick")
        // Use async IIFE to properly await the delays
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

            // Get vehicle type for THIS SPECIFIC spawner (not generic team type)
            const type = getSkyJetVehicleTypeForSpawner(spawnerId);

            // Balance: never allow more than 1 occupied sky jet per team (per type)
            const existing = findNearestVehicleOfTypeNear(type, spawnerPos, 2500.0);
            if (existing) {
                // If a sky jet exists, ensure the pilot has behavior (only apply once per pilot).
                const pilotInJet = findAnyAIOccupantInVehicle(existing, teamId);
                if (pilotInJet) {
                    const pilotId = mod.GetObjId(pilotInJet);
                    // Only apply behavior once per pilot (don't spam it every tick)
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
                        // Try seat -1 then seat 0, then apply behavior.
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

            // Balance: never allow more than 1 occupied sky jet per team (per type)
            if (countOccupiedVehiclesOfTypeForTeam(type, teamId) >= 1) {
                continue;
            }

            // Spawn a new sky jet and seat a pilot.
            if (t - (lastSkyJetSpawnAttemptByTeam[teamId] ?? -9999) < AI_SKY_JET_SPAWN_COOLDOWN_SECONDS) {
                continue;
            }
            lastSkyJetSpawnAttemptByTeam[teamId] = t;

            // Only spawn a sky jet if we already have a ready pilot.
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
                // Retry quickly to beat gravity on sky spawns.
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

    /**
     * Pre-round tick: allow scripted ground spawns to fire on delay
     * before the round becomes Active.
     */
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
            // ignore
        }
        return null;
    }

    /**
     * Find nearest bot on foot to a position, from either team
     * Used for unlock sweep when team cannot be resolved from spawner position
     */
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
            // ignore
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
        // Must validate player state before calling GetVehicleFromPlayer
        if (!p) return null;
        if (!hasSoldier(p)) return null;
        if (!isAlive(p)) return null;  // Dead/ManDown players cause InvalidValue
        // CRITICAL: Must check IsInVehicle before GetVehicleFromPlayer to avoid InvalidValue
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

    /**
     * Get nearby alive bots on foot (not in vehicles) for a given team
     */
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

                // Check if in vehicle using SoldierStateBool (doesn't throw InvalidValue errors)
                try {
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (inVehicle) continue; // Already in a vehicle
                } catch (_e) {
                    // Assume not in vehicle
                }

                // Check distance
                const pPos = getSoldierPos(p);
                if (!pPos) continue;

                const dist = distance3D(pPos, position);
                if (dist <= maxDist) {
                    result.push(p);
                }
            }
        } catch (_e) {
            // ignore
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

    /**
     * Try to seat a bot in a vehicle at a specific seat.
     * ForcePlayerToSeat will fail silently if seat is occupied or invalid.
     */
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

    /**
     * Fast seat helper used by sky jets (mirrors ConquestV6 behavior).
     * Avoids extra verification that can fail during spawn timing.
     */
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
            // ignore
        }
        if (vId <= 0) return;
        try {
            bId = mod.GetObjId(bot);
        } catch (_e) {
            // ignore
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
            // ignore
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
            // ignore
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

    /**
     * Main tick - attempt to fill gunner seats in vehicles with AI drivers.
     * Uses a safer approach that doesn't spam GetPlayerFromVehicleSeat.
     */
    export function tickVehicleDirector(): void {
        ensureVehicleInit();
        if (mod.GetMatchTimeElapsed() < VEHICLE_DIRECTOR_START_DELAY_SECONDS) return;

        // Periodic ground vehicle seat sweep - seats bots into empty vehicles (no teleporting)
        safeCall("VehicleDirector:GroundSeatSweep", () => tickGroundVehicleSeatSweep());

        // Scripted ground spawn when map auto-spawn is disabled
        safeCall("VehicleDirector:GroundSpawnerSpawn", () => runGroundSpawnerAutoSpawnOnce());

        // Periodic init sweep to keep HQ vehicles and seats initialized
        safeCall("VehicleDirector:GroundInitSweep", () => tickGroundVehicleInitSweep());

        // Spawner-level init sweep (force spawn + seat/exit)
        safeCall("VehicleDirector:SpawnerInitSweep", () => tickSpawnerInitSweep());

        // Periodically verify spawner settings are maintained
        safeCall("VehicleDirector:VerifySpawners", () => verifySpawnerSettings());

        // Sky jets are independent from seat-filling.
        safeCall("VehicleDirector:SkyJets", () => tickSkyJets());

        if (!ENABLE_VEHICLE_SEAT_FILLING) return;

        const t = now(true);
        if (t - lastVehicleCheckTime < VEHICLE_CHECK_INTERVAL_SECONDS) return;
        lastVehicleCheckTime = t;

        // Clean up old cooldowns
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

                // Skip if we recently processed this vehicle
                if (recentlyProcessedVehicles.has(vId)) continue;

                // Only attempt seat filling for occupied vehicles.
                let occupied = false;
                try {
                    occupied = mod.IsVehicleOccupied(v);
                } catch (_e) {
                    occupied = false;
                }
                if (!occupied) continue;

                const teamId = getVehicleTeamId(v);
                if (teamId !== 1 && teamId !== 2) continue;
                
                // CRITICAL: Skip vehicles driven by human players
                // Check seat 0 (driver) to see if it's a human
                try {
                    const driver = mod.GetPlayerFromVehicleSeat(v, 0);
                    if (driver && !isAISoldier(driver)) {
                        // Human driver - don't auto-fill seats
                        continue;
                    }
                } catch (_e) {
                    // Can't check driver - skip to be safe
                    continue;
                }

                // Get vehicle position
                const vPos = getVehiclePos(v);
                if (!vPos) continue;

                // Find nearby bots to try to seat
                const nearbyBots = getNearbyBotsOnFoot(teamId, vPos, VEHICLE_SEAT_FILL_RANGE_METERS);
                if (nearbyBots.length === 0) continue;

                // Mark as processed to avoid spam
                recentlyProcessedVehicles.set(vId, t);

                // Try to seat bots in seats 1-3 (common passenger/gunner seats)
                // We don't query seat count or occupancy to avoid InvalidValue errors
                let seatedCount = 0;
                const maxSeatsToTry = Math.min(3, nearbyBots.length);

                for (let seat = 1; seat <= 3 && seatedCount < maxSeatsToTry; seat++) {
                    const bot = nearbyBots[seatedCount];
                    if (trySeatBot(bot, v, seat)) {
                        // CRITICAL: Enable AI targeting and shooting for seated bots (gunners/passengers)
                        safeCall("VehicleDirector:GunnerSeat:Behavior", () => mod.AIBattlefieldBehavior(bot));
                        safeCall("VehicleDirector:GunnerSeat:EnableTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("VehicleDirector:GunnerSeat:EnableShooting", () => mod.AIEnableShooting(bot, true));
                        seatedCount++;
                        log(`[VehicleDirector] Seated bot in vehicle ${vId} seat ${seat}`);
                    }
                }
            }
        } catch (_e) {
            // ignore top-level errors
        }
    }

    // ── Periodic Ground Vehicle Seat Sweep ──
    // Periodically find empty neutral ground vehicles and seat bots into them.
    // NO teleporting - bots are seated in-place via ForcePlayerToSeat (seat -1).
    // This handles initial vehicle activation AND re-population after
    // vehicles are abandoned/destroyed and respawn at HQ.
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

                // Skip aircraft (handled by SkyJets module)
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

                // Check occupancy
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

                // Identify for logging
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

                // Get team info
                let teamStr = "?";
                try {
                    const team = mod.GetVehicleTeam(v);
                    if (!team) teamStr = "null";
                    else if (team === mod.GetTeam(1)) teamStr = "T1";
                    else if (team === mod.GetTeam(2)) teamStr = "T2";
                    else teamStr = "neutral";
                } catch (_e) { teamStr = "err"; }

                // Only seat bots into empty vehicles (up to limit per sweep)
                if (seatedThisSweep >= GROUND_SWEEP_MAX_PER_TICK) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }

                // Find nearest bot on foot to this vehicle
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

                // Seat using seat -1 (any available seat) like SkyJets, then seat 0
                // No teleporting - just force seat from wherever the bot is
                try { mod.ForcePlayerToSeat(bot, v, -1); } catch (_e) {}
                try { mod.ForcePlayerToSeat(bot, v, 0); } catch (_e) {}

                // Apply AI behavior so they drive to objectives
                safeCall("GroundSweep:Behavior", () => mod.AIBattlefieldBehavior(bot));
                safeCall("GroundSweep:Targeting", () => mod.AIEnableTargeting(bot, true));
                safeCall("GroundSweep:Shooting", () => mod.AIEnableShooting(bot, true));

                // Reduce tank health to make them less dominant (0.7 = 30% reduction)
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
            // ignore
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

                // Only ground vehicles (skip aircraft)
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

                // Only initialize vehicles near their spawner
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
            // ignore
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
                // Force a spawn if empty at this spawner
                safeCall(`SpawnerInit:Spawn:${spawnerId}`, () => mod.ForceVehicleSpawnerSpawn(spawner as mod.VehicleSpawner));
            }

            // If still no vehicle nearby, skip seat init this cycle
            const vehicle = near ?? findNearestVehicleNear(spawnerPos, SPAWNER_INIT_NEAR_DISTANCE_METERS);
            if (!vehicle) return;

            const teamId = getSpawnerTeamId(spawnerId);
            if (teamId !== 1 && teamId !== 2) return;

            // Seed a bot near spawner and try to seat (wake-up)
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
                // ignore
            }
        }
    }

    // =========================================================================
    // Vehicle Abandon Tracking System
    /**
     * Check if a vehicle is empty (no driver in seat 0)
     */
    function isVehicleEmpty(vehicle: mod.Vehicle): boolean {
        // Avoid GetPlayerFromVehicleSeat (spams PortalLog).
        try {
            return !mod.IsVehicleOccupied(vehicle);
        } catch (_e) {
            // If we can't check, assume not empty (safer)
            return false;
        }
    }

    /**
     * Force destroy an empty vehicle immediately (for UI spawn failures)
     * Only destroys if the vehicle is currently empty
     */
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
