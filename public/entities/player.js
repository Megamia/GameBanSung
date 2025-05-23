import { canvas } from "../engine/canvas.js";

export const createPlayer = () => {
  return {
    x: canvas.width / 1.5,
    y: canvas.height / 1.5,
    size: 20,
    speed: 5,
    color: "blue",
    bullets: [],
    canShoot: true,
    score: 0,
    lives: 3,
    fireCooldown: 20,
    lastShotTime: 0,
    activePowerUps: [],
    weapon: "normal",
    weaponSelect: false,
    weaponDuration: 0,
  };
};
