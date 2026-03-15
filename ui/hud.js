(function () {
    const SF = window.ShadowFight;
    const HealthBar = SF.ui.HealthBar;
    const ComboCounter = SF.ui.ComboCounter;

    class HUD {
        constructor() {
            this.playerBar = new HealthBar("left");
            this.enemyBar = new HealthBar("right");
            this.comboCounter = new ComboCounter();
        }

        update(state, dt) {
            if (state.player) {
                this.playerBar.update(state.player, dt);
            }
            if (state.opponent) {
                this.enemyBar.update(state.opponent, dt);
            }
            this.comboCounter.update(dt);
        }

        draw(ctx, state) {
            if (!state.player || !state.opponent) {
                return;
            }

            const width = ctx.canvas.width;
            this.playerBar.draw(ctx, state.player, 60, 46, 360);
            this.enemyBar.draw(ctx, state.opponent, width - 60, 46, 360);
            this.comboCounter.draw(ctx, width);

            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255, 239, 216, 0.96)";
            ctx.font = '700 24px Georgia, "Times New Roman", serif';
            ctx.fillText(`Round ${state.round}`, width / 2, 46);
            ctx.font = '18px Georgia, "Times New Roman", serif';
            ctx.fillText(
                `Level ${state.progression.level}  XP ${state.progression.xp}/${state.progression.xpToNext}`,
                width / 2,
                74
            );
            ctx.fillText(`Weapon: ${state.player.weapon.name}`, width / 2, 100);

            if (state.isMultiplayer) {
                ctx.fillStyle = "rgba(255, 226, 181, 0.85)";
                ctx.fillText("Multiplayer Sync", width / 2, 126);
            } else if (state.opponent.isBoss) {
                ctx.fillStyle = "rgba(255, 176, 150, 0.9)";
                ctx.fillText(state.opponent.rage ? "Boss Rage Phase" : "Boss Fight", width / 2, 126);
            }
            ctx.restore();
        }
    }

    SF.ui.HUD = HUD;
})();
