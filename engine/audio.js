(function () {
    const SF = window.ShadowFight;

    class AudioSystem {
        constructor() {
            this.context = null;
            this.master = null;
            this.musicGain = null;
            this.fxGain = null;
            this.musicTimer = null;
            this.musicMode = "dojo";
        }

        ensureContext() {
            if (this.context) {
                return;
            }

            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) {
                return;
            }

            this.context = new AudioContextCtor();
            this.master = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.fxGain = this.context.createGain();
            this.master.gain.value = 0.44;
            this.musicGain.gain.value = 0.22;
            this.fxGain.gain.value = 0.58;
            this.musicGain.connect(this.master);
            this.fxGain.connect(this.master);
            this.master.connect(this.context.destination);
        }

        unlock() {
            this.ensureContext();
            if (!this.context) {
                return;
            }
            if (this.context.state === "suspended") {
                this.context.resume();
            }
            this.startMusic(this.musicMode);
        }

        playTone(frequency, duration, options) {
            if (!this.context) {
                return;
            }

            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = options.wave || "triangle";
            oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
            if (options.frequencyEnd) {
                oscillator.frequency.exponentialRampToValueAtTime(options.frequencyEnd, this.context.currentTime + duration);
            }

            gain.gain.setValueAtTime(options.volume || 0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
            oscillator.connect(gain);
            gain.connect(options.music ? this.musicGain : this.fxGain);
            oscillator.start();
            oscillator.stop(this.context.currentTime + duration);
        }

        playPunch() {
            this.playTone(160, 0.1, { volume: 0.18, wave: "square", frequencyEnd: 90 });
        }

        playKick() {
            this.playTone(120, 0.16, { volume: 0.22, wave: "triangle", frequencyEnd: 70 });
        }

        playWeapon() {
            this.playTone(360, 0.14, { volume: 0.16, wave: "sawtooth", frequencyEnd: 220 });
        }

        playRanged() {
            this.playTone(310, 0.12, { volume: 0.15, wave: "triangle", frequencyEnd: 180 });
        }

        playMagic(type) {
            const map = {
                fireball: [260, 420, "sawtooth"],
                lightning_strike: [640, 880, "square"],
                energy_shield: [420, 300, "triangle"],
                dash_teleport: [520, 250, "triangle"]
            };
            const config = map[type] || [420, 300, "triangle"];
            this.playTone(config[0], 0.22, { volume: 0.17, wave: config[2], frequencyEnd: config[1] });
        }

        playBlock() {
            this.playTone(250, 0.09, { volume: 0.12, wave: "square", frequencyEnd: 180 });
        }

        playLand() {
            this.playTone(80, 0.11, { volume: 0.12, wave: "triangle", frequencyEnd: 45 });
        }

        playLevelUp() {
            this.playTone(440, 0.12, { volume: 0.16, wave: "triangle", frequencyEnd: 660 });
            setTimeout(() => this.playTone(660, 0.14, { volume: 0.14, wave: "triangle", frequencyEnd: 880 }), 90);
        }

        playBossWarning() {
            this.playTone(120, 0.22, { volume: 0.2, wave: "sawtooth", frequencyEnd: 95 });
            setTimeout(() => this.playTone(90, 0.22, { volume: 0.2, wave: "sawtooth", frequencyEnd: 70 }), 120);
        }

        setMusicMode(mode) {
            this.musicMode = mode;
            if (this.context) {
                this.startMusic(mode);
            }
        }

        startMusic(mode) {
            if (!this.context) {
                return;
            }

            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }

            const patterns = {
                dojo: { notes: [220, 330, 294, 392, 330, 262], beat: 360, wave: "triangle" },
                forest_temple: { notes: [174, 220, 261, 220, 196, 294], beat: 340, wave: "triangle" },
                mountain_fortress: { notes: [196, 247, 294, 247, 220, 330], beat: 320, wave: "square" },
                dark_castle: { notes: [165, 220, 247, 220, 185, 277], beat: 300, wave: "sawtooth" },
                shadow_realm: { notes: [147, 220, 294, 247, 196, 330], beat: 280, wave: "sawtooth" },
                boss: { notes: [110, 165, 110, 196, 147, 220], beat: 260, wave: "sawtooth" }
            };

            const pattern = patterns[mode] || patterns.dojo;
            let step = 0;

            this.musicTimer = setInterval(() => {
                const note = pattern.notes[step % pattern.notes.length];
                this.playTone(note, 0.24, {
                    volume: mode === "boss" ? 0.11 : 0.08,
                    wave: pattern.wave,
                    music: true,
                    frequencyEnd: note * (mode === "boss" ? 1.08 : 0.92)
                });

                if (mode === "boss" || mode === "shadow_realm") {
                    this.playTone(note / 2, 0.28, {
                        volume: 0.06,
                        wave: "square",
                        music: true,
                        frequencyEnd: note / 2.1
                    });
                }

                step += 1;
            }, pattern.beat);
        }
    }

    SF.engine.AudioSystem = AudioSystem;
})();
