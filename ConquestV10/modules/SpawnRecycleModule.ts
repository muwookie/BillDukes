/// <reference path="../config/ConquestConfig.ts" />
/// <reference path="RegistryModule.ts" />
/// <reference path="ObjectiveModule.ts" />
/// <reference path="SafeSDKWrapper.ts" />
/// <reference path="Addbotnames.ts" />

/**
 * SpawnRecycleModule - Map-Agnostic Authoritative Spawn Recycling
 * 
 * THE PATTERN THAT MAKES 32 BOTS FEEL LIKE 64+
 * 
 * ============================================================
 * BF6 SDK STATUS (EXPERIMENTAL)
 * ============================================================
 * 
 * In BF2042 Portal SDK:
 * - ForceRevive() = HUMAN ONLY
 * - Teleport() = HUMAN ONLY  
 * - SpawnPlayerFromSpawnPoint() = HUMAN ONLY
 * 
 * In BF6 SDK (index.d.ts shows these take mod.Player):
 * - ForceRevive(player) - MIGHT work for AI (testing needed)
 * - Teleport(player, destination, orientation) - MIGHT work for AI
 * - AIMoveToBehavior(player, position) - NEW! AI movement command
 * - AIDefendPositionBehavior(player, position) - NEW! AI defense
 * 
 * This module TESTS whether ForceRevive works for AI in BF6.
 * If it fails, bots stay dead and we log a warning.
 * 
 * ============================================================
 * SPAWN STRATEGY
 * ============================================================
 * 
 * Initial Spawn:
 * - Batched: 4 bots per team every 2 seconds
 * - Avoids OutOfAISpawnQuota errors
 * - Uses SpawnAIFromAISpawner (the ONLY AI spawn function)
 * 
 * Recycling (if ForceRevive works):
 * - Bot dies → stays in scoreboard (AISetUnspawnOnDead=false)
 * - After 3s delay: ForceRevive() + Teleport() to HQ
 * - Same bot entity, same quota slot = TRUE recycling
 * 
 * Fallback (if ForceRevive is human-only):
 * - Bot dies → stays dead in scoreboard forever
 * - We'd need to rely on spawner's internal respawn logic
 * - Or spawn NEW bots when old ones die (quota permitting)
 * 
 * ============================================================
 * INTEGRATION
 * ============================================================
 * 
 * 1. SpawnRecycle_Init() - Call in OnGameModeStarted
 * 2. SpawnRecycle_Start() - Call when round starts
 * 3. SpawnRecycle_Tick() - Call in tick loop
 * 4. SpawnRecycle_OnBotDied(player) - Call in OnPlayerDied
 * 5. SpawnRecycle_OnSpawnerSpawned(player, spawner) - Call in OnSpawnerSpawned
 * 
 * ============================================================
 */

namespace ConquestV8 {
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    // RE-ENABLED: Dead bots exist, we need to trigger their respawn
    // SetRedeployTime(0) + DeployPlayer should trigger X → starburst → class
    const RECYCLE_ENABLED = true;   // ENABLED - we trigger respawn on dead bots
    const MAX_BOTS_PER_TEAM = 31;            // Target per team (62 total)
    const SPAWN_BATCH_SIZE = 4;              // Spawn 4 bots at a time
    const SPAWN_BATCH_INTERVAL = 2.0;        // Wait 2 seconds between batches
    const RECYCLE_DELAY_SECONDS = 1.0;       // Wait 1s after death before recycling (was 3s)
    const RECYCLE_BATCH_SIZE = 2;            // Recycle 2 dead bots per tick
    const PENDING_RECYCLE_TIMEOUT = 5.0;     // If pendingRecycle for 5s, retry DeployPlayer
    const SPAWN_PROTECTION_SECONDS = 3.0;    // Don't validate/recycle bots within 3s of spawn
    const ANTI_CLUSTER_COOLDOWN = 30.0;      // Don't spawn at same objective within 30s
    const OBJECTIVE_PRESSURE_WEIGHT = 2.0;   // Weight for objectives under enemy pressure
    const OBJECTIVE_CAPTURE_WEIGHT = 3.0;    // Weight for objectives being captured
    const OBJECTIVE_DEFENSE_WEIGHT = 1.5;    // Weight for owned objectives needing defense
    const RANDOMIZATION_FACTOR = 0.3;        // 30% randomization to prevent predictability
    
    // =========================================================================
    // AI BEHAVIOR
    // =========================================================================
    // All maps use Mode 1: AIBattlefieldBehavior - let Portal handle AI routing.
    const BEHAVIOR_MODE = 1;
    
    // Current map type for behavior decisions
    let currentMapType: 'capstone' | 'downtown' | 'metro' | 'unknown' = 'unknown';
    
    /**
     * Detect map and set appropriate behavior mode.
     * Called during SpawnRecycle_Init().
     */
    function detectMapBehaviorMode(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                currentMapType = 'capstone';
                log(`[SpawnRecycle] Map: Capstone`);
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                currentMapType = 'downtown';
                log(`[SpawnRecycle] Map: Downtown`);
            } else {
                currentMapType = 'unknown';
                log(`[SpawnRecycle] Map: Unknown`);
            }
        } catch (e) {
            currentMapType = 'unknown';
            log(`[SpawnRecycle] Map detection failed: ${e}`);
        }
        log(`[SpawnRecycle] Using Mode 1 (AIBattlefieldBehavior)`);
    }
    
    /**
     * Safe behavior application - checks if player is deployed before any AI command.
     * Returns true if command was applied successfully.
     */
    function safeApplyBehavior(player: mod.Player, behaviorFn: () => void, behaviorName: string): boolean {
        try {
            const botId = mod.GetObjId(player);
            
            // Check 1: Is player valid?
            if (!mod.IsPlayerValid(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} invalid player`);
                return false;
            }
            
            // Check 2: Is player deployed? (Using event-based tracking)
            if (!hasSoldier(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} not deployed`);
                return false;
            }
            
            // Apply the behavior
            behaviorFn();
            return true;
        } catch (e) {
            log(`[SpawnRecycle] Safe behavior error (${behaviorName}): ${e}`);
            return false;
        }
    }
    
    /**
     * Apply AIGadgetSettings to enable gadget usage for a bot.
     * AI will use gadgets more naturally with these settings.
     */
    function enableBotGadgets(player: mod.Player): void {
        try {
            // Enable gadgets with reasonable AI behavior:
            // applyUsageCriteria=true - AI decides when to use gadgets
            // applyCoolDownAfterUse=true - Normal cooldowns apply
            // applyInaccuracy=true - AI has some inaccuracy (feels more natural)
            mod.AIGadgetSettings(player, true, true, true);
        } catch (e) {
            // Silent fail - not critical
        }
    }
    
    // =========================================================================
    // REPLACEMENT SPAWN QUEUE
    // =========================================================================
    // When ENABLE_REPLACEMENT_SPAWN=true, dead bots are ignored and NEW bots
    // are spawned to replace them. This queue tracks pending replacements.
    
    interface ReplacementSpawnEntry {
        teamId: number;
        deathTime: number;
        originalBotId: number;  // For logging only
    }
    const replacementSpawnQueue: ReplacementSpawnEntry[] = [];
    
    // =========================================================================
    // BOT REGISTRY (Authoritative State)
    // =========================================================================
    
    export interface BotEntry {
        botId: number;                       // mod.GetObjId(player)
        player: mod.Player;                  // Reference to bot
        teamId: number;                      // 1 or 2
        assignedObjectiveIndex: number;      // Which objective they're biased toward
        spawnTime: number;                   // When they spawned
        lastDeathTime: number;               // When they died (0 = alive)
        isAlive: boolean;                    // Current state
        spawnCount: number;                  // How many times recycled
        pendingRecycle: boolean;             // DeployPlayer called, waiting for OnPlayerDeployed
        pendingRecycleTime: number;          // When DeployPlayer was called (for timeout)
        redeployTimeCalled: boolean;         // Has SetRedeployTime been called for current death?
        spawnerId: number;                   // Which spawner created this bot
        mandownTime: number;                 // When bot entered ManDown state (0 = not in ManDown)
    }
    
    // The authoritative bot registry - NEVER trust engine counts
    const botRegistry: Map<number, BotEntry> = new Map();
    
    // Track objective spawn history for anti-clustering
    const objectiveLastSpawnTime: Map<number, number> = new Map();
    
    // =========================================================================
    // BATCHED INITIAL SPAWN STATE
    // =========================================================================
    
    // Track how many bots we still need to spawn per team
    let initialSpawnRemaining: Map<number, number> = new Map();
    let lastInitialSpawnTime = 0;
    let initialSpawnPhase = false;
    
    // Spawn point rotation for each team
    let spawnPointRotationIndex = 0;
    
    // Module state
    let initialized = false;
    let lastSpawnTime = 0;
    let lastTickTime = 0;
    let spawnerRotationIndex = 0;
    let classRotationIndex = 0;
    
    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
    
    function getPlayerTeamId(player: mod.Player): number {
        try {
            const team = mod.GetTeam(player);
            return team ? mod.GetObjId(team) : 0;
        } catch (e) {
            return 0;
        }
    }
    
    // =========================================================================
    // REGISTRY OPERATIONS
    // =========================================================================
    
    function registerBot(player: mod.Player, teamId: number, objectiveIndex: number, spawnerId: number = 0): void {
        const botId = mod.GetObjId(player);
        const entry: BotEntry = {
            botId,
            player,
            teamId,
            assignedObjectiveIndex: objectiveIndex,
            spawnTime: mod.GetMatchTimeElapsed(),
            lastDeathTime: 0,
            isAlive: true,
            spawnCount: 1,
            pendingRecycle: false,
            pendingRecycleTime: 0,
            redeployTimeCalled: false,
            spawnerId: spawnerId,
            mandownTime: 0,
        };
        botRegistry.set(botId, entry);
        log(`[SpawnRecycle] Registered bot ${botId} for team ${teamId} -> objective ${objectiveIndex} (spawner ${spawnerId})`);
    }
    
    function markBotDead(botId: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.isAlive = false;
            entry.lastDeathTime = mod.GetMatchTimeElapsed();
            log(`[SpawnRecycle] Bot ${botId} marked dead`);
        }
    }
    
    function updateBotAfterRecycle(botId: number, newPlayer: mod.Player, newObjectiveIndex: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.player = newPlayer;
            entry.assignedObjectiveIndex = newObjectiveIndex;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.isAlive = true;
            entry.spawnCount++;
            log(`[SpawnRecycle] Bot ${botId} recycled -> objective ${newObjectiveIndex} (spawn #${entry.spawnCount})`);
        }
    }
    
    function getAliveBotsForTeam(teamId: number): BotEntry[] {
        const alive: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive) {
                alive.push(entry);
            }
        }
        return alive;
    }
    
    function getDeadBotsForTeam(teamId: number): BotEntry[] {
        const dead: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && !entry.isAlive) {
                dead.push(entry);
            }
        }
        return dead;
    }
    
    function getTotalBotsForTeam(teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId) count++;
        }
        return count;
    }
    
    // =========================================================================
    // OBJECTIVE WEIGHTING (Map-Agnostic Intelligence)
    // =========================================================================
    
    /**
     * Calculate spawn weight for an objective.
     * Higher weight = more likely to spawn bots here.
     * 
     * This is the CORE of making bots feel intelligent without
     * relying on navmesh or AI Director.
     */
    function calculateObjectiveWeight(objectiveIndex: number, teamId: number): number {
        const objectives = Registry_GetObjectives();
        const obj = objectives[objectiveIndex];
        if (!obj) return 0;
        
        const currentTime = mod.GetMatchTimeElapsed();
        const enemyTeamId = teamId === 1 ? 2 : 1;
        
        let weight = 1.0; // Base weight
        
        // ===== OWNERSHIP FACTORS =====
        
        if (obj.teamId === 0) {
            // Neutral - high priority to capture
            weight += OBJECTIVE_CAPTURE_WEIGHT;
        } else if (obj.teamId === teamId) {
            // We own it - moderate priority to defend
            weight += OBJECTIVE_DEFENSE_WEIGHT;
        } else {
            // Enemy owns it - high priority to attack
            weight += OBJECTIVE_PRESSURE_WEIGHT;
        }
        
        // ===== CONTEST FACTOR =====
        
        if (obj.isContested) {
            // Contested objectives get priority
            weight += 2.0;
        }
        
        // ===== BOT DISTRIBUTION FACTOR =====
        // Avoid clustering: reduce weight if we already have bots assigned here
        
        const botsAtObjective = countBotsAssignedToObjective(objectiveIndex, teamId);
        const avgBotsPerObjective = getAliveBotsForTeam(teamId).length / objectives.length;
        
        if (botsAtObjective > avgBotsPerObjective * 1.5) {
            // Too many bots here already - reduce weight
            weight *= 0.3;
        } else if (botsAtObjective < avgBotsPerObjective * 0.5) {
            // Too few bots here - increase weight
            weight *= 1.5;
        }
        
        // ===== ANTI-CLUSTERING COOLDOWN =====
        // Don't spawn at the same objective too frequently
        
        const lastSpawn = objectiveLastSpawnTime.get(objectiveIndex) || 0;
        const timeSinceLastSpawn = currentTime - lastSpawn;
        
        if (timeSinceLastSpawn < ANTI_CLUSTER_COOLDOWN) {
            // Recent spawn here - reduce weight
            const cooldownFactor = timeSinceLastSpawn / ANTI_CLUSTER_COOLDOWN;
            weight *= cooldownFactor;
        }
        
        // ===== RANDOMIZATION =====
        // Add some unpredictability
        
        const randomOffset = (Math.random() - 0.5) * 2 * RANDOMIZATION_FACTOR;
        weight *= (1 + randomOffset);
        
        return Math.max(0.1, weight); // Minimum weight to ensure all objectives are possible
    }
    
    function countBotsAssignedToObjective(objectiveIndex: number, teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive && entry.assignedObjectiveIndex === objectiveIndex) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * Pick the best objective to ASSIGN a bot to.
     * NOTE: Bots physically spawn at HQ, but this determines their objective bias.
     * Uses weighted random selection based on calculateObjectiveWeight.
     * Falls back to random objective if team owns none.
     */
    function pickObjectiveForSpawn(teamId: number): number {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return 0;
        
        // ===== WEIGHTED RANDOM OBJECTIVE SELECTION =====
        // First, check if team owns any objectives - prefer spawning "toward" owned flags
        const ownedObjectives: number[] = [];
        const contestedObjectives: number[] = [];
        const neutralObjectives: number[] = [];
        const enemyObjectives: number[] = [];
        
        for (let i = 0; i < objectives.length; i++) {
            const obj = objectives[i];
            if (obj.teamId === teamId) {
                if (obj.isContested) {
                    contestedObjectives.push(i);
                } else {
                    ownedObjectives.push(i);
                }
            } else if (obj.teamId === 0) {
                neutralObjectives.push(i);
            } else {
                enemyObjectives.push(i);
            }
        }
        
        // Priority order for spawns:
        // 1. Contested owned objectives (defend!)
        // 2. Nearby neutral objectives (capture!)
        // 3. Enemy objectives (attack!)
        // 4. Owned objectives (reinforce)
        // 5. Any objective (fallback)
        
        // Calculate weights for all objectives
        const weights: number[] = [];
        let totalWeight = 0;
        
        for (let i = 0; i < objectives.length; i++) {
            const weight = calculateObjectiveWeight(i, teamId);
            weights.push(weight);
            totalWeight += weight;
        }
        
        // If no weight at all (shouldn't happen), fallback to first objective
        if (totalWeight <= 0) {
            log(`[SpawnRecycle] No objective weights - falling back to objective 0`);
            return 0;
        }
        
        // Weighted random selection
        let random = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        // Fallback to first objective
        return 0;
    }
    
    // =========================================================================
    // SPAWN POINT SELECTION
    // =========================================================================
    // 
    // IMPORTANT: SpawnAIFromAISpawner only works with AI Spawners (HQ locations).
    // Capture point spawn points (infantry spawn points) are for human deploy screen only.
    // 
    // Flow:
    // 1. Bot spawns at HQ via AI Spawner
    // 2. Bot is ASSIGNED to an objective (pickObjectiveForSpawn)
    // 3. AIBattlefieldBehavior routes bot toward their assigned area
    // 
    // The objective assignment influences AIBattlefieldBehavior's decision making,
    // not the physical spawn location.
    // =========================================================================
    
    /**
     * Get a spawn point ID for a team (for future ForceRevive+Teleport recycling).
     * Currently unused since Portal handles respawns via AISetUnspawnOnDead.
     */
    function getSpawnPointIdForTeam(teamId: number): number {
        // Use the team's AI spawner IDs as spawn point references
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        
        // Rotate through spawn points to distribute spawns
        const spawnPointId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        
        return spawnPointId;
    }
    
    /**
     * Get an HQ AI spawner for initial bot spawning.
     * NOTE: SpawnAIFromAISpawner ONLY works with AI spawners at HQ, 
     * NOT with capture point spawn points.
     * 
     * The objectiveIndex parameter is for logging/tracking only - 
     * bots always physically spawn at HQ and then navigate to objectives.
     */
    function getSpawnerForTeam(teamId: number): mod.Spawner | null {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        
        // Rotate through HQ spawners to distribute spawns
        const spawnerId = spawnerIds[spawnerRotationIndex % spawnerIds.length];
        spawnerRotationIndex++;
        
        try {
            return mod.GetSpawner(spawnerId);
        } catch (e) {
            log(`[SpawnRecycle] Failed to get spawner ${spawnerId}: ${e}`);
            return null;
        }
    }
    
    // =========================================================================
    // INITIAL SPAWN EXECUTION (Creates new bots - uses quota)
    // =========================================================================
    
    /**
     * Spawn a NEW bot for a team, assigned to a specific objective.
     * 
     * NOTE: Bot physically spawns at HQ (AI Spawner), NOT at the objective.
     * The objectiveIndex is their ASSIGNMENT - where AIBattlefieldBehavior will route them.
     * 
     * This uses SpawnAIFromAISpawner and consumes quota.
     * With AISetUnspawnOnDead=false, Portal handles respawns automatically.
     */
    function spawnBotForTeam(teamId: number, objectiveIndex: number): void {
        // Get an HQ spawner for this team
        const spawner = getSpawnerForTeam(teamId);
        if (!spawner) {
            log(`[SpawnRecycle] No HQ spawner available for team ${teamId} - cannot spawn`);
            return;
        }
        
        try {
            // Get soldier class (rotate through classes)
            const classes = [
                mod.SoldierClass.Assault,
                mod.SoldierClass.Engineer,
                mod.SoldierClass.Support,
                mod.SoldierClass.Recon,
            ];
            const soldierClass = classes[classRotationIndex % classes.length];
            classRotationIndex++;
            
            // Get team object using GetTeam(teamId)
            const team = mod.GetTeam(teamId);
            if (!team) {
                log(`[SpawnRecycle] Team ${teamId} not found`);
                return;
            }
            
            // Get bot name
            const name = nextBotName();
            const nameMsg = mod.Message(name);
            
            // Spawn the bot at HQ - NOTE: SpawnAIFromAISpawner returns void
            // Bot will be registered via OnSpawnerSpawned event with their objective assignment
            mod.SpawnAIFromAISpawner(spawner, soldierClass, nameMsg, team);
            
            // Update anti-clustering timer for this objective
            objectiveLastSpawnTime.set(objectiveIndex, mod.GetMatchTimeElapsed());
            
            log(`[SpawnRecycle] Spawned bot for team ${teamId} at HQ, assigned to objective ${objectiveIndex}`);
            
        } catch (e) {
            const errorStr = String(e);
            if (errorStr.includes("OutOfAISpawnQuota")) {
                log(`[SpawnRecycle] AI quota reached - will retry later`);
            } else {
                log(`[SpawnRecycle] Spawn error: ${e}`);
            }
        }
    }
    
    // =========================================================================
    // DEATH HANDLING - AI bots get recycled, humans get normal deploy
    // =========================================================================
    
    /**
     * Called when ANY player dies.
     * AI bots: Either queue for replacement spawn or recycle (based on toggle)
     * Humans: Do nothing here - handle in OnPlayerDeployed instead
     */
    export function SpawnRecycle_OnBotDied(player: mod.Player): void {
        if (!initialized) return;
        
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        
        // HUMAN PLAYER - do nothing on death, handle in OnPlayerDeployed
        if (!isAI) {
            return;
        }
        
        // AI BOT - track death
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        
        // ============================================================
        // REPLACEMENT SPAWN MODE
        // ============================================================
        // Instead of recycling dead bot, spawn a NEW replacement
        if (ENABLE_REPLACEMENT_SPAWN) {
            // Queue a replacement spawn for this team
            replacementSpawnQueue.push({
                teamId: teamId,
                deathTime: currentTime,
                originalBotId: botId
            });
            log(`[SpawnRecycle] Bot ${botId} died (team ${teamId}) - queued REPLACEMENT spawn`);
            
            // Still update registry so we track the dead bot
            const entry = botRegistry.get(botId);
            if (entry) {
                entry.isAlive = false;
                entry.lastDeathTime = currentTime;
            }
            return;
        }
        
        // ============================================================
        // RECYCLE MODE (original behavior)
        // ============================================================
        const entry = botRegistry.get(botId);
        
        if (entry) {
            // Mark as dead - bot entity stays in game
            entry.isAlive = false;
            entry.pendingRecycle = false;  // Clear pending flag if set
            entry.lastDeathTime = currentTime;
            if (RECYCLE_ENABLED) {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - queued for DeployPlayer recycle`);
            } else {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - spawner will handle respawn`);
            }
        } else {
            // Not tracked - register them now as dead
            if (teamId > 0) {
                const newEntry: BotEntry = {
                    botId,
                    player,
                    teamId,
                    assignedObjectiveIndex: 0,
                    spawnTime: 0,
                    lastDeathTime: currentTime,
                    isAlive: false,
                    spawnCount: 0,
                    pendingRecycle: false,
                    pendingRecycleTime: 0,
                    redeployTimeCalled: false,
                    spawnerId: 0,
                    mandownTime: 0,
                };
                botRegistry.set(botId, newEntry);
                log(`[SpawnRecycle] Untracked bot ${botId} died (team ${teamId}) - registered and queued`);
            }
        }
    }
    
    /**
     * Called when ANY player enters ManDown (bleedout) state.
     * AI bots: Re-apply AISetUnspawnOnDead(false) to prevent early entity destruction.
     * This gives time for the full bleedout/revive window before replacement spawn.
     */
    export function SpawnRecycle_OnBotMandown(player: mod.Player): void {
        if (!initialized) return;
        
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        
        // HUMAN PLAYER - do nothing
        if (!isAI) {
            return;
        }
        
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        const entry = botRegistry.get(botId);
        
        if (entry) {
            // Track when bot entered ManDown
            entry.mandownTime = currentTime;
            log(`[SpawnRecycle] Bot ${botId} entered ManDown at ${currentTime.toFixed(1)}s`);
            
            // RE-APPLY AISetUnspawnOnDead(false) to try to keep bot entity alive during bleedout
            // This is our best attempt to prevent Portal from destroying the entity early
            if (entry.spawnerId > 0) {
                try {
                    const spawner = mod.GetSpawner(entry.spawnerId);
                    mod.AISetUnspawnOnDead(spawner, false);
                    log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false on spawner ${entry.spawnerId}`);
                } catch (e) {
                    log(`[SpawnRecycle] Bot ${botId} ManDown - spawner ${entry.spawnerId} error: ${e}`);
                }
            } else {
                // No tracked spawner - apply to ALL spawners for this team as fallback
                const spawnerIds = entry.teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
                for (const spawnerId of spawnerIds) {
                    try {
                        const spawner = mod.GetSpawner(spawnerId);
                        mod.AISetUnspawnOnDead(spawner, false);
                    } catch (e) {
                        // Silent - some spawners may not exist
                    }
                }
                log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false to team ${entry.teamId} spawners`);
            }
        } else {
            // Untracked bot - just log
            log(`[SpawnRecycle] Untracked bot ${botId} entered ManDown`);
        }
    }
    
    /**
     * Helper to get object position (same pattern as VehicleDirectorModule).
     */
    function getObjectPos(obj: mod.Object): mod.Vector | null {
        try {
            return mod.GetObjectPosition(obj);
        } catch (_e) {
            return null;
        }
    }

    /**
     * Get spawn position for a team (HQ area).
     * Uses the team's AI spawner positions.
     */
    function getSpawnPositionForTeam(teamId: number): mod.Vector {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnerId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        
        try {
            const spawner = mod.GetSpawner(spawnerId);
            if (spawner) {
                const pos = getObjectPos(spawner as unknown as mod.Object);
                if (pos) return pos;
            }
        } catch (e) {}
        
        // Fallback positions (approximate HQ locations for Downtown)
        if (teamId === 1) {
            return mod.CreateVector(-1200, 150, 400); // Team 1 HQ approximate
        } else {
            return mod.CreateVector(-850, 150, -150); // Team 2 HQ approximate
        }
    }
    
    /**
     * Apply behavior to a bot based on BEHAVIOR_MODE.
     * Centralized function used by both spawn and recycle handlers.
     * Uses safe wrappers to prevent PlayerNotDeployed exceptions.
     */
    function applyBehaviorToBot(player: mod.Player, botId: number, objectiveIndex: number, currentTime: number): void {
        try {
            // Enable gadget usage for all bots
            enableBotGadgets(player);
            
            // DISABLED: SetPlayerMaxHealth may be killing bots - testing without it
            // setAIHealthToMatchHuman(player);
            
            // Mode 1: AIBattlefieldBehavior only - let Portal handle AI
            safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
            log(`[SpawnRecycle] Bot ${botId} - AIBattlefieldBehavior applied`);
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - applyBehaviorToBot error: ${e}`);
        }
    }
    
    // =========================================================================
    // BATCHED INITIAL SPAWN (Round Start)
    // =========================================================================
    
    /**
     * Start the batched initial spawn process.
     * Sets up counters - actual spawning happens in tick.
     */
    function startInitialSpawn(): void {
        log(`[SpawnRecycle] Starting batched initial spawn (${MAX_BOTS_PER_TEAM} per team, ${SPAWN_BATCH_SIZE} at a time)...`);
        initialSpawnPhase = true;
        lastInitialSpawnTime = 0; // Force immediate first batch
        
        for (let teamId = 1; teamId <= 2; teamId++) {
            const currentCount = getTotalBotsForTeam(teamId);
            const needed = MAX_BOTS_PER_TEAM - currentCount;
            initialSpawnRemaining.set(teamId, needed);
            log(`[SpawnRecycle] Team ${teamId} needs ${needed} bots`);
        }
    }
    
    /**
     * Process one batch of initial spawns.
     * Called from tick loop - spawns SPAWN_BATCH_SIZE bots per team max.
     */
    function processInitialSpawnBatch(currentTime: number): void {
        if (!initialSpawnPhase) return;
        
        // Check if enough time has passed since last batch
        if (currentTime - lastInitialSpawnTime < SPAWN_BATCH_INTERVAL) return;
        
        let spawnedThisBatch = 0;
        let totalRemaining = 0;
        
        for (let teamId = 1; teamId <= 2; teamId++) {
            const remaining = initialSpawnRemaining.get(teamId) || 0;
            totalRemaining += remaining;
            
            if (remaining <= 0) continue;
            
            // Spawn up to SPAWN_BATCH_SIZE for this team
            const toSpawn = Math.min(remaining, SPAWN_BATCH_SIZE);
            
            for (let i = 0; i < toSpawn; i++) {
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                spawnBotForTeam(teamId, objectiveIndex);
                spawnedThisBatch++;
            }
            
            initialSpawnRemaining.set(teamId, remaining - toSpawn);
            log(`[SpawnRecycle] Spawned ${toSpawn} bots for team ${teamId}, ${remaining - toSpawn} remaining`);
        }
        
        lastInitialSpawnTime = currentTime;
        
        // Check if initial spawn complete
        if (totalRemaining - spawnedThisBatch <= 0) {
            initialSpawnPhase = false;
            const t1Count = getTotalBotsForTeam(1);
            const t2Count = getTotalBotsForTeam(2);
            log(`[SpawnRecycle] Initial spawn COMPLETE: Team1=${t1Count}, Team2=${t2Count}`);
        }
    }
    
    /**
     * Called when a bot spawns from a spawner.
     * This handles initial spawns - registers new bots.
     */
    export function SpawnRecycle_OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
        if (!initialized) return;
        
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            if (!isAI) return; // Ignore human spawns
        } catch (e) {
            return;
        }
        
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const objectiveIndex = pickObjectiveForSpawn(teamId);
        const spawnerId = mod.GetObjId(spawner);
        
        // Log spawn position to see WHERE bots are spawning
        let posStr = "unknown";
        try {
            const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            const x = Math.round(mod.XComponentOf(pos));
            const y = Math.round(mod.YComponentOf(pos));
            const z = Math.round(mod.ZComponentOf(pos));
            posStr = `(${x},${y},${z})`;
        } catch (e) {
            posStr = "pos_error";
        }
        
        // Check if already registered
        let isRespawn = false;
        if (botRegistry.has(botId)) {
            // Already tracked - update state (this is a RESPAWN)
            isRespawn = true;
            const entry = botRegistry.get(botId)!;
            entry.isAlive = true;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.spawnCount++;
            entry.assignedObjectiveIndex = objectiveIndex;
            entry.pendingRecycle = false;  // Clear pending state
            entry.redeployTimeCalled = false;  // Reset for next death cycle
            entry.spawnerId = spawnerId;  // Track spawner for ManDown re-application
            entry.mandownTime = 0;  // Clear mandown state
            
            // RE-APPLY AISetUnspawnOnDead=false on EVERY respawn
            try {
                mod.AISetUnspawnOnDead(spawner, false);
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - re-applied AISetUnspawnOnDead=false`);
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - spawner config failed: ${e}`);
            }
            
            log(`[SpawnRecycle] Bot ${botId} spawned again (spawn #${entry.spawnCount}) at ${posStr} from spawner ${spawnerId}`);
        } else {
            // New bot - register it (FIRST spawn)
            registerBot(player, teamId, objectiveIndex, spawnerId);
            log(`[SpawnRecycle] New bot ${botId} registered at ${posStr} from spawner ${spawnerId}`);
        }
        
        // =====================================================================
        // BEHAVIOR MODE - Apply on EVERY spawn (including respawns)
        // BOTSCOMEALIVE: Behaviors were applied on every spawn, not just first
        // =====================================================================
        const spawnType = isRespawn ? "RESPAWN" : "FIRST SPAWN";
        log(`[SpawnRecycle] Bot ${botId} - ${spawnType}: applying AIBattlefieldBehavior`);
        
        // Enable gadget usage for all spawned bots
        enableBotGadgets(player);
        
        try {
            // Mode 1: AIBattlefieldBehavior - let Portal handle AI
            safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
            log(`[SpawnRecycle] Bot ${botId} - AIBattlefieldBehavior applied`);
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - Behavior error: ${e}`);
        }
    }
    
    /**
     * Get objective position for AI routing.
     * Uses GetCapturePoint to get the capture point entity, then GetObjectPosition for its location.
     */
    function getObjectivePosition(objectiveIndex: number): mod.Vector | null {
        try {
            const objectives = Registry_GetObjectives();
            if (objectiveIndex >= 0 && objectiveIndex < objectives.length) {
                const obj = objectives[objectiveIndex];
                if (obj && obj.objId) {
                    // Get capture point entity using objId, then get its position
                    const capturePoint = mod.GetCapturePoint(obj.objId);
                    if (capturePoint) {
                        return mod.GetObjectPosition(capturePoint as unknown as mod.Object);
                    }
                }
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to get objective ${objectiveIndex} position: ${e}`);
        }
        return null;
    }
    
    // =========================================================================
    // SYNC WITH ENGINE (Validate Registry)
    // =========================================================================
    
    /**
     * Process replacement spawn queue.
     * When ENABLE_REPLACEMENT_SPAWN=true, dead bots are ignored and NEW bots spawned.
     */
    function processReplacementSpawns(currentTime: number): void {
        if (!ENABLE_REPLACEMENT_SPAWN) return;
        if (replacementSpawnQueue.length === 0) return;
        
        let spawned = 0;
        const toRemove: number[] = [];
        
        for (let i = 0; i < replacementSpawnQueue.length && spawned < MAX_REPLACEMENT_SPAWNS_PER_TICK; i++) {
            const entry = replacementSpawnQueue[i];
            const timeSinceDeath = currentTime - entry.deathTime;
            
            // Wait for delay before spawning replacement
            if (timeSinceDeath < REPLACEMENT_SPAWN_DELAY) continue;
            
            // Spawn a new bot for this team
            const objectiveIndex = pickObjectiveForSpawn(entry.teamId);
            
            try {
                spawnBotForTeam(entry.teamId, objectiveIndex);
                log(`[SpawnRecycle] REPLACEMENT spawned for team ${entry.teamId} (replacing bot ${entry.originalBotId})`);
                spawned++;
                toRemove.push(i);
                
                // CRITICAL: Remove dead bot from registry to prevent total count drift
                // Without this, dead bots stay in registry while new ones are added,
                // causing team totals to grow beyond 31 per team.
                if (botRegistry.has(entry.originalBotId)) {
                    botRegistry.delete(entry.originalBotId);
                    log(`[SpawnRecycle] Removed dead bot ${entry.originalBotId} from registry`);
                }
            } catch (e) {
                const errorStr = String(e);
                if (errorStr.includes("OutOfAISpawnQuota")) {
                    log(`[SpawnRecycle] REPLACEMENT spawn quota full - will retry`);
                    // Don't remove, will retry next tick
                } else {
                    log(`[SpawnRecycle] REPLACEMENT spawn error: ${e}`);
                    toRemove.push(i); // Remove failed entries
                }
            }
        }
        
        // Remove processed entries (reverse order to preserve indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            replacementSpawnQueue.splice(toRemove[i], 1);
        }
        
        if (replacementSpawnQueue.length > 0) {
            log(`[SpawnRecycle] ${replacementSpawnQueue.length} replacements pending`);
        }
    }

    /**
     * Periodically validate registry against actual game state.
     * Catches bots that died without triggering OnBotDied.
     * DISABLED when RECYCLE_ENABLED=false to avoid GetSoldierState exceptions
     */
    function validateRegistry(): void {
        // ALWAYS validate to keep accurate counts
        const currentTime = mod.GetMatchTimeElapsed();
        
        for (const [botId, entry] of botRegistry.entries()) {
            try {
                // ============================================================
                // SPAWN PROTECTION - Don't touch bots that just spawned!
                // This prevents race condition where GetSoldierState throws
                // during spawn transition and we incorrectly mark them dead.
                // ============================================================
                const timeSinceSpawn = currentTime - entry.spawnTime;
                if (timeSinceSpawn < SPAWN_PROTECTION_SECONDS) {
                    // Bot just spawned - skip validation entirely
                    continue;
                }
                
                // NOTE: We NO LONGER delete bots based on IsPlayerValid!
                // Bots can be temporarily "invalid" during respawn.
                // Just log for debugging, don't remove.
                if (!mod.IsPlayerValid(entry.player)) {
                    log("[SpawnRecycle] Bot " + botId + " IsPlayerValid=false (may be respawning)");
                    // DON'T delete - bot might just be in respawn transition
                    continue;
                }
                
                // Only check state on bots we think are alive
                // GetSoldierState on dead/undeployed bots throws PlayerNotDeployed exception
                if (!entry.isAlive) continue;
                
                // CRITICAL: Check if player has deployed soldier before calling GetSoldierState
                // This prevents PlayerNotDeployed exceptions that spam the log
                if (!hasSoldier(entry.player)) {
                    // Player exists but no soldier - skip validation this tick
                    continue;
                }
                
                // Sync alive state
                const isAlive = mod.GetSoldierState(entry.player, mod.SoldierStateBool.IsAlive);
                
                if (entry.isAlive && !isAlive) {
                    // Bot died but we didn't catch it via OnBotDied
                    entry.isAlive = false;
                    entry.lastDeathTime = mod.GetMatchTimeElapsed();
                    log(`[SpawnRecycle] Bot ${botId} detected dead via validation - queued for recycle`);
                }
                
            } catch (e) {
                // Bot reference invalid or not deployed
                // DON'T mark as dead on exception - could be spawn transition!
                // Only log for debugging
                log(`[SpawnRecycle] Bot ${botId} validateRegistry exception (may be spawning): ${e}`);
            }
        }
    }
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    export function SpawnRecycle_Reset(): void {
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        lastValidateTime = 0;
        lastStatusTime = 0;
        initialized = false;
        startCalled = false; // Reset start guard
        log(`[SpawnRecycle] Reset complete`);
    }
    
    export function SpawnRecycle_Init(): void {
        if (initialized) return;
        
        // Detect map and set appropriate behavior mode FIRST
        detectMapBehaviorMode();
        
        initBotNames();
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        
        // ============================================================
        // SPAWN MODE - Controlled by USE_AUTOSPAWN_MODE config toggle
        // AutoSpawn = bots respawn via SetRedeployTime
        // Deploy = manual deploy screen (no auto-respawn)
        // ============================================================
        try {
            if (USE_AUTOSPAWN_MODE) {
                mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
                log(`[SpawnRecycle] SetSpawnMode(AutoSpawn) - bots will auto-respawn`);
            } else {
                mod.SetSpawnMode(mod.SpawnModes.Deploy);
                log(`[SpawnRecycle] SetSpawnMode(Deploy) - manual deploy screen`);
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to set spawn mode: ${e}`);
        }
        
        // ============================================================
        // AISetUnspawnOnDead - controls whether dead bots stay in game
        // false = bots persist dead, we handle recycling via SetRedeployTime
        // ============================================================
        if (RECYCLE_ENABLED) {
            const allSpawnerIds = [...TEAM1_AI_SPAWNER_IDS, ...TEAM2_AI_SPAWNER_IDS];
            for (const spawnerId of allSpawnerIds) {
                try {
                    const spawner = mod.GetSpawner(spawnerId);
                    if (spawner) {
                        mod.AISetUnspawnOnDead(spawner, false);
                        log(`[SpawnRecycle] Spawner ${spawnerId}: AISetUnspawnOnDead=false`);
                    }
                } catch (e) {
                    log(`[SpawnRecycle] Failed to configure spawner ${spawnerId}: ${e}`);
                }
            }
            log(`[SpawnRecycle] Recycling ENABLED - SetRedeployTime will trigger respawn`);
        } else {
            log(`[SpawnRecycle] Portal natural respawn mode - spawner handles respawns`);
        }
        
        initialized = true;
    }
    
    let startCalled = false; // Prevent repeated calls to SpawnRecycle_Start
    
    export function SpawnRecycle_Start(): void {
        if (!initialized) {
            SpawnRecycle_Init();
        }
        
        // Only start initial spawn ONCE
        if (startCalled) return;
        startCalled = true;
        
        // Start batched initial spawn (will be processed in tick)
        startInitialSpawn();
    }
    
    let lastValidateTime = 0;
    const VALIDATE_INTERVAL = 3.0; // Validate registry every 3 seconds
    
    let lastStatusTime = 0;
    const STATUS_INTERVAL = 15.0; // Log status every 15 seconds
    
    let lastRecycleTime = 0;
    const RECYCLE_INTERVAL = 1.0; // Process dead bot recycling every 1 second
    
    export function SpawnRecycle_Tick(): void {
        if (!initialized) return;
        
        const currentTime = mod.GetMatchTimeElapsed();
        
        // Throttle tick processing
        if (currentTime - lastTickTime < 0.5) return;
        lastTickTime = currentTime;
        
        // Process batched initial spawns (if still in progress)
        // This ALWAYS runs regardless of RECYCLE_ENABLED
        if (initialSpawnPhase) {
            processInitialSpawnBatch(currentTime);
        }
        
        // Process replacement spawns (when ENABLE_REPLACEMENT_SPAWN=true)
        processReplacementSpawns(currentTime);
        
        // Periodic registry validation (catch missed deaths) - ALWAYS run for accurate counts
        if (currentTime - lastValidateTime >= VALIDATE_INTERVAL) {
            validateRegistry();
            lastValidateTime = currentTime;
        }
        
        // Periodic status log
        if (currentTime - lastStatusTime >= STATUS_INTERVAL) {
            const t1Alive = getAliveBotsForTeam(1).length;
            const t2Alive = getAliveBotsForTeam(2).length;
            const t1Total = getTotalBotsForTeam(1);
            const t2Total = getTotalBotsForTeam(2);
            const t1Dead = t1Total - t1Alive;
            const t2Dead = t2Total - t2Alive;
            
            log(`[SpawnRecycle] STATUS (Mode ${BEHAVIOR_MODE}): T1=${t1Alive}/${t1Total} alive (${t1Dead} dead) | T2=${t2Alive}/${t2Total} alive (${t2Dead} dead)`);
            
            if (initialSpawnPhase) {
                const t1Remaining = initialSpawnRemaining.get(1) || 0;
                const t2Remaining = initialSpawnRemaining.get(2) || 0;
                log(`[SpawnRecycle] Initial spawn in progress: T1 needs ${t1Remaining}, T2 needs ${t2Remaining}`);
            }
            
            lastStatusTime = currentTime;
        }
    }
    
    export function SpawnRecycle_GetStats(): { team1Alive: number; team2Alive: number; team1Total: number; team2Total: number } {
        return {
            team1Alive: getAliveBotsForTeam(1).length,
            team2Alive: getAliveBotsForTeam(2).length,
            team1Total: getTotalBotsForTeam(1),
            team2Total: getTotalBotsForTeam(2),
        };
    }
    
    // =========================================================================
    // STATIC BOT INTEGRATION (OnPlayerDeployed)
    // =========================================================================
    // 
    // Static bots (14v14 from Portal) don't go through OnSpawnerSpawned since
    // they're not spawned by OUR spawner. However, OnPlayerDeployed fires for
    // ALL player/bot spawns including static bots!
    //
    // This function applies AIDefendPositionBehavior to static bots so they
    // also spread across objectives instead of clustering.
    // =========================================================================
    
    // Track when humans were last undeployed (to prevent infinite loop)
    // NOTE: Not currently used - main.script.ts filters humans before calling us
    // const humanLastUndeploy: Map<number, number> = new Map();
    // const HUMAN_UNDEPLOY_COOLDOWN = 1.0;
    
    /**
     * Called when ANY player deploys (humans + scripted + STATIC bots).
     * NOTE: main.script.ts already filters for AI only before calling this!
     * This handles:
     * 1. STATIC bots (not in registry) - apply behaviors
     * 2. RECYCLED bots (in registry, was dead) - apply behaviors again
     */
    export function SpawnRecycle_OnPlayerDeployed(player: mod.Player): void {
        if (!initialized) return;
        if (!player) return;
        
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        log(`[SpawnRecycle] >>> OnPlayerDeployed fired for player ${botId}`);
        
        try {
            // Check if AI - but catch exception
            let isAI = false;
            try {
                isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            } catch (stateError) {
                // Bot might not have soldier yet - check if in our registry
                log(`[SpawnRecycle] GetSoldierState threw for ${botId}: ${stateError}`);
                const entry = botRegistry.get(botId);
                if (entry) {
                    log(`[SpawnRecycle] Bot ${botId} is in registry, treating as AI`);
                    isAI = true;
                }
            }
            
            if (!isAI) {
                log(`[SpawnRecycle] Player ${botId} is not AI, skipping`);
                return;
            }
            
            const teamId = getPlayerTeamId(player);
            
            // Check if this bot is in our registry (scripted bot)
            const entry = botRegistry.get(botId);
            
            if (entry) {
                log(`[SpawnRecycle] Bot ${botId} found in registry, isAlive=${entry.isAlive}, pendingRecycle=${entry.pendingRecycle}`);
                
                // RECYCLED BOT - was in registry, now respawned via DeployPlayer
                // Check if it was marked dead OR pending recycle (meaning this is a recycle)
                if (!entry.isAlive || entry.pendingRecycle) {
                    // Bot was dead, now alive again - THIS IS A SUCCESSFUL RECYCLE!
                    entry.isAlive = true;
                    entry.pendingRecycle = false;  // Clear pending flag
                    entry.pendingRecycleTime = 0;  // Clear timeout tracker
                    entry.redeployTimeCalled = false;  // Reset for next death cycle
                    entry.spawnTime = mod.GetMatchTimeElapsed();
                    entry.lastDeathTime = 0;  // Clear death time
                    entry.spawnCount++;
                    
                    // Pick new objective for variety
                    const objectiveIndex = pickObjectiveForSpawn(teamId);
                    entry.assignedObjectiveIndex = objectiveIndex;
                    
                    log(`[SpawnRecycle] RECYCLED bot ${botId} (spawn #${entry.spawnCount}) - applying Mode ${BEHAVIOR_MODE}`);
                    
                    // Apply Mode 3 behaviors (same as initial spawn)
                    const currentTime = mod.GetMatchTimeElapsed();
                    applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
                } else {
                    // Bot was already alive in registry - this is initial spawn handled by OnSpawnerSpawned
                    log(`[SpawnRecycle] Bot ${botId} already alive, skipping (handled by OnSpawnerSpawned)`);
                    return;
                }
            } else {
                // STATIC BOT - not in our registry (Portal-spawned)
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                
                log(`[SpawnRecycle] STATIC bot ${botId} deployed (team ${teamId}) - applying Mode ${BEHAVIOR_MODE}`);
                
                // Apply same behavior mode as scripted bots
                const currentTime = mod.GetMatchTimeElapsed();
                applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
            }
            
        } catch (e) {
            log(`[SpawnRecycle] OnPlayerDeployed error for ${botId}: ${e}`);
        }
    }
}
