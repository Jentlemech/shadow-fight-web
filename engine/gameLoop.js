(function () {
    const SF = window.ShadowFight;

    class GameLoop {
        constructor(options) {
            this.update = options.update;
            this.render = options.render;
            this.fixedStep = 1 / (options.targetFps || 60);
            this.maxFrame = 0.08;
            this.accumulator = 0;
            this.lastTime = 0;
            this.running = false;
            this.frame = this.frame.bind(this);
        }

        start() {
            if (this.running) {
                return;
            }

            this.running = true;
            this.lastTime = 0;
            requestAnimationFrame(this.frame);
        }

        stop() {
            this.running = false;
        }

        frame(timestamp) {
            if (!this.running) {
                return;
            }

            if (!this.lastTime) {
                this.lastTime = timestamp;
            }

            const deltaSeconds = Math.min((timestamp - this.lastTime) / 1000, this.maxFrame);
            this.lastTime = timestamp;
            this.accumulator += deltaSeconds;

            while (this.accumulator >= this.fixedStep) {
                this.update(this.fixedStep);
                this.accumulator -= this.fixedStep;
            }

            const alpha = this.accumulator / this.fixedStep;
            this.render(alpha);
            requestAnimationFrame(this.frame);
        }
    }

    SF.engine.GameLoop = GameLoop;
})();
