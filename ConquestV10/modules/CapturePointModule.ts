/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />
/// <reference path="ObjectiveModule.ts" />
/// <reference path="ScoreboardModule.ts" />

/**
 * CapturePointModule - Pure Capture Mechanics
 * 
 * Responsibilities:
 * - Enable/disable capture points
 * - No ticket logic (that's TicketBleedModule's job)
 */

namespace ConquestV8 {
    let initialized = false;

    export function CapturePoint_Init(): void {
        if (initialized) return;
        // Event registration happens via global OnCapturePointCaptured handler in main.script.ts
        initialized = true;
        log("[CapturePoint] Initialized");
    }

    export function CapturePoint_OnCaptured(cp: mod.CapturePoint): void {
        const ownerTeam = mod.GetCurrentOwnerTeam(cp);
        const capturingTeamId = mod.GetObjId(ownerTeam);
        const objId = mod.GetObjId(cp);
        
        // Determine losing team (opposite of capturing team)
        const losingTeamId = capturingTeamId === 1 ? 2 : (capturingTeamId === 2 ? 1 : 0);
        
        Objective_OnCaptured(cp, capturingTeamId);

        // Award capture credit to all players of the capturing team on the point
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
                        // Skip player if team check fails
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
                    // Apply capture tuning from config (keep capture/neutralize in sync)
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
