(function () {
    const SF = window.ShadowFight;

    class ProgressionSystem {
        constructor() {
            this.storageKey = "shadow-fight-web-progression";
            this.level = 1;
            this.xp = 0;
            this.xpToNext = 100;
            this.unlockedWeapons = ["sword"];
            this.load();
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
                this.xpToNext = parsed.xpToNext || 100;
                this.unlockedWeapons = parsed.unlockedWeapons || ["sword"];
            } catch (error) {
                // Local storage is optional for direct browser-open play.
            }
        }

        save() {
            try {
                window.localStorage.setItem(this.storageKey, JSON.stringify({
                    level: this.level,
                    xp: this.xp,
                    xpToNext: this.xpToNext,
                    unlockedWeapons: this.unlockedWeapons
                }));
            } catch (error) {
                // Ignore storage failures.
            }
        }

        getPlayerStats() {
            return {
                maxHealth: 120 + (this.level - 1) * 14,
                maxStamina: 100 + (this.level - 1) * 9,
                moveSpeed: 300 + (this.level - 1) * 7,
                jumpStrength: 900 + (this.level - 1) * 6,
                damage: 1 + (this.level - 1) * 0.06,
                staminaRecovery: 18 + (this.level - 1) * 1.2
            };
        }

        applyToFighter(fighter) {
            fighter.applyStats(this.getPlayerStats());
            fighter.unlockWeapons(this.unlockedWeapons);
        }

        awardVictory(round, isBoss) {
            const xpGain = isBoss ? 160 : 55 + round * 18;
            const unlocked = [];
            this.xp += xpGain;

            while (this.xp >= this.xpToNext) {
                this.xp -= this.xpToNext;
                this.level += 1;
                this.xpToNext = Math.round(this.xpToNext * 1.18);
                if (this.level === 2 && !this.unlockedWeapons.includes("staff")) {
                    this.unlockedWeapons.push("staff");
                    unlocked.push("Staff");
                }
                if (this.level === 4 && !this.unlockedWeapons.includes("nunchaku")) {
                    this.unlockedWeapons.push("nunchaku");
                    unlocked.push("Nunchaku");
                }
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
