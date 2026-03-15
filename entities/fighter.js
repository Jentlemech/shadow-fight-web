(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;
    const Weapon = SF.entities.Weapon;
    const RPGData = SF.entities.RPGData;

    class Fighter {
        constructor(options) {
            this.id = options.id || options.name.toLowerCase();
            this.name = options.name;
            this.characterId = options.characterId || "warrior";
            this.character = RPGData.CHARACTERS[this.characterId] || RPGData.CHARACTERS.warrior;
            this.color = options.color || this.character.color;
            this.enemyType = options.enemyType || "";
            this.isPlayer = Boolean(options.isPlayer);
            this.isBoss = Boolean(options.isBoss);
            this.isRemote = Boolean(options.isRemote);
            this.groundY = options.groundY;
            this.x = options.x;
            this.y = options.groundY;
            this.vx = 0;
            this.vy = 0;
            this.facing = options.facing || 1;
            this.grounded = true;
            this.gravityScale = options.gravityScale || 1;
            this.state = "idle";
            this.stateTime = 0;
            this.recoveryTimer = 0;
            this.attackCooldown = 0;
            this.rangedCooldown = 0;
            this.magicCooldown = 0;
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
            this.shieldTimer = 0;
            this.teleportFlash = 0;
            this.knockdownTimer = 0;

            this.collections = {
                weapon: ["bronze_sword"],
                ranged: ["hunter_bow"],
                magic: ["fireball"]
            };

            this.loadout = Object.assign({
                helmet: null,
                armor: null,
                boots: null,
                gloves: null,
                weapon: "bronze_sword",
                ranged: "hunter_bow",
                magic: "fireball"
            }, options.loadout || {});

            this.baseStats = Object.assign({
                maxHealth: 120,
                maxStamina: 100,
                maxMana: 80,
                moveSpeed: 300,
                jumpStrength: 900,
                damage: 1,
                defense: 0,
                attackRange: 0,
                magicPower: 1,
                staminaRecovery: 18,
                manaRecovery: 8
            }, options.baseStats || {});

            this.stats = Object.assign({}, this.baseStats);
            this.health = this.stats.maxHealth;
            this.stamina = this.stats.maxStamina;
            this.mana = this.stats.maxMana;

            this.weapon = null;
            this.rangedWeapon = null;
            this.magicAbility = null;
            this.refreshEquipment();
        }

        setCollections(collections) {
            this.collections.weapon = (collections.weapon || [this.loadout.weapon]).slice();
            this.collections.ranged = (collections.ranged || [this.loadout.ranged]).slice();
            this.collections.magic = (collections.magic || [this.loadout.magic]).slice();
            this.ensureLoadoutIsUnlocked();
            this.refreshEquipment();
        }

        ensureLoadoutIsUnlocked() {
            for (const slot of ["weapon", "ranged", "magic"]) {
                const pool = this.collections[slot];
                if (!pool.length) {
                    continue;
                }
                if (!pool.includes(this.loadout[slot])) {
                    this.loadout[slot] = pool[0];
                }
            }
        }

        equip(slot, itemId) {
            this.loadout[slot] = itemId;
            this.refreshEquipment();
        }

        cycleSlot(slot) {
            const pool = this.collections[slot] || [];
            if (pool.length <= 1) {
                return this.getEquippedItem(slot);
            }

            const currentIndex = Math.max(0, pool.indexOf(this.loadout[slot]));
            const nextId = pool[(currentIndex + 1) % pool.length];
            this.loadout[slot] = nextId;
            this.refreshEquipment();
            return this.getEquippedItem(slot);
        }

        getEquippedItem(slot) {
            return RPGData.getItem(this.loadout[slot]) || null;
        }

        refreshEquipment() {
            this.weapon = Weapon.create(this.loadout.weapon);
            this.rangedWeapon = Weapon.create(this.loadout.ranged);
            this.magicAbility = Weapon.create(this.loadout.magic);
        }

        applyStats(overrides) {
            const previousHealthRatio = this.stats.maxHealth ? this.health / this.stats.maxHealth : 1;
            const previousStaminaRatio = this.stats.maxStamina ? this.stamina / this.stats.maxStamina : 1;
            const previousManaRatio = this.stats.maxMana ? this.mana / this.stats.maxMana : 1;

            this.stats = Object.assign({}, this.baseStats, overrides);
            this.health = clamp(this.stats.maxHealth * previousHealthRatio, 0, this.stats.maxHealth);
            this.stamina = clamp(this.stats.maxStamina * previousStaminaRatio, 0, this.stats.maxStamina);
            this.mana = clamp(this.stats.maxMana * previousManaRatio, 0, this.stats.maxMana);
        }

        restoreForRound() {
            this.y = this.groundY;
            this.vx = 0;
            this.vy = 0;
            this.grounded = true;
            this.health = this.stats.maxHealth;
            this.stamina = this.stats.maxStamina;
            this.mana = this.stats.maxMana;
            this.state = "idle";
            this.stateTime = 0;
            this.recoveryTimer = 0;
            this.attackCooldown = 0;
            this.rangedCooldown = 0;
            this.magicCooldown = 0;
            this.invulnerableTimer = 0;
            this.dodgeTimer = 0;
            this.comboHits = 0;
            this.comboTimer = 0;
            this.attackProgress = 0;
            this.currentAttack = null;
            this.queuedAttack = null;
            this.guardActive = false;
            this.shieldTimer = 0;
            this.teleportFlash = 0;
            this.knockdownTimer = 0;
        }

        getAppearance() {
            return {
                accent: this.color,
                helmet: this.getEquippedItem("helmet"),
                armor: this.getEquippedItem("armor"),
                boots: this.getEquippedItem("boots"),
                gloves: this.getEquippedItem("gloves"),
                weapon: this.weapon,
                ranged: this.rangedWeapon,
                magic: this.magicAbility
            };
        }

        setState(nextState) {
            if (this.state !== nextState) {
                this.state = nextState;
                this.stateTime = 0;
            }
        }

        faceTarget(target) {
            if (!target) {
                return;
            }
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

        canRecoverMana() {
            return !this.currentAttack && this.magicCooldown <= 0;
        }

        canBlock() {
            return this.canAct() && this.grounded && !this.currentAttack && this.stamina > 8;
        }

        canUseRanged() {
            return this.canAct() && !this.currentAttack && this.rangedCooldown <= 0 && this.rangedWeapon;
        }

        canUseMagic() {
            return this.canAct() &&
                !this.currentAttack &&
                this.magicCooldown <= 0 &&
                this.magicAbility &&
                this.mana >= this.magicAbility.manaCost;
        }

        updateTimers(dt) {
            this.stateTime += dt;
            this.wasHitThisFrame = false;
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.rangedCooldown = Math.max(0, this.rangedCooldown - dt);
            this.magicCooldown = Math.max(0, this.magicCooldown - dt);
            this.recoveryTimer = Math.max(0, this.recoveryTimer - dt);
            this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
            this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
            this.comboTimer = Math.max(0, this.comboTimer - dt);
            this.shieldTimer = Math.max(0, this.shieldTimer - dt);
            this.teleportFlash = Math.max(0, this.teleportFlash - dt);
            this.knockdownTimer = Math.max(0, this.knockdownTimer - dt);

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

        recoverResources(dt) {
            if (this.stamina < this.stats.maxStamina && this.canRecoverStamina()) {
                this.stamina = clamp(this.stamina + this.stats.staminaRecovery * dt, 0, this.stats.maxStamina);
            }
            if (this.mana < this.stats.maxMana && this.canRecoverMana()) {
                this.mana = clamp(this.mana + this.stats.manaRecovery * dt, 0, this.stats.maxMana);
            }
        }

        startAttack(profile) {
            if (!profile) {
                return false;
            }

            const cooldownKey = profile.cooldownKey || "attackCooldown";
            const currentCooldown = this[cooldownKey] || 0;
            if (currentCooldown > 0 || this.currentAttack || !this.canAct()) {
                return false;
            }

            if (this.stamina < (profile.staminaCost || 0) || this.mana < (profile.manaCost || 0)) {
                return false;
            }

            this.currentAttack = Object.assign({
                elapsed: 0,
                connected: false,
                spawned: false
            }, profile);
            this[cooldownKey] = profile.cooldown;
            this.recoveryTimer = Math.max(this.recoveryTimer, profile.lockTime || 0);
            this.stamina = clamp(this.stamina - (profile.staminaCost || 0), 0, this.stats.maxStamina);
            this.mana = clamp(this.mana - (profile.manaCost || 0), 0, this.stats.maxMana);
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

        startShield(power) {
            this.shieldTimer = Math.max(this.shieldTimer, 1.8 + power * 0.01);
            this.setState("block");
        }

        teleport(distance) {
            this.x += distance * this.facing;
            this.teleportFlash = 0.24;
            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.16);
        }

        takeDamage(amount) {
            this.health = clamp(this.health - amount, 0, this.stats.maxHealth);
            this.wasHitThisFrame = true;
        }

        getBodyBox() {
            const width = this.isBoss ? 86 : 60;
            const height = this.state === "crouch" || this.state === "block" ? 112 : (this.isBoss ? 192 : 154);
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
            if (!this.currentAttack || this.currentAttack.kind === "projectile" || this.currentAttack.kind === "magicUtility") {
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
