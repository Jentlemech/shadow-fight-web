(function () {
    const SF = window.ShadowFight;
    const { rand } = SF.utils;

    class ParticleSystem {
        constructor() {
            this.items = [];
        }

        normalizeColor(input, fallbackAlpha) {
            if (!input.startsWith("rgba")) {
                return {
                    color: input,
                    alpha: fallbackAlpha
                };
            }

            const match = input.match(/rgba\(([^)]+)\)/);
            if (!match) {
                return {
                    color: input,
                    alpha: fallbackAlpha
                };
            }

            const parts = match[1].split(",").map((part) => part.trim());
            return {
                color: `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 1)`,
                alpha: Number(parts[3] || fallbackAlpha)
            };
        }

        spawnSpark(x, y, color, count, speed) {
            const normalized = this.normalizeColor(color, 0.9);
            for (let index = 0; index < count; index += 1) {
                const angle = rand(-Math.PI, Math.PI);
                const velocity = rand(speed * 0.55, speed);
                this.items.push({
                    x,
                    y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    life: rand(0.14, 0.24),
                    maxLife: rand(0.14, 0.24),
                    radius: rand(2, 4),
                    color: normalized.color,
                    alpha: normalized.alpha
                });
            }
        }

        spawnDust(x, y, count) {
            for (let index = 0; index < count; index += 1) {
                this.items.push({
                    x: x + rand(-18, 18),
                    y: y + rand(-4, 4),
                    vx: rand(-50, 50),
                    vy: rand(-90, -30),
                    life: rand(0.26, 0.42),
                    maxLife: rand(0.26, 0.42),
                    radius: rand(8, 15),
                    color: "rgba(239, 202, 160, 1)",
                    alpha: 0.28
                });
            }
        }

        update(dt) {
            this.items = this.items.filter((particle) => {
                particle.life -= dt;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 220 * dt;
                return particle.life > 0;
            });
        }

        render(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (const particle of this.items) {
                const alpha = particle.life / particle.maxLife;
                const finalAlpha = Math.max(0, alpha * particle.alpha);
                ctx.fillStyle = particle.color.replace(", 1)", `, ${finalAlpha})`);
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * (0.6 + alpha), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    SF.engine.ParticleSystem = ParticleSystem;
})();
