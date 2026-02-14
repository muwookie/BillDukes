/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />

/**
 * ObjectiveModule - Map-Agnostic Objective Discovery
 * 
 * Responsibilities:
 * - Discover all capture points
 * - Assign indices
 * - Track ownership changes
 * - Broadcast updates to other modules
 */

namespace ConquestV8 {
    const LETTER_MAP = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    
    let initialized = false;

    /**
     * Extract letter from capture point objId using OBJECTIVES config (map-aware)
     * Falls back to index-based letter if not found in config
     */
    function getLetterFromCapturePoint(cp: mod.CapturePoint, fallbackIndex: number): string {
        const objId = mod.GetObjId(cp);
        
        // FIXED: Use OBJECTIVES from config (set by initializeMapConfig) instead of hardcoded map
        // This ensures correct letter mapping for ALL maps (Granite, Capstone, etc.)
        const objective = OBJECTIVES.find(obj => obj.objId === objId);
        
        if (objective) {
            log("[Objective] Matched objId " + objId + " to letter '" + objective.id + "' from config");
            return objective.id;
        }
        
        // Fallback to index-based letter if not in config
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
            // Suppress duplicate same-team captures (from tick polling resync)
            if (oldTeamId === newTeamId) return;
            Registry_UpdateObjectiveOwnership(obj.index, newTeamId);
            log("[Objective] " + obj.letter + " captured: team " + oldTeamId + " -> " + newTeamId);

            // Notify sounds module of capture
            try {
                Sounds_onCapturePointCaptured(cp, oldTeamId);
            } catch (e) {
                // Sounds module error, continue
            }
        }
    }

    /**
     * Periodically sync objective ownership from SDK (fallback if capture events are missed).
     */
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
                // ignore
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
