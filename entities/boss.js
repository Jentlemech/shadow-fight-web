(function () {
    const SF = window.ShadowFight;
    const Fighter = SF.entities.Fighter;
    const RPGData = SF.entities.RPGData;

    const BOSS_ARCHETYPES = {
        samurai_warrior: {
            characterId: "knight",
            stats: { maxHealth: 320, maxStamina: 160, maxMana: 90, moveSpeed: 274, jumpStrength: 880, damage: 1.32, defense: 10, attackRange: 12, magicPower: 0.84, staminaRecovery: 24, manaRecovery: 8 },
            specialStyle: "counter"
        },
        fire_monk: {
            characterId: "monk",
            stats: { maxHealth: 300, maxStamina: 146, maxMana: 160, moveSpeed: 298, jumpStrength: 900, damage: 1.24, defense: 7, attackRange: 14, magicPower: 1.24, staminaRecovery: 22, manaRecovery: 16 },
            specialStyle: "caster"
        },
        shadow_assassin: {
            characterId: "ninja",
            stats: { maxHealth: 288, maxStamina: 174, maxMana: 118, moveSpeed: 354, jumpStrength: 948, damage: 1.28, defense: 6, attackRange: 18, magicPower: 1.06, staminaRecovery: 26, manaRecovery: 12 },
            specialStyle: "ambush"
        },
        war_general: {
            characterId: "warrior",
            stats: { maxHealth: 360, maxStamina: 170, maxMana: 100, moveSpeed: 282, jumpStrength: 890, damage: 1.38, defense: 12, attackRange: 10, magicPower: 0.92, staminaRecovery: 24, manaRecovery: 10 },
            specialStyle: "bruiser"
        },
        shadow_emperor: {
            characterId: "monk",
            stats: { maxHealth: 430, maxStamina: 180, maxMana: 210, moveSpeed: 320, jumpStrength: 930, damage: 1.48, defense: 13, attackRange: 20, magicPower: 1.34, staminaRecovery: 26, manaRecovery: 18 },
            specialStyle: "emperor"
        }
    };

    class Boss extends Fighter {
        constructor(options) {
            const bossData = options.bossData || RPGData.BOSSES[0];
            const profile = BOSS_ARCHETYPES[bossData.id] || BOSS_ARCHETYPES.samurai_warrior;
            super(Object.assign({
                name: bossData.name,
                isBoss: true,
                characterId: profile.characterId,
                color: "#f0d38c",
                baseStats: profile.stats,
                loadout: {
                    helmet: bossData.unlocks[0] || "steel_visor",
                    armor: bossData.id === "fire_monk" ? "ember_robe" : "warden_plate",
                    boots: bossData.id === "shadow_assassin" ? "silent_step" : "warden_greaves",
                    gloves: bossData.id === "shadow_emperor" ? "ember_gloves" : "iron_gauntlets",
                    weapon: bossData.weapon,
                    ranged: bossData.ranged,
                    magic: bossData.magic
                }
            }, options));

            this.bossData = bossData;
            this.specialStyle = profile.specialStyle;
            this.specialCooldown = 0.8;
        }

        updateRagePhase(dt) {
            this.specialCooldown = Math.max(0, this.specialCooldown - dt);

            if (!this.rage && this.health <= this.stats.maxHealth * 0.35) {
                this.rage = true;
                this.stats.moveSpeed += 34;
                this.stats.damage *= 1.16;
                this.stats.magicPower *= 1.18;
                this.stats.staminaRecovery += 8;
                this.stats.manaRecovery += 6;
            }
        }
    }

    SF.entities.Boss = Boss;
})();
