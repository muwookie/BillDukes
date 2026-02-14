/// <reference path="../config/ConquestConfig.ts" />

// ConquestV4-derived sound module (ported to ConquestV5 namespace).
// - Spawns RuntimeSpawn_Common SFX handles once (SpawnObject), then uses PlaySound.
// - Uses PlayVO with a VO module context for reliable voice-overs.
// - Emits 1Hz capture "tick" audio to players ON the point (based on capture progress changes).

namespace ConquestV8 {
    let initialized = false;
    let audioInitialized = false;

    // SFX handles
    let sfxCaptureStartedFriendly: mod.SFX | null = null;
    let sfxCaptureStartedEnemy: mod.SFX | null = null;
    let sfxCapturedFriendly: mod.SFX | null = null;
    let sfxNeutralize: mod.SFX | null = null;
    let sfxContested: mod.SFX | null = null;
    let sfxObjectiveEnter: mod.SFX | null = null;
    let sfxObjectiveExit: mod.SFX | null = null;
    let sfxTickFriendly: mod.SFX | null = null;
    let sfxTickEnemy: mod.SFX | null = null;
    // Match ConquestV4: VO module is spawned as an SFX and we use its ObjId as the PlayVO context.
    let sfxVoModule: mod.SFX | null = null;

    let voModuleObjId = 0;
    let team1Handle: mod.Team | null = null;
    let team2Handle: mod.Team | null = null;

    const CAPTURE_SOUND_COOLDOWN = 3.0;
    const TICK_SOUND_INTERVAL = 1.0;  // Must be >= 1.0s for performance

    const lastCaptureStatusByObj: number[] = [];
    const lastCaptureSoundTimeByObj: number[] = [];
    const lastTickSoundTimeByObj: number[] = [];
    const lastCaptureProgressByObj: number[] = [];
    const neutralizePlayedByObj: boolean[] = [];

    const VO_FLAGS: mod.VoiceOverFlags[] = [];

    export function initSoundsModule(): void {
        initialized = true;
        audioInitialized = false;

        voModuleObjId = 0;
        team1Handle = mod.GetTeam(1);
        team2Handle = mod.GetTeam(2);

        VO_FLAGS.length = 0;
        VO_FLAGS.push(mod.VoiceOverFlags.Alpha);
        VO_FLAGS.push(mod.VoiceOverFlags.Bravo);
        VO_FLAGS.push(mod.VoiceOverFlags.Charlie);
        VO_FLAGS.push(mod.VoiceOverFlags.Delta);
        VO_FLAGS.push(mod.VoiceOverFlags.Echo);
        VO_FLAGS.push(mod.VoiceOverFlags.Foxtrot);
        VO_FLAGS.push(mod.VoiceOverFlags.Golf);

        const n = OBJECTIVES.length;
        lastCaptureStatusByObj.length = n;
        lastCaptureSoundTimeByObj.length = n;
        lastTickSoundTimeByObj.length = n;
        lastCaptureProgressByObj.length = n;
        neutralizePlayedByObj.length = n;

        for (let i = 0; i < n; i++) {
            lastCaptureStatusByObj[i] = 0;
            lastCaptureSoundTimeByObj[i] = -9999;
            lastTickSoundTimeByObj[i] = -9999;
            lastCaptureProgressByObj[i] = 0;
            neutralizePlayedByObj[i] = false;
        }

        log("[ConquestV10][Sounds] Initialized");
    }

    function ensureInit(): void {
        if (!initialized) initSoundsModule();
    }

    function spawnSfx(spawnId: number): mod.SFX | null {
        if (!spawnId) return null;
        try {
            const zero = mod.CreateVector(0, 0, 0);
            return mod.SpawnObject(spawnId, zero, zero, zero) as mod.SFX;
        } catch (_e) {
            return null;
        }
    }

    function initAudioHandles(): void {
        if (audioInitialized) return;

        safeCall("Sounds:SpawnHandles", () => {
            sfxCaptureStartedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByFriendly_OneShot2D
            );
            sfxCaptureStartedEnemy = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByEnemy_OneShot2D
            );
            sfxCapturedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnCapturedByFriendly_OneShot2D
            );
            sfxNeutralize = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureNeutralize_OneShot2D);
            sfxContested = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnContested_OneShot2D);
            sfxObjectiveEnter = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnEnter_OneShot2D);
            sfxObjectiveExit = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnExit_OneShot2D);
            sfxTickFriendly = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D);
            sfxTickEnemy = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D);
            sfxVoModule = spawnSfx(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D);
        });

        if (sfxVoModule) {
            safeCall("Sounds:VoContext", () => {
                voModuleObjId = mod.GetObjId(sfxVoModule as unknown as mod.Object);
                log(`[ConquestV10][Sounds] VO module spawned objId=${voModuleObjId}`);
            });
        } else {
            voModuleObjId = 0;
            log("[ConquestV10][Sounds] VO module spawn FAILED (no VO)");
        }

        audioInitialized = true;
    }

    function refreshAudioHandles(): void {
        ensureInit();
        if (!audioInitialized) initAudioHandles();
    }

    function getTeamId(team: mod.Team | null): number {
        if (!team) return 0;
        try {
            const id = mod.GetObjId(team);
            return id === 1 || id === 2 ? id : 0;
        } catch (_e) {
            return 0;
        }
    }

    function getObjectiveIndexByObjId(objId: number): number {
        const objectives = Registry_GetObjectives();
        for (let i = 0; i < objectives.length; i++) {
            if (objectives[i].objId === objId) return i;
        }
        return -1;
    }

    // Direct letter-to-VO flag mapping (bypasses array index issues)
    function getVoFlagForLetter(letter: string): mod.VoiceOverFlags | undefined {
        switch (letter) {
            case "A": return mod.VoiceOverFlags.Alpha;
            case "B": return mod.VoiceOverFlags.Bravo;
            case "C": return mod.VoiceOverFlags.Charlie;
            case "D": return mod.VoiceOverFlags.Delta;
            case "E": return mod.VoiceOverFlags.Echo;
            case "F": return mod.VoiceOverFlags.Foxtrot;
            case "G": return mod.VoiceOverFlags.Golf;
            default: return undefined;
        }
    }

    // Get VO flag from objId by looking up the objective letter
    function getVoFlagForObjId(objId: number): mod.VoiceOverFlags | undefined {
        const objective = getObjectiveByObjId(objId);
        if (objective) {
            console.log(`[Sounds] getVoFlagForObjId: objId=${objId} -> letter=${objective.id} -> ${objective.name}`);
            return getVoFlagForLetter(objective.id);
        }
        console.log(`[Sounds] getVoFlagForObjId: objId=${objId} not found`);
        return undefined;
    }

    function playSoundOnPlayer(sfx: mod.SFX | null, player: mod.Player | null, volume: number): void {
        if (!sfx || !player) return;
        try {
            mod.PlaySound(sfx, volume, player);
        } catch (_e) {
            // silent
        }
    }

    function playSoundToTeam(sfx: mod.SFX | null, team: mod.Team | null, volume: number): void {
        if (!sfx || !team) return;
        try {
            const targetTeamId = mod.GetObjId(team);
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                if (getPlayerTeamId(player) !== targetTeamId) continue;
                playSoundOnPlayer(sfx, player, volume);
            }
        } catch (_e) {
            // silent
        }
    }

    function playSoundToAllPlayers(sfx: mod.SFX | null, volume: number): void {
        if (!sfx) return;
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                playSoundOnPlayer(sfx, player, volume);
            }
        } catch (_e) {
            // silent
        }
    }

    function playVoToTeam(teamId: number, voEvent: mod.VoiceOverEvents2D, voFlag: mod.VoiceOverFlags): void {
        refreshAudioHandles();
        const team = teamId === 1 ? team1Handle : teamId === 2 ? team2Handle : null;
        if (!team) return;

        // Match ConquestV4: use numeric context (VO module ObjId) + team target.
        const voContext = voModuleObjId > 0 ? voModuleObjId : mod.GetObjId(team);
        try {
            mod.PlayVO(voContext, voEvent, voFlag, team);
            // NOTE: PlayVO logging removed to prevent memory pressure (was firing 100s of times per match)
        } catch (_e) {
            // Silent (Portal can throw non-stringifiable errors here).
        }
    }

    function playCaptureStartedSFX(capturingTeamId: number): void {
        refreshAudioHandles();
        const friendlyTeam = capturingTeamId === 1 ? team1Handle : team2Handle;
        const enemyTeam = capturingTeamId === 1 ? team2Handle : team1Handle;
        playSoundToTeam(sfxCaptureStartedFriendly, friendlyTeam, 1.0);
        playSoundToTeam(sfxCaptureStartedEnemy, enemyTeam, 1.0);
    }

    function playCaptureCompleteSFX(newOwnerTeamId: number, previousOwnerTeamId: number): void {
        refreshAudioHandles();
        const newOwnerTeam = newOwnerTeamId === 1 ? team1Handle : newOwnerTeamId === 2 ? team2Handle : null;
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (newOwnerTeam) playSoundToTeam(sfxCapturedFriendly, newOwnerTeam, 1.0);
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);
    }

    function playContestedSFX(): void {
        refreshAudioHandles();
        playSoundToAllPlayers(sfxContested, 0.9);
    }

    function playCapturedSound(teamId: number, objId: number, previousOwnerTeamId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;

        console.log(`[Sounds] playCapturedSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, losingTeam=${otherTeam}`);

        playCaptureCompleteSFX(teamId, previousOwnerTeamId);

        // Skip VO if objective letter not recognized
        if (voFlag === undefined) return;

        // Losing team: "enemy captured [flag]"
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voFlag);
        // Capturing team: "we captured [flag]"
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCaptured, voFlag);
    }

    function playContestedSound(_objectiveIndex: number): void {
        playContestedSFX();
        // Contested VO disabled - SFX only
    }

    function playCaptureStartSound(teamId: number, objId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;

        console.log(`[Sounds] playCaptureStartSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, enemyTeam=${otherTeam}`);

        playCaptureStartedSFX(teamId);

        // Skip VO if objective letter not recognized
        if (voFlag === undefined) return;
        
        // Capturing team: "we're taking [flag]"
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCapturing, voFlag);
        // Enemy team: "we're losing [flag]"
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveTerritoryLost, voFlag);
    }

    function playNeutralizeSound(previousOwnerTeamId: number, objId: number): void {
        refreshAudioHandles();
        const voFlag = getVoFlagForObjId(objId);
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);

        if (voFlag === undefined) return;
        if (previousOwnerTeamId === 1 || previousOwnerTeamId === 2) {
            playVoToTeam(previousOwnerTeamId, mod.VoiceOverEvents2D.ObjectiveNeutralised, voFlag);
        }
    }

    function isContestedByPlayers(cp: mod.CapturePoint): boolean {
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(playersOnPoint);
            let seen1 = false;
            let seen2 = false;
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) seen1 = true;
                if (tid === 2) seen2 = true;
                if (seen1 && seen2) return true;
            }
        } catch (_e) {
            // ignore
        }
        return false;
    }

    export function Sounds_notifyCaptureStatus(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;

        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;

        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - (lastCaptureSoundTimeByObj[objectiveIndex] ?? -9999) < CAPTURE_SOUND_COOLDOWN) return;

        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        const contested = isContestedByPlayers(cp);

        const prevStatus = lastCaptureStatusByObj[objectiveIndex] ?? 0;

        if (contested) {
            lastCaptureStatusByObj[objectiveIndex] = -1;
            playContestedSound(objectiveIndex);
            lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
            return;
        }

        if ((capturingTeamId === 1 || capturingTeamId === 2) && capturingTeamId !== ownerTeamId) {
            if (capturingTeamId === prevStatus) return;
            lastCaptureStatusByObj[objectiveIndex] = capturingTeamId;
            neutralizePlayedByObj[objectiveIndex] = false;
            playCaptureStartSound(capturingTeamId, objId);
            lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
        }
    }

    export function Sounds_notifyCaptureTick(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;

        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;

        if (isContestedByPlayers(cp)) return;

        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) return;

        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));

        let progress = 0;
        try {
            progress = mod.GetCaptureProgress(cp);
        } catch (_e) {
            return;
        }
        if (progress <= 0 || progress >= 1) return;

        if (ownerTeamId === 1 || ownerTeamId === 2) {
            const wasNeutralized = neutralizePlayedByObj[objectiveIndex] ?? false;
            if (!wasNeutralized && progress >= 0.5 && capturingTeamId !== ownerTeamId) {
                neutralizePlayedByObj[objectiveIndex] = true;
                playNeutralizeSound(ownerTeamId, objId);
            }
        }

        const timeNow = mod.GetMatchTimeElapsed();
        const lastTickTime = lastTickSoundTimeByObj[objectiveIndex] ?? -9999;
        if (timeNow - lastTickTime < TICK_SOUND_INTERVAL) return;

        lastTickSoundTimeByObj[objectiveIndex] = timeNow;
        lastCaptureProgressByObj[objectiveIndex] = progress;

        refreshAudioHandles();

        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(playersOnPoint);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                if (!player) continue;
                const playerTeamId = getPlayerTeamId(player);
                if (playerTeamId === capturingTeamId) {
                    playSoundOnPlayer(sfxTickFriendly, player, 1.0);
                } else if (playerTeamId === 1 || playerTeamId === 2) {
                    playSoundOnPlayer(sfxTickEnemy, player, 1.0);
                }
            }
        } catch (_e) {
            // silent
        }
    }

    export function Sounds_onCapturePointCaptured(cp: mod.CapturePoint, previousOwnerTeamId: number): void {
        ensureInit();
        if (!cp) return;

        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;

        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        if (ownerTeamId !== 1 && ownerTeamId !== 2) return;

        neutralizePlayedByObj[objectiveIndex] = false;

        playCapturedSound(ownerTeamId, objId, previousOwnerTeamId);
    }

    function playImmediateTickOnEnter(player: mod.Player, cp: mod.CapturePoint): void {
        if (!player || !cp) return;

        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;

        if (isContestedByPlayers(cp)) return;

        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) return;

        let progress = 0;
        try {
            progress = mod.GetCaptureProgress(cp);
        } catch (_e) {
            return;
        }
        if (progress <= 0 || progress >= 1) return;

        const playerTeamId = getPlayerTeamId(player);
        const tickSfx = playerTeamId === capturingTeamId ? sfxTickFriendly : (playerTeamId === 1 || playerTeamId === 2 ? sfxTickEnemy : null);
        if (!tickSfx) return;

        const timeNow = mod.GetMatchTimeElapsed();
        lastTickSoundTimeByObj[objectiveIndex] = timeNow;
        lastCaptureProgressByObj[objectiveIndex] = progress;
        playSoundOnPlayer(tickSfx, player, 0.7);
    }

    export function Sounds_onPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveEnter, player, 0.6);
        playImmediateTickOnEnter(player, cp);
    }

    export function Sounds_onPlayerExitCapturePoint(player: mod.Player): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveExit, player, 0.6);
    }

    export function Sounds_playMatchStart(): void {
        ensureInit();
        refreshAudioHandles();
        playVoToTeam(1, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
        playVoToTeam(2, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
    }
}
