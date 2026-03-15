(function () {
    const SF = window.ShadowFight;
    const { rectsIntersect, clamp } = SF.utils;

    class CollisionSystem {
        overlap(a, b) {
            return rectsIntersect(a, b);
        }

        resolveFighterOverlap(left, right, world) {
            const bodyA = left.getBodyBox();
            const bodyB = right.getBodyBox();

            if (!this.overlap(bodyA, bodyB)) {
                return;
            }

            const centerDelta = bodyB.x + bodyB.w / 2 - (bodyA.x + bodyA.w / 2);
            const direction = centerDelta >= 0 ? 1 : -1;
            const overlap = Math.min(bodyA.x + bodyA.w - bodyB.x, bodyB.x + bodyB.w - bodyA.x);
            const push = overlap / 2;

            left.x = clamp(left.x - push * direction, world.leftBound, world.rightBound);
            right.x = clamp(right.x + push * direction, world.leftBound, world.rightBound);
        }

        attackHits(attacker, defender) {
            const hitbox = attacker.getAttackBox();
            if (!hitbox) {
                return false;
            }
            return this.overlap(hitbox, defender.getHurtBox());
        }
    }

    SF.engine.CollisionSystem = CollisionSystem;
})();
