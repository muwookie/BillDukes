/**
 * Bundler for ConquestV10 Mode
 * Soft-Influence Architecture: ObjectiveBiasModule + Gentle Director
 */

const fs = require('fs');
const path = require('path');

const MODULE_ORDER = [
    'config/ConquestConfig.ts',
    'modules/SafeSDKWrapper.ts',
    'modules/RegistryModule.ts',
    'modules/SoundsModule.ts',              // Before ObjectiveModule (dependency)
    'modules/ObjectiveModule.ts',
    'modules/CapturePointModule.ts',
    'modules/Addbotnames.ts',
    'modules/ObjectiveBiasModule.ts',       // Soft-influence weights
    'modules/SpawnRecycleModule.ts',        // TRUE RECYCLING - same bot respawns
    'modules/AILoadoutModule.ts',
    'modules/DirectorModule.ts',            // Gentle nudge-only mode
    'modules/VehicleDirectorModule.ts',
    'modules/AircraftCombatModule.ts',
    'modules/VehicleSpawnUIModuleParseUI.ts',
    'modules/ScoreboardModule.ts',
    'modules/TicketBleedModule.ts',
    'modules/HudModuleParseUI.ts',
    'modules/WorldIconModule.ts',
    'main.script.ts',
];

const modsDir = path.join(__dirname, '..', 'mods');
const SOURCE_DIR = path.join(modsDir, 'ConquestV10');

if (!fs.existsSync(SOURCE_DIR)) {
    console.error('ERROR: Source folder not found: ' + SOURCE_DIR);
    process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = 'ConquestV10.portal.ts';

console.log('='.repeat(60));
console.log('ConquestV10 Bundler - Soft-Influence Architecture');
console.log('ObjectiveBiasModule + Gentle Director');
console.log('='.repeat(60));

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let bundledCode = '';

bundledCode += '// @ts-nocheck\n';
bundledCode += '// ConquestV10 - Soft-Influence Conquest Mode\n';
bundledCode += '// Works WITH AIBattlefieldBehavior, not against it\n';
bundledCode += '// Auto-generated bundle - DO NOT EDIT\n';
bundledCode += '// Generated: ' + new Date().toISOString() + '\n\n';

console.log('\nBundling modules from: ' + SOURCE_DIR);

for (const relPath of MODULE_ORDER) {
    const fullPath = path.join(SOURCE_DIR, relPath);

    if (!fs.existsSync(fullPath)) {
        console.error('ERROR: Module not found: ' + relPath);
        process.exit(1);
    }

    console.log('  + ' + relPath);

    let code = fs.readFileSync(fullPath, 'utf8');

    // Strip triple-slash references
    code = code.replace(/^\s*\/\/\/\s*<reference\b[^>]*\/?>\s*$/gm, '');

    // Strip imports
    code = code
        .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
        .replace(/^import\s+['"].*?['"];?\s*$/gm, '')
        .trim();

    // Remove comment-only lines to keep bundle small (safer for Portal paste limits)
    const lines = code.split(/\r?\n/);
    const cleaned = [];
    let inBlockComment = false;
    for (const line of lines) {
        const trimmed = line.trim();

        if (inBlockComment) {
            if (trimmed.endsWith('*/')) {
                inBlockComment = false;
            }
            continue;
        }

        if (trimmed.startsWith('/*')) {
            // Skip block comment lines if they don't contain code
            if (trimmed.endsWith('*/')) {
                continue;
            }
            inBlockComment = true;
            continue;
        }

        if (trimmed.startsWith('//')) continue;
        if (trimmed.length === 0) continue;

        cleaned.push(line);
    }

    code = cleaned.join('\n').trim();

    bundledCode += '\n// Module: ' + relPath + '\n';
    bundledCode += code;
    bundledCode += '\n\n';
}


// Add global Portal event handlers that forward to namespace
bundledCode += '\n// Global Portal Event Handlers\n';
bundledCode += 'export function OnGameModeStarted(): void {\n';
bundledCode += '    console.log("[ConquestV10] OnGameModeStarted - Soft-Influence Mode");\n';
bundledCode += '    ConquestV8.OnGameModeStarted();\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnGameModeEnded(): void {\n';
bundledCode += '    console.log("[ConquestV10] OnGameModeEnded");\n';
bundledCode += '    ConquestV8.OnGameModeEnded();\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerJoinGame(player: mod.Player): void {\n';
bundledCode += '    ConquestV8.OnPlayerJoinGame(player);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerDeployed(player: mod.Player): void {\n';
bundledCode += '    ConquestV8.OnPlayerDeployed(player);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerUndeploy(player: mod.Player): void {\n';
bundledCode += '    ConquestV8.OnPlayerUndeploy(player);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {\n';
bundledCode += '    ConquestV8.OnSpawnerSpawned(player, spawner);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent): void {\n';
bundledCode += '    ConquestV8.OnPlayerUIButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {\n';
bundledCode += '    ConquestV8.OnPlayerEnterCapturePoint(player, cp);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {\n';
bundledCode += '    ConquestV8.OnPlayerExitCapturePoint(player, cp);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnCapturePointCaptured(cp: mod.CapturePoint): void {\n';
bundledCode += '    ConquestV8.OnCapturePointCaptured(cp);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {\n';
bundledCode += '    ConquestV8.OnPlayerDied(player, killer, deathType, weapon);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnRevived(revived: mod.Player, reviver: mod.Player): void {\n';
bundledCode += '    ConquestV8.OnRevived(revived, reviver);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnVehicleSpawned(vehicle: mod.Vehicle): void {\n';
bundledCode += '    ConquestV8.OnVehicleSpawned(vehicle);\n';
bundledCode += '}\n\n';
bundledCode += 'export function OnVehicleDestroyed(vehicle: mod.Vehicle, destroyer: mod.Player, weapon: mod.WeaponUnlock): void {\n';
bundledCode += '    ConquestV8.OnVehicleDestroyed(vehicle, destroyer, weapon);\n';
bundledCode += '}\n\n';

// Write output
const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
fs.writeFileSync(outputPath, bundledCode, 'utf8');

const sizeKB = (bundledCode.length / 1024).toFixed(2);

console.log('\nBundle created: ' + outputPath);
console.log('File size: ' + sizeKB + ' KB');
console.log('='.repeat(60));
console.log('SUCCESS: ConquestV10 bundle ready for Portal upload!');
console.log('='.repeat(60));
