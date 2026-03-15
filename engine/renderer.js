(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;

    class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
            this.width = canvas.width;
            this.height = canvas.height;
            this.time = 0;
            this.shake = {
                time: 0,
                strength: 0
            };
        }

        update(dt) {
            this.time += dt;
            this.shake.time = Math.max(0, this.shake.time - dt);
        }

        addShake(strength, duration) {
            this.shake.strength = Math.max(this.shake.strength, strength);
            this.shake.time = Math.max(this.shake.time, duration);
        }

        render(state) {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            ctx.save();
            if (this.shake.time > 0) {
                const intensity = this.shake.strength * (this.shake.time / 0.18);
                ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
            }

            this.drawBackground(state);
            this.drawProjectiles(state.projectiles || []);
            this.drawFighter(state.opponent, state.player);
            this.drawFighter(state.player, state.opponent);
            state.particles.render(ctx);
            this.drawForeground(state);
            ctx.restore();

            state.hud.draw(ctx, state);
            this.drawRoundText(state);
        }

        drawBackground(state) {
            const ctx = this.ctx;
            const stage = state.stage || { id: "dojo", palette: { skyTop: "#e4b56b", skyMid: "#bf7f47", floorTop: "#7b4525", floorBottom: "#1b0c07", accent: "#f7d8a6" } };
            const pulse = Math.sin(this.time * 0.7) * 0.5 + 0.5;
            const palette = stage.palette;
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, palette.skyTop);
            gradient.addColorStop(0.45, palette.skyMid);
            gradient.addColorStop(1, palette.floorBottom);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.fillStyle = `rgba(255, 245, 228, ${0.06 + pulse * 0.04})`;
            for (let index = 0; index < 3; index += 1) {
                const x = ((this.time * (22 + index * 4)) + index * 420) % (this.width + 320) - 160;
                ctx.beginPath();
                ctx.ellipse(x, 180 + index * 42, 160, 32, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            this.drawStageSet(stage);
            this.drawFloor(palette);
        }

        drawStageSet(stage) {
            const ctx = this.ctx;
            const accent = stage.palette.accent;
            const alpha = 0.18 + (Math.sin(this.time * 1.2) * 0.5 + 0.5) * 0.08;

            if (stage.id === "dojo") {
                ctx.fillStyle = "rgba(255, 238, 210, 0.88)";
                ctx.fillRect(110, 84, this.width - 220, 300);
                ctx.fillStyle = "rgba(94, 45, 27, 0.72)";
                for (let x = 152; x < this.width - 120; x += 128) {
                    ctx.fillRect(x, 84, 12, 300);
                }
                for (let y = 148; y < 344; y += 70) {
                    ctx.fillRect(110, y, this.width - 220, 8);
                }
                ctx.fillStyle = `rgba(255, 178, 94, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.width / 2, 205, 110, 0, Math.PI * 2);
                ctx.fill();
                for (const anchorX of [170, this.width - 170]) {
                    this.drawLantern(anchorX, 122, accent);
                }
                return;
            }

            if (stage.id === "forest_temple") {
                ctx.fillStyle = "rgba(22, 30, 18, 0.48)";
                for (let x = 60; x < this.width; x += 150) {
                    ctx.fillRect(x, 140, 18, 300);
                    ctx.beginPath();
                    ctx.arc(x + 8, 120, 54, 0, Math.PI * 2);
                    ctx.arc(x + 48, 132, 42, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = "rgba(202, 226, 164, 0.2)";
                ctx.lineWidth = 6;
                ctx.strokeRect(180, 120, this.width - 360, 220);
                ctx.fillStyle = "rgba(210, 200, 156, 0.24)";
                ctx.fillRect(240, 160, this.width - 480, 120);
                return;
            }

            if (stage.id === "mountain_fortress") {
                ctx.fillStyle = "rgba(18, 20, 27, 0.46)";
                for (let x = 0; x < this.width; x += 220) {
                    ctx.beginPath();
                    ctx.moveTo(x, 360);
                    ctx.lineTo(x + 110, 110);
                    ctx.lineTo(x + 220, 360);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.fillStyle = "rgba(205, 214, 224, 0.18)";
                ctx.fillRect(140, 126, this.width - 280, 180);
                return;
            }

            if (stage.id === "dark_castle") {
                ctx.fillStyle = "rgba(24, 16, 33, 0.56)";
                ctx.fillRect(180, 90, this.width - 360, 280);
                for (let x = 260; x < this.width - 200; x += 170) {
                    ctx.fillRect(x, 60, 42, 110);
                    ctx.fillRect(x + 12, 110, 18, 40);
                }
                ctx.fillStyle = `rgba(226, 185, 248, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.width / 2, 160, 70, 0, Math.PI * 2);
                ctx.fill();
                return;
            }

            if (stage.id === "shadow_realm") {
                ctx.fillStyle = "rgba(15, 10, 26, 0.55)";
                for (let index = 0; index < 7; index += 1) {
                    const x = 120 + index * 160;
                    ctx.beginPath();
                    ctx.moveTo(x, 380);
                    ctx.lineTo(x + 42, 150);
                    ctx.lineTo(x + 84, 380);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.strokeStyle = `rgba(155, 178, 255, ${alpha})`;
                ctx.lineWidth = 3;
                for (let index = 0; index < 5; index += 1) {
                    ctx.beginPath();
                    ctx.arc(180 + index * 220, 170 + Math.sin(this.time + index) * 16, 28, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        drawLantern(x, y, accent) {
            const ctx = this.ctx;
            const sway = Math.sin(this.time * 1.2 + x * 0.02) * 8;
            ctx.save();
            ctx.translate(x + sway, y);
            ctx.strokeStyle = "rgba(64, 26, 14, 0.9)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -52);
            ctx.lineTo(0, -14);
            ctx.stroke();

            const glow = ctx.createRadialGradient(0, 14, 0, 0, 14, 46);
            glow.addColorStop(0, accent.replace(")", ", 0.38)").replace("rgb", "rgba"));
            glow.addColorStop(1, "rgba(255, 232, 178, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 14, 46, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(248, 218, 166, 0.95)";
            ctx.strokeStyle = "rgba(92, 42, 25, 0.92)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(20, 0);
            ctx.lineTo(26, 24);
            ctx.lineTo(20, 46);
            ctx.lineTo(-20, 46);
            ctx.lineTo(-26, 24);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        drawFloor(palette) {
            const ctx = this.ctx;
            const floor = ctx.createLinearGradient(0, 408, 0, this.height);
            floor.addColorStop(0, palette.floorTop);
            floor.addColorStop(1, palette.floorBottom);
            ctx.fillStyle = floor;
            ctx.fillRect(0, 408, this.width, this.height - 408);

            ctx.strokeStyle = "rgba(255, 220, 170, 0.08)";
            ctx.lineWidth = 2;
            for (let x = 0; x <= this.width; x += 58) {
                ctx.beginPath();
                ctx.moveTo(x, 408);
                ctx.lineTo(x - 36, this.height);
                ctx.stroke();
            }

            for (let y = 446; y < this.height; y += 36) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
        }

        drawProjectiles(projectiles) {
            const ctx = this.ctx;
            for (const projectile of projectiles) {
                ctx.save();
                ctx.globalAlpha = clamp(projectile.life / projectile.maxLife, 0, 1);

                if (projectile.visual === "fireball") {
                    const glow = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, 28);
                    glow.addColorStop(0, "rgba(255, 240, 190, 0.9)");
                    glow.addColorStop(0.45, "rgba(255, 148, 92, 0.7)");
                    glow.addColorStop(1, "rgba(255, 148, 92, 0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(projectile.x, projectile.y, 28, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (projectile.visual === "lightning_strike") {
                    ctx.strokeStyle = "rgba(214, 232, 255, 0.95)";
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(projectile.x, projectile.y - 150);
                    ctx.lineTo(projectile.x - 14, projectile.y - 70);
                    ctx.lineTo(projectile.x + 18, projectile.y - 20);
                    ctx.lineTo(projectile.x - 8, projectile.y + 60);
                    ctx.lineTo(projectile.x + 12, projectile.y + 110);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = projectile.color || "#ffffff";
                    ctx.beginPath();
                    if (projectile.visual === "hunter_bow") {
                        ctx.ellipse(projectile.x, projectile.y, 16, 4, Math.atan2(projectile.vy, projectile.vx), 0, Math.PI * 2);
                    } else if (projectile.visual === "throwing_knives") {
                        ctx.rect(projectile.x - 10, projectile.y - 3, 20, 6);
                    } else {
                        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                    }
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        drawFighter(fighter, opponent) {
            if (!fighter) {
                return;
            }

            const ctx = this.ctx;
            const pose = this.buildPose(fighter);
            const appearance = fighter.getAppearance();
            const rim = fighter.isBoss && fighter.rage
                ? "rgba(255, 120, 90, 0.36)"
                : fighter.shieldTimer > 0
                    ? "rgba(137, 226, 211, 0.36)"
                    : "rgba(255, 240, 208, 0.08)";

            ctx.save();
            ctx.shadowColor = rim;
            ctx.shadowBlur = fighter.isBoss || fighter.shieldTimer > 0 ? 24 : 10;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            if (fighter.teleportFlash > 0) {
                ctx.globalAlpha = 0.65 + fighter.teleportFlash;
            }

            ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
            ctx.beginPath();
            ctx.ellipse(fighter.x, fighter.groundY + 10, fighter.isBoss ? 56 : 42, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            this.drawLimb(pose.shoulder, pose.backArm.elbow, pose.backArm.hand, "#080808", 12);
            this.drawLimb(pose.hip, pose.backLeg.knee, pose.backLeg.foot, "#080808", 14);

            ctx.strokeStyle = "#050505";
            ctx.lineWidth = fighter.isBoss ? 22 : 18;
            ctx.beginPath();
            ctx.moveTo(pose.shoulder.x, pose.shoulder.y);
            ctx.lineTo(pose.hip.x, pose.hip.y);
            ctx.stroke();

            this.drawArmor(appearance, pose, fighter);

            this.drawLimb(pose.shoulder, pose.frontArm.elbow, pose.frontArm.hand, "#050505", 14);
            this.drawLimb(pose.hip, pose.frontLeg.knee, pose.frontLeg.foot, "#050505", 16);

            ctx.fillStyle = "#050505";
            ctx.beginPath();
            ctx.arc(pose.head.x, pose.head.y, fighter.isBoss ? 20 : 16, 0, Math.PI * 2);
            ctx.fill();

            this.drawWeaponTrail(fighter, pose);
            this.drawWeapon(fighter, pose, opponent);
            if (fighter.shieldTimer > 0) {
                this.drawShield(fighter);
            }
            ctx.restore();
        }

        drawArmor(appearance, pose, fighter) {
            const ctx = this.ctx;
            const helmetColor = appearance.helmet ? appearance.helmet.color : appearance.accent;
            const armorColor = appearance.armor ? appearance.armor.color : appearance.accent;
            const bootColor = appearance.boots ? appearance.boots.color : appearance.accent;
            const gloveColor = appearance.gloves ? appearance.gloves.color : appearance.accent;
            const face = fighter.facing;

            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.arc(pose.head.x, pose.head.y - 4, fighter.isBoss ? 14 : 12, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = armorColor;
            ctx.lineWidth = fighter.isBoss ? 8 : 6;
            ctx.beginPath();
            ctx.moveTo(pose.shoulder.x, pose.shoulder.y + 12);
            ctx.lineTo(pose.hip.x, pose.hip.y - 12);
            ctx.stroke();

            ctx.strokeStyle = gloveColor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(pose.frontArm.hand.x, pose.frontArm.hand.y);
            ctx.lineTo(pose.frontArm.hand.x + 8 * face, pose.frontArm.hand.y - 4);
            ctx.stroke();

            ctx.strokeStyle = bootColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(pose.frontLeg.foot.x - 12 * face, pose.frontLeg.foot.y);
            ctx.lineTo(pose.frontLeg.foot.x + 8 * face, pose.frontLeg.foot.y);
            ctx.moveTo(pose.backLeg.foot.x - 12 * face, pose.backLeg.foot.y);
            ctx.lineTo(pose.backLeg.foot.x + 8 * face, pose.backLeg.foot.y);
            ctx.stroke();
        }

        drawShield(fighter) {
            const ctx = this.ctx;
            const radius = fighter.isBoss ? 68 : 54;
            ctx.strokeStyle = "rgba(137, 226, 211, 0.45)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(fighter.x, fighter.y - 96, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        buildPose(fighter) {
            const face = fighter.facing;
            const side = (value) => value * face;
            const baseTime = fighter.stateTime;

            let hip = { x: fighter.x, y: fighter.y - (fighter.isBoss ? 72 : 58) };
            let shoulder = { x: fighter.x + side(2), y: fighter.y - (fighter.isBoss ? 132 : 108) };
            let head = { x: shoulder.x, y: shoulder.y - 28 };
            let frontArm = { elbow: { x: side(18), y: 26 }, hand: { x: side(24), y: 56 } };
            let backArm = { elbow: { x: side(-14), y: 24 }, hand: { x: side(-18), y: 52 } };
            let frontLeg = { knee: { x: side(12), y: 34 }, foot: { x: side(12), y: 74 } };
            let backLeg = { knee: { x: side(-12), y: 34 }, foot: { x: side(-10), y: 74 } };

            if (fighter.state === "walk") {
                const stride = Math.sin(baseTime * 11);
                frontArm.hand.x = side(26 - stride * 30);
                backArm.hand.x = side(-20 + stride * 28);
                frontLeg.foot.x = side(12 + stride * 32);
                backLeg.foot.x = side(-10 - stride * 32);
            } else if (fighter.state === "jump") {
                hip.y -= 12;
                shoulder.y -= 16;
                head.y -= 18;
                frontArm.hand = { x: side(10), y: -6 };
                backArm.hand = { x: side(-10), y: -6 };
                frontLeg.foot = { x: side(24), y: 54 };
                backLeg.foot = { x: side(-18), y: 54 };
            } else if (fighter.state === "crouch" || fighter.state === "block") {
                hip.y += 18;
                shoulder.y += 24;
                head.y += 24;
                frontLeg.foot = { x: side(24), y: 42 };
                backLeg.foot = { x: side(-18), y: 42 };
                if (fighter.state === "block") {
                    frontArm.hand = { x: side(12), y: 20 };
                    backArm.hand = { x: side(-4), y: 26 };
                }
            } else if (fighter.state === "punch") {
                const extend = clamp(fighter.attackProgress * 1.6, 0, 1);
                frontArm.hand = { x: side(30 + extend * 72), y: 38 - extend * 18 };
            } else if (fighter.state === "kick") {
                const extend = clamp(fighter.attackProgress * 1.4, 0, 1);
                frontLeg.foot = { x: side(18 + extend * 86), y: 72 - extend * 42 };
            } else if (fighter.state === "weapon") {
                const extend = clamp(fighter.attackProgress * 1.25, 0, 1);
                frontArm.hand = { x: side(32 + extend * 56), y: 24 - extend * 30 };
                backArm.hand = { x: side(4 + extend * 14), y: 34 - extend * 8 };
            } else if (fighter.state === "ranged" || fighter.state === "magic") {
                const lift = clamp(fighter.attackProgress * 1.1, 0, 1);
                frontArm.hand = { x: side(26 + lift * 44), y: 18 - lift * 30 };
                backArm.hand = { x: side(-6 + lift * 10), y: 26 - lift * 12 };
            } else if (fighter.state === "hit") {
                shoulder.x -= side(12);
                head.x -= side(16);
            } else if (fighter.state === "knockdown") {
                head.y += 40;
                shoulder.y += 50;
                hip.y += 52;
                frontLeg.foot = { x: side(48), y: 44 };
                backLeg.foot = { x: side(-50), y: 50 };
            }

            const toAbs = (origin, point) => ({
                x: origin.x + point.x,
                y: origin.y + point.y
            });

            return {
                head,
                shoulder,
                hip,
                frontArm: {
                    elbow: toAbs(shoulder, frontArm.elbow),
                    hand: toAbs(shoulder, frontArm.hand)
                },
                backArm: {
                    elbow: toAbs(shoulder, backArm.elbow),
                    hand: toAbs(shoulder, backArm.hand)
                },
                frontLeg: {
                    knee: toAbs(hip, frontLeg.knee),
                    foot: toAbs(hip, frontLeg.foot)
                },
                backLeg: {
                    knee: toAbs(hip, backLeg.knee),
                    foot: toAbs(hip, backLeg.foot)
                }
            };
        }

        drawLimb(start, middle, end, color, width) {
            const ctx = this.ctx;
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(middle.x, middle.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }

        drawWeaponTrail(fighter, pose) {
            const ctx = this.ctx;
            if (fighter.state !== "weapon" || !fighter.weapon) {
                return;
            }
            ctx.save();
            ctx.globalAlpha = 0.18 + fighter.attackProgress * 0.2;
            ctx.strokeStyle = fighter.weapon.color;
            ctx.lineWidth = fighter.weapon.category === "axe" ? 18 : 12;
            ctx.beginPath();
            ctx.arc(
                pose.frontArm.hand.x - fighter.facing * 12,
                pose.frontArm.hand.y - 10,
                32 + fighter.attackProgress * 34,
                fighter.facing === 1 ? -1.2 : -2.2,
                fighter.facing === 1 ? 0.3 : -0.7
            );
            ctx.stroke();
            ctx.restore();
        }

        drawWeapon(fighter, pose) {
            const ctx = this.ctx;
            const start = pose.frontArm.hand;
            const face = fighter.facing;
            const weapon = fighter.weapon;
            if (!weapon) {
                return;
            }

            ctx.save();
            ctx.strokeStyle = fighter.isBoss && fighter.rage ? "#d95541" : weapon.color;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 4;

            if (weapon.category === "sword") {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(start.x + 56 * face * (1 + fighter.attackProgress * 0.2), start.y - 34);
                ctx.stroke();
            } else if (weapon.category === "spear") {
                ctx.beginPath();
                ctx.moveTo(start.x - 24 * face, start.y + 10);
                ctx.lineTo(start.x + 84 * face * (1 + fighter.attackProgress * 0.16), start.y - 30);
                ctx.stroke();
            } else if (weapon.category === "axe") {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(start.x + 46 * face, start.y - 42);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(start.x + 26 * face, start.y - 36);
                ctx.lineTo(start.x + 54 * face, start.y - 12);
                ctx.lineTo(start.x + 16 * face, start.y - 2);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        drawForeground(state) {
            const ctx = this.ctx;
            if (state.stage && state.stage.id === "forest_temple") {
                ctx.fillStyle = "rgba(16, 24, 12, 0.2)";
                ctx.fillRect(0, 0, 80, this.height);
                ctx.fillRect(this.width - 80, 0, 80, this.height);
            }
        }

        drawRoundText(state) {
            const ctx = this.ctx;
            if (state.roundIntroTimer <= 0) {
                return;
            }

            const alpha = clamp(state.roundIntroTimer / state.roundIntroDuration, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "rgba(12, 8, 6, 0.32)";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = "rgba(255, 241, 216, 0.96)";
            ctx.textAlign = "center";
            ctx.font = '700 52px Georgia, "Times New Roman", serif';
            ctx.fillText(state.introText, this.width / 2, 170);
            if (state.stage) {
                ctx.font = '22px Georgia, "Times New Roman", serif';
                ctx.fillText(state.stage.name, this.width / 2, 204);
            }
            ctx.restore();
        }
    }

    SF.engine.Renderer = Renderer;
})();
