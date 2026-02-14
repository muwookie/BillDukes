/**
 * AircraftCombatModule - Simple Aircraft Behavior System
 * Manages helicopter and jet pilots/gunners with mode-based tactics.
 */

namespace ConquestV8 {
    let globalMode: AircraftMode = "Balanced";
    let nextModeSwitch = 0;
    const MODE_SWITCH_INTERVAL = 90;

    let pilots: Map<number, mod.Player> = new Map();
    let gunners: Map<number, mod.Player> = new Map();

    type AircraftMode = "Cinematic" | "Balanced" | "Aggressive";

    function isAircraft(v: mod.Vehicle): boolean {
        try {
            return (
                mod.CompareVehicleName(v, (mod.VehicleList as any).UH60) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).AH64) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).Eurocopter) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).F22) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).F16) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).JAS39) ||
                mod.CompareVehicleName(v, (mod.VehicleList as any).SU57)
            );
        } catch {
            return false;
        }
    }

    export function initAircraftCombat(): void {
        pilots.clear();
        gunners.clear();
        globalMode = "Balanced";
        nextModeSwitch = mod.GetMatchTimeElapsed() + MODE_SWITCH_INTERVAL;
        console.log("[AircraftCombat] Initialized");
    }

    export function tickAircraftCombat(): void {
        const now = mod.GetMatchTimeElapsed();

        if (now >= nextModeSwitch) {
            updateMode();
            nextModeSwitch = now + MODE_SWITCH_INTERVAL;
        }

        // Update pilots
        const deadPilots: number[] = [];
        for (const [vid, pilot] of pilots) {
            try {
                if (!pilot) {
                    deadPilots.push(vid);
                    continue;
                }
                if (!isAliveCheck(pilot)) {
                    deadPilots.push(vid);
                    continue;
                }
                const inVehicle = mod.GetSoldierState(pilot, mod.SoldierStateBool.IsInVehicle);
                if (!inVehicle) {
                    deadPilots.push(vid);
                    continue;
                }
                if (globalMode === "Aggressive") {
                    mod.AIBattlefieldBehavior(pilot);
                } else {
                    mod.AIBattlefieldBehavior(pilot);
                }
            } catch {
                deadPilots.push(vid);
            }
        }
        deadPilots.forEach(vid => pilots.delete(vid));

        // Update gunners
        const deadGunners: number[] = [];
        for (const [vid, gunner] of gunners) {
            try {
                if (!gunner) {
                    deadGunners.push(vid);
                    continue;
                }
                if (!isAliveCheck(gunner)) {
                    deadGunners.push(vid);
                    continue;
                }
                
                // Get gunner's team to find ENEMIES only
                const gunnerTeamId = getPlayerTeamId(gunner);
                if (gunnerTeamId === 0) continue; // Can't determine team
                
                const allPlayers = mod.AllPlayers();
                const count = mod.CountOf(allPlayers);
                let target: mod.Player | null = null;
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                    if (!p) continue;
                    if (!isAliveCheck(p)) continue;
                    
                    // CRITICAL: Only target ENEMIES, not friendlies!
                    const targetTeamId = getPlayerTeamId(p);
                    if (targetTeamId === gunnerTeamId || targetTeamId === 0) continue;
                    
                    target = p;
                    break;
                }
                if (target) {
                    mod.AISetTarget(gunner, target);
                }
            } catch {
                deadGunners.push(vid);
            }
        }
        deadGunners.forEach(vid => gunners.delete(vid));
    }

    function updateMode(): void {
        let contested = 0;
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (cp) contested++;
            }
        } catch {
            //
        }
        const t1 = getTickets(1);
        const t2 = getTickets(2);
        const delta = Math.abs(t1 - t2);
        if (contested > 2 || delta > 100) {
            globalMode = "Aggressive";
        } else {
            globalMode = "Balanced";
        }
    }

    export function registerAircraftPilot(v: mod.Vehicle, p: mod.Player): void {
        try {
            if (!isAircraft(v)) return;
            const vid = mod.GetObjId(v);
            pilots.set(vid, p);
        } catch {
            //
        }
    }

    export function registerAircraftGunner(v: mod.Vehicle, g: mod.Player): void {
        try {
            if (!isAircraft(v)) return;
            const vid = mod.GetObjId(v);
            gunners.set(vid, g);
        } catch {
            //
        }
    }

    function isAliveCheck(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsAlive) === true;
        } catch {
            return false;
        }
    }
}
