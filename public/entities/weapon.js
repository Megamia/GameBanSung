import { player, state } from "../engine/game.js";
import { canvas } from "../engine/canvas.js";
import { selectedWeapon } from "../engine/draw.js";
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

export const weaponTypes = ["5hp", "slow", "spread"];
export const weapon = {
  x: 0,
  y: 0,
  size: 20,
  type: "",
  bulletSpeed: 10,
  bulletWidth: 5,
  bulletHeight: 20,
};

export function shoot() {
  if (state.weaponSelectWindow) {
    return;
  }
  const now = Date.now();

  if (now - player.lastShotTime >= player.fireCooldown) {
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let normalizedDx = dx / distance;
    let normalizedDy = dy / distance;

    if (selectedWeapon && selectedWeapon !== player.weapon) {
      player.weapon = selectedWeapon;
      resetPlayerWeaponStats(); 
    }

    if (player.weapon === "normal") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * weapon.bulletSpeed,
        dy: normalizedDy * weapon.bulletSpeed,
        width: weapon.bulletWidth,
        height: weapon.bulletHeight,
        color: "red",
        damage: 3,
      });
    } else if (player.weapon === "5hp") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * weapon.bulletSpeed,
        dy: normalizedDy * weapon.bulletSpeed,
        width: weapon.bulletWidth,
        height: weapon.bulletHeight,
        color: "green",
        damage: 5,
      });
    } else if (player.weapon === "slow") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * weapon.bulletSpeed,
        dy: normalizedDy * weapon.bulletSpeed,
        width: weapon.bulletWidth,
        height: weapon.bulletHeight,
        color: "blue",
        slow: true,
        damage: 2,
      });
    } else if (player.weapon === "spread") {
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(dy, dx) + (i * Math.PI) / 12;
        const spreadDx = Math.cos(angle);
        const spreadDy = Math.sin(angle);
        player.bullets.push({
          x: player.x,
          y: player.y,
          dx: spreadDx * weapon.bulletSpeed,
          dy: spreadDy * weapon.bulletSpeed,
          width: weapon.bulletWidth,
          height: weapon.bulletHeight,
          color: "yellow",
          damage: 1,
        });
      }
    }
    player.lastShotTime = now;
  }
}
function resetPlayerWeaponStats() {
  if (player.weapon === "5hp") {
    weapon.bulletSpeed = 10;
  } else if (player.weapon === "slow") {
    player.fireCooldown = 50;
    weapon.bulletSpeed = 5;
  } else if (player.weapon === "spread") {
    player.fireCooldown = 100;
    weapon.bulletSpeed = 3;
  }
}
