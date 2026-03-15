(function () {
    const SF = window.ShadowFight;
    const { GameLoop, Renderer, InputManager, PhysicsSystem, CollisionSystem, AudioSystem, ParticleSystem, NetworkManager } = SF.engine;
    const { Fighter, EnemyAI, Boss, Weapon } = SF.entities;
    const { HUD, MenuManager } = SF.ui;
    const { CombatSystem, ProgressionSystem } = SF.systems;

    const canvas = document.getElementById("gameCanvas");
    const weaponHint = document.getElementById("weaponHint");

    const world = {
        width: canvas.width,
        height: canvas.height,
        groundY: 596,
        leftBound: 92,
        rightBound: canvas.width - 92,
        gravity: 2200
    };

    const renderer = new Renderer(canvas);
    const input = new InputManager(document);
    const physics = new PhysicsSystem();
    const collision = new CollisionSystem();
    const audio = new AudioSystem();
    const particles = new ParticleSystem();
    const network = new NetworkManager();
    const hud = new HUD();
    const menu = new MenuManager(document);
    const progression = new ProgressionSystem();
    const combat = new CombatSystem({
        collision,
        physics,
        particles,
        audio,
        renderer,
        hud
    });

    const enemyNames = ["Shade Ronin", "Temple Raider", "Night Disciple"];

    const state = {
        world,
        renderer,
        particles,
        hud,
        progression,
        player: null,
        opponent: null,
        ai: null,
        started: false,
        paused: false,
        round: 1,
        roundEnded: false,
        roundWinner: "",
        awaitingContinue: false,
        roundIntroTimer: 0,
        roundIntroDuration: 1,
        introText: "",
        bossWarningTimer: 0,
        isMultiplayer: false,
        multiplayerRole: "",
        remoteInput: null,
        elapsed: 0,
        lastStartConfig: null
    };

    function createEmptyInput() {
        return {
            moveX: 0,
            moveY: 0,
            crouch: false,
            jumpPressed: false,
            punchPressed: false,
            kickPressed: false,
            weaponPressed: false,
            switchPressed: false,
            pausePressed: false,
            dodgePressed: false
        };
    }

    function updateWeaponHint() {
        if (!state.player) {
            weaponHint.textContent = "Select a device to enter the arena.";
            return;
        }

        const unlocked = progression.unlockedWeapons.map((id) => Weapon.create(id).name).join(", ");
        weaponHint.textContent = `${state.player.weapon.name} equipped. Unlocked: ${unlocked}.`;
    }

    function createPlayerForCurrentMode() {
        const startsLeft = !state.isMultiplayer || state.multiplayerRole === "host";
        const fighter = new Fighter({
            name: "Player",
            id: "player",
            isPlayer: true,
            x: startsLeft ? 320 : 960,
            groundY: world.groundY,
            facing: startsLeft ? 1 : -1,
            unlockedWeapons: progression.unlockedWeapons
        });
        progression.applyToFighter(fighter);
        return fighter;
    }

    function createOpponentForRound(round) {
        if (state.isMultiplayer) {
            const startsLeft = state.multiplayerRole === "join";
            const rival = new Fighter({
                name: startsLeft ? "Host Fighter" : "Challenger",
                id: "remote",
                x: startsLeft ? 320 : 960,
                groundY: world.groundY,
                facing: startsLeft ? 1 : -1,
                unlockedWeapons: progression.unlockedWeapons,
                maxHealth: progression.getPlayerStats().maxHealth,
                maxStamina: progression.getPlayerStats().maxStamina,
                moveSpeed: progression.getPlayerStats().moveSpeed,
                jumpStrength: progression.getPlayerStats().jumpStrength,
                damage: progression.getPlayerStats().damage,
                staminaRecovery: progression.getPlayerStats().staminaRecovery
            });
            rival.applyStats(progression.getPlayerStats());
            return rival;
        }

        if (round >= 4) {
            return new Boss({
                x: 960,
                groundY: world.groundY,
                facing: -1
            });
        }

        const enemy = new Fighter({
            name: enemyNames[(round - 1) % enemyNames.length],
            id: `enemy-${round}`,
            x: 960,
            groundY: world.groundY,
            facing: -1,
            maxHealth: 110 + round * 28,
            maxStamina: 90 + round * 10,
            moveSpeed: 246 + round * 12,
            jumpStrength: 860 + round * 10,
            damage: 0.92 + round * 0.08,
            staminaRecovery: 15 + round * 1.1,
            unlockedWeapons: round >= 3 ? ["sword", "staff"] : ["sword"]
        });
        if (round >= 3) {
            enemy.weaponIndex = 1;
            enemy.weapon = Weapon.create("staff");
        }
        return enemy;
    }

    function assignRoundPositions() {
        if (!state.player || !state.opponent) {
            return;
        }

        const localStartsLeft = !state.isMultiplayer || state.multiplayerRole === "host";
        state.player.x = localStartsLeft ? 320 : 960;
        state.player.facing = localStartsLeft ? 1 : -1;
        state.player.groundY = world.groundY;
        state.player.restoreForRound();
        progression.applyToFighter(state.player);

        state.opponent.x = localStartsLeft ? 960 : 320;
        state.opponent.facing = localStartsLeft ? -1 : 1;
        state.opponent.groundY = world.groundY;
        state.opponent.restoreForRound();
    }

    function startRound(round) {
        state.round = round;
        state.roundEnded = false;
        state.roundWinner = "";
        state.awaitingContinue = false;
        state.remoteInput = createEmptyInput();

        if (!state.player) {
            state.player = createPlayerForCurrentMode();
        }

        state.opponent = createOpponentForRound(round);
        state.ai = state.isMultiplayer
            ? null
            : new EnemyAI({
                difficulty: 1 + round * 0.2,
                isBoss: state.opponent.isBoss
            });

        assignRoundPositions();
        updateWeaponHint();

        if (state.opponent.isBoss) {
            state.bossWarningTimer = 1.6;
            state.roundIntroDuration = 1.7;
            state.introText = "Boss Round";
            menu.showBossWarning();
            audio.setMusicMode("boss");
            audio.playBossWarning();
        } else {
            state.bossWarningTimer = 0;
            state.roundIntroDuration = 1.05;
            state.introText = `Round ${round}`;
            menu.hideBossWarning();
            audio.setMusicMode("dojo");
        }

        state.roundIntroTimer = state.roundIntroDuration;
        input.reset();
        input.setEnabled(true);
    }

    function beginSession(config) {
        state.lastStartConfig = config;
        state.started = true;
        state.paused = false;
        state.isMultiplayer = Boolean(config.multiplayer);
        state.multiplayerRole = config.role || "";
        state.elapsed = 0;

        if (!config.multiplayer) {
            network.disconnect(true);
        }

        input.setMode(config.device);
        menu.setSelectedDevice(config.device);
        menu.hideStart();
        menu.hidePause();
        menu.hideResult();
        audio.unlock();

        state.player = createPlayerForCurrentMode();
        startRound(1);
    }

    function returnToMenu() {
        state.started = false;
        state.paused = false;
        state.roundEnded = false;
        state.awaitingContinue = false;
        input.setEnabled(false);
        network.disconnect(true);
        state.isMultiplayer = false;
        state.multiplayerRole = "";
        state.player = null;
        state.opponent = null;
        state.ai = null;
        menu.hidePause();
        menu.hideResult();
        menu.hideBossWarning();
        menu.showStart();
        menu.setNetworkStatus("If multiplayer is unavailable, the game falls back to single-player automatically.", "info");
        updateWeaponHint();
    }

    function togglePause(forceState) {
        if (!state.started || state.awaitingContinue) {
            return;
        }

        state.paused = typeof forceState === "boolean" ? forceState : !state.paused;
        input.setEnabled(!state.paused);
        if (state.paused) {
            menu.showPause();
        } else {
            menu.hidePause();
        }
    }

    function finishRound() {
        if (state.awaitingContinue) {
            return;
        }

        state.awaitingContinue = true;
        input.setEnabled(false);

        if (state.roundWinner === "player") {
            if (state.isMultiplayer) {
                menu.showResult({
                    eyebrow: "Match Complete",
                    title: "Victory",
                    message: "Your synchronized opponent fell. Restart for another duel or return to the start menu.",
                    canContinue: false
                });
                return;
            }

            const previousLevel = progression.level;
            const reward = progression.awardVictory(state.round, state.opponent.isBoss);
            progression.applyToFighter(state.player);
            updateWeaponHint();
            if (progression.level > previousLevel || reward.unlocked.length) {
                audio.playLevelUp();
            }

            const rewardMessage = reward.unlocked.length
                ? ` XP +${reward.xpGain}. Unlocked ${reward.unlocked.join(" and ")}.`
                : ` XP +${reward.xpGain}.`;

            menu.showResult({
                eyebrow: state.opponent.isBoss ? "Campaign Cleared" : "Round Complete",
                title: state.opponent.isBoss ? "Master Defeated" : "Victory",
                message: state.opponent.isBoss
                    ? `You survived the rage phase and won the dojo.${rewardMessage}`
                    : `The shadow duel goes to you.${rewardMessage}`,
                canContinue: !state.opponent.isBoss,
                continueLabel: "Next Round"
            });
            return;
        }

        menu.showResult({
            eyebrow: "Game Over",
            title: "Defeat",
            message: "The enemy broke your guard this time. Restart the campaign or return to the start menu.",
            canContinue: false
        });
    }

    function continueAfterRound() {
        if (!state.awaitingContinue) {
            return;
        }

        if (state.roundWinner === "player" && !state.opponent.isBoss && !state.isMultiplayer) {
            menu.hideResult();
            startRound(state.round + 1);
            return;
        }

        restartRun();
    }

    function restartRun() {
        menu.hideResult();
        menu.hidePause();

        if (!state.lastStartConfig) {
            returnToMenu();
            return;
        }

        if (state.lastStartConfig.multiplayer && !network.connected) {
            beginSession({
                device: state.lastStartConfig.device,
                multiplayer: false
            });
            return;
        }

        beginSession(state.lastStartConfig);
    }

    function buildOpponentInput(dt) {
        if (state.isMultiplayer && network.connected) {
            const snapshot = Object.assign(createEmptyInput(), state.remoteInput || {});
            if (state.remoteInput) {
                state.remoteInput.jumpPressed = false;
                state.remoteInput.punchPressed = false;
                state.remoteInput.kickPressed = false;
                state.remoteInput.weaponPressed = false;
                state.remoteInput.switchPressed = false;
            }
            return snapshot;
        }

        if (!state.ai) {
            return createEmptyInput();
        }

        const thought = state.ai.think(state.opponent, state.player, state.round, dt);
        thought.dodgePressed = Boolean(thought.dodgePressed);
        return thought;
    }

    function handleLanding(fighter) {
        particles.spawnDust(fighter.x, fighter.y, fighter.isBoss ? 10 : 6);
        audio.playLand();
    }

    network.setCallbacks({
        onStatus: (message, type) => menu.setNetworkStatus(message, type),
        onRemoteInput: (snapshot) => {
            state.remoteInput = Object.assign(createEmptyInput(), snapshot);
        },
        onDisconnect: () => {
            if (!state.started || !state.isMultiplayer) {
                return;
            }
            state.isMultiplayer = false;
            state.ai = new EnemyAI({ difficulty: 1.35, isBoss: false });
            menu.setNetworkStatus("Remote disconnected. The AI took over the opponent.", "error");
        }
    });

    menu.bind({
        onStartSinglePlayer: (device) => beginSession({ device, multiplayer: false }),
        onHost: (device, url) => {
            audio.unlock();
            menu.setNetworkStatus("Connecting as host...", "info");
            network.connect("host", url, {
                onStatus: (message, type) => menu.setNetworkStatus(message, type),
                onRemoteInput: (snapshot) => {
                    state.remoteInput = Object.assign(createEmptyInput(), snapshot);
                },
                onDisconnect: () => {
                    state.isMultiplayer = false;
                    state.ai = new EnemyAI({ difficulty: 1.35, isBoss: false });
                    menu.setNetworkStatus("Remote disconnected. The AI took over the opponent.", "error");
                }
            }).then(() => {
                beginSession({ device, multiplayer: true, role: "host" });
            }).catch(() => {
                beginSession({ device, multiplayer: false });
            });
        },
        onJoin: (device, url) => {
            audio.unlock();
            menu.setNetworkStatus("Connecting as joiner...", "info");
            network.connect("join", url, {
                onStatus: (message, type) => menu.setNetworkStatus(message, type),
                onRemoteInput: (snapshot) => {
                    state.remoteInput = Object.assign(createEmptyInput(), snapshot);
                },
                onDisconnect: () => {
                    state.isMultiplayer = false;
                    state.ai = new EnemyAI({ difficulty: 1.35, isBoss: false });
                    menu.setNetworkStatus("Remote disconnected. The AI took over the opponent.", "error");
                }
            }).then(() => {
                beginSession({ device, multiplayer: true, role: "join" });
            }).catch(() => {
                beginSession({ device, multiplayer: false });
            });
        },
        onResume: () => togglePause(false),
        onReturnToMenu: () => returnToMenu(),
        onContinue: () => continueAfterRound(),
        onRestart: () => restartRun()
    });

    const defaultDevice = window.matchMedia("(max-width: 820px)").matches || "ontouchstart" in window
        ? "phone"
        : "desktop";
    menu.setSelectedDevice(defaultDevice);
    updateWeaponHint();

    const loop = new GameLoop({
        targetFps: 60,
        update(dt) {
            state.elapsed += dt;
            renderer.update(dt);
            particles.update(dt);
            hud.update(state, dt);

            if (state.bossWarningTimer > 0) {
                state.bossWarningTimer = Math.max(0, state.bossWarningTimer - dt);
                if (state.bossWarningTimer <= 0) {
                    menu.hideBossWarning();
                }
            }

            if (!state.started) {
                return;
            }

            const localInput = Object.assign(createEmptyInput(), input.snapshot());
            if (localInput.pausePressed) {
                togglePause();
            }

            if (state.paused) {
                return;
            }

            if (state.roundIntroTimer > 0) {
                state.roundIntroTimer = Math.max(0, state.roundIntroTimer - dt);
                return;
            }

            if (state.roundEnded) {
                finishRound();
                return;
            }

            if (state.isMultiplayer && network.connected) {
                network.syncInput(localInput, state.elapsed);
            }

            const opponentInput = buildOpponentInput(dt);
            combat.updateBossState(state.opponent);
            combat.processFighter(state.player, localInput, state.opponent, state);
            combat.processFighter(state.opponent, opponentInput, state.player, state);

            if (localInput.switchPressed) {
                updateWeaponHint();
            }

            physics.updateFighter(state.player, localInput, world, dt, {
                onLand: handleLanding
            });
            physics.updateFighter(state.opponent, opponentInput, world, dt, {
                onLand: handleLanding
            });

            collision.resolveFighterOverlap(state.player, state.opponent, world);
            state.player.faceTarget(state.opponent);
            state.opponent.faceTarget(state.player);

            combat.resolveHit(state.player, state.opponent, state);
            if (!state.roundEnded) {
                combat.resolveHit(state.opponent, state.player, state);
            }

            if (state.roundEnded) {
                finishRound();
            }
        },
        render() {
            renderer.render(state);
        }
    });

    loop.start();
})();
