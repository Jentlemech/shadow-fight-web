(function () {
    const SF = window.ShadowFight;
    const Fighter = SF.entities.Fighter;

    class Boss extends Fighter {
        constructor(options) {
            super(Object.assign({
                name: "Dojo Master",
                isBoss: true,
                maxHealth: 260,
                maxStamina: 160,
                moveSpeed: 248,
                jumpStrength: 860,
                damage: 1.35,
                staminaRecovery: 24,
                unlockedWeapons: ["staff", "nunchaku", "sword"]
            }, options));
            this.weaponIndex = 1;
            this.weapon = SF.entities.Weapon.create("nunchaku");
        }

        updateRagePhase() {
            if (!this.rage && this.health <= this.stats.maxHealth * 0.35) {
                this.rage = true;
                this.stats.moveSpeed += 34;
                this.stats.damage *= 1.18;
                this.stats.staminaRecovery += 8;
            }
        }
    }

    SF.entities.Boss = Boss;
})();
