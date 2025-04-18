import { createPlayer } from "../entities/player.js";
import { botConfig, createBot } from "../entities/bot.js";
import { bossConfig } from "../entities/boss.js";
import { obstacles } from "../entities/obstacles.js";
import { weaponTypes, weapon, shoot } from "../entities/weapon.js";
import { powerUps, handlePowerUps, createPowerUp } from "../entities/power.js";
import { checkCircleRectCollision } from "../utils/collide.js";
import { checkCollision } from "../utils/collision.js";
import { draw } from "./draw.js";
import { canvas, ctx } from "./canvas.js";

export const player = createPlayer();
export const state = {
  weaponSelectWindow: false,
};
let gameState = "start";
let countdown = 3;
let countdownInterval;

shoot();

const startButton = document.createElement("button");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const bosses = [];
let bossActive = false;
let autoShootInterval;
const bots = [];
const numBots = 5;

let botsActive = false;

const weapons = [];

const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function update() {
  if (state.weaponSelectWindow) return;
  let tempX = player.x;
  let tempY = player.y;

  if (keys["a"] || keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["d"] || keys["ArrowRight"]) player.x += player.speed;

  player.x = Math.max(
    player.size / 2,
    Math.min(canvas.width - player.size / 2, player.x)
  );

  for (const obstacle of obstacles) {
    if (
      checkCircleRectCollision(
        { x: player.x, y: tempY, size: player.size },
        obstacle
      )
    ) {
      player.x = tempX;
      break;
    }
  }

  if (keys["w"] || keys["ArrowUp"]) player.y -= player.speed;
  if (keys["s"] || keys["ArrowDown"]) player.y += player.speed;

  player.y = Math.max(
    player.size / 2,
    Math.min(canvas.height - player.size / 2, player.y)
  );

  let collidedY = false;
  for (const obstacle of obstacles) {
    if (
      checkCircleRectCollision(
        { x: player.x, y: player.y, size: player.size },
        obstacle
      )
    ) {
      player.y = tempY;
      collidedY = true;
      break;
    }
  }

  if (gameState === "playing") {
    if (!autoShootInterval) {
      autoShootInterval = setInterval(shoot, 100);
    }
  }
  if (botsActive) {
    bots.forEach((bot) => {
      let dx = player.x - bot.x;
      let dy = player.y - bot.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const moveX = (dx / distance) * (bot.speed || botConfig.speed);
        const moveY = (dy / distance) * (bot.speed || botConfig.speed);

        let newX = bot.x + moveX;
        let newY = bot.y + moveY;

        let collidedX = false;
        let collidedY = false;

        for (const obs of obstacles) {
          if (
            checkCircleRectCollision({ x: newX, y: bot.y, size: bot.size }, obs)
          )
            collidedX = true;
          if (
            checkCircleRectCollision({ x: bot.x, y: newY, size: bot.size }, obs)
          )
            collidedY = true;
        }

        if (!collidedX && !collidedY) {
          bot.x = newX;
          bot.y = newY;
        } else if (!collidedX) {
          bot.x = newX;
        } else if (!collidedY) {
          bot.y = newY;
        } else {
          const slideOffsets = [
            { dx: 0, dy: botConfig.speed },
            { dx: 0, dy: -botConfig.speed },
            { dx: botConfig.speed, dy: 0 },
            { dx: -botConfig.speed, dy: 0 },
          ];

          let moved = false;

          for (const offset of slideOffsets) {
            const testX = bot.x + offset.dx;
            const testY = bot.y + offset.dy;
            let blocked = false;

            for (const obs of obstacles) {
              if (
                checkCircleRectCollision(
                  { x: testX, y: testY, size: bot.size },
                  obs
                )
              ) {
                blocked = true;
                break;
              }
            }

            if (!blocked) {
              bot.x = testX;
              bot.y = testY;
              moved = true;
              break;
            }
          }

          if (!moved) {
            bot.x += (Math.random() - 0.5) * 2;
            bot.y += (Math.random() - 0.5) * 2;
          }
        }
      }
    });
  }
  if (bossActive) {
    bosses.forEach((boss) => {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const moveX = (dx / distance) * bossConfig.speed;
        const moveY = (dy / distance) * bossConfig.speed;

        let newX = boss.x + moveX;
        let newY = boss.y + moveY;

        let collidedX = false;
        let collidedY = false;

        for (const obs of obstacles) {
          if (
            checkCircleRectCollision(
              { x: newX, y: boss.y, size: boss.size },
              obs
            )
          )
            collidedX = true;
          if (
            checkCircleRectCollision(
              { x: boss.x, y: newY, size: boss.size },
              obs
            )
          )
            collidedY = true;
        }

        if (!collidedX && !collidedY) {
          boss.x = newX;
          boss.y = newY;
        } else if (!collidedX) {
          boss.x = newX;
        } else if (!collidedY) {
          boss.y = newY;
        } else {
          const slideOffsets = [
            { dx: 0, dy: bossConfig.speed },
            { dx: 0, dy: -bossConfig.speed },
            { dx: bossConfig.speed, dy: 0 },
            { dx: -bossConfig.speed, dy: 0 },
          ];

          let moved = false;

          for (const offset of slideOffsets) {
            const testX = boss.x + offset.dx;
            const testY = boss.y + offset.dy;
            let blocked = false;

            for (const obs of obstacles) {
              if (
                checkCircleRectCollision(
                  { x: testX, y: testY, size: boss.size },
                  obs
                )
              ) {
                blocked = true;
                break;
              }
            }

            if (!blocked) {
              boss.x = testX;
              boss.y = testY;
              moved = true;
              break;
            }
          }
        }
      }
    });
  }

  player.bullets.forEach((bullet, bulletIndex) => {
    if (gameState === "playing") {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (
        bullet.x < 0 ||
        bullet.x > canvas.width ||
        bullet.y < 0 ||
        bullet.y > canvas.height
      ) {
        player.bullets.splice(bulletIndex, 1);
      } else {
        bots.forEach((currentBot, botIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBot.x, 2) +
              Math.pow(bullet.y - currentBot.y, 2)
          );
          if (dist < currentBot.size / 2) {
            currentBot.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBot.speed = botConfig.speed - 0.5;
              currentBot.color = "#56C6E6";
            }

            if (currentBot.hp <= 0) {
              bots.splice(botIndex, 1);
              player.score += 10;
              if (player.score % 30 === 0) {
                bossActive = true;
                if (bosses.length < 1) {
                  bosses.push({
                    x:
                      Math.random() * (canvas.width - bossConfig.size) +
                      bossConfig.size / 2,
                    y:
                      Math.random() * (canvas.height - bossConfig.size) +
                      bossConfig.size / 2,
                    size: bossConfig.size,
                    color: bossConfig.color,
                    speed: bossConfig.speed,
                    hp: bossConfig.hp,
                  });
                }
              } else {
                bots.push(createBot());
              }
            }
          }
        });

        bosses.forEach((currentBoss, bossIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBoss.x, 2) +
              Math.pow(bullet.y - currentBoss.y, 2)
          );
          if (dist < currentBoss.size / 2) {
            currentBoss.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBoss.speed = bossConfig.speed - 0.5;
              currentBoss.color = "#56C6E6";
            }
            if (currentBoss.hp <= 0) {
              bosses.splice(bossIndex, 1);
              player.score += 100;
              bossActive = false;
              for (let i = 0; i < numBots; i++) {
                bots.push(createBot());
              }
              weapons.length = 0;
              weapons.push({ type: "5hp" });
              weapons.push({ type: "slow" });
              weapons.push({ type: "spread" });
              state.weaponSelectWindow = true;
              player.weaponSelect = true;
              clearInterval(autoShootInterval);
              autoShootInterval = null;
            }
          }
        });

        for (const obstacle of obstacles) {
          if (checkCollision(bullet, obstacle)) {
            player.bullets.splice(bulletIndex, 1);
            return;
          }
        }
      }
    }
  });

  bots.forEach((bot, botIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2)
    );

    if (dist < player.size / 2 + bot.size / 2) {
      if (!player.isUndead) {
        player.lives--;

        if (player.lives <= 0) {
          gameState = "gameOver";
          clearInterval(autoShootInterval);
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          bots.splice(botIndex, 1);
          player.score += 10;
          bots.push(createBot());
        }
      }
    }
  });

  bosses.forEach((currentBoss, bossIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - currentBoss.x, 2) +
        Math.pow(player.y - currentBoss.y, 2)
    );
    if (dist < player.size / 2 + currentBoss.size / 2) {
      if (!player.isUndead) {
        player.lives--;
        if (player.lives <= 0) {
          gameState = "gameOver";
          clearInterval(autoShootInterval);
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          bosses.splice(bossIndex, 1);
        }
      }
    }
  });

  player.activePowerUps.forEach((pu, index) => {
    pu.timer += 1 / 60;

    if (pu.timer >= pu.duration) {
      if (pu.type === "speedBoost") {
        player.speed -= 2;
      } else if (pu.type === "moreBullet") {
        player.fireCooldown = 500;
      } else if (pu.type === "unDead") {
        player.isUndead = false;
      }
      player.activePowerUps.splice(index, 1);
    }
  });
}

function resetGame() {
  player.isUndead = false;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.lives = 3;
  player.score = 0;
  player.bullets = [];
  player.activePowerUps = [];
  gameState = "start";
  startButton.style.display = "block";
  player.weaponSelect = false;
  bossActive = false;
  weapons.length = 0;
  powerUps.length = 0;
  player.speed = 5;
  bosses.length = 0;

  state.weaponSelectWindow = false;
  botsActive = false;

  bots.length = 0;
  for (let i = 0; i < numBots; i++) {
    bots.push(createBot());
  }

  clearInterval(autoShootInterval);
  autoShootInterval = null;

  countdown = 3;
  clearInterval(countdownInterval);
  countdownInterval = null;
}

function startGame() {
  player.isUndead = false;
  gameState = "playing";
  countdown = 3;
  botsActive = false;
  startButton.style.display = "none";
  player.speed = 0;
  player.activePowerUps = [];

  countdownInterval = setInterval(() => {
    if (countdown > 0) {
      countdown--;
    }
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdown = 0;
      player.speed = 5;
      botsActive = true;
      for (let i = 0; i < numBots; i++) {
        bossActive = false;
        bots.push(createBot());
      }
    }
  }, 1000);
}

function drawStartScreen() {
  ctx.fillStyle = "white";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press Start to Play", canvas.width / 2, canvas.height / 2 - 50);
}
function drawGameOverScreen() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Game Over! Your score: " + player.score,
    canvas.width / 2,
    canvas.height / 2 - 50
  );
  ctx.fillText(
    "Press Play Again to restart",
    canvas.width / 2,
    canvas.height / 2 + 50
  );
}

function setupStartButton() {
  startButton.textContent = "Start";
  startButton.style.position = "absolute";
  startButton.style.left = "50%";
  startButton.style.top = "50%";
  startButton.style.transform = "translate(-50%, -50%)";
  startButton.style.padding = "10px 20px";
  startButton.style.fontSize = "20px";
  startButton.style.cursor = "pointer";
  startButton.style.display = "block";

  startButton.addEventListener("click", () => {
    if (gameState === "start") {
      startGame();
    } else if (gameState === "gameOver") {
      resetGame();
      startGame();
    }
  });

  document.body.appendChild(startButton);
}
function gameLoop() {
  requestAnimationFrame(gameLoop);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handlePowerUps(gameState, countdown);
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();

    draw(
      gameState,
      player,
      bots,
      bosses,
      weapons,
      countdown,
      botsActive,
      autoShootInterval
    );
  }
  if (gameState === "playing") {
    update();

    draw(
      gameState,
      player,
      bots,
      bosses,
      weapons,
      countdown,
      botsActive,
      autoShootInterval
    );
  }
}
setupStartButton();

gameLoop();
