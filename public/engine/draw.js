import { obstacles } from "../entities/obstacles.js";
import { powerUps } from "../entities/power.js";
import { state } from "./game.js";
import { canvas, ctx } from "./canvas.js";
import { shoot } from "../entities/weapon.js";

export let selectedWeapon = "";


export function draw(
  gameState,
  player,
  bots,
  bosses,
  weapons,
  countdown,
  botsActive,
  autoShootInterval
) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  obstacles.forEach((obstacle) => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + player.score, 100, 30);

  ctx.fillStyle = "white";
  ctx.fillText("Lives: " + player.lives, 100, 60);

  powerUps.forEach((powerUp) => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    if (powerUp.type === "unDead") {
      ctx.fillText("UD", powerUp.x, powerUp.y + 3);
    } else if (powerUp.type === "speedBoost") {
      ctx.fillText("SB", powerUp.x, powerUp.y + 3);
    } else if (powerUp.type === "moreBullet")
      ctx.fillText("MB", powerUp.x, powerUp.y + 3);
  });

  if (state.weaponSelectWindow && weapons.length > 0) {
    const weaponButtonWidth = 80;
    const weaponButtonHeight = 30;
    const weaponButtonSpacing = 10;
    const startX =
      canvas.width / 2 -
      (weaponButtonWidth * weapons.length +
        weaponButtonSpacing * (weapons.length - 1)) /
        2;
    const startY = canvas.height / 2 + 40;
    weapons.forEach((weapon, index) => {
      const buttonX =
        startX + index * (weaponButtonWidth + weaponButtonSpacing);
      const buttonY = startY;
      ctx.fillStyle = "orange";
      ctx.fillRect(buttonX, buttonY, weaponButtonWidth, weaponButtonHeight);
      ctx.fillStyle = "black";
      ctx.font = "15px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        weapon.type,
        buttonX + weaponButtonWidth / 2,
        buttonY + weaponButtonHeight / 2 + 5
      );
      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (
          mouseX >= buttonX &&
          mouseX <= buttonX + weaponButtonWidth &&
          mouseY >= buttonY &&
          mouseY <= buttonY + weaponButtonHeight
        ) {
          selectedWeapon = weapon.type;

          state.weaponSelectWindow = false;
          player.speed = 5;
          botsActive = true;
          autoShootInterval = setInterval(shoot, 100);
        }
      });
    });
  }

  let barY = 100; 
  const barHeight = 10;
  const barWidth = 100;
  const barSpacing = 15; 

  for (const pu of player.activePowerUps) {
    ctx.fillStyle = "white";
    ctx.fillRect(250, barY, barWidth, barHeight);

    ctx.fillStyle = "green";
    const currentBarWidth = (pu.timer / pu.duration) * barWidth;
    ctx.fillRect(250, barY, currentBarWidth, barHeight);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "start";
    ctx.fillText(pu.type, 100, barY + barHeight / 2 + 7);

    barY += barHeight + barSpacing;
  }

  if (gameState === "start" || (gameState === "playing" && countdown > 0)) {
    ctx.font = "200px Arial";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2 + 50);
  }

  player.bullets.forEach((bullet) => {
    ctx.save();

    ctx.translate(bullet.x, bullet.y);

    const angle = Math.atan2(bullet.dy, bullet.dx);
    ctx.rotate(angle + Math.PI / 2); 

    ctx.fillStyle = bullet.color;
    ctx.fillRect(
      -bullet.width / 2,
      -bullet.height / 2,
      bullet.width,
      bullet.height
    );

    ctx.restore();
  });

  bots.forEach((bot) => {
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  bosses.forEach((currentBoss) => {
    ctx.fillStyle = currentBoss.color;
    ctx.beginPath();
    ctx.arc(currentBoss.x, currentBoss.y, currentBoss.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}
