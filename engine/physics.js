(function () {
    const SF = window.ShadowFight;
    const { clamp, approach } = SF.utils;

    class PhysicsSystem {
        updateFighter(fighter, input, world, dt, hooks) {
            const wasGrounded = fighter.grounded;
            fighter.updateTimers(dt);

            const canMove = fighter.canMove();
            const targetSpeed = canMove ? input.moveX * fighter.stats.moveSpeed : 0;
            const acceleration = fighter.grounded ? 2400 : 1300;
            fighter.vx = approach(fighter.vx, targetSpeed, acceleration * dt);

            if (input.jumpPressed && fighter.canJump()) {
                fighter.grounded = false;
                fighter.vy = -fighter.stats.jumpStrength;
                fighter.setState("jump");
            }

            if (!fighter.grounded) {
                fighter.vy += world.gravity * fighter.gravityScale * dt;
            }

            if (fighter.dodgeTimer > 0) {
                fighter.vx = fighter.dodgeDirection * fighter.stats.moveSpeed * 1.8;
            }

            fighter.x += fighter.vx * dt;
            fighter.y += fighter.vy * dt;

            if (fighter.y >= world.groundY) {
                fighter.y = world.groundY;
                if (!fighter.grounded && Math.abs(fighter.vy) > 120 && hooks && hooks.onLand) {
                    hooks.onLand(fighter);
                }
                fighter.vy = 0;
                fighter.grounded = true;
            }

            fighter.x = clamp(fighter.x, world.leftBound, world.rightBound);

            if (fighter.stamina < fighter.stats.maxStamina && fighter.canRecoverStamina()) {
                fighter.stamina = clamp(
                    fighter.stamina + fighter.stats.staminaRecovery * dt,
                    0,
                    fighter.stats.maxStamina
                );
            }

            if (!canMove && fighter.grounded && fighter.state === "knockdown" && fighter.recoveryTimer <= 0) {
                fighter.setState("idle");
            } else if (fighter.guardActive && fighter.grounded && fighter.canBlock()) {
                fighter.setState("block");
            } else if (fighter.canControlState()) {
                if (!fighter.grounded) {
                    fighter.setState("jump");
                } else if (input.crouch) {
                    fighter.setState("crouch");
                } else if (Math.abs(fighter.vx) > 18) {
                    fighter.setState("walk");
                } else {
                    fighter.setState("idle");
                }
            }

            if (!wasGrounded && fighter.grounded && hooks && hooks.onPostLand) {
                hooks.onPostLand(fighter);
            }
        }

        applyKnockback(fighter, forceX, forceY) {
            fighter.vx = forceX;
            fighter.vy = forceY;
            fighter.grounded = false;
        }
    }

    SF.engine.PhysicsSystem = PhysicsSystem;
})();
