const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerHealthFill = document.getElementById("playerHealthFill");
const enemyHealthFill = document.getElementById("enemyHealthFill");
const playerHealthValue = document.getElementById("playerHealthValue");
const enemyHealthValue = document.getElementById("enemyHealthValue");
const statusBadge = document.getElementById("statusBadge");
const roundOverlay = document.getElementById("roundOverlay");
const winnerText = document.getElementById("winnerText");
const restartButton = document.getElementById("restartButton");

const WORLD = {
    width: canvas.width,
    height: canvas.height,
    floorY: 432,
    leftBoundary: 86,
    rightBoundary: canvas.width - 86,
    gravity: 1900
};

// Attack timing data drives active hit windows, knockback, and animation reach.
const ATTACKS = {
    punch: {
        duration: 0.34,
        activeStart: 0.1,
        activeEnd: 0.18,
        cooldown: 0.34,
        damage: 12,
        reach: 54,
        height: 30,
        offsetX: 14,
        yOffset: 88,
        knockbackX: 190,
        knockbackY: -85,
        effectSize: 22
    },
    kick: {
        duration: 0.44,
        activeStart: 0.15,
        activeEnd: 0.27,
        cooldown: 0.46,
        damage: 17,
        reach: 82,
        height: 36,
        offsetX: 12,
        yOffset: 58,
        knockbackX: 260,
        knockbackY: -130,
        effectSize: 30
    }
};

const inputState = {
    left: false,
    right: false,
    crouch: false
};

const actionQueue = {
    jump: false,
    punch: false,
    kick: false
};

const gameState = {
    lastTime: 0,
    paused: false,
    roundOver: false,
    winner: "",
    hitEffects: []
};

const enemyBrain = {
    moveIntent: 0,
    decisionTimer: 0,
    jumpTimer: 0
};

// Fighter handles physics, combat state, and the animation state machine.
class Fighter {
    constructor(options) {
        this.name = options.name;
        this.maxHealth = options.maxHealth;
        this.moveSpeed = options.moveSpeed;
        this.airSpeed = options.airSpeed;
        this.jumpStrength = options.jumpStrength;
        this.x = options.x;
        this.y = WORLD.floorY;
        this.facing = options.facing;
        this.health = this.maxHealth;
        this.vx = 0;
        this.vy = 0;
        this.grounded = true;
        this.crouching = false;
        this.attackCooldown = 0;
        this.hitStun = 0;
        this.flashTimer = 0;
        this.currentAttack = null;
        this.animationState = "idle";
        this.stateTime = 0;
    }

    reset(x, facing) {
        this.x = x;
        this.y = WORLD.floorY;
        this.facing = facing;
        this.health = this.maxHealth;
        this.vx = 0;
        this.vy = 0;
        this.grounded = true;
        this.crouching = false;
        this.attackCooldown = 0;
        this.hitStun = 0;
        this.flashTimer = 0;
        this.currentAttack = null;
        this.animationState = "idle";
        this.stateTime = 0;
    }

    startAttack(type) {
        if (this.currentAttack || this.attackCooldown > 0 || this.hitStun > 0 || this.health <= 0) {
            return false;
        }

        this.currentAttack = {
            type,
            elapsed: 0,
            active: false,
            hasHit: false
        };
        this.attackCooldown = ATTACKS[type].cooldown;
        return true;
    }

    getHurtbox() {
        const width = this.crouching && this.grounded ? 52 : 46;
        const height = this.crouching && this.grounded ? 98 : 136;

        return {
            x: this.x - width / 2,
            y: this.y - height,
            w: width,
            h: height
        };
    }

    getAttackBox() {
        if (!this.currentAttack || !this.currentAttack.active) {
            return null;
        }

        const data = ATTACKS[this.currentAttack.type];
        const x = this.facing === 1
            ? this.x + data.offsetX
            : this.x - data.offsetX - data.reach;

        return {
            x,
            y: this.y - data.yOffset - data.height / 2,
            w: data.reach,
            h: data.height
        };
    }

    takeHit(attackData, attacker) {
        this.health = Math.max(0, this.health - attackData.damage);
        this.hitStun = 0.24;
        this.flashTimer = 0.12;
        this.currentAttack = null;
        this.crouching = false;
        this.vx = attacker.facing * attackData.knockbackX;
        this.vy = attackData.knockbackY;

        spawnHitEffect(
            attacker.x + attacker.facing * (attackData.reach * 0.55),
            this.y - attackData.yOffset,
            attackData.effectSize
        );

        updateHud();

        if (this.health <= 0) {
            endRound(attacker.name);
        }
    }

    update(dt, input, opponent) {
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.hitStun = Math.max(0, this.hitStun - dt);
        this.flashTimer = Math.max(0, this.flashTimer - dt);

        if (this.hitStun <= 0) {
            if (input.jump && this.grounded && !this.currentAttack) {
                this.vy = -this.jumpStrength;
                this.grounded = false;
            }

            if (!this.currentAttack) {
                if (input.punch) {
                    this.startAttack("punch");
                } else if (input.kick) {
                    this.startAttack("kick");
                }
            }
        }

        this.crouching = Boolean(
            input.crouch &&
            this.grounded &&
            !this.currentAttack &&
            this.hitStun <= 0
        );

        let targetVelocity = 0;

        if (this.hitStun > 0) {
            targetVelocity = this.vx;
        } else if (this.currentAttack && this.grounded) {
            targetVelocity = 0;
        } else if (this.crouching) {
            targetVelocity = 0;
        } else {
            targetVelocity = input.move * (this.grounded ? this.moveSpeed : this.airSpeed);
        }

        const maxStep = (this.grounded ? 1800 : 820) * dt;
        this.vx = approach(this.vx, targetVelocity, maxStep);

        if (!this.grounded) {
            this.vy += WORLD.gravity * dt;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y >= WORLD.floorY) {
            this.y = WORLD.floorY;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        this.x = clamp(this.x, WORLD.leftBoundary, WORLD.rightBoundary);

        if (this.currentAttack) {
            const attackData = ATTACKS[this.currentAttack.type];
            this.currentAttack.elapsed += dt;
            this.currentAttack.active =
                this.currentAttack.elapsed >= attackData.activeStart &&
                this.currentAttack.elapsed <= attackData.activeEnd;

            if (this.currentAttack.elapsed >= attackData.duration) {
                this.currentAttack = null;
            }
        }

        this.updateFacing(opponent);
        this.updateAnimationState(dt);
    }

    updateFacing(opponent) {
        if (Math.abs(opponent.x - this.x) > 6) {
            this.facing = opponent.x > this.x ? 1 : -1;
        }
    }

    updateAnimationState(dt) {
        let nextState = "idle";

        if (this.hitStun > 0) {
            nextState = "hit";
        } else if (this.currentAttack) {
            nextState = this.currentAttack.type;
        } else if (!this.grounded) {
            nextState = "jump";
        } else if (this.crouching) {
            nextState = "crouch";
        } else if (Math.abs(this.vx) > 24) {
            nextState = "walk";
        }

        if (this.animationState === nextState) {
            this.stateTime += dt;
        } else {
            this.animationState = nextState;
            this.stateTime = 0;
        }
    }
}

const player = new Fighter({
    name: "Player",
    maxHealth: 100,
    moveSpeed: 280,
    airSpeed: 220,
    jumpStrength: 720,
    x: 250,
    facing: 1
});

const enemy = new Fighter({
    name: "Enemy",
    maxHealth: 100,
    moveSpeed: 235,
    airSpeed: 180,
    jumpStrength: 680,
    x: 710,
    facing: -1
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function approach(value, target, step) {
    if (value < target) {
        return Math.min(value + step, target);
    }
    return Math.max(value - step, target);
}

function intersects(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function pulse(progress) {
    if (progress < 0.35) {
        return progress / 0.35;
    }
    if (progress < 0.65) {
        return 1;
    }
    return 1 - (progress - 0.65) / 0.35;
}

function spawnHitEffect(x, y, size) {
    gameState.hitEffects.push({
        x,
        y,
        size,
        life: 0.18,
        maxLife: 0.18
    });
}

function updateEffects(dt) {
    gameState.hitEffects = gameState.hitEffects.filter((effect) => {
        effect.life -= dt;
        return effect.life > 0;
    });
}

function createPlayerInput() {
    const move = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);
    const input = {
        move,
        crouch: inputState.crouch,
        jump: actionQueue.jump,
        punch: actionQueue.punch,
        kick: actionQueue.kick
    };

    actionQueue.jump = false;
    actionQueue.punch = false;
    actionQueue.kick = false;

    return input;
}

function createEnemyInput(dt) {
    // Simple AI: approach the player, avoid active attacks, then strike in range.
    const distance = player.x - enemy.x;
    const absDistance = Math.abs(distance);
    const directionToPlayer = Math.sign(distance) || enemy.facing;
    const playerThreat = Boolean(player.currentAttack && player.currentAttack.active && absDistance < 110);

    enemyBrain.decisionTimer -= dt;
    enemyBrain.jumpTimer = Math.max(0, enemyBrain.jumpTimer - dt);

    let jump = false;
    let punch = false;
    let kick = false;
    let crouch = false;

    if (enemyBrain.decisionTimer <= 0) {
        if (playerThreat && enemy.grounded) {
            enemyBrain.moveIntent = -directionToPlayer;
            crouch = Math.random() < 0.28;

            if (enemyBrain.jumpTimer <= 0 && Math.random() < 0.14) {
                jump = true;
                enemyBrain.jumpTimer = 1.2;
            }
        } else if (absDistance > 118) {
            enemyBrain.moveIntent = directionToPlayer;
        } else if (absDistance < 84) {
            enemyBrain.moveIntent = -directionToPlayer;
        } else {
            enemyBrain.moveIntent = 0;
        }

        if (!enemy.currentAttack && enemy.attackCooldown <= 0 && absDistance < 128) {
            if (absDistance > 92 || Math.random() > 0.46) {
                kick = true;
            } else {
                punch = true;
            }
            enemyBrain.moveIntent = 0;
            enemyBrain.decisionTimer = 0.28 + Math.random() * 0.18;
        } else {
            enemyBrain.decisionTimer = 0.1 + Math.random() * 0.14;
        }
    }

    return {
        move: enemyBrain.moveIntent,
        crouch,
        jump,
        punch,
        kick
    };
}

function resolveFighterSpacing() {
    const minimumGap = 74;
    const difference = enemy.x - player.x;
    const distance = Math.abs(difference);

    if (distance >= minimumGap) {
        return;
    }

    const direction = difference === 0 ? 1 : Math.sign(difference);
    const push = (minimumGap - distance) / 2;

    player.x = clamp(player.x - push * direction, WORLD.leftBoundary, WORLD.rightBoundary);
    enemy.x = clamp(enemy.x + push * direction, WORLD.leftBoundary, WORLD.rightBoundary);
}

function resolveAttack(attacker, defender) {
    if (!attacker.currentAttack || !attacker.currentAttack.active || attacker.currentAttack.hasHit) {
        return;
    }

    const attackBox = attacker.getAttackBox();
    const hurtbox = defender.getHurtbox();

    if (attackBox && intersects(attackBox, hurtbox)) {
        attacker.currentAttack.hasHit = true;
        defender.takeHit(ATTACKS[attacker.currentAttack.type], attacker);
    }
}

function updateHud() {
    const playerPercent = `${player.health}%`;
    const enemyPercent = `${enemy.health}%`;

    playerHealthFill.style.width = playerPercent;
    enemyHealthFill.style.width = enemyPercent;
    playerHealthValue.textContent = String(player.health);
    enemyHealthValue.textContent = String(enemy.health);
}

function setStatus(text) {
    statusBadge.textContent = text;
}

function clearQueuedActions() {
    actionQueue.jump = false;
    actionQueue.punch = false;
    actionQueue.kick = false;
}

function endRound(winnerName) {
    if (gameState.roundOver) {
        return;
    }

    gameState.roundOver = true;
    gameState.winner = winnerName;
    winnerText.textContent = `${winnerName} Wins!`;
    roundOverlay.classList.remove("hidden");
    setStatus("KO");
}

function resetGame() {
    player.reset(250, 1);
    enemy.reset(710, -1);
    gameState.roundOver = false;
    gameState.winner = "";
    gameState.paused = false;
    gameState.hitEffects = [];
    enemyBrain.moveIntent = 0;
    enemyBrain.decisionTimer = 0;
    enemyBrain.jumpTimer = 0;
    clearQueuedActions();
    roundOverlay.classList.add("hidden");
    setStatus("Fight");
    updateHud();
}

function togglePause() {
    if (gameState.roundOver) {
        return;
    }

    gameState.paused = !gameState.paused;
    clearQueuedActions();
    setStatus(gameState.paused ? "Paused" : "Fight");
}

function update(dt) {
    if (gameState.roundOver || gameState.paused) {
        updateEffects(dt);
        return;
    }

    const playerInput = createPlayerInput();
    const enemyInput = createEnemyInput(dt);

    player.update(dt, playerInput, enemy);
    enemy.update(dt, enemyInput, player);

    resolveFighterSpacing();
    player.updateFacing(enemy);
    enemy.updateFacing(player);

    resolveAttack(player, enemy);
    if (!gameState.roundOver) {
        resolveAttack(enemy, player);
    }
    updateEffects(dt);
}

function drawBackground() {
    const wallGradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    wallGradient.addColorStop(0, "#e4b66d");
    wallGradient.addColorStop(0.44, "#c8854e");
    wallGradient.addColorStop(0.74, "#6e3422");
    wallGradient.addColorStop(1, "#2b130d");

    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    const paperGradient = ctx.createLinearGradient(0, 54, 0, 324);
    paperGradient.addColorStop(0, "rgba(255, 233, 198, 0.94)");
    paperGradient.addColorStop(1, "rgba(216, 188, 144, 0.92)");
    ctx.fillStyle = paperGradient;
    ctx.fillRect(70, 58, WORLD.width - 140, 238);

    ctx.fillStyle = "rgba(86, 38, 22, 0.82)";
    for (let x = 108; x < WORLD.width - 80; x += 118) {
        ctx.fillRect(x, 58, 10, 238);
    }
    for (let y = 116; y < 296; y += 64) {
        ctx.fillRect(70, y, WORLD.width - 140, 8);
    }

    ctx.fillStyle = "rgba(255, 169, 88, 0.25)";
    ctx.beginPath();
    ctx.arc(WORLD.width / 2, 164, 88, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(48, 22, 15, 0.66)";
    ctx.fillRect(0, 0, WORLD.width, 48);
    ctx.fillRect(0, 304, WORLD.width, 18);

    const floorGradient = ctx.createLinearGradient(0, 322, 0, WORLD.height);
    floorGradient.addColorStop(0, "#794422");
    floorGradient.addColorStop(1, "#1c0d07");
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, 322, WORLD.width, WORLD.height - 322);

    ctx.strokeStyle = "rgba(255, 212, 160, 0.1)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= WORLD.width; x += 54) {
        ctx.beginPath();
        ctx.moveTo(x, 322);
        ctx.lineTo(x - 34, WORLD.height);
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 214, 164, 0.1)";
    for (let y = 352; y < WORLD.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD.width, y);
        ctx.stroke();
    }

    drawLantern(150, 102);
    drawLantern(WORLD.width - 150, 102);

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, WORLD.floorY + 4, WORLD.width, WORLD.height - WORLD.floorY);
}

function drawLantern(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(72, 34, 20, 0.88)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(0, -10);
    ctx.stroke();

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 42);
    glow.addColorStop(0, "rgba(255, 225, 160, 0.72)");
    glow.addColorStop(1, "rgba(255, 225, 160, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 12, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(248, 214, 156, 0.92)";
    ctx.strokeStyle = "rgba(92, 42, 25, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(18, -2);
    ctx.lineTo(24, 24);
    ctx.lineTo(18, 42);
    ctx.lineTo(-18, 42);
    ctx.lineTo(-24, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function buildPose(fighter) {
    // Procedural poses let the silhouettes animate like sprite states without image assets.
    const time = fighter.stateTime;
    const face = fighter.facing;
    const side = (value) => value * face;

    let hip = { x: fighter.x, y: fighter.y - 58 };
    let shoulder = { x: fighter.x + side(2), y: fighter.y - 106 };
    let head = { x: shoulder.x + side(1), y: shoulder.y - 24, radius: 16 };

    let frontArm = { elbow: { x: side(16), y: 24 }, hand: { x: side(20), y: 52 } };
    let backArm = { elbow: { x: side(-14), y: 22 }, hand: { x: side(-18), y: 50 } };
    let frontLeg = { knee: { x: side(12), y: 30 }, foot: { x: side(10), y: 68 } };
    let backLeg = { knee: { x: side(-12), y: 32 }, foot: { x: side(-8), y: 68 } };

    if (fighter.animationState === "idle") {
        const sway = Math.sin(time * 3.4);
        hip.y += sway * 1.5;
        shoulder.y += sway * 1.5;
        shoulder.x += side(sway * 1.5);
        frontArm = { elbow: { x: side(15), y: 24 + sway }, hand: { x: side(20), y: 52 + sway * 1.4 } };
        backArm = { elbow: { x: side(-14), y: 24 - sway }, hand: { x: side(-18), y: 50 - sway } };
    }

    if (fighter.animationState === "walk") {
        const stride = Math.sin(time * 11);
        const lift = Math.cos(time * 11);
        hip.y += Math.abs(stride) * 2;
        shoulder.x += side(5);

        frontArm = {
            elbow: { x: side(12 - stride * 16), y: 22 + Math.max(0, -lift) * 4 },
            hand: { x: side(16 - stride * 24), y: 52 + Math.max(0, -lift) * 4 }
        };
        backArm = {
            elbow: { x: side(-12 + stride * 16), y: 22 + Math.max(0, lift) * 4 },
            hand: { x: side(-16 + stride * 24), y: 52 + Math.max(0, lift) * 4 }
        };
        frontLeg = {
            knee: { x: side(10 + stride * 16), y: 30 - Math.max(0, lift) * 5 },
            foot: { x: side(10 + stride * 30), y: 68 - Math.max(0, lift) * 10 }
        };
        backLeg = {
            knee: { x: side(-10 - stride * 16), y: 30 - Math.max(0, -lift) * 5 },
            foot: { x: side(-10 - stride * 30), y: 68 - Math.max(0, -lift) * 10 }
        };
    }

    if (fighter.animationState === "jump") {
        hip.y -= 10;
        shoulder.y -= 14;
        head.y -= 16;
        frontArm = { elbow: { x: side(16), y: 18 }, hand: { x: side(10), y: -4 } };
        backArm = { elbow: { x: side(-16), y: 18 }, hand: { x: side(-10), y: -6 } };
        frontLeg = { knee: { x: side(14), y: 24 }, foot: { x: side(22), y: 46 } };
        backLeg = { knee: { x: side(-12), y: 28 }, foot: { x: side(-18), y: 48 } };
    }

    if (fighter.animationState === "crouch") {
        hip.y += 14;
        shoulder.y += 24;
        head.y += 24;
        shoulder.x += side(10);
        frontArm = { elbow: { x: side(18), y: 22 }, hand: { x: side(24), y: 44 } };
        backArm = { elbow: { x: side(-10), y: 22 }, hand: { x: side(-14), y: 42 } };
        frontLeg = { knee: { x: side(18), y: 22 }, foot: { x: side(22), y: 44 } };
        backLeg = { knee: { x: side(-16), y: 22 }, foot: { x: side(-18), y: 44 } };
    }

    if (fighter.animationState === "punch") {
        const progress = fighter.currentAttack
            ? clamp(fighter.currentAttack.elapsed / ATTACKS.punch.duration, 0, 1)
            : 1;
        const extend = pulse(progress);
        shoulder.x += side(8 * extend);
        frontArm = {
            elbow: { x: side(18 + extend * 16), y: 20 - extend * 8 },
            hand: { x: side(24 + extend * 52), y: 48 - extend * 22 }
        };
        backArm = { elbow: { x: side(-14), y: 24 }, hand: { x: side(-18), y: 46 } };
        frontLeg = { knee: { x: side(14 + extend * 8), y: 30 }, foot: { x: side(12 + extend * 10), y: 68 } };
        backLeg = { knee: { x: side(-12), y: 32 }, foot: { x: side(-8), y: 68 } };
    }

    if (fighter.animationState === "kick") {
        const progress = fighter.currentAttack
            ? clamp(fighter.currentAttack.elapsed / ATTACKS.kick.duration, 0, 1)
            : 1;
        const extend = pulse(progress);
        shoulder.x += side(-8 * extend);
        frontArm = { elbow: { x: side(12), y: 20 }, hand: { x: side(10), y: 46 } };
        backArm = { elbow: { x: side(-18), y: 18 }, hand: { x: side(-28), y: 38 } };
        frontLeg = {
            knee: { x: side(14 + extend * 20), y: 28 - extend * 10 },
            foot: { x: side(14 + extend * 72), y: 68 - extend * 40 }
        };
        backLeg = { knee: { x: side(-14), y: 34 }, foot: { x: side(-8), y: 68 } };
    }

    if (fighter.animationState === "hit") {
        shoulder.x += side(-12);
        head.x += side(-14);
        frontArm = { elbow: { x: side(6), y: 16 }, hand: { x: side(-2), y: 42 } };
        backArm = { elbow: { x: side(-18), y: 14 }, hand: { x: side(-28), y: 38 } };
        frontLeg = { knee: { x: side(10), y: 30 }, foot: { x: side(14), y: 68 } };
        backLeg = { knee: { x: side(-14), y: 32 }, foot: { x: side(-16), y: 68 } };
    }

    const toAbsolute = (origin, part) => ({
        x: origin.x + part.x,
        y: origin.y + part.y
    });

    return {
        head,
        shoulder,
        hip,
        frontArm: {
            elbow: toAbsolute(shoulder, frontArm.elbow),
            hand: toAbsolute(shoulder, frontArm.hand)
        },
        backArm: {
            elbow: toAbsolute(shoulder, backArm.elbow),
            hand: toAbsolute(shoulder, backArm.hand)
        },
        frontLeg: {
            knee: toAbsolute(hip, frontLeg.knee),
            foot: toAbsolute(hip, frontLeg.foot)
        },
        backLeg: {
            knee: toAbsolute(hip, backLeg.knee),
            foot: toAbsolute(hip, backLeg.foot)
        }
    };
}

function drawLimb(start, middle, end, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(middle.x, middle.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

function drawFighter(fighter) {
    const pose = buildPose(fighter);
    const brightFlash = fighter.flashTimer > 0 && Math.floor(fighter.flashTimer * 48) % 2 === 0;
    const frontColor = brightFlash ? "rgba(255, 239, 204, 0.95)" : "#070707";
    const backColor = brightFlash ? "rgba(180, 170, 145, 0.7)" : "rgba(7, 7, 7, 0.72)";

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(fighter.x, WORLD.floorY + 8, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 10;

    drawLimb(pose.shoulder, pose.backArm.elbow, pose.backArm.hand, backColor, 12);
    drawLimb(pose.hip, pose.backLeg.knee, pose.backLeg.foot, backColor, 14);

    ctx.strokeStyle = frontColor;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(pose.shoulder.x, pose.shoulder.y);
    ctx.lineTo(pose.hip.x, pose.hip.y);
    ctx.stroke();

    drawLimb(pose.shoulder, pose.frontArm.elbow, pose.frontArm.hand, frontColor, 14);
    drawLimb(pose.hip, pose.frontLeg.knee, pose.frontLeg.foot, frontColor, 16);

    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.arc(pose.head.x, pose.head.y, pose.head.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pose.frontArm.hand.x, pose.frontArm.hand.y, 7, 0, Math.PI * 2);
    ctx.arc(pose.frontLeg.foot.x, pose.frontLeg.foot.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawEffects() {
    ctx.save();
    for (const effect of gameState.hitEffects) {
        const alpha = effect.life / effect.maxLife;
        const radius = effect.size * (2 - alpha);

        ctx.globalCompositeOperation = "screen";
        const flash = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        flash.addColorStop(0, `rgba(255, 248, 220, ${alpha})`);
        flash.addColorStop(0.45, `rgba(255, 183, 94, ${alpha * 0.7})`);
        flash.addColorStop(1, "rgba(255, 183, 94, 0)");

        ctx.fillStyle = flash;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPauseLabel() {
    if (!gameState.paused || gameState.roundOver) {
        return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(16, 10, 8, 0.42)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "rgba(255, 238, 214, 0.94)";
    ctx.textAlign = "center";
    ctx.font = '700 40px Georgia, "Times New Roman", serif';
    ctx.fillText("Paused", WORLD.width / 2, 120);
    ctx.font = '20px Georgia, "Times New Roman", serif';
    ctx.fillText("Press P to resume", WORLD.width / 2, 152);
    ctx.restore();
}

function render() {
    // Background first, then fighters, then impact flashes and pause overlay.
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    drawBackground();
    drawFighter(player);
    drawFighter(enemy);
    drawEffects();
    drawPauseLabel();
}

function gameLoop(timestamp) {
    if (!gameState.lastTime) {
        gameState.lastTime = timestamp;
    }

    const dt = Math.min((timestamp - gameState.lastTime) / 1000, 0.033);
    gameState.lastTime = timestamp;

    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

function handleKeyChange(event, isPressed) {
    // Queue one-shot actions on keydown so attacks and jumps do not repeat every frame.
    const key = event.key.toLowerCase();
    const trackedKeys = ["a", "d", "w", "s", "j", "k", "p"];

    if (trackedKeys.includes(key)) {
        event.preventDefault();
    }

    if (key === "a") {
        inputState.left = isPressed;
    }

    if (key === "d") {
        inputState.right = isPressed;
    }

    if (key === "s") {
        inputState.crouch = isPressed;
    }

    if (!isPressed || event.repeat) {
        return;
    }

    if (key === "w") {
        actionQueue.jump = true;
    }

    if (key === "j") {
        actionQueue.punch = true;
    }

    if (key === "k") {
        actionQueue.kick = true;
    }

    if (key === "p") {
        togglePause();
    }
}

window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));

restartButton.addEventListener("click", () => {
    gameState.lastTime = 0;
    resetGame();
});

resetGame();
requestAnimationFrame(gameLoop);
