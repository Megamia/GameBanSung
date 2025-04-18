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
  if (gameState === "playing" && !countdown) {
    if (!powerUpInterval) {
      powerUpInterval = setInterval(() => {
        if (gameState === "playing" && !state.weaponSelectWindow) {
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

  powerUps.forEach((powerUp, index) => {
    const dist = Math.sqrt(
      Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)
    );
    if (dist < player.size / 2 + powerUp.size / 2) {
      const existingPowerUp = player.activePowerUps.find(
        (pu) => pu.type === powerUp.type
      );

      if (existingPowerUp) {
        existingPowerUp.timer = 0;
        powerUps.splice(index, 1);
        return;
      } else {
        player.activePowerUps.push({
          type: powerUp.type,
          timer: 0, 
          duration: 15,
        });
        if (powerUp.type === "speedBoost") {
          player.speed += 2;
        } else if (powerUp.type === "moreBullet") {
          player.fireCooldown = 100; 
        } else if (powerUp.type === "unDead") {
          player.isUndead = true; 
        }
      }

      powerUps.splice(index, 1);
    }
  });
}
