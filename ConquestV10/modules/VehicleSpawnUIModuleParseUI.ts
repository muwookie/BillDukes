/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />

/**
 * VehicleSpawnUIModuleParseUI - TEST MODULE using modlib ParseUI helper
 * 
 * Experimental rebuild of vehicle spawn UI using ParseUI() from modlib.
 * Goal: test if ParseUI provides better cursor/interaction behavior.
 * DEPLOY SCREEN ONLY - shown when player is dead/on deploy screen.
 * FIXED: Only shows when round is ACTIVE (not during pre-round warmup).
 */

namespace ConquestV8 {
    let vehicleUIParseInitialized = false;
    let vehicleUIParseCreated = false;

    // Store widget references for button identification
    const vehicleButtonsParseUI: Map<string, { 
        vehicleType: mod.VehicleList; 
        matchTypes: mod.VehicleList[];
        label: string;
        spawnerId: number;
        teamId: number;
    }> = new Map();

    // Per-player widgets
    const playerWidgetNamesParseUI: Map<number, string[]> = new Map();
    const playerUIVisibleParseUI: Set<number> = new Set();

    // Suppress UI during spawn/deploy flow
    const suppressUIUntilByPlayerId: Map<number, number> = new Map();

    // Debounce
    let lastButtonClickTimeParseUI = 0;
    const BUTTON_DEBOUNCE_SECONDS = 1.0;

    // HQ Spawn Point IDs
    const TEAM1_HQ_SPAWN_POINTS = [1009, 1010, 1012, 1013];
    const TEAM2_HQ_SPAWN_POINTS = [1014, 1015, 1016, 1017];

    // UI Configuration - 3x3 GRID LAYOUT (below/right of MANAGE SQUAD)
    const UI_PANEL_X = 1880;  // Right side of screen
    const UI_PANEL_Y = 280;   // Below MANAGE SQUAD
    const BUTTON_SIZE = 70;   // Button size for 3x3 grid
    const BUTTON_GAP = 10;
    const ROW_HEIGHT = 85;    // Adjusted for grid layout
    const BUTTONS_PER_ROW = 3; // 3 columns for 3x3 grid

    type VehicleCategory = 'Ground' | 'Air';

    interface VehicleDef {
        type: mod.VehicleList;
        label: string;
        spawnerId: number;
        category: VehicleCategory;
        matchTypes?: mod.VehicleList[];
    }

    // =========================================================================
    // MAP-SPECIFIC VEHICLE CONFIGURATIONS
    // =========================================================================
    // Each map has different vehicle spawners with different vehicle types.
    // The UI dynamically loads the correct config based on detected map.
    
    interface MapVehicleConfig {
        team1: VehicleDef[];
        team2: VehicleDef[];
    }
    
    // -------------------------------------------------------------------------
    // CAPSTONE - Large open map with heavy armor + jets + helicopters (18 total)
    // -------------------------------------------------------------------------
    const CAPSTONE_CONFIG: MapVehicleConfig = {
        team1: [
            // Row 1 - Ground (Tank, IFV, AA)
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 208, category: 'Ground' },
            // Row 2 - Jets + Transport
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
            // Row 3 - Attack Helis + IFV
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 207, category: 'Ground' },
        ],
        team2: [
            // Row 1 - Ground (Tank, IFV, AA)
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 247, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground' },
            // Row 2 - Jets + Transport
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
            // Row 3 - Attack Helis
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
        ]
    };
    
    // -------------------------------------------------------------------------
    // EASTWOOD - Mixed terrain with more vehicles per team (22 total)
    // -------------------------------------------------------------------------
    const EASTWOOD_CONFIG: MapVehicleConfig = {
        team1: [
            // Row 1 - Ground (Tank, IFV, AA)
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 208, category: 'Ground' },
            // Row 2 - Marauder + Jets
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 253, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            // Row 3 - Helicopters
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            // Row 1 - Ground (Tank, IFV, AA)
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 248, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 234, category: 'Ground' },
            // Row 2 - Marauder + Jets
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 249, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            // Row 3 - Helicopters
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
        ]
    };
    
    // -------------------------------------------------------------------------
    // DOWNTOWN (GRANITE_MAINSTREET) - Original config (kept for reference)
    // -------------------------------------------------------------------------
    const DOWNTOWN_CONFIG: MapVehicleConfig = {
        team1: [
            // Row 1 - Ground
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 202, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 207, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 204, category: 'Ground' },
            // Row 2
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 208, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            // Row 3
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            // Row 1
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 209, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 239, category: 'Air' },
            // Row 2
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 215, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 247, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 233, category: 'Air' },
            // Row 3
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 244, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
        ]
    };
    
    // =========================================================================
    // ACTIVE VEHICLE CONFIG (set at runtime based on map detection)
    // =========================================================================
    let activeMapConfig: MapVehicleConfig = DOWNTOWN_CONFIG; // Default fallback
    let detectedMapName = 'Unknown';
    
    // Helper accessors for the active config
    function getTeam1Vehicles(): VehicleDef[] {
        return activeMapConfig.team1;
    }
    
    function getTeam2Vehicles(): VehicleDef[] {
        return activeMapConfig.team2;
    }
    
    /**
     * Detect current map and load appropriate vehicle configuration.
     * Called during initialization before UI is created.
     */
    function detectMapAndLoadVehicleConfig(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                activeMapConfig = CAPSTONE_CONFIG;
                detectedMapName = 'Capstone';
            } else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                activeMapConfig = EASTWOOD_CONFIG;
                detectedMapName = 'Eastwood';
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                activeMapConfig = DOWNTOWN_CONFIG;
                detectedMapName = 'Downtown';
            } else {
                // Unknown map - use Downtown as fallback
                activeMapConfig = DOWNTOWN_CONFIG;
                detectedMapName = 'Unknown (using Downtown config)';
            }
            log(`[VehicleUIParseUI] Map detected: ${detectedMapName} - loaded ${activeMapConfig.team1.length + activeMapConfig.team2.length} vehicle configs`);
        } catch (e) {
            log(`[VehicleUIParseUI] Map detection failed: ${e} - using Downtown fallback`);
            activeMapConfig = DOWNTOWN_CONFIG;
            detectedMapName = 'Error (using Downtown config)';
        }
    }

    interface SpawnRequest {
        playerId: number;
        teamId: number;
        spawnerId: number;
        vehicleType: mod.VehicleList;
        matchTypes: mod.VehicleList[];
        label: string;
        time: number;
    }

    const pendingSpawnRequestsByPlayerId: Map<number, SpawnRequest> = new Map();
    const assignedSpawnedVehicleIdByPlayerId: Map<number, number> = new Map();
    const MAX_SPAWN_ASSIGN_SECONDS = 8.0;

    // Per-player jet cooldown tracking (playerId -> cooldown expiration time)
    // Jets are constantly in the air, so we need a longer cooldown to prevent spam
    const jetCooldownByPlayerId: Map<number, number> = new Map();
    const JET_COOLDOWN_SECONDS = 40.0; // 40-second cooldown for jets specifically

    // ========== VEHICLE AVAILABILITY SYSTEM ==========
    // Track spawner/vehicle status for UI indicators (like main game's fill-up animation)
    
    type VehicleStatus = 'available' | 'cooldown' | 'occupied' | 'destroyed';
    
    interface SpawnerStatus {
        spawnerId: number;
        status: VehicleStatus;
        cooldownStartTime: number;      // When the cooldown started
        cooldownDuration: number;       // Total cooldown duration
        vehicleObjId: number | null;    // Currently spawned vehicle ID (if any)
    }
    
    // Track status per spawner
    const spawnerStatusMap: Map<number, SpawnerStatus> = new Map();
    
    // Spawner cooldown duration (default - spawner-based respawn)
    const SPAWNER_COOLDOWN_SECONDS = 30.0;
    
    // Last UI update time (don't spam updates)
    let lastUIStatusUpdateTime = 0;
    const UI_STATUS_UPDATE_INTERVAL = 0.5; // Update every 0.5 seconds

    // List of jet vehicle types for cooldown check
    const JET_VEHICLE_TYPES: mod.VehicleList[] = [
        mod.VehicleList.F22,
        mod.VehicleList.F16,
        mod.VehicleList.JAS39,
        mod.VehicleList.SU57
    ];

    function isJetVehicle(vehicleType: mod.VehicleList): boolean {
        return JET_VEHICLE_TYPES.includes(vehicleType);
    }

    function getJetCooldownRemaining(playerId: number): number {
        const cooldownExpires = jetCooldownByPlayerId.get(playerId);
        if (!cooldownExpires) return 0;
        const remaining = cooldownExpires - mod.GetMatchTimeElapsed();
        return remaining > 0 ? remaining : 0;
    }

    function setJetCooldown(playerId: number): void {
        jetCooldownByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + JET_COOLDOWN_SECONDS);
        logDebug(`[VehicleUIParseUI] Set jet cooldown for player ${playerId}: ${JET_COOLDOWN_SECONDS}s`);
    }

    // Initialize spawner status tracking for all vehicles
    function initSpawnerStatusTracking(): void {
        spawnerStatusMap.clear();
        
        // Initialize status for all spawners (both teams)
        const allVehicles = [...getTeam1Vehicles(), ...getTeam2Vehicles()];
        for (const vehicle of allVehicles) {
            if (!spawnerStatusMap.has(vehicle.spawnerId)) {
                spawnerStatusMap.set(vehicle.spawnerId, {
                    spawnerId: vehicle.spawnerId,
                    status: 'available', // Assume available at start
                    cooldownStartTime: 0,
                    cooldownDuration: SPAWNER_COOLDOWN_SECONDS,
                    vehicleObjId: null
                });
            }
        }
        logDebug(`[VehicleUIParseUI] Initialized status tracking for ${spawnerStatusMap.size} spawners`);
    }

    // Mark a spawner as on cooldown (called when vehicle is destroyed or spawner used)
    function setSpawnerCooldown(spawnerId: number, duration: number = SPAWNER_COOLDOWN_SECONDS): void {
        const status = spawnerStatusMap.get(spawnerId);
        if (status) {
            status.status = 'cooldown';
            status.cooldownStartTime = mod.GetMatchTimeElapsed();
            status.cooldownDuration = duration;
            status.vehicleObjId = null;
            logDebug(`[VehicleUIParseUI] Spawner ${spawnerId} on cooldown for ${duration}s`);
        }
    }

    // Get cooldown progress (0 = just started, 1 = ready)
    function getSpawnerCooldownProgress(spawnerId: number): number {
        const status = spawnerStatusMap.get(spawnerId);
        if (!status) return 1.0;
        if (status.status !== 'cooldown') return 1.0;
        
        const elapsed = mod.GetMatchTimeElapsed() - status.cooldownStartTime;
        const progress = Math.min(1.0, elapsed / status.cooldownDuration);
        return progress;
    }

    // Check if spawner/vehicle is available
    function isSpawnerAvailable(spawnerId: number): boolean {
        const status = spawnerStatusMap.get(spawnerId);
        if (!status) return true; // Unknown = assume available
        return status.status === 'available';
    }

    export function initVehicleSpawnUIParseUI(): void {
        // Detect map and load appropriate vehicle configuration FIRST
        detectMapAndLoadVehicleConfig();
        
        vehicleUIParseInitialized = true;
        vehicleUIParseCreated = false;
        vehicleButtonsParseUI.clear();
        playerWidgetNamesParseUI.clear();
        playerUIVisibleParseUI.clear();
        jetCooldownByPlayerId.clear(); // Reset cooldowns on init
        initSpawnerStatusTracking(); // Initialize availability tracking
        logDebug(`[VehicleUIParseUI] Module initialized for map: ${detectedMapName} (ParseUI test mode)`);
        
        // Create the UI system immediately on init (but widgets won't be visible yet)
        // This ensures the system is ready when players reach deploy screen
        createVehicleSpawnUIParseUI();
    }

    function ensureInitParseUI(): void {
        if (!vehicleUIParseInitialized) {
            initVehicleSpawnUIParseUI();
        }
    }

    export function createVehicleSpawnUIParseUI(): void {
        if (vehicleUIParseCreated) return; // Already created
        ensureInitParseUI();
        vehicleUIParseCreated = true;
        logDebug("[VehicleUIParseUI] UI system ready (ParseUI test mode)");
    }

    function setUIInputModeForPlayerParseUI(player: mod.Player, enabled: boolean): void {
        try {
            mod.EnableUIInputMode(enabled, player);
        } catch (_e) {
            // ignore
        }
    }

    function setPlayerUIVisibleParseUI(player: mod.Player, visible: boolean): void {
        const playerId = mod.GetObjId(player);
        const names = playerWidgetNamesParseUI.get(playerId);
        if (!names) return;

        for (const widgetName of names) {
            try {
                const widget = mod.FindUIWidgetWithName(widgetName);
                if (!widget) continue;
                mod.SetUIWidgetVisible(widget as mod.UIWidget, visible);
            } catch (_e) {
                // ignore
            }
        }

        if (visible) {
            playerUIVisibleParseUI.add(playerId);
        } else {
            playerUIVisibleParseUI.delete(playerId);
        }
    }

    function getWidgetPlayerIdFromName(widgetName: string): number | null {
        try {
            const match = /_P(\d+)$/.exec(widgetName);
            if (!match) return null;
            return parseInt(match[1], 10);
        } catch (_e) {
            return null;
        }
    }

    function parseUIButtonEvent(event: mod.UIButtonEvent): {
        name: string;
        raw: string;
        isClick: boolean;
        isHoverIn: boolean;
        isFocusIn: boolean;
    } {
        const raw = String(event);
        let name = "Unknown";
        let isClick = false;
        let isHoverIn = false;
        let isFocusIn = false;

        // Numeric enum path (most runtimes)
        if (typeof (event as unknown) === "number") {
            switch (event) {
                case mod.UIButtonEvent.ButtonDown:
                    name = "ButtonDown";
                    isClick = true;
                    break;
                case mod.UIButtonEvent.ButtonUp:
                    name = "ButtonUp";
                    isClick = true;
                    break;
                case mod.UIButtonEvent.FocusIn:
                    name = "FocusIn";
                    isFocusIn = true;
                    break;
                case mod.UIButtonEvent.FocusOut:
                    name = "FocusOut";
                    break;
                case mod.UIButtonEvent.HoverIn:
                    name = "HoverIn";
                    isHoverIn = true;
                    break;
                case mod.UIButtonEvent.HoverOut:
                    name = "HoverOut";
                    break;
                default:
                    break;
            }
            return { name, raw, isClick, isHoverIn, isFocusIn };
        }

        // String fallback path
        if (raw.includes("ButtonDown")) {
            name = "ButtonDown";
            isClick = true;
        } else if (raw.includes("ButtonUp")) {
            name = "ButtonUp";
            isClick = true;
        } else if (raw.includes("FocusIn")) {
            name = "FocusIn";
            isFocusIn = true;
        } else if (raw.includes("FocusOut")) {
            name = "FocusOut";
        } else if (raw.includes("HoverIn")) {
            name = "HoverIn";
            isHoverIn = true;
        } else if (raw.includes("HoverOut")) {
            name = "HoverOut";
        }

        return { name, raw, isClick, isHoverIn, isFocusIn };
    }

    function ensurePlayerUIParseUI(player: mod.Player): void {
        if (!vehicleUIParseCreated) return;
        const playerId = mod.GetObjId(player);
        if (playerWidgetNamesParseUI.has(playerId)) {
            log("[VehicleUI] UI already exists for player " + playerId);
            return;
        }

        log("[VehicleUI] Creating vehicle spawn UI for player " + playerId);
        const teamId = getPlayerTeamId(player);
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();
        const names: string[] = [];
        playerWidgetNamesParseUI.set(playerId, names);

        try {
            const panelName = `ParseUIVehiclePanel_P${playerId}_T${teamId}`;
            names.push(panelName);

            // Build a 3x3 grid with ALL vehicles
            const children: any[] = [];
            
            for (let i = 0; i < vehicles.length; i++) {
                const vehicle = vehicles[i];
                const row = Math.floor(i / BUTTONS_PER_ROW);
                const col = i % BUTTONS_PER_ROW;

                const btnX = col * (BUTTON_SIZE + BUTTON_GAP);
                const btnY = row * ROW_HEIGHT;

                const buttonName = `ParseUIBtn_${teamId}_${vehicle.spawnerId}_P${playerId}`;
                names.push(buttonName);

                // Button Background - Cyan blue theme
                children.push({
                    type: 'Button',
                    name: buttonName,
                    position: [btnX, btnY, 0],
                    size: [BUTTON_SIZE, BUTTON_SIZE, 0],
                    anchor: mod.UIAnchor.TopLeft,
                    visible: true,
                    buttonEnabled: true,
                    buttonColorBase: [0.0, 0.7, 0.9],    // Cyan blue (normal)
                    buttonColorHover: [0.5, 0.85, 1.0],  // Light blue (hover/pressed)
                    bgColor: [0.0, 0.3, 0.4],            // Dark cyan background
                    bgAlpha: 0.9
                });

                // Label centered on button
                // Use mod.Message("{}", text) for custom text, NOT plain strings
                // Plain strings are treated as localization keys and show "unknown string"
                children.push({
                    type: 'Text',
                    name: `ParseUILabel_${buttonName}`,
                    position: [btnX, btnY + (BUTTON_SIZE / 2 - 10), 0],
                    size: [BUTTON_SIZE, 20, 0],
                    anchor: mod.UIAnchor.TopLeft,
                    textLabel: mod.Message("{}", vehicle.label),
                    textSize: 12,
                    textColor: [1.0, 1.0, 1.0],
                    textAlpha: 1.0,
                    bgColor: [0.0, 0.0, 0.0],
                    bgAlpha: 0.5,
                    textAnchor: mod.UIAnchor.Center
                });

                const matchTypes = vehicle.matchTypes ?? [vehicle.type];
                vehicleButtonsParseUI.set(buttonName, {
                    vehicleType: vehicle.type,
                    matchTypes,
                    label: vehicle.label,
                    spawnerId: vehicle.spawnerId,
                    teamId
                });
            }

            // Use ParseUI to create container with 3x3 grid of buttons (right side panel)
            const container = ParseUI({
                type: 'Container',
                name: panelName,
                position: [UI_PANEL_X, UI_PANEL_Y, 0],
                size: [280, 280, 0], // 3x3 grid container
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                bgColor: [0.0, 0.0, 0.0],
                bgAlpha: 0.0, // Invisible container background
                playerId: player,
                children: children
            });

            if (container) {
                mod.SetUIWidgetDepth(container, mod.UIDepth.AboveGameUI);
            }

            // Enable button events explicitly
            for (const widgetName of names) {
                if (!widgetName.includes("ParseUIBtn_")) continue;
                try {
                    const widget = mod.FindUIWidgetWithName(widgetName);
                    if (!widget) continue;
                    mod.EnableUIButtonEvent(widget as mod.UIWidget, mod.UIButtonEvent.ButtonDown, true);
                    mod.EnableUIButtonEvent(widget as mod.UIWidget, mod.UIButtonEvent.ButtonUp, true);
                } catch (_e) {
                    // ignore
                }
            }

            logDebug(`[VehicleUIParseUI] ParseUI panel created for player ${playerId}`);
        } catch (e) {
            logDebug(`[VehicleUIParseUI] Failed to create ParseUI for player ${playerId}: ${e}`);
        }
    }

    export function handleVehicleButtonPressParseUI(player: mod.Player, widget: mod.UIWidget, buttonEvent: mod.UIButtonEvent): boolean {
        ensureInitParseUI();

        if (!player || !widget) return false;

        const matchTime = mod.GetMatchTimeElapsed();
        logDebug(`[VehicleUIParseUI] BUTTON EVENT at matchTime=${matchTime.toFixed(1)}s`);

        try {
            const widgetName = mod.GetUIWidgetName(widget);
            const eventInfo = parseUIButtonEvent(buttonEvent);
            logDebug(`[VehicleUIParseUI] Button event=${eventInfo.name} raw=${eventInfo.raw} widget=${widgetName}`);

            const playerId = mod.GetObjId(player);
            const widgetPlayerId = getWidgetPlayerIdFromName(widgetName);
            if (widgetPlayerId !== null && widgetPlayerId !== playerId) {
                logDebug(`[VehicleUIParseUI] Widget player mismatch: widgetP=${widgetPlayerId} eventP=${playerId}`);
                return false;
            }

            const isVehicleButton = widgetName.includes("ParseUIBtn_");
            const isClickEvent = isVehicleButton;

            if (!isVehicleButton || !isClickEvent) {
                return false;
            }

            logDebug(`[VehicleUIParseUI] Processing button click=${eventInfo.name}`);

            // Only accept input while our UI is visible
            if (!playerUIVisibleParseUI.has(playerId)) {
                logDebug(`[VehicleUIParseUI] UI not marked visible for player ${playerId} - continuing anyway`);
            }

            // Debounce
            const currentTime = now(true);
            const timeSinceLastClick = currentTime - lastButtonClickTimeParseUI;
            if (timeSinceLastClick < BUTTON_DEBOUNCE_SECONDS) {
                logDebug(`[VehicleUIParseUI] DEBOUNCED`);
                return false;
            }
            lastButtonClickTimeParseUI = currentTime;

            const buttonInfo = vehicleButtonsParseUI.get(widgetName);
            if (!buttonInfo) {
                logDebug(`[VehicleUIParseUI] Button ${widgetName} not found in registry`);
                return false;
            }

            const teamId = getPlayerTeamId(player);
            
            logDebug(`[VehicleUIParseUI] Player ${playerId} clicked ${buttonInfo.label}`);
            
            if (buttonInfo.teamId !== teamId) {
                logDebug(`[VehicleUIParseUI] Team mismatch`);
                return false;
            }

            // JET COOLDOWN CHECK: Jets have a 40-second per-player cooldown
            if (isJetVehicle(buttonInfo.vehicleType)) {
                const cooldownRemaining = getJetCooldownRemaining(playerId);
                if (cooldownRemaining > 0) {
                    logDebug(`[VehicleUIParseUI] Jet cooldown active for player ${playerId}: ${cooldownRemaining.toFixed(1)}s remaining`);
                    // Show notification to player about cooldown
                    try {
                        mod.DisplayCustomNotificationMessage(
                            `Jet cooldown: ${Math.ceil(cooldownRemaining)}s`,
                            mod.CustomNotificationSlots.MessageText1,
                            3.0,
                            player
                        );
                    } catch (_e) {}
                    return false;
                }
            }

            // Only allow button presses on deploy screen
            if (!isPlayerOnDeployScreenParseUI(player)) {
                logDebug(`[VehicleUIParseUI] Ignoring button press - player not on deploy screen`);
                return false;
            }

            // Suppress UI re-show during spawn/deploy/seat flow
            suppressUIUntilByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + 10.0);
            
            // Hide UI
            onPlayerDeployedHideVehicleUIParseUI(player);

            // SPAWN -> DEPLOY -> SEAT flow (same as original module)
            const spawner = getVehicleSpawnerById(buttonInfo.spawnerId);
            if (!spawner) {
                logDebug(`[VehicleUIParseUI] Spawner ${buttonInfo.spawnerId} not found`);
                return false;
            }

            const matchTypes = buttonInfo.matchTypes ?? [buttonInfo.vehicleType];
            pendingSpawnRequestsByPlayerId.set(playerId, {
                playerId,
                teamId,
                spawnerId: buttonInfo.spawnerId,
                vehicleType: buttonInfo.vehicleType,
                matchTypes,
                label: buttonInfo.label,
                time: mod.GetMatchTimeElapsed(),
            });

            const preSpawnVehicleIds = getAllVehicleIdsParseUI();

            try {
                try {
                    mod.SetVehicleSpawnerVehicleType(spawner, buttonInfo.vehicleType);
                } catch (_e) {
                    // ignore if spawner rejects type change
                }
                mod.ForceVehicleSpawnerSpawn(spawner);
                logDebug(`[VehicleUIParseUI] Vehicle spawn initiated`);

                // SET SPAWNER COOLDOWN: Mark spawner as on cooldown for UI indicators
                setSpawnerCooldown(buttonInfo.spawnerId, SPAWNER_COOLDOWN_SECONDS);

                // SET JET COOLDOWN: If this is a jet, set the per-player cooldown
                if (isJetVehicle(buttonInfo.vehicleType)) {
                    setJetCooldown(playerId);
                }
            } catch (e) {
                logDebug(`[VehicleUIParseUI] Vehicle spawn failed: ${e}`);
                return false;
            }

            try {
                mod.EnablePlayerDeploy(player, true);
                mod.SetRedeployTime(player, 0);
                mod.DeployPlayer(player);
                logDebug(`[VehicleUIParseUI] Player deployed`);
            } catch (e) {
                logDebug(`[VehicleUIParseUI] Deploy failed: ${e}`);
                return false;
            }

            // Seat player after delay
            const vehicleLabel = buttonInfo.label;
            const playerTeamIdForLookup = getPlayerTeamId(player);
            mod.Wait(0.5).then(() => {
                logDebug(`[VehicleUIParseUI] Seating player in ${vehicleLabel}`);
                const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
                if (assignedVehicleId !== undefined) {
                    const assignedVehicle = findVehicleByIdParseUI(assignedVehicleId);
                    if (assignedVehicle) {
                        logDebug(`[VehicleUIParseUI] Using assigned spawned ${vehicleLabel} vehicle ${assignedVehicleId}`);
                        assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                        attemptSeatPlayerInSpecificVehicleParseUI(player, assignedVehicle, assignedVehicleId, vehicleLabel, 0);
                        return;
                    }
                    assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                }
                const spawnedVehicle = findNewVehicleOfTypeParseUI(matchTypes, preSpawnVehicleIds, playerTeamIdForLookup);
                if (spawnedVehicle) {
                    const spawnedId = mod.GetObjId(spawnedVehicle);
                    logDebug(`[VehicleUIParseUI] Found newly spawned ${vehicleLabel} vehicle ${spawnedId}`);
                    attemptSeatPlayerInSpecificVehicleParseUI(player, spawnedVehicle, spawnedId, vehicleLabel, 0);
                    return;
                }
                seatPlayerInVehicleParseUI(player, matchTypes, vehicleLabel, 0, preSpawnVehicleIds);
            });

            return true;

        } catch (e) {
            logDebug("[VehicleUIParseUI] handleVehicleButtonPress error: " + e);
            return false;
        }
    }

    /**
     * SWAP AI OUT OF PILOT SEAT - Instead of ejecting (which kills AI), move them to another seat.
     * This prevents ticket loss when players take vehicles from AI.
     * 
     * Strategy:
     * 1. Find an empty seat (preferring gunner seats, then passenger seats)
     * 2. Move the AI pilot to that seat using ForcePlayerToSeat
     * 3. If no empty seat available, eject as last resort
     * 
     * @param vehicle The vehicle to swap AI out of
     * @param occupants List of AI occupants to relocate
     * @returns true if all AI were successfully moved/ejected
     */
    function swapAIOutOfPilotSeat(vehicle: mod.Vehicle, occupants: mod.Player[]): boolean {
        const vehicleId = mod.GetObjId(vehicle);
        logDebug(`[VehicleUIParseUI] swapAIOutOfPilotSeat: vehicleId=${vehicleId}, occupants=${occupants.length}`);

        // Get vehicle seat count
        let seatCount = 1;
        try {
            seatCount = mod.GetVehicleSeatCount(vehicle);
        } catch (_e) {
            seatCount = 1;
        }
        logDebug(`[VehicleUIParseUI] Vehicle has ${seatCount} seats`);

        // If only 1 seat (jets, single-seaters), we have no choice but to eject
        if (seatCount <= 1) {
            logDebug(`[VehicleUIParseUI] Single-seat vehicle - must eject AI`);
            for (const occ of occupants) {
                try {
                    mod.ForcePlayerExitVehicle(occ);
                } catch (_e) {}
            }
            return true;
        }

        // Build list of empty seats (skip seat 0 which we want for the player)
        const emptySeats: number[] = [];
        for (let seatIdx = 1; seatIdx < seatCount; seatIdx++) {
            try {
                if (!mod.IsVehicleSeatOccupied(vehicle, seatIdx)) {
                    emptySeats.push(seatIdx);
                }
            } catch (_e) {
                // If we can't check, assume occupied
            }
        }
        logDebug(`[VehicleUIParseUI] Empty seats available: [${emptySeats.join(", ")}]`);

        // Find which occupants are in seat 0 (pilot seat) - those need to be moved
        const pilotOccupants: mod.Player[] = [];
        for (const occ of occupants) {
            try {
                const seatNum = mod.GetPlayerVehicleSeat(occ);
                if (seatNum === 0) {
                    pilotOccupants.push(occ);
                }
            } catch (_e) {
                // Can't determine seat - assume pilot
                pilotOccupants.push(occ);
            }
        }
        logDebug(`[VehicleUIParseUI] Pilots to relocate: ${pilotOccupants.length}`);

        // Move pilots to empty seats
        for (const pilot of pilotOccupants) {
            const pilotId = mod.GetObjId(pilot);
            if (emptySeats.length > 0) {
                // SWAP: Move pilot to empty seat instead of ejecting
                const targetSeat = emptySeats.shift()!; // Take first empty seat
                try {
                    mod.ForcePlayerToSeat(pilot, vehicle, targetSeat);
                    logDebug(`[VehicleUIParseUI] SWAPPED AI ${pilotId} from seat 0 to seat ${targetSeat}`);
                } catch (e) {
                    logDebug(`[VehicleUIParseUI] Failed to swap AI ${pilotId} to seat ${targetSeat}: ${e}`);
                    // Fallback: try to eject
                    try {
                        mod.ForcePlayerExitVehicle(pilot);
                        logDebug(`[VehicleUIParseUI] Fallback: ejected AI ${pilotId}`);
                    } catch (_e2) {}
                }
            } else {
                // No empty seats available - must eject (last resort)
                logDebug(`[VehicleUIParseUI] No empty seats - ejecting AI ${pilotId}`);
                try {
                    mod.ForcePlayerExitVehicle(pilot);
                } catch (_e) {}
            }
        }

        return true;
    }

    function seatPlayerInVehicleParseUI(
        player: mod.Player,
        vehicleTypes: mod.VehicleList[],
        label: string,
        retryCount: number = 0,
        preSpawnVehicleIds?: Set<number>
    ): void {
        const playerId = mod.GetObjId(player);
        const playerTeamId = getPlayerTeamId(player);
        logDebug(`[VehicleUIParseUI] seatPlayerInVehicleParseUI: player=${playerId} team=${playerTeamId} retry=${retryCount} types=${vehicleTypes.length}`);
        
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) {
                // Retry if no vehicles found at all (unlikely but possible)
                if (retryCount < 10) {
                    mod.Wait(0.5).then(() => seatPlayerInVehicleParseUI(player, vehicleTypes, label, retryCount + 1));
                }
                return;
            }

            const count = mod.CountOf(allVehicles);
            
            // Check if player alive
            let playerAlive = false;
            try {
                if (hasSoldier(player)) {
                    playerAlive = isAlive(player);
                }
            } catch (e) {}
            
            if (!playerAlive) {
                attemptSeatPlayerWhenAliveParseUI(player, vehicleTypes, label, 0);
                return;
            }

            // Prefer the newly spawned vehicle (not present before the button click)
            const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
            if (assignedVehicleId !== undefined) {
                const assignedVehicle = findVehicleByIdParseUI(assignedVehicleId);
                if (assignedVehicle) {
                    logDebug(`[VehicleUIParseUI] Using assigned spawned ${label} vehicle ${assignedVehicleId}`);
                    assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                    attemptSeatPlayerInSpecificVehicleParseUI(player, assignedVehicle, assignedVehicleId, label, 0);
                    return;
                }
                assignedSpawnedVehicleIdByPlayerId.delete(playerId);
            }

            if (preSpawnVehicleIds) {
                const spawnedVehicle = findNewVehicleOfTypeParseUI(vehicleTypes, preSpawnVehicleIds, playerTeamId);
                if (spawnedVehicle) {
                    const spawnedId = mod.GetObjId(spawnedVehicle);
                    let occupied = true;
                    try {
                        occupied = mod.IsVehicleOccupied(spawnedVehicle);
                    } catch (_e) {
                        occupied = true;
                    }

                    if (!occupied) {
                        seatPlayerDirectlyParseUI(player, spawnedVehicle, label);
                        return;
                    }

                    // If occupied, only take over if there are no human occupants.
                    // For the freshly spawned vehicle, allow AI eviction even if team is mixed.
                    const occupants: mod.Player[] = [];
                    let hasHumanOccupant = false;

                    try {
                        const allPlayers2 = mod.AllPlayers();
                        const pCount = mod.CountOf(allPlayers2);
                        for (let pIdx = 0; pIdx < pCount; pIdx++) {
                            const p = mod.ValueInArray(allPlayers2, pIdx) as mod.Player;
                            if (!p) continue;
                            const inVehicle = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsInVehicle);
                            if (!inVehicle) continue;

                            try {
                                const pv = safeGetVehicleFromPlayer(p);
                                if (!pv) continue;
                                if (mod.GetObjId(pv) !== spawnedId) continue;

                                occupants.push(p);

                                const isAI = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsAISoldier);
                                if (!isAI) {
                                    hasHumanOccupant = true;
                                }

                            } catch (_e) {
                                // ignore
                            }
                        }
                    } catch (_e) {
                        // ignore
                    }

                    if (!hasHumanOccupant && occupants.length > 0) {
                        logDebug(`[VehicleUIParseUI] Found newly spawned ${label} occupied by AI (${occupants.length}) - SWAPPING instead of ejecting`);
                        try {
                            // USE SWAP: Move AI to another seat instead of ejecting (prevents ticket loss)
                            swapAIOutOfPilotSeat(spawnedVehicle, occupants);
                            mod.Wait(0.35).then(() => {
                                attemptSeatPlayerInSpecificVehicleParseUI(player, spawnedVehicle, spawnedId, label, 0);
                            });
                            return;
                        } catch (e) {
                            logDebug(`[VehicleUIParseUI] Failed to swap AI occupants: ${e}`);
                        }
                    } else if (hasHumanOccupant) {
                        logDebug(`[VehicleUIParseUI] Newly spawned ${label} has human occupant - waiting for free seat`);
                    }
                }
            }

            // Find empty vehicle; prefer newly spawned, but allow existing empties after a few retries.
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                const vehicleObjId = mod.GetObjId(vehicle);

                // Check vehicle team - allow own team OR neutral vehicles (ground vehicles often spawn neutral)
                let vehicleTeamId = 0;
                try {
                    const vTeam = mod.GetVehicleTeam(vehicle);
                    if (vTeam) vehicleTeamId = mod.GetObjId(vTeam);
                } catch (_e) {}
                
                // Skip enemy vehicles, but allow neutral (0) and own-team
                if (vehicleTeamId !== 0 && vehicleTeamId !== playerTeamId) {
                    continue; // Skip enemy vehicles only
                }

                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (e) {
                    continue;
                }

                if (!isRightType) continue;

                let occupied = true;
                try {
                    occupied = mod.IsVehicleOccupied(vehicle);
                } catch (_e) {
                    occupied = true;
                }

                if (!occupied) {
                    if (!preSpawnVehicleIds || !preSpawnVehicleIds.has(vehicleObjId) || retryCount >= 3) {
                        if (preSpawnVehicleIds && preSpawnVehicleIds.has(vehicleObjId) && retryCount >= 3) {
                            logDebug(`[VehicleUIParseUI] Using existing empty ${label} vehicle ${vehicleObjId} (team=${vehicleTeamId}) after retries`);
                        }
                        seatPlayerDirectlyParseUI(player, vehicle, label);
                        return;
                    }
                    continue;
                }
            }

            // Second pass: look for AI-driven vehicles we can take over
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;

                const vehicleObjId = mod.GetObjId(vehicle);

                // Check vehicle team - allow own team OR neutral vehicles (ground vehicles often spawn neutral)
                let vehicleTeamId2 = 0;
                try {
                    const vTeam2 = mod.GetVehicleTeam(vehicle);
                    if (vTeam2) vehicleTeamId2 = mod.GetObjId(vTeam2);
                } catch (_e) {}
                
                // Skip enemy vehicles, but allow neutral (0) and own-team
                if (vehicleTeamId2 !== 0 && vehicleTeamId2 !== playerTeamId) {
                    continue; // Skip enemy vehicles only
                }

                // Check if it's the right type
                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (e) {
                    continue;
                }

                if (!isRightType) continue;

                // Skip if not occupied.
                let occupied = true;
                try {
                    occupied = mod.IsVehicleOccupied(vehicle);
                } catch (_e) {
                    occupied = true;
                }
                if (!occupied) continue;

                // Collect occupants by scanning all players that report they are in this vehicle.
                const occupants: mod.Player[] = [];
                let hasHumanOccupant = false;
                let hasEnemyOccupant = false;

                try {
                    const allPlayers2 = mod.AllPlayers();
                    const pCount = mod.CountOf(allPlayers2);
                    for (let pIdx = 0; pIdx < pCount; pIdx++) {
                        const p = mod.ValueInArray(allPlayers2, pIdx) as mod.Player;
                        if (!p) continue;
                        const inVehicle = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsInVehicle);
                        if (!inVehicle) continue;

                        try {
                            const pv = safeGetVehicleFromPlayer(p);
                            if (!pv) continue;
                            if (mod.GetObjId(pv) !== vehicleObjId) continue;

                            occupants.push(p);

                            const isAI = safeGetSoldierStateBool(p, mod.SoldierStateBool.IsAISoldier);
                            if (!isAI) {
                                hasHumanOccupant = true;
                            }

                            const occTeamId = getPlayerTeamId(p);
                            if (occTeamId !== 0 && occTeamId !== playerTeamId) {
                                hasEnemyOccupant = true;
                            }
                        } catch (_e) {
                            // ignore
                        }
                    }
                } catch (_e) {
                    // ignore
                }

                // Never kick humans or enemy occupants.
                if (hasHumanOccupant || hasEnemyOccupant) continue;

                // If occupied but we can't find occupants, don't risk it.
                if (occupants.length === 0) continue;

                logDebug(
                    `[VehicleUIParseUI] Found ${label} occupied by friendly AI (${occupants.length}) - SWAPPING and taking vehicle ${vehicleObjId}`
                );

                try {
                    // USE SWAP: Move AI to another seat instead of ejecting (prevents ticket loss)
                    swapAIOutOfPilotSeat(vehicle, occupants);
                    // Wait for AI to be moved, then retry seating with alive checks
                    mod.Wait(0.35).then(() => {
                        attemptSeatPlayerInSpecificVehicleParseUI(player, vehicle, vehicleObjId, label, 0);
                    });
                    return;
                } catch (e) {
                    logDebug(`[VehicleUIParseUI] Failed to swap AI occupants: ${e}`);
                    continue;
                }
            }

            // If we get here, no suitable vehicle was found.
            // It might not have spawned yet. Retry.
            if (retryCount < 10) {
                // On first retry, log what vehicles exist for debugging
                if (retryCount === 0) {
                    let foundTypes: string[] = [];
                    for (let i = 0; i < Math.min(count, 15); i++) {
                        try {
                            const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                            if (v) {
                                const vId = mod.GetObjId(v);
                                const vType = debugVehicleType(v);
                                let occ = "?";
                                try { occ = mod.IsVehicleOccupied(v) ? "occ" : "empty"; } catch(_e) {}
                                foundTypes.push(`${vId}:${vType}:${occ}`);
                            }
                        } catch (_e) {}
                    }
                    logDebug(`[VehicleUIParseUI] Vehicles in world: ${foundTypes.join(", ")}`);
                }
                logDebug(`[VehicleUIParseUI] Vehicle ${label} not found yet, retrying... (${retryCount + 1}/10)`);
                mod.Wait(0.5).then(() => seatPlayerInVehicleParseUI(player, vehicleTypes, label, retryCount + 1, preSpawnVehicleIds));
                return;
            }

            logDebug(`[VehicleUIParseUI] Gave up seating player after retries`);

        } catch (e) {
            logDebug(`[VehicleUIParseUI] seatPlayerInVehicle error: ${e}`);
        }
    }

    function seatPlayerDirectlyParseUI(player: mod.Player, vehicle: mod.Vehicle, label: string): void {
        const playerId = mod.GetObjId(player);
        logDebug(`[VehicleUIParseUI] seatPlayerDirectly: player=${playerId}`);
        
        try {
            mod.ForcePlayerToSeat(player, vehicle, 0);
            logDebug(`[VehicleUIParseUI] SUCCESS - player seated in ${label}`);
            
            // Reduce tank health to make them less dominant (0.7 = 30% reduction)
            try {
                const isTank = mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams) ||
                               mod.CompareVehicleName(vehicle, mod.VehicleList.Leopard);
                if (isTank) {
                    mod.SetVehicleMaxHealthMultiplier(vehicle, 0.7);
                    logDebug(`[VehicleUIParseUI] Tank health set to 0.7x for ${label}`);
                }
            } catch (_e) {}
        } catch (e) {
            logDebug(`[VehicleUIParseUI] ForcePlayerToSeat error: ${e}`);
        }
    }

    function attemptSeatPlayerInSpecificVehicleParseUI(player: mod.Player, vehicle: mod.Vehicle, vehicleObjId: number, label: string, retryCount: number): void {
        const playerId = mod.GetObjId(player);
        const MAX_RETRIES = 10;

        // Check if player is alive
        let playerAlive = false;
        try {
            if (hasSoldier(player)) {
                playerAlive = isAlive(player);
            }
        } catch (e) {}

        logDebug(`[VehicleUIParseUI] attemptSeatPlayerInSpecificVehicle: player=${playerId}, vehicle=${vehicleObjId}, retry=${retryCount}/${MAX_RETRIES}, isAlive=${playerAlive}`);

        if (!playerAlive) {
            if (retryCount < MAX_RETRIES) {
                logDebug(`[VehicleUIParseUI] Player not alive yet - waiting (${retryCount + 1}/${MAX_RETRIES})...`);
                mod.Wait(0.5).then(() => {
                    attemptSeatPlayerInSpecificVehicleParseUI(player, vehicle, vehicleObjId, label, retryCount + 1);
                });
                return;
            } else {
                logDebug(`[VehicleUIParseUI] GAVE UP: Player ${playerId} still not alive after ${MAX_RETRIES} retries`);
                return;
            }
        }

        // Player is alive! Now seat them in the vehicle
        logDebug(`[VehicleUIParseUI] Player ${playerId} is alive - seating in vehicle ${vehicleObjId}`);
        seatPlayerDirectlyParseUI(player, vehicle, label);
    }

    function attemptSeatPlayerWhenAliveParseUI(player: mod.Player, vehicleTypes: mod.VehicleList[], label: string, retryCount: number): void {
        const playerId = mod.GetObjId(player);
        const MAX_RETRIES = 10;
        
        let playerAlive = false;
        try {
            if (hasSoldier(player)) {
                playerAlive = isAlive(player);
            }
        } catch (e) {}
        
        if (!playerAlive) {
            if (retryCount < MAX_RETRIES) {
                mod.Wait(0.5).then(() => {
                    attemptSeatPlayerWhenAliveParseUI(player, vehicleTypes, label, retryCount + 1);
                });
                return;
            } else {
                logDebug(`[VehicleUIParseUI] Gave up seating player after retries`);
                onPlayerDiedShowUIParseUI(player);
                return;
            }
        }
        
        seatPlayerInVehicleParseUI(player, vehicleTypes, label);
    }

    function getVehicleSpawnerById(spawnerId: number): mod.VehicleSpawner | null {
        try {
            return mod.GetVehicleSpawner(spawnerId);
        } catch (e) {
            return null;
        }
    }

    function getAllVehicleIdsParseUI(): Set<number> {
        const ids = new Set<number>();
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return ids;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    ids.add(mod.GetObjId(vehicle));
                } catch (_e) {
                    // ignore
                }
            }
        } catch (_e) {
            // ignore
        }
        return ids;
    }

    function findVehicleByIdParseUI(vehicleId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    if (mod.GetObjId(vehicle) === vehicleId) {
                        return vehicle;
                    }
                } catch (_e) {
                    // ignore
                }
            }
        } catch (_e) {
            // ignore
        }
        return null;
    }

    function matchesAnyVehicleTypeParseUI(vehicle: mod.Vehicle, vehicleTypes: mod.VehicleList[]): boolean {
        for (const vehicleType of vehicleTypes) {
            try {
                const matches = mod.CompareVehicleName(vehicle, vehicleType);
                if (matches) return true;
            } catch (_e) {
                // ignore
            }
        }
        return false;
    }

    // Debug function to check what type a vehicle is and its team
    function debugVehicleType(vehicle: mod.Vehicle): string {
        const typeNames: [mod.VehicleList, string][] = [
            [mod.VehicleList.Marauder, "Marauder"],
            [mod.VehicleList.Marauder_Pax, "Marauder_Pax"],
            [mod.VehicleList.Flyer60, "Flyer60"],
            [mod.VehicleList.Vector, "Vector"],
            [mod.VehicleList.AH64, "AH64"],
            [mod.VehicleList.Eurocopter, "Eurocopter"],
            [mod.VehicleList.UH60, "UH60"],
            [mod.VehicleList.UH60_Pax, "UH60_Pax"],
            [mod.VehicleList.F22, "F22"],
            [mod.VehicleList.F16, "F16"],
            [mod.VehicleList.JAS39, "JAS39"],
            [mod.VehicleList.SU57, "SU57"],
        ];
        
        // Get vehicle team
        let teamId = 0;
        try {
            const vTeam = mod.GetVehicleTeam(vehicle);
            if (vTeam) teamId = mod.GetObjId(vTeam);
        } catch (_e) {}
        
        for (const [vt, name] of typeNames) {
            try {
                if (mod.CompareVehicleName(vehicle, vt)) {
                    return `${name}(T${teamId})`;
                }
            } catch (_e) {}
        }
        return `unknown(T${teamId})`;
    }

    function findNewVehicleOfTypeParseUI(
        vehicleTypes: mod.VehicleList[],
        preSpawnVehicleIds: Set<number>,
        forTeamId?: number
    ): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                
                // Team filter: ONLY accept vehicles belonging to our team (not neutral, not enemy)
                if (forTeamId !== undefined && forTeamId !== 0) {
                    let vehicleTeamId = 0;
                    try {
                        const vTeam = mod.GetVehicleTeam(vehicle);
                        if (vTeam) vehicleTeamId = mod.GetObjId(vTeam);
                    } catch (_e) {}
                    // Require exact team match - skip neutral (0) and enemy vehicles
                    if (vehicleTeamId !== forTeamId) {
                        continue; // Skip non-team vehicles
                    }
                }
                
                let isRightType = false;
                try {
                    isRightType = matchesAnyVehicleTypeParseUI(vehicle, vehicleTypes);
                } catch (_e) {
                    continue;
                }
                if (!isRightType) continue;
                const vehicleId = mod.GetObjId(vehicle);
                if (!preSpawnVehicleIds.has(vehicleId)) {
                    return vehicle;
                }
            }
        } catch (_e) {
            // ignore
        }
        return null;
    }

    export function vehicleUI_OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
        if (!eventVehicle) return;

        if (pendingSpawnRequestsByPlayerId.size > 0) {
            try {
                const vehicleId = mod.GetObjId(eventVehicle);
                logDebug(`[VehicleUIParseUI] OnVehicleSpawned event for vehicle ${vehicleId} (pending=${pendingSpawnRequestsByPlayerId.size})`);
            } catch (_e) {
                // ignore
            }
        }

        // Clean out expired requests
        const now = mod.GetMatchTimeElapsed();
        for (const [pid, req] of pendingSpawnRequestsByPlayerId.entries()) {
            if (now - req.time > MAX_SPAWN_ASSIGN_SECONDS) {
                pendingSpawnRequestsByPlayerId.delete(pid);
            }
        }

        // Try to match spawned vehicle to a pending request
        let vehicleTeamId = 0;
        try {
            const vTeam = mod.GetVehicleTeam(eventVehicle);
            vehicleTeamId = vTeam ? mod.GetObjId(vTeam) : 0;
        } catch (_e) {
            vehicleTeamId = 0;
        }

        for (const [pid, req] of pendingSpawnRequestsByPlayerId.entries()) {
            if (req.time + MAX_SPAWN_ASSIGN_SECONDS < now) continue;
            if (vehicleTeamId !== 0 && req.teamId !== 0 && vehicleTeamId !== req.teamId) continue;

            let isRightType = false;
            try {
                isRightType = matchesAnyVehicleTypeParseUI(eventVehicle, req.matchTypes ?? [req.vehicleType]);
            } catch (_e) {
                isRightType = false;
            }

            if (!isRightType) continue;

            try {
                const vehicleId = mod.GetObjId(eventVehicle);
                assignedSpawnedVehicleIdByPlayerId.set(pid, vehicleId);
                pendingSpawnRequestsByPlayerId.delete(pid);
                logDebug(`[VehicleUIParseUI] Matched spawned ${req.label} vehicle ${vehicleId} to player ${pid}`);
                return;
            } catch (_e) {
                // ignore
            }
        }
    }

    export function onPlayerDeployedHideVehicleUIParseUI(player: mod.Player): void {
        if (!player) return;
        if (isAISoldier(player)) return;
        if (!vehicleUIParseCreated) return;

        const playerId = mod.GetObjId(player);
        if (!playerWidgetNamesParseUI.has(playerId)) return;

        setPlayerUIVisibleParseUI(player, false);
        // Note: We never grabbed mouse, so nothing to release
        logDebug(`[VehicleUIParseUI] Hiding UI for player ${playerId}`);
    }

    function isPlayerOnDeployScreenParseUI(player: mod.Player): boolean {
        try {
            const playerId = mod.GetObjId(player);
            const now = mod.GetMatchTimeElapsed();

            const lastDeathTime = lastDeathTimeByPlayerId.get(playerId);
            if (lastDeathTime !== undefined && now - lastDeathTime < DEATHCAM_BLOCK_SECONDS) {
                return false; // Still in death cam
            }

            const hasEverDeployed = hasEverDeployedByPlayerId.has(playerId);
            const lastUndeployTime = lastUndeployTimeByPlayerId.get(playerId);

            // Primary check: if player has a tracked soldier, they're NOT on deploy screen
            const soldierExists = hasSoldier(player);
            if (soldierExists) {
                return false;
            }

            // If player has deployed before, require an actual undeploy event before showing UI
            if (hasEverDeployed && lastUndeployTime === undefined) {
                return false;
            }

            // Fallback: if tracking missed the deploy event, use safe SoldierState checks.
            // If any state says the player is alive/in-vehicle, they are NOT on deploy screen.
            const isAlive = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
            const isInVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
            const isManDown = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsManDown);

            if (isAlive || isInVehicle || isManDown) {
                return false;
            }

            // No soldier and no active state => deploy screen
            return true;
        } catch (_e) {
            // On error, assume not on deploy screen (safer default)
            return false;
        }
    }

    export function vehicleUI_OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        hasEverDeployedByPlayerId.add(playerId);
        lastUndeployTimeByPlayerId.delete(playerId);
        lastDeathTimeByPlayerId.delete(playerId);

        // NOTE: The button handler already handles seating via its own Wait callback.
        // We just delete the pending request here to avoid double-seating attempts.
        // The button handler's callback has preSpawnVehicleIds for accurate matching.
        const pendingRequest = pendingSpawnRequestsByPlayerId.get(playerId);
        if (pendingRequest) {
            // Don't delete here - let the button handler's callback handle it
            // pendingSpawnRequestsByPlayerId.delete(playerId);
            logDebug(`[VehicleUIParseUI] Player ${playerId} deployed with pending request for ${pendingRequest.label} - button handler will seat`);
        }
    }

    export function vehicleUI_OnPlayerUndeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastUndeployTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
    }

    let lastTickCheckParseUI = 0;
    const TICK_CHECK_INTERVAL = 0.25; // Check 4 times per second for responsiveness

    // Cache of known human players (by ObjId) to avoid repeated AI checks
    const knownHumanPlayers: Set<number> = new Set();
    const knownAIPlayers: Set<number> = new Set();  // Also cache AI to avoid re-checking

    // Prevent UI from appearing during death cam
    const lastDeathTimeByPlayerId: Map<number, number> = new Map();
    const DEATHCAM_BLOCK_SECONDS = 3.0;

    // Track deploy/undeploy transitions to only show UI on actual deploy screen
    const hasEverDeployedByPlayerId: Set<number> = new Set();
    const lastUndeployTimeByPlayerId: Map<number, number> = new Map();

    /**
     * Check if player is human. Uses cache to avoid repeated expensive SDK calls.
     * Once a player is confirmed human or AI, they stay that way for the match.
     */
    function isPlayerHumanCached(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        
        // Check caches first
        if (knownHumanPlayers.has(playerId)) return true;
        if (knownAIPlayers.has(playerId)) return false;

        // Check if AI using SDK
        try {
            const isAI = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAISoldier);
            if (isAI) {
                knownAIPlayers.add(playerId);  // Cache as AI
                return false;
            }
            // Not AI = human
            knownHumanPlayers.add(playerId);
            return true;
        } catch (_e) {
            // If we can't determine, assume AI to be safe (don't show UI)
            knownAIPlayers.add(playerId);  // Cache as AI on error
            return false;
        }
    }

    // ========== VEHICLE AVAILABILITY UI UPDATE ==========
    // Update fill overlays and button states based on spawner/vehicle status
    
    function updateVehicleStatusFromWorld(): void {
        // Scan all vehicles to determine which spawners have active vehicles
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;

            const count = mod.CountOf(allVehicles);
            const activeVehiclesByType: Set<number> = new Set();

            for (let i = 0; i < count; i++) {
                try {
                    const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                    if (!vehicle) continue;
                    const vId = mod.GetObjId(vehicle);
                    activeVehiclesByType.add(vId);
                } catch (_e) {
                    continue;
                }
            }

            // Update spawner status based on vehicle presence
            // Note: We can't directly query spawner cooldowns, so we estimate based on vehicle presence
            for (const [spawnerId, status] of spawnerStatusMap) {
                if (status.status === 'cooldown') {
                    // Check if cooldown is complete
                    const progress = getSpawnerCooldownProgress(spawnerId);
                    if (progress >= 1.0) {
                        status.status = 'available';
                        logDebug(`[VehicleUIParseUI] Spawner ${spawnerId} cooldown complete - now available`);
                    }
                }
            }
        } catch (_e) {
            // Ignore errors during status scan
        }
    }

    function updateButtonStatusForPlayer(playerId: number, teamId: number): void {
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();

        for (const vehicle of vehicles) {
            const buttonName = `ParseUIBtn_${teamId}_${vehicle.spawnerId}_P${playerId}`;

            try {
                const buttonWidget = mod.FindUIWidgetWithName(buttonName);
                if (!buttonWidget) continue;

                const status = spawnerStatusMap.get(vehicle.spawnerId);
                let buttonEnabled = true;
                let bgAlpha = 0.9; // Full opacity when available
                let bgColor: [number, number, number] = [0.0, 0.5, 0.6]; // Cyan = available

                // Check for jet personal cooldown first
                if (isJetVehicle(vehicle.type)) {
                    const jetCooldownRemaining = getJetCooldownRemaining(playerId);
                    if (jetCooldownRemaining > 0) {
                        // Personal jet cooldown active - dim the button
                        const progress = 1.0 - (jetCooldownRemaining / JET_COOLDOWN_SECONDS);
                        bgAlpha = 0.3 + (progress * 0.6); // Start dim, brighten as cooldown completes
                        buttonEnabled = false;
                        bgColor = [0.6, 0.4, 0.0]; // Orange tint for jet cooldown
                    }
                }

                // Check spawner status (takes priority)
                if (status) {
                    if (status.status === 'cooldown') {
                        const progress = getSpawnerCooldownProgress(vehicle.spawnerId);
                        bgAlpha = 0.3 + (progress * 0.6); // Start dim, brighten as ready
                        buttonEnabled = false;
                        bgColor = [0.4, 0.1, 0.1]; // Red tint for spawner cooldown
                    } else if (status.status === 'occupied') {
                        bgAlpha = 0.4;
                        buttonEnabled = false;
                        bgColor = [0.3, 0.3, 0.3]; // Gray = occupied
                    } else if (status.status === 'destroyed') {
                        bgAlpha = 0.2;
                        buttonEnabled = false;
                        bgColor = [0.2, 0.0, 0.0]; // Dark red = destroyed
                    }
                }

                // Update button appearance
                mod.SetUIWidgetBgAlpha(buttonWidget as mod.UIWidget, bgAlpha);
                mod.SetUIWidgetBgColor(buttonWidget as mod.UIWidget, mod.CreateVector(bgColor[0], bgColor[1], bgColor[2]));
                mod.SetUIButtonEnabled(buttonWidget as mod.UIWidget, buttonEnabled);

            } catch (_e) {
                // Ignore individual widget update errors
            }
        }
    }

    function tickVehicleStatusUI(): void {
        const now = mod.GetMatchTimeElapsed();
        if (now - lastUIStatusUpdateTime < UI_STATUS_UPDATE_INTERVAL) return;
        lastUIStatusUpdateTime = now;

        // Update spawner status from world state
        updateVehicleStatusFromWorld();

        // Update button status (opacity/color) for all players with visible UI
        for (const playerId of playerUIVisibleParseUI) {
            try {
                // Determine player's team
                const allPlayers = mod.AllPlayers();
                const count = mod.CountOf(allPlayers);
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                    if (!p) continue;
                    if (mod.GetObjId(p) === playerId) {
                        const teamId = getPlayerTeamId(p);
                        updateButtonStatusForPlayer(playerId, teamId);
                        break;
                    }
                }
            } catch (_e) {
                // Ignore errors
            }
        }
    }
    
    export function tickVehicleUIParseUI(): void {
        const now = mod.GetMatchTimeElapsed();
        if (now - lastTickCheckParseUI < TICK_CHECK_INTERVAL) return;
        lastTickCheckParseUI = now;

        // Update vehicle availability status and fill overlays
        tickVehicleStatusUI();
        
        // NOTE: Vehicle UI should be available on the deploy screen even before round start.
        // Do not gate on round state; rely on deploy-screen detection instead.
        
        // UI system should already be created during init, but ensure it exists
        if (!vehicleUIParseCreated) {
            createVehicleSpawnUIParseUI();
        }
        
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                
                // Use cached human check - only show UI to confirmed humans
                const isHuman = isPlayerHumanCached(player);
                if (!isHuman) continue;

                const playerId = mod.GetObjId(player);
                const onDeployScreen = isPlayerOnDeployScreenParseUI(player);
                const soldierExists = hasSoldier(player);

                const suppressUntil = suppressUIUntilByPlayerId.get(playerId);
                if (suppressUntil !== undefined) {
                    if (now < suppressUntil) {
                        continue;
                    }
                    suppressUIUntilByPlayerId.delete(playerId);
                }

                const pendingRequest = pendingSpawnRequestsByPlayerId.get(playerId);
                if (pendingRequest) {
                    if (now - pendingRequest.time <= MAX_SPAWN_ASSIGN_SECONDS) {
                        continue;
                    }
                    pendingSpawnRequestsByPlayerId.delete(playerId);
                }
                
                const isVisible = playerUIVisibleParseUI.has(playerId);

                if (onDeployScreen && !isVisible) {
                    // Player is on deploy screen and round is active - show UI
                    log(`[VehicleUI] Player ${playerId} on deploy screen - showing UI`);
                    ensurePlayerUIParseUI(player);
                    setPlayerUIVisibleParseUI(player, true);
                    lastDeathTimeByPlayerId.delete(playerId);
                    // Note: We don't grab mouse - deploy screen already has cursor
                } else if (!onDeployScreen && isVisible) {
                    // Player left deploy screen - hide UI
                    logDebug(`[VehicleUI] Player ${playerId} deployed - hiding UI`);
                    onPlayerDeployedHideVehicleUIParseUI(player);
                }
            }
        } catch (e) {
            log(`[VehicleUI] Tick error: ${e}`);
        }
    }

    export function onPlayerDiedShowUIParseUI(player?: mod.Player): void {
        // Do NOT force show UI on death.
        // Player enters ManDown state first (Death Cam), where UI should remain hidden.
        // We rely on tickVehicleUIParseUI to detect when they actually hit the Deploy Screen (Soldier == null).
        if (!vehicleUIParseCreated) return;
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastDeathTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
        onPlayerDeployedHideVehicleUIParseUI(player);
        logDebug(`[VehicleUIParseUI] Player died - waiting for deploy screen...`);
    }

    export function onPlayerDiedHideUIParseUI(player?: mod.Player): void {
        if (!vehicleUIParseCreated) return;
        if (!player) return;
        onPlayerDeployedHideVehicleUIParseUI(player);
    }
}
