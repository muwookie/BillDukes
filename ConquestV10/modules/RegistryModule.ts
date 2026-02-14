/// <reference path="../config/ConquestConfig.ts" />

/**
 * RegistryModule - Single Source of Truth
 * 
 * All modules read/write through this registry.
 * No cross-module state drift, no engine value reliance.
 */

namespace ConquestV8 {
    // =========================================================================
    // Objective State
    // =========================================================================
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

    // =========================================================================
    // Ticket State
    // =========================================================================
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

    // =========================================================================
    // Squad State
    // =========================================================================
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

    // =========================================================================
    // AI Spawn State
    // =========================================================================
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

    // =========================================================================
    // Round State
    // =========================================================================
    export enum RoundState {
        PreRound,
        Active,
        Ending,
        Ended
    }

    let roundState = RoundState.PreRound;
    let roundStartTime = 0;
    
    // Track which Portal match round we're in (1, 2, 3, etc.)
    // This persists across OnGameModeStarted calls in the same match
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

    // =========================================================================
    // Portal Round Number (for detecting first round vs subsequent)
    // =========================================================================
    export function Registry_GetPortalRoundNumber(): number {
        return portalRoundNumber;
    }

    export function Registry_IncrementPortalRoundNumber(): number {
        portalRoundNumber++;
        log(`[Registry] Portal Round ${portalRoundNumber} starting`);
        return portalRoundNumber;
    }

    // =========================================================================
    // Reset
    // =========================================================================
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
