import { state, player } from "../engine/game.js";
import { canvas } from "../engine/canvas.js";

export const powerUps = [];
export const powerUpTypes = ["unDead", "speedBoost", "moreBullet"];
export let powerUpInterval = null;
export function createPowerUp() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20,
    type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
  };
}

export function handlePowerUps(gameState, countdown) {
  // Kiểm tra và cập nhật power-up interval
  if (gameState === "playing" && !countdown) {
    if (!powerUpInterval) {
      powerUpInterval = setInterval(() => {
        if (gameState === "playing" && !state.weaponSelectWindow) {
          const newPowerUp = createPowerUp();
          powerUps.push(newPowerUp); // Tạo power-up mới
        }
      }, 1000); // Tạo power-up mỗi giây
    }
  } else {
    if (powerUpInterval) {
      clearInterval(powerUpInterval); // Dừng tạo power-up nếu không chơi
      powerUpInterval = null;
    }
  }

  // Kiểm tra và thu thập power-ups
  powerUps.forEach((powerUp, index) => {
    const dist = Math.sqrt(
      Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)
    );
    if (dist < player.size / 2 + powerUp.size / 2) {
      // Kiểm tra nếu power-up đã tồn tại trong danh sách activePowerUps
      const existingPowerUp = player.activePowerUps.find(
        (pu) => pu.type === powerUp.type
      );

      if (existingPowerUp) {
        // Nếu power-up đã tồn tại, reset timer và không thêm mới
        existingPowerUp.timer = 0;
        powerUps.splice(index, 1);
        return;
      } else {
        // Thêm mới power-up vào danh sách activePowerUps
        player.activePowerUps.push({
          type: powerUp.type,
          timer: 0, // Khởi tạo timer
          duration: 300, // Thời gian tồn tại của power-up (giây)
        });
        // Áp dụng các hiệu ứng của power-up cho người chơi
        if (powerUp.type === "speedBoost") {
          player.speed += 2; // Tăng tốc độ
        } else if (powerUp.type === "moreBullet") {
          player.fireCooldown = 100; // Giảm thời gian cooldown bắn
        } else if (powerUp.type === "unDead") {
          player.isUndead = true; // Cho phép không chết
        }
      }

      // Xóa power-up sau khi thu thập
      powerUps.splice(index, 1);
    }
  });
}
