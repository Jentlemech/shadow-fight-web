(function () {
    const SF = window.ShadowFight;

    class Projectile {
        constructor(config) {
            this.id = config.id || `${config.ownerId}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
            this.ownerId = config.ownerId;
            this.kind = config.kind;
            this.visual = config.visual || config.kind;
            this.color = config.color || "#ffffff";
            this.x = config.x;
            this.y = config.y;
            this.vx = config.vx || 0;
            this.vy = config.vy || 0;
            this.width = config.width || 24;
            this.height = config.height || 24;
            this.radius = config.radius || 10;
            this.life = config.life || 0.8;
            this.maxLife = this.life;
            this.damage = config.damage || 0;
            this.knockbackX = config.knockbackX || 0;
            this.knockbackY = config.knockbackY || 0;
            this.pierce = Boolean(config.pierce);
            this.ownerFacing = config.ownerFacing || 1;
            this.meta = Object.assign({}, config.meta);
            this.expired = false;
        }

        update(dt) {
            this.life -= dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.meta.gravity) {
                this.vy += this.meta.gravity * dt;
            }
            if (this.life <= 0) {
                this.expired = true;
            }
        }

        getHitBox() {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                w: this.width,
                h: this.height
            };
        }
    }

    SF.entities.Projectile = Projectile;
})();
