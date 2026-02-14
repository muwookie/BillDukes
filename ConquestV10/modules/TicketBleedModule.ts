/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />
/// <reference path="ObjectiveModule.ts" />

/**
 * TicketBleedModule - Registry-Driven Ticket Logic
 * 
 * Responsibilities:
 * - Bleed tickets based on objective count difference
 * - Deduct tickets on deaths
 * - Refund tickets on revives
 * - Deduct tickets when objectives are lost
 * - Check win conditions
 */

namespace ConquestV8 {
    let initialized = false;

    export function Ticket_Init(): void {
        if (initialized) return;
        // Event registration happens via global OnPlayerDied and OnRevived handlers in main.script.ts
        initialized = true;
        log("[Ticket] Initialized (starting=" + STARTING_TICKETS + ")");
    }

    export function Ticket_OnPlayerDied(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            Registry_DeductTickets(teamId, TICKET_LOSS_ON_DEATH);
        } catch (e) {
            // Player invalid, ignore
        }
    }

    export function Ticket_OnPlayerRevived(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            const current = Registry_GetTickets(teamId);
            Registry_SetTickets(teamId, current + TICKET_REFUND_ON_REVIVE);
        } catch (e) {
            // Player invalid, ignore
        }
    }

    export function Ticket_Tick(): void {
        // Bleed tickets based on objective advantage
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
