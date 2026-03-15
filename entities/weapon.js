(function () {
    const SF = window.ShadowFight;

    const LIBRARY = {
        sword: {
            id: "sword",
            name: "Sword",
            damage: 18,
            speed: 0.46,
            range: 118,
            staminaCost: 18,
            color: "#d8e1e8"
        },
        staff: {
            id: "staff",
            name: "Staff",
            damage: 15,
            speed: 0.38,
            range: 150,
            staminaCost: 16,
            color: "#d5b181"
        },
        nunchaku: {
            id: "nunchaku",
            name: "Nunchaku",
            damage: 13,
            speed: 0.3,
            range: 94,
            staminaCost: 14,
            color: "#b8cad8"
        }
    };

    class Weapon {
        constructor(config) {
            Object.assign(this, config);
        }

        static create(id) {
            return new Weapon(LIBRARY[id]);
        }

        static all() {
            return Object.keys(LIBRARY);
        }
    }

    SF.entities.Weapon = Weapon;
})();
