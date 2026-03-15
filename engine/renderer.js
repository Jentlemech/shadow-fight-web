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
            this.drawFighter(state.opponent, state.player);
            this.drawFighter(state.player, state.opponent);
            state.particles.render(ctx);
            ctx.restore();

            state.hud.draw(ctx, state);
            this.drawRoundText(state);
        }

        drawBackground(state) {
            const ctx = this.ctx;
            const pulse = Math.sin(this.time * 0.6) * 0.5 + 0.5;
            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, "#e4b56b");
            gradient.addColorStop(0.42, "#bf7f47");
            gradient.addColorStop(0.8, "#532617");
            gradient.addColorStop(1, "#170d08");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.fillStyle = "rgba(255, 238, 210, 0.88)";
            ctx.fillRect(110, 84, this.width - 220, 300);
            ctx.fillStyle = "rgba(94, 45, 27, 0.72)";
            for (let x = 152; x < this.width - 120; x += 128) {
                ctx.fillRect(x, 84, 12, 300);
            }
            for (let y = 148; y < 344; y += 70) {
                ctx.fillRect(110, y, this.width - 220, 8);
            }

            ctx.fillStyle = `rgba(255, 178, 94, ${0.18 + pulse * 0.08})`;
            ctx.beginPath();
            ctx.arc(this.width / 2, 205, 110, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#40211a";
            ctx.fillRect(0, 0, this.width, 52);
            ctx.fillRect(0, 386, this.width, 22);

            for (const anchorX of [170, this.width - 170]) {
                this.drawLantern(anchorX, 122, pulse);
            }

            const floor = ctx.createLinearGradient(0, 408, 0, this.height);
            floor.addColorStop(0, "#7b4525");
            floor.addColorStop(1, "#1b0c07");
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

            ctx.fillStyle = `rgba(255, 245, 228, ${0.08 + pulse * 0.04})`;
            for (let i = 0; i < 3; i += 1) {
                const x = ((this.time * 24) + i * 420) % (this.width + 320) - 160;
                ctx.beginPath();
                ctx.ellipse(x, 200 + i * 40, 160, 36, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawLantern(x, y, pulse) {
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
            glow.addColorStop(0, `rgba(255, 232, 178, ${0.38 + pulse * 0.16})`);
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

        drawFighter(fighter, opponent) {
            if (!fighter) {
                return;
            }

            const ctx = this.ctx;
            const pose = this.buildPose(fighter);
            const rim = fighter.isBoss && fighter.rage
                ? "rgba(255, 120, 90, 0.36)"
                : "rgba(255, 240, 208, 0.08)";

            ctx.save();
            ctx.shadowColor = rim;
            ctx.shadowBlur = fighter.isBoss ? 26 : 10;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
            ctx.beginPath();
            ctx.ellipse(fighter.x, fighter.groundY + 10, fighter.isBoss ? 54 : 42, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            this.drawLimb(pose.shoulder, pose.backArm.elbow, pose.backArm.hand, "#080808", 12);
            this.drawLimb(pose.hip, pose.backLeg.knee, pose.backLeg.foot, "#080808", 14);

            ctx.strokeStyle = "#050505";
            ctx.lineWidth = fighter.isBoss ? 22 : 18;
            ctx.beginPath();
            ctx.moveTo(pose.shoulder.x, pose.shoulder.y);
            ctx.lineTo(pose.hip.x, pose.hip.y);
            ctx.stroke();

            this.drawLimb(pose.shoulder, pose.frontArm.elbow, pose.frontArm.hand, "#050505", 14);
            this.drawLimb(pose.hip, pose.frontLeg.knee, pose.frontLeg.foot, "#050505", 16);

            ctx.fillStyle = "#050505";
            ctx.beginPath();
            ctx.arc(pose.head.x, pose.head.y, fighter.isBoss ? 20 : 16, 0, Math.PI * 2);
            ctx.fill();

            this.drawWeapon(fighter, pose, opponent);
            ctx.restore();
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
                frontArm.hand = { x: side(32 + extend * 48), y: 24 - extend * 30 };
                backArm.hand = { x: side(4 + extend * 14), y: 34 - extend * 8 };
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

        drawWeapon(fighter, pose) {
            const ctx = this.ctx;
            const attackScale = fighter.state === "weapon" ? 1 + fighter.attackProgress * 0.25 : 1;
            const start = pose.frontArm.hand;
            const face = fighter.facing;
            const weapon = fighter.weapon;
            if (!weapon) {
                return;
            }

            ctx.save();
            ctx.strokeStyle = fighter.isBoss && fighter.rage ? "#d95541" : "#c7d5e0";
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 4;

            if (weapon.id === "sword") {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(start.x + 56 * face * attackScale, start.y - 34);
                ctx.stroke();
            } else if (weapon.id === "staff") {
                ctx.beginPath();
                ctx.moveTo(start.x - 24 * face, start.y + 10);
                ctx.lineTo(start.x + 70 * face * attackScale, start.y - 30);
                ctx.stroke();
            } else if (weapon.id === "nunchaku") {
                ctx.beginPath();
                ctx.arc(start.x + 20 * face, start.y - 12, 18 + fighter.attackProgress * 20, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
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
            ctx.font = '700 54px Georgia, "Times New Roman", serif';
            ctx.fillText(state.introText, this.width / 2, 170);
            ctx.restore();
        }
    }

    SF.engine.Renderer = Renderer;
})();
