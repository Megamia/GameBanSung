import { player } from "../entities/player.js";

const canvas = document.getElementById("gameCanvas");

export const powerUps = [];
export const powerUpTypes = ["unDead", "speedBoost", "moreBullet"];

export function createPowerUp() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 20,
    type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
  };
}

export function handlePowerUps(
  gameState,
  countdown,
  powerUpInterval,
  weaponSelectWindow
) {
  // Kiểm tra và cập nhật power-up interval
  if (gameState === "playing" && !countdown) {
    if (!powerUpInterval) {
      powerUpInterval = setInterval(() => {
        if (gameState === "playing" && !weaponSelectWindow) {
          const newPowerUp = createPowerUp();
          powerUps.push(newPowerUp);
        }
      }, 1000);
    }
  } else {
    if (powerUpInterval) {
      clearInterval(powerUpInterval);
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
      const existingPowerUpIndex = player.activePowerUps.findIndex(
        (pu) => pu.type === powerUp.type
      );

      if (existingPowerUpIndex !== -1) {
        // Reset timer nếu power-up đã tồn tại
        player.activePowerUps[existingPowerUpIndex].timer = 0;
      } else {
        // Thêm mới power-up vào danh sách activePowerUps
        player.activePowerUps.push({
          type: powerUp.type,
          timer: 0,
          duration: 300, // Thời gian tồn tại của power-up (giây)
        });

        // Áp dụng các hiệu ứng của power-up cho người chơi
        if (powerUp.type === "speedBoost") {
          player.speed += 2;
        } else if (powerUp.type === "moreBullet") {
          player.fireCooldown = 100;
        } else if (powerUp.type === "unDead") {
          player.isUndead = true;
        }
      }

      // Xóa power-up sau khi thu thập
      powerUps.splice(index, 1);
    }
  });
}
