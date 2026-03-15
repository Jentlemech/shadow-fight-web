(function () {
    const SF = window.ShadowFight;

    class NetworkManager {
        constructor() {
            this.socket = null;
            this.connected = false;
            this.role = "";
            this.url = "";
            this.onStatus = null;
            this.onRemoteInput = null;
            this.onDisconnect = null;
            this.lastSent = 0;
            this.remoteSnapshot = null;
        }

        setCallbacks(callbacks) {
            this.onStatus = callbacks.onStatus;
            this.onRemoteInput = callbacks.onRemoteInput;
            this.onDisconnect = callbacks.onDisconnect;
        }

        notify(message, type) {
            if (this.onStatus) {
                this.onStatus(message, type || "info");
            }
        }

        connect(role, url, hooks) {
            this.disconnect(true);
            this.role = role;
            this.url = url;
            this.setCallbacks(hooks);

            if (!("WebSocket" in window)) {
                this.notify("WebSockets are unavailable in this browser. Starting single-player.", "error");
                return Promise.reject(new Error("WebSocket unavailable"));
            }

            return new Promise((resolve, reject) => {
                try {
                    this.socket = new WebSocket(url);
                } catch (error) {
                    this.notify("Could not create a WebSocket connection. Starting single-player.", "error");
                    reject(error);
                    return;
                }

                const fail = () => {
                    this.disconnect(true);
                    this.notify("Could not reach the WebSocket endpoint. Starting single-player.", "error");
                    reject(new Error("Connection failed"));
                };

                const timeout = window.setTimeout(fail, 2500);

                this.socket.addEventListener("open", () => {
                    window.clearTimeout(timeout);
                    this.connected = true;
                    this.notify(`Connected as ${role}. Remote input sync is active.`, "success");
                    this.send("hello", { role });
                    resolve();
                });

                this.socket.addEventListener("message", (event) => {
                    let payload;
                    try {
                        payload = JSON.parse(event.data);
                    } catch (error) {
                        return;
                    }

                    if (payload.type === "input") {
                        this.remoteSnapshot = payload.data;
                        if (this.onRemoteInput) {
                            this.onRemoteInput(payload.data);
                        }
                    }
                });

                this.socket.addEventListener("close", () => {
                    if (this.connected && this.onDisconnect) {
                        this.onDisconnect();
                    }
                    this.connected = false;
                    this.socket = null;
                });

                this.socket.addEventListener("error", fail);
            });
        }

        disconnect(silent) {
            if (this.socket) {
                this.socket.close();
            }
            this.socket = null;
            this.connected = false;
            this.remoteSnapshot = null;
            if (!silent) {
                this.notify("Multiplayer disconnected. The AI will take over.", "error");
            }
        }

        send(type, data) {
            if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
                return;
            }
            this.socket.send(JSON.stringify({ type, data }));
        }

        syncInput(snapshot, now) {
            if (!this.connected) {
                return;
            }
            if (now - this.lastSent < 0.05) {
                return;
            }
            this.lastSent = now;
            this.send("input", snapshot);
        }
    }

    SF.engine.NetworkManager = NetworkManager;
})();
