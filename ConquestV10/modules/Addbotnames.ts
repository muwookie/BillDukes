/// <reference path="../config/ConquestConfig.ts" />

namespace ConquestV8 {
    const BOT_NAME_POOL: string[] = [
        // 128 unique, ASCII-only, low-punctuation names for Portal name fields.
        // NOTE: Include "[bot]" directly in each entry (no suffix concatenation).
        "Apex [bot]","Vector [bot]","Cipher [bot]","Echo [bot]","Delta [bot]","Bravo [bot]","Alpha [bot]","Omega [bot]",
        "Sentinel [bot]","Phantom [bot]","Havoc [bot]","Aurora [bot]","Nyx [bot]","Viper [bot]","Blaze [bot]","Specter [bot]",
        "Hydra [bot]","Falcon [bot]","Raptor [bot]","Nova [bot]","Atlas [bot]","Sable [bot]","Zephyr [bot]","Onyx [bot]",
        "Mirage [bot]","Javelin [bot]","Horizon [bot]","Tempest [bot]","Gladius [bot]","Striker [bot]","Thunder [bot]","Vanguard [bot]",
        "Trident [bot]","Peregrine [bot]","Ironclad [bot]","Rogue [bot]","Nomad [bot]","Quasar [bot]","Saber [bot]","Foxtrot [bot]",
        "Sierra [bot]","Talon [bot]","Valkyrie [bot]","Titan [bot]","Pioneer [bot]","Artemis [bot]","Helios [bot]","Hades [bot]",
        "Apollo [bot]","Erebus [bot]","Loki [bot]","Odin [bot]","Freya [bot]","Heimdall [bot]","Thor [bot]","Skadi [bot]",
        "Fenrir [bot]","Warden [bot]","Maverick [bot]","Ranger [bot]","Paladin [bot]","Reaper [bot]","Ghost [bot]","Raven [bot]",
        "Wolf [bot]","Bear [bot]","Lion [bot]","Tiger [bot]","Eagle [bot]","Hawk [bot]","Kestrel [bot]","Condor [bot]",
        "Orion [bot]","Pegasus [bot]","Draco [bot]","Lyra [bot]","Vega [bot]","Sirius [bot]","Polaris [bot]","Altair [bot]",
        "Comet [bot]","Meteor [bot]","Astro [bot]","Nebula [bot]","Cosmos [bot]","Quantum [bot]","Ion [bot]","Neon [bot]",
        "Pulse [bot]","Surge [bot]","Fury [bot]","Rift [bot]","Shade [bot]","Grit [bot]","Forge [bot]","Ember [bot]",
        "Stone [bot]","Steel [bot]","Copper [bot]","Cobalt [bot]","Silver [bot]","Gold [bot]","Obsidian [bot]","Granite [bot]",
        "Cinder [bot]","Frost [bot]","Blizzard [bot]","Monsoon [bot]","Cyclone [bot]","Quake [bot]","Aftershock [bot]","Tremor [bot]",
        "Tundra [bot]","Savanna [bot]","Canyon [bot]","Harbor [bot]","Outpost [bot]","Bastion [bot]","Citadel [bot]","Frontier [bot]",
        "Rook [bot]","Bishop [bot]","Knight [bot]","Ace [bot]","Dealer [bot]","Gambit [bot]","Charger [bot]","Rocket [bot]",
        "Riptide [bot]","Seabird [bot]","Voyager [bot]","Navigator [bot]","Trail [bot]","Pathfinder [bot]","Overwatch [bot]","Wildfire [bot]",
    ];

    let cursor = 0;

    export function initBotNames(): void {
        for (let i = BOT_NAME_POOL.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = BOT_NAME_POOL[i];
            BOT_NAME_POOL[i] = BOT_NAME_POOL[j];
            BOT_NAME_POOL[j] = tmp;
        }
        cursor = 0;
    }

    export function nextBotName(): string {
        if (BOT_NAME_POOL.length === 0) {
            return "Bot";
        }
        const name = BOT_NAME_POOL[cursor % BOT_NAME_POOL.length];
        cursor++;
        return `${name}`;
    }
}
