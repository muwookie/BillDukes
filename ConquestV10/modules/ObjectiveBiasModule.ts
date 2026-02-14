/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />
/// <reference path="ObjectiveModule.ts" />

/**
 * ObjectiveBiasModule - Soft-Influence System for AI Objective Selection
 * 
 * PURPOSE:
 * Gently influences Battlefield-behaviour AI by adjusting objective attractiveness
 * weights in a registry. It NEVER overrides the AI Director and NEVER issues
 * movement orders. It provides soft nudges to prevent long-term clustering.
 * 
 * DESIGN PRINCIPLES:
 * - Zero conflict with Portal AI systems
 * - No direct AI commands (no AIMove, no AISetTarget)
 * - No squad micromanagement
 * - No pathing overrides
 * - All influence is advisory
 * 
 * HOW IT WORKS:
 * 1. Tracks a weight value for each objective (default 50)
 * 2. Periodically evaluates battlefield conditions (every 5 seconds)
 * 3. Adjusts weights gently based on clustering/under-defense
 * 4. Provides GetSuggestedObjective() for soft hints to squads
 * 5. Director can READ these weights but is not FORCED to obey them
 */

namespace ConquestV8 {
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    const BIAS_TICK_INTERVAL_SECONDS = 5.0;
    const DEFAULT_WEIGHT = 50;
    const MIN_WEIGHT = 10;
    const MAX_WEIGHT = 100;
    
    // Clustering thresholds
    const OVERCROWDED_THRESHOLD = 6;   // More than 6 AI at one objective = overcrowded (lowered from 8)
    const UNDERDEFENDED_THRESHOLD = 2; // Fewer than 2 AI at owned objective = underdefended
    
    // Weight adjustment amounts (stronger penalties to counter Portal's clustering tendency)
    const WEIGHT_DECREASE_OVERCROWDED = 8;   // Increased from 3 to 8
    const WEIGHT_INCREASE_UNDERDEFENDED = 5; // Increased from 3 to 5
    const WEIGHT_BOOST_NEWLY_CAPTURED = 5;
    const WEIGHT_PENALTY_RECENTLY_LOST = 5;
    const WEIGHT_DECAY_RATE = 1; // Gradual return to default

    // =========================================================================
    // STATE
    // =========================================================================
    let initialized = false;
    let lastBiasTickTime = -9999;
    
    // Weight registry: objId -> weight
    const objectiveWeights: Map<number, number> = new Map();
    
    // AI count per objective (updated each tick)
    const aiCountByObjective: Map<number, number> = new Map();
    
    // Track recent captures/losses for temporary boosts
    const recentCaptures: Map<number, number> = new Map(); // objId -> captureTime
    const recentLosses: Map<number, number> = new Map();   // objId -> lossTime
    const CAPTURE_BOOST_DURATION_SECONDS = 30.0;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    export function ObjectiveBias_Init(): void {
        if (initialized) return;
        
        // Initialize weights for all objectives at default
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            objectiveWeights.set(obj.objId, DEFAULT_WEIGHT);
            aiCountByObjective.set(obj.objId, 0);
        }
        
        initialized = true;
        log("[ObjectiveBias] Initialized with " + objectives.length + " objectives at weight " + DEFAULT_WEIGHT);
    }

    // =========================================================================
    // MAIN TICK - Called every frame, internally throttled
    // =========================================================================
    export function ObjectiveBias_Tick(currentTime: number): void {
        if (!initialized) return;
        
        // Throttle to every 5 seconds
        if (currentTime - lastBiasTickTime < BIAS_TICK_INTERVAL_SECONDS) return;
        lastBiasTickTime = currentTime;
        
        // Step 1: Count AI at each objective
        updateAICountsPerObjective();
        
        // Step 2: Evaluate and adjust weights
        evaluateAndAdjustWeights(currentTime);
        
        // Step 3: Log summary for debugging
        if (DEBUG_LOGS) {
            logBiasSummary();
        }
    }

    // =========================================================================
    // STEP 1: COUNT AI AT EACH OBJECTIVE
    // =========================================================================
    function updateAICountsPerObjective(): void {
        // Reset counts
        for (const objId of aiCountByObjective.keys()) {
            aiCountByObjective.set(objId, 0);
        }
        
        // Get all objectives
        const objectives = Registry_GetObjectives();
        
        // Count AI players near each objective
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                
                // Only count AI players
                let isAI = false;
                try {
                    isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
                } catch (_e) {
                    continue;
                }
                if (!isAI) continue;
                
                // Check if alive
                let isAlive = false;
                try {
                    isAlive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
                } catch (_e) {
                    continue;
                }
                if (!isAlive) continue;
                
                // Get player position
                let playerPos: mod.Vector;
                try {
                    playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                } catch (_e) {
                    continue;
                }
                
                // Find nearest objective within radius
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

    // =========================================================================
    // STEP 2: EVALUATE AND ADJUST WEIGHTS
    // =========================================================================
    function evaluateAndAdjustWeights(currentTime: number): void {
        const objectives = Registry_GetObjectives();
        
        for (const obj of objectives) {
            let weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            
            // Rule 1: Overcrowded objectives become less attractive
            if (aiCount > OVERCROWDED_THRESHOLD) {
                weight -= WEIGHT_DECREASE_OVERCROWDED;
                logDebugKey(`Bias:Overcrowded:${obj.objId}`, 
                    `[ObjectiveBias] ${obj.letter} overcrowded (${aiCount} AI), weight -${WEIGHT_DECREASE_OVERCROWDED}`, 10.0);
            }
            
            // Rule 2: Underdefended owned objectives become more attractive
            if (obj.teamId !== 0 && aiCount < UNDERDEFENDED_THRESHOLD) {
                weight += WEIGHT_INCREASE_UNDERDEFENDED;
                logDebugKey(`Bias:Underdefended:${obj.objId}`,
                    `[ObjectiveBias] ${obj.letter} underdefended (${aiCount} AI), weight +${WEIGHT_INCREASE_UNDERDEFENDED}`, 10.0);
            }
            
            // Rule 3: Neutral objectives get slight boost (encourage capture)
            if (obj.teamId === 0) {
                weight += 1;
            }
            
            // Rule 4: Recently captured objectives get temporary boost
            const captureTime = recentCaptures.get(obj.objId);
            if (captureTime && currentTime - captureTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight += WEIGHT_BOOST_NEWLY_CAPTURED;
            } else if (captureTime) {
                recentCaptures.delete(obj.objId);
            }
            
            // Rule 5: Recently lost objectives get temporary penalty (avoid clustering on lost flag)
            const lossTime = recentLosses.get(obj.objId);
            if (lossTime && currentTime - lossTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight -= WEIGHT_PENALTY_RECENTLY_LOST;
            } else if (lossTime) {
                recentLosses.delete(obj.objId);
            }
            
            // Rule 6: Gradual decay toward default (self-correcting)
            if (weight > DEFAULT_WEIGHT) {
                weight -= WEIGHT_DECAY_RATE;
            } else if (weight < DEFAULT_WEIGHT) {
                weight += WEIGHT_DECAY_RATE;
            }
            
            // Clamp to valid range
            weight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
            objectiveWeights.set(obj.objId, weight);
        }
    }

    // =========================================================================
    // PUBLIC API: GET SUGGESTED OBJECTIVE
    // =========================================================================
    /**
     * Returns the suggested objective for a team based on current weights.
     * This is an ADVISORY function - the caller decides whether to use it.
     * 
     * @param teamId - The team requesting a suggestion
     * @returns The highest-weighted objective that is:
     *   - Not overcrowded
     *   - Not already owned by the team (unless all are owned)
     *   - Accessible (not a rooftop without approach)
     */
    export function ObjectiveBias_GetSuggestedObjective(teamId: number): ObjectiveState | null {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return null;
        
        // Build candidate list with weights
        const candidates: Array<{ obj: ObjectiveState; weight: number; aiCount: number }> = [];
        
        for (const obj of objectives) {
            const weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            
            // Skip if overcrowded
            if (aiCount > OVERCROWDED_THRESHOLD) continue;
            
            // Prioritize: neutral > enemy-held > owned
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
        
        // Sort by weight (highest first)
        candidates.sort((a, b) => b.weight - a.weight);
        
        // Return highest-weighted candidate
        return candidates[0].obj;
    }

    /**
     * Get the current weight for an objective (for Director to read)
     */
    export function ObjectiveBias_GetWeight(objId: number): number {
        return objectiveWeights.get(objId) ?? DEFAULT_WEIGHT;
    }

    /**
     * Get AI count at an objective (for Director to read)
     */
    export function ObjectiveBias_GetAICount(objId: number): number {
        return aiCountByObjective.get(objId) ?? 0;
    }

    // =========================================================================
    // DEBUG LOGGING
    // =========================================================================
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

    // =========================================================================
    // RESET
    // =========================================================================
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
