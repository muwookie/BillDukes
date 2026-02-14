/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="./RegistryModule.ts" />

namespace ConquestV8 {
    // ConquestV4-style custom scoreboard with computed score.
    // Columns: Score, Kills, Deaths, Revives, Captures

    const SCORE_PER_KILL = 100;
    const SCORE_PER_CAPTURE = 250;
    const SCORE_PER_REVIVE = 150;

    const KILL_CREDIT_DEDUP_SECONDS = 0.05;

    let initialized = false;
    let ready = false;
    let lastSyncTime = -9999;
    let lastReconfigureTime = -9999;

    function getScoreboardHeaderLabels(): { team1: string; team2: string } {
        // Use deterministic labels to avoid UNKNOWN STRING when faction detection fails early
        // Portal often returns ambiguous faction data before match fully starts
        const team1Label = getTeamFactionLabel(1);
        const team2Label = getTeamFactionLabel(2);
        
        // Fallback to NATO/PAX if faction detection returns UNKNOWN (BF6 factions)
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

        // Use hardcoded team labels (same as working V5/V6)
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

        // Some runtimes appear to reset/override custom scoreboard configuration when the host's
        // team assignment finalizes (or when a team is changed). Re-apply config + force a sync.
        const ok = configureScoreboard();
        ready = ok;
        lastReconfigureTime = now(true);
        log(`[ConquestV10][Scoreboard] Reconfigure(${reason}) ready=${ready}`);
        safeCall("Scoreboard:ReconfigureSync", () => syncAllPlayers());
    }

    // Parallel arrays keyed by player ObjId.
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
        // Ensure rows appear immediately (some runtimes won't show anything until values are pushed).
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

    // Memory optimization: cache header messages to avoid repeated allocations
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
        // Memory optimization: remove entries for players that no longer exist
        // This prevents unbounded array growth over long matches
        if (sbPlayerIds.length === 0) return;

        const allPlayers = mod.AllPlayers();
        const count = mod.CountOf(allPlayers);
        const activeIds = new Set<number>();

        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(allPlayers, i) as mod.Player;
            if (p) activeIds.add(mod.GetObjId(p));
        }

        // Remove entries for players no longer in the match (iterate backwards to safely splice)
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

        // Memory optimization: prune disconnected players every sync
        pruneDisconnectedPlayers();

        // Use hardcoded team labels (same as working V5/V6)
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

        // Mirror ticket totals into team score for any built-in views.
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

        // Portal can reset custom scoreboard metadata (headers/columns) during early match setup.
        // Re-assert occasionally (low frequency) to keep the header from showing <UNKNOWN STRING>.
        // Memory optimization: increased from 15s to 60s to reduce allocation frequency
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

        // Dedup check (Portal sometimes double-fires kill credit for same victim).
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

    /**
     * Record vehicle destruction and award points based on vehicle type
     * Returns the points awarded (for logging/notification purposes)
     */
    export function Scoreboard_recordVehicleKill(killer: mod.Player, vehicle: mod.Vehicle): number {
        ensureInit();
        if (!killer || !vehicle) return 0;
        
        // Determine points based on vehicle type
        let points = SCORE_VEHICLE_DEFAULT;
        let category = "unknown";

        // Light vehicles
        const lightVehicles = [
            mod.VehicleList.Quadbike,
            mod.VehicleList.GolfCart,
            mod.VehicleList.Flyer60,
            mod.VehicleList.Marauder
        ];
        
        // Transport
        const transportVehicles = [
            mod.VehicleList.RHIB,
            mod.VehicleList.Marauder_Pax
        ];
        
        // IFVs
        const ifvVehicles = [
            mod.VehicleList.M2Bradley,
            mod.VehicleList.Vector,
            mod.VehicleList.CV90
        ];
        
        // AA vehicles
        const aaVehicles = [
            mod.VehicleList.Cheetah,
            mod.VehicleList.Gepard
        ];
        
        // Tanks
        const tankVehicles = [
            mod.VehicleList.Abrams,
            mod.VehicleList.Leopard
        ];
        
        // Helicopters
        const heliVehicles = [
            mod.VehicleList.UH60,
            mod.VehicleList.UH60_Pax,
            mod.VehicleList.AH64,
            mod.VehicleList.Eurocopter
        ];
        
        // Jets
        const jetVehicles = [
            mod.VehicleList.F16,
            mod.VehicleList.F22,
            mod.VehicleList.JAS39,
            mod.VehicleList.SU57
        ];

        // Check vehicle type and assign points
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

        // Only update scoreboard if enabled
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
        // Creates an entry (if missing) without mutating stats.
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player) return;
        const idx = ensurePlayerEntry(player);
        safeCall("Scoreboard:PushEnsure", () => pushPlayer(player, idx));
    }
}
