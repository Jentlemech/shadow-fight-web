(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;

    class CombatSystem {
        constructor(dependencies) {
            this.collision = dependencies.collision;
            this.physics = dependencies.physics;
            this.particles = dependencies.particles;
            this.audio = dependencies.audio;
            this.renderer = dependencies.renderer;
            this.hud = dependencies.hud;
        }

        createAttackProfile(fighter, type, input) {
            const forward = input.moveX * fighter.facing > 0.25;
            const backward = input.moveX * fighter.facing < -0.25;

            if (type === "punchChain") {
                return {
                    kind: "punch",
                    state: "punch",
                    duration: 0.34,
                    activeStart: 0.1,
                    activeEnd: 0.22,
                    lockTime: 0.24,
                    cooldown: 0.28,
                    staminaCost: 8,
                    damage: 12 + (forward ? 3 : 0),
                    range: 78,
                    height: 34,
                    offsetX: 18,
                    offsetY: 100,
                    knockbackX: 210,
                    knockbackY: -70,
                    shake: 7
                };
            }

            if (type === "punch") {
                return {
                    kind: "punch",
                    state: "punch",
                    duration: 0.26,
                    activeStart: 0.08,
                    activeEnd: 0.16,
                    lockTime: 0.16,
                    cooldown: 0.18,
                    staminaCost: 6,
                    damage: 8 + (forward ? 2 : 0),
                    range: backward ? 54 : 62,
                    height: 28,
                    offsetX: 18,
                    offsetY: 102,
                    knockbackX: 140,
                    knockbackY: -48,
                    shake: 5,
                    chainWindowStart: 0.11,
                    chainWindowEnd: 0.2,
                    chainTo: "punchChain"
                };
            }

            if (type === "kick") {
                return {
                    kind: "kick",
                    state: "kick",
                    duration: 0.36,
                    activeStart: 0.12,
                    activeEnd: 0.24,
                    lockTime: 0.24,
                    cooldown: 0.3,
                    staminaCost: 10,
                    damage: 14 + (forward ? 4 : 0),
                    range: backward ? 86 : 98,
                    height: 40,
                    offsetX: 16,
                    offsetY: 70,
                    knockbackX: 260,
                    knockbackY: -110,
                    shake: 9,
                    knockdown: forward
                };
            }

            if (type === "weapon") {
                const rageBonus = fighter.isBoss && fighter.rage ? 1.18 : 1;
                return {
                    kind: "weapon",
                    state: "weapon",
                    duration: fighter.isBoss ? 0.58 : fighter.weapon.speed * (fighter.isBoss && fighter.rage ? 0.9 : 1),
                    activeStart: fighter.isBoss ? 0.16 : 0.16,
                    activeEnd: fighter.isBoss ? 0.34 : 0.28,
                    lockTime: fighter.isBoss ? 0.34 : fighter.weapon.speed * 0.72,
                    cooldown: fighter.isBoss ? 0.52 : fighter.weapon.speed * 0.8,
                    staminaCost: fighter.weapon.staminaCost,
                    damage: fighter.weapon.damage * rageBonus + (forward ? 4 : 0),
                    range: fighter.isBoss ? (fighter.rage ? 188 : 164) : fighter.weapon.range + (forward ? 12 : 0),
                    height: fighter.isBoss ? (fighter.rage ? 124 : 104) : 54,
                    offsetX: 14,
                    offsetY: 92,
                    knockbackX: fighter.isBoss ? 310 : 240,
                    knockbackY: fighter.isBoss ? -140 : -92,
                    shake: fighter.isBoss ? 14 : 8,
                    knockdown: fighter.isBoss || forward
                };
            }

            return null;
        }

        processFighter(fighter, input, opponent, state) {
            fighter.faceTarget(opponent);
            fighter.guardActive = fighter.canBlock() && input.moveX * fighter.facing < -0.3;

            if (fighter.guardActive && fighter.currentAttack == null && fighter.grounded) {
                fighter.setState("block");
            }

            if (fighter.currentAttack && fighter.currentAttack.chainTo) {
                const chainReady =
                    fighter.currentAttack.elapsed >= fighter.currentAttack.chainWindowStart &&
                    fighter.currentAttack.elapsed <= fighter.currentAttack.chainWindowEnd;
                if (chainReady && input.punchPressed) {
                    fighter.queueAttack(fighter.currentAttack.chainTo);
                }
            }

            if (input.switchPressed && !fighter.currentAttack && fighter.attackCooldown <= 0) {
                fighter.switchWeapon();
            }

            if (input.dodgePressed && fighter.startDodge(input.moveX || -fighter.facing)) {
                return;
            }

            if (!fighter.canAct()) {
                return;
            }

            if (!fighter.currentAttack) {
                const queued = fighter.consumeQueuedAttack();
                if (queued) {
                    fighter.startAttack(this.createAttackProfile(fighter, queued, input));
                    return;
                }

                if (input.weaponPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "weapon", input));
                    return;
                }
                if (input.kickPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "kick", input));
                    return;
                }
                if (input.punchPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "punch", input));
                }
            }
        }

        resolveHit(attacker, defender, state) {
            if (!attacker.currentAttack || attacker.currentAttack.connected) {
                return;
            }

            if (!this.collision.attackHits(attacker, defender)) {
                return;
            }

            attacker.currentAttack.connected = true;
            const attack = attacker.currentAttack;

            if (defender.guardActive && defender.stamina > 0 && defender.invulnerableTimer <= 0) {
                defender.stamina = Math.max(0, defender.stamina - attack.damage * 0.9);
                defender.recoveryTimer = Math.max(defender.recoveryTimer, 0.16);
                defender.setState("block");
                this.audio.playBlock();
                this.particles.spawnSpark(defender.x, defender.y - 104, "rgba(255, 234, 190, 0.85)", 8, 180);
                this.renderer.addShake(3, 0.1);
                return;
            }

            const damage = Math.round(attack.damage * attacker.stats.damage);
            defender.takeDamage(damage);
            defender.recoveryTimer = attack.knockdown ? 0.54 : 0.24;
            defender.invulnerableTimer = 0.14;
            defender.setState(attack.knockdown ? "knockdown" : "hit");
            this.physics.applyKnockback(defender, attacker.facing * attack.knockbackX, attack.knockbackY);

            if (attack.kind === "weapon") {
                this.audio.playWeapon();
            } else if (attack.kind === "kick") {
                this.audio.playKick();
            } else {
                this.audio.playPunch();
            }

            this.particles.spawnSpark(
                defender.x + attacker.facing * 12,
                defender.y - attack.offsetY,
                "rgba(255, 187, 112, 0.82)",
                attack.kind === "weapon" ? 12 : 9,
                attack.kind === "weapon" ? 260 : 200
            );
            this.renderer.addShake(attack.shake, 0.16);

            attacker.comboHits += 1;
            attacker.comboTimer = 1.15;
            this.hud.comboCounter.register(attacker.name, attacker.comboHits);

            if (defender.health <= 0) {
                state.roundEnded = true;
                state.roundWinner = attacker === state.player ? "player" : "opponent";
            }
        }

        updateBossState(fighter) {
            if (fighter.isBoss && fighter.updateRagePhase) {
                fighter.updateRagePhase();
            }
        }
    }

    SF.systems.CombatSystem = CombatSystem;
})();
