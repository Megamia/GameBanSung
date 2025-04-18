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
let gameState = "start";
let countdown = 3;
let countdownInterval;

shoot();

const startButton = document.createElement("button");
// Mouse position

// Set canvas size
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

export const state = {
  weaponSelectWindow: false,
};

let botsActive = false;

const weapons = [];

// Movement
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

  // Di chuyển theo trục X
  if (keys["a"] || keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["d"] || keys["ArrowRight"]) player.x += player.speed;

  // Giới hạn trong canvas
  player.x = Math.max(
    player.size / 2,
    Math.min(canvas.width - player.size / 2, player.x)
  );

  // Kiểm tra va chạm trục X
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

  // Di chuyển theo trục Y
  if (keys["w"] || keys["ArrowUp"]) player.y -= player.speed;
  if (keys["s"] || keys["ArrowDown"]) player.y += player.speed;

  // Giới hạn trong canvas
  player.y = Math.max(
    player.size / 2,
    Math.min(canvas.height - player.size / 2, player.y)
  );

  // Kiểm tra va chạm trục Y
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

  // Auto shoot chỉ khi không va chạm
  if (gameState === "playing") {
    if (!autoShootInterval) {
      autoShootInterval = setInterval(shoot, 100); // Bắn liên tục
    }
  }
  if (botsActive) {
    // Di chuyển bot (tránh va chạm vật cản và bot khác)
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

        // Kiểm tra va chạm trục X và Y với các vật cản
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
          // Nếu bị chặn hoàn toàn, thử trượt theo các hướng phụ
          const slideOffsets = [
            { dx: 0, dy: botConfig.speed }, // trượt xuống
            { dx: 0, dy: -botConfig.speed }, // trượt lên
            { dx: botConfig.speed, dy: 0 }, // trượt phải
            { dx: -botConfig.speed, dy: 0 }, // trượt trái
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

          // Nếu vẫn bị kẹt hoàn toàn, lắc nhẹ để tìm đường
          if (!moved) {
            bot.x += (Math.random() - 0.5) * 2;
            bot.y += (Math.random() - 0.5) * 2;
          }
        }
      }
    });
  }
  if (bossActive) {
    // Di chuyển boss (tránh va chạm vật cản và boss khác)
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

        // Kiểm tra va chạm trục X và Y với các vật cản
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
          // Nếu bị chặn hoàn toàn, thử trượt theo các hướng phụ
          const slideOffsets = [
            { dx: 0, dy: bossConfig.speed }, // trượt xuống
            { dx: 0, dy: -bossConfig.speed }, // trượt lên
            { dx: bossConfig.speed, dy: 0 }, // trượt phải
            { dx: -bossConfig.speed, dy: 0 }, // trượt trái
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

  // Cập nhật đạn và xử lý va chạm với bot và vật cản
  player.bullets.forEach((bullet, bulletIndex) => {
    if (gameState === "playing") {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      // Loại bỏ đạn ra ngoài màn hình
      if (
        bullet.x < 0 ||
        bullet.x > canvas.width ||
        bullet.y < 0 ||
        bullet.y > canvas.height
      ) {
        player.bullets.splice(bulletIndex, 1);
      } else {
        // Kiểm tra va chạm với bot
        bots.forEach((currentBot, botIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBot.x, 2) +
              Math.pow(bullet.y - currentBot.y, 2)
          );
          if (dist < currentBot.size / 2) {
            currentBot.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBot.speed = 1;
              currentBot.color = "#56C6E6";
            }

            if (currentBot.hp <= 0) {
              bots.splice(botIndex, 1);
              player.score += 10;
              if (player.score % 30 === 0) {
                bossActive = true;
                bosses.push({
                  x:
                    Math.random() * (canvas.width - bossConfig.size) +
                    bossConfig.size / 2,
                  y:
                    Math.random() * (canvas.height - bossConfig.size) +
                    bossConfig.size / 2,
                  size: bossConfig.size,
                  color: bossConfig.color,
                  speed: bossConfig.speed, // Add speed property
                  hp: 10,
                });
              } else {
                bots.push(createBot());
              }
            }
          }
        });

        // Kiểm tra va chạm với boss
        bosses.forEach((currentBoss, bossIndex) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - currentBoss.x, 2) +
              Math.pow(bullet.y - currentBoss.y, 2)
          );
          if (dist < currentBoss.size / 2) {
            currentBoss.hp -= bullet.damage || 1;
            player.bullets.splice(bulletIndex, 1);
            if (bullet.slow) {
              currentBoss.speed = 1;
              currentBoss.color = "#56C6E6";
            }
            if (currentBoss.hp <= 0) {
              bosses.splice(bossIndex, 1);
              player.score += 100;
              // Mở cửa sổ chọn vũ khí
              weapons.length = 0; // Xóa các vũ khí cũ
              weapons.push({ type: "5hp" }); // Thêm vũ khí mới
              weapons.push({ type: "slow" });
              weapons.push({ type: "spread" });
              state.weaponSelectWindow = true;
              player.weaponSelect = true;
              clearInterval(autoShootInterval);
              autoShootInterval = null;
              bossActive = false;
            }
          }
        });

        // Kiểm tra va chạm đạn với vật cản
        for (const obstacle of obstacles) {
          if (checkCollision(bullet, obstacle)) {
            player.bullets.splice(bulletIndex, 1); // Xóa đạn khi va chạm vật cản
            return;
          }
        }
      }
    }
  });

  // Kiểm tra va chạm giữa player và bot
  bots.forEach((bot, botIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2)
    );

    if (dist < player.size / 2 + bot.size / 2) {
      if (!player.isUndead) {
        // Nếu không phải undead mới trừ mạng
        player.lives--; // Giảm số mạng của người chơi

        if (player.lives <= 0) {
          gameState = "gameOver"; // Đặt trạng thái game là "gameOver"
          clearInterval(autoShootInterval); // Dừng auto shoot nếu có
          autoShootInterval = null;
          alert("Điểm của bạn: " + player.score);
          resetGame();
        } else {
          // Nếu còn mạng, xóa bot và tạo bot mới
          bots.splice(botIndex, 1);
          player.score += 10; // Cộng điểm cho player
          bots.push(createBot()); // Thêm bot mới
        }
      }
    }
  });

  // Kiểm tra va chạm giữa player và bot
  bosses.forEach((currentBoss, bossIndex) => {
    const dist = Math.sqrt(
      Math.pow(player.x - currentBoss.x, 2) +
        Math.pow(player.y - currentBoss.y, 2)
    );
    if (dist < player.size / 2 + currentBoss.size / 2) {
      if (!player.isUndead) {
        player.lives--; // Giảm số mạng của người chơi
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

  // if (selectedWeapon) {
  //   player.weapon = weapons;
  //   if (player.weaponSelect) {
  //     player.weaponSelect = false;
  //     player.weaponDuration = 0;
  //     selectedWeapon = null;
  //     setTimeout(() => {
  //       player.weapon = "normal";
  //     }, 10000);
  //   }
  // }

  // Power-up timer update and effect removal
  player.activePowerUps.forEach((pu, index) => {
    pu.timer += 1 / 60; // Tăng theo mỗi frame (60 FPS)

    if (pu.timer >= pu.duration) {
      // Hết thời gian power-up
      if (pu.type === "speedBoost") {
        player.speed -= 2; // Giảm tốc độ khi hết thời gian power-up
      } else if (pu.type === "moreBullet") {
        player.fireCooldown = 500; // Quay lại cooldown bình thường
      }
      // Nếu power-up là undead, cần phục hồi lại tình trạng sống
      else if (pu.type === "unDead") {
        player.isUndead = false;
      }
      // Loại bỏ power-up đã hết hạn
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
  // clearInterval(powerUpInterval);
  // powerUpInterval = null;
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
  player.isUndead = true;
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
      // selectedWeapon,
      countdown,
      botsActive,
      shoot,
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
      // selectedWeapon,
      countdown,
      botsActive,
      shoot,
      autoShootInterval
    );
  }
}
setupStartButton();

gameLoop();
