import { player } from "../engine/game.js";
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
};

export function shoot() {
  const now = Date.now();

  if (now - player.lastShotTime >= player.fireCooldown) {
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let normalizedDx = dx / distance;
    let normalizedDy = dy / distance;

    // Cập nhật vũ khí của player nếu có sự thay đổi
    if (selectedWeapon) {
      player.weapon = selectedWeapon;
      // selectedWeapon = null; // Đặt lại selectedWeapon để tránh giữ vũ khí cũ
    }

    // Xử lý bắn theo từng loại vũ khí
    if (player.weapon === "normal") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * player.bulletSpeed,
        dy: normalizedDy * player.bulletSpeed,
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "red",
        damage: 1,
      });
    } else if (player.weapon === "5hp") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * player.bulletSpeed,
        dy: normalizedDy * player.bulletSpeed,
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "green",
        damage: 5,
      });
    } else if (player.weapon === "slow") {
      player.bullets.push({
        x: player.x,
        y: player.y,
        dx: normalizedDx * (player.bulletSpeed / 2),
        dy: normalizedDy * (player.bulletSpeed / 2),
        width: player.bulletWidth,
        height: player.bulletHeight,
        color: "blue",
        slow: true,
        damage: 1,
      });
    } else if (player.weapon === "spread") {
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(dy, dx) + (i * Math.PI) / 12;
        const spreadDx = Math.cos(angle);
        const spreadDy = Math.sin(angle);
        player.bullets.push({
          x: player.x,
          y: player.y,
          dx: spreadDx * (player.bulletSpeed / 2),
          dy: spreadDy * (player.bulletSpeed / 2),
          width: player.bulletWidth,
          height: player.bulletHeight,
          color: "yellow",
          damage: 2,
        });
      }
    }
    player.lastShotTime = now;
  }
}
