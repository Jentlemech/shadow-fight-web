(function () {
    const SF = window.ShadowFight;

    class InventoryMenu {
        constructor(documentRef, progression) {
            this.document = documentRef;
            this.progression = progression;
            this.overlay = documentRef.getElementById("inventoryOverlay");
            this.itemsHost = documentRef.getElementById("inventoryItems");
            this.slotTitle = documentRef.getElementById("inventorySlotTitle");
            this.equippedSummary = documentRef.getElementById("equippedSummary");
            this.statsComparison = documentRef.getElementById("statsComparison");
            this.slotButtons = Array.from(documentRef.querySelectorAll("[data-slot]"));
            this.activeSlot = "helmet";
            this.callbacks = {};

            this.document.getElementById("closeInventoryButton").addEventListener("click", () => this.close());

            for (const button of this.slotButtons) {
                button.addEventListener("click", () => {
                    this.activeSlot = button.dataset.slot;
                    this.render();
                });
            }
        }

        bind(callbacks) {
            this.callbacks = callbacks || {};
        }

        isOpen() {
            return this.overlay.classList.contains("overlay-active");
        }

        open() {
            this.render();
            this.overlay.classList.add("overlay-active");
            if (this.callbacks.onVisibilityChange) {
                this.callbacks.onVisibilityChange(true);
            }
        }

        close() {
            this.overlay.classList.remove("overlay-active");
            if (this.callbacks.onVisibilityChange) {
                this.callbacks.onVisibilityChange(false);
            }
        }

        toggle() {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        }

        renderEquippedSummary() {
            const summary = this.progression.getEquippedSummary();
            this.equippedSummary.innerHTML = summary.map((line) => `<div>${line}</div>`).join("");
        }

        renderStatsComparison(targetItemId) {
            const current = this.progression.getPlayerStats();
            const projected = targetItemId
                ? this.progression.getPlayerStatsWithPreview(this.activeSlot, targetItemId)
                : current;

            const rows = [
                ["Health", current.maxHealth, projected.maxHealth],
                ["Stamina", current.maxStamina, projected.maxStamina],
                ["Mana", current.maxMana, projected.maxMana],
                ["Damage", current.damage, projected.damage],
                ["Defense", current.defense, projected.defense],
                ["Speed", current.moveSpeed, projected.moveSpeed],
                ["Magic", current.magicPower, projected.magicPower]
            ];

            this.statsComparison.innerHTML = rows.map(([label, before, after]) => {
                const delta = typeof before === "number" && typeof after === "number"
                    ? after - before
                    : 0;
                const deltaLabel = delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? delta.toFixed(1) : "0.0";
                return `<div>${label}: ${Number(before).toFixed(1)} -> ${Number(after).toFixed(1)} (${deltaLabel})</div>`;
            }).join("");
        }

        renderItems() {
            const items = this.progression.getInventoryForSlot(this.activeSlot);
            const equippedId = this.progression.getEquippedItemId(this.activeSlot);
            const slotLabel = this.activeSlot.charAt(0).toUpperCase() + this.activeSlot.slice(1);
            this.slotTitle.textContent = `${slotLabel} Choices`;
            this.itemsHost.innerHTML = "";

            for (const item of items) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `item-card${item.id === equippedId ? " is-selected" : ""}`;
                const statLines = Object.entries(item.bonuses || {})
                    .map(([key, value]) => `${key}: +${value}`)
                    .join(", ");
                button.innerHTML = `
                    <strong>${item.name}</strong>
                    <span>${statLines || `${item.category || item.slot} item`}</span>
                    <small>${item.setId ? `Set: ${item.setId}` : item.category || item.slot}</small>
                `;
                button.addEventListener("mouseenter", () => this.renderStatsComparison(item.id));
                button.addEventListener("focus", () => this.renderStatsComparison(item.id));
                button.addEventListener("click", () => {
                    this.progression.equip(this.activeSlot, item.id);
                    if (this.callbacks.onEquip) {
                        this.callbacks.onEquip(this.activeSlot, item.id);
                    }
                    this.render();
                });
                this.itemsHost.appendChild(button);
            }
        }

        render() {
            for (const button of this.slotButtons) {
                button.classList.toggle("is-selected", button.dataset.slot === this.activeSlot);
            }
            this.renderEquippedSummary();
            this.renderStatsComparison();
            this.renderItems();
        }
    }

    SF.ui.InventoryMenu = InventoryMenu;
})();
