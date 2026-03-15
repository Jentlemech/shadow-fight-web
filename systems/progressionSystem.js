(function () {
    const SF = window.ShadowFight;
    const RPGData = SF.entities.RPGData;

    const LEVEL_UNLOCKS = {
        2: ["wind_spear"],
        3: ["throwing_knives"],
        4: ["guardian_axe", "energy_shield"],
        5: ["arcane_staff", "fire_crown"],
        6: ["lightning_strike", "ember_robe"],
        7: ["inferno_treads", "ember_gloves"],
        8: ["emperor_blade"],
        9: ["fireball", "dash_teleport"]
    };

    class ProgressionSystem {
        constructor() {
            this.storageKey = "shadow-fight-web-rpg-progression";
            this.level = 1;
            this.xp = 0;
            this.xpToNext = 120;
            this.selectedCharacterId = "warrior";
            this.selectedCharacterName = "Warrior";
            this.selectedMode = "story";
            this.unlockedItems = [];
            this.loadoutsByCharacter = {};
            this.defeatedBosses = [];
            this.load();
            this.ensureDefaults();
        }

        defaultUnlockedItems() {
            const unlocked = new Set();
            for (const character of Object.values(RPGData.CHARACTERS)) {
                for (const itemId of Object.values(character.starterLoadout)) {
                    unlocked.add(itemId);
                }
            }
            return Array.from(unlocked);
        }

        defaultLoadouts() {
            const loadouts = {};
            for (const character of Object.values(RPGData.CHARACTERS)) {
                loadouts[character.id] = Object.assign({}, character.starterLoadout);
            }
            return loadouts;
        }

        ensureDefaults() {
            if (!this.unlockedItems.length) {
                this.unlockedItems = this.defaultUnlockedItems();
            }
            if (!Object.keys(this.loadoutsByCharacter).length) {
                this.loadoutsByCharacter = this.defaultLoadouts();
            }

            for (const character of Object.values(RPGData.CHARACTERS)) {
                if (!this.loadoutsByCharacter[character.id]) {
                    this.loadoutsByCharacter[character.id] = Object.assign({}, character.starterLoadout);
                }
                for (const itemId of Object.values(character.starterLoadout)) {
                    if (!this.unlockedItems.includes(itemId)) {
                        this.unlockedItems.push(itemId);
                    }
                }
            }
            const safeId = this.selectedCharacterId in RPGData.CHARACTERS ? this.selectedCharacterId : "warrior";
            this.selectedCharacterId = safeId;
            this.selectedCharacterName = RPGData.CHARACTERS[safeId].name;
        }

        load() {
            try {
                const raw = window.localStorage.getItem(this.storageKey);
                if (!raw) {
                    return;
                }
                const parsed = JSON.parse(raw);
                this.level = parsed.level || 1;
                this.xp = parsed.xp || 0;
                this.xpToNext = parsed.xpToNext || 120;
                this.selectedCharacterId = parsed.selectedCharacterId || "warrior";
                this.selectedMode = parsed.selectedMode || "story";
                this.unlockedItems = parsed.unlockedItems || [];
                this.loadoutsByCharacter = parsed.loadoutsByCharacter || {};
                this.defeatedBosses = parsed.defeatedBosses || [];
            } catch (error) {
                // Local storage is optional when running from index.html.
            }
        }

        save() {
            try {
                window.localStorage.setItem(this.storageKey, JSON.stringify({
                    level: this.level,
                    xp: this.xp,
                    xpToNext: this.xpToNext,
                    selectedCharacterId: this.selectedCharacterId,
                    selectedMode: this.selectedMode,
                    unlockedItems: this.unlockedItems,
                    loadoutsByCharacter: this.loadoutsByCharacter,
                    defeatedBosses: this.defeatedBosses
                }));
            } catch (error) {
                // Ignore storage failures.
            }
        }

        setSelectedMode(mode) {
            this.selectedMode = mode;
            this.save();
        }

        setSelectedCharacter(characterId) {
            this.selectedCharacterId = characterId in RPGData.CHARACTERS ? characterId : "warrior";
            this.selectedCharacterName = RPGData.CHARACTERS[this.selectedCharacterId].name;
            this.ensureDefaults();
            this.save();
        }

        getCharacter(characterId) {
            return RPGData.CHARACTERS[characterId || this.selectedCharacterId] || RPGData.CHARACTERS.warrior;
        }

        getCurrentLoadout(characterId) {
            const id = characterId || this.selectedCharacterId;
            return Object.assign({}, this.loadoutsByCharacter[id] || this.getCharacter(id).starterLoadout);
        }

        getEquippedItemId(slot) {
            return this.getCurrentLoadout()[slot];
        }

        getInventoryForSlot(slot) {
            return this.unlockedItems
                .map((itemId) => RPGData.getItem(itemId))
                .filter((item) => item && item.slot === slot)
                .sort((left, right) => left.name.localeCompare(right.name));
        }

        unlockItems(itemIds) {
            const unlocked = [];
            for (const itemId of itemIds) {
                if (!itemId || this.unlockedItems.includes(itemId)) {
                    continue;
                }
                this.unlockedItems.push(itemId);
                const item = RPGData.getItem(itemId);
                unlocked.push(item ? item.name : itemId);
            }
            return unlocked;
        }

        equip(slot, itemId) {
            const item = RPGData.getItem(itemId);
            if (!item || item.slot !== slot) {
                return false;
            }
            if (!this.unlockedItems.includes(itemId)) {
                return false;
            }
            this.loadoutsByCharacter[this.selectedCharacterId][slot] = itemId;
            this.save();
            return true;
        }

        getSetBonus(loadout) {
            const counts = {};
            for (const slot of ["helmet", "armor", "boots", "gloves"]) {
                const item = RPGData.getItem(loadout[slot]);
                if (!item || !item.setId) {
                    continue;
                }
                counts[item.setId] = (counts[item.setId] || 0) + 1;
            }

            const bonuses = {};
            for (const [setId, count] of Object.entries(counts)) {
                const setConfig = RPGData.SET_BONUSES[setId];
                if (!setConfig || count < setConfig.pieces) {
                    continue;
                }
                this.applyBonusMap(bonuses, setConfig.bonuses);
            }
            return bonuses;
        }

        applyBonusMap(target, bonusMap) {
            for (const [key, value] of Object.entries(bonusMap || {})) {
                target[key] = (target[key] || 0) + value;
            }
        }

        getTotalBonusMap(loadout) {
            const bonusMap = {};
            for (const itemId of Object.values(loadout)) {
                const item = RPGData.getItem(itemId);
                if (!item) {
                    continue;
                }
                this.applyBonusMap(bonusMap, item.bonuses);
            }
            this.applyBonusMap(bonusMap, this.getSetBonus(loadout));
            return bonusMap;
        }

        convertBonuses(baseStats, bonusMap) {
            const stats = Object.assign({}, baseStats);
            stats.maxHealth += (bonusMap.maxHealth || 0);
            stats.maxStamina += (bonusMap.maxStamina || 0) + (bonusMap.stamina || 0);
            stats.maxMana += (bonusMap.maxMana || 0) + (bonusMap.mana || 0);
            stats.moveSpeed += (bonusMap.moveSpeed || 0) + (bonusMap.speed || 0);
            stats.jumpStrength += (bonusMap.jumpStrength || 0);
            stats.damage += (bonusMap.damage || 0) * 0.02;
            stats.defense += (bonusMap.defense || 0);
            stats.attackRange += (bonusMap.attackRange || 0);
            stats.magicPower += (bonusMap.magicPower || 0) * 0.02;
            stats.staminaRecovery += (bonusMap.staminaRecovery || 0);
            stats.manaRecovery += (bonusMap.manaRecovery || 0);
            return stats;
        }

        getLeveledBaseStats(characterId) {
            const character = this.getCharacter(characterId);
            const stats = Object.assign({}, character.baseStats);
            stats.maxHealth += (this.level - 1) * 14;
            stats.maxStamina += (this.level - 1) * 8;
            stats.maxMana += (this.level - 1) * 10;
            stats.moveSpeed += (this.level - 1) * 6;
            stats.jumpStrength += (this.level - 1) * 4;
            stats.damage += (this.level - 1) * 0.04;
            stats.defense += (this.level - 1) * 0.8;
            stats.magicPower += (this.level - 1) * 0.05;
            stats.staminaRecovery += (this.level - 1) * 0.8;
            stats.manaRecovery += (this.level - 1) * 0.9;
            return stats;
        }

        computeStats(characterId, loadout) {
            const leveled = this.getLeveledBaseStats(characterId);
            return this.convertBonuses(leveled, this.getTotalBonusMap(loadout));
        }

        getPlayerStats() {
            return this.computeStats(this.selectedCharacterId, this.getCurrentLoadout());
        }

        getPlayerStatsWithPreview(slot, itemId) {
            const loadout = this.getCurrentLoadout();
            loadout[slot] = itemId;
            return this.computeStats(this.selectedCharacterId, loadout);
        }

        getCollections() {
            return {
                weapon: this.getInventoryForSlot("weapon").map((item) => item.id),
                ranged: this.getInventoryForSlot("ranged").map((item) => item.id),
                magic: this.getInventoryForSlot("magic").map((item) => item.id)
            };
        }

        applyToFighter(fighter, options) {
            const characterId = options && options.characterId ? options.characterId : (fighter.characterId || this.selectedCharacterId);
            const loadout = options && options.loadout ? Object.assign({}, options.loadout) : this.getCurrentLoadout(characterId);
            fighter.characterId = characterId;
            fighter.character = this.getCharacter(characterId);
            fighter.color = fighter.character.color;
            fighter.loadout = loadout;
            fighter.baseStats = options && options.baseStats ? Object.assign({}, options.baseStats) : this.getLeveledBaseStats(characterId);
            fighter.setCollections(options && options.collections ? options.collections : this.getCollections());
            fighter.refreshEquipment();
            fighter.applyStats(options && options.finalStats ? options.finalStats : this.computeStats(characterId, loadout));
        }

        getEquippedSummary() {
            const loadout = this.getCurrentLoadout();
            return Object.entries(loadout).map(([slot, itemId]) => {
                const item = RPGData.getItem(itemId);
                const label = slot.charAt(0).toUpperCase() + slot.slice(1);
                return `${label}: ${item ? item.name : "-"}`;
            });
        }

        awardEncounter(config) {
            const xpGain = config.isBoss
                ? 180 + (config.stageIndex || 0) * 45
                : 70 + (config.stageIndex || 0) * 20 + (config.round || 1) * 10;
            const unlocked = [];

            this.xp += xpGain;
            if (config.isBoss && config.bossData) {
                unlocked.push(...this.unlockItems(config.bossData.unlocks || []));
                if (!this.defeatedBosses.includes(config.bossData.id)) {
                    this.defeatedBosses.push(config.bossData.id);
                }
            }

            while (this.xp >= this.xpToNext) {
                this.xp -= this.xpToNext;
                this.level += 1;
                this.xpToNext = Math.round(this.xpToNext * 1.18);
                unlocked.push(...this.unlockItems(LEVEL_UNLOCKS[this.level] || []));
            }

            this.save();
            return {
                xpGain,
                unlocked,
                level: this.level
            };
        }
    }

    SF.systems.ProgressionSystem = ProgressionSystem;
})();
