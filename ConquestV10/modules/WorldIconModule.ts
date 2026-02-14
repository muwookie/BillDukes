/// <reference path="../config/ConquestConfig.ts" />

/**
 * WorldIconModule.ts - ConquestV5
 * 
 * Swaps HQ world icon colors between matches to give the visual appearance
 * of teams switching sides each round.
 * 
 * Map: MP_Capstone_Custom_Conquest_5
 * - Team 1 HQ Icon: ObjId 1502 (default blue)
 * - Team 2 HQ Icon: ObjId 1503 (default red)
 */

namespace ConquestV8 {
    // HQ World Icon ObjIds from the spatial JSON
    const TEAM1_HQ_ICON_OBJID = 1502;
    const TEAM2_HQ_ICON_OBJID = 1503;

    // Colors (custom team colors from color picker)
    const BLUE_COLOR = mod.CreateVector(0.443, 0.918, 0.996);   // NATO cyan #71EAFE
    const RED_COLOR = mod.CreateVector(1.0, 0.529, 0.396);      // PAX orange #FF8765

    // Track match count for diagnostics (not used for color swapping)
    // Note: This resets when the server restarts, but persists across rounds
    let matchCount = 0;

    // Cached icon references
    let team1Icon: mod.WorldIcon | null = null;
    let team2Icon: mod.WorldIcon | null = null;

    export function initWorldIconModule(): void {
        matchCount++;
        
        log(`[ConquestV10][WorldIcon] Initializing (match #${matchCount})`);

        // Get the world icon objects
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

        // Align icon colors with actual team factions
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
