(function () {
    const SF = window.ShadowFight;
    const RPGData = SF.entities.RPGData;

    class MenuManager {
        constructor(documentRef) {
            this.document = documentRef;
            this.selectedDevice = "desktop";
            this.selectedMode = "story";
            this.selectedCharacter = "warrior";
            this.startOverlay = documentRef.getElementById("menuOverlay");
            this.pauseOverlay = documentRef.getElementById("pauseOverlay");
            this.gameOverOverlay = documentRef.getElementById("gameOverOverlay");
            this.bossWarningOverlay = documentRef.getElementById("bossWarningOverlay");
            this.deviceButtons = Array.from(documentRef.querySelectorAll("[data-device]"));
            this.modeButtons = Array.from(documentRef.querySelectorAll("[data-mode]"));
            this.characterButtons = Array.from(documentRef.querySelectorAll("[data-character]"));
            this.modeDescription = documentRef.getElementById("modeDescription");
            this.desktopHelp = documentRef.getElementById("desktopHelp");
            this.phoneHelp = documentRef.getElementById("phoneHelp");
            this.networkStatus = documentRef.getElementById("networkStatus");
            this.characterSummary = documentRef.getElementById("characterSummary");
            this.resultEyebrow = documentRef.getElementById("resultEyebrow");
            this.resultTitle = documentRef.getElementById("resultTitle");
            this.resultMessage = documentRef.getElementById("resultMessage");
            this.continueButton = documentRef.getElementById("continueButton");
            this.socketUrl = documentRef.getElementById("socketUrl");
            this.bossWarningTitle = documentRef.getElementById("bossWarningTitle");
            this.bossWarningCopy = documentRef.getElementById("bossWarningCopy");
            this.callbacks = {};
        }

        bind(callbacks) {
            this.callbacks = callbacks;

            for (const button of this.deviceButtons) {
                button.addEventListener("click", () => this.setSelectedDevice(button.dataset.device));
            }

            for (const button of this.modeButtons) {
                button.addEventListener("click", () => this.setSelectedMode(button.dataset.mode));
            }

            for (const button of this.characterButtons) {
                button.addEventListener("click", () => this.setSelectedCharacter(button.dataset.character));
            }

            this.document.getElementById("startGameButton").addEventListener("click", () => {
                this.callbacks.onStart(this.getSelection());
            });

            this.document.getElementById("hostButton").addEventListener("click", () => {
                this.callbacks.onHost(this.getSelection(), this.socketUrl.value.trim());
            });

            this.document.getElementById("joinButton").addEventListener("click", () => {
                this.callbacks.onJoin(this.getSelection(), this.socketUrl.value.trim());
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

            this.document.getElementById("openInventoryButton").addEventListener("click", () => {
                this.callbacks.onInventory();
            });

            this.document.getElementById("pauseInventoryButton").addEventListener("click", () => {
                this.callbacks.onInventory();
            });
        }

        getSelection() {
            return {
                device: this.selectedDevice,
                mode: this.selectedMode,
                character: this.selectedCharacter
            };
        }

        setSelectedDevice(device) {
            this.selectedDevice = device;
            for (const button of this.deviceButtons) {
                button.classList.toggle("is-selected", button.dataset.device === device);
            }
            document.body.classList.toggle("phone-mode", device === "phone");
            this.modeDescription.textContent = device === "phone"
                ? "Phone mode uses a joystick plus jump, weapon, ranged, magic, inventory, and pause buttons."
                : "Desktop mode uses keyboard movement, combat keys, inventory hotkeys, and pause controls.";
            this.desktopHelp.style.display = device === "phone" ? "none" : "grid";
            this.phoneHelp.style.display = device === "phone" ? "block" : "none";
        }

        setSelectedMode(mode) {
            this.selectedMode = mode;
            for (const button of this.modeButtons) {
                button.classList.toggle("is-selected", button.dataset.mode === mode);
            }
        }

        setSelectedCharacter(characterId) {
            this.selectedCharacter = characterId;
            for (const button of this.characterButtons) {
                button.classList.toggle("is-selected", button.dataset.character === characterId);
            }

            const character = RPGData.CHARACTERS[characterId];
            if (!character) {
                return;
            }

            const starterWeapon = RPGData.getItem(character.starterLoadout.weapon);
            const starterRanged = RPGData.getItem(character.starterLoadout.ranged);
            const starterMagic = RPGData.getItem(character.starterLoadout.magic);
            this.characterSummary.textContent = `${character.name} starts with ${starterWeapon.name}, ${starterRanged.name}, and ${starterMagic.name}.`;
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

        showBossWarning(title, copy) {
            this.bossWarningTitle.textContent = title || "Boss Incoming";
            this.bossWarningCopy.textContent = copy || "A powerful enemy is entering the arena.";
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
