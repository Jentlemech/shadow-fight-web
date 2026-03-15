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

        drawXpBar(ctx, progression, width, bottomY) {
            const ratio = progression.xpToNext > 0 ? progression.xp / progression.xpToNext : 0;
            const barWidth = width - 120;
            const barX = 60;
            ctx.save();
            ctx.fillStyle = "rgba(18, 12, 9, 0.84)";
            ctx.fillRect(barX, bottomY, barWidth, 12);
            ctx.fillStyle = "#9dd6ff";
            ctx.fillRect(barX, bottomY, barWidth * ratio, 12);
            ctx.fillStyle = "rgba(255, 239, 216, 0.9)";
            ctx.textAlign = "left";
            ctx.font = '16px Georgia, "Times New Roman", serif';
            ctx.fillText(`XP ${progression.xp}/${progression.xpToNext}`, barX, bottomY - 6);
            ctx.restore();
        }

        draw(ctx, state) {
            if (!state.player || !state.opponent) {
                return;
            }

            const width = ctx.canvas.width;
            const stageName = state.stage ? state.stage.name : "Arena";
            const modeLabel = state.modeLabel || "Story";

            this.playerBar.draw(ctx, state.player, 60, 42, 360);
            this.enemyBar.draw(ctx, state.opponent, width - 60, 42, 360);
            this.comboCounter.draw(ctx, width);

            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255, 239, 216, 0.96)";
            ctx.font = '700 24px Georgia, "Times New Roman", serif';
            ctx.fillText(`Round ${state.round}`, width / 2, 42);
            ctx.font = '18px Georgia, "Times New Roman", serif';
            ctx.fillText(`${modeLabel} • ${stageName}`, width / 2, 68);
            ctx.fillText(`Level ${state.progression.level} • ${state.progression.selectedCharacterName}`, width / 2, 94);
            ctx.fillText(
                `Weapon ${state.player.weapon ? state.player.weapon.name : "-"} • Ranged ${state.player.rangedWeapon ? state.player.rangedWeapon.name : "-"} • Magic ${state.player.magicAbility ? state.player.magicAbility.name : "-"}`,
                width / 2,
                120
            );

            if (state.isMultiplayer) {
                ctx.fillStyle = "rgba(255, 226, 181, 0.85)";
                ctx.fillText("Multiplayer Duel Sync", width / 2, 146);
            } else if (state.opponent.isBoss) {
                ctx.fillStyle = "rgba(255, 176, 150, 0.9)";
                ctx.fillText(state.opponent.rage ? "Boss Rage Phase" : "Boss Fight", width / 2, 146);
            }
            ctx.restore();

            this.drawXpBar(ctx, state.progression, width, ctx.canvas.height - 28);
        }
    }

    SF.ui.HUD = HUD;
})();
