/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="./RegistryModule.ts" />

// HudModuleParseUI.ts - ConquestV5 Enhanced HUD
// Classic Battlefield-style HUD with dynamic shapes:
// - Circles for NATO controlled flags
// - Diamonds for PAX Armata controlled flags
// - Squares for neutral flags (pulse when contested/capturing)
// - "Capturing X" text for flags being taken
// - Flag count status display
// - Ticket bars with shrinking width

namespace ConquestV8 {
    // Colors - Custom Team Colors
    const HUD_TEXT_COLOR = mod.CreateVector(1, 1, 1);
    const TEAM1_COLOR = mod.CreateVector(0.443, 0.918, 0.996);  // Cyan #71EAFE (Team 1 NATO)
    const TEAM2_COLOR = mod.CreateVector(1.0, 0.529, 0.396);    // Orange #FF8765 (Team 2 PAX)
    const NEUTRAL_COLOR = mod.CreateVector(0.5, 0.5, 0.5);      // Dark Gray (transparent)
    const CONTESTED_COLOR = mod.CreateVector(0.95, 0.78, 0.2);  // Orange/Yellow (keep for contested)

    // Layout constants
    const TICKET_BAR_WIDTH = 300;
    const TICKET_BAR_HEIGHT = 8;
    const TICKET_BAR_Y = 20;
    const TICKET_TEXT_Y = 40;
    const TICKET_TEXT_SIZE = 32;

    const FLAG_INDICATOR_SIZE = 35;      // Match old HUD: 35x35
    const FLAG_INDICATOR_Y = 45;         // Match old HUD Y position
    const FLAG_SPACING = 50;             // Match old HUD spacing
    const FLAG_LETTER_SIZE = 18;         // Match old HUD text size
    
    const CAPTURE_TEXT_Y = 135;
    const CAPTURE_TEXT_SIZE = 14;
    const PROGRESS_BAR_Y = 90;           // Match old HUD status bar Y
    const PROGRESS_BAR_WIDTH = 40;       // Match old HUD status bar width
    const PROGRESS_BAR_HEIGHT = 4;       // Match old HUD status bar height

    const FLAG_COUNT_Y = 105;            // Move closer to status bars
    const FLAG_COUNT_SIZE = 14;

    const HUD_UPDATE_INTERVAL = 0.0167; // 60Hz (match game frame rate for smooth pulsing)
    const PULSE_SPEED = 12.56; // Radians per second (two full pulses per second)

    // State
    let hudActive = false;
    let pulsePhase = 0;
    let lastUpdateTime = 0;
    let sortedObjectives: ObjectiveState[] = []; // Cache sorted objectives for consistent display

    const flagIndexByObjId = new Map<number, number>();
    const flagLetterByObjId = new Map<number, string>();
    const DEFAULT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    interface FlagState {
        ownerId: number;        // 0=neutral, 1=NATO, 2=PAX
        capturing: boolean;     // Is being captured?
        contested: boolean;     // Multiple teams present?
        capturingTeam: number;  // Which team is capturing (0=none)
        progress: number;       // 0.0 to 1.0
    }

    const flagStates = new Map<number, FlagState>();

    // Widget references
    const widgetCache = new Map<string, mod.UIWidget>();
    
    // Message cache to avoid <unknown string> errors
    const messageCache = new Map<string, mod.Message>();
    
    function getCachedMessage(text: string | number): mod.Message {
        const key = String(text);
        if (!messageCache.has(key)) {
            messageCache.set(key, mod.Message("{}", text));
        }
        return messageCache.get(key)!;
    }

    function findWidget(name: string): mod.UIWidget | null {
        if (widgetCache.has(name)) return widgetCache.get(name)!;
        const w = mod.FindUIWidgetWithName(name);
        if (w) widgetCache.set(name, w);
        return w;
    }

    function safeCall(context: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            // Silent fail for HUD updates
        }
    }

    export function initHudParseUI(): void {
        try {
            hudActive = false;
            pulsePhase = 0;
            lastUpdateTime = now(true);
            widgetCache.clear();
            flagStates.clear();

            // Get objectives from Registry and sort by letter for consistent HUD display
            sortedObjectives = Registry_GetObjectives();
            sortedObjectives.sort((a, b) => a.letter.localeCompare(b.letter));

            // Assign flag display indices using actual letter from objective
            for (let i = 0; i < sortedObjectives.length; i++) {
                const objId = sortedObjectives[i].objId;
                const letter = sortedObjectives[i].letter; // Use actual letter from Registry
                flagIndexByObjId.set(objId, i);
                flagLetterByObjId.set(objId, letter);
                // Pre-cache labels to avoid <unknown string> issues on first use
                getCachedMessage(letter);
                getCachedMessage("CAPTURING");
                flagStates.set(objId, {
                    ownerId: 0,
                    capturing: false,
                    contested: false,
                    capturingTeam: 0,
                    progress: 0
                });
            }

            log(`[ConquestV10][HUDParseUI] Initialized with ${sortedObjectives.length} objectives`);
        } catch (e) {
            log(`[ConquestV10][HUDParseUI] Init error: ${e}`);
        }
    }

    export function startHudParseUI(): void {
        if (hudActive) return;
        hudActive = true;
        createHudWidgets();
        hudUpdateLoop();
        log(`[ConquestV10][HUDParseUI] Started`);
    }

    export function stopHudParseUI(): void {
        hudActive = false;
        log(`[ConquestV10][HUDParseUI] Stopped`);
    }

    function getLocalTeamIds(): { friendly: number; enemy: number } {
        const hostPlayer = tryGetHostPlayer();
        const friendly = hostPlayer ? getPlayerTeamId(hostPlayer) : 1;
        const enemy = friendly === 1 ? 2 : 1;
        return { friendly, enemy };
    }

    function createHudWidgets(): void {
        if (!ENABLE_GAMEPLAY_HUD) return;

        createTicketBars();
        createFlagIndicators();
        createFlagCountDisplay();
    }

    function createTicketBars(): void {
        // Team 1 (NATO - left side, blue)
        const team1X = -400;
        
        // Ticket bar background
        mod.AddUIText(
            "Team1TicketBarBg",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bg = findWidget("Team1TicketBarBg");
        if (t1bg) {
            safeCall("T1BarBg", () => {
                mod.SetUIWidgetBgColor(t1bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t1bg, 0);
                mod.SetUIWidgetBgFill(t1bg, mod.UIBgFill.Solid);
            });
        }

        // Ticket bar foreground (shrinks with tickets)
        mod.AddUIText(
            "Team1TicketBar",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bar = findWidget("Team1TicketBar");
        if (t1bar) {
            safeCall("T1Bar", () => {
                mod.SetUIWidgetBgColor(t1bar, TEAM1_COLOR);
                mod.SetUIWidgetBgAlpha(t1bar, 0.9);
                mod.SetUIWidgetBgFill(t1bar, mod.UIBgFill.Solid);
            });
        }

        // Ticket text
        mod.AddUIText(
            "Team1Tickets",
            mod.CreateVector(team1X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t1txt = findWidget("Team1Tickets");
        if (t1txt) {
            safeCall("T1Txt", () => {
                mod.SetUITextColor(t1txt, TEAM1_COLOR);
                mod.SetUITextSize(t1txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t1txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t1txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t1txt, 0.6);
                mod.SetUIWidgetBgFill(t1txt, mod.UIBgFill.Solid);
            });
        }

        // Team 2 (PAX - right side, red)
        const team2X = 400;

        // Ticket bar background
        mod.AddUIText(
            "Team2TicketBarBg",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bg = findWidget("Team2TicketBarBg");
        if (t2bg) {
            safeCall("T2BarBg", () => {
                mod.SetUIWidgetBgColor(t2bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t2bg, 0);
                mod.SetUIWidgetBgFill(t2bg, mod.UIBgFill.Solid);
            });
        }

        // Ticket bar foreground
        mod.AddUIText(
            "Team2TicketBar",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bar = findWidget("Team2TicketBar");
        if (t2bar) {
            safeCall("T2Bar", () => {
                mod.SetUIWidgetBgColor(t2bar, TEAM2_COLOR);
                mod.SetUIWidgetBgAlpha(t2bar, 0.9);
                mod.SetUIWidgetBgFill(t2bar, mod.UIBgFill.Solid);
            });
        }

        // Ticket text
        mod.AddUIText(
            "Team2Tickets",
            mod.CreateVector(team2X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t2txt = findWidget("Team2Tickets");
        if (t2txt) {
            safeCall("T2Txt", () => {
                mod.SetUITextColor(t2txt, TEAM2_COLOR);
                mod.SetUITextSize(t2txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t2txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t2txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t2txt, 0.6);
                mod.SetUIWidgetBgFill(t2txt, mod.UIBgFill.Solid);
            });
        }
    }

    function createFlagIndicators(): void {
        // Use cached sorted objectives for consistent display
        const count = sortedObjectives.length;
        const totalWidth = (count - 1) * FLAG_SPACING;
        const startX = -totalWidth / 2;

        for (let i = 0; i < count; i++) {
            const objId = sortedObjectives[i].objId;
            const letter = sortedObjectives[i].letter; // Use actual letter from objective
            const xPos = startX + i * FLAG_SPACING;

            // Flag shape container - OUTLINE STYLE
            // Uses OutlineThick for border-only rendering (transparent interior)
            // Shape distinction: square=neutral, outlined shapes for teams
            mod.AddUIText(
                `FlagShape_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const shape = findWidget(`FlagShape_${i}`);
            if (shape) {
                safeCall("FlagShape", () => {
                    mod.SetUIWidgetBgColor(shape, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(shape, 0.9); // Visible outline
                    mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThick); // OUTLINE not solid
                    mod.SetUIWidgetVisible(shape, true);
                });
            }

            // Flag letter text (overlaid on shape)
            mod.AddUIText(
                `FlagLetter_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", letter)
            );
            const letterWidget = findWidget(`FlagLetter_${i}`);
            if (letterWidget) {
                safeCall("FlagLetter", () => {
                    mod.SetUITextColor(letterWidget, NEUTRAL_COLOR); // Letter color changes with team
                    mod.SetUITextSize(letterWidget, FLAG_LETTER_SIZE);
                    mod.SetUITextAnchor(letterWidget, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(letterWidget, 0); // Transparent background
                    mod.SetUIWidgetBgFill(letterWidget, mod.UIBgFill.None);
                    mod.SetUIWidgetVisible(letterWidget, true);
                });
            }

            // "Capturing X" text (hidden by default)
            mod.AddUIText(
                `CapturingText_${i}`,
                mod.CreateVector(xPos, CAPTURE_TEXT_Y, 0),
                mod.CreateVector(100, 20, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const capText = findWidget(`CapturingText_${i}`);
            if (capText) {
                safeCall("CapText", () => {
                    mod.SetUITextColor(capText, HUD_TEXT_COLOR);
                    mod.SetUITextSize(capText, CAPTURE_TEXT_SIZE);
                    mod.SetUITextAnchor(capText, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(capText, 0);
                    mod.SetUIWidgetVisible(capText, false);
                });
            }

            // Progress bar background
            mod.AddUIText(
                `ProgressBarBg_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbg = findWidget(`ProgressBarBg_${i}`);
            if (pbg) {
                safeCall("ProgressBg", () => {
                    mod.SetUIWidgetBgColor(pbg, mod.CreateVector(0.2, 0.2, 0.2));
                    mod.SetUIWidgetBgAlpha(pbg, 0); // Transparent background
                    mod.SetUIWidgetBgFill(pbg, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbg, false);
                });
            }

            // Progress bar foreground
            mod.AddUIText(
                `ProgressBar_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(0, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbar = findWidget(`ProgressBar_${i}`);
            if (pbar) {
                safeCall("Progress", () => {
                    mod.SetUIWidgetBgColor(pbar, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(pbar, 0.9);
                    mod.SetUIWidgetBgFill(pbar, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbar, false);
                });
            }
        }
    }

    function createFlagCountDisplay(): void {
        // "NATO: 3  PAX: 2" style display
        mod.AddUIText(
            "FlagCountText",
            mod.CreateVector(0, FLAG_COUNT_Y, 0),
            mod.CreateVector(300, 25, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const fct = findWidget("FlagCountText");
        if (fct) {
            safeCall("FlagCount", () => {
                mod.SetUITextColor(fct, HUD_TEXT_COLOR);
                mod.SetUITextSize(fct, FLAG_COUNT_SIZE);
                mod.SetUITextAnchor(fct, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(fct, 0);
            });
        }
    }

    async function hudUpdateLoop(): Promise<void> {
        while (hudActive) {
            try {
                // Fixed increment per frame at 60Hz: 12.56 rad/s / 60 = ~0.21 rad per frame
                pulsePhase += 0.21;
                if (pulsePhase > Math.PI * 2) pulsePhase -= Math.PI * 2;

                updateTicketBars();
                updateFlagStates();
                updateFlagIndicators();
                updateFlagCount();
            } catch (e) {
                // Silent fail
            }
            await mod.Wait(HUD_UPDATE_INTERVAL);
        }
    }

    function updateTicketBars(): void {
        const { friendly, enemy } = getLocalTeamIds();
        const t1Tickets = getTickets(friendly);
        const t2Tickets = getTickets(enemy);
        const maxTickets = STARTING_TICKETS || 1;

        const t1Ratio = Math.max(0, Math.min(1, t1Tickets / maxTickets));
        const t2Ratio = Math.max(0, Math.min(1, t2Tickets / maxTickets));

        // Update bar widths
        const t1bar = findWidget("Team1TicketBar");
        if (t1bar) {
            safeCall("T1BarWidth", () => {
                const width = Math.max(10, TICKET_BAR_WIDTH * t1Ratio);
                mod.SetUIWidgetSize(t1bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
        }

        const t2bar = findWidget("Team2TicketBar");
        if (t2bar) {
            safeCall("T2BarWidth", () => {
                const width = Math.max(10, TICKET_BAR_WIDTH * t2Ratio);
                mod.SetUIWidgetSize(t2bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
        }

        // Update text
        const t1txt = findWidget("Team1Tickets");
        if (t1txt) {
            safeCall("T1TxtSet", () => mod.SetUITextLabel(t1txt, mod.Message("{}", Math.floor(t1Tickets))));
        }

        const t2txt = findWidget("Team2Tickets");
        if (t2txt) {
            safeCall("T2TxtSet", () => mod.SetUITextLabel(t2txt, mod.Message("{}", Math.floor(t2Tickets))));
        }
    }

    function updateFlagStates(): void {
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);

            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (!cp) continue;

                const objId = mod.GetObjId(cp);
                const state = flagStates.get(objId);
                if (!state) continue;

                const ownerTeam = mod.GetCurrentOwnerTeam(cp);
                state.ownerId = ownerTeam ? mod.GetObjId(ownerTeam) : 0;

                const presence = getPresenceOnPoint(cp);
                state.contested = presence.team1 > 0 && presence.team2 > 0;

                const rawProgress = mod.GetCaptureProgress(cp);
                state.progress = Math.max(0, Math.min(1, rawProgress));

                // Prefer SDK progress team (works even if vehicles aren't counted in GetPlayersOnPoint)
                let progressTeamId = 0;
                try {
                    const progressTeam = mod.GetOwnerProgressTeam(cp);
                    progressTeamId = progressTeam ? mod.GetObjId(progressTeam) : 0;
                } catch (_e) {
                    progressTeamId = 0;
                }

                // Determine capturing team
                state.capturingTeam = (progressTeamId === 1 || progressTeamId === 2)
                    ? progressTeamId
                    : determineCapturingTeam(state.ownerId, presence, state.contested);
                state.capturing = state.capturingTeam !== 0 && state.progress > 0 && state.progress < 1;
            }
        } catch (e) {
            // Silent fail
        }
    }

    function getPresenceOnPoint(cp: mod.CapturePoint): { team1: number; team2: number } {
        let team1 = 0;
        let team2 = 0;
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) team1++;
                else if (tid === 2) team2++;
            }
        } catch (e) {
            // Silent fail
        }
        return { team1, team2 };
    }

    function determineCapturingTeam(owner: number, presence: { team1: number; team2: number }, contested: boolean): number {
        if (contested) return 0;
        if (owner === 0) {
            if (presence.team1 > 0 && presence.team2 === 0) return 1;
            if (presence.team2 > 0 && presence.team1 === 0) return 2;
            return 0;
        }
        if (owner === 1 && presence.team2 > 0 && presence.team1 === 0) return 2;
        if (owner === 2 && presence.team1 > 0 && presence.team2 === 0) return 1;
        return 0;
    }

    function updateFlagIndicators(): void {
        // Use cached sorted objectives
        for (let i = 0; i < sortedObjectives.length; i++) {
            const objId = sortedObjectives[i].objId;
            const state = flagStates.get(objId);
            if (!state) continue;

            updateFlagShape(i, state);
            updateFlagCapturingText(i, state);
            updateFlagProgressBar(i, state);
        }
    }

    function updateFlagShape(index: number, state: FlagState): void {
        const shape = findWidget(`FlagShape_${index}`);
        if (!shape) return;

        // Use host player's team to determine friendly vs enemy colors
        // In-game flags always show YOUR team as blue, so HUD should match
        const { friendly: myTeamId } = getLocalTeamIds();

        // Visual distinction using color only (all same size)
        let color: mod.Vector;
        let baseSize = FLAG_INDICATOR_SIZE; // All flags same size

        if (state.ownerId === myTeamId && state.ownerId !== 0) {
            // Friendly flag - always BLUE (matches in-game friendly flags)
            color = TEAM1_COLOR;
        } else if (state.ownerId !== 0 && state.ownerId !== myTeamId) {
            // Enemy flag - always RED (matches in-game enemy flags)
            color = TEAM2_COLOR;
        } else {
            // Neutral flag - GRAY
            color = NEUTRAL_COLOR;
        }

        // Apply pulsing if contested or capturing
        let alpha = 0.85; // More opaque for better visibility
        let size = baseSize;

        if (state.contested || state.capturing) {
            // Smooth fade effect: only animate alpha, keep size constant
            const pulse = (Math.sin(pulsePhase) + 1) / 2; // Smoothly oscillates 0 to 1
            alpha = 0.0 + 1.0 * pulse; // Fade from invisible (0.0) to fully visible (1.0)
            // size stays at baseSize - no size animation
            
            // Use contested color if contested
            if (state.contested) {
                color = CONTESTED_COLOR;
            } else if (state.capturing) {
                // Use capturing team color
                color = state.capturingTeam === myTeamId ? TEAM1_COLOR : TEAM2_COLOR;
            }
        }

        safeCall("ShapeUpdate", () => {
            mod.SetUIWidgetBgColor(shape, color);
            mod.SetUIWidgetBgAlpha(shape, alpha);
            mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThin); // THIN outline for cleaner look
            mod.SetUIWidgetSize(shape, mod.CreateVector(size, size, 0));
        });

        // Also update the letter color AND alpha to match the shape (pulses together)
        const letterWidget = findWidget(`FlagLetter_${index}`);
        if (letterWidget) {
            safeCall("LetterUpdate", () => {
                mod.SetUITextColor(letterWidget, color);
                mod.SetUITextAlpha(letterWidget, alpha); // Letter fades with shape
            });
        }
    }

    function updateFlagCapturingText(index: number, state: FlagState): void {
        const capText = findWidget(`CapturingText_${index}`);
        if (!capText) return;

        // Disabled: no text under flags during capture
        safeCall("CapTextUpdate", () => {
            mod.SetUIWidgetVisible(capText, false);
        });
    }

    function updateFlagProgressBar(index: number, state: FlagState): void {
        const pbg = findWidget(`ProgressBarBg_${index}`);
        const pbar = findWidget(`ProgressBar_${index}`);
        if (!pbg || !pbar) return;

        const { friendly: myTeamId } = getLocalTeamIds();

        const shouldShow = state.capturing || state.contested;

        safeCall("ProgressVis", () => {
            mod.SetUIWidgetVisible(pbg, shouldShow);
            mod.SetUIWidgetVisible(pbar, shouldShow);

            if (shouldShow) {
                const width = Math.max(2, PROGRESS_BAR_WIDTH * state.progress);
                mod.SetUIWidgetSize(pbar, mod.CreateVector(width, PROGRESS_BAR_HEIGHT, 0));

                // Color based on capturing team or contested
                let color = NEUTRAL_COLOR;
                if (state.contested) {
                    color = CONTESTED_COLOR;
                } else if (state.capturingTeam === myTeamId) {
                    color = TEAM1_COLOR;
                } else if (state.capturingTeam !== 0) {
                    color = TEAM2_COLOR;
                }
                mod.SetUIWidgetBgColor(pbar, color);
            }
        });
    }

    function updateFlagCount(): void {
        // DISABLED: Redundant - players can see captured flags visually
        // Also causes <unknown string> errors with dynamic text
    }
}
