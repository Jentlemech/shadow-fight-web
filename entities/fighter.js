(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;
    const Weapon = SF.entities.Weapon;

    class Fighter {
        constructor(options) {
            this.id = options.id || options.name.toLowerCase();
            this.name = options.name;
            this.isPlayer = Boolean(options.isPlayer);
            this.isBoss = Boolean(options.isBoss);
            this.groundY = options.groundY;
            this.x = options.x;
            this.y = options.groundY;
            this.vx = 0;
            this.vy = 0;
            this.facing = options.facing || 1;
            this.grounded = true;
            this.gravityScale = 1;
            this.state = "idle";
            this.stateTime = 0;
            this.recoveryTimer = 0;
            this.attackCooldown = 0;
            this.invulnerableTimer = 0;
            this.dodgeTimer = 0;
            this.dodgeDirection = 0;
            this.comboHits = 0;
            this.comboTimer = 0;
            this.attackProgress = 0;
            this.currentAttack = null;
            this.queuedAttack = null;
            this.wasHitThisFrame = false;
            this.guardActive = false;
            this.rage = false;

            this.baseStats = {
                maxHealth: options.maxHealth || 120,
                maxStamina: options.maxStamina || 100,
                moveSpeed: options.moveSpeed || 300,
                jumpStrength: options.jumpStrength || 900,
                damage: options.damage || 1,
                staminaRecovery: options.staminaRecovery || 18
            };

            this.stats = Object.assign({}, this.baseStats);
            this.health = this.stats.maxHealth;
            this.stamina = this.stats.maxStamina;

            this.unlockedWeaponIds = options.unlockedWeapons || ["sword"];
            this.weaponIndex = 0;
            this.weapon = Weapon.create(this.unlockedWeaponIds[this.weaponIndex]);
        }

        applyStats(overrides) {
            this.stats = Object.assign({}, this.baseStats, overrides);
            this.health = clamp(this.health, 0, this.stats.maxHealth);
            this.stamina = clamp(this.stamina, 0, this.stats.maxStamina);
        }

        restoreForRound() {
            this.y = this.groundY;
            this.vx = 0;
            this.vy = 0;
            this.grounded = true;
            this.health = this.stats.maxHealth;
            this.stamina = this.stats.maxStamina;
            this.state = "idle";
            this.stateTime = 0;
            this.recoveryTimer = 0;
            this.attackCooldown = 0;
            this.invulnerableTimer = 0;
            this.dodgeTimer = 0;
            this.comboHits = 0;
            this.comboTimer = 0;
            this.attackProgress = 0;
            this.currentAttack = null;
            this.queuedAttack = null;
            this.guardActive = false;
        }

        unlockWeapons(weaponIds) {
            this.unlockedWeaponIds = weaponIds.slice();
            if (!this.unlockedWeaponIds.includes(this.weapon.id)) {
                this.weaponIndex = 0;
                this.weapon = Weapon.create(this.unlockedWeaponIds[0]);
            }
        }

        switchWeapon() {
            if (this.unlockedWeaponIds.length <= 1) {
                return this.weapon;
            }
            this.weaponIndex = (this.weaponIndex + 1) % this.unlockedWeaponIds.length;
            this.weapon = Weapon.create(this.unlockedWeaponIds[this.weaponIndex]);
            return this.weapon;
        }

        setState(nextState) {
            if (this.state !== nextState) {
                this.state = nextState;
                this.stateTime = 0;
                return;
            }
            this.stateTime += 0;
        }

        faceTarget(target) {
            if (Math.abs(target.x - this.x) > 8) {
                this.facing = target.x > this.x ? 1 : -1;
            }
        }

        canAct() {
            return this.health > 0 && this.recoveryTimer <= 0 && this.dodgeTimer <= 0 && this.state !== "knockdown";
        }

        canMove() {
            return this.canAct() && !this.currentAttack;
        }

        canControlState() {
            return this.canMove() && this.state !== "hit";
        }

        canJump() {
            return this.canAct() && this.grounded && !this.currentAttack;
        }

        canRecoverStamina() {
            return !this.currentAttack && this.recoveryTimer <= 0;
        }

        canBlock() {
            return this.canAct() && this.grounded && !this.currentAttack && this.stamina > 8;
        }

        updateTimers(dt) {
            this.stateTime += dt;
            this.wasHitThisFrame = false;
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.recoveryTimer = Math.max(0, this.recoveryTimer - dt);
            this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
            this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
            this.comboTimer = Math.max(0, this.comboTimer - dt);

            if (this.comboTimer <= 0) {
                this.comboHits = 0;
            }

            if (!this.currentAttack) {
                this.attackProgress = 0;
                return;
            }

            this.currentAttack.elapsed += dt;
            this.attackProgress = clamp(this.currentAttack.elapsed / this.currentAttack.duration, 0, 1);
            if (this.currentAttack.elapsed >= this.currentAttack.duration) {
                this.currentAttack = null;
                this.attackProgress = 0;
                if (this.recoveryTimer <= 0 && this.grounded) {
                    this.setState("idle");
                }
            }
        }

        startAttack(profile) {
            if (this.attackCooldown > 0 || this.currentAttack || this.stamina < profile.staminaCost || !this.canAct()) {
                return false;
            }

            this.currentAttack = Object.assign({
                elapsed: 0,
                connected: false
            }, profile);
            this.attackCooldown = profile.cooldown;
            this.recoveryTimer = Math.max(this.recoveryTimer, profile.lockTime);
            this.stamina = clamp(this.stamina - profile.staminaCost, 0, this.stats.maxStamina);
            this.setState(profile.state);
            return true;
        }

        queueAttack(type) {
            this.queuedAttack = type;
        }

        consumeQueuedAttack() {
            const next = this.queuedAttack;
            this.queuedAttack = null;
            return next;
        }

        startDodge(direction) {
            if (!this.canAct() || this.stamina < 12) {
                return false;
            }
            this.dodgeDirection = direction || this.facing;
            this.dodgeTimer = 0.18;
            this.invulnerableTimer = 0.18;
            this.recoveryTimer = Math.max(this.recoveryTimer, 0.14);
            this.stamina = clamp(this.stamina - 12, 0, this.stats.maxStamina);
            this.setState("walk");
            return true;
        }

        takeDamage(amount) {
            this.health = clamp(this.health - amount, 0, this.stats.maxHealth);
            this.wasHitThisFrame = true;
        }

        getBodyBox() {
            const width = this.isBoss ? 82 : 60;
            const height = this.state === "crouch" || this.state === "block" ? 112 : (this.isBoss ? 188 : 154);
            return {
                x: this.x - width / 2,
                y: this.y - height,
                w: width,
                h: height
            };
        }

        getHurtBox() {
            const body = this.getBodyBox();
            return {
                x: body.x + 6,
                y: body.y + 8,
                w: body.w - 12,
                h: body.h - 10
            };
        }

        getAttackBox() {
            if (!this.currentAttack) {
                return null;
            }

            if (
                this.currentAttack.elapsed < this.currentAttack.activeStart ||
                this.currentAttack.elapsed > this.currentAttack.activeEnd
            ) {
                return null;
            }

            const width = this.currentAttack.range;
            const x = this.facing === 1
                ? this.x + this.currentAttack.offsetX
                : this.x - width - this.currentAttack.offsetX;

            return {
                x,
                y: this.y - this.currentAttack.offsetY - this.currentAttack.height / 2,
                w: width,
                h: this.currentAttack.height
            };
        }
    }

    SF.entities.Fighter = Fighter;
})();
