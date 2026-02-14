/// <reference path="../config/ConquestConfig.ts" />

/**
 * AILoadoutModule - Equip AI with combat-effective loadouts
 * 
 * CRITICAL: AIBattlefieldBehavior does NOT equip gadgets automatically.
 * AI spawn with default loadouts that lack anti-vehicle weapons.
 * This module assigns class-appropriate gadgets to make AI effective.
 * 
 * Class Distribution (set in AISpawnModule):
 * - 30% Assault: RPG or SLM (20% get SLM) + Medkit + Frag
 * - 25% Engineer: Repair Tool + AT Mine + Frag
 * - 25% Support: Ammo Crate + C4 + Smoke
 * - 20% Recon: Spawn Beacon + Motion Sensor + Smoke
 */

namespace ConquestV8 {
    
    /**
     * Equip AI with class-appropriate gadgets and enable gadget usage.
     * Called on every AI deploy via OnPlayerDeployed.
     */
    export function equipAILoadout(bot: mod.Player): void {
        try {
            // Detect soldier class and equip appropriate loadout
            const soldierClass = getSoldierClass(bot);
            
            switch (soldierClass) {
                case "Assault":
                    equipAssaultLoadout(bot);
                    break;
                case "Engineer":
                    equipEngineerLoadout(bot);
                    break;
                case "Support":
                    equipSupportLoadout(bot);
                    break;
                case "Recon":
                    equipReconLoadout(bot);
                    break;
                default:
                    equipAssaultLoadout(bot); // Fallback
            }
            
            // Enable gadget usage with optimal settings
            // applyUsageCriteria: true - AI will use gadgets intelligently
            // applyCoolDownAfterUse: true - Prevents spam
            // applyInaccuracy: false - Let AI be accurate with gadgets
            mod.AIGadgetSettings(bot, true, true, false);
            
            log(`[AILoadout] Equipped ${soldierClass} loadout for bot ${mod.GetObjId(bot)}`);
            
        } catch (e) {
            log(`[AILoadout] Failed to equip bot ${mod.GetObjId(bot)}: ${e}`);
        }
    }
    
    function getSoldierClass(bot: mod.Player): string {
        try {
            // Class distribution: 30% Assault, 25% Engineer, 25% Support, 20% Recon
            const roll = Math.random();
            if (roll < 0.30) return "Assault";
            if (roll < 0.55) return "Engineer";
            if (roll < 0.80) return "Support";
            return "Recon";
        } catch (e) {
            return "Assault";
        }
    }
    
    function equipAssaultLoadout(bot: mod.Player): void {
        // Assault: Anti-vehicle + healing (Adrenaline Injector is the medic gadget)
        // 20% of Assault get SLM (guided), 80% get RPG (unguided)
        const useSLM = Math.random() < 0.20;
        if (useSLM) {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Aim_Guided, mod.InventorySlots.GadgetOne);
        } else {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Unguided_Rocket, mod.InventorySlots.GadgetOne);
        }
        mod.AddEquipment(bot, mod.Gadgets.Class_Adrenaline_Injector, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    
    function equipEngineerLoadout(bot: mod.Player): void {
        // Engineer: Repair + AT mines
        mod.AddEquipment(bot, mod.Gadgets.Class_Repair_Tool, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Anti_Vehicle_Mine, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    
    function equipSupportLoadout(bot: mod.Player): void {
        // Support: Supply + AA launcher for air defense + Smoke
        mod.AddEquipment(bot, mod.Gadgets.Class_Supply_Bag, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Launcher_Air_Defense, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
    
    function equipReconLoadout(bot: mod.Player): void {
        // Recon: Deploy beacon + C4 for vehicle destruction + Smoke
        mod.AddEquipment(bot, mod.Gadgets.Deployable_Deploy_Beacon, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Demolition_Charge, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
    
}
