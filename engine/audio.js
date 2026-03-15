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
            this.master.gain.value = 0.45;
            this.musicGain.gain.value = 0.22;
            this.fxGain.gain.value = 0.6;
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
            if (!this.context || this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }

            const dojoPattern = [220, 330, 294, 392, 330, 262];
            const bossPattern = [110, 165, 110, 196, 147, 220];
            const pattern = mode === "boss" ? bossPattern : dojoPattern;
            const beat = mode === "boss" ? 280 : 360;
            let step = 0;

            this.musicTimer = setInterval(() => {
                const note = pattern[step % pattern.length];
                this.playTone(note, 0.22, {
                    volume: mode === "boss" ? 0.11 : 0.08,
                    wave: mode === "boss" ? "sawtooth" : "triangle",
                    music: true,
                    frequencyEnd: note * (mode === "boss" ? 1.1 : 0.92)
                });
                if (mode === "boss" && step % 2 === 0) {
                    this.playTone(note / 2, 0.28, {
                        volume: 0.08,
                        wave: "square",
                        music: true,
                        frequencyEnd: note / 2.2
                    });
                }
                step += 1;
            }, beat);
        }
    }

    SF.engine.AudioSystem = AudioSystem;
})();
