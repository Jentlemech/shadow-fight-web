(function () {
    const SF = window.ShadowFight;
    const { lerp, clamp } = SF.utils;

    class HealthBar {
        constructor(side) {
            this.side = side;
            this.displayHealth = 1;
            this.displayStamina = 1;
            this.damageLag = 1;
        }

        update(fighter, dt) {
            const healthRatio = fighter.health / fighter.stats.maxHealth;
            const staminaRatio = fighter.stamina / fighter.stats.maxStamina;
            this.displayHealth = lerp(this.displayHealth, healthRatio, 1 - Math.pow(0.0001, dt));
            this.displayStamina = lerp(this.displayStamina, staminaRatio, 1 - Math.pow(0.0001, dt * 1.2));
            this.damageLag = lerp(this.damageLag, healthRatio, 1 - Math.pow(0.0001, dt * 0.45));
        }

        draw(ctx, fighter, x, y, width) {
            const alignRight = this.side === "right";
            const barX = alignRight ? x - width : x;
            const healthWidth = width * clamp(this.displayHealth, 0, 1);
            const damageWidth = width * clamp(this.damageLag, 0, 1);
            const staminaWidth = width * clamp(this.displayStamina, 0, 1);

            ctx.save();
            ctx.textAlign = alignRight ? "right" : "left";
            ctx.fillStyle = "rgba(255, 240, 214, 0.92)";
            ctx.font = '700 20px Georgia, "Times New Roman", serif';
            ctx.fillText(fighter.name, x, y - 14);

            ctx.fillStyle = "rgba(18, 12, 9, 0.84)";
            ctx.fillRect(barX, y, width, 26);
            ctx.fillStyle = "rgba(255, 232, 194, 0.18)";
            ctx.fillRect(barX, y, damageWidth, 26);
            ctx.fillStyle = fighter.isBoss ? "#de4c35" : "#efb55b";
            ctx.fillRect(barX, y, healthWidth, 26);

            ctx.fillStyle = "rgba(18, 12, 9, 0.84)";
            ctx.fillRect(barX, y + 32, width, 12);
            ctx.fillStyle = fighter.isBoss ? "#f1927f" : "#9cd4e7";
            ctx.fillRect(barX, y + 32, staminaWidth, 12);
            ctx.restore();
        }
    }

    SF.ui.HealthBar = HealthBar;
})();
