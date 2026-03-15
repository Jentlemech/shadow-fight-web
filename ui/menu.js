(function () {
    const SF = window.ShadowFight;

    class MenuManager {
        constructor(documentRef) {
            this.document = documentRef;
            this.selectedDevice = "desktop";
            this.startOverlay = documentRef.getElementById("menuOverlay");
            this.pauseOverlay = documentRef.getElementById("pauseOverlay");
            this.gameOverOverlay = documentRef.getElementById("gameOverOverlay");
            this.bossWarningOverlay = documentRef.getElementById("bossWarningOverlay");
            this.deviceButtons = Array.from(documentRef.querySelectorAll("[data-device]"));
            this.modeDescription = documentRef.getElementById("modeDescription");
            this.desktopHelp = documentRef.getElementById("desktopHelp");
            this.phoneHelp = documentRef.getElementById("phoneHelp");
            this.networkStatus = documentRef.getElementById("networkStatus");
            this.resultEyebrow = documentRef.getElementById("resultEyebrow");
            this.resultTitle = documentRef.getElementById("resultTitle");
            this.resultMessage = documentRef.getElementById("resultMessage");
            this.continueButton = documentRef.getElementById("continueButton");
            this.socketUrl = documentRef.getElementById("socketUrl");
            this.callbacks = {};
        }

        bind(callbacks) {
            this.callbacks = callbacks;

            for (const button of this.deviceButtons) {
                button.addEventListener("click", () => this.setSelectedDevice(button.dataset.device));
            }

            this.document.getElementById("startSinglePlayer").addEventListener("click", () => {
                this.callbacks.onStartSinglePlayer(this.selectedDevice);
            });

            this.document.getElementById("hostButton").addEventListener("click", () => {
                this.callbacks.onHost(this.selectedDevice, this.socketUrl.value.trim());
            });

            this.document.getElementById("joinButton").addEventListener("click", () => {
                this.callbacks.onJoin(this.selectedDevice, this.socketUrl.value.trim());
            });

            this.document.getElementById("resumeButton").addEventListener("click", () => {
                this.callbacks.onResume();
            });

            this.document.getElementById("returnToMenuButton").addEventListener("click", () => {
                this.callbacks.onReturnToMenu();
            });

            this.continueButton.addEventListener("click", () => {
                this.callbacks.onContinue();
            });

            this.document.getElementById("restartRunButton").addEventListener("click", () => {
                this.callbacks.onRestart();
            });
        }

        setSelectedDevice(device) {
            this.selectedDevice = device;
            for (const button of this.deviceButtons) {
                button.classList.toggle("is-selected", button.dataset.device === device);
            }
            document.body.classList.toggle("phone-mode", device === "phone");
            this.modeDescription.textContent = device === "phone"
                ? "Phone mode uses a virtual joystick plus jump, punch, kick, and weapon buttons."
                : "Desktop mode uses keyboard movement, combat keys, and a pause shortcut.";
            this.desktopHelp.style.display = device === "phone" ? "none" : "grid";
            this.phoneHelp.style.display = device === "phone" ? "block" : "none";
        }

        showStart() {
            this.startOverlay.classList.add("overlay-active");
            this.pauseOverlay.classList.remove("overlay-active");
            this.gameOverOverlay.classList.remove("overlay-active");
        }

        hideStart() {
            this.startOverlay.classList.remove("overlay-active");
        }

        showPause() {
            this.pauseOverlay.classList.add("overlay-active");
        }

        hidePause() {
            this.pauseOverlay.classList.remove("overlay-active");
        }

        showResult(config) {
            this.resultEyebrow.textContent = config.eyebrow;
            this.resultTitle.textContent = config.title;
            this.resultMessage.textContent = config.message;
            this.continueButton.textContent = config.continueLabel || "Continue";
            this.continueButton.style.display = config.canContinue ? "inline-flex" : "none";
            this.gameOverOverlay.classList.add("overlay-active");
        }

        hideResult() {
            this.gameOverOverlay.classList.remove("overlay-active");
        }

        showBossWarning() {
            this.bossWarningOverlay.classList.add("overlay-active");
        }

        hideBossWarning() {
            this.bossWarningOverlay.classList.remove("overlay-active");
        }

        setNetworkStatus(message, type) {
            this.networkStatus.textContent = message;
            this.networkStatus.classList.toggle("is-error", type === "error");
            this.networkStatus.classList.toggle("is-success", type === "success");
        }
    }

    SF.ui.MenuManager = MenuManager;
})();
