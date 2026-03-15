(function () {
    const SF = window.ShadowFight;
    const RPGData = SF.entities.RPGData;

    class Weapon {
        constructor(config) {
            Object.assign(this, config);
        }

        static create(id) {
            const item = RPGData.getItem(id);
            if (!item) {
                return null;
            }

            return new Weapon({
                id: item.id,
                name: item.name,
                slot: item.slot,
                category: item.category || "melee",
                damage: item.damage || 0,
                speed: item.speed || 0.4,
                range: item.range || 0,
                cooldown: item.cooldown || item.speed || 0.4,
                manaCost: item.manaCost || 0,
                power: item.power || item.damage || 0,
                color: item.color || "#d8e1e8",
                bonuses: Object.assign({}, item.bonuses)
            });
        }

        static all(slot) {
            return RPGData.getItemsForSlot(slot || "weapon").map((item) => item.id);
        }
    }

    SF.entities.Weapon = Weapon;
})();
