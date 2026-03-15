(function () {
    const SF = window.ShadowFight;
    const { clamp } = SF.utils;

    class InputManager {
        constructor(documentRef) {
            this.document = documentRef;
            this.mode = "desktop";
            this.enabled = false;
            this.keys = Object.create(null);
            this.queued = {
                jump: false,
                punch: false,
                kick: false,
                weapon: false,
                ranged: false,
                magic: false,
                switch: false,
                switchRanged: false,
                switchMagic: false,
                inventory: false,
                pause: false
            };
            this.joystick = {
                active: false,
                pointerId: null,
                x: 0,
                y: 0
            };

            this.joystickBase = documentRef.getElementById("joystickBase");
            this.joystickThumb = documentRef.getElementById("joystickThumb");
            this.touchButtons = Array.from(documentRef.querySelectorAll("[data-touch-action]"));
            this.switchButtons = {
                weapon: documentRef.getElementById("switchWeaponButton"),
                ranged: documentRef.getElementById("switchRangedButton"),
                magic: documentRef.getElementById("switchMagicButton"),
                inventory: documentRef.getElementById("inventoryToggleButton")
            };

            this.bindKeyboard();
            this.bindJoystick();
            this.bindTouchButtons();
            this.bindSideButtons();
        }

        bindKeyboard() {
            const prevented = ["a", "d", "w", "s", "j", "k", "l", "u", "i", "q", "e", "r", "p", "escape", "tab"];

            window.addEventListener("keydown", (event) => {
                const key = event.key.toLowerCase();
                if (prevented.includes(key)) {
                    event.preventDefault();
                }

                if (!this.enabled) {
                    return;
                }

                this.keys[key] = true;
                if (event.repeat) {
                    return;
                }

                if (key === "w") {
                    this.queued.jump = true;
                }
                if (key === "j") {
                    this.queued.punch = true;
                }
                if (key === "k") {
                    this.queued.kick = true;
                }
                if (key === "l") {
                    this.queued.weapon = true;
                }
                if (key === "u") {
                    this.queued.ranged = true;
                }
                if (key === "i") {
                    this.queued.magic = true;
                }
                if (key === "q") {
                    this.queued.switch = true;
                }
                if (key === "e") {
                    this.queued.switchRanged = true;
                }
                if (key === "r") {
                    this.queued.switchMagic = true;
                }
                if (key === "tab") {
                    this.queued.inventory = true;
                }
                if (key === "p" || key === "escape") {
                    this.queued.pause = true;
                }
            });

            window.addEventListener("keyup", (event) => {
                this.keys[event.key.toLowerCase()] = false;
            });

            window.addEventListener("blur", () => this.reset());
        }

        bindJoystick() {
            if (!this.joystickBase || !this.joystickThumb) {
                return;
            }

            const updateFromEvent = (event) => {
                const bounds = this.joystickBase.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const radius = bounds.width * 0.35;
                const rawX = event.clientX - centerX;
                const rawY = event.clientY - centerY;
                const distance = Math.hypot(rawX, rawY) || 1;
                const limited = Math.min(distance, radius);
                const x = (rawX / distance) * limited;
                const y = (rawY / distance) * limited;

                this.joystick.x = clamp(x / radius, -1, 1);
                this.joystick.y = clamp(y / radius, -1, 1);
                this.joystickThumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            };

            const release = () => {
                this.joystick.active = false;
                this.joystick.pointerId = null;
                this.joystick.x = 0;
                this.joystick.y = 0;
                this.joystickThumb.style.transform = "translate(-50%, -50%)";
            };

            this.joystickBase.addEventListener("pointerdown", (event) => {
                if (!this.enabled || this.mode !== "phone") {
                    return;
                }

                event.preventDefault();
                this.joystick.active = true;
                this.joystick.pointerId = event.pointerId;
                try {
                    this.joystickBase.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Pointer capture is optional.
                }
                updateFromEvent(event);
            });

            this.joystickBase.addEventListener("pointermove", (event) => {
                if (!this.joystick.active || event.pointerId !== this.joystick.pointerId) {
                    return;
                }
                updateFromEvent(event);
            });

            this.joystickBase.addEventListener("pointerup", release);
            this.joystickBase.addEventListener("pointercancel", release);
            this.joystickBase.addEventListener("lostpointercapture", release);
        }

        bindTouchButtons() {
            for (const button of this.touchButtons) {
                const action = button.dataset.touchAction;
                const release = () => button.classList.remove("is-pressed");

                button.addEventListener("pointerdown", (event) => {
                    if (!this.enabled || this.mode !== "phone") {
                        return;
                    }

                    event.preventDefault();
                    button.classList.add("is-pressed");
                    this.queueAction(action);
                });

                button.addEventListener("pointerup", release);
                button.addEventListener("pointercancel", release);
                button.addEventListener("pointerleave", release);
            }
        }

        bindSideButtons() {
            const bindings = [
                ["weapon", "switch"],
                ["ranged", "switchRanged"],
                ["magic", "switchMagic"],
                ["inventory", "inventory"]
            ];

            for (const [buttonName, action] of bindings) {
                const button = this.switchButtons[buttonName];
                if (!button) {
                    continue;
                }

                const handler = (event) => {
                    event.preventDefault();
                    if (!this.enabled) {
                        return;
                    }
                    this.queued[action] = true;
                };

                button.addEventListener("click", handler);
                button.addEventListener("pointerdown", handler);
            }
        }

        queueAction(action) {
            const map = {
                jump: "jump",
                punch: "punch",
                kick: "kick",
                weapon: "weapon",
                ranged: "ranged",
                magic: "magic",
                inventory: "inventory",
                pause: "pause"
            };
            const queuedAction = map[action];
            if (queuedAction) {
                this.queued[queuedAction] = true;
            }
        }

        setMode(mode) {
            this.mode = mode;
            this.reset();
        }

        setEnabled(enabled) {
            this.enabled = enabled;
            if (!enabled) {
                this.reset();
            }
        }

        reset() {
            this.keys = Object.create(null);
            for (const key of Object.keys(this.queued)) {
                this.queued[key] = false;
            }
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            if (this.joystickThumb) {
                this.joystickThumb.style.transform = "translate(-50%, -50%)";
            }
            for (const button of this.touchButtons) {
                button.classList.remove("is-pressed");
            }
        }

        consumeFlag(name) {
            const value = this.queued[name];
            this.queued[name] = false;
            return value;
        }

        snapshot() {
            const moveX = this.mode === "phone"
                ? this.joystick.x
                : ((this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0));
            const moveY = this.mode === "phone"
                ? this.joystick.y
                : (this.keys.s ? 1 : 0);

            return {
                moveX,
                moveY,
                crouch: this.mode === "phone" ? moveY > 0.4 : Boolean(this.keys.s),
                jumpPressed: this.consumeFlag("jump"),
                punchPressed: this.consumeFlag("punch"),
                kickPressed: this.consumeFlag("kick"),
                weaponPressed: this.consumeFlag("weapon"),
                rangedPressed: this.consumeFlag("ranged"),
                magicPressed: this.consumeFlag("magic"),
                switchPressed: this.consumeFlag("switch"),
                switchRangedPressed: this.consumeFlag("switchRanged"),
                switchMagicPressed: this.consumeFlag("switchMagic"),
                inventoryPressed: this.consumeFlag("inventory"),
                pausePressed: this.consumeFlag("pause")
            };
        }
    }

    SF.engine.InputManager = InputManager;
})();
