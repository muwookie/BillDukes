/// <reference path="config/ConquestConfig.ts" />
/// <reference path="modules/SafeSDKWrapper.ts" />
/// <reference path="modules/RegistryModule.ts" />
/// <reference path="modules/ObjectiveModule.ts" />
/// <reference path="modules/CapturePointModule.ts" />
/// <reference path="modules/SpawnRecycleModule.ts" />
/// <reference path="modules/ObjectiveBiasModule.ts" />
/// <reference path="modules/DirectorModule.ts" />
/// <reference path="modules/TicketBleedModule.ts" />
/// <reference path="modules/HudModuleParseUI.ts" />
/// <reference path="modules/VehicleDirectorModule.ts" />
/// <reference path="modules/AircraftCombatModule.ts" />
/// <reference path="modules/VehicleSpawnUIModuleParseUI.ts" />
/// <reference path="modules/ScoreboardModule.ts" />
/// <reference path="modules/SoundsModule.ts" />
/// <reference path="modules/WorldIconModule.ts" />

/**
 * ConquestV8 - Soft-Influence Conquest with ObjectiveBiasModule
 * 
 * Top-level orchestrator that drives the tick loop and manages round flow.
 * 
 * KEY PHILOSOPHY:
 * - Works WITH AIBattlefieldBehavior, not against it
 * - ObjectiveBiasModule provides soft nudges via weight adjustments
 * - DirectorStateMonitor detects AI Director panic/consolidation states
 * - JetStabilizerModule compensates for airborne AI imbalance
 * - PanicRecoveryModule helps Director exit panic mode after major defeats
 * - Director only intervenes for truly idle/stuck bots
 * - No forced squad assignments or movement orders
 */

namespace ConquestV8 {
    let running = false;
    let runToken = 0;

    // =========================================================================
    // QUOTA-LIMITED ROUND AUTO-END (Workaround for EA backend AI quota limits)
    // =========================================================================
    // EA's backend limits AI quota in Round 1 for LOCAL sessions (~37 bots max).
    // Round 2+ gets full quota (62 bots).
    // If we detect significantly fewer bots than expected, auto-end to reach
    // full population. This only triggers when actually quota-limited.
    const QUOTA_AUTOEND_ENABLED = true;
    const QUOTA_CHECK_DELAY_SECONDS = 15.0;   // Wait for spawning to complete
    const QUOTA_THRESHOLD_PERCENT = 0.60;     // Auto-end if < 60% of target bots
    const TARGET_BOTS_PER_TEAM = 31;          // Expected full quota (sync with SpawnRecycle)
    let quotaCheckPerformed = false;          // Only check once per match

    export function OnGameModeStarted(): void {
        // Track Portal round number (persists across rounds in same match)
        const currentPortalRound = Registry_IncrementPortalRoundNumber();
        
        // Reset quota check flag for each new round
        quotaCheckPerformed = false;
        
        log("=".repeat(60));
        log(`Conquest V8 Starting - Build ${BUILD_ID}`);
        log(`Portal Round: ${currentPortalRound}`);
        log("Soft-Influence Mode: ObjectiveBiasModule + Gentle Director");
        if (QUOTA_AUTOEND_ENABLED) {
            log(`[QUOTA] Will check bot population after ${QUOTA_CHECK_DELAY_SECONDS}s`);
        }
        log("=".repeat(60));

        // Stop any previous loops
        running = false;
        runToken++;

        // Reset all modules
        Registry_Reset();
        Objective_Reset();
        CapturePoint_Reset();
        SpawnRecycle_Reset();  // TRUE RECYCLING - handles both initial spawns and recycling
        ObjectiveBias_Reset();
        Director_Reset();
        Ticket_Reset();
        resetFactionCache();

        // Initialize all modules
        Registry_SetRoundStartTime(mod.GetMatchTimeElapsed());
        Registry_SetRoundState(RoundState.PreRound);

        // CRITICAL: Initialize map config FIRST so OBJECTIVES array is populated
        // before ObjectiveModule tries to look up letters
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
        // FIXED: Vehicle UI now checks RoundState.Active before showing UI
        initVehicleSpawnUIParseUI();
        initWorldIconModule();

        // Start tick loop (includes pre-round spawning)
        running = true;
        const token = runToken;
        tickLoop(token);
    }

    async function tickLoop(token: number): Promise<void> {
        while (running && token === runToken) {
            const currentTime = mod.GetMatchTimeElapsed();
            const roundState = Registry_GetRoundState();
            
            if (roundState === RoundState.PreRound) {
                // Pre-round spawning phase - using SpawnRecycleModule for TRUE recycling
                // SpawnRecycle_Start initializes once, then Tick processes batched spawning
                safeCall("SpawnRecycle_Start", () => SpawnRecycle_Start());
                safeCall("SpawnRecycle_Tick", () => SpawnRecycle_Tick()); // Process spawn batches!
                safeCall("VehicleDirector:PreRound", () => VehicleDirector_PreRoundTick());
                
                // SpawnRecycle handles its own completion - check bot count
                const stats = SpawnRecycle_GetStats();
                if (stats.team1Alive > 0 && stats.team2Alive > 0) {
                    log("Pre-round spawn complete - starting match!");
                    log(`[SpawnRecycle] Initial bots: T1=${stats.team1Alive} T2=${stats.team2Alive}`);
                    
                    // Activate the round
                    Registry_SetRoundState(RoundState.Active);
                    log("Round started - TRUE RECYCLING active");
                }
            } else if (roundState === RoundState.Active) {
                // Normal gameplay ticks - SpawnRecycle handles bot respawning
                safeCall("SpawnRecycle", () => SpawnRecycle_Tick());
                safeCall("Objective", () => Objective_Tick());
                safeCall("ObjectiveBias", () => ObjectiveBias_Tick(currentTime));
                safeCall("Director", () => Director_Tick(currentTime));
                safeCall("Ticket", () => Ticket_Tick());
                safeCall("Scoreboard", () => tickScoreboard());
                safeCall("VehicleDirector", () => tickVehicleDirector());
                safeCall("AircraftCombat", () => tickAircraftCombat());
                // FIXED: VehicleSpawnUI now handles RoundState check internally
                safeCall("VehicleSpawnUI", () => tickVehicleUIParseUI());
                
                // Check capture status for ongoing capture sounds
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

                // Check win condition
                const winner = Ticket_CheckWinCondition();
                if (winner !== 0) {
                    endRound(winner);
                    break;
                }

                // =========================================================
                // QUOTA-LIMITED AUTO-END (EA backend workaround)
                // =========================================================
                // Check if we're actually quota-limited by comparing spawned
                // bots to expected target. Only auto-end if significantly below.
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
                            
                            // Pick winner based on objectives
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
            // Ignore
        }
    }

    export function OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        
        const isAI = isAISoldier(player);
        const teamId = getPlayerTeamId(player);
        const playerId = mod.GetObjId(player);
        log(`[Deployed] ${isAI ? "AI" : "Human"} team=${teamId} id=${playerId}`);
        
        // HUMAN PLAYER - normal spawn handling (no interception)
        if (!isAI) {
            safeCall("MarkDeployed", () => markPlayerDeployed(player));
            safeCall("VehicleUI:Deployed", () => vehicleUI_OnPlayerDeployed(player));
            safeCall("SkipManDown", () => mod.SkipManDown(player, false));
            safeCall("VehicleUI:Hide", () => onPlayerDeployedHideVehicleUIParseUI(player));
            return;
        }
        
        // AI SOLDIER handling - normal flow
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

    /**
     * Handle UI button press events - used for vehicle spawn UI
     */
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
        // Register spawned bots with SpawnRecycleModule
        safeCall("SpawnRecycle:OnSpawnerSpawned", () => SpawnRecycle_OnSpawnerSpawned(player, spawner));
    }

    // Portal event handlers that forward to modules
    export function OnCapturePointCaptured(cp: mod.CapturePoint): void {
        CapturePoint_OnCaptured(cp);
    }

    export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerEnterCapturePoint(player, cp);
        } catch (e) {
            // Sounds module error, continue
        }
    }

    export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerExitCapturePoint(player);
        } catch (e) {
            // Sounds module error, continue
        }
    }

    export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
        // TRUE RECYCLING: SpawnRecycle respawns the SAME bot entity at a new objective
        SpawnRecycle_OnBotDied(player);
        Ticket_OnPlayerDied(player);
        Scoreboard_recordDeath(player);
        if (killer) {
            Scoreboard_recordKill(killer, player);
        }

        // HUMAN: Show vehicle UI on death
        const isAI = isAISoldier(player);
        if (!isAI) {
            safeCall("VehicleUI:Death", () => onPlayerDiedShowUIParseUI(player));
        }
    }

    /**
     * Called when a player enters ManDown (bleedout) state.
     * This fires BEFORE OnPlayerDied - gives us a window to keep bot entities alive.
     */
    export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
        // Re-apply AISetUnspawnOnDead to prevent early entity destruction during bleedout
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
