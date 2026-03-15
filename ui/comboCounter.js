(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;

    class ComboCounter {
        constructor() {
            this.label = "";
            this.count = 0;
            this.life = 0;
        }

        register(label, count) {
            this.label = label;
            this.count = count;
            this.life = 1;
        }

        update(dt) {
            this.life = Math.max(0, this.life - dt * 0.6);
        }

        draw(ctx, width) {
            if (this.life <= 0 || this.count < 2) {
                return;
            }

            const alpha = clamp(this.life, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(255, 230, 190, 0.96)";
            ctx.font = '700 44px Georgia, "Times New Roman", serif';
            ctx.fillText(`${this.count} Hit Combo`, width / 2, 110);
            ctx.font = '18px Georgia, "Times New Roman", serif';
            ctx.fillText(this.label, width / 2, 136);
            ctx.restore();
        }
    }

    SF.ui.ComboCounter = ComboCounter;
})();
