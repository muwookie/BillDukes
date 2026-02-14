/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />
/// <reference path="ObjectiveModule.ts" />
/// <reference path="ObjectiveBiasModule.ts" />

/**
 * DirectorModule V8 - Soft-Influence Squad Coordination
 * 
 * PHILOSOPHY:
 * This module works WITH AIBattlefieldBehavior, not against it.
 * It provides gentle nudges to idle/stuck bots, but lets the Portal
 * AI Director make all real decisions.
 * 
 * WHAT IT DOES:
 * - Reads weights from ObjectiveBiasModule
 * - Identifies truly idle bots (not moving, not in combat)
 * - Gives idle bots a gentle nudge toward underdefended objectives
 * - Re-applies AIBattlefieldBehavior to ensure natural flow
 * 
 * WHAT IT DOES NOT DO:
 * - Force squads to specific objectives
 * - Override bots that are already moving
 * - Issue constant movement orders
 * - Fight the AI Director's decisions
 * 
 * KEY CHANGE FROM V7:
 * - Uses AIBattlefieldBehavior as PRIMARY behavior
 * - AIValidatedMoveToBehavior only for stuck/idle bots
 * - Respects ObjectiveBias weights as hints
 * - Much longer intervals between interventions
 */

namespace ConquestV8 {
    let initialized = false;
    let lastNudgeTime = 0;
    
    // Track last intervention per player to avoid spam
    const lastNudgeByPlayerId: Map<number, number> = new Map();
    
    // Idle detection state
    const lastPositionByPlayerId: Map<number, { x: number; y: number; z: number; time: number }> = new Map();
    
    // Configuration - MUCH more conservative than V7
    const NUDGE_INTERVAL_SECONDS = 30.0;      // Only check every 30 seconds
    const IDLE_THRESHOLD_SECONDS = 20.0;      // Bot must be idle for 20s before nudge
    const IDLE_DISTANCE_THRESHOLD = 5.0;      // Bot must move less than 5m to be "idle"
    const MIN_NUDGE_INTERVAL_PER_BOT = 60.0;  // Don't nudge same bot more than once per minute
    const MAX_NUDGES_PER_TICK = 2;            // Maximum bots to nudge per tick (prevent spam)

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    export function Director_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[Director V8] Initialized - soft-influence mode (nudge interval: " + NUDGE_INTERVAL_SECONDS + "s)");
    }

    // =========================================================================
    // MAIN TICK
    // =========================================================================
    export function Director_Tick(currentTime: number): void {
        // Very conservative throttling
        if (currentTime - lastNudgeTime < NUDGE_INTERVAL_SECONDS) {
            return;
        }
        lastNudgeTime = currentTime;
        
        // Process each team
        for (const teamId of [1, 2]) {
            processTeamNudges(teamId, currentTime);
        }
    }

    // =========================================================================
    // SOFT NUDGE LOGIC
    // =========================================================================
    function processTeamNudges(teamId: number, currentTime: number): void {
        // Get suggested objective from ObjectiveBiasModule
        const suggestedObj = ObjectiveBias_GetSuggestedObjective(teamId);
        if (!suggestedObj) {
            logDebugKey(`Director:NoSuggestion:T${teamId}`, 
                `[Director V8] Team ${teamId}: No suggested objective from bias module`, 30.0);
            return;
        }
        
        // Get the config for target position
        const configObj = getObjectiveByObjId(suggestedObj.objId);
        if (!configObj) return;
        
        // Find idle bots that might need a nudge
        const idleBots = findIdleBots(teamId, currentTime);
        
        if (idleBots.length === 0) {
            logDebugKey(`Director:NoIdleBots:T${teamId}`,
                `[Director V8] Team ${teamId}: No idle bots detected`, 30.0);
            return;
        }
        
        logDebugKey(`Director:IdleBots:T${teamId}`,
            `[Director V8] Team ${teamId}: ${idleBots.length} idle bots, suggesting ${suggestedObj.letter}`, 15.0);
        
        // Nudge only a few bots per tick (prevent mass migration)
        let nudgeCount = 0;
        for (const bot of idleBots) {
            if (nudgeCount >= MAX_NUDGES_PER_TICK) break;
            
            const playerId = getPlayerId(bot);
            if (playerId < 0) continue;
            
            // Check cooldown per bot
            const lastNudge = lastNudgeByPlayerId.get(playerId) ?? 0;
            if (currentTime - lastNudge < MIN_NUDGE_INTERVAL_PER_BOT) continue;
            
            // Apply soft nudge
            if (applyNudge(bot, configObj, currentTime)) {
                lastNudgeByPlayerId.set(playerId, currentTime);
                nudgeCount++;
            }
        }
        
        if (nudgeCount > 0) {
            log(`[Director V8] Team ${teamId}: Nudged ${nudgeCount} idle bots toward ${suggestedObj.letter}`);
        }
    }

    // =========================================================================
    // IDLE BOT DETECTION
    // =========================================================================
    function findIdleBots(teamId: number, currentTime: number): mod.Player[] {
        const idleBots: mod.Player[] = [];
        
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                
                // Check team
                if (getPlayerTeamId(player) !== teamId) continue;
                
                // Only AI
                if (!isAISoldier(player)) continue;
                
                // Must be alive
                if (!isAlive(player)) continue;
                
                // Skip if in vehicle (vehicle AI handles itself)
                if (isInVehicle(player)) continue;
                
                // Check if truly idle
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
        
        // Get current position
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
        
        // Check against last known position
        const lastPos = lastPositionByPlayerId.get(playerId);
        
        if (!lastPos) {
            // First time seeing this bot - record position
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        
        // Calculate distance moved
        const dx = currentPos.x - lastPos.x;
        const dy = currentPos.y - lastPos.y;
        const dz = currentPos.z - lastPos.z;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If bot has moved significantly, update position and not idle
        if (distanceMoved > IDLE_DISTANCE_THRESHOLD) {
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        
        // Bot hasn't moved much - check how long
        const idleTime = currentTime - lastPos.time;
        
        if (idleTime >= IDLE_THRESHOLD_SECONDS) {
            // Truly idle - bot hasn't moved for IDLE_THRESHOLD_SECONDS
            return true;
        }
        
        return false;
    }

    // =========================================================================
    // APPLY SOFT NUDGE
    // =========================================================================
    function applyNudge(player: mod.Player, _targetObj: Objective, _currentTime: number): boolean {
        try {
            // SOFT NUDGE STRATEGY - V8.1:
            // ONLY use AIBattlefieldBehavior - let Portal's AI Director handle everything
            // Do NOT issue AIValidatedMoveToBehavior commands as they interfere with
            // the AI Director's spatial reasoning and cause panic/clustering
            
            mod.AIBattlefieldBehavior(player);
            
            // Reset idle tracking for this bot
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

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
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

    // =========================================================================
    // RESET
    // =========================================================================
    export function Director_Reset(): void {
        initialized = false;
        lastNudgeTime = 0;
        lastNudgeByPlayerId.clear();
        lastPositionByPlayerId.clear();
        log("[Director V8] Reset");
    }
}
