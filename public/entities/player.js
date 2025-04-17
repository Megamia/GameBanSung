export const createPlayer = (canvas) => {
  return {
    x: canvas.width / 1.5,
    y: canvas.height / 1.5,
    size: 20,
    speed: 5,
    color: "blue",
    bullets: [],
    bulletSpeed: 10,
    bulletWidth: 5,
    bulletHeight: 20,
    canShoot: true,
    score: 0,
    lives: 3,
    fireCooldown: 20, // ms
    lastShotTime: 0,
    activePowerUps: [],
    weapon: "normal",
    weaponSelect: false,
    weaponDuration: 0,
  };
};
