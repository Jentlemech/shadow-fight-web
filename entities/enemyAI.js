(function () {
    const SF = window.ShadowFight;

    class EnemyAI {
        constructor(options) {
            this.difficulty = options.difficulty || 1;
            this.isBoss = Boolean(options.isBoss);
            this.style = options.style || "balanced";
            this.decisionTimer = 0;
            this.jumpTimer = 0;
            this.blockTimer = 0;
            this.dodgeTimer = 0;
            this.specialTimer = 0;
        }

        emptyIntent() {
            return {
                moveX: 0,
                moveY: 0,
                crouch: false,
                jumpPressed: false,
                punchPressed: false,
                kickPressed: false,
                weaponPressed: false,
                rangedPressed: false,
                magicPressed: false,
                switchPressed: false,
                switchRangedPressed: false,
                switchMagicPressed: false,
                inventoryPressed: false,
                pausePressed: false,
                dodgePressed: false
            };
        }

        think(fighter, target, round, dt) {
            this.decisionTimer -= dt;
            this.jumpTimer = Math.max(0, this.jumpTimer - dt);
            this.blockTimer = Math.max(0, this.blockTimer - dt);
            this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
            this.specialTimer = Math.max(0, this.specialTimer - dt);

            const next = this.emptyIntent();
            const distance = target.x - fighter.x;
            const absDistance = Math.abs(distance);
            const direction = Math.sign(distance) || fighter.facing;
            const threat = Boolean(target.currentAttack && target.getAttackBox());
            const aggression = Math.min(2.2, 0.82 + round * 0.1 + this.difficulty * 0.16);
            const rangedPreference = this.style === "ranged" || this.style === "caster" ? 0.24 : 0.12;
            const magicPreference = this.style === "magic" || this.style === "caster" || this.isBoss ? 0.24 : 0.08;
            const dodgePreference = this.style === "ambush" ? 0.28 : 0.15;

            if (this.decisionTimer <= 0) {
                if (threat && fighter.canBlock() && Math.random() < 0.18 + this.difficulty * 0.1) {
                    this.blockTimer = 0.26 + Math.random() * 0.18;
                } else if (threat && this.dodgeTimer <= 0 && Math.random() < dodgePreference + this.difficulty * 0.06) {
                    next.dodgePressed = true;
                    next.moveX = -direction;
                    this.dodgeTimer = 0.75;
                } else if (absDistance > 210) {
                    next.moveX = direction;
                } else if (absDistance < 92) {
                    next.moveX = -direction * 0.42;
                }

                if (fighter.grounded && this.jumpTimer <= 0 && Math.random() < 0.03 + this.difficulty * 0.025) {
                    next.jumpPressed = true;
                    this.jumpTimer = 1;
                }

                if (absDistance < 168 && fighter.attackCooldown <= 0 && fighter.stamina > 18) {
                    const attackRoll = Math.random() * aggression;
                    if (attackRoll > 1.3) {
                        next.weaponPressed = true;
                    } else if (attackRoll > 0.85) {
                        next.kickPressed = true;
                    } else {
                        next.punchPressed = true;
                    }
                }

                if (fighter.canUseRanged() && absDistance > 110 && Math.random() < rangedPreference + this.difficulty * 0.04) {
                    next.rangedPressed = true;
                }

                if (fighter.canUseMagic() && this.specialTimer <= 0 && Math.random() < magicPreference + this.difficulty * 0.05) {
                    next.magicPressed = true;
                    this.specialTimer = this.isBoss ? 1.1 : 1.8;
                }

                if (this.isBoss && absDistance < 150 && fighter.canUseMagic() && Math.random() < 0.3) {
                    next.magicPressed = true;
                }

                this.decisionTimer = 0.08 + Math.random() * 0.14;
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
