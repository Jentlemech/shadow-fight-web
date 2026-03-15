(function () {
    const SF = window.ShadowFight;

    const CHARACTERS = {
        warrior: {
            id: "warrior",
            name: "Warrior",
            color: "#d6b07e",
            baseStats: {
                maxHealth: 150,
                maxStamina: 102,
                maxMana: 70,
                moveSpeed: 286,
                jumpStrength: 900,
                damage: 1.08,
                defense: 8,
                attackRange: 0,
                magicPower: 0.86,
                staminaRecovery: 18,
                manaRecovery: 8
            },
            starterLoadout: {
                helmet: "iron_kabuto",
                armor: "dojo_gi",
                boots: "strider_boots",
                gloves: "brawler_gloves",
                weapon: "bronze_sword",
                ranged: "hunter_bow",
                magic: "fireball"
            }
        },
        ninja: {
            id: "ninja",
            name: "Ninja",
            color: "#86b7d8",
            baseStats: {
                maxHealth: 122,
                maxStamina: 116,
                maxMana: 92,
                moveSpeed: 336,
                jumpStrength: 936,
                damage: 1.04,
                defense: 4,
                attackRange: 8,
                magicPower: 0.98,
                staminaRecovery: 22,
                manaRecovery: 10
            },
            starterLoadout: {
                helmet: "shadow_mask",
                armor: "night_wrap",
                boots: "silent_step",
                gloves: "shadow_grips",
                weapon: "wind_spear",
                ranged: "throwing_knives",
                magic: "dash_teleport"
            }
        },
        monk: {
            id: "monk",
            name: "Monk",
            color: "#d8c788",
            baseStats: {
                maxHealth: 132,
                maxStamina: 110,
                maxMana: 124,
                moveSpeed: 304,
                jumpStrength: 920,
                damage: 0.98,
                defense: 5,
                attackRange: 6,
                magicPower: 1.16,
                staminaRecovery: 20,
                manaRecovery: 14
            },
            starterLoadout: {
                helmet: "monk_band",
                armor: "sun_cloak",
                boots: "temple_boots",
                gloves: "focus_wraps",
                weapon: "bronze_sword",
                ranged: "arcane_staff",
                magic: "lightning_strike"
            }
        },
        knight: {
            id: "knight",
            name: "Knight",
            color: "#c7d0df",
            baseStats: {
                maxHealth: 172,
                maxStamina: 96,
                maxMana: 82,
                moveSpeed: 274,
                jumpStrength: 886,
                damage: 1.12,
                defense: 10,
                attackRange: 2,
                magicPower: 0.84,
                staminaRecovery: 17,
                manaRecovery: 8
            },
            starterLoadout: {
                helmet: "steel_visor",
                armor: "warden_plate",
                boots: "warden_greaves",
                gloves: "iron_gauntlets",
                weapon: "guardian_axe",
                ranged: "hunter_bow",
                magic: "energy_shield"
            }
        }
    };

    const ITEMS = {
        iron_kabuto: { id: "iron_kabuto", slot: "helmet", name: "Iron Kabuto", setId: "dojo", bonuses: { defense: 3, maxHealth: 10 }, color: "#a6947c" },
        shadow_mask: { id: "shadow_mask", slot: "helmet", name: "Shadow Mask", setId: "shadow", bonuses: { speed: 12, magicPower: 4 }, color: "#6e7d90" },
        monk_band: { id: "monk_band", slot: "helmet", name: "Monk Band", setId: "temple", bonuses: { maxMana: 18, magicPower: 6 }, color: "#d7bb7a" },
        steel_visor: { id: "steel_visor", slot: "helmet", name: "Steel Visor", setId: "warden", bonuses: { defense: 5, maxHealth: 16 }, color: "#bfc8d2" },
        fire_crown: { id: "fire_crown", slot: "helmet", name: "Fire Crown", setId: "ember", bonuses: { magicPower: 10, damage: 5 }, color: "#d76641" },

        dojo_gi: { id: "dojo_gi", slot: "armor", name: "Dojo Gi", setId: "dojo", bonuses: { defense: 4, stamina: 8 }, color: "#7d4633" },
        night_wrap: { id: "night_wrap", slot: "armor", name: "Night Wrap", setId: "shadow", bonuses: { speed: 10, attackRange: 6 }, color: "#354454" },
        sun_cloak: { id: "sun_cloak", slot: "armor", name: "Sun Cloak", setId: "temple", bonuses: { maxMana: 20, magicPower: 8 }, color: "#c19044" },
        warden_plate: { id: "warden_plate", slot: "armor", name: "Warden Plate", setId: "warden", bonuses: { defense: 8, maxHealth: 20 }, color: "#7b8792" },
        ember_robe: { id: "ember_robe", slot: "armor", name: "Ember Robe", setId: "ember", bonuses: { magicPower: 12, defense: 3 }, color: "#91351e" },

        strider_boots: { id: "strider_boots", slot: "boots", name: "Strider Boots", setId: "dojo", bonuses: { speed: 6, stamina: 6 }, color: "#8e623d" },
        silent_step: { id: "silent_step", slot: "boots", name: "Silent Step", setId: "shadow", bonuses: { speed: 12, stamina: 10 }, color: "#405364" },
        temple_boots: { id: "temple_boots", slot: "boots", name: "Temple Boots", setId: "temple", bonuses: { maxMana: 10, speed: 4 }, color: "#a67630" },
        warden_greaves: { id: "warden_greaves", slot: "boots", name: "Warden Greaves", setId: "warden", bonuses: { defense: 4, maxHealth: 10 }, color: "#7b8ca3" },
        inferno_treads: { id: "inferno_treads", slot: "boots", name: "Inferno Treads", setId: "ember", bonuses: { speed: 8, magicPower: 6 }, color: "#b7481f" },

        brawler_gloves: { id: "brawler_gloves", slot: "gloves", name: "Brawler Gloves", setId: "dojo", bonuses: { damage: 4, stamina: 8 }, color: "#965a36" },
        shadow_grips: { id: "shadow_grips", slot: "gloves", name: "Shadow Grips", setId: "shadow", bonuses: { damage: 3, speed: 8 }, color: "#456175" },
        focus_wraps: { id: "focus_wraps", slot: "gloves", name: "Focus Wraps", setId: "temple", bonuses: { magicPower: 6, maxMana: 8 }, color: "#c79238" },
        iron_gauntlets: { id: "iron_gauntlets", slot: "gloves", name: "Iron Gauntlets", setId: "warden", bonuses: { defense: 4, damage: 3 }, color: "#9aa6b4" },
        ember_gloves: { id: "ember_gloves", slot: "gloves", name: "Ember Gloves", setId: "ember", bonuses: { damage: 5, magicPower: 6 }, color: "#cb5a30" },

        bronze_sword: { id: "bronze_sword", slot: "weapon", category: "sword", name: "Bronze Sword", damage: 18, speed: 0.42, range: 118, cooldown: 0.32, bonuses: { damage: 6, attackRange: 10 }, color: "#c6d1d8" },
        wind_spear: { id: "wind_spear", slot: "weapon", category: "spear", name: "Wind Spear", damage: 16, speed: 0.38, range: 150, cooldown: 0.36, bonuses: { speed: 10, attackRange: 24 }, color: "#b7d7dd" },
        guardian_axe: { id: "guardian_axe", slot: "weapon", category: "axe", name: "Guardian Axe", damage: 24, speed: 0.52, range: 108, cooldown: 0.42, bonuses: { damage: 10, defense: 3 }, color: "#c9c3bd" },
        emperor_blade: { id: "emperor_blade", slot: "weapon", category: "sword", name: "Emperor Blade", damage: 30, speed: 0.36, range: 146, cooldown: 0.28, bonuses: { damage: 12, magicPower: 6 }, color: "#f0d389" },

        hunter_bow: { id: "hunter_bow", slot: "ranged", category: "bow", name: "Hunter Bow", damage: 12, speed: 0.62, range: 320, cooldown: 0.7, bonuses: { attackRange: 24 }, color: "#b89e72" },
        throwing_knives: { id: "throwing_knives", slot: "ranged", category: "knives", name: "Throwing Knives", damage: 9, speed: 0.32, range: 230, cooldown: 0.38, bonuses: { speed: 10, damage: 4 }, color: "#91a8ba" },
        arcane_staff: { id: "arcane_staff", slot: "ranged", category: "staff", name: "Arcane Staff", damage: 14, speed: 0.54, range: 280, cooldown: 0.66, bonuses: { magicPower: 8, maxMana: 16 }, color: "#a19de2" },

        fireball: { id: "fireball", slot: "magic", category: "magic", name: "Fireball", manaCost: 22, cooldown: 1.1, power: 18, range: 360, bonuses: { magicPower: 8 }, color: "#ff8f5e" },
        lightning_strike: { id: "lightning_strike", slot: "magic", category: "magic", name: "Lightning Strike", manaCost: 28, cooldown: 1.4, power: 22, range: 260, bonuses: { magicPower: 10 }, color: "#badbff" },
        energy_shield: { id: "energy_shield", slot: "magic", category: "magic", name: "Energy Shield", manaCost: 26, cooldown: 1.8, power: 0, range: 0, bonuses: { defense: 5, maxMana: 10 }, color: "#a9f2ec" },
        dash_teleport: { id: "dash_teleport", slot: "magic", category: "magic", name: "Dash Teleport", manaCost: 18, cooldown: 1.2, power: 12, range: 140, bonuses: { speed: 12 }, color: "#9f96ff" }
    };

    const SET_BONUSES = {
        dojo: { pieces: 3, bonuses: { damage: 4, defense: 3 } },
        shadow: { pieces: 3, bonuses: { speed: 12, attackRange: 10 } },
        temple: { pieces: 3, bonuses: { magicPower: 12, maxMana: 22 } },
        warden: { pieces: 3, bonuses: { defense: 8, maxHealth: 18 } },
        ember: { pieces: 3, bonuses: { damage: 8, magicPower: 10 } }
    };

    const STAGES = [
        { id: "dojo", name: "Dojo", palette: { skyTop: "#e4b56b", skyMid: "#bf7f47", floorTop: "#7b4525", floorBottom: "#1b0c07", accent: "#f7d8a6" } },
        { id: "forest_temple", name: "Forest Temple", palette: { skyTop: "#89a95d", skyMid: "#435d2c", floorTop: "#5d4a2d", floorBottom: "#181108", accent: "#d6e59a" } },
        { id: "mountain_fortress", name: "Mountain Fortress", palette: { skyTop: "#93a2b4", skyMid: "#4f5c72", floorTop: "#65504a", floorBottom: "#1d1714", accent: "#d8e3f1" } },
        { id: "dark_castle", name: "Dark Castle", palette: { skyTop: "#5e4a74", skyMid: "#30213e", floorTop: "#4a3038", floorBottom: "#140d12", accent: "#e2b9f8" } },
        { id: "shadow_realm", name: "Shadow Realm", palette: { skyTop: "#2c2b47", skyMid: "#111522", floorTop: "#2e263f", floorBottom: "#08070f", accent: "#9bb2ff" } }
    ];

    const BOSSES = [
        { id: "samurai_warrior", name: "Samurai Warrior", stageId: "dojo", ranged: "hunter_bow", magic: "energy_shield", weapon: "bronze_sword", unlocks: ["steel_visor", "warden_greaves"] },
        { id: "fire_monk", name: "Fire Monk", stageId: "forest_temple", ranged: "arcane_staff", magic: "fireball", weapon: "wind_spear", unlocks: ["fire_crown", "ember_robe"] },
        { id: "shadow_assassin", name: "Shadow Assassin", stageId: "mountain_fortress", ranged: "throwing_knives", magic: "dash_teleport", weapon: "wind_spear", unlocks: ["shadow_grips", "silent_step"] },
        { id: "war_general", name: "War General", stageId: "dark_castle", ranged: "hunter_bow", magic: "energy_shield", weapon: "guardian_axe", unlocks: ["warden_plate", "iron_gauntlets"] },
        { id: "shadow_emperor", name: "Shadow Emperor", stageId: "shadow_realm", ranged: "arcane_staff", magic: "lightning_strike", weapon: "emperor_blade", unlocks: ["ember_gloves", "emperor_blade"] }
    ];

    const ENEMY_TYPES = {
        soldier: { id: "soldier", name: "Soldier", archetype: "melee", weapon: "bronze_sword", ranged: "hunter_bow", magic: "energy_shield" },
        archer: { id: "archer", name: "Archer", archetype: "ranged", weapon: "wind_spear", ranged: "hunter_bow", magic: "dash_teleport" },
        mage: { id: "mage", name: "Mage", archetype: "magic", weapon: "bronze_sword", ranged: "arcane_staff", magic: "lightning_strike" },
        elite_guard: { id: "elite_guard", name: "Elite Guard", archetype: "elite", weapon: "guardian_axe", ranged: "throwing_knives", magic: "energy_shield" }
    };

    function getItem(id) {
        return ITEMS[id];
    }

    function getItemsForSlot(slot) {
        return Object.values(ITEMS).filter((item) => item.slot === slot);
    }

    SF.entities.RPGData = {
        CHARACTERS,
        ITEMS,
        STAGES,
        BOSSES,
        ENEMY_TYPES,
        SET_BONUSES,
        getItem,
        getItemsForSlot
    };
})();
