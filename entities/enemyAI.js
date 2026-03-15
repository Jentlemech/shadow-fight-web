(function () {
    const SF = window.ShadowFight;

    class EnemyAI {
        constructor(options) {
            this.difficulty = options.difficulty || 1;
            this.isBoss = Boolean(options.isBoss);
            this.decisionTimer = 0;
            this.jumpTimer = 0;
            this.blockTimer = 0;
            this.dodgeTimer = 0;
            this.intent = {
                moveX: 0,
                crouch: false,
                jumpPressed: false,
                punchPressed: false,
                kickPressed: false,
                weaponPressed: false,
                switchPressed: false,
                pausePressed: false,
                dodgePressed: false
            };
        }

        think(fighter, target, round, dt) {
            this.decisionTimer -= dt;
            this.jumpTimer = Math.max(0, this.jumpTimer - dt);
            this.blockTimer = Math.max(0, this.blockTimer - dt);
            this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);

            const distance = target.x - fighter.x;
            const absDistance = Math.abs(distance);
            const direction = Math.sign(distance) || fighter.facing;
            const threat = Boolean(target.currentAttack && target.getAttackBox());
            const aggression = Math.min(1.8, 0.8 + round * 0.08 + this.difficulty * 0.12);

            const next = {
                moveX: 0,
                crouch: false,
                jumpPressed: false,
                punchPressed: false,
                kickPressed: false,
                weaponPressed: false,
                switchPressed: false,
                pausePressed: false,
                dodgePressed: false
            };

            if (this.decisionTimer <= 0) {
                if (threat && fighter.canBlock() && Math.random() < 0.22 + this.difficulty * 0.12) {
                    this.blockTimer = 0.24 + Math.random() * 0.16;
                } else if (threat && this.dodgeTimer <= 0 && Math.random() < 0.12 + this.difficulty * 0.08) {
                    next.dodgePressed = true;
                    next.moveX = -direction;
                    this.dodgeTimer = 0.8;
                } else if (absDistance > 170) {
                    next.moveX = direction;
                } else if (absDistance < 90) {
                    next.moveX = -direction * 0.55;
                }

                if (absDistance < 154 && fighter.attackCooldown <= 0 && fighter.stamina > 20) {
                    const attackRoll = Math.random();
                    if (this.isBoss && attackRoll > 0.68) {
                        next.weaponPressed = true;
                    } else if (attackRoll > 0.56 * aggression) {
                        next.kickPressed = true;
                    } else if (attackRoll > 0.28) {
                        next.weaponPressed = absDistance > 96;
                        next.punchPressed = !next.weaponPressed;
                    } else {
                        next.punchPressed = true;
                    }
                }

                if (fighter.grounded && this.jumpTimer <= 0 && Math.random() < 0.04 + this.difficulty * 0.03) {
                    next.jumpPressed = true;
                    this.jumpTimer = 1;
                }

                this.decisionTimer = 0.08 + Math.random() * 0.12;
            }

            if (this.blockTimer > 0) {
                next.moveX = -direction * 0.45;
                next.crouch = false;
            }

            return next;
        }
    }

    SF.entities.EnemyAI = EnemyAI;
})();
