(function () {
    const SF = window.ShadowFight;
    const Projectile = SF.entities.Projectile;
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

        createAttackProfile(fighter, type, input, opponent) {
            const forward = input.moveX * fighter.facing > 0.25;
            const backward = input.moveX * fighter.facing < -0.25;
            const weaponRange = fighter.weapon ? fighter.weapon.range : 96;
            const rangedWeapon = fighter.rangedWeapon;
            const magic = fighter.magicAbility;

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
                    range: 78 + fighter.stats.attackRange,
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
                    range: (backward ? 54 : 62) + fighter.stats.attackRange,
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
                    range: (backward ? 86 : 98) + fighter.stats.attackRange,
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
                return {
                    kind: "weapon",
                    state: "weapon",
                    duration: weaponRange > 140 ? 0.46 : 0.4,
                    activeStart: 0.14,
                    activeEnd: 0.26,
                    lockTime: 0.26,
                    cooldown: fighter.weapon ? fighter.weapon.cooldown : 0.34,
                    staminaCost: 16,
                    damage: fighter.weapon ? fighter.weapon.damage : 18,
                    range: weaponRange + fighter.stats.attackRange + (forward ? 10 : 0),
                    height: fighter.weapon && fighter.weapon.category === "axe" ? 72 : 58,
                    offsetX: 14,
                    offsetY: 92,
                    knockbackX: fighter.weapon && fighter.weapon.category === "axe" ? 320 : 250,
                    knockbackY: fighter.weapon && fighter.weapon.category === "axe" ? -132 : -92,
                    shake: fighter.weapon && fighter.weapon.category === "axe" ? 12 : 8,
                    knockdown: fighter.weapon && fighter.weapon.category === "axe"
                };
            }

            if (type === "ranged" && rangedWeapon) {
                return {
                    kind: "projectile",
                    state: "ranged",
                    duration: 0.34,
                    activeStart: 0.14,
                    activeEnd: 0.16,
                    lockTime: 0.2,
                    cooldown: rangedWeapon.cooldown,
                    cooldownKey: "rangedCooldown",
                    staminaCost: rangedWeapon.category === "knives" ? 8 : 6,
                    damage: rangedWeapon.damage,
                    projectileSpeed: rangedWeapon.category === "bow" ? 720 : rangedWeapon.category === "staff" ? 640 : 820,
                    projectileWidth: rangedWeapon.category === "staff" ? 30 : 22,
                    projectileHeight: rangedWeapon.category === "staff" ? 30 : 12,
                    projectileColor: rangedWeapon.color,
                    projectileLife: rangedWeapon.range / (rangedWeapon.category === "bow" ? 720 : 640),
                    knockbackX: rangedWeapon.category === "staff" ? 180 : 120,
                    knockbackY: -40,
                    visual: rangedWeapon.id,
                    ranged: true
                };
            }

            if (type === "magic" && magic) {
                if (magic.id === "fireball") {
                    return {
                        kind: "projectile",
                        state: "magic",
                        duration: 0.42,
                        activeStart: 0.16,
                        activeEnd: 0.18,
                        lockTime: 0.24,
                        cooldown: magic.cooldown,
                        cooldownKey: "magicCooldown",
                        manaCost: magic.manaCost,
                        damage: magic.power,
                        projectileSpeed: 620,
                        projectileWidth: 30,
                        projectileHeight: 30,
                        projectileColor: magic.color,
                        projectileLife: 0.74,
                        knockbackX: 170,
                        knockbackY: -50,
                        visual: magic.id,
                        magic: true
                    };
                }

                if (magic.id === "lightning_strike") {
                    return {
                        kind: "spellArea",
                        state: "magic",
                        duration: 0.46,
                        activeStart: 0.22,
                        activeEnd: 0.24,
                        lockTime: 0.28,
                        cooldown: magic.cooldown,
                        cooldownKey: "magicCooldown",
                        manaCost: magic.manaCost,
                        damage: magic.power,
                        range: 96,
                        height: 182,
                        targetX: opponent ? opponent.x : fighter.x + fighter.facing * 120,
                        offsetY: 104,
                        knockbackX: 210,
                        knockbackY: -120,
                        projectileColor: magic.color,
                        visual: magic.id,
                        magic: true
                    };
                }

                if (magic.id === "energy_shield") {
                    return {
                        kind: "magicUtility",
                        state: "magic",
                        duration: 0.28,
                        activeStart: 0.1,
                        activeEnd: 0.12,
                        lockTime: 0.18,
                        cooldown: magic.cooldown,
                        cooldownKey: "magicCooldown",
                        manaCost: magic.manaCost,
                        visual: magic.id,
                        shieldPower: 18,
                        magic: true
                    };
                }

                if (magic.id === "dash_teleport") {
                    return {
                        kind: "teleportStrike",
                        state: "magic",
                        duration: 0.24,
                        activeStart: 0.08,
                        activeEnd: 0.1,
                        lockTime: 0.16,
                        cooldown: magic.cooldown,
                        cooldownKey: "magicCooldown",
                        manaCost: magic.manaCost,
                        damage: magic.power,
                        visual: magic.id,
                        dashDistance: 140,
                        knockbackX: 240,
                        knockbackY: -70,
                        magic: true
                    };
                }
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
                fighter.cycleSlot("weapon");
            }
            if (input.switchRangedPressed && !fighter.currentAttack && fighter.rangedCooldown <= 0) {
                fighter.cycleSlot("ranged");
            }
            if (input.switchMagicPressed && !fighter.currentAttack && fighter.magicCooldown <= 0) {
                fighter.cycleSlot("magic");
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
                    fighter.startAttack(this.createAttackProfile(fighter, queued, input, opponent));
                    return;
                }

                if (input.magicPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "magic", input, opponent));
                    return;
                }
                if (input.rangedPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "ranged", input, opponent));
                    return;
                }
                if (input.weaponPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "weapon", input, opponent));
                    return;
                }
                if (input.kickPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "kick", input, opponent));
                    return;
                }
                if (input.punchPressed) {
                    fighter.startAttack(this.createAttackProfile(fighter, "punch", input, opponent));
                }
            }

            this.triggerAttackEffects(fighter, opponent, state);
        }

        triggerAttackEffects(fighter, opponent, state) {
            const attack = fighter.currentAttack;
            if (!attack || attack.spawned || attack.elapsed < attack.activeStart) {
                return;
            }

            if (attack.kind === "projectile") {
                const originX = fighter.x + fighter.facing * 48;
                const originY = fighter.y - 112;
                state.projectiles.push(new Projectile({
                    ownerId: fighter.id,
                    kind: attack.magic ? "magic" : "ranged",
                    visual: attack.visual,
                    color: attack.projectileColor,
                    x: originX,
                    y: originY,
                    vx: fighter.facing * attack.projectileSpeed,
                    vy: attack.visual === "hunter_bow" ? -12 : 0,
                    width: attack.projectileWidth,
                    height: attack.projectileHeight,
                    radius: Math.max(10, attack.projectileWidth / 2),
                    life: attack.projectileLife,
                    damage: attack.damage,
                    knockbackX: attack.knockbackX,
                    knockbackY: attack.knockbackY,
                    ownerFacing: fighter.facing,
                    meta: {
                        magic: attack.magic,
                        gravity: attack.visual === "hunter_bow" ? 10 : 0
                    }
                }));
                this.audio[attack.magic ? "playMagic" : "playRanged"](attack.visual);
                this.particles.spawnMagicBurst(originX, originY, attack.projectileColor, attack.magic ? 10 : 6, attack.magic ? 60 : 34);
                attack.spawned = true;
                return;
            }

            if (attack.kind === "spellArea") {
                const x = attack.targetX;
                const y = fighter.y - 102;
                state.projectiles.push(new Projectile({
                    ownerId: fighter.id,
                    kind: "magic",
                    visual: attack.visual,
                    color: attack.projectileColor,
                    x,
                    y,
                    width: attack.range,
                    height: attack.height,
                    radius: 28,
                    life: 0.18,
                    damage: attack.damage,
                    knockbackX: attack.knockbackX,
                    knockbackY: attack.knockbackY,
                    ownerFacing: fighter.facing,
                    meta: {
                        anchored: true,
                        magic: true,
                        pierce: false
                    }
                }));
                this.audio.playMagic(attack.visual);
                this.particles.spawnMagicBurst(x, y - 20, attack.projectileColor, 18, 90);
                this.renderer.addShake(8, 0.18);
                attack.spawned = true;
                return;
            }

            if (attack.kind === "magicUtility" && attack.visual === "energy_shield") {
                fighter.startShield(attack.shieldPower);
                this.audio.playMagic("energy_shield");
                this.particles.spawnMagicBurst(fighter.x, fighter.y - 100, fighter.magicAbility.color, 12, 70);
                attack.spawned = true;
                return;
            }

            if (attack.kind === "teleportStrike") {
                fighter.teleport(attack.dashDistance);
                fighter.x = clamp(fighter.x, state.world.leftBound, state.world.rightBound);
                this.audio.playMagic("dash_teleport");
                this.particles.spawnMagicBurst(fighter.x, fighter.y - 100, fighter.magicAbility.color, 10, 64);
                if (Math.abs(opponent.x - fighter.x) < 120 && opponent.invulnerableTimer <= 0) {
                    this.applyDamage(fighter, opponent, {
                        kind: "magic",
                        damage: attack.damage,
                        knockbackX: attack.knockbackX,
                        knockbackY: attack.knockbackY,
                        shake: 9,
                        offsetY: 94
                    }, state, fighter.x, fighter.y - 100);
                }
                attack.spawned = true;
            }
        }

        computeDamage(attacker, defender, attack) {
            const damageScale = attack.magic ? attacker.stats.magicPower : attacker.stats.damage;
            const baseDamage = attack.damage * damageScale;
            const defenseScale = defender.stats.defense * (defender.shieldTimer > 0 ? 1.4 : 1);
            return Math.max(2, Math.round(baseDamage - defenseScale * 0.45));
        }

        handleBlockedHit(defender, attack) {
            defender.stamina = Math.max(0, defender.stamina - attack.damage * 0.9);
            defender.recoveryTimer = Math.max(defender.recoveryTimer, 0.16);
            defender.setState("block");
            this.audio.playBlock();
            this.particles.spawnSpark(defender.x, defender.y - 104, "rgba(255, 234, 190, 0.85)", 8, 180);
            this.renderer.addShake(3, 0.1);
        }

        applyDamage(attacker, defender, attack, state, impactX, impactY) {
            if (defender.guardActive && defender.stamina > 0 && defender.invulnerableTimer <= 0 && !attack.guardBreak) {
                this.handleBlockedHit(defender, attack);
                return;
            }

            const damage = this.computeDamage(attacker, defender, attack);
            defender.takeDamage(damage);
            defender.recoveryTimer = attack.knockdown ? 0.54 : 0.24;
            defender.invulnerableTimer = 0.14;
            defender.setState(attack.knockdown ? "knockdown" : "hit");
            this.physics.applyKnockback(defender, attacker.facing * attack.knockbackX, attack.knockbackY);

            if (attack.magic) {
                this.audio.playMagic(attacker.magicAbility ? attacker.magicAbility.id : attack.visual);
            } else if (attack.kind === "weapon") {
                this.audio.playWeapon();
            } else if (attack.kind === "kick") {
                this.audio.playKick();
            } else if (attack.kind === "ranged") {
                this.audio.playRanged();
            } else {
                this.audio.playPunch();
            }

            this.particles.spawnSpark(
                impactX || defender.x + attacker.facing * 12,
                impactY || defender.y - (attack.offsetY || 100),
                attack.magic ? (attack.projectileColor || "rgba(186, 219, 255, 0.82)") : "rgba(255, 187, 112, 0.82)",
                attack.kind === "weapon" || attack.magic ? 12 : 9,
                attack.kind === "weapon" || attack.magic ? 260 : 200
            );
            this.renderer.addShake(attack.shake || 7, 0.16);

            attacker.comboHits += 1;
            attacker.comboTimer = 1.15;
            this.hud.comboCounter.register(attacker.name, attacker.comboHits);

            if (defender.health <= 0) {
                state.roundEnded = true;
                state.roundWinner = attacker === state.player ? "player" : "opponent";
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
            this.applyDamage(attacker, defender, attacker.currentAttack, state);
        }

        updateProjectiles(state, dt) {
            const world = state.world;
            const nextProjectiles = [];

            for (const projectile of state.projectiles) {
                projectile.update(dt);

                if (projectile.visual === "fireball" || projectile.visual === "arcane_staff") {
                    this.particles.spawnTrail(projectile.x, projectile.y, projectile.color, 0.8);
                }

                const owner = state.player && state.player.id === projectile.ownerId ? state.player : state.opponent;
                const defender = owner === state.player ? state.opponent : state.player;
                if (!owner || !defender) {
                    continue;
                }

                const outOfBounds =
                    projectile.getHitBox().x > world.width + 60 ||
                    projectile.getHitBox().x + projectile.getHitBox().w < -60 ||
                    projectile.getHitBox().y > world.height + 60 ||
                    projectile.life <= 0;

                if (!outOfBounds && defender.invulnerableTimer <= 0 && this.collision.projectileHits(projectile, defender)) {
                    this.applyDamage(owner, defender, {
                        kind: projectile.kind,
                        damage: projectile.damage,
                        magic: Boolean(projectile.meta.magic),
                        knockbackX: projectile.knockbackX,
                        knockbackY: projectile.knockbackY,
                        shake: projectile.kind === "magic" ? 10 : 6,
                        projectileColor: projectile.color,
                        guardBreak: projectile.visual === "lightning_strike"
                    }, state, projectile.x, projectile.y);
                    projectile.expired = true;
                }

                if (!projectile.expired && !outOfBounds) {
                    nextProjectiles.push(projectile);
                }
            }

            state.projectiles = nextProjectiles;
        }

        updateBossState(fighter, dt) {
            if (fighter.isBoss && fighter.updateRagePhase) {
                fighter.updateRagePhase(dt);
            }
        }
    }

    SF.systems.CombatSystem = CombatSystem;
})();
